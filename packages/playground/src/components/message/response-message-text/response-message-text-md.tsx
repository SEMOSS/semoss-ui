import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Markdown } from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import { createMarkdownComponents } from "./create-markdown-components";

interface ResponseMessageTextMdProps {
	/** Full content of this markdown chunk (may grow during streaming). */
	content: string;

	/**
	 * True when this chunk is the currently-animating one.
	 * When false and `isDone` is also false, the chunk is waiting in queue
	 * and should render nothing (or render content directly without animation).
	 */
	isActive: boolean;

	/**
	 * True when this chunk has already finished animating (index < activeIndex).
	 * Renders content directly without a typewriter.
	 */
	isDone: boolean;

	/**
	 * True when no more tokens will arrive for this chunk.
	 * onComplete is only called when both the typewriter has caught up AND
	 * isFinalized is true.
	 */
	isFinalized: boolean;

	/** The response message (for room access and isThinking). */
	message: ResponseMessageStore;

	/**
	 * True when this is the last part of the last message.
	 * Drives isPreviewLoading for code blocks (Mermaid, CodePreviewBlock).
	 */
	isLast: boolean;

	/** Called when animation completes and the chunk is finalized. */
	onComplete: () => void;
}

export const ResponseMessageTextMd: React.FC<ResponseMessageTextMdProps> =
	observer(
		({
			content,
			isActive,
			isDone,
			isFinalized,
			message,
			isLast,
			onComplete,
		}) => {
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
				isActive &&
				newContent.length > 0 &&
				(typewriter.isTyping ||
					typewriter.rendered.length < newContent.length)
					? contentOnMountRef.current + typewriter.rendered
					: content;

			// ── Markdown components ───────────────────────────────────────────────────
			const isPreviewLoading = isLast && message.isThinking;
			const components = useMemo(
				() => createMarkdownComponents(message.room, isPreviewLoading),
				[message.room, isPreviewLoading],
			);

			// ── URL transform ─────────────────────────────────────────────────────────
			const urlTransform = useCallback(
				(url: string) => {
					if (url.startsWith("room://")) return url;
					if (
						root.theme.allowedUrlPrefixes?.some((prefix) =>
							url.startsWith(prefix),
						)
					)
						return url;
					if (/^(https?:|mailto:|#)/.test(url)) return url;
					return "";
				},
				[root.theme.allowedUrlPrefixes],
			);

			// ── Effects ───────────────────────────────────────────────────────────────

			// Track whether the typewriter has been started for the current activation.
			// Reset whenever isActive flips on so a re-activation starts fresh.
			const typewriterStartedRef = useRef(false);
			useEffect(() => {
				if (isActive) {
					typewriterStartedRef.current = false;
				}
			}, [isActive]);

			// biome-ignore lint/correctness/useExhaustiveDependencies: typewriter.start is stable (useCallback with empty deps) — omitting it is safe and prevents spurious re-triggers
			useEffect(() => {
				if (!isActive) return;

				if (newContent.length > 0) {
					if (!typewriterStartedRef.current) {
						typewriterStartedRef.current = true;
						typewriter.start();
					}
				} else if (isFinalized) {
					// No new content to animate and already finalized — complete immediately
					onComplete();
				}
			}, [isActive, newContent.length, isFinalized]);

			// Skip animation for done chunks (e.g. when isLast prop changes)
			useEffect(() => {
				if (isDone) {
					typewriter.skipToEnd();
				}
			}, [isDone, typewriter.skipToEnd]);

			// Once the entire message has finished streaming, skip the typewriter to
			// end so the full chunk content is shown immediately rather than slowly
			// trickling in. We intentionally wait for the whole message (not just
			// this chunk) to be done — intermediate chunks should animate naturally
			// at their own pace while the LLM is still producing tokens.
			const isStreaming = isLast && message.isThinking;
			// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally fires only when isStreaming flips — adding isActive/newContent.length/typewriter.skipToEnd would cause skipToEnd to fire on every token, breaking the typewriter
			useEffect(() => {
				if (!isActive) return;
				if (isStreaming) return;
				if (!isFinalized) return;
				if (newContent.length === 0) return;
				// Skip to end — this sets renderedLength = newContent.length and
				// stops isRunning, which will trigger the caught-up effect below.
				typewriter.skipToEnd();
			}, [isStreaming, isFinalized]);

			// Fire onComplete when typewriter has caught up AND chunk is finalized.
			// Only fires when there is actual new content to animate — the "no new
			// content" path is handled by the start effect above (calling onComplete
			// directly when isFinalized and newContent is empty), preventing a premature
			// complete before the typewriter has had a chance to start.
			useEffect(() => {
				if (!isActive) return;
				if (newContent.length === 0) return;
				const caughtUp =
					!typewriter.isTyping &&
					typewriter.rendered.length >= newContent.length;
				if (caughtUp && isFinalized) {
					onComplete();
				}
			}, [
				isActive,
				typewriter.isTyping,
				typewriter.rendered.length,
				newContent.length,
				isFinalized,
				onComplete,
			]);

			// ── Render ────────────────────────────────────────────────────────────────
			// Waiting chunks (isActive=false, isDone=false) are skipped — they will
			// mount and receive isActive=true when their turn comes, at which point
			// contentOnMountRef captures the chunk's current content and only new
			// tokens animate.
			if (!isActive && !isDone) {
				return null;
			}

			return (
				<Markdown
					dir="auto"
					components={components}
					className="[&>*:first-child]:mt-0"
					urlTransform={urlTransform}
				>
					{fullRenderedText}
				</Markdown>
			);
		},
	);
