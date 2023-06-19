import { ThemeOptions, styled } from "@mui/material";
// import { ShapeOptions } from "@material-ui/core/styles";
// export specifics from the library
export { styled };
export type { ThemeOptions };

export interface CustomThemeOptions extends ThemeOptions {
    shape: {
        borderRadius: number;
        borderRadiusSm?: number;
        borderRadiusLg?: number;
    };
}

export const lightTheme: CustomThemeOptions = {
    palette: {
        mode: "light",
        primary: {
            main: "#0471F0",
            light: "#22A4FF",
            dark: "#1260DD",
        },
        secondary: {
            main: "#D9D9D9",
            light: "#F2F2F2",
            dark: "#B5B5B5",
        },
        error: {
            main: "#da291c",
            light: "#FA3F20",
            dark: "#BF0D02",
        },
        warning: {
            main: "#FA9F2C",
            light: "#FF9800",
            dark: "#EF8326",
        },
        info: {
            main: "#0471F0",
            light: "#22A4FF",
            dark: "#1260DD",
        },
        success: {
            main: "#348700",
            light: "#4CAF50",
            dark: "#006500",
        },
    },
    shape: {
        borderRadius: 8,
        borderRadiusSm: 4,
        borderRadiusLg: 12,
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
    },
    spacing: 8,
};

export const darkTheme: CustomThemeOptions = {
    palette: {
        mode: "dark",
        primary: {
            main: "#0471F0",
            light: "#8BCAFF",
            dark: "#1C3FBE",
        },
        secondary: {
            main: "#6D6D6D",
            light: "#E9E9E9",
            dark: "#3B3B3B",
        },
        error: {
            main: "#da291c",
            light: "#F69993",
            dark: "#BF0D02",
        },
        warning: {
            main: "#FFA726",
            light: "#FFB74D",
            dark: "#f57c00",
        },
        info: {
            main: "#0471F0",
            light: "#8BCAFF",
            dark: "#1C3FBE",
        },
        success: {
            main: "#26890D",
            light: "#A1D396",
            dark: "#005A00",
        },
    },
    shape: {
        borderRadius: 8,
        borderRadiusSm: 4,
        borderRadiusLg: 12,
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
    },
    spacing: 8,
};
