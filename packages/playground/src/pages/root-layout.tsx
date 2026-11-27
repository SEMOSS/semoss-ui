import { type PropsWithChildren, useEffect } from "react";
import { setFavicon } from "@semoss/utility/browser";
import { applyPlaygroundThemeVariables } from "@/features/theme/playground-theme";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/**
 * Apply the playground's theme, read from the SDK's `Config`, to the page:
 * its colors, the tab's title, and the tab's icon.
 */
export const RootLayout = ({ children }: PropsWithChildren) => {
	const theme = usePlaygroundTheme();
	const tabIcon = theme.images?.tabIcon;

	useEffect(() => {
		applyPlaygroundThemeVariables(theme);
		if (theme.name) document.title = theme.name;
	}, [theme]);

	useEffect(() => {
		if (tabIcon) setFavicon(tabIcon);
	}, [tabIcon]);

	return children;
};
