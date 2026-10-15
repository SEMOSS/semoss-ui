import type { ReactNode } from "react";
import { cn, FieldDescription, Muted, Small } from "@semoss/ui/next";

export interface AgentReadOnlyValueProps {
	/** Field label shown above the value. */
	label: string;
	/** The value. Blank strings and null render `emptyLabel` instead. */
	children?: ReactNode;
	/** Text shown when there is no value. */
	emptyLabel?: string;
	/** Preserves line breaks and caps the height, for long prose like instructions. */
	multiline?: boolean;
	/** Help text under the value. */
	description?: ReactNode;
}

/**
 * A label and its value as plain text, used in view mode in place of a
 * disabled input so values stay at full contrast.
 */
export const AgentReadOnlyValue = ({
	label,
	children,
	emptyLabel = "Not set",
	multiline,
	description,
}: AgentReadOnlyValueProps) => {
	const isEmpty =
		children == null ||
		children === false ||
		(typeof children === "string" && children.trim() === "");

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<Small>{label}</Small>
			{isEmpty ? (
				<Muted className="font-normal">{emptyLabel}</Muted>
			) : (
				<div
					className={cn(
						"wrap-break-word text-foreground text-sm leading-relaxed",
						multiline &&
							"max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3",
					)}
				>
					{children}
				</div>
			)}
			{description && <FieldDescription>{description}</FieldDescription>}
		</div>
	);
};
