import { CheckIcon } from "lucide-react";

/**
 * The mark of an item the host already holds: a filled check, as a checked
 * box has. It is decoration; what shows it says what it means.
 */
export const ConnectorSavedMark = () => (
	<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
		<CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />
	</span>
);
