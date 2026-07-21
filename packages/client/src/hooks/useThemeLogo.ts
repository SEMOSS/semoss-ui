import { useTheme } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { useRootStore } from "./useRootStore";

export const useThemeLogo = () => {
	const { configStore } = useRootStore();
	const { resolvedTheme } = useTheme();
	const theme = configStore.theme;

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
