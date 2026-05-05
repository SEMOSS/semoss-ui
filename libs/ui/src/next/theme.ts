export type ThemePaletteColor = {
	dark: string;
	light: string;
	main: string;
};

export type ThemePreset = {
	palette: {
		primary: ThemePaletteColor;
		secondary: ThemePaletteColor;
		error: ThemePaletteColor;
		warning: ThemePaletteColor;
		info: ThemePaletteColor;
		success: ThemePaletteColor;
		text: {
			primary: string;
			secondary: string;
			disabled: string;
			main: string;
		};
		background: {
			paper: string;
			default: string;
		};
	};
	spacing: number;
};

export const lightTheme: ThemePreset = {
	palette: {
		primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0" },
		secondary: { main: "#9c27b0", light: "#ba68c8", dark: "#7b1fa2" },
		error: { main: "#d32f2f", light: "#ef5350", dark: "#c62828" },
		warning: { main: "#ed6c02", light: "#ff9800", dark: "#e65100" },
		info: { main: "#0288d1", light: "#03a9f4", dark: "#01579b" },
		success: { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20" },
		text: {
			primary: "#1f2937",
			secondary: "#6b7280",
			disabled: "#9ca3af",
			main: "#111827",
		},
		background: {
			paper: "#ffffff",
			default: "#f8fafc",
		},
	},
	spacing: 8,
};

export const darkTheme: ThemePreset = {
	palette: {
		primary: { main: "#90caf9", light: "#bbdefb", dark: "#42a5f5" },
		secondary: { main: "#ce93d8", light: "#e1bee7", dark: "#ab47bc" },
		error: { main: "#ef9a9a", light: "#ffcdd2", dark: "#e57373" },
		warning: { main: "#ffb74d", light: "#ffe0b2", dark: "#f57c00" },
		info: { main: "#81d4fa", light: "#b3e5fc", dark: "#29b6f6" },
		success: { main: "#a5d6a7", light: "#c8e6c9", dark: "#66bb6a" },
		text: {
			primary: "#f3f4f6",
			secondary: "#d1d5db",
			disabled: "#9ca3af",
			main: "#ffffff",
		},
		background: {
			paper: "#1f2937",
			default: "#111827",
		},
	},
	spacing: 8,
};
