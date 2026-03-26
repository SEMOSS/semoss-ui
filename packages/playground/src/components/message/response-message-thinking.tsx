import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { H1, H2, H3, H4, Markdown, P, Separator } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageThinkingPart } from "@/types";

const THINKING_MARKDOWN_COMPONENTS = {
	h1: ({ children, ...props }) => (
		<H1 className="text-inherit text-sm" {...props}>
			{children}
		</H1>
	),
	h2: ({ children, ...props }) => (
		<H2 className="mt-2 text-inherit text-sm" {...props}>
			{children}
		</H2>
	),
	h3: ({ children, ...props }) => (
		<H3 className="mt-2 text-inherit text-sm" {...props}>
			{children}
		</H3>
	),
	h4: ({ children, ...props }) => (
		<H4 className="mt-2 text-inherit text-sm" {...props}>
			{children}
		</H4>
	),
	h5: ({ children, ...props }) => (
		<h5
			className="mt-1 scroll-m-20 font-medium text-inherit text-sm tracking-tight"
			{...props}
		>
			{children}
		</h5>
	),
	h6: ({ children, ...props }) => (
		<h6
			className="mt-1 scroll-m-20 font-medium text-inherit text-sm tracking-tight"
			{...props}
		>
			{children}
		</h6>
	),
	p: ({ children, ...props }) => (
		<P className="mt-1 text-inherit text-sm" {...props}>
			{children}
		</P>
	),
	a: ({ children, href, ...props }) => (
		<a
			href={href}
			className="font-medium text-primary text-sm underline underline-offset-1"
			target="_blank"
			rel="noopener noreferrer"
			{...props}
		>
			{children}
		</a>
	),
	ul: ({ children, ...props }) => (
		<ul
			className="my-1 ml-4 list-disc text-inherit text-sm [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ml-4 list-decimal text-inherit text-sm [&>li]:mt-1"
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="text-inherit text-sm" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }) => (
		<Quote className="mt-1" {...props}>
			{children}
		</Quote>
	),
	hr: ({ ...props }) => <Separator className="mt-2 mb-1" {...props} />,
};

interface ResponseMessageThinkingProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Thinking to render */
	part: PixelMessageThinkingPart;

	/** Is it the last part */
	isLast: boolean;
}

/**
 * Displays AI thinking content with typewriter effect.
 *
 * Features:
 * - Shows collapsed preview (~3-4 lines) by default
 * - Auto-scrolls to show newest content as it types
 * - Expands to full view when user clicks (if content overflows)
 * - Smooth CSS transitions for expand/collapse
 */
export const ResponseMessageThinking: React.FC<ResponseMessageThinkingProps> =
	observer(({ message, part, isLast }) => {
		const [isExpanded, setIsExpanded] = useState(false);
		const [isOverflowing, setIsOverflowing] = useState(false);
		const typewriter = useMarkdownTypewriter(part.thinking);
		const contentRef = useRef<HTMLDivElement>(null);
		const hasUserScrolledRef = useRef(false);
		const isProgrammaticScrollRef = useRef(false);
		const { loadingMessage } = useLoadingMessage(isLast);

		const displayedThinking = typewriter.isTyping
			? typewriter.rendered
			: part.thinking;
		// While actively thinking, the card is always expanded and cannot be collapsed.
		const effectiveExpanded = isLast ? true : isExpanded;

		// Control typewriter. When streaming ends, reset scroll to top so the
		// completed card reads from the beginning when the user expands it.
		useEffect(() => {
			if (isLast && message.isThinking) {
				typewriter.start();
			} else {
				typewriter.skipToEnd();
				if (contentRef.current) {
					contentRef.current.scrollTop = 0;
				}
				hasUserScrolledRef.current = false;
			}
		}, [
			isLast,
			message.isThinking,
			typewriter.start,
			typewriter.skipToEnd,
		]);

		// Update overflow indicator and auto-scroll to bottom while streaming.
		// biome-ignore lint/correctness/useExhaustiveDependencies: need displayedThinking to trigger on content changes
		useEffect(() => {
			if (!contentRef.current) return;

			setIsOverflowing(
				contentRef.current.scrollHeight >
					contentRef.current.clientHeight,
			);

			if (!effectiveExpanded || !isLast || hasUserScrolledRef.current) {
				return;
			}

			isProgrammaticScrollRef.current = true;
			contentRef.current.scrollTop = contentRef.current.scrollHeight;
			requestAnimationFrame(() => {
				isProgrammaticScrollRef.current = false;
			});
		}, [displayedThinking, effectiveExpanded, isLast]);

		// Reset scroll to top whenever the card collapses.
		useEffect(() => {
			if (!effectiveExpanded && contentRef.current) {
				contentRef.current.scrollTop = 0;
			}
		}, [effectiveExpanded]);

		// Detect manual scroll by user — disable auto-scroll for this stream.
		const handleScroll = () => {
			if (isProgrammaticScrollRef.current) return;
			hasUserScrolledRef.current = true;
		};

		return (
			<div
				className={`relative mb-2 rounded-lg border border-border text-muted-foreground text-sm shadow-sm ${
					effectiveExpanded ? "" : "cursor-pointer"
				}`}
			>
				{!effectiveExpanded && (
					<button
						type="button"
						className="absolute inset-0 z-10"
						onClick={() => setIsExpanded(true)}
						aria-label="Expand thinking"
					/>
				)}
				<div
					className={
						effectiveExpanded || !isOverflowing ? "p-3" : "p-3 pb-0"
					}
				>
					{/* Header - collapse disabled while actively thinking */}
					<button
						type="button"
						onClick={() => !isLast && setIsExpanded(!isExpanded)}
						disabled={isLast}
						className="mb-2 flex w-full items-center justify-between text-left transition-colors enabled:hover:text-foreground disabled:cursor-default"
					>
						<span className="font-medium">Thinking</span>
						{!isLast && (
							<span className="flex items-center gap-1 text-xs">
								{isExpanded ? (
									<>
										Show less
										<ChevronUp className="h-3 w-3" />
									</>
								) : (
									<>
										Show more
										<ChevronDown className="h-3 w-3" />
									</>
								)}
							</span>
						)}
					</button>
					{/* Content area - auto-scrolls to show new text, smooth transition between heights */}
					<div
						ref={contentRef}
						onScroll={effectiveExpanded ? handleScroll : undefined}
						className={`relative ${effectiveExpanded ? "overflow-y-auto" : "overflow-hidden"} transition-[max-height] duration-300 ease-in-out ${
							// Smaller cap while actively streaming; full height when manually expanded
							isLast
								? "max-h-40"
								: isExpanded
									? "max-h-96"
									: "max-h-11.5"
						}`}
					>
						{displayedThinking ? (
							<Markdown components={THINKING_MARKDOWN_COMPONENTS}>
								{displayedThinking}
							</Markdown>
						) : (
							<div>{loadingMessage}</div>
						)}
						{!effectiveExpanded && isOverflowing && (
							<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-5 bg-linear-to-t from-background to-transparent" />
						)}
					</div>
				</div>
			</div>
		);
	});
