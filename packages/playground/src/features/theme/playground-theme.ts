import {
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "@semoss/chat";
import { isRecord } from "@semoss/utility/object";

/** The playground's theme, with every default filled in. */
export type PlaygroundTheme = ChatTheme;

/** The build's app name (`VITE_NAME`), or empty for the default. */
const NAME = import.meta.env.VITE_NAME || "";
/** The build's theme JSON (`VITE_THEME`). */
const THEME = import.meta.env.VITE_THEME || "{}";

/**
 * Read the build's theme: `VITE_NAME`, then `VITE_THEME` (wrapped as
 * `{ playground: {...} }` or flat) over the defaults.
 *
 * @returns The build's theme.
 */
const readEnvTheme = (): PlaygroundTheme => {
	const base = NAME
		? { ...DEFAULT_CHAT_THEME, name: NAME }
		: DEFAULT_CHAT_THEME;
	try {
		const parsed: unknown = JSON.parse(THEME);
		// both wrapped and flat build themes are supported
		const theme =
			isRecord(parsed) && isRecord(parsed.playground)
				? parsed.playground
				: parsed;
		return isRecord(theme)
			? mergeChatTheme(base, theme as Partial<PlaygroundTheme>)
			: base;
	} catch {
		// a malformed build theme keeps the defaults
		return base;
	}
};

/** The build's theme, read once: the base for every server theme. */
const ENV_THEME = readEnvTheme();

/** One merged theme per server theme, so a selector returns the same object. */
const themeCache = new WeakMap<Record<string, unknown>, PlaygroundTheme>();

/**
 * Lay the playground's defaults and the build's theme under the server's.
 *
 * @param serverTheme - The server's parsed `THEME_MAP` (`useConfig`'s
 * `theme`), or null when it has none.
 * @returns The playground's theme. The same server theme always returns the
 * same object.
 */
export const withPlaygroundDefaults = (
	serverTheme: Record<string, unknown> | null,
): PlaygroundTheme => {
	if (!serverTheme || !isRecord(serverTheme.playground)) {
		return ENV_THEME;
	}
	const cached = themeCache.get(serverTheme);
	if (cached) {
		return cached;
	}
	const theme = mergeChatTheme(
		ENV_THEME,
		serverTheme.playground as Partial<PlaygroundTheme>,
	);
	themeCache.set(serverTheme, theme);
	return theme;
};

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
