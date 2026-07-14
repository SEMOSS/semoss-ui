import type { HTMLAttributes } from "react";

/**
 * Ported verbatim from @semoss/shared (libs/shared/src/components/app-catalog-avatar.tsx
 * + the buildInitials/getAppCatalogAvatarStyle helpers from its icon-utils.ts) as part of
 * decoupling @semoss/chat from @semoss/shared — see docs/chat-components/PLAN.md. Pure
 * initials+color-from-string logic, no asset/image dependency, so it ports unchanged.
 */

const hashString = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
};

const buildInitials = (label: string): string => {
	const tokens = label.split(/[^A-Za-z0-9]+/).filter((token) => token.length);
	return tokens
		.map((token) => token[0].toUpperCase())
		.slice(0, 3)
		.join("");
};

const getAppCatalogAvatarStyle = (label: string) => {
	const base = hashString(label || "App") % 360;
	return {
		backgroundColor: `hsl(${base}, 22%, 72%)`,
		color: `hsl(${base}, 28%, 28%)`,
	};
};

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
