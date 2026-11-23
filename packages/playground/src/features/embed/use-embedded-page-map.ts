import { useMemo } from "react";
import type { PlaygroundTheme } from "@semoss/shared";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** A sidebar item of the theme that embeds a page. */
export type EmbeddedPage = PlaygroundTheme["sidebar"]["headerItems"][number];

/**
 * The theme's sidebar items that embed a page, by their path.
 *
 * @returns The pages; the same object while the theme is unchanged.
 */
export const useEmbeddedPageMap = (): Readonly<
	Record<string, EmbeddedPage>
> => {
	const { sidebar } = usePlaygroundTheme();
	return useMemo(
		() =>
			Object.fromEntries(
				[...sidebar.headerItems, ...sidebar.footerItems]
					// only items that embed a page, so a path lookup finds them
					.filter((item) => item.embed && item.url)
					.map((item) => [item.path, item]),
			),
		[sidebar],
	);
};
