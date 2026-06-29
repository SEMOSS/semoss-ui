import { observer } from "mobx-react-lite";
import type React from "react";
import { type ChunkStatus, useActiveIndex } from "@/hooks";
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

	/**
	 * Animation status for this part, controlled by the parent message queue.
	 * - "active": this part may animate; its internal chunk queue runs
	 * - "done": the message moved past this part — all chunks render in full
	 *
	 * The parent never renders a "not_started" text part.
	 */
	status: ChunkStatus;

	/**
	 * Called when this part has caught up to its current content so the parent
	 * message queue can advance. Fires whenever the internal chunk queue's last
	 * chunk catches up — the parent's guard decides whether to actually advance
	 * (it holds while this is the last part and the message is still streaming).
	 */
	onComplete: () => void;

	/**
	 * First time the user is seeing this message stream (vs returning to one
	 * already in progress). On a first view chunks animate from 0; on a return
	 * the chunk queue seeds at the latest chunk and the typewriter at the latest
	 * content, so we jump to the frontier instead of replaying.
	 */
	isFirstView: boolean;
}

/**
 * Orchestrates sequential chunk animation for a single text part, and reports
 * upward to the parent message queue when it has caught up.
 *
 * Parses `part.text` into ordered segments of `md` and `html` chunks on every
 * render. Chunks animate one at a time while this part is "active"; once the
 * parent marks it "done", every chunk renders its full content directly.
 */
export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, status, onComplete, isFirstView }) => {
		// This part feeds its internal chunk queue only while it's the active
		// part. Once "done", the internal queue snaps every chunk to full content.
		const isActive = status === "active";

		// Parse text into chunks on every render (pure, cheap function). The hook
		// bubbles `onComplete` to the parent message queue when the last chunk
		// catches up, so this part reports its own completion without extra wiring.
		// On a return view, seed at the latest chunk to jump to the frontier.
		const chunks = parseChunks(part.text);
		const { chunkCallbacks, getChunkStatus } = useActiveIndex(
			chunks.length,
			isActive,
			onComplete,
			!isFirstView,
		);

		// An empty text part has nothing to animate — report complete so the
		// parent can advance. While this is the last part and still streaming the
		// parent's guard holds it, so this is a no-op until content arrives or a
		// later part seals it.
		if (chunks.length === 0) {
			if (isActive) {
				onComplete();
			}
			return null;
		}

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
							isFirstView={isFirstView}
						/>
					);
				})}
			</>
		);
	},
);
