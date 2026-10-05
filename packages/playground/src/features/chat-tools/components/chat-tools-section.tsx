import { type ReactNode, useId } from "react";
import { Badge, H4, Muted } from "@semoss/ui/next";

/** Props for {@link ChatToolsSection}. */
export interface ChatToolsSectionProps {
	/** The section's heading. */
	title: string;
	/** How many tools or toolboxes it holds, when it lists any. */
	count?: number;
	/** What the section holds. */
	description?: string;
	/** Controls beside the heading. */
	actions?: ReactNode;
	/** The section's rows, notes, or lists. */
	children?: ReactNode;
}

/**
 * One group of the panel, headed the way Room Settings heads its Knowledge
 * and Tools: the title and its count, with any actions at the end.
 */
export const ChatToolsSection = ({
	title,
	count,
	description,
	actions,
	children,
}: ChatToolsSectionProps) => {
	const headingId = useId();
	return (
		<section
			aria-labelledby={headingId}
			className="flex min-w-0 flex-col gap-3"
		>
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<H4
						id={headingId}
						className="flex min-w-0 items-center gap-2 text-base"
					>
						<span className="truncate">{title}</span>
						{count !== undefined && (
							<Badge variant="secondary">{count}</Badge>
						)}
					</H4>
					{actions}
				</div>
				{description && (
					<Muted className="font-normal">{description}</Muted>
				)}
			</div>
			{children}
		</section>
	);
};
