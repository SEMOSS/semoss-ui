import { ThemeOptions, styled } from "@mui/material";
// import { ShapeOptions } from "@material-ui/core/styles";
// export specifics from the library
export { styled };
export type { ThemeOptions };

export interface CustomThemeOptions extends ThemeOptions {
    shape: {
        borderRadiusNone: number;
        borderRadius: number;
        borderRadiusSm?: number;
        borderRadiusLg?: number;
        borderRadiusCircle?: number;
        borderRadiusChip?: number;
    };
    space?: {
        auto: string;
        full: string;
        none: string;
        "01": string;
        "02": string;
        "03": string;
        "04": string;
        "05": string;
        "06": string;
        "07": string;
        "08": string;
        "09": string;
        "10": string;
        "11": string;
        "12": string;
        "13": string;
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
        background: {
            default: "#FAFAFA",
        },
    },
    shape: {
        borderRadiusNone: 0,
        borderRadius: 8,
        borderRadiusSm: 4,
        borderRadiusLg: 12,
        borderRadiusCircle: 64,
        borderRadiusChip: 64,
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        body1: {
            /* Typography/Body 1 */
            fontSize: "16px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "150%",
            letterSpacing: "0.15px",
        },
        body2: {
            /* Typography/Body 2 */
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "143%",
            letterSpacing: "0.17px",
        },
        subtitle1: {
            /* Typography/Subtitle 1 */
            fontSize: "16px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "175%",
            letterSpacing: "0.15px",
        },
        subtitle2: {
            /* Typography/Subtitle 2 */
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: "500",
            lineHeight: "157%",
            letterSpacing: "0.1px",
        },
        caption: {
            /* Typography/Caption */
            fontSize: "12px",
            fontStyle: "normal",
            fontWeight: "400",
            lineWeight: "166%",
            letterSpacing: "0.4px",
        },
        overline: {
            /* Typography/OVERLINE */
            fontSize: "12px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "266%",
            letterSpacing: "1px",
            textTransform: "uppercase",
        },
        h1: {
            /* Typography/H1 */
            fontSize: "96px",
            fontStyle: "normal",
            fontWeight: "300",
            lineHeight: "116.7%",
            letterSpacing: "-1.5px",
        },
        h2: {
            /* Typography/H2 */
            fontSize: "60px",
            fontStyle: "normal",
            fontWeight: "300",
            lineHeight: "120%",
            letterSpacing: "-0.5px",
        },
        h3: {
            /* Typography/H3 */
            fontSize: "48px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "116.7%",
        },
        h4: {
            /* Typography/H4 */
            fontSize: "34px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "123.5%",
            letterSpacing: "0.25px",
        },
        h5: {
            /* Typography/H5 */
            fontSize: "24px",
            fontStyle: "normal",
            fontWeight: "500",
            lineHeight: "133.4%",
        },
        h6: {
            /* Typography/H6 */
            fontSize: "20px",
            fontStyle: "normal",
            fontWeight: "500",
            lineHeight: "160%",
            letterSpacing: "0.15px",
        },
        button: {
            textTransform: "none",
        },
    },
    space: {
        auto: "auto",
        full: "100%",
        none: "0px",
        "01": "2px",
        "02": "4px",
        "03": "8px",
        "04": "12px",
        "05": "16px",
        "06": "24px",
        "07": "32px",
        "08": "40px",
        "09": "48px",
        "10": "64px",
        "11": "80px",
        "12": "96px",
        "13": "160px",
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
        background: {
            default: "#FAFAFA",
            paper: "#FFF",
        },
    },
    shape: {
        borderRadiusNone: 0,
        borderRadius: 8,
        borderRadiusSm: 4,
        borderRadiusLg: 12,
        borderRadiusCircle: 64,
        borderRadiusChip: 64,
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        body1: {
            /* Typography/Body 1 */
            fontSize: "16px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "150%",
            letterSpacing: "0.15px",
        },
        body2: {
            /* Typography/Body 2 */
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "143%",
            letterSpacing: "0.17px",
        },
        subtitle1: {
            /* Typography/Subtitle 1 */
            fontSize: "16px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "175%",
            letterSpacing: "0.15px",
        },
        subtitle2: {
            /* Typography/Subtitle 2 */
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: "500",
            lineHeight: "157%",
            letterSpacing: "0.1px",
        },
        caption: {
            /* Typography/Caption */
            fontSize: "12px",
            fontStyle: "normal",
            fontWeight: "400",
            lineWeight: "166%",
            letterSpacing: "0.4px",
        },
        overline: {
            /* Typography/OVERLINE */
            fontSize: "12px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "266%",
            letterSpacing: "1px",
            textTransform: "uppercase",
        },
        h1: {
            /* Typography/H1 */
            fontSize: "96px",
            fontStyle: "normal",
            fontWeight: "300",
            lineHeight: "116.7%",
            letterSpacing: "-1.5px",
        },
        h2: {
            /* Typography/H2 */
            fontSize: "60px",
            fontStyle: "normal",
            fontWeight: "300",
            lineHeight: "120%",
            letterSpacing: "-0.5px",
        },
        h3: {
            /* Typography/H3 */
            fontSize: "48px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "116.7%",
        },
        h4: {
            /* Typography/H4 */
            fontSize: "34px",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "123.5%",
            letterSpacing: "0.25px",
        },
        h5: {
            /* Typography/H5 */
            fontSize: "24px",
            fontStyle: "normal",
            fontWeight: "500",
            lineHeight: "133.4%",
        },
        h6: {
            /* Typography/H6 */
            fontSize: "20px",
            fontStyle: "normal",
            fontWeight: "500",
            lineHeight: "160%",
            letterSpacing: "0.15px",
        },
    },
    space: {
        auto: "auto",
        full: "100%",
        none: "0px",
        "01": "2px",
        "02": "4px",
        "03": "8px",
        "04": "12px",
        "05": "16px",
        "06": "24px",
        "07": "32px",
        "08": "40px",
        "09": "48px",
        "10": "64px",
        "11": "80px",
        "12": "96px",
        "13": "160px",
    },
    spacing: 8,
};
