import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";
import { parseChunks } from "./response-message-text/parse-chunks";
import { ResponseMessageTextHtml } from "./response-message-text/response-message-text-html";
import { ResponseMessageTextMd } from "./response-message-text/response-message-text-md";

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
		const isStreaming = message.isThinking && isLast;

		// Parse text into chunks on every render (pure, cheap function).
		const chunks = parseChunks(part.text, isStreaming);

		// Index of the chunk currently allowed to animate.
		const [activeIndex, setActiveIndex] = useState(0);

		// Tracks whether onComplete fired before the next chunk existed.
		// When chunks grow (a new chunk is appended), this state lets us advance.
		const [pendingAdvance, setPendingAdvance] = useState(false);

		// When a new chunk is appended and there's a pending advance, advance now.
		useEffect(() => {
			if (pendingAdvance && activeIndex < chunks.length - 1) {
				setPendingAdvance(false);
				setActiveIndex((i) => i + 1);
			}
		}, [pendingAdvance, chunks.length, activeIndex]);

		// Called by each subcomponent when its animation is complete.
		const handleChunkComplete = useCallback(
			(completedIndex: number) => {
				if (completedIndex + 1 < chunks.length) {
					setActiveIndex(completedIndex + 1);
				} else {
					// The next chunk hasn't appeared yet — set flag so it advances
					// as soon as a new chunk is appended.
					setPendingAdvance(true);
				}
			},
			[chunks.length],
		);

		return (
			<>
				{chunks.map((chunk, idx) => {
					const isActive = idx === activeIndex;
					const isDone = idx < activeIndex;

					if (chunk.type === "html") {
						return (
							<ResponseMessageTextHtml
								key={chunk.key}
								html={chunk.content}
								isFinalized={chunk.isFinalized}
								isActive={isActive}
								isDone={isDone}
								room={message.room}
								message={message}
								onComplete={() => handleChunkComplete(idx)}
							/>
						);
					}

					return (
						<ResponseMessageTextMd
							key={chunk.key}
							content={chunk.content}
							isFinalized={chunk.isFinalized}
							isActive={isActive}
							isDone={isDone}
							message={message}
							isLast={isLast && idx === chunks.length - 1}
							onComplete={() => handleChunkComplete(idx)}
						/>
					);
				})}
			</>
		);
	},
);
