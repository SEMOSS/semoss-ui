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
 * render. Chunks animate one at a time — each subcomponent calls `onComplete`
 * when it finishes, advancing `activeIndex` to the next chunk.
 *
 * Chunk keys are stable (start offset in text), so React reuses subcomponents
 * across re-parses rather than remounting them as content grows.
 */
export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const isThinking = message.isThinking && isLast;

		// Parse text into chunks on every render (pure, cheap function).
		const chunks = parseChunks(part.text, isThinking);

		// Index of the chunk currently allowed to animate.
		const [activeIndex, setActiveIndex] = useState(0);

		// Called by each subcomponent when its animation is complete.
		// Guards against duplicate or stale onComplete calls: only advances when
		// the completed chunk is actually the current active one.
		// activeIndex may temporarily sit one past the last chunk — that's fine.
		// When the next chunk streams in with that index it becomes active immediately.
		const handleChunkComplete = useCallback((completedIndex: number) => {
			setActiveIndex((current) => {
				if (completedIndex !== current) return current;
				return completedIndex + 1;
			});
		}, []);

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
			[chunks.length, handleChunkComplete],
		);

		// Derives the animation status for a chunk at the given index.
		// When the message is no longer streaming, all chunks are "done" —
		// they render their full content immediately without animation.
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
							isLast={isLast && idx === chunks.length - 1}
							onComplete={chunkCallbacks[idx]}
						/>
					);
				})}
			</>
		);
	},
);
