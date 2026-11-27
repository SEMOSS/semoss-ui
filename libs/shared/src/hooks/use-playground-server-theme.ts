import { useConfig } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import {
	DEFAULT_PLAYGROUND_THEME,
	mergePlaygroundTheme,
	type PlaygroundTheme,
} from "../theme/playground-theme";

/** One merged theme per base and server theme, so a selector returns the same object. */
const themeCache = new WeakMap<
	PlaygroundTheme,
	WeakMap<Record<string, unknown>, PlaygroundTheme>
>();

/**
 * Lay the server's playground theme over a base theme.
 *
 * @param serverTheme - The server's parsed `THEME_MAP` (`useConfig`'s
 * `theme`), which keeps the playground theme under `playground`; null when the
 * server has none.
 * @param base - The theme to fill gaps from: the defaults, or a
 * host's own theme built on them.
 * @returns The playground theme: the base itself when the server sets nothing,
 * and the same object every time for the same base and server theme.
 */
export const resolvePlaygroundServerTheme = (
	serverTheme: Record<string, unknown> | null | undefined,
	base: PlaygroundTheme = DEFAULT_PLAYGROUND_THEME,
): PlaygroundTheme => {
	if (!serverTheme || !isRecord(serverTheme.playground)) {
		return base;
	}
	let cache = themeCache.get(base);
	if (!cache) {
		cache = new WeakMap();
		themeCache.set(base, cache);
	}
	const cached = cache.get(serverTheme);
	if (cached) {
		return cached;
	}
	const theme = mergePlaygroundTheme(
		base,
		serverTheme.playground as Partial<PlaygroundTheme>,
	);
	cache.set(serverTheme, theme);
	return theme;
};

/**
 * Read the playground theme: the server's `THEME_MAP` `playground` entry over a
 * base theme. Until the config is read, and when the server has no playground
 * theme, it is the base.
 *
 * @param base - The host's own theme, with every default filled in; the
 * defaults without one. Keep its identity stable.
 * @returns The theme; the same object while the server's theme is unchanged.
 */
export const usePlaygroundServerTheme = (
	base: PlaygroundTheme = DEFAULT_PLAYGROUND_THEME,
): PlaygroundTheme =>
	useConfig((state) => resolvePlaygroundServerTheme(state.theme, base));
