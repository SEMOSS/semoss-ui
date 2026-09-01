import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@semoss/ui/next";

interface ModelChatThinkingProps {
	/** The reasoning content to show. */
	thinking: string;
	/** Whether the turn this belongs to is still streaming. */
	isStreaming: boolean;
}

/**
 * Collapsible extended-thinking card. Collapsed by default so reasoning never
 * pushes the answer off screen; the collapsed body fades out rather than
 * cutting mid-line.
 *
 * @name ModelChatThinking
 * @return The reasoning card.
 */
export const ModelChatThinking = ({
	thinking,
	isStreaming,
}: ModelChatThinkingProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="relative rounded-lg border border-border p-3 text-muted-foreground text-sm shadow-sm">
			<button
				type="button"
				className="flex w-full items-center justify-between text-start transition-colors hover:text-foreground"
				aria-expanded={isExpanded}
				onClick={() => setIsExpanded((current) => !current)}
			>
				<span
					className={cn(
						"font-medium",
						isStreaming && "animate-pulse",
					)}
				>
					{isStreaming ? "Thinking…" : "Thinking"}
				</span>
				<span className="flex items-center gap-1 text-xs">
					{isExpanded ? "Show less" : "Show more"}
					{isExpanded ? (
						<ChevronUpIcon className="size-3" aria-hidden />
					) : (
						<ChevronDownIcon className="size-3" aria-hidden />
					)}
				</span>
			</button>

			<div
				className={cn(
					"wrap-break-word relative mt-2 whitespace-pre-wrap text-xs",
					isExpanded
						? "max-h-96 overflow-y-auto"
						: "max-h-12 overflow-hidden",
				)}
			>
				{thinking}
				{!isExpanded && (
					<div
						className="pointer-events-none absolute start-0 end-0 bottom-0 h-5 bg-linear-to-t from-background to-transparent"
						aria-hidden
					/>
				)}
			</div>
		</div>
	);
};
