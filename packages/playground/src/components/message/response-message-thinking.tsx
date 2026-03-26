import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { H1, H2, H3, H4, Markdown, P, Separator } from "@semoss/ui/next";
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

const COLLAPSED_HEIGHT = 96; // px - matches max-h-24 (6rem), ~3-4 lines

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
		const typewriter = useMarkdownTypewriter(part.thinking);
		const contentRef = useRef<HTMLDivElement>(null);
		const [showToggle, setShowToggle] = useState(false);
		const hasUserScrolledRef = useRef(false); // Once true, never auto-scroll again

		// Start typewriter on mount, skip to end when not the last part
		useEffect(() => {
			if (isLast && message.isThinking) {
				typewriter.start();
			} else if (!isLast && typewriter.isTyping) {
				typewriter.skipToEnd();
			}
		}, [
			isLast,
			message.isThinking,
			typewriter.start,
			typewriter.skipToEnd,
			typewriter.isTyping,
		]);

		// Handle content updates: check overflow and auto-scroll during typing
		// biome-ignore lint/correctness/useExhaustiveDependencies: need rendered to trigger on content changes
		useEffect(() => {
			if (!contentRef.current) return;

			// Check if content overflows to show/hide expand button
			const isOverflowing =
				contentRef.current.scrollHeight > COLLAPSED_HEIGHT;
			setShowToggle(isOverflowing);

			// Auto-scroll to bottom until user manually scrolls once
			if (!hasUserScrolledRef.current) {
				contentRef.current.scrollTop = contentRef.current.scrollHeight;
			}
		}, [typewriter.rendered]);

		// Detect manual scroll by user - disable auto-scroll permanently
		const handleScroll = () => {
			console.log("User scrolled, disabling auto-scroll");
			hasUserScrolledRef.current = true;
		};

		if (!part.thinking) return null;

		return (
			<div className="mb-2 rounded-lg border border-border text-muted-foreground text-sm shadow-sm">
				<div className="p-3">
					{/* Header - clickable to expand/collapse when content overflows */}
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="mb-2 flex w-full items-center justify-between text-left transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
						disabled={!showToggle}
					>
						<span className="font-medium">Thinking</span>
						{showToggle && (
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
						onScroll={handleScroll}
						className={`overflow-y-auto transition-[max-height] duration-300 ease-in-out ${
							isExpanded ? "max-h-96" : "max-h-24"
						}`}
					>
						<Markdown components={THINKING_MARKDOWN_COMPONENTS}>
							{typewriter.rendered}
						</Markdown>
					</div>
				</div>
			</div>
		);
	});
