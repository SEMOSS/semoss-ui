import {
	type PlaygroundTheme,
	readPlaygroundBuildTheme,
	usePlaygroundServerTheme,
} from "@semoss/shared";

/**
 * The build's theme, read once from the playground's `.env` (`VITE_NAME`,
 * `VITE_THEME`): the base the server's theme is laid over.
 */
const ENV_THEME = readPlaygroundBuildTheme(import.meta.env);

/**
 * Read the playground theme: the server's `THEME_MAP` `playground` entry over
 * the build's theme and the defaults, as the web app reads it.
 *
 * @returns The theme; the same object while the server's theme is unchanged.
 */
export const usePlaygroundTheme = (): PlaygroundTheme =>
	usePlaygroundServerTheme(ENV_THEME);
