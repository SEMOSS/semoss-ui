import { ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Markdown,
	Spinner,
} from "@semoss/ui/next";

/** Collapsible reasoning summary matching Playground's secondary treatment. */
export function MessageThinkingPart({
	text,
	isStreaming = false,
}: {
	text: string;
	isStreaming?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const expanded = isStreaming || isOpen;

	return (
		<Collapsible
			open={expanded}
			onOpenChange={(nextOpen) => {
				if (!isStreaming) setIsOpen(nextOpen);
			}}
			className="overflow-hidden rounded-lg border bg-muted/50"
		>
			<CollapsibleTrigger className="flex w-full items-center gap-2 p-2 text-start text-muted-foreground text-xs hover:bg-accent">
				{isStreaming ? (
					<Spinner
						aria-hidden="true"
						className="size-4 motion-reduce:animate-none"
					/>
				) : (
					<Sparkles aria-hidden="true" className="size-4" />
				)}
				<span className="flex-1 font-medium">Thinking</span>
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"size-4 transition-transform",
						expanded && "rotate-180",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="border-t p-2">
				<Markdown className="text-muted-foreground text-xs [&>:first-child]:mt-0 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_h4]:text-xs [&_li]:text-xs [&_p]:mt-3 [&_p]:text-xs [&_p]:leading-5">
					{text}
				</Markdown>
			</CollapsibleContent>
		</Collapsible>
	);
}
