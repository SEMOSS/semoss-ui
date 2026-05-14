import { CopyIcon, SkipForwardIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";
import { getCommentSyntax } from "./response-message-text/clipboard";
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

interface CodeBlock {
	language: string;
	code: string;
}

/**
 * Extract all fenced code blocks from markdown text
 * Excludes HTML and mermaid blocks
 */
const extractCodeBlocks = (text: string): CodeBlock[] => {
	const blocks: CodeBlock[] = [];

	// Regex to match fenced code blocks: ```language\ncode\n```
	const fenceRegex = /```([a-zA-Z0-9_-]+)?\s*\r?\n([\s\S]*?)(?:\r?\n```|$)/g;

	let match: RegExpExecArray | null = fenceRegex.exec(text);
	while (match !== null) {
		const language = match[1]?.toLowerCase() || "txt";
		const code = match[2].trim();

		// Exclude HTML preview and mermaid diagrams
		if (language !== "html" && language !== "mermaid" && code) {
			blocks.push({ language, code });
		}
		match = fenceRegex.exec(text);
	}

	return blocks;
};

export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const { t } = useTranslation("chat");

		// ── Code block extraction for "Copy All Code" feature ───────────────────
		const codeBlocks = useMemo(() => {
			return extractCodeBlocks(part.text);
		}, [part.text]);

		const hasMultipleCodeBlocks = codeBlocks.length > 1;

		const handleCopyAllCode = async () => {
			if (codeBlocks.length === 0) return;

			// Concatenate all code blocks with language separators
			const concatenated = codeBlocks
				.map(({ language, code }) => {
					const comment = getCommentSyntax(language);
					const closingComment =
						language === "html" || language === "xml" ? " -->" : "";

					return `${comment} --- ${language.toUpperCase()} ---${closingComment}\n${code}`;
				})
				.join("\n\n");

			try {
				await navigator.clipboard.writeText(concatenated);
				toast.success(t("notifications.copySuccess"));
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unable to copy";
				toast.error(message);
			}
		};

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

		// ── Code-fenced HTML detection ───────────────────────────────────────────
		// Detect the first ```html…``` block directly in part.text so that
		// HtmlPreviewBlock mounts as soon as the fence appears during streaming.
		const fencedHtmlData = useMemo(() => {
			if (isHtmlResponse) return null;
			const m = FENCED_HTML_RE.exec(part.text);
			if (!m) return null;
			const isClosed = m[0].endsWith("```");
			const postStart = isClosed ? m.index + m[0].length : -1;
			return {
				preFenceProse: part.text.slice(0, m.index),
				fencedHtmlContent: m[1],
				fencedHtmlClosed: isClosed,
				postFenceProse:
					postStart !== -1
						? part.text.slice(postStart).trimStart()
						: "",
			};
		}, [isHtmlResponse, part.text]);
		const hasFencedHtml = !!fencedHtmlData;

		// ── Standalone-HTML split ────────────────────────────────────────────────
		const htmlEndMatch = isHtmlResponse
			? /(<\/html\s*>)/i.exec(part.text)
			: null;
		const htmlPart = isHtmlResponse
			? htmlEndMatch
				? part.text.slice(
						0,
						htmlEndMatch.index + htmlEndMatch[0].length,
					)
				: part.text
			: "";
		const standaloneHtml = isHtmlResponse ? htmlPart.trim() : null;

		// ── Post-block prose ─────────────────────────────────────────────────────
		// Unified: after </html> for standalone, after closing ``` for fenced.
		const postHtmlProse =
			isHtmlResponse && htmlEndMatch
				? part.text
						.slice(htmlEndMatch.index + htmlEndMatch[0].length)
						.trimStart()
				: "";
		const postBlockProse = isHtmlResponse
			? postHtmlProse
			: (fencedHtmlData?.postFenceProse ?? "");

		// ── Typewriters ──────────────────────────────────────────────────────────
		const typewriter = useMarkdownTypewriter(part.text);
		const renderedText = typewriter.isTyping
			? typewriter.rendered
			: part.text;

		const postTypewriter = useMarkdownTypewriter(postBlockProse);
		const [postProseStarted, setPostProseStarted] = useState(false);

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
				part.text,
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
		useEffect(() => {
			if (message.isThinking && isLast) typewriter.start();
		}, [message.isThinking, typewriter.start, isLast]);

		// No text to animate for standalone-HTML responses.
		useEffect(() => {
			if (isHtmlResponse) typewriter.skipToEnd();
		}, [isHtmlResponse, typewriter.skipToEnd]);

		useEffect(() => {
			if (!isLast) typewriter.skipToEnd();
		}, [isLast, typewriter.skipToEnd]);

		// Start post-block prose animation when it first appears during a live stream.
		// Historical messages (isThinking=false) must NOT start the typewriter.
		useEffect(() => {
			if (
				isLast &&
				message.isThinking &&
				(isHtmlResponse || hasFencedHtml) &&
				postBlockProse &&
				!postProseStarted
			) {
				setPostProseStarted(true);
				postTypewriter.start();
			}
		}, [
			isLast,
			message.isThinking,
			isHtmlResponse,
			hasFencedHtml,
			postBlockProse,
			postProseStarted,
			postTypewriter.start,
		]);

		useEffect(() => {
			if (!isLast) postTypewriter.skipToEnd();
		}, [isLast, postTypewriter.skipToEnd]);

		const isAnyTyping =
			(typewriter.isTyping || postTypewriter.isTyping) &&
			!message.isThinking &&
			isLast;

		const urlTransform = (url: string) => {
			if (url.startsWith("room://")) return url;
			if (/^(https?:|mailto:|#)/.test(url)) return url;
			return "";
		};

		return (
			<>
				{hasMultipleCodeBlocks && !message.isThinking && (
					<div className="mb-3 flex justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopyAllCode}
							aria-label="Copy all code blocks"
							className="gap-2"
						>
							<CopyIcon className="size-4" />
							Copy All Code ({codeBlocks.length})
						</Button>
					</div>
				)}
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
						{postBlockProse &&
							(postProseStarted ||
								!isLast ||
								!message.isThinking) && (
								<Markdown
									components={components}
									className="[&>*:first-child]:mt-0"
									urlTransform={urlTransform}
								>
									{postTypewriter.isTyping
										? postTypewriter.rendered
										: postBlockProse}
								</Markdown>
							)}
					</>
				) : hasFencedHtml ? (
					<>
						{fencedHtmlData?.preFenceProse && (
							<Markdown
								components={components}
								className="[&>*:first-child]:mt-0"
								urlTransform={urlTransform}
							>
								{typewriter.isTyping &&
								typewriter.rendered.length <
									(fencedHtmlData?.preFenceProse.length ?? 0)
									? typewriter.rendered
									: fencedHtmlData?.preFenceProse}
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
						{postBlockProse &&
							(postProseStarted ||
								!isLast ||
								!message.isThinking) && (
								<Markdown
									components={components}
									className="[&>*:first-child]:mt-0"
									urlTransform={urlTransform}
								>
									{postTypewriter.isTyping
										? postTypewriter.rendered
										: postBlockProse}
								</Markdown>
							)}
					</>
				) : (
					<Markdown
						components={components}
						className="[&>*:first-child]:mt-0"
						urlTransform={urlTransform}
					>
						{renderedText}
					</Markdown>
				)}
				{isAnyTyping && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="absolute right-4 bottom-4 z-50">
								<Button
									size="icon-sm"
									variant={"outline"}
									disabled={!part.text}
									onClick={() => {
										typewriter.skipToEnd();
										postTypewriter.skipToEnd();
									}}
									aria-label="Fast Forward to End"
									className="shadow-lg"
								>
									<SkipForwardIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.fastForwardToEnd")}
						</TooltipContent>
					</Tooltip>
				)}
			</>
		);
	},
);
