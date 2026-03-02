/**
 * TUI Color Themes
 *
 * Each theme defines colors for different UI elements.
 * Colors can be any valid Ink/chalk color name.
 */

export interface Theme {
	name: string;
	primary: string; // Main accent color (borders, highlights)
	secondary: string; // Secondary accent
	success: string; // Success/connected status
	error: string; // Error/disconnected status
	warning: string; // Warnings, labels
	info: string; // Info text
	muted: string; // Dimmed text color
	text: string; // Default text
}

export const themes: Record<string, Theme> = {
	"semoss-blue": {
		name: "SEMOSS Blue",
		primary: "cyan",
		secondary: "blue",
		success: "green",
		error: "red",
		warning: "yellow",
		info: "magenta",
		muted: "gray",
		text: "white",
	},
	ocean: {
		name: "Ocean",
		primary: "blueBright",
		secondary: "cyanBright",
		success: "greenBright",
		error: "redBright",
		warning: "yellowBright",
		info: "magentaBright",
		muted: "gray",
		text: "white",
	},
	forest: {
		name: "Forest",
		primary: "green",
		secondary: "greenBright",
		success: "greenBright",
		error: "red",
		warning: "yellow",
		info: "cyan",
		muted: "gray",
		text: "white",
	},
	sunset: {
		name: "Sunset",
		primary: "magenta",
		secondary: "red",
		success: "green",
		error: "redBright",
		warning: "yellowBright",
		info: "magentaBright",
		muted: "gray",
		text: "white",
	},
	monochrome: {
		name: "Monochrome",
		primary: "white",
		secondary: "gray",
		success: "white",
		error: "white",
		warning: "white",
		info: "white",
		muted: "gray",
		text: "white",
	},
	hacker: {
		name: "Hacker",
		primary: "greenBright",
		secondary: "green",
		success: "greenBright",
		error: "redBright",
		warning: "yellowBright",
		info: "greenBright",
		muted: "gray",
		text: "greenBright",
	},
	"girly-pop": {
		name: "Girly Pop",
		primary: "#ff69b4",
		secondary: "#ff1493",
		success: "#00ffff",
		error: "#ff6b6b",
		warning: "#ffb6c1",
		info: "#da70d6",
		muted: "#dda0dd",
		text: "#fff0f5",
	},
};

export const DEFAULT_THEME = "semoss-blue";

export const getThemeNames = (): string[] => Object.keys(themes);

export const getTheme = (name: string): Theme => {
	return themes[name] || themes[DEFAULT_THEME];
};
