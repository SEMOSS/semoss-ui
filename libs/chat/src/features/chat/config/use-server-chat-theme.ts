import { useConfig } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import {
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "./chat-theme";

/** One merged theme per base and server theme, so a selector returns the same object. */
const themeCache = new WeakMap<
	ChatTheme,
	WeakMap<Record<string, unknown>, ChatTheme>
>();

/**
 * Lay the server's chat theme over a base theme.
 *
 * @param serverTheme - The server's parsed `THEME_MAP` (`useConfig`'s
 * `theme`), which keeps the chat's theme under `playground`; null when the
 * server has none.
 * @param base - The theme to fill gaps from: the chat's defaults, or a
 * host's own theme built on them.
 * @returns The chat's theme: the base itself when the server sets nothing,
 * and the same object every time for the same base and server theme.
 */
export const resolveServerChatTheme = (
	serverTheme: Record<string, unknown> | null | undefined,
	base: ChatTheme = DEFAULT_CHAT_THEME,
): ChatTheme => {
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
	const theme = mergeChatTheme(
		base,
		serverTheme.playground as Partial<ChatTheme>,
	);
	cache.set(serverTheme, theme);
	return theme;
};

/**
 * Read the chat's theme: the server's `THEME_MAP` `playground` entry over a
 * base theme. Until the config is read, and when the server has no chat
 * theme, it is the base.
 *
 * @param base - The host's own theme, with every default filled in; the
 * chat's defaults without one. Keep its identity stable.
 * @returns The theme; the same object while the server's theme is unchanged.
 */
export const useServerChatTheme = (
	base: ChatTheme = DEFAULT_CHAT_THEME,
): ChatTheme => useConfig((state) => resolveServerChatTheme(state.theme, base));
