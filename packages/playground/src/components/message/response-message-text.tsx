import { observer } from "mobx-react-lite";
import type React from "react";
import { useActiveIndex } from "@/hooks";
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
 * render. Chunks animate one at a time — each child calls `onComplete` when its
 * typewriter catches up, but the parent only advances `activeIndex` if a next
 * chunk exists or streaming has fully ended.
 */
export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const isThinking = message.isThinking && isLast;

		// Parse text into chunks on every render (pure, cheap function).
		const chunks = parseChunks(part.text);
		const { chunkCallbacks, getChunkStatus } = useActiveIndex(
			chunks.length,
			isThinking,
		);

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
