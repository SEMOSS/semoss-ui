import { getI18n } from "@semoss/i18n";
import { exportMarkdownDocument, submitLlmFeedback } from "@semoss/sdk";
import { download } from "@semoss/sdk/react";
import type { ResponsePixelMessage, ToolOutcome } from "../../../types";
import { REWRITE_PLACEHOLDER_ID } from "../../tools/mcp/mcp-constants";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import type { ResponseMessageData } from "./message-map";
import { getModelOrnamentName } from "./response-placeholder";
import { isToolSettled, type ToolStore } from "./tool.store";
import { ToolSaveController } from "./tool-save-controller";
import { runTurn } from "./turn-runner";

/**
 * A response from the model, or the room's hidden root: a view over its entry
 * in the room. Make one with `room.createMessage`.
 */
export class ResponseMessageStore extends AbstractMessageStore<ResponseMessageData> {
	/** Tells a response from an input message. */
	readonly type = "OUTPUT";

	/**
	 * Serializes and coalesces this response's tool-result writes (and owns the
	 * tool-phase stop). Extracted for size; see {@link ToolSaveController}.
	 */
	private readonly toolSaves = new ToolSaveController(this);

	/** Whether the model is still working on it. */
	get isThinking(): boolean {
		return this.getSnapshot().isThinking;
	}

	/**
	 * The model's reply to this response's tool results, while it streams.
	 * Not state: the save controller keeps it, and nothing renders from it.
	 */
	get toolResponseMessage(): ResponseMessageStore | null {
		return this.toolSaves.toolResponseMessage;
	}

	/** The user's rating; only for messages the model wrote. */
	get feedback(): ResponseMessageData["feedback"] {
		return this.getSnapshot().feedback;
	}

	/** The model that wrote it. */
	get model(): ResponseMessageData["model"] {
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
	 * Mark the model as working on the response, or done.
	 *
	 * @param isThinking - Whether it is working.
	 */
	setIsThinking = (isThinking: boolean): void => {
		this.merge({ isThinking });
	};

	/**
	 * Send a user's message as the next turn after this response, and fill the
	 * reply as it arrives: a chat room streams `AskPlayground`, an agent room
	 * runs its agent (`room.turnRunner`). A failed turn takes the message back
	 * out; see `runTurn`.
	 *
	 * @param inputMessage - The user's message.
	 * @param existingResponse - A reply placeholder already in the tree under
	 * the message, to fill instead of making one.
	 * @returns Once the reply has settled.
	 * @throws When the turn fails.
	 */
	runMessage = (
		inputMessage: InputMessageStore,
		existingResponse?: ResponseMessageStore,
	): Promise<void> =>
		runTurn(this.room.turnRunner, this, inputMessage, existingResponse);

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
		this.room.updateMessageParts<ResponseMessageData["parts"]>(
			this.key,
			(parts) => {
				const last = parts[parts.length - 1];
				if (part.type === "TEXT" && last?.type === "TEXT") {
					return [
						...parts.slice(0, -1),
						{
							...last,
							text: last.text + part.text,
							uiText: last.uiText + part.uiText,
						},
					];
				}
				if (part.type === "THINKING" && last?.type === "THINKING") {
					return [
						...parts.slice(0, -1),
						{ ...last, thinking: last.thinking + part.thinking },
					];
				}
				return [...parts, part];
			},
		);
	};

	/**
	 * Set whether the conversation above this message is compacted.
	 *
	 * @param compacted - Whether it is.
	 */
	setConversationCompactedAbove = (compacted: boolean): void => {
		this.merge({ conversationCompactedAbove: compacted });
	};

	/**
	 * Set whether this message's conversation is being compacted.
	 *
	 * @param compacting - Whether it is.
	 */
	setIsCompacting = (compacting: boolean): void => {
		this.merge({ isCompacting: compacting });
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

		// a failed save throws to the caller and leaves the rating as it was
		await room.runRoomRequest(
			(insightId) =>
				submitLlmFeedback(insightId, {
					roomId: room.roomId,
					messageId: this.id,
					rating: rating,
					feedbackText: feedbackText,
				}),
			{ showLoading: false },
		);

		this.merge({
			feedback: rating === null ? null : { rating, feedbackText },
		});
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

		const appName = this.room.theme.name || "Chat";
		const document = await this.room.runRoomRequest(
			(insightId) =>
				exportMarkdownDocument(
					insightId,
					text,
					`${appName} Response Export`,
					format,
				),
			{ showLoading: false },
		);

		if (document.operationType === null) {
			throw new Error(getI18n().t("sidebar:download.noResponse"));
		}
		if (document.fileKey === null) {
			throw new Error(
				getI18n().t("sidebar:download.generateFailed", {
					format: format.toUpperCase(),
				}),
			);
		}
		download(this.room.insightId, document.fileKey);
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
		if (!(parentMessage instanceof InputMessageStore)) {
			throw new Error("Can only rewrite response to user messages");
		}

		// get the grand parent message
		const grandParentMessage = parentMessage.parent;
		if (!(grandParentMessage instanceof ResponseMessageStore)) {
			throw new Error(
				"Can only rewrite if the parent is a response message",
			);
		}

		// create a new input message
		const rewrittenMessage = room.createMessage({
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: REWRITE_PLACEHOLDER_ID,
			visible: true,
			platform_generated: true,
			modelId: room.model.engine_id,
			modelType: room.model.engine_type,
			dateCreated: new Date().toISOString(),
			parts: parentMessage.parts,
			tokens: parentMessage.tokens,
			ornaments: { modelName: getModelOrnamentName(room.model) },
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
			return !!tool && !isToolSettled(tool.status);
		});
	}

	/** Run the response's auto tool calls; see `ChatTurnRunner.continueToolExecution`. */
	continueToolExecution = (): void =>
		this.room.chatTurns.continueToolExecution(this);

	/** Run one of its MCP tool calls and save the result; see `ChatTurnRunner.runMcpToolCall`. */
	runMcpToolCall = (tool: ToolStore): Promise<void> =>
		this.room.chatTurns.runMcpToolCall(this, tool);

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
		toolStatus: ToolOutcome = "success",
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
