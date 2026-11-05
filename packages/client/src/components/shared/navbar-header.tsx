import { Menu } from "lucide-react";
import type React from "react";
import { useConfig } from "@semoss/sdk/react";
import { Button } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { usePage, useThemeLogo } from "@/hooks";

/**
 * Read a text field the server's theme sets, ignoring a blank one.
 *
 * @param theme - The server's parsed theme, or null without one.
 * @param key - The field to read.
 * @returns The field's text, or empty when it is missing or blank.
 */
const getThemeText = (
	theme: Record<string, unknown> | null,
	key: string,
): string => {
	const value = theme?.[key];
	return typeof value === "string" && value.trim().length > 0 ? value : "";
};

interface NavbarHeaderProps {
	/**
	 * Display custom branding
	 */
	logo?: React.ReactNode | null;
}
export const NavbarHeader = (props: NavbarHeaderProps) => {
	const { logo } = props;
	const page = usePage();
	// the server's own theme, without the client defaults, so a theme that
	// sets only its name still names the navbar
	const customLandingPageName = useConfig((state) =>
		getThemeText(state.theme, "landingPageName"),
	);
	const customThemeName = useConfig((state) =>
		getThemeText(state.theme, "name"),
	);
	const themeLogo = useThemeLogo();
	// `logo` has three intentional states:
	// - `undefined`: show default branding (theme logo + name)
	// - `ReactNode`: show custom branding content
	// - `null`: hide branding completely
	const showDefaultBranding = logo === undefined;
	const defaultLandingPageName = THEME.name;
	// Navbar title priority:
	// 1) custom THEME_MAP.landingPageName
	// 2) custom THEME_MAP.name
	// 3) default theme.landingPageName (defaults to THEME.name)
	const brandingName =
		customLandingPageName || customThemeName || defaultLandingPageName;

	return !page.sidebar.pinned ? (
		<div className="relative z-0 flex min-w-0 max-w-full items-center gap-1 bg-transparent sm:gap-2">
			<Button
				variant="outline"
				size="icon-sm"
				className="h-8 w-8 shrink-0 rounded-md border border-border"
				onClick={() => page.openSidebar()}
				onMouseOver={() => page.openSidebar()}
				aria-label="Open sidebar"
			>
				<Menu className="size-4" />
			</Button>

			{showDefaultBranding ? (
				<div className="flex min-w-0 max-w-full items-center gap-1 rounded-md px-1 py-1 text-foreground sm:gap-2 sm:px-2">
					{themeLogo ? (
						<img
							alt="logo"
							src={themeLogo}
							className="h-4 w-auto sm:h-5"
						/>
					) : null}
					<span className="hidden truncate font-semibold text-sm sm:block">
						{brandingName}
					</span>
				</div>
			) : (
				logo
			)}
		</div>
	) : null;
};
