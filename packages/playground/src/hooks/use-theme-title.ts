import { useEffect } from "react";

/**
 * Show the theme's name as the browser tab's title.
 *
 * @param theme - The playground theme, or nothing while it loads.
 */
export function useThemeTitle(theme: { name?: string } | undefined): void {
	useEffect(() => {
		if (theme?.name) document.title = theme.name;
	}, [theme?.name]);
}
