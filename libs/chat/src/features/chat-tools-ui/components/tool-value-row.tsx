import type { ReactNode } from "react";
import { Small } from "@semoss/ui/next";

/** Props for {@link ToolValueRow}. */
export interface ToolValueRowProps {
	/** What the value is, such as "File". */
	label: string;
	/** The value, such as a path. */
	value: ReactNode;
}

/**
 * A labelled single value, such as a path. Long values wrap anywhere rather
 * than widening the card.
 */
export const ToolValueRow = ({ label, value }: ToolValueRowProps) => (
	<div className="flex min-w-0 flex-col gap-0.5">
		<Small className="text-muted-foreground">{label}</Small>
		<span className="break-all font-mono text-sm">{value}</span>
	</div>
);
