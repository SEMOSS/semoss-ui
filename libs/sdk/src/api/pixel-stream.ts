import type {
	PixelStreamMessage,
	PixelStreamToolMessage,
	PixelStreamUsageMessage,
} from "./base";

/** What to do with each kind of chunk a streaming pixel job yields. */
export interface PixelStreamHandlers {
	/** Text the model wrote. Empty text is skipped. */
	onText?: (text: string) => void;
	/** Reasoning the model wrote. Empty reasoning is skipped. */
	onThinking?: (thinking: string) => void;
	/** A tool call delta, as the model streamed it, its closing chunk included. */
	onTool?: (data: PixelStreamToolMessage["data"]) => void;
	/** Token counts for the turn. */
	onUsage?: (usage: PixelStreamUsageMessage["data"]) => void;
}

/**
 * Hand one streamed chunk to the handler for its kind, so every chat reads a
 * stream the same way. A chunk of a kind this SDK does not know is ignored
 * rather than taken for another kind.
 *
 * @param chunk - One entry of a streaming job's `message`.
 * @param handlers - What to do with each kind; a kind without one is skipped.
 */
export const readPixelStreamChunk = (
	chunk: PixelStreamMessage,
	handlers: PixelStreamHandlers,
): void => {
	switch (chunk.stream_type) {
		case "content":
			if (chunk.data.content) handlers.onText?.(chunk.data.content);
			return;
		case "thinking":
			if (chunk.data.thinking) handlers.onThinking?.(chunk.data.thinking);
			return;
		case "tool":
			handlers.onTool?.(chunk.data);
			return;
		case "usage":
			handlers.onUsage?.(chunk.data);
			return;
	}
};
