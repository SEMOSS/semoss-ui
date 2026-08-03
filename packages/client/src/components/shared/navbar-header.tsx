import { Menu } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { Button } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { usePage, useRootStore, useThemeLogo } from "@/hooks";

interface NavbarHeaderProps {
	/**
	 * Display custom branding
	 */
	logo?: React.ReactNode | null;
}
export const NavbarHeader = observer((props: NavbarHeaderProps) => {
	const { logo } = props;
	const { page } = usePage();
	const { configStore } = useRootStore();
	const themeLogo = useThemeLogo();
	// `logo` has three intentional states:
	// - `undefined`: show default branding (theme logo + name)
	// - `ReactNode`: show custom branding content
	// - `null`: hide branding completely
	const showDefaultBranding = logo === undefined;
	let customThemeMap: Record<string, unknown> = {};
	try {
		const rawThemeMap = (
			configStore.store.config.theme as { THEME_MAP?: string }
		)?.THEME_MAP;
		if (rawThemeMap) {
			customThemeMap = JSON.parse(rawThemeMap) as Record<string, unknown>;
		}
	} catch {}

	const customLandingPageName =
		typeof customThemeMap.landingPageName === "string" &&
		customThemeMap.landingPageName.trim().length > 0
			? customThemeMap.landingPageName
			: "";
	const customThemeName =
		typeof customThemeMap.name === "string" &&
		customThemeMap.name.trim().length > 0
			? customThemeMap.name
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
});
