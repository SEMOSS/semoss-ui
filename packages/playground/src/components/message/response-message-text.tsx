import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";
import { parseChunks } from "./response-message-text/parse-chunks";
import { ResponseMessageTextHtml } from "./response-message-text/response-message-text-html";
import { ResponseMessageTextMd } from "./response-message-text/response-message-text-md";

export type ChunkStatus = "done" | "active" | "not_started";

interface ResponseMessageTextProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Text part to render */
	part: PixelMessageTextPart;

	/** Is it the last part of the message */
	isLast: boolean;
}

/**
 * Orchestrates sequential chunk animation for a single text part.
 *
 * Parses `part.text` into ordered segments of `md` and `html` chunks on every
 * render. Chunks animate one at a time — each child calls `onComplete` when its
 * typewriter catches up, but the parent only advances `activeIndex` if a next
 * chunk exists or streaming has fully ended.
 */
export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const isThinking = message.isThinking && isLast;

		// Parse text into chunks on every render (pure, cheap function).
		const chunks = parseChunks(part.text);

		// Index of the chunk currently allowed to animate.
		const [activeIndex, setActiveIndex] = useState(0);

		// Called by each subcomponent when its animation is complete.
		// Guards against duplicate or stale onComplete calls: only advances when
		// the completed chunk is actually the current active one.
		// If this is the last chunk and we're still receiving tokens (isThinking),
		// hold — the typewriter caught up mid-stream and should wait for more content.
		// A next chunk existing means this chunk is sealed by the parser, so advance freely.
		const handleChunkComplete = useCallback(
			(completedIndex: number) => {
				setActiveIndex((current) => {
					if (completedIndex !== current) return current;
					if (completedIndex === chunks.length - 1 && isThinking)
						return current;
					return completedIndex + 1;
				});
			},
			[chunks.length, isThinking],
		);

		// Stable per-chunk callbacks — each function identity is preserved across
		// re-renders as long as chunk count doesn't change. This prevents effects
		// in children that dep on `onComplete` from firing on every streaming token
		// just because the parent re-rendered.
		// `chunks` is a new array every render (parseChunks is pure and runs fresh
		// each time), so using it as a dep would defeat the purpose — we only need
		// to regenerate callbacks when the number of chunks changes.
		// biome-ignore lint/correctness/useExhaustiveDependencies: chunks is intentionally replaced with chunks.length — see comment above
		const chunkCallbacks = useMemo(
			() => chunks.map((_, idx) => () => handleChunkComplete(idx)),
			// handleChunkComplete already captures chunks.length and isThinking
			[chunks.length, handleChunkComplete],
		);

		// Derives the animation status for a chunk at the given index.
		// Once streaming ends (!isThinking), all remaining chunks render their full
		// content immediately rather than animating sequentially.
		const getChunkStatus = (index: number): ChunkStatus => {
			if (!isThinking || activeIndex > index) return "done";
			if (activeIndex === index) return "active";
			return "not_started";
		};

		return (
			<>
				{chunks.map((chunk, idx) => {
					if (chunk.type === "html") {
						return (
							<ResponseMessageTextHtml
								key={chunk.key}
								html={chunk.content}
								status={getChunkStatus(idx)}
								room={message.room}
								onComplete={chunkCallbacks[idx]}
							/>
						);
					}

					return (
						<ResponseMessageTextMd
							key={chunk.key}
							content={chunk.content}
							status={getChunkStatus(idx)}
							message={message}
							onComplete={chunkCallbacks[idx]}
						/>
					);
				})}
			</>
		);
	},
);
