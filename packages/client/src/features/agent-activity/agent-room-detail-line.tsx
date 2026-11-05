import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";

export interface AgentRoomDetailLineProps {
	/** The line's text, such as an id */
	children: ReactNode;
	/** The whole text, shown on hover when the line is cut short */
	title?: string;
	/** More classes, such as a width */
	className?: string;
}

/** A muted line under a name, such as its id, cut short when it does not fit */
export const AgentRoomDetailLine = ({
	children,
	title,
	className,
}: AgentRoomDetailLineProps) => (
	<span
		className={cn("truncate text-muted-foreground text-xs", className)}
		title={title}
	>
		{children}
	</span>
);
