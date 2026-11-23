import { type PlaygroundTheme, usePlaygroundServerTheme } from "@semoss/shared";
import { ENV_THEME } from "./playground-theme";

/**
 * Read the playground theme: the server's `THEME_MAP` `playground` entry over
 * the build's theme and the defaults, as the web app reads it.
 *
 * @returns The theme; the same object while the server's theme is unchanged.
 */
export const usePlaygroundTheme = (): PlaygroundTheme =>
	usePlaygroundServerTheme(ENV_THEME);
