import { type PropsWithChildren, useEffect } from "react";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";
import { applyPlaygroundThemeVariables } from "@/stores/root/playground-theme";

/** Apply the playground's theme, read from the SDK's `Config`, to the page. */
export const RootLayout = ({ children }: PropsWithChildren) => {
	const theme = usePlaygroundTheme();

	useEffect(() => {
		applyPlaygroundThemeVariables(theme);
	}, [theme]);

	return children;
};
