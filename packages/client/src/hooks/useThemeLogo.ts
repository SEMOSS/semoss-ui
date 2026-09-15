import { useTheme } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { useConfig } from "./use-config";

export const useThemeLogo = () => {
	const theme = useConfig((state) => state.theme);
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
