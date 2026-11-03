import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { Button, cn } from "@semoss/ui/next";
import type { UsageLimitGuideProps } from "./usage-limit-guide";
import { USAGE_LIMIT_GUIDE_TITLE } from "./usage-limit-guide-content";
import { UsageLimitGuideSheet } from "./usage-limit-guide-sheet";

/** Props for {@link UsageLimitGuideButton}. */
export interface UsageLimitGuideButtonProps
	extends Omit<UsageLimitGuideProps, "className"> {
	/** The button's text, in place of "How Usage Limits Work" */
	label?: string;
	/** Classes for the button */
	className?: string;
}

/**
 * A button that opens How Usage Limits Work in a side sheet, at the host's
 * section. Every place usage limits are set or shown puts one beside them.
 */
export const UsageLimitGuideButton = ({
	label = USAGE_LIMIT_GUIDE_TITLE,
	className,
	...guide
}: UsageLimitGuideButtonProps) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className={cn("text-muted-foreground", className)}
				onClick={() => setIsOpen(true)}
			>
				<CircleHelp aria-hidden="true" />
				{label}
			</Button>
			<UsageLimitGuideSheet
				open={isOpen}
				onOpenChange={setIsOpen}
				{...guide}
			/>
		</>
	);
};
