import { type PropsWithChildren, useEffect, useMemo } from "react";
import { RootContext } from "@/contexts/root-context";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";
import { applyPlaygroundThemeVariables } from "@/stores/root/playground-theme";
import { RootStore } from "@/stores/root/root.store";

/**
 * Provide the playground's theme, read from the SDK's `Config`, to the views
 * that still read it through `useRoot()`, and apply its colors to the page.
 */
export const RootLayout = ({ children }: PropsWithChildren) => {
	const theme = usePlaygroundTheme();

	// the deprecated adapter for useRoot(); rebuilt when the theme changes
	const value = useMemo(() => ({ root: new RootStore(theme) }), [theme]);

	useEffect(() => {
		applyPlaygroundThemeVariables(theme);
	}, [theme]);

	return (
		<RootContext.Provider value={value}>{children}</RootContext.Provider>
	);
};
