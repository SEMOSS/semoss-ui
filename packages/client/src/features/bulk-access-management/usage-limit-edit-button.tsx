import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Button, cn } from "@semoss/ui/next";

/** Props for {@link UsageLimitEditButton}. */
export interface UsageLimitEditButtonProps {
	/**
	 * Whose limit it is, said before the summary to screen readers only, such
	 * as "Usage limit for Data" or "Model Total". The button's name is this and
	 * all of the summary's text, a "Was ..." line included.
	 */
	context: string;
	/** The limit's summary */
	children: ReactNode;
	/** Whether the limit cannot be opened now */
	disabled?: boolean;
	/** Classes for the button, such as a wider limit than a table cell's */
	className?: string;
	/** Called to open the limit */
	onClick: () => void;
}

/**
 * A usage limit's summary as the button that opens it, with a pencil so it
 * reads as something to change. Used wherever a limit is changed in place: the
 * rows of Bulk Access Management, the Teams table on a model and the Model
 * Usage Limits card. Its accessible name is its visible text, after the
 * context, so a screen reader hears what was there before a change too.
 */
export const UsageLimitEditButton = ({
	context,
	children,
	disabled = false,
	className,
	onClick,
}: UsageLimitEditButtonProps) => (
	<Button
		type="button"
		variant="ghost"
		size="sm"
		className={cn(
			"group h-auto max-w-64 justify-start gap-2 whitespace-normal px-2 py-1",
			className,
		)}
		disabled={disabled}
		onClick={onClick}
	>
		<span className="sr-only">{context}: </span>
		{children}
		<Pencil
			className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground"
			aria-hidden
		/>
	</Button>
);
