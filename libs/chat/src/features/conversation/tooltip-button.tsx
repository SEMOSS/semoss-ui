import type { ComponentProps, ReactNode } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Props for {@link TooltipButton}: the button's own, plus its tooltip. */
type TooltipButtonProps = ComponentProps<typeof Button> & {
	/** What the tooltip says. */
	tooltip: ReactNode;
	/** Where the tooltip shows; above the button unless given. */
	tooltipSide?: "top" | "right" | "bottom" | "left";
	/** Whether the tooltip stays open while the pointer moves onto it. */
	isTooltipHoverable?: boolean;
};

/**
 * A button with a tooltip. Every other prop goes to the button. A disabled
 * button shows no tooltip, as the browser sends it no pointer events.
 */
export const TooltipButton = ({
	tooltip,
	tooltipSide,
	isTooltipHoverable = false,
	...props
}: TooltipButtonProps) => (
	<Tooltip disableHoverableContent={isTooltipHoverable ? false : undefined}>
		<TooltipTrigger asChild>
			<Button {...props} />
		</TooltipTrigger>
		<TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
	</Tooltip>
);
