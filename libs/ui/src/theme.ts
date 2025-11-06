// SEE: https://www.figma.com/design/kZwcxDBSMJbOcFaCin2xbd/SEMOSS-MUI-Core-v5.4.0?node-id=4662-14&p=f&vars=1&var-id=5d601bc1d2fd3dce9adb4026d0f5157be370a25f%2F7130-62&m=dev
import { alpha, styled, type ThemeOptions, useTheme } from "@mui/material";

// export specifics from the library
export { alpha, styled, useTheme, type ThemeOptions };

// Extend the MUI theme type definitions
declare module "@mui/material/styles" {
	interface TypeBackground {
		paper1?: string;
		paper2?: string;
	}

	interface SimplePaletteColorOptions {
		hover?: string;
		selected?: string;
		border?: string;
		disabled?: string;
		divider?: string;
	}

	interface PaletteColor {
		hover?: string;
		selected?: string;
		border?: string;
		disabled?: string;
		divider?: string;
	}

	interface TypeText {
		main?: string;
		white?: string;
	}

	interface Palette {
		primaryContrast: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			shadow: string;
		};
		green: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		darkBlue: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		pink: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		purple: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		orange: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
	}

	interface PaletteOptions {
		primaryContrast?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			shadow: string;
		};
		lightGreen?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		green?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		darkBlue?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		pink?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		purple?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		red?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
		orange?: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
		};
	}

	interface Shape {
		borderRadius: number;
		borderRadiusNone: number;
		borderRadiusSm: number;
		borderRadiusLg: number;
		borderRadiusCircle: number;
		borderRadiusChip: number;
	}

	interface ShapeOptions {
		borderRadius: number;
		borderRadiusNone: number;
		borderRadiusSm: number;
		borderRadiusLg: number;
		borderRadiusCircle: number;
		borderRadiusChip: number;
	}

	interface TypographyVariants {
		body3: React.CSSProperties;
		body4: React.CSSProperties;
	}

	interface TypographyVariantsOptions {
		body3?: React.CSSProperties;
		body4?: React.CSSProperties;
	}

	interface Theme {
		shape: Shape;
	}
	interface ThemeOptions {
		shape: ShapeOptions;
	}
}

declare module "@mui/material/Typography" {
	interface TypographyPropsVariantOverrides {
		body3: true;
		body4: true;
	}
}

export const lightTheme: ThemeOptions = {
	palette: {
		mode: "light",
		primary: {
			main: "#0471F0",
			dark: "#1260DD",
			light: "#22A4FF",
			hover: "#F5F9FE",
			selected: "#EBF4FE",
			border: "#9FCFFF",
		},
		secondary: {
			main: "#D9D9D9",
			dark: "#757575",
			light: "#F2F2F2",
			hover: "#F5F5F5",
			selected: "#EBEBEB",
			disabled: "#BDBDBD",
			border: "#C4C4C4",
			divider: "#E6E6E6",
		},
		text: {
			primary: "#000000",
			main: "#000000",
			secondary: "#666666",
			white: "#FFFFFF",
			disabled: "#9E9E9E",
		},
		error: {
			main: "#DA291C",
			light: "#FBE9E8",
			dark: "#BF0D02",
		},
		warning: {
			main: "#FA9F2C",
			light: "#FDF0E5",
			dark: "#EF8326",
		},
		info: {
			main: "#0471F0",
			light: "#22A4FF",
			dark: "#1260DD",
		},
		success: {
			main: "#348700",
			light: "#EAF2EA",
			dark: "#006500",
		},
		background: {
			paper: "#FFFFFF", // Design references this color as "paper1"
			default: "#FAFAFA", // Design references this color as "paper2",
			paper1: "#FFFFFF",
			paper2: "#FAFAFA",
		},
		primaryContrast: {
			// SEMOSS BLUE
			"50": "#E2F2FF",
			"100": "#BADEFF",
			"200": "#8BCAFF",
			"300": "#55B5FF",
			"400": "#22A4FF",
			"500": "#0094FF",
			"600": "#0085FF",
			"700": "#0471F0",
			"800": "#1260DD",
			"900": "#1C3FBE",
			shadow: "#D6EAFF",
		},
		lightGreen: {
			"50": "#E7F4E5",
			"100": "#C6E4BF",
			"200": "#A1D396",
			"300": "#7AC36B",
			"400": "#5CB649",
			"500": "#3EA924",
			"600": "#349B1B",
			"700": "#26890D",
			"800": "#167800",
			"900": "#005A00",
		},
		green: {
			"50": "#DEF4F3",
			"100": "#ABE4E0",
			"200": "#6FD4CB",
			"300": "#07C2B6",
			"400": "#00B4A4",
			"500": "#00A593",
			"600": "#009785",
			"700": "#008674",
			"800": "#007664",
			"900": "#005946",
		},
		darkBlue: {
			"50": "#EAE4F2",
			"100": "#C9BCE0",
			"200": "#A690CC",
			"300": "#8364B8",
			"400": "#6944AA",
			"500": "#4F249B",
			"600": "#471F96",
			"700": "#3A188E",
			"800": "#2D1286",
			"900": "#150578",
		},
		pink: {
			"50": "#FFE6F0",
			"100": "#FFC0D9",
			"200": "#FF97C0",
			"300": "#FF6DA6",
			"400": "#FF4E90",
			"500": "#FF337B",
			"600": "#ED2F77",
			"700": "#D62C71",
			"800": "#C0286C",
			"900": "#992263",
		},
		purple: {
			"50": "#F1E9FB",
			"100": "#DAC9F5",
			"200": "#C3A5F0",
			"300": "#AA7EEA",
			"400": "#975FE4",
			"500": "#8340DE",
			"600": "#783BD7",
			"700": "#6A32CE",
			"800": "#5D2BC7",
			"900": "#481EB8",
		},
		red: {
			"50": "#FFEBEB",
			"100": "#FFC7C7",
			"200": "#FFA3A3",
			"300": "#FF7F7F",
			"400": "#FF5D5D",
			"500": "#FF3B3B",
			"600": "#ED2F2F",
			"700": "#D62C2C",
			"800": "#C02828",
			"900": "#992222",
		},
		orange: {
			"50": "#FFB428",
			"100": "#FFA324",
			"200": "#FF9220",
			"300": "#FF811D",
			"400": "#FF7019",
			"500": "#FF5F15",
			"600": "#D14E11",
			"700": "#A33D0D",
			"800": "#752C0A",
			"900": "#471B06",
		},
		grey: {
			"50": "#F9F9FA",
			"100": "#F6F6F7",
			"200": "#F2F3F4",
			"300": "#EFF0F1",
			"400": "#ECEDEF",
			"500": "#E9EAEC",
			"600": "#DBDBDB",
			"700": "#A6A7A9",
			"800": "#858687",
			"900": "#646465",
		},
	},
	shape: {
		borderRadiusNone: 0,
		borderRadius: 8,
		borderRadiusSm: 4,
		borderRadiusLg: 20,
		borderRadiusCircle: 64,
		borderRadiusChip: 64,
	},
	spacing: 8,
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
		body3: {
			/* Typography/Body 3 */
			fontSize: "12px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "150%",
			letterSpacing: "0.15px",
		},
		body4: {
			/* Typography/Body 4 */
			fontSize: "10px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "150%",
			letterSpacing: "0.15px",
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
			textTransform: "none",
		},
		h2: {
			/* Typography/H2 */
			fontSize: "60px",
			fontStyle: "normal",
			fontWeight: "300",
			lineHeight: "120%",
			letterSpacing: "-0.5px",
			textTransform: "none",
		},
		h3: {
			/* Typography/H3 */
			fontSize: "48px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "116.7%",
			textTransform: "none",
		},
		h4: {
			/* Typography/H4 */
			fontSize: "34px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "123.5%",
			letterSpacing: "0.25px",
			textTransform: "none",
		},
		h5: {
			/* Typography/H5 */
			fontSize: "24px",
			fontStyle: "normal",
			fontWeight: "500",
			lineHeight: "133.4%",
			textTransform: "none",
		},
		h6: {
			/* Typography/H6 */
			fontSize: "20px",
			fontStyle: "normal",
			fontWeight: "500",
			lineHeight: "160%",
			letterSpacing: "0.15px",
			textTransform: "none",
		},
		button: {
			textTransform: "none",
			fontWeight: "600",
		},
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: (_themeParam) => ({
				body: {
					overflow: "hidden",
				},
				"*::-webkit-scrollbar": {
					width: "8px",
					height: "8px",
					background: "transparent",
				},

				"*::-webkit-scrollbar-thumb": {
					// -webkit-border-radius: '4px',
					borderRadius: "8px",
					height: "18px",
					background: "#bdbdbd",
					backgroundClip: "padding-box",
				},

				"*::-webkit-scrollbar-thumb:hover": {
					background: "#e0e0e0",
				},

				"*::-webkit-scrollbar-thumb:active": {
					background: "#bdbdbd",
				},

				"*::-webkit-scrollbar-button": {
					width: "0",
					height: "0",
					display: "none",
				},

				"*::-webkit-scrollbar-corner": {
					backgroundColor: "transparent",
				},
			}),
		},
		MuiAlertTitle: {
			styleOverrides: {
				root: () => ({
					fontSize: "16px",
					fontStyle: "normal",
					fontWeight: "500",
					lineHeight: "150%",
					letterSpacing: "0.15px",
				}),
			},
		},
		MuiContainer: {
			styleOverrides: {
				maxWidthSm: {
					maxWidth: 200,
				},
				maxWidthMd: {
					maxWidth: 320,
				},
				maxWidthLg: {
					maxWidth: 500,
				},
				maxWidthXl: {
					maxWidth: 1271,
				},
			},
		},
		// https://www.figma.com/file/kZwcxDBSMJbOcFaCin2xbd/MUI-Core-v5.4.0-(Revised)?node-id=454%3A101831&mode=dev
		MuiCard: {
			styleOverrides: {
				root: ({ theme }) => {
					return {
						display: "flex",
						flexDirection: "column",
						boxShadow:
							"0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
						borderRadius: theme.shape.borderRadiusLg,

						"&:hover": {
							boxShadow: `0px 5px 22px 0px ${theme.palette.primaryContrast.shadow}`,
						},
					};
				},
			},
		},
		MuiCardHeader: {
			styleOverrides: {
				root: () => ({
					width: "100%",
					margin: "16px 0px 16px 0px",
					padding: "0px 16px 0px 16px",
				}),
				content: () => ({
					width: "80%",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
				}),
				action: () => ({}),
				title: () => ({
					width: "100%",
					overflow: "hidden",
					whiteSpace: "nowrap",
					textOverflow: "ellipsis",
				}),
			},
		},
		MuiCardContent: {
			styleOverrides: {
				root: () => ({
					width: "100%",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					margin: "0px 0px 16px 0px",
					padding: "0px 16px 0px 16px",
				}),
			},
		},
		MuiCardActions: {
			styleOverrides: {
				root: () => ({
					width: "100%",
					display: "flex",
					gap: "8px",
					margin: "0px 0px 16px 0px",
					padding: "0px 8px 0px 16px",
				}),
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: ({ theme }) => {
					return {
						boxShadow:
							"0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
						borderRadius: theme.shape.borderRadiusLg,
					};
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: () => ({
					boxShadow: "none",
				}),
			},
		},
	},
};

// darkTheme is not currently in use or up to date with the new Color UI system from design.
// Once the ability to use a dark theme is added, we will need to get the colors updated.
export const darkTheme: ThemeOptions = {
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
			paper: "#FAFAFA",
			default: "#121212",
		},
		primaryContrast: {
			// SEMOSS BLUE
			"50": "#E2F2FF",
			"100": "#BADEFF",
			"200": "#8BCAFF",
			"300": "#55B5FF",
			"400": "#22A4FF",
			"500": "#0094FF",
			"600": "#0085FF",
			"700": "#0471F0",
			"800": "#1260DD",
			"900": "#1C3FBE",
			shadow: "#D6EAFF",
		},
		darkBlue: {
			"50": "#EAE4F2",
			"100": "C9BCE0",
			"200": "A690CC",
			"300": "8364B8",
			"400": "6944AA",
			"500": "4F249B",
			"600": "471F96",
			"700": "3A188E",
			"800": "2D1286",
			"900": "150578",
		},
		pink: {
			"50": "#FFE6F0",
			"100": "FFC0D9",
			"200": "FF97C0",
			"300": "FF6DA6",
			"400": "FF4E90",
			"500": "FF337B",
			"600": "ED2F77",
			"700": "D62C71",
			"800": "C0286C",
			"900": "992263",
		},
		purple: {
			"50": "#F1E9FB",
			"100": "DAC9F5",
			"200": "C3A5F0",
			"300": "AA7EEA",
			"400": "975FE4",
			"500": "8340DE",
			"600": "783BD7",
			"700": "6A32CE",
			"800": "5D2BC7",
			"900": "481EB8",
		},
	},
	shape: {
		borderRadiusNone: 0,
		borderRadius: 8,
		borderRadiusSm: 4,
		borderRadiusLg: 20,
		borderRadiusCircle: 64,
		borderRadiusChip: 64,
	},
	spacing: 8,
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
		body3: {
			/* Typography/Body 3 */
			fontSize: "12px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "150%",
			letterSpacing: "0.15px",
		},
		body4: {
			/* Typography/Body 4 */
			fontSize: "10px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "150%",
			letterSpacing: "0.15px",
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
			textTransform: "none",
		},
		h2: {
			/* Typography/H2 */
			fontSize: "60px",
			fontStyle: "normal",
			fontWeight: "300",
			lineHeight: "120%",
			letterSpacing: "-0.5px",
			textTransform: "none",
		},
		h3: {
			/* Typography/H3 */
			fontSize: "48px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "116.7%",
			textTransform: "none",
		},
		h4: {
			/* Typography/H4 */
			fontSize: "34px",
			fontStyle: "normal",
			fontWeight: "400",
			lineHeight: "123.5%",
			letterSpacing: "0.25px",
			textTransform: "none",
		},
		h5: {
			/* Typography/H5 */
			fontSize: "24px",
			fontStyle: "normal",
			fontWeight: "500",
			lineHeight: "133.4%",
			textTransform: "none",
		},
		h6: {
			/* Typography/H6 */
			fontSize: "20px",
			fontStyle: "normal",
			fontWeight: "500",
			lineHeight: "160%",
			letterSpacing: "0.15px",
			textTransform: "none",
		},
		button: {
			textTransform: "none",
			fontWeight: "600",
		},
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: (_themeParam) => ({
				"*::-webkit-scrollbar": {
					width: "8px",
					height: "8px",
					background: "transparent",
				},

				"*::-webkit-scrollbar-thumb": {
					// -webkit-border-radius: '4px',
					borderRadius: "8px",
					height: "18px",
					background: "#bdbdbd",
					backgroundClip: "padding-box",
				},

				"*::-webkit-scrollbar-thumb:hover": {
					background: "#e0e0e0",
				},

				"*::-webkit-scrollbar-thumb:active": {
					background: "#bdbdbd",
				},

				"*::-webkit-scrollbar-button": {
					width: "0",
					height: "0",
					display: "none",
				},

				"*::-webkit-scrollbar-corner": {
					backgroundColor: "transparent",
				},
			}),
		},
		MuiAlertTitle: {
			styleOverrides: {
				root: () => ({
					fontSize: "16px",
					fontStyle: "normal",
					fontWeight: "500",
					lineHeight: "150%",
					letterSpacing: "0.15px",
				}),
			},
		},
		MuiContainer: {
			styleOverrides: {
				maxWidthSm: {
					maxWidth: 200,
				},
				maxWidthMd: {
					maxWidth: 320,
				},
				maxWidthLg: {
					maxWidth: 500,
				},
				maxWidthXl: {
					maxWidth: 1271,
				},
			},
		},
		// https://www.figma.com/file/kZwcxDBSMJbOcFaCin2xbd/MUI-Core-v5.4.0-(Revised)?node-id=454%3A101831&mode=dev
		MuiCard: {
			styleOverrides: {
				root: ({ theme }) => {
					return {
						display: "flex",
						flexDirection: "column",
						boxShadow:
							"0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
						borderRadius: theme.shape.borderRadiusLg,

						"&:hover": {
							boxShadow: `0px 5px 22px 0px ${theme.palette.primaryContrast.shadow}`,
						},
					};
				},
			},
		},
		MuiCardHeader: {
			styleOverrides: {
				root: () => ({
					width: "100%",
					margin: "16px 0px 16px 0px",
					padding: "0px 16px 0px 16px",
				}),
				content: () => ({
					width: "80%",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
				}),
				action: () => ({}),
				title: () => ({
					width: "100%",
					overflow: "hidden",
					whiteSpace: "nowrap",
					textOverflow: "ellipsis",
				}),
			},
		},
		MuiCardContent: {
			styleOverrides: {
				root: () => ({
					width: "100%",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					margin: "0px 0px 16px 0px",
					padding: "0px 16px 0px 16px",
				}),
			},
		},
		MuiCardActions: {
			styleOverrides: {
				root: () => ({
					width: "100%",
					display: "flex",
					gap: "8px",
					margin: "0px 0px 16px 0px",
					padding: "0px 8px 0px 16px",
				}),
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: ({ theme }) => {
					return {
						boxShadow:
							"0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
						borderRadius: theme.shape.borderRadiusLg,
					};
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: () => ({
					boxShadow: "none",
				}),
			},
		},
	},
};
