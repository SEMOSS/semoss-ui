import type { ReactNode } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Props for {@link TooltipIconButton}. */
interface TooltipIconButtonProps {
	/** The button's accessible name, and its tooltip unless `tooltip` is given. */
	label: string;
	/** The icon the button shows; mark it `aria-hidden`. */
	icon: ReactNode;
	/** What the tooltip says, when it says more than `label`. */
	tooltip?: string;
	/** Runs when the button is pressed. */
	onClick?: () => void;
	/** Whether the button can be pressed. */
	disabled?: boolean;
}

/**
 * An icon button with a tooltip, in Tools' headers and rows. Never submits
 * the Settings form it sits in. The tooltip stays open while the pointer
 * moves onto it, so it can be read.
 */
export const TooltipIconButton = ({
	label,
	icon,
	tooltip = label,
	onClick,
	disabled,
}: TooltipIconButtonProps) => (
	<Tooltip disableHoverableContent={false}>
		<TooltipTrigger asChild>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="shrink-0"
				aria-label={label}
				disabled={disabled}
				onClick={onClick}
			>
				{icon}
			</Button>
		</TooltipTrigger>
		<TooltipContent className="max-w-64 text-wrap text-xs">
			{tooltip}
		</TooltipContent>
	</Tooltip>
);
