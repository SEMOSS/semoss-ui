import { Badge } from "@semoss/ui/next";

/** Props for {@link ToolCountBadge}. */
interface ToolCountBadgeProps {
	/** How many rows a section or group holds. */
	count: number;
}

/**
 * How many rows a section or group of Tools holds. Two digits wide at least,
 * so the counts line up down a list.
 */
export const ToolCountBadge = ({ count }: ToolCountBadgeProps) => (
	<Badge variant="secondary" className="min-w-8 shrink-0 tabular-nums">
		{count}
	</Badge>
);
