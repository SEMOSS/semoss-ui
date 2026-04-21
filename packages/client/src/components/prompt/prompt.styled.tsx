import type React from "react";
import { cn } from "@semoss/ui/next";

export const StyledStepPaper = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("m-1 h-full bg-background p-8 shadow-sm", className)}
		{...props}
	>
		{children}
	</div>
);

export const StyledTextPaper = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"mt-6 min-h-[50%] border-2 border-muted px-2 py-3",
			className,
		)}
		{...props}
	>
		{children}
	</div>
);

// Controlled tooltip used in PromptSetToken; hover tooltip used elsewhere.
// Renders children always; shows title as absolute popup when open=true.
export const StyledTooltip = ({
	title,
	children,
	open,
	disableHoverListener,
}: {
	title: React.ReactNode;
	children: React.ReactElement;
	disableBorder?: boolean;
	open?: boolean;
	disableHoverListener?: boolean;
}) => {
	if (!disableHoverListener) {
		// Simple hover tooltip via CSS group
		return (
			<span className="group/tooltip relative inline-block">
				{children}
				<span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden min-w-max rounded border border-border bg-background px-2 py-1 text-xs shadow-md group-hover/tooltip:block">
					{title}
				</span>
			</span>
		);
	}
	// Controlled popup (open prop)
	return (
		<span className="relative inline-block">
			{children}
			{open && (
				<span className="absolute bottom-full left-0 z-50 mb-1 min-w-max rounded bg-background shadow-md">
					{title}
				</span>
			)}
		</span>
	);
};
