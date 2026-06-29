import { ChevronDown, ChevronUp } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	type ComponentProps,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
	ScrollArea,
	Separator,
} from "@semoss/ui/next";
import { type ChunkStatus, useLoadingMessage } from "@/hooks";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageThinkingPart } from "@/types";

type MarkdownComponents = NonNullable<
	ComponentProps<typeof Markdown>["components"]
>;

const THINKING_MARKDOWN_COMPONENTS: MarkdownComponents = {
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
			className="my-1 ms-4 list-disc text-inherit text-sm [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ms-4 list-decimal text-inherit text-sm [&>li]:mt-1"
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
		<blockquote
			className="mt-1 border-border border-s-2 ps-3 text-inherit text-sm italic"
			{...props}
		>
			{children}
		</blockquote>
	),
	hr: ({ ...props }) => <Separator className="mt-2 mb-1" {...props} />,
};

interface ResponseMessageThinkingProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Thinking to render */
	part: PixelMessageThinkingPart;

	/**
	 * Animation status for this part, controlled by the parent message queue.
	 * - "not_started": waiting for the part above to finish — renders nothing
	 * - "active": currently streaming — types live and stays expanded
	 * - "done": message moved past this part — snaps to full content
	 */
	status: ChunkStatus;
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
	observer(({ part, status }) => {
		// This part is actively streaming only while the parent has it "active".
		// "done" means the message moved on (next part arrived or streaming ended).
		const isStreaming = status === "active";
		const [isExpanded, setIsExpanded] = useState(false);
		const [isOverflowing, setIsOverflowing] = useState(false);
		const typewriter = useMarkdownTypewriter(part.thinking);
		const contentRef = useRef<HTMLDivElement | null>(null);
		const hasUserScrolledRef = useRef(false);
		const isProgrammaticScrollRef = useRef(false);
		const { loadingMessage } = useLoadingMessage(isStreaming, undefined, 1);

		const displayedThinking = typewriter.isTyping
			? typewriter.rendered
			: part.thinking;
		// While actively thinking, the card is always expanded and cannot be collapsed.
		const effectiveExpanded = isStreaming || isExpanded;
		const canToggleExpansion =
			!isStreaming && (isOverflowing || isExpanded);

		// Control typewriter. When streaming ends, reset scroll to top so the
		// completed card reads from the beginning when the user expands it.
		useEffect(() => {
			if (isStreaming) {
				typewriter.start();
			} else {
				typewriter.skipToEnd();
				if (contentRef.current) {
					contentRef.current.scrollTop = 0;
				}
				hasUserScrolledRef.current = false;
			}
		}, [isStreaming, typewriter.start, typewriter.skipToEnd]);

		// Update overflow indicator synchronously before paint to avoid the
		// false→true flash on initial render. Auto-scroll is kept in a
		// separate useEffect since it doesn't need to block painting.
		// biome-ignore lint/correctness/useExhaustiveDependencies: need displayedThinking to trigger on content changes
		useLayoutEffect(() => {
			if (!contentRef.current) return;
			setIsOverflowing(
				contentRef.current.scrollHeight >
					contentRef.current.clientHeight,
			);
		}, [displayedThinking, effectiveExpanded]);

		// Auto-scroll to bottom while streaming (can happen after paint).
		// biome-ignore lint/correctness/useExhaustiveDependencies: need displayedThinking to trigger on content changes
		useEffect(() => {
			if (
				!contentRef.current ||
				!effectiveExpanded ||
				!isStreaming ||
				hasUserScrolledRef.current
			) {
				return;
			}

			isProgrammaticScrollRef.current = true;
			contentRef.current.scrollTop = contentRef.current.scrollHeight;
			requestAnimationFrame(() => {
				isProgrammaticScrollRef.current = false;
			});
		}, [displayedThinking, effectiveExpanded, isStreaming]);

		useEffect(() => {
			if (!contentRef.current || !effectiveExpanded) return;

			const currentContentRef = contentRef.current;
			const handleScroll = () => {
				if (isProgrammaticScrollRef.current) return;
				hasUserScrolledRef.current = true;
			};

			currentContentRef.addEventListener("scroll", handleScroll, {
				passive: true,
			});

			return () => {
				currentContentRef.removeEventListener("scroll", handleScroll);
			};
		}, [effectiveExpanded]);

		// Reset scroll to top whenever the card collapses.
		useEffect(() => {
			if (!effectiveExpanded && contentRef.current) {
				contentRef.current.scrollTop = 0;
			}
		}, [effectiveExpanded]);

		// Waiting for the part above to finish typing — render nothing until active.
		if (status === "not_started") {
			return null;
		}

		return (
			<div
				className={`relative mb-2 rounded-lg border border-border text-muted-foreground text-sm shadow-sm ${
					effectiveExpanded || !canToggleExpansion
						? ""
						: "cursor-pointer"
				}`}
			>
				{!effectiveExpanded && canToggleExpansion && (
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
						onClick={() =>
							canToggleExpansion && setIsExpanded(!isExpanded)
						}
						disabled={!canToggleExpansion}
						className="mb-2 flex w-full items-center justify-between text-start transition-colors enabled:hover:text-foreground disabled:cursor-default"
					>
						<span className="font-medium">Thinking</span>
						{canToggleExpansion && (
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
					{/* Content area: ScrollArea when expanded for styled scrollbar; plain clipped div when collapsed */}
					{effectiveExpanded ? (
						<ScrollArea
							viewportRef={(ele) => {
								contentRef.current = ele;
								if (ele) {
									ele.style.maxHeight = isStreaming
										? "10rem"
										: "24rem";
								}
							}}
							type="always"
						>
							<div className="-mt-1 pe-3">
								{displayedThinking ? (
									<Markdown
										dir="auto"
										components={
											THINKING_MARKDOWN_COMPONENTS
										}
									>
										{displayedThinking}
									</Markdown>
								) : (
									<P className="mt-1 animate-pulse text-inherit text-sm">
										{loadingMessage}
									</P>
								)}
							</div>
						</ScrollArea>
					) : (
						<div className="relative">
							<div
								ref={contentRef}
								className="-mt-1 max-h-11.5 overflow-hidden"
							>
								{/* don't need loadingMessage check here because loadingMessage only shows before streaming, so effectiveExpanded is true */}
								<Markdown
									dir="auto"
									components={THINKING_MARKDOWN_COMPONENTS}
								>
									{displayedThinking}
								</Markdown>
							</div>
							{isOverflowing && (
								<div className="pointer-events-none absolute start-0 end-0 bottom-0 h-5 bg-linear-to-t from-background to-transparent" />
							)}
						</div>
					)}
				</div>
			</div>
		);
	});
