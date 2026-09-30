import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	type PixelJobStreamingStatus,
} from "../../api/base";
import {
	type AskRoomSettledOutput,
	askRoom,
	commitCancelledAskRoom,
	createRoomRecord,
	getRoomMessages,
	roomAskAbortedError,
	setRoomForInsight,
	stopRoomJob,
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

/** The turn currently in flight on a {@link RoomStore}, if any. */
interface ActiveAsk {
	/** Ends the poll loop early — via {@link RoomStore.stop} or {@link RoomStore.abandon}. */
	controller: AbortController;
	/** Job id once AskRoom has been submitted; null for the brief window before that. */
	jobId: string | null;
	/** The exact params sent, replayed byte-for-byte by a cancel-commit. */
	params: Parameters<typeof askRoom>[1];
	/** Streamed so far, so a {@link RoomStore.stop} has something to commit. */
	accumulated: { text: string; thinking: string };
}

/** Extract the settled result {@link RoomStore.ask} and {@link RoomStore.stop} both resolve. */
const toRoomAskResult = (output: AskRoomSettledOutput): RoomAskResult => ({
	inputMessageId: output.inputMessage.messageId,
	responseMessageId: output.responseMessage.messageId,
	inputMessage: output.inputMessage,
	responseMessage: output.responseMessage,
	text: output.responseMessage.parts
		.filter((p) => p.type === "TEXT" && p.text)
		.map((p) => p.text as string)
		.join(""),
});

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

	/** The turn currently in flight, if any — see {@link stop} / {@link abandon}. */
	private _activeAsk: ActiveAsk | null = null;

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

	/** True while a turn started by {@link ask} has not yet settled. */
	get isAsking(): boolean {
		return this._activeAsk !== null;
	}

	// ---------------------------------------------------------------------------
	// Internal helpers
	// ---------------------------------------------------------------------------

	/**
	 * Polls a streaming pixel job to completion, invoking onChunk for each
	 * arriving content / thinking / tool chunk and folding text/thinking into
	 * `active.accumulated` so a stop mid-stream has something to commit.
	 * Checked before each poll, not after, so an abort from {@link stop} /
	 * {@link abandon} unwinds before the next request goes out.
	 *
	 * @throws {@link roomAskAbortedError} when `active.controller`'s signal aborts.
	 */
	private async _stream(
		active: ActiveAsk,
		onChunk?: (chunk: RoomStreamChunk) => void,
	): Promise<void> {
		const { jobId } = active;
		if (!jobId) {
			return;
		}

		while (true) {
			if (active.controller.signal.aborted) {
				throw roomAskAbortedError();
			}

			const { message, status } = await getPixelJobStreaming(jobId);

			for (const chunk of message) {
				if (chunk.stream_type === "content" && chunk.data.content) {
					active.accumulated.text += chunk.data.content;
					onChunk?.({ type: "content", content: chunk.data.content });
				} else if (
					chunk.stream_type === "thinking" &&
					chunk.data.thinking
				) {
					active.accumulated.thinking += chunk.data.thinking;
					onChunk?.({
						type: "thinking",
						thinking: chunk.data.thinking,
					});
				} else if (chunk.stream_type === "tool") {
					onChunk?.({ type: "tool", toolData: chunk.data });
				}
			}

			if (status === "Canceled") {
				// Terminal, but not a normal completion: nothing further will
				// arrive and there is no settled result to fetch. Without this
				// a job stopped from outside this call (or a race with our own
				// stop()) would fall through to the generic terminal break and
				// getPixelAsyncResult would run against a dead job.
				throw roomAskAbortedError();
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
	 * Only one turn may be in flight at a time — stop or await the current
	 * one first.
	 *
	 * @param command - The message text to send.
	 * @param options - Streaming callback and optional per-request overrides.
	 * @returns Settled message IDs and the full response text.
	 * @throws {@link isRoomAskAborted} when {@link stop} or {@link abandon} ends
	 * the turn first — check that rather than treating it as a failure.
	 * @see sdk-chat skill for the full streaming guide.
	 */
	async ask(
		command: string,
		options: RoomAskOptions = {},
	): Promise<RoomAskResult> {
		if (this._activeAsk) {
			throw new Error(
				"A turn is already in flight on this room — await it, or call stop()/abandon() first.",
			);
		}

		const {
			onChunk,
			parentMessageId = this._lastResponseMessageId,
			media,
			paramValues,
		} = options;

		const active: ActiveAsk = {
			controller: new AbortController(),
			jobId: null,
			params: {
				engine: this._options.modelId,
				roomId: this.roomId,
				command,
				media,
				parentMessageId,
				paramValues: paramValues ? [paramValues] : undefined,
			},
			accumulated: { text: "", thinking: "" },
		};
		this._activeAsk = active;

		try {
			const { jobId } = await askRoom(this.insightId, active.params);
			active.jobId = jobId;

			await this._stream(active, onChunk);

			const { errors, results } =
				await getPixelAsyncResult<[AskRoomSettledOutput]>(jobId);

			if (errors.length > 0) {
				throw new Error(errors.join(", "));
			}

			const output = results[0].output;
			this._lastResponseMessageId = output.responseMessage.messageId;

			return toRoomAskResult(output);
		} finally {
			this._activeAsk = null;
		}
	}

	/**
	 * Stop the in-flight turn and persist what streamed so far, so the user's
	 * message is not orphaned in the room. No-op when nothing is in flight.
	 *
	 * @param note - Hidden message appended for the model's next turn,
	 * explaining that this answer was cut short.
	 * @returns The committed partial turn, or null when nothing had streamed
	 * yet (the turn is dropped rather than persisted empty) or no turn was
	 * in flight.
	 */
	async stop(
		note: string = "The previous response was stopped by the user before it finished. Do not assume it completed.",
	): Promise<RoomAskResult | null> {
		const active = this._activeAsk;
		if (!active) {
			return null;
		}

		// Unblocks _stream's poll loop (and thus the pending ask() call)
		// before the backend round-trips below, rather than racing it.
		active.controller.abort();

		if (!active.jobId) {
			return null;
		}

		await stopRoomJob(this.insightId, active.jobId);

		const parts: Array<{ type: string; [key: string]: unknown }> = [];
		if (active.accumulated.thinking) {
			parts.push({
				type: "THINKING",
				thinking: active.accumulated.thinking,
			});
		}
		if (active.accumulated.text) {
			parts.push({
				type: "TEXT",
				text: active.accumulated.text,
				uiText: active.accumulated.text,
			});
		}

		if (parts.length === 0) {
			return null;
		}

		const output = await commitCancelledAskRoom(
			this.insightId,
			active.params,
			parts,
			note,
		);
		this._lastResponseMessageId = output.responseMessage.messageId;

		return toRoomAskResult(output);
	}

	/**
	 * Abandon the in-flight turn locally without telling the backend — for a
	 * caller walking away (e.g. an unmounting panel), not a user-initiated
	 * stop. The backend's job keeps running and nothing is persisted; prefer
	 * {@link stop} when the user asked to stop.
	 */
	abandon(): void {
		this._activeAsk?.controller.abort();
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
