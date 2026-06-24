import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";
import { Markdown } from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { ChunkStatus } from "../response-message-text";
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
}

export const ResponseMessageTextMd: React.FC<ResponseMessageTextMdProps> =
	observer(({ content, status, message, onComplete }) => {
		const { root } = useRoot();

		// ── Content tracking ──────────────────────────────────────────────────────
		// Snapshot content that existed at mount so the typewriter only animates
		// content that arrives *after* this component mounted. This handles the
		// navigate-away-and-return case — on remount the typewriter starts from
		// whatever the chunk already contains.
		const contentOnMountRef = useRef(content);

		// Content that arrived after this component mounted (the part to animate)
		const newContent = content.slice(contentOnMountRef.current.length);

		// ── Typewriter ────────────────────────────────────────────────────────────
		const typewriter = useMarkdownTypewriter(newContent);

		// ── Derived rendered text ──────────────────────────────────────────────
		// While actively animating new content, splice in the typewriter output.
		// The `rendered.length < newContent.length` guard bridges the one-render
		// gap where isTyping is still false but the start() effect hasn't fired yet.
		const fullRenderedText =
			status === "active" &&
			newContent.length > 0 &&
			(typewriter.isTyping ||
				typewriter.rendered.length < newContent.length)
				? contentOnMountRef.current + typewriter.rendered
				: content;

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
		// - If there's unrendered content and the typewriter isn't running, start it.
		// - If the typewriter has caught up, report onComplete (parent decides whether
		//   to actually advance based on whether this is the last chunk + isThinking).
		useEffect(() => {
			if (status !== "active") return;

			if (newContent.length === 0) {
				onComplete();
				return;
			}

			const caughtUp =
				!typewriter.isTyping &&
				typewriter.rendered.length >= newContent.length;

			if (caughtUp) {
				onComplete();
				return;
			}

			// New content arrived while typewriter was idle — restart it
			if (!typewriter.isTyping) {
				typewriter.start();
			}
		}, [
			status,
			typewriter.isTyping,
			typewriter.rendered.length,
			newContent.length,
			onComplete,
			typewriter.start,
		]);

		// ── Render ────────────────────────────────────────────────────────────────
		// not_started chunks render nothing — they mount invisibly and wait for
		// their status to flip to "active", at which point contentOnMountRef
		// captures the current content and only net-new tokens get animated.
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
