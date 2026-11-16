import { Menu } from "lucide-react";
import type React from "react";
import { useConfig } from "@semoss/sdk/react";
import { Button } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { usePage } from "@/hooks/use-page";
import { useThemeLogo } from "@/hooks/use-theme-logo";

interface NavbarHeaderProps {
	/**
	 * Display custom branding
	 */
	logo?: React.ReactNode | null;
}

/**
 * The navbar's start while the sidebar is not pinned: a button that opens the
 * sidebar, then the branding. Renders nothing while the sidebar is pinned.
 */
export const NavbarHeader = (props: NavbarHeaderProps) => {
	const { logo } = props;
	const page = usePage();
	// only what the server's theme names; the defaults come last below
	const customTheme = useConfig((state) => state.theme);
	const themeLogo = useThemeLogo();
	// `logo` has three intentional states:
	// - `undefined`: show default branding (theme logo + name)
	// - `ReactNode`: show custom branding content
	// - `null`: hide branding completely
	const showDefaultBranding = logo === undefined;
	const customLandingPageName =
		typeof customTheme?.landingPageName === "string" &&
		customTheme.landingPageName.trim().length > 0
			? customTheme.landingPageName
			: "";
	const customThemeName =
		typeof customTheme?.name === "string" &&
		customTheme.name.trim().length > 0
			? customTheme.name
			: "";
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
