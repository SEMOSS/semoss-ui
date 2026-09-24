import { ChevronDown, Sparkles } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Markdown,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import { useFollowScroll } from "../hooks/use-follow-scroll";
import { useStreamingText } from "../hooks/use-streaming-text";

/** Live reasoning that folds away when complete, without hiding keyboard focus. */
export function MessageThinkingPart({
	text,
	isStreaming = false,
	shouldFlush = false,
}: {
	text: string;
	isStreaming?: boolean;
	shouldFlush?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(isStreaming);
	const [hasContentFocus, setHasContentFocus] = useState(false);
	const { displayedText, isRevealing } = useStreamingText({
		text,
		isStreaming,
		shouldFlush,
	});
	const isActive = isStreaming || isRevealing;
	const scroll = useFollowScroll({
		resetKey: isActive ? "live" : "settled",
		initialFollow: isActive,
	});
	const wasActive = useRef(isActive);
	const pendingCollapse = useRef(false);

	useLayoutEffect(() => {
		if (wasActive.current !== isActive) {
			wasActive.current = isActive;
			pendingCollapse.current = !isActive;
			if (isActive) setIsOpen(true);
		}
		if (pendingCollapse.current && !hasContentFocus) {
			pendingCollapse.current = false;
			setIsOpen(false);
		}
	}, [isActive, hasContentFocus]);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={(open) => {
				pendingCollapse.current = false;
				setIsOpen(open);
			}}
			className="min-w-0 rounded-xl border border-border/50 bg-muted/20"
		>
			<CollapsibleTrigger className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-start transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none">
				{isActive ? (
					<Spinner
						aria-hidden="true"
						className="size-4 text-muted-foreground motion-reduce:animate-none"
					/>
				) : (
					<Sparkles
						aria-hidden="true"
						className="size-4 text-muted-foreground"
					/>
				)}
				<Muted className="flex-1 text-sm">Thinking</Muted>
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"size-4 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
						isOpen && "rotate-180",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent
				className="overflow-hidden duration-200 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none"
				onFocusCapture={() => setHasContentFocus(true)}
				onBlurCapture={(event) => {
					if (
						!(event.relatedTarget instanceof Node) ||
						!event.currentTarget.contains(event.relatedTarget)
					)
						setHasContentFocus(false);
				}}
			>
				<section
					ref={scroll.viewportRef}
					className="focus-visible:-outline-offset-2 max-h-40 overflow-auto px-3 pb-3 focus-visible:outline-2 focus-visible:outline-ring"
					aria-label="Thinking details"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: bounded reasoning needs keyboard scrolling
					tabIndex={0}
				>
					<div ref={scroll.contentRef}>
						<Markdown
							dir="auto"
							className="wrap-anywhere text-base text-muted-foreground [&>:first-child]:mt-0 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-base [&_h4]:text-base [&_li]:text-base [&_p]:mt-3 [&_p]:text-base [&_p]:leading-6"
						>
							{displayedText}
						</Markdown>
					</div>
				</section>
			</CollapsibleContent>
		</Collapsible>
	);
}
