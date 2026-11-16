import { type PropsWithChildren, useEffect } from "react";
import { applyPlaygroundThemeVariables } from "@/features/theme/playground-theme";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** Apply the playground's theme, read from the SDK's `Config`, to the page. */
export const RootLayout = ({ children }: PropsWithChildren) => {
	const theme = usePlaygroundTheme();

	useEffect(() => {
		applyPlaygroundThemeVariables(theme);
	}, [theme]);

	return children;
};
