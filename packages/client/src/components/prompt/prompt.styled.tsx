import type React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";

export const StyledStepPaper = ({
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className="m-2 h-full rounded-md border bg-card p-8 shadow-sm"
		{...props}
	>
		{children}
	</div>
);

export const StyledTextPaper = ({
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className="mt-6 min-h-[50%] rounded-md border-2 border-gray-300 px-2 py-3"
		{...props}
	>
		{children}
	</div>
);

interface StyledTooltipProps {
	title: React.ReactNode;
	children: React.ReactElement;
	disableBorder?: boolean;
}

export const StyledTooltip = ({
	title,
	children,
}: StyledTooltipProps) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent className="border bg-background p-0 text-foreground">
				{title}
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);
