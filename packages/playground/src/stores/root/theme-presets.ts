/**
 * Preset theme definitions for the playground.
 *
 * Each preset specifies:
 *  - `mode`: the base light/dark mode (controls the `.dark` CSS class)
 *  - `cssVariables`: optional CSS custom-property overrides applied to `:root`
 *  - `backgroundEffect`: optional ambient CSS animation class for the landing page
 *  - `overlayClassName`: optional Tailwind classes for the image overlay tint
 */

export interface ThemePreset {
	/** Unique key stored in localStorage */
	id: string;
	/** Human-readable label shown in the UI */
	name: string;
	/** Base color-scheme mode */
	mode: "light" | "dark";
	/** Optional CSS variable overrides applied on top of the base mode */
	cssVariables?: Record<string, string>;
	/** Optional CSS class(es) applied to the ambient background layer on the landing page */
	backgroundEffect?: string;
	/** Optional Tailwind classes for the overlay between the image and content */
	overlayClassName?: string;
	/**
	 * Optional CSS gradient class used instead of the landing photo.
	 * When set, the <img> is hidden and this gradient is shown instead.
	 */
	backgroundGradient?: string;
	/**
	 * Optional path to a video file used as the background.
	 * When set, a looping muted <video> is rendered instead of an image or gradient.
	 */
	backgroundVideo?: string;
}

/** localStorage key used to persist the selected preset */
export const THEME_PRESET_STORAGE_KEY = "playground-theme-preset";

/**
 * Built-in preset themes.
 */
export const THEME_PRESETS: ThemePreset[] = [
	{
		id: "light",
		name: "Light",
		mode: "light",
		backgroundEffect: "",
		overlayClassName: "bg-background/60",
	},
	{
		id: "dark",
		name: "Dark",
		mode: "dark",
		backgroundEffect: "preset-bg-stars",
		overlayClassName: "bg-background/50",
		backgroundGradient: "",
	},
	{
		id: "midnight",
		name: "Midnight",
		mode: "dark",
		backgroundEffect: "preset-bg-aurora",
		overlayClassName: "bg-background/30",
		backgroundGradient: "",
		backgroundVideo: "earth",
		cssVariables: {
			"--primary": "rgba(99, 102, 241, 1)",
			"--primary-foreground": "rgba(255, 255, 255, 1)",
			"--ring": "rgba(99, 102, 241, 0.5)",
			"--background": "rgba(15, 15, 35, 1)",
			"--secondary-background": "rgba(25, 25, 50, 1)",
			"--foreground": "rgba(230, 230, 255, 1)",
			"--card": "rgba(20, 20, 45, 1)",
			"--card-foreground": "rgba(230, 230, 255, 1)",
			"--popover": "rgba(25, 25, 50, 1)",
			"--popover-foreground": "rgba(230, 230, 255, 1)",
			"--muted": "rgba(30, 30, 60, 1)",
			"--muted-foreground": "rgba(160, 160, 200, 1)",
			"--accent": "rgba(40, 40, 80, 1)",
			"--accent-foreground": "rgba(230, 230, 255, 1)",
			"--border": "rgba(99, 102, 241, 0.15)",
			"--input": "rgba(99, 102, 241, 0.2)",
			"--sidebar": "rgba(10, 10, 30, 1)",
			"--sidebar-foreground": "rgba(200, 200, 240, 1)",
			"--sidebar-primary": "rgba(99, 102, 241, 1)",
			"--sidebar-primary-foreground": "rgba(255, 255, 255, 1)",
			"--sidebar-accent": "rgba(30, 30, 70, 1)",
			"--sidebar-accent-foreground": "rgba(200, 200, 240, 1)",
			"--sidebar-border": "rgba(99, 102, 241, 0.15)",
		},
	},
	{
		id: "sunset",
		name: "Sun",
		mode: "light",
		backgroundEffect: "preset-bg-glow",
		overlayClassName: "bg-background/30",
		backgroundGradient: "",
		cssVariables: {
			"--primary": "rgba(234, 88, 12, 1)",
			"--primary-foreground": "rgba(255, 255, 255, 1)",
			"--ring": "rgba(234, 88, 12, 0.4)",
			"--background": "rgba(255, 251, 245, 1)",
			"--secondary-background": "rgba(255, 247, 237, 1)",
			"--foreground": "rgba(35, 25, 15, 1)",
			"--card": "rgba(255, 249, 240, 1)",
			"--card-foreground": "rgba(35, 25, 15, 1)",
			"--muted": "rgba(255, 237, 213, 1)",
			"--muted-foreground": "rgba(140, 100, 60, 1)",
			"--accent": "rgba(255, 237, 213, 1)",
			"--accent-foreground": "rgba(35, 25, 15, 1)",
			"--border": "rgba(234, 88, 12, 0.15)",
			"--input": "rgba(234, 88, 12, 0.15)",
			"--sidebar": "rgba(45, 20, 10, 1)",
			"--sidebar-foreground": "rgba(255, 237, 213, 1)",
			"--sidebar-primary": "rgba(251, 146, 60, 1)",
			"--sidebar-primary-foreground": "rgba(255, 255, 255, 1)",
			"--sidebar-accent": "rgba(70, 30, 15, 1)",
			"--sidebar-accent-foreground": "rgba(255, 237, 213, 1)",
			"--sidebar-border": "rgba(251, 146, 60, 0.2)",
		},
	},
	{
		id: "stone",
		name: "Stone",
		mode: "light",
		backgroundEffect: "",
		overlayClassName: "bg-background/65",
		backgroundGradient: "preset-gradient-stone",
		cssVariables: {
			"--primary": "rgba(120, 113, 108, 1)",
			"--primary-foreground": "rgba(255, 255, 255, 1)",
			"--ring": "rgba(120, 113, 108, 0.4)",
			"--background": "rgba(250, 250, 249, 1)",
			"--secondary-background": "rgba(245, 245, 244, 1)",
			"--foreground": "rgba(28, 25, 23, 1)",
			"--card": "rgba(250, 250, 249, 1)",
			"--card-foreground": "rgba(28, 25, 23, 1)",
			"--muted": "rgba(231, 229, 228, 1)",
			"--muted-foreground": "rgba(120, 113, 108, 1)",
			"--accent": "rgba(231, 229, 228, 1)",
			"--accent-foreground": "rgba(28, 25, 23, 1)",
			"--border": "rgba(214, 211, 209, 1)",
			"--input": "rgba(214, 211, 209, 1)",
			"--sidebar": "rgba(41, 37, 36, 1)",
			"--sidebar-foreground": "rgba(231, 229, 228, 1)",
			"--sidebar-primary": "rgba(168, 162, 158, 1)",
			"--sidebar-primary-foreground": "rgba(255, 255, 255, 1)",
			"--sidebar-accent": "rgba(68, 64, 60, 1)",
			"--sidebar-accent-foreground": "rgba(231, 229, 228, 1)",
			"--sidebar-border": "rgba(168, 162, 158, 0.2)",
		},
	},
	{
		id: "deloitte",
		name: "Deloitte",
		mode: "light",
		backgroundEffect: "",
		overlayClassName: "bg-background/60",
		backgroundGradient: "",
		backgroundVideo: "deloitte-theme",
		cssVariables: {
			"--primary": "rgba(134, 188, 37, 1)",
			"--primary-foreground": "rgba(255, 255, 255, 1)",
			"--ring": "rgba(134, 188, 37, 0.5)",
			"--sidebar": "rgba(0, 33, 8, 1)",
			"--sidebar-foreground": "rgba(240, 245, 235, 1)",
			"--sidebar-primary": "rgba(134, 188, 37, 1)",
			"--sidebar-primary-foreground": "rgba(255, 255, 255, 1)",
			"--sidebar-accent": "rgba(20, 55, 20, 1)",
			"--sidebar-accent-foreground": "rgba(240, 245, 235, 1)",
			"--sidebar-border": "rgba(134, 188, 37, 0.2)",
			"--accent": "rgba(235, 245, 220, 1)",
			"--accent-foreground": "rgba(23, 23, 23, 1)",
			"--chart-1": "rgba(134, 188, 37, 1)",
			"--chart-2": "rgba(0, 163, 104, 1)",
		},
	},
	{
		id: "mhs",
		name: "MHS",
		mode: "light",
		backgroundEffect: "",
		overlayClassName: "bg-background/40",
		backgroundGradient: "preset-gradient-mhs",
		cssVariables: {
			"--primary": "rgba(40, 52, 70, 1)",
			"--primary-foreground": "rgba(255, 255, 255, 1)",
			"--ring": "rgba(40, 52, 70, 0.3)",
			"--background": "rgba(248, 250, 252, 1)",
			"--secondary-background": "rgba(241, 245, 249, 1)",
			"--foreground": "rgba(30, 41, 59, 1)",
			"--card": "rgba(255, 255, 255, 1)",
			"--card-foreground": "rgba(30, 41, 59, 1)",
			"--popover": "rgba(255, 255, 255, 1)",
			"--popover-foreground": "rgba(30, 41, 59, 1)",
			"--muted": "rgba(226, 232, 240, 1)",
			"--muted-foreground": "rgba(100, 116, 139, 1)",
			"--accent": "rgba(120, 0, 0, 1)",
			"--accent-foreground": "rgba(255, 255, 255, 1)",
			"--border": "rgba(203, 213, 225, 1)",
			"--input": "rgba(203, 213, 225, 1)",
			"--sidebar": "rgba(40, 52, 70, 1)",
			"--sidebar-foreground": "rgba(203, 213, 225, 1)",
			"--sidebar-primary": "rgba(120, 0, 0, 1)",
			"--sidebar-primary-foreground": "rgba(255, 255, 255, 1)",
			"--sidebar-accent": "rgba(61, 77, 105, 1)",
			"--sidebar-accent-foreground": "rgba(226, 232, 240, 1)",
			"--sidebar-border": "rgba(61, 77, 105, 0.5)",
			"--chart-1": "rgba(40, 52, 70, 1)",
			"--chart-2": "rgba(120, 0, 0, 1)",
		},
	},
];

/**
 * CSS variable keys that presets may override.
 * Used to clear previous overrides when switching presets.
 */
export const PRESET_CSS_KEYS: string[] = [
	"--primary",
	"--primary-foreground",
	"--ring",
	"--background",
	"--secondary-background",
	"--foreground",
	"--card",
	"--card-foreground",
	"--popover",
	"--popover-foreground",
	"--muted",
	"--muted-foreground",
	"--accent",
	"--accent-foreground",
	"--border",
	"--input",
	"--sidebar",
	"--sidebar-foreground",
	"--sidebar-primary",
	"--sidebar-primary-foreground",
	"--sidebar-accent",
	"--sidebar-accent-foreground",
	"--sidebar-border",
	"--chart-1",
	"--chart-2",
];
