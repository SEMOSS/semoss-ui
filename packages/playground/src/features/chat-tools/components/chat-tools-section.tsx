import { type ReactNode, useId } from "react";
import { Badge, cn, H4, Muted } from "@semoss/ui/next";

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
	/**
	 * Heading level: a section of its own, or part of a larger one such as
	 * Settings' Tools. Defaults to a section of its own.
	 */
	level?: 4 | 5;
}

/**
 * One group of tools, headed the way Settings heads its Knowledge and
 * Toolboxes: the title and its count, with any actions at the end.
 */
export const ChatToolsSection = ({
	title,
	count,
	description,
	actions,
	children,
	level = 4,
}: ChatToolsSectionProps) => {
	const headingId = useId();
	const Heading = level === 4 ? H4 : "h5";
	return (
		<section
			aria-labelledby={headingId}
			className="flex min-w-0 flex-col gap-3"
		>
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<Heading
						id={headingId}
						className={cn(
							"flex min-w-0 items-center gap-2",
							level === 4 ? "text-base" : "font-medium text-sm",
						)}
					>
						<span className="truncate">{title}</span>
						{count !== undefined && (
							<Badge variant="secondary">{count}</Badge>
						)}
					</Heading>
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
