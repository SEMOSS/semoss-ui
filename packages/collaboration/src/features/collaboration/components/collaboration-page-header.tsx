import type { ReactNode } from "react";
import { cn, H1, P } from "@semoss/ui/next";

interface CollaborationPageHeaderProps {
	/** The current page or record name. */
	title: ReactNode;
	/** Supporting purpose or context for the page. */
	description?: ReactNode;
	/** Page-level controls aligned beside the heading when space permits. */
	actions?: ReactNode;
	/** Adapt heading and action placement to the owning surface's available space. */
	layoutClassName?: string;
	/** Page-header spacing supplied by an owning workbench. */
	className?: string;
	/** Adapt the title to compact workbench heights while retaining heading semantics. */
	titleClassName?: string;
	/** Related metadata or filters below the heading. */
	children?: ReactNode;
}

/** Consistent page hierarchy, matching the landing Brief's heading and action rhythm. */
export function CollaborationPageHeader({
	title,
	description,
	actions,
	layoutClassName,
	className,
	titleClassName,
	children,
}: CollaborationPageHeaderProps) {
	return (
		<header className={cn("mb-8 space-y-4", className)}>
			<div
				className={cn(
					"flex flex-wrap items-start justify-between gap-x-8 gap-y-4",
					layoutClassName,
				)}
			>
				<div className="min-w-0 max-w-3xl flex-1 space-y-2">
					<H1
						className={cn(
							"break-words font-medium text-2xl leading-snug tracking-tight 2xl:text-3xl",
							titleClassName,
						)}
					>
						{title}
					</H1>
					{description && (
						<P className="max-w-prose text-muted-foreground text-sm leading-relaxed">
							{description}
						</P>
					)}
				</div>
				{actions && (
					<div className="flex flex-wrap items-center gap-2">
						{actions}
					</div>
				)}
			</div>
			{children}
		</header>
	);
}
