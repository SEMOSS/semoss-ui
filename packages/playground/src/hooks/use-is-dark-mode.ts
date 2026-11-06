import { useTheme } from "@semoss/ui/next";

/**
 * Whether the app shows dark: the user's pick, or the system's when they
 * follow it. For the theme's light and dark images.
 *
 * @returns True in dark mode.
 */
export const useIsDarkMode = (): boolean => {
	const { theme } = useTheme();
	return (
		theme === "dark" ||
		(theme === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches)
	);
};
