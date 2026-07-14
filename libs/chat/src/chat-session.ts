import { makeAutoObservable, runInAction } from "mobx";
import type { ChatOptions } from "./chat-options";
import { DEFAULT_TOOL_AUTO_EXECUTION_LIMIT } from "./chat-options";
import { normalizeRoomHistory } from "./history";
import { toolCallDisplayName } from "./lib/utils";
import type { InsightActions } from "./transport/pixel-calls";
import {
	addPlaygroundToolExecution,
	askPlayground,
	createPlaygroundRoom,
	downloadMessageAsFile,
	getPlaygroundRoomHistory,
	runMcpTool,
	submitFeedback,
	updateRoomOptions,
} from "./transport/pixel-calls";
import type {
	ChatMessage,
	ChatToolCallPart,
	MCPConfig,
	PixelMessageTextPart,
	PixelMessageToolCallPart,
	ResponseMessage,
	StreamChunk,
} from "./types";

let messageCounter = 0;
function nextMessageId(prefix: "user" | "assistant"): string {
	messageCounter += 1;
	return `${prefix}-${messageCounter}`;
}

let partCounter = 0;
function nextPartId(prefix: string): string {
	partCounter += 1;
	return `${prefix}-${partCounter}`;
}

function isToolCallPart(part: {
	type: string;
}): part is PixelMessageToolCallPart {
	return part.type === "TOOL_CALL";
}

function isTextPart(part: { type: string }): part is PixelMessageTextPart {
	return part.type === "TEXT";
}

function findFinalToolCall(
	response: ResponseMessage,
): PixelMessageToolCallPart | undefined {
	return response.parts?.find(isToolCallPart);
}

function resolveResponseText(response: ResponseMessage): string | undefined {
	return (
		response.ornaments?.processedResponsed ??
		response.parts?.find(isTextPart)?.text ??
		response.content
	);
}

/**
 * Applies one streamed chunk to a message's parts in place — mirrors
 * playground's ResponseMessageStore.savePart/applyToolStreamChunk exactly:
 * append onto a trailing part of the same type, else push a new one. Tool
 * chunks are live-display only here — the id/name/arguments actually used
 * to run a tool always come from the final structured result
 * (reconcileToolCall), never reconstructed from these deltas. Must be
 * called inside a MobX runInAction.
 */
function applyStreamChunk(
	message: ChatMessage,
	chunk: StreamChunk,
	toolIndexToId: Record<number, string>,
): void {
	if (chunk.stream_type === "content") {
		const text = chunk.data.content;
		if (!text) {
			return;
		}
		const last = message.parts[message.parts.length - 1];
		if (last?.type === "text") {
			last.text += text;
			return;
		}
		if (last?.type === "thinking" && !last.text) {
			message.parts.pop();
		}
		message.parts.push({ type: "text", id: nextPartId("text"), text });
		return;
	}

	if (chunk.stream_type === "thinking") {
		const text = chunk.data.thinking;
		if (!text) {
			return;
		}
		const last = message.parts[message.parts.length - 1];
		if (last?.type === "thinking") {
			last.text += text;
		} else {
			message.parts.push({
				type: "thinking",
				id: nextPartId("thinking"),
				text,
			});
		}
		return;
	}

	// "tool"
	const { data } = chunk;
	if (data.finish_reason) {
		return;
	}
	if (data.id !== undefined && data.index !== undefined) {
		toolIndexToId[data.index] = data.id;
		message.parts.push({
			type: "tool_call",
			id: data.id,
			name: data.function?.name ?? "",
			arguments: {},
		});
		return;
	}
	if (data.index === undefined || !data.function?.name) {
		return;
	}
	const id = toolIndexToId[data.index];
	const part = message.parts.find(
		(candidate): candidate is ChatToolCallPart =>
			candidate.type === "tool_call" && candidate.id === id,
	);
	if (part) {
		part.name += data.function.name;
	}
}

/**
 * Replaces/creates the authoritative tool_call part for a turn once the
 * final structured result is known — overwrites whatever placeholder
 * streaming produced (incomplete name, no real arguments) with the real
 * id/name/arguments. Must be called inside a MobX runInAction.
 */
function reconcileToolCall(
	message: ChatMessage,
	toolCall: PixelMessageToolCallPart["toolCall"],
): void {
	const existing = message.parts.find(
		(part): part is ChatToolCallPart =>
			part.type === "tool_call" && part.id === toolCall.id,
	);
	const displayName = toolCallDisplayName(toolCall);
	if (existing) {
		existing.name = displayName;
		existing.arguments = toolCall.arguments;
		return;
	}
	message.parts.push({
		type: "tool_call",
		id: toolCall.id,
		name: displayName,
		arguments: toolCall.arguments,
	});
}

/**
 * The headless engine behind useChat(). Generalized from playground's
 * RoomStore + provider-portal-hpp's HomeChatBot.tsx, deliberately linear
 * (no message tree/branching — see docs/chat-components/PLAN.md, Phase 1).
 * Streams real token-by-token responses via streamPixel, matching
 * RoomStore.runRoomPixelStreaming's actual polling pattern.
 */
export class ChatSession {
	messages: ChatMessage[] = [];
	isTyping = false;
	error: string | null = null;
	roomId: string | null = null;
	/** Mutable — unlike the rest of ChatOptions, the engine can change mid-session (e.g. an EngineSelect next to ChatInput). Initialized from options.engineId. */
	engineId: string;

	/**
	 * True while a resumed room's history is loading (options.roomId was
	 * set). Never true for a fresh session — there's nothing to load until
	 * the first sendMessage() lazily creates a room.
	 */
	isLoadingHistory = false;

	/**
	 * Knowledge/toolbox sources currently attached to this room — mutable
	 * mid-conversation via setMcp(), same shape as playground's real
	 * `RoomStore.options.mcp` (see McpOverlay/MCPSelector in
	 * @semoss/shared). Restored from a resumed room's saved options on
	 * load; starts empty for a fresh session (nothing attached until the
	 * user opens the MCP overlay and saves).
	 */
	mcp: MCPConfig[] = [];

	/**
	 * Bumped on every in-place mutation to a message's parts (e.g.
	 * appending streamed text). useChat()'s autorun bridge reads this
	 * alongside messages.length so it re-renders correctly even for
	 * mutations that don't change the array's length.
	 */
	revision = 0;

	private parentMessageId: string | undefined;
	private roomOptionsSynced = false;

	constructor(
		private readonly actions: InsightActions,
		private readonly insightId: string,
		private readonly options: ChatOptions,
	) {
		this.engineId = options.engineId;
		if (options.roomId) {
			// Short-circuits ensureRoom()'s CreatePlaygroundRoom call — this
			// room already exists — and skips ever pushing
			// defaultRoomSettings over a resumed room's own saved options.
			this.roomId = options.roomId;
			this.roomOptionsSynced = true;
			this.isLoadingHistory = true;
		}
		makeAutoObservable(this, {}, { autoBind: true });
		if (options.roomId) {
			// Fire-and-forget: state mutations happen inside runInAction
			// callbacks that run on a later microtask, well after this
			// constructor (and makeAutoObservable above) has returned.
			void this.loadHistory(options.roomId);
		}
	}

	private async loadHistory(roomId: string): Promise<void> {
		try {
			const raw = await getPlaygroundRoomHistory(this.actions, roomId);
			const { messages, parentMessageId, lastModelId } =
				normalizeRoomHistory(raw.messages);
			runInAction(() => {
				// Guard: if the user already started typing/sending before
				// history resolved, don't clobber their in-flight message.
				if (this.messages.length === 0) {
					this.messages = messages;
				}
				this.parentMessageId = parentMessageId;
				if (lastModelId) {
					this.engineId = lastModelId;
				}
				this.mcp = raw.mcp;
				this.isLoadingHistory = false;
			});
		} catch (err) {
			const friendlyMessage = this.toFriendlyMessage(err);
			runInAction(() => {
				this.error = friendlyMessage;
				this.isLoadingHistory = false;
			});
		}
	}

	setEngineId(engineId: string): void {
		this.engineId = engineId;
	}

	/**
	 * Attach/detach knowledge sources or toolbox tools for this room —
	 * updates local state immediately and persists via the real
	 * UpdateRoomOptions pixel (matches playground's own MCPOverlay save
	 * path, which mutates RoomStore.options.mcp then persists the whole
	 * options blob, not a dedicated MCP-attach endpoint — there isn't one).
	 * A no-op before a room exists yet (nothing to persist to) — the next
	 * sendMessage() will create the room, but this method doesn't try to
	 * eagerly create one just to save an MCP list.
	 */
	async setMcp(mcp: MCPConfig[]): Promise<void> {
		const previous = this.mcp;
		runInAction(() => {
			this.mcp = mcp;
		});
		if (!this.roomId) {
			return;
		}
		try {
			await updateRoomOptions(this.actions, {
				roomId: this.roomId,
				instructions: this.options.defaultRoomSettings?.instructions,
				temperature: this.options.defaultRoomSettings?.temperature,
				mcp,
			});
		} catch (err) {
			runInAction(() => {
				this.mcp = previous;
				this.error = this.toFriendlyMessage(err);
			});
		}
	}

	private getMessage(id: string): ChatMessage | undefined {
		return this.messages.find((message) => message.id === id);
	}

	/**
	 * Thumbs up/down on an assistant response — clicking the already-active
	 * rating clears it (matches playground's real `recordFeedback`'s
	 * `isDeleting` toggle-off behavior). Optimistic: flips the local message
	 * state immediately, reverts it if the pixel call fails, since a UI that
	 * silently un-rates itself on the next reload is more confusing than one
	 * that briefly shows an error.
	 */
	async recordFeedback(messageId: string, rating: boolean): Promise<void> {
		if (!this.roomId) {
			return;
		}
		const message = this.getMessage(messageId);
		if (!message) {
			return;
		}
		const previous = message.feedback;
		const isClearing = previous?.rating === rating;
		const nextRating = isClearing ? null : rating;

		runInAction(() => {
			message.feedback = isClearing ? undefined : { rating };
			this.revision += 1;
		});

		try {
			await submitFeedback(this.actions, {
				roomId: this.roomId,
				messageId,
				rating: nextRating,
			});
		} catch (err) {
			runInAction(() => {
				message.feedback = previous;
				this.error = this.toFriendlyMessage(err);
				this.revision += 1;
			});
		}
	}

	/** Renders an assistant response's text parts to a Word/PDF file and triggers a browser download. */
	async downloadMessage(
		messageId: string,
		format: "word" | "pdf",
	): Promise<void> {
		const message = this.getMessage(messageId);
		if (!message) {
			return;
		}
		const markdown = message.parts
			.filter(
				(part): part is Extract<typeof part, { type: "text" }> =>
					part.type === "text",
			)
			.map((part) => part.text)
			.join("");
		if (!markdown) {
			throw new Error("No content to download");
		}
		await downloadMessageAsFile(this.actions, this.insightId, {
			format,
			markdown,
			fileName: this.roomId ?? messageId,
		});
	}

	async sendMessage(text: string): Promise<void> {
		const trimmed = text.trim();
		if (!trimmed) {
			return;
		}

		const assistantMessageId = nextMessageId("assistant");

		runInAction(() => {
			this.messages.push({
				id: nextMessageId("user"),
				role: "user",
				parts: [
					{ type: "text", id: nextPartId("text"), text: trimmed },
				],
				status: "complete",
				timestamp: new Date(),
			});
			this.messages.push({
				id: assistantMessageId,
				role: "assistant",
				parts: [],
				status: "streaming",
				timestamp: new Date(),
			});
			this.isTyping = true;
			this.error = null;
			this.revision += 1;
		});

		const toolIndexToId: Record<number, string> = {};
		const onChunk = (chunk: StreamChunk) => {
			runInAction(() => {
				const message = this.getMessage(assistantMessageId);
				if (message) {
					applyStreamChunk(message, chunk, toolIndexToId);
					this.revision += 1;
				}
			});
		};

		try {
			const roomId = await this.ensureRoom();
			await this.syncRoomOptionsOnce(roomId);

			let response = await askPlayground(
				this.insightId,
				{
					engineId: this.engineId,
					roomId,
					command: trimmed,
					temperature: this.options.defaultRoomSettings?.temperature,
					parentMessageId: this.parentMessageId,
				},
				onChunk,
			);

			const limit =
				this.options.toolAutoExecutionLimit ??
				DEFAULT_TOOL_AUTO_EXECUTION_LIMIT;
			for (
				let round = 0;
				findFinalToolCall(response) && round < limit;
				round += 1
			) {
				response = await this.executeToolRound(
					roomId,
					response,
					assistantMessageId,
					onChunk,
				);
			}

			if (findFinalToolCall(response)) {
				throw new Error(
					`Reached the tool-call limit (${limit}) without a final response.`,
				);
			}

			runInAction(() => {
				const message = this.getMessage(assistantMessageId);
				if (!message) {
					return;
				}
				this.parentMessageId =
					response.messageId ?? this.parentMessageId;
				const hasTextPart = message.parts.some(
					(part) => part.type === "text",
				);
				if (!hasTextPart) {
					const fallbackText = resolveResponseText(response);
					if (fallbackText) {
						message.parts.push({
							type: "text",
							id: nextPartId("text"),
							text: fallbackText,
						});
					}
				}
				message.status = "complete";
				this.revision += 1;
			});
		} catch (err) {
			const friendlyMessage = this.toFriendlyMessage(err);
			runInAction(() => {
				this.error = friendlyMessage;
				const message = this.getMessage(assistantMessageId);
				if (message) {
					message.parts.push({
						type: "text",
						id: nextPartId("text"),
						text: friendlyMessage,
					});
					message.status = "error";
				}
				this.revision += 1;
			});
		} finally {
			runInAction(() => {
				this.isTyping = false;
			});
		}
	}

	private async ensureRoom(): Promise<string> {
		if (this.roomId) {
			return this.roomId;
		}
		const { roomId } = await createPlaygroundRoom(this.actions);
		runInAction(() => {
			this.roomId = roomId;
		});
		return roomId;
	}

	private async syncRoomOptionsOnce(roomId: string): Promise<void> {
		if (this.roomOptionsSynced) {
			return;
		}
		// Also fires when only `mcp` has something to persist (e.g. the user
		// attached a knowledge source before ever sending a first message in
		// a brand-new room) — not just when defaultRoomSettings is set.
		// Skipping this the way the old `!defaultRoomSettings` guard did
		// would silently drop that first-save entirely, since this is the
		// only place a fresh room's options get persisted before its first
		// UpdateRoomOptions call.
		if (!this.options.defaultRoomSettings && this.mcp.length === 0) {
			return;
		}
		await updateRoomOptions(this.actions, {
			roomId,
			instructions: this.options.defaultRoomSettings?.instructions,
			temperature: this.options.defaultRoomSettings?.temperature,
			mcp: this.mcp,
		});
		runInAction(() => {
			this.roomOptionsSynced = true;
		});
	}

	private async executeToolRound(
		roomId: string,
		response: ResponseMessage,
		assistantMessageId: string,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ResponseMessage> {
		const toolCallPart = findFinalToolCall(response);
		if (!toolCallPart) {
			return response;
		}
		const { toolCall } = toolCallPart;
		const projectId = toolCall._meta?.SMSS_PROJECT_ID;
		if (!projectId) {
			throw new Error("Tool call is missing its project id");
		}

		runInAction(() => {
			const message = this.getMessage(assistantMessageId);
			if (message) {
				reconcileToolCall(message, toolCall);
				this.revision += 1;
			}
		});

		let toolResult: unknown;
		try {
			toolResult = await runMcpTool(this.actions, {
				projectId,
				functionName: toolCall.name,
				paramValues: toolCall.arguments,
			});
		} catch (err) {
			runInAction(() => {
				const message = this.getMessage(assistantMessageId);
				if (message) {
					message.parts.push({
						type: "tool_result",
						id: nextPartId("tool_result"),
						toolCallId: toolCall.id,
						output:
							err instanceof Error ? err.message : String(err),
						status: "error",
					});
					this.revision += 1;
				}
			});
			throw err;
		}

		runInAction(() => {
			const message = this.getMessage(assistantMessageId);
			if (message) {
				message.parts.push({
					type: "tool_result",
					id: nextPartId("tool_result"),
					toolCallId: toolCall.id,
					output: JSON.stringify(toolResult),
					status: "success",
				});
				this.revision += 1;
			}
		});

		return addPlaygroundToolExecution(
			this.insightId,
			{
				engineId: this.engineId,
				roomId,
				parentMessageId: response.messageId ?? "",
				toolId: toolCall.id,
				functionName: toolCall.name,
				toolExecutionResponse: JSON.stringify(toolResult),
			},
			onChunk,
		);
	}

	private toFriendlyMessage(err: unknown): string {
		const message = err instanceof Error ? err.message : String(err);
		const mapping = this.options.gracefulErrors ?? {};
		const match = Object.entries(mapping).find(([needle]) =>
			message.includes(needle),
		);
		return match ? match[1] : message;
	}
}
