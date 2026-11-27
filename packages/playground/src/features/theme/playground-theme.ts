import { type PlaygroundTheme, readPlaygroundBuildTheme } from "@semoss/shared";

/** The build's theme, read once: the base for every server theme. */
export const ENV_THEME = readPlaygroundBuildTheme(import.meta.env);

/**
 * Apply the theme's colors to the document root.
 *
 * @param theme - The theme to apply.
 */
export const applyPlaygroundThemeVariables = (theme: PlaygroundTheme): void => {
	const root = document.documentElement;
	if (theme.variables.backgroundColor) {
		root.style.setProperty("--background", theme.variables.backgroundColor);
	}

	if (theme.variables.primaryColor) {
		root.style.setProperty("--primary", theme.variables.primaryColor);
	}

	if (theme.variables.secondaryColor) {
		root.style.setProperty("--secondary", theme.variables.secondaryColor);
	}
};
