import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Markdown } from "@semoss/ui/next";
import { type ChunkStatus, useRoot } from "@/hooks";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import { createMarkdownComponents } from "./create-markdown-components";

interface ResponseMessageTextMdProps {
	/** Full content of this markdown chunk (may grow during streaming). */
	content: string;

	/**
	 * Animation status for this chunk, controlled by the parent.
	 * - "not_started": waiting in queue, renders nothing
	 * - "active": currently animating with the typewriter
	 * - "done": finished (or message no longer streaming), renders full content directly
	 */
	status: ChunkStatus;

	/** The response message (for room access and isThinking). */
	message: ResponseMessageStore;

	/** Called when animation completes so the parent can advance to the next chunk. */
	onComplete: () => void;

	/**
	 * First time the user is seeing this message stream. On a first view the
	 * typewriter animates from 0; on a return it baselines at the content present
	 * on mount, so already-streamed text shows instantly and only new tokens type.
	 */
	isFirstView: boolean;
}

export const ResponseMessageTextMd: React.FC<ResponseMessageTextMdProps> =
	observer(({ content, status, message, onComplete, isFirstView }) => {
		const { root } = useRoot();

		// ── Typewriter ────────────────────────────────────────────────────────────
		// On a first view the typewriter animates the whole chunk from 0 (even if
		// some content buffered before this chunk's turn came up); on a return view
		// it baselines at the content present on mount, so already-streamed text
		// shows instantly and only net-new tokens animate (jump to latest, no
		// replay). `typewriter.rendered` is the full text revealed so far.
		const typewriter = useMarkdownTypewriter(content, !isFirstView);

		// While active, show what the typewriter has revealed; otherwise (done)
		// render the full content directly.
		const fullRenderedText =
			status === "active" ? typewriter.rendered : content;

		// ── Markdown components ───────────────────────────────────────────────────
		const isPreviewLoading = status !== "done";
		const components = useMemo(
			() => createMarkdownComponents(message.room, isPreviewLoading),
			[message.room, isPreviewLoading],
		);

		// ── URL transform ─────────────────────────────────────────────────────────
		const urlTransform = (url: string) => {
			if (url.startsWith("room://")) return url;
			if (
				root.theme.allowedUrlPrefixes?.some((prefix) =>
					url.startsWith(prefix),
				)
			)
				return url;
			if (/^(https?:|mailto:|#)/.test(url)) return url;
			return "";
		};

		// ── Effects ───────────────────────────────────────────────────────────────

		// Drive the typewriter while this chunk is active:
		// - If the typewriter has caught up to current content, report onComplete
		//   (parent decides whether to actually advance based on whether this is the
		//   last chunk + isThinking).
		// - Otherwise, if it isn't running, start it.
		(() => {
			if (status !== "active") return;

			const caughtUp =
				!typewriter.isTyping &&
				typewriter.rendered.length >= content.length;

			if (caughtUp) {
				onComplete();
				return;
			}

			if (!typewriter.isTyping) {
				typewriter.start();
			}
		})();

		// ── Render ────────────────────────────────────────────────────────────────
		// not_started chunks render nothing — they mount invisibly and wait for
		// their status to flip to "active", at which point the typewriter baselines
		// (from 0 on a first view, or from current content on a return).
		if (status === "not_started") {
			return null;
		}

		return (
			<Markdown
				dir="auto"
				components={components}
				// wrap-anywhere: breaks long tokens and collapses min-width so they don't overflow the scroll area
				className="wrap-anywhere [&>*:first-child]:mt-0"
				urlTransform={urlTransform}
			>
				{fullRenderedText}
			</Markdown>
		);
	});
