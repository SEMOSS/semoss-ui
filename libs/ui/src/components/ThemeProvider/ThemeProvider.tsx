import {
	CssBaseline,
	createTheme,
	ThemeProvider as MuiThemeProvider,
	type ThemeOptions,
} from "@mui/material";
import deepmerge from "deepmerge";
import { useMemo } from "react";
import { darkTheme, lightTheme } from "../../theme";

export interface ThemeProviderProps {
	/** Apply the css reset */
	reset?: boolean;

	/** Theme to pass into the provider */
	theme?: ThemeOptions;

	/** children to be rendered */
	children?: React.ReactNode;

	/** light or dark mode of predefined theme */
	type?: "light" | "dark";
}

export const ThemeProvider = (props: ThemeProviderProps) => {
	const { reset = true, children, theme = {}, type = "light" } = props;

	// if the override any options and merge it with the default theme
	const t = useMemo(() => {
		// extendTheme to get added properties to theme
		const customizedTheme = type === "light" ? { ...theme } : {};

		return createTheme(
			deepmerge(
				type === "light" ? lightTheme : darkTheme,
				customizedTheme,
			),
		);
	}, [theme, type]);

	return (
		<MuiThemeProvider theme={t}>
			{reset && <CssBaseline />}
			{children}
		</MuiThemeProvider>
	);
};
