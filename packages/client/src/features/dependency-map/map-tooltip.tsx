import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";

/** Props for {@link MapTooltip}. */
interface MapTooltipProps {
	/** What the tooltip says: the control's name, or a short hint */
	label: ReactNode;
	/** The one control it describes, which takes the trigger's props */
	children: ReactNode;
}

/**
 * A map control's name in a tooltip, for the icon controls of the toolbar and
 * the view bar. The control keeps its own accessible name; the tooltip only
 * shows it to pointer and keyboard users.
 */
export const MapTooltip = ({ label, children }: MapTooltipProps) => (
	<Tooltip>
		<TooltipTrigger asChild>{children}</TooltipTrigger>
		<TooltipContent>{label}</TooltipContent>
	</Tooltip>
);
