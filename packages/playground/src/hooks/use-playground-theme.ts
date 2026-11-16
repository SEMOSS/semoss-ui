import { useConfig } from "@semoss/sdk/react";
import {
	type PlaygroundTheme,
	withPlaygroundDefaults,
} from "@/stores/root/playground-theme";

/**
 * Read the playground's theme: the server's `THEME_MAP` `playground` entry
 * over the build's theme and the playground's defaults. Until the config is
 * read, and when it has no playground theme, it is the defaults and the
 * build's theme. Distinct from `useTheme` in `@semoss/ui/next`, which is light
 * or dark mode.
 *
 * @returns The theme; the same object while the server's theme is unchanged.
 */
export const usePlaygroundTheme = (): PlaygroundTheme =>
	useConfig((state) => withPlaygroundDefaults(state.theme));
