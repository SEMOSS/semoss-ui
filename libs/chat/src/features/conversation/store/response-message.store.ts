import { getI18n } from "@semoss/i18n";
import { download, runMcpTool } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import type { InputPixelMessage, ResponsePixelMessage } from "../../../types";
import type { RoomStore } from "../../room/store/room.store";
import { isFolderToolCall } from "../../tools/default-tools/chat-tool-kind";
import {
	MCP_EXECUTION_AUTO,
	STREAMING_PLACEHOLDER_ID,
	TURN_CANCELLATION_PROMPT,
} from "../../tools/mcp/mcp-constants";
import { getToolEngineId } from "../../tools/mcp/mcp-utils";
import {
	AbstractMessageStore,
	initialMessageSnapshot,
	type MessageSnapshot,
} from "./abstract-message.store";
import { runAgentMessage } from "./agent-harness";
import { InputMessageStore } from "./input-message.store";
import { type CancelCommitOutput, spliceHiddenMessages } from "./message-tree";
import { applyResponseStreamChunk } from "./response-stream";
import type { ToolStore } from "./tool.store";
import { ToolSaveController } from "./tool-save-controller";

/** The user's rating of a response. */
export interface ResponseFeedback {
	/** True for thumbs up, false for thumbs down. */
	readonly rating: boolean;
	/** A comment; unused for now. */
	readonly feedbackText: string;
}

/** What a response holds. */
export interface ResponseMessageSnapshot extends MessageSnapshot {
	/** What the model said: text, reasoning, tool calls, and subagents. */
	readonly parts: ResponsePixelMessage["parts"];
	/** Whether the model is still working on it. */
	readonly isThinking: boolean;
	/** The model's reply to this response's tool results, while it streams. */
	readonly toolResponseMessage: ResponseMessageStore | null;
	/** The user's rating; only for messages the model wrote. */
	readonly feedback: ResponseFeedback | null;
	/** The model that wrote it. */
	readonly model: { readonly id: string; readonly name: string };
	/** Whether the conversation above it is compacted. */
	readonly conversationCompactedAbove: boolean;
	/** Whether its conversation is being compacted now. */
	readonly isCompacting: boolean;
}

/** A response from the model. */
export class ResponseMessageStore extends AbstractMessageStore<ResponseMessageSnapshot> {
	/** Tells a response from an input message. */
	readonly type = "OUTPUT";

	/**
	 * Serializes and coalesces this response's tool-result writes (and owns the
	 * tool-phase stop). Extracted for size; see {@link ToolSaveController}.
	 */
	private readonly toolSaves = new ToolSaveController(this);

	/**
	 * @param room - The room the message is in.
	 * @param message - The pixel message.
	 */
	constructor(room: RoomStore, message: ResponsePixelMessage) {
		super(room, {
			...initialMessageSnapshot(message),
			parts: [],
			isThinking: false,
			toolResponseMessage: null,
			feedback: null,
			model: { id: "", name: "" },
			// a prune means the conversation above was compacted
			conversationCompactedAbove: !!message.pruneToolsAbove,
			isCompacting: false,
		});
		this.sync(message);
	}

	/** Whether the model is still working on it. */
	get isThinking(): boolean {
		return this.getSnapshot().isThinking;
	}

	/** The model's reply to this response's tool results, while it streams. */
	get toolResponseMessage(): ResponseMessageStore | null {
		return this.getSnapshot().toolResponseMessage;
	}

	/** The user's rating; only for messages the model wrote. */
	get feedback(): ResponseFeedback | null {
		return this.getSnapshot().feedback;
	}

	/** The model that wrote it. */
	get model(): ResponseMessageSnapshot["model"] {
		return this.getSnapshot().model;
	}

	/** Whether the conversation above it is compacted. */
	get conversationCompactedAbove(): boolean {
		return this.getSnapshot().conversationCompactedAbove;
	}

	/** Whether its conversation is being compacted now. */
	get isCompacting(): boolean {
		return this.getSnapshot().isCompacting;
	}

	/**
	 * Take the backend's copy of the message, and the tool calls it holds.
	 * Server tools (provider-side, e.g. web_search) bring their call and their
	 * result in the same response, so both part types sync.
	 *
	 * @param message - The pixel message.
	 */
	sync(message: ResponsePixelMessage): void {
		super.sync(message);
		this.state.update((current) => ({
			id: message.messageId,
			parts: message.parts,
			tokens: message.tokens,
			model: {
				id: message.modelId,
				name: message.ornaments?.modelName || "AI",
			},
			feedback: message.feedback
				? {
						rating: message.feedback.rating,
						feedbackText: message.feedback.feedbackText,
					}
				: current.feedback,
		}));
		message.parts.forEach((part) => {
			if (part.type === "TOOL_CALL") {
				this.room.syncTool(part.toolCall.id, this, part);
			} else if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		});
	}

	/**
	 * Mark the model as working on the response, or done.
	 *
	 * @param isThinking - Whether it is working.
	 */
	setIsThinking = (isThinking: boolean): void => {
		this.state.update({ isThinking });
	};

	/**
	 * Set the model's reply to this response's tool results, while it streams.
	 *
	 * @param toolResponseMessage - The reply, or null once it is in the tree.
	 */
	setToolResponseMessage = (
		toolResponseMessage: ResponseMessageStore | null,
	): void => {
		this.state.update({ toolResponseMessage });
	};

	/**
	 * Execute a user message and stream the AI response
	 *
	 * Creates a placeholder response message, sends the input to the AI model,
	 * and streams back the response in real-time. After completion, automatically
	 * initiates tool execution if the response contains tool calls.
	 *
	 * @param inputMessage - The user input message to send to the AI model
	 * @param existingResponse - Optional pre-created response placeholder already wired into the message tree. When provided, skips creating a new ResponseMessageStore and skips the addChild setup calls, streaming directly into the existing placeholder instead.
	 * @returns Promise resolving to the pixel response containing input and output messages
	 */
	runMessage = async (
		inputMessage: InputMessageStore,
		existingResponse?: ResponseMessageStore,
	) => {
		const room = this.room;

		// In agent-harness mode the message is run server-side via RunAgent
		// instead of the streaming AskPlayground flow. See ./agent-harness.
		if (room.mode === "agent") {
			await runAgentMessage(this, inputMessage, existingResponse);
			return;
		}

		// Create a placeholder response message to show streaming content
		const responseMessage =
			existingResponse ??
			new ResponseMessageStore(room, {
				io: "OUTPUT",
				messageId: STREAMING_PLACEHOLDER_ID,
				visible: true,
				platform_generated: true,
				modelId: room.model.engine_id,
				dateCreated: new Date().toISOString(),
				parts: [],
				tokens: 0,
				ornaments: {
					modelName:
						room.model.engine_display_name ||
						room.model.engine_name ||
						"",
				},
			} as ResponsePixelMessage);

		try {
			// build the context if it is there
			let context = "";
			if (room.options?.instructions) {
				context = room.options?.instructions;
			}

			if (!existingResponse) {
				// connect to the parent
				this.addChild(inputMessage);

				// Add placeholder as child of input to show streaming text
				inputMessage.addChild(responseMessage);
			}

			responseMessage.setIsThinking(true);

			// get the text
			const text = inputMessage.parts.reduce((acc, part) => {
				if (part.type === "TEXT") {
					return acc + part.text;
				}

				return acc;
			}, "");

			const media = inputMessage.parts.reduce((acc, part) => {
				if (part.type === "MEDIA" && part.mediaInfo.fileLocation) {
					acc.push(part.mediaInfo.fileLocation);
				}

				return acc;
			}, [] as string[]);

			// per-stream map from tool delta `index` → wire `id`, used to associate
			// arguments/name deltas with the ToolStore created on the opening chunk
			const toolStreamIndexToId: Record<number, string> = {};

			// Shared param block for the turn. On a stop, recordCancelledTurn
			// must replay the exact same params, so both the live AskPlayground
			// call and the cancel-commit call are built from this single string —
			// the cancel call just adds responseParts + hiddenMessage.
			// The work folder's tools ride along in paramValues: the backend
			// merges them with the room's own and the browser runs them.
			const turnParams = `engine=["${room.model.engine_id}"],
roomId=["${room.roomId}"],
command=["<encode>${text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${media.length ? `media=${JSON.stringify(media)},` : "media=[],"}
${this.id ? `parentMessageId=["${this.id}"],` : ""}
paramValues=[${JSON.stringify({
				...(room.theme.featureFlags?.enableTemperature &&
				room.options.temperature !== undefined
					? { temperature: room.options.temperature }
					: {}),
				...room.chatTools.chatParamValues,
			})}]`;

			// wait for the pixel to run with streaming
			await room.runRoomPixelStreaming<
				[
					{
						inputMessage: InputPixelMessage;
						responseMessage: ResponsePixelMessage;
					},
				]
			>(`AskPlayground(${turnParams});`, {
				onEmit: (chunk) =>
					applyResponseStreamChunk(
						responseMessage,
						toolStreamIndexToId,
						chunk,
					),
				onResult: ({ results }) => {
					const { output } = results[0];

					// sync with the results
					inputMessage.sync(output.inputMessage);
					responseMessage.sync(output.responseMessage);

					// start running tools if there are any
					responseMessage.continueToolExecution();
				},
				// The user stopped the stream mid-response: persist what they
				// saw, rather than treating it as a result or error.
				onCancel: () =>
					this.recordCancelledTurn(
						turnParams,
						inputMessage,
						responseMessage,
					),
			});
		} catch (e) {
			// remove message if we failed
			this.removeChild(inputMessage);

			throw e;
		} finally {
			responseMessage.setIsThinking(false);
		}
	};

	/**
	 * Commit a stopped turn. Cancelling the AskPlayground stream leaves nothing
	 * persisted on the backend, so we replay the turn's exact params through a
	 * second AskPlayground call carrying `responseParts` (what the user actually
	 * saw) and a `hiddenMessage` note. The backend skips the LLM call, persists
	 * the turn, and appends a hidden user-note/assistant-ack pair so the model
	 * sees next turn that its response was cut short. We sync the visible pair
	 * from the result and splice the returned hidden pair(s) into the tree so
	 * the room's parent chain stays aligned with the backend's provider history.
	 */
	private recordCancelledTurn = async (
		turnParams: string,
		inputMessage: InputMessageStore,
		responseMessage: ResponseMessageStore,
	): Promise<void> => {
		const room = this.room;

		try {
			const response = await room.runRoomPixel<[CancelCommitOutput]>(
				`AskPlayground(${turnParams}, responseParts=${JSON.stringify(responseMessage.parts)}, hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
			);

			const { output } = response.pixelReturn[0];

			// sync the visible pair with the committed result
			inputMessage.sync(output.inputMessage);
			responseMessage.sync(output.responseMessage);

			spliceHiddenMessages(responseMessage, output.extraMessages);
		} catch (e) {
			// Rethrown so stop() (StreamJobController), which awaits this as the
			// job's onCancel, surfaces the failure as a room error — this is the
			// user's only signal that the cancelled turn didn't actually persist.
			console.error("Failed to record cancelled turn", e);
			throw e;
		}
	};

	/**
	 * Hard-stop the tool phase — see {@link ToolSaveController.cancelPending}.
	 * Called by the room when the user stops with tool calls still outstanding.
	 */
	cancelPendingTools = (): Promise<void> => this.toolSaves.cancelPending();

	/**
	 * Append a message part during streaming
	 *
	 * Merges consecutive parts of the same type (TEXT or THINKING) or adds
	 * a new part if the type differs from the last part.
	 *
	 * @param part - The message part to append (TEXT or THINKING)
	 */
	savePart = (part: ResponsePixelMessage["parts"][number]): void => {
		if (part.type !== "TEXT" && part.type !== "THINKING") {
			return;
		}
		this.state.update((current) => {
			const parts = current.parts;
			const last = parts[parts.length - 1];
			if (part.type === "TEXT" && last?.type === "TEXT") {
				return {
					parts: [
						...parts.slice(0, -1),
						{
							...last,
							text: last.text + part.text,
							uiText: last.uiText + part.uiText,
						},
					],
				};
			}
			if (part.type === "THINKING" && last?.type === "THINKING") {
				return {
					parts: [
						...parts.slice(0, -1),
						{ ...last, thinking: last.thinking + part.thinking },
					],
				};
			}
			return { parts: [...parts, part] };
		});
	};

	/**
	 * Set whether the conversation above this message is compacted.
	 *
	 * @param compacted - Whether it is.
	 */
	setConversationCompactedAbove = (compacted: boolean): void => {
		this.state.update({ conversationCompactedAbove: compacted });
	};

	/**
	 * Set whether this message's conversation is being compacted.
	 *
	 * @param compacting - Whether it is.
	 */
	setIsCompacting = (compacting: boolean): void => {
		this.state.update({ isCompacting: compacting });
	};

	/**
	 * Save the user's rating of the response.
	 *
	 * @param rating - True for thumbs up, false for down, null to clear it.
	 * @param feedbackText - A comment; unused for now.
	 */
	recordFeedback = async (
		rating: boolean | null,
		feedbackText = "",
	): Promise<void> => {
		const room = this.room;

		try {
			// wait for the pixel to run
			await room.runRoomPixel<[boolean]>(
				`SubmitLlmFeedback(messageId=${JSON.stringify(this.id)}, feedbackText=${JSON.stringify(feedbackText)}, rating=${JSON.stringify(rating)}, roomId=${JSON.stringify(room.roomId)});`,
				false,
			);

			this.state.update({
				feedback: rating === null ? null : { rating, feedbackText },
			});
		} finally {
			// a failed save throws to the caller and leaves the rating as it was
		}
	};

	/**
	 * Download the response's text as a Word or PDF document.
	 *
	 * @param format - The document's format.
	 * @throws When the response has no text or the server makes no file.
	 */
	downloadResponse = async (format: "word" | "pdf"): Promise<void> => {
		// Extract text from all TEXT parts
		const text = this.parts
			.filter((part) => part.type === "TEXT")
			.map((part) => part.text)
			.join("");

		if (!text) throw new Error(getI18n().t("chat:download.noContent"));

		let pixelCommand: string;

		const appName = this.room.theme.name || "Chat";
		const fileName = `${appName} Response Export`;
		if (format === "word") {
			pixelCommand = `ToDocx(markdown=["<encode>${text}</encode>"], fileName="${fileName}");`;
		} else if (format === "pdf") {
			pixelCommand = `ToPdf(markdown=["<encode>${text}</encode>"], fileName="${fileName}");`;
		} else {
			throw new Error(`Unsupported format: ${format}`);
		}

		const resp = await this.room.runRoomPixel<[string]>(
			pixelCommand,
			false,
		);

		if (resp?.pixelReturn?.[0]) {
			const { operationType, output } = resp.pixelReturn[0];

			if (operationType?.includes("FILE_DOWNLOAD")) {
				download(this.room.insightId, output);
			} else {
				throw new Error(
					getI18n().t("sidebar:download.generateFailed", {
						format: format.toUpperCase(),
					}),
				);
			}
		} else {
			throw new Error(getI18n().t("sidebar:download.noResponse"));
		}
	};

	/**
	 * Rewrite Message: send the user's message that this answers once more, as a
	 * new branch beside it.
	 *
	 * @throws When the response does not answer a user's message that follows
	 * a response.
	 */
	rewriteMessage = async (): Promise<void> => {
		const room = this.room;

		// get the parent message
		const parentMessage = this.parent;
		if (parentMessage instanceof InputMessageStore === false) {
			throw new Error("Can only rewrite response to user messages");
		}

		// get the grand parent message
		const grandParentMessage = parentMessage.parent;
		if (grandParentMessage instanceof ResponseMessageStore === false) {
			throw new Error(
				"Can only rewrite if the parent is a response message",
			);
		}

		// create a new input message
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

		// Update room options with current modelId before running message
		await room.updateRoomOptions(room.options);

		grandParentMessage.runMessage(rewrittenMessage);
	};

	/**
	 * Whether the message has anything worth rendering — non-whitespace text,
	 * media, or a tool call. An empty response (e.g. the placeholder the backend
	 * commits after a stopped tool phase) has none.
	 */
	get hasVisibleContent(): boolean {
		return this.parts.some(
			(part) =>
				(part.type === "TEXT" &&
					part.text.replace(/[\s\u00AD\u200B-\u200D\u2060]/g, "")
						.length > 0) ||
				part.type === "MEDIA" ||
				part.type === "TOOL_CALL",
		);
	}

	/** Whether this response includes any tool calls, finished or not. */
	get hasTools(): boolean {
		return this.parts.some((part) => part.type === "TOOL_CALL");
	}

	/**
	 * Whether this response should fold up into the one before it instead
	 * of rendering as its own block — see room-messages.tsx. True once it
	 * has tool calls and nothing else worth showing on its own.
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

	/** Whether any of its tool calls has yet to run or is running. */
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
	 * Run the response's auto tool calls that have not run, up to the theme's
	 * limit on calls running at once (5 when unset).
	 */
	continueToolExecution = (): void => {
		// A stop halts the loop — don't spawn new tool runs once a cancel has
		// been issued and the in-flight streams are still unwinding.
		if (this.room.isCancelling) {
			return;
		}

		// Find the tools that can be run
		let numRunningTools: number = 0;
		const toolsToRun: ToolStore[] = [];
		this.parts.forEach((part) => {
			if (part.type !== "TOOL_CALL") {
				return;
			}
			const tool = this.room.getTool(part.toolCall.id);
			if (tool.json._meta?.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO) {
				return;
			}
			if (tool.status === "INITIAL") {
				toolsToRun.push(tool);
			} else if (tool.status === "LOADING") {
				numRunningTools++;
			}
		});

		// Check how many tools can be run. If toolLimit is false-y, then limit to 5
		const toolLimit = this.room.theme.toolAutoExecutionLimit || 5;
		const numToolsToRun = toolLimit - numRunningTools;
		if (numToolsToRun > 0) {
			toolsToRun.slice(0, numToolsToRun).forEach((tool) => {
				this.runToolExecution(tool);
			});
		}
	};

	/**
	 * Run one auto tool call: a work folder call in the browser, any other
	 * through the room's toolbox. A call that is not auto or already ran is
	 * skipped.
	 *
	 * @param tool - The call.
	 */
	private runToolExecution = async (tool: ToolStore): Promise<void> => {
		if (
			!tool ||
			tool.status !== "INITIAL" ||
			tool.json._meta?.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO
		) {
			// skip
			return;
		}

		// work folder tools run in the browser, against the room's folder, and
		// record their own result
		if (isFolderToolCall(tool.json)) {
			await this.room.chatTools.runChatTool(tool);
			return;
		}

		try {
			await this.runMcpToolCall(tool);
		} catch {
			// Error in AddPlaygroundToolExecution handled by saveToolExecution, which will set the tool status to error and save the error response
		}
	};

	/**
	 * Run an MCP tool call against the room's insight and save what it
	 * returned as the call's response. A failed run saves its error instead,
	 * so the model reads why.
	 *
	 * @param tool - A call that has not run yet.
	 * @throws Error when the response cannot be saved.
	 */
	runMcpToolCall = async (tool: ToolStore): Promise<void> => {
		tool.setStatus("LOADING");

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
	 * Queue a tool result to be written to room history — delegated to the
	 * {@link ToolSaveController}, which serializes and coalesces the writes and
	 * streams the final (model-invoking) one. Resolves when the batch carrying
	 * this result settles.
	 *
	 * @param tool - The call.
	 * @param toolResponse - What it returned, or its error.
	 * @param toolStatus - How it ended.
	 * @param executedParameters - The arguments it ran with.
	 * @param errorDuringSaving - Whether the call returned but its output could
	 * not be read.
	 * @returns Settles with the batch that carries the result.
	 */
	saveToolExecution = (
		tool: ToolStore,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
		executedParameters: Record<string, unknown>,
		errorDuringSaving: boolean = false,
	): Promise<void> =>
		this.toolSaves.save(
			tool,
			toolResponse,
			toolStatus,
			executedParameters,
			errorDuringSaving,
		);
}
