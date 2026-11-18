import { useTheme } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { usePlatformTheme } from "@/hooks/use-platform-theme";

/**
 * The platform's logo for the current color mode: the theme's logo, except in
 * dark mode, which uses the theme's own light logo when it has one, or the
 * default light logo when the theme keeps the default logo.
 *
 * @returns The logo's source.
 */
export const useThemeLogo = (): string => {
	const theme = usePlatformTheme();
	const { resolvedTheme } = useTheme();

	const hasDefaultLogo = theme.logo === THEME.logo;
	const customLightLogo =
		theme.logoLight && theme.logoLight !== THEME.logoLight
			? theme.logoLight
			: "";

	if (resolvedTheme === "dark") {
		if (customLightLogo) {
			return customLightLogo;
		}

		if (hasDefaultLogo) {
			return THEME.logoLight;
		}
	}

	return theme.logo;
};
