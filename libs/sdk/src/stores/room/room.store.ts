import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	type PixelJobStreamingStatus,
} from "../../api/base";
import {
	askRoom,
	createRoomRecord,
	getRoomMessages,
	setRoomForInsight,
	updateRoomOptions,
} from "../../api/chat";
import type {
	AgentRunSnapshot,
	RoomAskAgentOptions,
	RoomAskAgentResult,
	RoomAskOptions,
	RoomAskResult,
	RoomMessage,
	RoomOptions,
	RoomStreamChunk,
} from "../../types";
import { AgentStore } from "../agent";

// Statuses that signal the streaming job has finished (success or failure).
const TERMINAL_STATUSES: PixelJobStreamingStatus[] = [
	"ProgressComplete",
	"Complete",
	"Canceled",
	"Error",
	"UnknownJob",
];

/**
 * Minimal shape of the AskRoom settled output used internally to extract
 * message IDs and response text. Not exported — consumers receive RoomAskResult.
 */
interface AskSettledOutput {
	inputMessage: { messageId: string; [key: string]: unknown };
	responseMessage: {
		messageId: string;
		parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
		[key: string]: unknown;
	};
}

/**
 * A managed chat room that wraps the lower-level chat API functions, handling
 * the streaming poll loop and conversation state so callers never touch job IDs.
 *
 * Create via {@link createRoom} rather than instantiating directly.
 *
 * @example
 * ```ts
 * const room = await createRoom(insightId);
 * await room.updateOptions({ modelId: "gpt-4o", instructions: "Be concise." });
 *
 * const result = await room.ask("What is the capital of France?", {
 *     onChunk: (chunk) => {
 *         if (chunk.type === "content") process.stdout.write(chunk.content ?? "");
 *     },
 * });
 * console.log(result.text); // "Paris"
 * ```
 *
 * @see sdk-chat skill for the full Room guide and chat-vs-agent comparison.
 */
export class RoomStore {
	readonly roomId: string;
	readonly insightId: string;
	private _options: RoomOptions;
	/**
	 * Tracks the last response message ID so subsequent ask() calls
	 * automatically continue the same conversation thread.
	 */
	private _lastResponseMessageId: string = "ROOT_PLACEHOLDER_ID";

	/** The most recent AgentStore created via {@link createAgent}/{@link askAgent}, if any. */
	private _agent: AgentStore | null = null;

	/**
	 * Wrap an already-existing room (e.g. one an insight is already bound to)
	 * with no new `CreateRoom` pixel call. Prefer {@link createRoom} /
	 * {@link RoomStore.create} when you need to create a brand-new room record.
	 *
	 * @param roomId - ID of the existing room.
	 * @param insightId - The active SEMOSS insight ID.
	 * @param options - The room's current configuration (fetch with {@link getRoomOptions} if unknown).
	 */
	constructor(roomId: string, insightId: string, options: RoomOptions) {
		this.roomId = roomId;
		this.insightId = insightId;
		this._options = options;
	}

	/** Current room configuration. */
	get options(): Readonly<RoomOptions> {
		return this._options;
	}

	/** The most recent agent run added to this room, if any. */
	get agent(): AgentStore | null {
		return this._agent;
	}

	// ---------------------------------------------------------------------------
	// Internal helpers
	// ---------------------------------------------------------------------------

	/**
	 * Polls a streaming pixel job to completion, invoking onChunk for each
	 * arriving content / thinking / tool chunk.
	 */
	private async _stream(
		jobId: string,
		onChunk?: (chunk: RoomStreamChunk) => void,
	): Promise<void> {
		while (true) {
			const { message, status } = await getPixelJobStreaming(jobId);

			if (onChunk) {
				for (const chunk of message) {
					if (chunk.stream_type === "content" && chunk.data.content) {
						onChunk({
							type: "content",
							content: chunk.data.content,
						});
					} else if (
						chunk.stream_type === "thinking" &&
						chunk.data.thinking
					) {
						onChunk({
							type: "thinking",
							thinking: chunk.data.thinking,
						});
					} else if (chunk.stream_type === "tool") {
						onChunk({ type: "tool", toolData: chunk.data });
					}
				}
			}

			if (TERMINAL_STATUSES.includes(status)) break;
		}
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	/**
	 * Update the room's configuration. Merges with the current options so you
	 * only need to pass the fields you want to change.
	 *
	 * @param options - Partial options to apply.
	 */
	async updateOptions(options: Partial<RoomOptions>): Promise<void> {
		const merged: RoomOptions = { ...this._options, ...options };
		await updateRoomOptions(this.insightId, this.roomId, [merged]);
		this._options = merged;
	}

	/**
	 * Fetch all persisted messages in this room.
	 *
	 * @returns The full message history.
	 */
	async getMessages(): Promise<RoomMessage[]> {
		return getRoomMessages(this.insightId, this.roomId);
	}

	/**
	 * Send a chat message and stream the model's response (client-driven,
	 * AskRoom). Automatically continues the conversation thread from the
	 * previous response unless `parentMessageId` is overridden in options.
	 *
	 * @param command - The message text to send.
	 * @param options - Streaming callback and optional per-request overrides.
	 * @returns Settled message IDs and the full response text.
	 * @see sdk-chat skill for the full streaming guide.
	 */
	async ask(
		command: string,
		options: RoomAskOptions = {},
	): Promise<RoomAskResult> {
		const {
			onChunk,
			parentMessageId = this._lastResponseMessageId,
			image = [],
			context = this._options.instructions,
		} = options;

		const { jobId } = await askRoom(this.insightId, {
			engine: this._options.modelId,
			roomId: this.roomId,
			command,
			context,
			image,
			parentMessageId,
		});

		await this._stream(jobId, onChunk);

		const { errors, results } =
			await getPixelAsyncResult<[AskSettledOutput]>(jobId);

		if (errors.length > 0) {
			throw new Error(errors.join(", "));
		}

		const output = results[0].output;
		const text = output.responseMessage.parts
			.filter((p) => p.type === "TEXT" && p.text)
			.map((p) => p.text as string)
			.join("");

		this._lastResponseMessageId = output.responseMessage.messageId;

		return {
			inputMessageId: output.inputMessage.messageId,
			responseMessageId: output.responseMessage.messageId,
			text,
		};
	}

	/**
	 * Start a new agent-harness run in this room via {@link AgentStore.start},
	 * caching it as {@link agent} so a caller holding this room can later
	 * `.decide()` a paused tool call on the SAME instance that's watching it.
	 * Prefer {@link askAgent} for the common single-shot case; use this
	 * directly to drive `.watch()`/`.decide()` yourself.
	 *
	 * @param command - The message text to send.
	 * @param engine - Model engine id override; defaults to the room's configured model.
	 * @returns The started, not-yet-watched `AgentStore`.
	 */
	async createAgent(command: string, engine?: string): Promise<AgentStore> {
		this._agent = await AgentStore.start(
			{
				roomId: this.roomId,
				command,
				engine: engine ?? this._options.modelId,
			},
			this.insightId,
		);
		return this._agent;
	}

	/**
	 * Send a message via the server-side agent harness (RunAgent). The backend
	 * drives the full agentic loop, polling its durable run to completion;
	 * item events (message/reasoning/tool) are surfaced through `onChunk` as
	 * they arrive.
	 *
	 * Requires the room to have `harnessType: "semoss"` in its options.
	 *
	 * @param command - The message text to send.
	 * @param options - Streaming callback.
	 * @returns Settled message IDs, response text, and status.
	 * @see sdk-chat skill for the chat-vs-agent-harness guide.
	 */
	async askAgent(
		command: string,
		options: RoomAskAgentOptions = {},
	): Promise<RoomAskAgentResult> {
		const { onChunk, onPendingActions } = options;

		const agent = await this.createAgent(command);

		const snapshot = await new Promise<AgentRunSnapshot>(
			(resolve, reject) => {
				agent.watch({
					onEvent: (event) => {
						if (!onChunk) {
							return;
						}
						if (event.type === "item.updated") {
							if (event.kind === "message" && event.delta) {
								onChunk({
									type: "content",
									content: event.delta,
								});
							} else if (
								event.kind === "reasoning" &&
								event.delta
							) {
								onChunk({
									type: "thinking",
									thinking: event.delta,
								});
							} else if (event.patch) {
								onChunk({
									type: "tool",
									toolData: event.patch,
								});
							}
						} else if (event.item.kind === "tool") {
							onChunk({ type: "tool", toolData: event.item });
						}
					},
					onSnapshot: () => {},
					onReconcile: (full) => {
						if (full.status === "INPUT_REQUIRED") {
							if (onPendingActions) {
								onPendingActions(full.pendingActions);
							} else {
								agent.stop();
								reject(
									new Error(
										"Agent run paused awaiting a tool decision (INPUT_REQUIRED), but no onPendingActions handler was provided to askAgent — pass one and resolve each action with agent.decide(), or the run has no way to resume.",
									),
								);
							}
							return;
						}
						if (
							full.status === "COMPLETED" ||
							full.status === "FAILED" ||
							full.status === "CANCELLED"
						) {
							resolve(full);
						}
					},
					onError: (error) => {
						console.error("Agent run stream error", error);
					},
				});
			},
		);

		if (snapshot.status !== "COMPLETED") {
			throw new Error(
				`Agent run did not complete: ${snapshot.status}${
					snapshot.errorMessage ? ` — ${snapshot.errorMessage}` : ""
				}`,
			);
		}

		this._lastResponseMessageId =
			snapshot.finalOutputMessageId ?? this._lastResponseMessageId;

		return {
			inputMessageId: snapshot.inputMessageId ?? "",
			responseMessageId: snapshot.finalOutputMessageId ?? "",
			text: snapshot.finalText ?? "",
			status: snapshot.status,
		};
	}

	// ---------------------------------------------------------------------------
	// Static factory
	// ---------------------------------------------------------------------------

	/**
	 * Create a brand-new room record, bind it to the active insight, and return
	 * it ready to use. Prefer this (or the `new RoomStore(...)` constructor for
	 * an already-existing room) over calling `createRoomRecord` yourself.
	 *
	 * @param insightId - The active SEMOSS insight ID.
	 * @param workspaceId - Optional workspace to associate with the room.
	 * @returns A fully initialized RoomStore instance.
	 */
	static async create(
		insightId: string,
		workspaceId?: string,
	): Promise<RoomStore> {
		const roomRecord = await createRoomRecord(insightId, workspaceId);
		await setRoomForInsight(insightId, roomRecord.roomId);

		const defaultOptions: RoomOptions = {
			predefinedPrompts: [],
			instructions: "",
			mcp: [],
			modelId: "",
		};

		return new RoomStore(roomRecord.roomId, insightId, defaultOptions);
	}
}

/**
 * Convenience wrapper around {@link RoomStore.create}. Creates a new room and binds
 * it to the active insight.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param workspaceId - Optional workspace to associate with the room.
 * @returns A fully initialized RoomStore instance.
 *
 * @example
 * ```ts
 * const room = await createRoom(insightId);
 * await room.updateOptions({ modelId: "gpt-4o" });
 * const { text } = await room.ask("Hello!");
 * ```
 */
export const createRoom = (
	insightId: string,
	workspaceId?: string,
): Promise<RoomStore> => RoomStore.create(insightId, workspaceId);
