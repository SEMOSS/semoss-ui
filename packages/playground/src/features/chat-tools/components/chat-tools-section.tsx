import { type ReactNode, useId } from "react";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H4,
} from "@semoss/ui/next";
import { ROW_CHEVRON } from "./chat-tool-row";
import { SectionInfoTooltip } from "./section-info-tooltip";

/** Props for {@link ChatToolsSection}. */
export interface ChatToolsSectionProps {
	/** The section's heading. */
	title: string;
	/** How many rows its list holds, when it lists any. */
	count?: number;
	/** What the section holds, shown in an info tooltip beside the title. */
	tooltip?: string;
	/** Controls at the end of the header. */
	actions?: ReactNode;
	/** The section's rows, notes, or lists. */
	children?: ReactNode;
	/**
	 * Heading level: a section of its own, or part of a larger one such as
	 * Settings' Tools. Defaults to a section of its own.
	 */
	level?: 4 | 5;
}

/**
 * One group of tools in Settings' Tools: a header that opens and closes the
 * group, with its title, an info tooltip saying what it holds, how many rows
 * it lists, and any actions at the end. Every group in Tools uses it, so
 * they read and work the same way. Groups start open.
 */
export const ChatToolsSection = ({
	title,
	count,
	tooltip,
	actions,
	children,
	level = 4,
}: ChatToolsSectionProps) => {
	const headingId = useId();
	const Heading = level === 4 ? H4 : "h5";
	return (
		<section aria-labelledby={headingId} className="min-w-0">
			<Collapsible defaultOpen className="flex min-w-0 flex-col gap-3">
				<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
					<Heading
						id={headingId}
						className={cn(
							"min-w-0",
							level === 4 ? "text-base" : "font-medium text-sm",
						)}
					>
						{/* the ring is inset, so it does not shift the header */}
						<CollapsibleTrigger className="group -ms-1 flex min-w-0 items-center gap-1.5 rounded-md py-1 ps-1 pe-1.5 text-start hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
							{ROW_CHEVRON}
							<span className="truncate">{title}</span>
						</CollapsibleTrigger>
					</Heading>
					{tooltip ? (
						<SectionInfoTooltip label={title}>
							{tooltip}
						</SectionInfoTooltip>
					) : null}
					{count !== undefined && (
						<Badge variant="secondary" className="tabular-nums">
							{count}
						</Badge>
					)}
					{actions ? (
						<div className="ms-auto flex min-w-0 items-center gap-2">
							{actions}
						</div>
					) : null}
				</div>
				<CollapsibleContent className="flex min-w-0 flex-col gap-3">
					{children}
				</CollapsibleContent>
			</Collapsible>
		</section>
	);
};
