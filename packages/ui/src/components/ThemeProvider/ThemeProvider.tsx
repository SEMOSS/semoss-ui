import { useMemo } from "react";
import {
    createTheme,
    ThemeOptions,
    ThemeProvider as MuiThemeProvider,
} from "@mui/material";
import deepmerge from "deepmerge";

import { lightTheme } from "../../theme";

export interface ThemeProviderProps {
    /** Theme to pass into the provider */
    theme?: ThemeOptions;

    /** children to be rendered */
    children?: React.ReactNode;
}

export const ThemeProvider = (props: ThemeProviderProps) => {
    const { children, theme = {} } = props;

    // if the override any options and merge it with the default theme
    const t = useMemo(() => {
        return createTheme(deepmerge(lightTheme, theme));
    }, [theme]);

    return <MuiThemeProvider theme={t}> {children} </MuiThemeProvider>;
};
