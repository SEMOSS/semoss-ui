import type { HTMLAttributes } from "react";
import { buildInitials, getAppCatalogAvatarStyle } from "./icon-utils";

interface AppCatalogAvatarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/** App / project name; drives both the initials and the hash-derived gradient. */
	name: string;
	/** Tailwind classes for the wrapper (sizing, rounding, etc.). */
	className?: string;
}

// Only structural defaults — callers must specify size (h-X/w-X or size-X), rounding,
// and text-size so Tailwind's CSS-cascade ordering can't surprise us.
const DEFAULT_CLASSES = "flex items-center justify-center font-semibold";

export const AppCatalogAvatar = ({
	name,
	className,
	...rest
}: AppCatalogAvatarProps) => {
	const label = name || "App";
	const classes = className
		? `${DEFAULT_CLASSES} ${className}`
		: DEFAULT_CLASSES;

	return (
		<div
			{...rest}
			className={classes}
			style={getAppCatalogAvatarStyle(label)}
		>
			{buildInitials(label)}
		</div>
	);
};
