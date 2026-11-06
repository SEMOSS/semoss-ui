import type { ThemeMap } from "@semoss/shared";

/** A theme sidebar item that embeds a page under `/embed/<path>`. */
export type EmbeddedPage =
	| ThemeMap["playground"]["sidebar"]["headerItems"][number]
	| ThemeMap["playground"]["sidebar"]["footerItems"][number];

/**
 * The theme's embedded pages by path: every sidebar item, header or footer,
 * marked `embed` with a URL. Their iframes stay mounted so switching between
 * them keeps each page's state.
 *
 * @param theme - The playground theme.
 * @returns Each embedded page, keyed by its path.
 */
export const getEmbeddedPageMap = (
	theme: ThemeMap["playground"],
): Record<string, EmbeddedPage> => {
	const map: Record<string, EmbeddedPage> = {};
	for (const item of [
		...theme.sidebar.headerItems,
		...theme.sidebar.footerItems,
	]) {
		if (item.embed && item.url) {
			map[item.path] = item;
		}
	}
	return map;
};
