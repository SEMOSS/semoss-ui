import { AppCatalogAvatar } from "@semoss/shared";
import { cn, useTheme } from "@semoss/ui/next";
import biDark from "@/assets/system-apps/bi-dark.svg?url";
import biLight from "@/assets/system-apps/bi-light.svg?url";
import browserDark from "@/assets/system-apps/browser-automation-dark.svg?url";
import browserLight from "@/assets/system-apps/browser-automation-light.svg?url";
import playgroundDark from "@/assets/system-apps/playground-dark.svg?url";
import playgroundLight from "@/assets/system-apps/playground-light.svg?url";
import terminalDark from "@/assets/system-apps/terminal-dark.svg?url";
import terminalLight from "@/assets/system-apps/terminal-light.svg?url";

const systemAppImages = new Map([
	["bi-system-app", { light: biLight, dark: biDark }],
	[
		"browser-automation-system-app",
		{ light: browserLight, dark: browserDark },
	],
	["playground-system-app", { light: playgroundLight, dark: playgroundDark }],
	["terminal-system-app", { light: terminalLight, dark: terminalDark }],
]);

interface SystemAppImageProps {
	/** Stable launcher ID, independent of its display name or URL. */
	id: string;
	/** Initials fallback for loading, unavailable images, or new launchers. */
	name: string;
	/** Optional size override for the catalog image. */
	className?: string;
}

/** Bundled artwork for frontend launchers that do not have backend project IDs. */
export function SystemAppImage({ id, name, className }: SystemAppImageProps) {
	const { resolvedTheme } = useTheme();
	const src = systemAppImages.get(id)?.[resolvedTheme];
	return (
		<AppCatalogAvatar
			name={name}
			imageUrl={src}
			className={cn("size-12 shrink-0 rounded text-lg", className)}
		/>
	);
}
