import { useEffect } from "react";

/**
 * Keep the document's title on the theme's name.
 *
 * @param theme - The theme whose `name` titles the tab; nothing changes while
 * it has none.
 */
export const useThemeTitle = (
	theme: { name?: string } | null | undefined,
): void => {
	useEffect(() => {
		if (theme?.name) document.title = theme.name;
	}, [theme?.name]);
};
