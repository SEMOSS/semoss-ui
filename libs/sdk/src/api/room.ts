import type {
	PlaygroundMessage,
	PlaygroundRoomOptions,
	RoomAskAgentOptions,
	RoomAskAgentResult,
	RoomAskOptions,
	RoomAskResult,
	RoomStreamChunk,
	RunAgentOutput,
} from "../types";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	type PixelJobStreamingStatus,
} from "./base";
import {
	askRoom,
	createPlaygroundRoom,
	getRoomMessages,
	runAgentViaJobStream,
	setRoomForInsight,
	updateRoomOptions,
} from "./chat";

// Statuses that signal the streaming job has finished (success or failure).
const TERMINAL_STATUSES: PixelJobStreamingStatus[] = [
	"ProgressComplete",
	"Complete",
	"Canceled",
	"Error",
	"UnknownJob",
];

/**
 * Minimal shape of the AskPlayground settled output used internally to extract
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
 * @see sdk-playground skill for the full Room guide and chat-vs-agent comparison.
 */
export class Room {
	readonly roomId: string;
	readonly insightId: string;
	private _options: PlaygroundRoomOptions;
	/**
	 * Tracks the last response message ID so subsequent ask() calls
	 * automatically continue the same conversation thread.
	 */
	private _lastResponseMessageId: string = "ROOT_PLACEHOLDER_ID";

	private constructor(
		roomId: string,
		insightId: string,
		options: PlaygroundRoomOptions,
	) {
		this.roomId = roomId;
		this.insightId = insightId;
		this._options = options;
	}

	/** Current room configuration. */
	get options(): Readonly<PlaygroundRoomOptions> {
		return this._options;
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
	async updateOptions(
		options: Partial<PlaygroundRoomOptions>,
	): Promise<void> {
		const merged: PlaygroundRoomOptions = { ...this._options, ...options };
		await updateRoomOptions(this.insightId, this.roomId, [merged]);
		this._options = merged;
	}

	/**
	 * Fetch all persisted messages in this room.
	 *
	 * @returns The full message history.
	 */
	async getMessages(): Promise<PlaygroundMessage[]> {
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
	 * @see sdk-playground skill for the full streaming guide.
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
	 * Send a message via the server-side agent harness (RunAgent). The backend
	 * drives the full agentic loop; the client streams tokens as they arrive.
	 *
	 * Requires the room to have `harnessType: "semoss"` in its options.
	 *
	 * @param command - The message text to send.
	 * @param options - Streaming callback.
	 * @returns Settled message IDs, response text, status, and any artifacts.
	 * @see sdk-playground skill for the chat-vs-agent-harness guide.
	 */
	async askAgent(
		command: string,
		options: RoomAskAgentOptions = {},
	): Promise<RoomAskAgentResult> {
		const { onChunk } = options;

		const { jobId } = await runAgentViaJobStream(this.insightId, {
			engine: this._options.modelId,
			roomId: this.roomId,
			command,
		});

		await this._stream(jobId, onChunk);

		const { errors, results } =
			await getPixelAsyncResult<[RunAgentOutput]>(jobId);

		if (errors.length > 0) {
			throw new Error(errors.join(", "));
		}

		const output = results[0].output;

		if (output.waitTimedOut || output.status !== "COMPLETED") {
			throw new Error(`Agent run did not complete: ${output.status}`);
		}

		this._lastResponseMessageId = output.finalOutputMessageId;

		return {
			inputMessageId: output.inputMessageId,
			responseMessageId: output.finalOutputMessageId,
			text: output.finalText,
			status: output.status,
			artifacts: output.artifacts,
		};
	}

	// ---------------------------------------------------------------------------
	// Static factory
	// ---------------------------------------------------------------------------

	/**
	 * Create a new Room, bind it to the active insight, and return it ready to use.
	 * Prefer this over `new Room(...)` — it handles insight binding automatically.
	 *
	 * @param insightId - The active SEMOSS insight ID.
	 * @param workspaceId - Optional workspace to associate with the room.
	 * @returns A fully initialized Room instance.
	 */
	static async create(
		insightId: string,
		workspaceId?: string,
	): Promise<Room> {
		const playgroundRoom = await createPlaygroundRoom(
			insightId,
			workspaceId,
		);
		await setRoomForInsight(insightId, playgroundRoom.roomId);

		const defaultOptions: PlaygroundRoomOptions = {
			predefinedPrompts: [],
			instructions: "",
			mcp: [],
			modelId: "",
		};

		return new Room(playgroundRoom.roomId, insightId, defaultOptions);
	}
}

/**
 * Convenience wrapper around {@link Room.create}. Creates a new Room and binds
 * it to the active insight.
 *
 * @param insightId - The active SEMOSS insight ID.
 * @param workspaceId - Optional workspace to associate with the room.
 * @returns A fully initialized Room instance.
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
): Promise<Room> => Room.create(insightId, workspaceId);
