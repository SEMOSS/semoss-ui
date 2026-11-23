import type { ComponentProps } from "react";
import { cn } from "@semoss/ui/next";

/**
 * The one look of everything that floats over the map's canvas: the view bar,
 * the legend and the notices. A card's border and background with a slight
 * shadow, so it reads above the canvas in both themes.
 */
export const MapOverlayCard = ({
	className,
	...props
}: ComponentProps<"div">) => (
	<div
		className={cn(
			"rounded-lg border bg-card p-2 text-card-foreground shadow-sm",
			className,
		)}
		{...props}
	/>
);
