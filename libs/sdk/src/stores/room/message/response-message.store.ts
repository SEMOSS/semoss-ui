import { getErrorMessage } from "@semoss/utility/error";
import {
	chatPixels,
	type PlaygroundTurnParams,
} from "../../../api/chat-pixels";
import { download } from "../../../api/file";
import { runMcpTool } from "../../../api/mcp";
import { batchChanges } from "../observable-store";
import {
	MCP_EXECUTION_AUTO,
	TURN_CANCELLATION_PROMPT,
} from "../room.constants";
import type { InputPixelMessage, ResponsePixelMessage } from "../room.types";
import type { RoomEngine } from "../room-engine.store";
import { getToolEngineId } from "../room-tool-meta";
import type { ToolCallStore } from "../tool-call.store";
import { AbstractMessageStore } from "./abstract-message.store";
import { runAgentMessage } from "./agent-harness";
import { InputMessageStore } from "./input-message.store";
import { type CancelCommitOutput, spliceHiddenMessages } from "./message-tree";
import { applyResponseStreamChunk } from "./response-stream";
import { ToolSaveController } from "./tool-save-controller";

/** A response part, as the message keeps it. */
type ResponsePart = ResponsePixelMessage["parts"][number];

/**
 * A model response: its parts as they stream in, the tool calls it made and
 * the loop that runs them, its feedback, and how it continues the turn.
 */
export class ResponseMessageStore extends AbstractMessageStore {
	readonly type = "OUTPUT";

	/** The message's parts, replaced on every change. */
	parts: ResponsePixelMessage["parts"] = [];

	/** Whether the model is still thinking, before anything shows. */
	isThinking = false;

	/**
	 * Serializes and coalesces this response's tool-result writes, and owns
	 * the tool-phase stop.
	 */
	private readonly toolSaves: ToolSaveController;

	/** The response the tool results of this one continue in. */
	toolResponseMessage: ResponseMessageStore | null = null;

	/** The user's rating; only for messages the model wrote. */
	feedback: {
		/** Sentiment. */
		rating: boolean;
		/** Comment, unused for now. */
		feedbackText: string;
	} | null = null;

	/** The model the message ran on. */
	model: {
		/** Id of the model. */
		id: string;
		/** Name of the model. */
		name: string;
	} = {
		id: "",
		name: "",
	};

	/** Whether the conversation above this message was compacted. */
	conversationCompactedAbove = false;

	/** Whether the conversation is being compacted into this message. */
	isCompacting = false;

	/** Whether results of its tool calls are waiting to be, or being, saved. */
	isSavingTools = false;

	/**
	 * @param room - The room it belongs to.
	 * @param message - The message as the backend stores it.
	 */
	constructor(room: RoomEngine, message: ResponsePixelMessage) {
		super(room, message);
		this.toolSaves = new ToolSaveController(this);

		// if prune, compaction happened
		this.conversationCompactedAbove ||= message.pruneToolsAbove;

		this.sync(message);
		this.observeMessageFields<ResponseMessageStore>([
			"parts",
			"isThinking",
			"toolResponseMessage",
			"feedback",
			"model",
			"conversationCompactedAbove",
			"isCompacting",
			"isSavingTools",
		]);
	}

	/**
	 * Take the message's state from the stored message, including the tool
	 * calls and results it carries.
	 *
	 * @param message - The message as the backend stores it.
	 */
	sync(message: ResponsePixelMessage): void {
		batchChanges(() => {
			super.sync(message);
			this.id = message.messageId;
			this.parts = message.parts;

			// server tools (e.g. provider-side web_search) deliver both the call
			// and its result in the same response
			for (const part of message.parts) {
				if (part.type === "TOOL_CALL") {
					this.room.syncTool(part.toolCall.id, this, part);
				} else if (part.type === "TOOL_RESULT") {
					this.room.syncTool(part.toolResult.toolCallId, this, part);
				}
			}

			this.tokens = message.tokens;
			this.model = {
				id: message.modelId,
				name: message.ornaments?.modelName || "AI",
			};
			if (message.feedback) {
				this.feedback = {
					rating: message.feedback.rating,
					feedbackText: message.feedback.feedbackText,
				};
			}
		});
	}

	/**
	 * Execute a user message and stream the response into a placeholder.
	 * Once it settles, the tool calls it made start running.
	 *
	 * @param inputMessage - The user's message.
	 * @param existingResponse - A placeholder already in the tree to stream
	 * into; when given, the messages are not added again.
	 */
	runMessage = async (
		inputMessage: InputMessageStore,
		existingResponse?: ResponseMessageStore,
	): Promise<void> => {
		const room = this.room;

		// in agent mode the message runs server-side through RunAgent
		if (room.mode === "agent") {
			await runAgentMessage(this, inputMessage, existingResponse);
			return;
		}

		const responseMessage =
			existingResponse ?? room.createResponsePlaceholder();

		try {
			// the room's instructions, with the host's context for this turn
			const context = room.instructionsForTurn;

			if (!existingResponse) {
				this.addChild(inputMessage);
				inputMessage.addChild(responseMessage);
			}

			responseMessage.isThinking = true;

			const text = inputMessage.parts.reduce(
				(acc, part) => (part.type === "TEXT" ? acc + part.text : acc),
				"",
			);
			const media = inputMessage.parts.reduce<string[]>((acc, part) => {
				if (part.type === "MEDIA" && part.mediaInfo.fileLocation) {
					acc.push(part.mediaInfo.fileLocation);
				}
				return acc;
			}, []);

			// per-stream map from tool delta `index` to wire `id`
			const toolStreamIndexToId: Record<number, string> = {};

			// On a stop, recordCancelledTurn replays exactly these params. The
			// client tools ride along in paramValues: the backend merges them
			// with the room's own and the client runs them.
			const turn: PlaygroundTurnParams = {
				engine: room.model.engine_id,
				roomId: room.roomId,
				command: text,
				context: context,
				media: media,
				parentMessageId: this.id,
				paramValues: room.turnParamValues(),
			};

			await room.runRoomPixelStreaming<
				[
					{
						inputMessage: InputPixelMessage;
						responseMessage: ResponsePixelMessage;
					},
				]
			>(chatPixels.ask(turn), {
				onEmit: (chunk) => {
					batchChanges(() =>
						applyResponseStreamChunk(
							responseMessage,
							toolStreamIndexToId,
							chunk,
						),
					);
				},
				onResult: ({ results }) => {
					const { output } = results[0];
					inputMessage.sync(output.inputMessage);
					responseMessage.sync(output.responseMessage);
					responseMessage.continueToolExecution();
				},
				// the user stopped the stream: persist what they saw
				onCancel: () =>
					this.recordCancelledTurn(
						turn,
						inputMessage,
						responseMessage,
					),
			});
		} catch (e) {
			this.removeChild(inputMessage);
			throw e;
		} finally {
			responseMessage.isThinking = false;
		}
	};

	/**
	 * Commit a stopped turn. Cancelling the stream leaves nothing persisted,
	 * so the turn's exact params are replayed carrying `responseParts` (what
	 * the user saw) and a hidden note; the backend skips the model, persists
	 * the turn, and appends a hidden pair telling the model next turn that it
	 * was cut short. The hidden pair joins the tree so the next message's
	 * parent stays aligned with the backend's history.
	 */
	private recordCancelledTurn = async (
		turn: PlaygroundTurnParams,
		inputMessage: InputMessageStore,
		responseMessage: ResponseMessageStore,
	): Promise<void> => {
		const room = this.room;
		try {
			const response = await room.runRoomPixel<[CancelCommitOutput]>(
				chatPixels.ask(turn, {
					responseParts: responseMessage.parts,
					hiddenMessage: TURN_CANCELLATION_PROMPT,
				}),
			);
			const { output } = response.pixelReturn[0];
			inputMessage.sync(output.inputMessage);
			responseMessage.sync(output.responseMessage);
			spliceHiddenMessages(responseMessage, output.extraMessages);
		} catch (e) {
			// rethrown so the stop surfaces it as a room error: the user's only
			// signal that the stopped turn did not persist
			console.error("Failed to record cancelled turn", e);
			throw e;
		}
	};

	/**
	 * Hard-stop the tool phase — see {@link ToolSaveController.cancelPending}.
	 * Called by the room when the user stops with tool calls outstanding.
	 */
	cancelPendingTools = (): Promise<void> => this.toolSaves.cancelPending();

	/**
	 * Add a part while streaming. Text and reasoning join the last part when
	 * it is of the same kind; anything else is a new part.
	 *
	 * @param part - The part to add.
	 */
	savePart = (part: ResponsePart): void => {
		const lastPart = this.parts[this.parts.length - 1];
		if (part.type === "TEXT" && lastPart?.type === "TEXT") {
			this.parts = [
				...this.parts.slice(0, -1),
				{
					...lastPart,
					text: lastPart.text + part.text,
					uiText: lastPart.uiText + part.uiText,
				},
			];
			return;
		}
		if (part.type === "THINKING" && lastPart?.type === "THINKING") {
			this.parts = [
				...this.parts.slice(0, -1),
				{ ...lastPart, thinking: lastPart.thinking + part.thinking },
			];
			return;
		}
		if (part.type === "TEXT" || part.type === "THINKING") {
			this.parts = [...this.parts, part];
		}
	};

	/**
	 * Add a part as it is, such as a tool call or a subagent.
	 *
	 * @param part - The part to add.
	 */
	appendPart = (part: ResponsePart): void => {
		this.parts = [...this.parts, part];
	};

	/**
	 * Replace the parts matching `match` with what `update` makes of them.
	 *
	 * @param match - Picks the parts to change.
	 * @param update - The changed part.
	 */
	updateParts = (
		match: (part: ResponsePart) => boolean,
		update: (part: ResponsePart) => ResponsePart,
	): void => {
		let changed = false;
		const next = this.parts.map((part) => {
			if (!match(part)) {
				return part;
			}
			changed = true;
			return update(part);
		});
		if (changed) {
			this.parts = next;
		}
	};

	/**
	 * Mark whether the conversation above this message was compacted.
	 *
	 * @param compacted - Whether it was.
	 */
	setConversationCompactedAbove = (compacted: boolean): void => {
		this.conversationCompactedAbove = compacted;
	};

	/**
	 * Mark whether the conversation is being compacted into this message.
	 *
	 * @param compacting - Whether it is.
	 */
	setIsCompacting = (compacting: boolean): void => {
		this.isCompacting = compacting;
	};

	/**
	 * Rate the response.
	 *
	 * @param rating - Thumbs up or down; null clears the rating.
	 * @param feedbackText - An optional note.
	 */
	recordFeedback = async (
		rating: boolean | null,
		feedbackText = "",
	): Promise<void> => {
		const room = this.room;
		await room.runRoomPixel<[boolean]>(
			chatPixels.submitFeedback({
				roomId: room.roomId,
				messageId: this.id,
				rating: rating,
				feedbackText: feedbackText,
			}),
			false,
		);
		this.feedback =
			rating === null
				? null
				: { rating: rating, feedbackText: feedbackText };
	};

	/**
	 * Download the response's text as a Word or PDF document, made in and
	 * downloaded from the room's insight.
	 *
	 * @param format - Word or PDF.
	 */
	downloadResponse = async (format: "word" | "pdf"): Promise<void> => {
		const text = this.parts
			.filter((part) => part.type === "TEXT")
			.map((part) => part.text)
			.join("");
		if (!text) {
			throw new Error("No content to download");
		}
		if (format !== "word" && format !== "pdf") {
			throw new Error(`Unsupported format: ${format}`);
		}

		const response = await this.room.runRoomPixel<[string]>(
			chatPixels.exportMarkdown({
				markdown: text,
				fileName: `${this.room.config.appName || "Chat"} Response Export`,
				format: format,
			}),
			false,
		);
		const first = response.pixelReturn[0];
		if (!first) {
			throw new Error("No response received from server");
		}
		if (!first.operationType?.includes("FILE_DOWNLOAD")) {
			throw new Error(`Failed to generate ${format.toUpperCase()} file`);
		}
		await download(this.room.insightId, first.output);
	};

	/** Rewrite the user turn this response answered, as a new sibling. */
	rewriteMessage = async (): Promise<void> => {
		const room = this.room;
		const parentMessage = this.parent;
		if (!(parentMessage instanceof InputMessageStore)) {
			throw new Error("Can only rewrite response to user messages");
		}
		const grandParentMessage = parentMessage.parent;
		if (!(grandParentMessage instanceof ResponseMessageStore)) {
			throw new Error(
				"Can only rewrite if the parent is a response message",
			);
		}

		const rewrittenMessage = new InputMessageStore(room, {
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: "REWRITE_PLACEHOLDER_ID",
			visible: true,
			platform_generated: true,
			modelId: room.model.engine_id,
			modelType: room.model.engine_type,
			dateCreated: new Date().toISOString(),
			parts: parentMessage.parts,
			tokens: parentMessage.tokens,
			ornaments: {
				modelName:
					room.model.engine_display_name ||
					room.model.engine_name ||
					"",
			},
			pruneToolsAbove: false,
		});

		// a new turn starts without the last one's error
		room.setError(null);
		await room.updateRoomOptions(room.options);
		void grandParentMessage.runMessage(rewrittenMessage);
	};

	/**
	 * Whether the message has anything worth rendering — non-whitespace text,
	 * media, or a tool call.
	 */
	get hasVisibleContent(): boolean {
		return this.parts.some(
			(part) =>
				(part.type === "TEXT" &&
					part.text.replace(/[\s­​-‍⁠]/g, "").length > 0) ||
				part.type === "MEDIA" ||
				part.type === "TOOL_CALL",
		);
	}

	/** Whether this response made any tool calls, finished or not. */
	get hasTools(): boolean {
		return this.parts.some((part) => part.type === "TOOL_CALL");
	}

	/**
	 * Whether this response folds up into the one before it instead of
	 * rendering as its own block: it made tool calls and has nothing else
	 * worth showing on its own.
	 */
	get shouldFoldUp(): boolean {
		return (
			this.hasTools &&
			!this.parts.some(
				(part) =>
					(part.type === "TEXT" && part.text.length > 0) ||
					(part.type === "THINKING" && part.thinking.length > 0) ||
					part.type === "MEDIA" ||
					part.type === "SUBAGENT",
			)
		);
	}

	/** Whether any of its tool calls has not finished. */
	get hasUnfinishedTools(): boolean {
		return this.parts.some((part) => {
			if (part.type !== "TOOL_CALL") {
				return false;
			}
			const tool = this.room.getTool(part.toolCall.id);
			return tool?.status === "LOADING" || tool?.status === "INITIAL";
		});
	}

	/**
	 * Start the tool calls that run on their own, up to the room's limit on
	 * calls running at once.
	 */
	continueToolExecution = (): void => {
		// a stop halts the loop while its streams unwind
		if (this.room.isCancelling) {
			return;
		}

		let numRunningTools = 0;
		const toolsToRun: ToolCallStore[] = [];
		for (const part of this.parts) {
			if (part.type !== "TOOL_CALL") {
				continue;
			}
			const tool = this.room.getTool(part.toolCall.id);
			if (
				!tool ||
				tool.json._meta?.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO
			) {
				continue;
			}
			if (tool.status === "INITIAL") {
				toolsToRun.push(tool);
			} else if (tool.status === "LOADING") {
				numRunningTools++;
			}
		}

		// a false-y limit means five
		const toolLimit = this.room.config.toolAutoExecutionLimit || 5;
		const numToolsToRun = toolLimit - numRunningTools;
		if (numToolsToRun > 0) {
			for (const tool of toolsToRun.slice(0, numToolsToRun)) {
				void this.runToolExecution(tool);
			}
		}
	};

	/** Run one tool call: a client tool here, any other through RunMCPTool. */
	private runToolExecution = async (tool: ToolCallStore): Promise<void> => {
		if (
			tool.status !== "INITIAL" ||
			tool.json._meta?.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO
		) {
			return;
		}

		// client tools run here and record their own result
		if (this.room.chatTools.canRun(tool)) {
			await this.room.chatTools.runChatTool(tool);
			return;
		}

		try {
			await this.runMcpToolCall(tool);
		} catch {
			// a failed save is handled by saveToolExecution, which records the
			// error as the call's result
		}
	};

	/**
	 * Run an MCP tool call against the room's insight and save what it
	 * returned as the call's response. A failed run saves its error instead,
	 * so the model reads why.
	 *
	 * @param tool - A call that has not run yet.
	 * @throws When the response cannot be saved.
	 */
	runMcpToolCall = async (tool: ToolCallStore): Promise<void> => {
		tool.status = "LOADING";

		let output = "";
		let toolError = false;
		try {
			output = await runMcpTool(
				{
					project: getToolEngineId(tool.json._meta),
					roomId: this.room.roomId,
					name: tool.json.name,
					paramValues: tool.parameters,
				},
				this.room.insightId,
			);
		} catch (e) {
			output = getErrorMessage(e);
			toolError = true;
		}

		await this.saveToolExecution(
			tool,
			output,
			toolError ? "error" : "success",
			tool.parameters,
		);
	};

	/**
	 * Queue a tool result to be written to the room's history — see
	 * {@link ToolSaveController}, which serializes and coalesces the writes
	 * and streams the final, model-invoking one. Resolves when the batch
	 * carrying this result settles.
	 */
	saveToolExecution = (
		tool: ToolCallStore,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
		executedParameters: Record<string, unknown> = {},
		errorDuringSaving = false,
	): Promise<void> =>
		this.toolSaves.save(
			tool,
			toolResponse,
			toolStatus,
			executedParameters,
			errorDuringSaving,
		);
}
