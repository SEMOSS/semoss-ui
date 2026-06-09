import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { Markdown } from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";
import { FENCED_HTML_RE } from "./response-message-text/constants";
import { createMarkdownComponents } from "./response-message-text/create-markdown-components";
import { HtmlPreviewBlock } from "./response-message-text/html-preview-block";

interface ResponseMessageTextProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Thinking to render */
	part: PixelMessageTextPart;

	/** Is it the last part */
	isLast: boolean;
}

export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const { t } = useTranslation("chat");
		const { root } = useRoot();

		// ── Content tracking for remount ─────────────────────────────────────────
		// Track content that existed when component mounted so we can skip animating it
		const contentOnMountRef = useRef(part.text);

		// ── Standalone-HTML detection ────────────────────────────────────────────
		// Sticky: once the response opens with <!DOCTYPE (no code fence), stay in
		// standalone-HTML mode for the lifetime of this message.
		const isHtmlResponseRef = useRef(false);
		if (!isHtmlResponseRef.current) {
			const trimmed = part.text.trimStart();
			if (!trimmed.includes("```") && /^<!DOCTYPE\s/i.test(trimmed)) {
				isHtmlResponseRef.current = true;
			}
		}
		const isHtmlResponse = isHtmlResponseRef.current;

		// ── Typewriters ──────────────────────────────────────────────────────────
		// Animate only new content that arrives after mount
		const newContent = part.text.slice(contentOnMountRef.current.length);
		const typewriter = useMarkdownTypewriter(newContent);

		// Combine base content with animated new content
		const fullRenderedText =
			message.isThinking && isLast && typewriter.isTyping
				? contentOnMountRef.current + typewriter.rendered
				: part.text;

		// ── Code-fenced HTML detection ───────────────────────────────────────────
		// Detect fence position in part.text (expensive regex, cached).
		// Extract content from fullRenderedText (cheap slicing, respects typewriter).
		const fenceMatch = useMemo(() => {
			if (isHtmlResponse) return null;
			const m = FENCED_HTML_RE.exec(part.text);
			if (!m) return null;
			return {
				fullMatch: m[0],
				htmlContent: m[1],
				index: m.index,
			};
		}, [isHtmlResponse, part.text]);

		const fencedHtmlData = useMemo(() => {
			if (!fenceMatch) return null;
			const isClosed = fenceMatch.fullMatch.endsWith("```");
			const postStart = isClosed
				? fenceMatch.index + fenceMatch.fullMatch.length
				: -1;
			return {
				preFenceProse: fullRenderedText.slice(0, fenceMatch.index),
				fencedHtmlContent: fenceMatch.htmlContent,
				fencedHtmlClosed: isClosed,
				postFenceProse:
					postStart !== -1
						? fullRenderedText.slice(postStart).trimStart()
						: "",
			};
		}, [fenceMatch, fullRenderedText]);
		const hasFencedHtml = !!fencedHtmlData;

		// ── Standalone-HTML split ────────────────────────────────────────────────
		const htmlEndMatch = isHtmlResponse
			? /(<\/html\s*>)/i.exec(fullRenderedText)
			: null;
		const htmlPart = isHtmlResponse
			? htmlEndMatch
				? fullRenderedText.slice(
						0,
						htmlEndMatch.index + htmlEndMatch[0].length,
					)
				: fullRenderedText
			: "";
		const standaloneHtml = isHtmlResponse ? htmlPart.trim() : null;

		// ── Post-block prose ─────────────────────────────────────────────────────
		// Unified: after </html> for standalone, after closing ``` for fenced.
		const postHtmlProse =
			isHtmlResponse && htmlEndMatch
				? fullRenderedText
						.slice(htmlEndMatch.index + htmlEndMatch[0].length)
						.trimStart()
				: "";
		const postBlockProse = isHtmlResponse
			? postHtmlProse
			: (fencedHtmlData?.postFenceProse ?? "");

		// Track post-prose content on mount for the same reason as main content
		const postProseOnMountRef = useRef(postBlockProse);
		const newPostProse = postBlockProse.slice(
			postProseOnMountRef.current.length,
		);
		const postTypewriter = useMarkdownTypewriter(newPostProse);
		const fullRenderedPostProse =
			message.isThinking && isLast && postTypewriter.isTyping
				? postProseOnMountRef.current + postTypewriter.rendered
				: postBlockProse;

		// ── isPreviewLoading for code-fenced HTML ────────────────────────────────
		const inlineScriptInFenced =
			hasFencedHtml &&
			/<script(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script\s*>/i.test(
				fencedHtmlData?.fencedHtmlContent ?? "",
			);
		const fencedIsPreviewLoading =
			isLast &&
			message.isThinking &&
			!(fencedHtmlData?.fencedHtmlClosed ?? false) &&
			!inlineScriptInFenced;

		// ── isPreviewLoading for standalone HTML ─────────────────────────────────
		const inlineScriptComplete =
			isHtmlResponse &&
			/<script(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script\s*>/i.test(
				fullRenderedText,
			);
		const standaloneIsPreviewLoading =
			isLast &&
			message.isThinking &&
			!htmlEndMatch &&
			!inlineScriptComplete;

		// isPreviewLoading passed to Markdown components (for non-HTML code blocks).
		const isPreviewLoading =
			isLast && (message.isThinking || typewriter.isTyping);

		const components = useMemo(
			() => createMarkdownComponents(message.room, isPreviewLoading),
			[message.room, isPreviewLoading],
		);

		// ── Effects ──────────────────────────────────────────────────────────────
		// Start main typewriter when streaming and there's new content
		useEffect(() => {
			if (message.isThinking && isLast && newContent.length > 0) {
				typewriter.start();
			}
		}, [message.isThinking, typewriter.start, isLast, newContent.length]);

		// No text to animate for standalone-HTML responses.
		useEffect(() => {
			if (isHtmlResponse) typewriter.skipToEnd();
		}, [isHtmlResponse, typewriter.skipToEnd]);

		useEffect(() => {
			if (!isLast) typewriter.skipToEnd();
		}, [isLast, typewriter.skipToEnd]);

		// Start post-block prose animation when there's new post-prose content
		useEffect(() => {
			if (
				isLast &&
				message.isThinking &&
				(isHtmlResponse || hasFencedHtml) &&
				newPostProse.length > 0
			) {
				postTypewriter.start();
			}
		}, [
			isLast,
			message.isThinking,
			isHtmlResponse,
			hasFencedHtml,
			newPostProse.length,
			postTypewriter.start,
		]);

		useEffect(() => {
			if (!isLast) postTypewriter.skipToEnd();
		}, [isLast, postTypewriter.skipToEnd]);

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

		return (
			<>
				{standaloneHtml ? (
					<>
						<HtmlPreviewBlock
							html={standaloneHtml}
							room={message.room}
							isLoading={standaloneIsPreviewLoading}
							copyTooltip="Copy"
							copySuccessMessage={t("notifications.copySuccess")}
							copyLabel="Copy"
						/>
						{postBlockProse && (
							<Markdown
								dir="auto"
								components={components}
								className="[&>*:first-child]:mt-0"
								urlTransform={urlTransform}
							>
								{fullRenderedPostProse}
							</Markdown>
						)}
					</>
				) : hasFencedHtml ? (
					<>
						{fencedHtmlData?.preFenceProse && (
							<Markdown
								dir="auto"
								components={components}
								className="[&>*:first-child]:mt-0"
								urlTransform={urlTransform}
							>
								{fencedHtmlData?.preFenceProse}
							</Markdown>
						)}
						<HtmlPreviewBlock
							html={fencedHtmlData?.fencedHtmlContent ?? ""}
							room={message.room}
							isLoading={fencedIsPreviewLoading}
							copyTooltip="Copy"
							copySuccessMessage={t("notifications.copySuccess")}
							copyLabel="Copy"
						/>
						{postBlockProse && (
							<Markdown
								dir="auto"
								components={components}
								className="[&>*:first-child]:mt-0"
								urlTransform={urlTransform}
							>
								{fullRenderedPostProse}
							</Markdown>
						)}
					</>
				) : (
					<Markdown
						dir="auto"
						components={components}
						className="[&>*:first-child]:mt-0"
						urlTransform={urlTransform}
					>
						{fullRenderedText}
					</Markdown>
				)}
			</>
		);
	},
);
