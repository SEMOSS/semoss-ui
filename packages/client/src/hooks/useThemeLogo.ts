import { useTheme } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { useSessionTheme } from "./use-session-theme";

export const useThemeLogo = () => {
	const theme = useSessionTheme((theme) => theme);
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
