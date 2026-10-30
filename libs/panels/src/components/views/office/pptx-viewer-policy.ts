import type { ViewerCustomization, ViewerTheme } from "pptx-react-viewer";

/** Keep presentation editing and basic playback in the supported vendor shell. */
export const PPTX_VIEWER_CUSTOMIZATION = {
	ribbon: {
		hiddenTabs: [
			"file",
			"transitions",
			"animations",
			"record",
			"review",
			"help",
		],
		hiddenGroups: [
			"slideShow.present",
			"slideShow.setUp",
			"slideShow.captions",
		],
		hiddenButtons: [
			"share",
			"broadcast",
			"export",
			"record",
			"notes",
			"slideShow.startSlideShow.customShow",
			"view.presentationViews.notesPage",
			"view.masterViews.handoutMaster",
			"view.masterViews.notesMaster",
			"view.show.notes",
			"view.window.macros",
		],
	},
	hiddenPanels: ["notes", "accessibilityPane", "comparePane"],
	disabledFeatures: ["ai", "collaboration", "comments"],
	hiddenDialogs: [
		"options",
		"share",
		"broadcast",
		"print",
		"export",
		"passwordProtection",
		"signatures",
	],
	capabilities: { export: false, print: false, share: false, comment: false },
	contextMenu: {
		hiddenElementCommands: [
			"ai-ask",
			"ai-fix",
			"comment",
			"save-as-picture",
		],
	},
	keyboard: { disabled: ["toggleShortcuts"] },
	options: {
		locked: {
			"advanced.slideShowShowMenuOnRightClick": false,
			"advanced.slideShowShowPopupToolbar": false,
		},
	},
	inspector: {
		hiddenCards: [
			"presentation",
			"slideTransition",
			"notesHandout",
			"document",
			"tags",
		],
	},
} satisfies ViewerCustomization;

/** Bridge only the viewer's chrome tokens; document colors remain document data. */
export const PPTX_VIEWER_THEME = {
	colors: {
		background: "var(--semoss-office-background)",
		foreground: "var(--semoss-office-foreground)",
		card: "var(--semoss-office-card)",
		cardForeground: "var(--semoss-office-card-foreground)",
		popover: "var(--semoss-office-popover)",
		popoverForeground: "var(--semoss-office-popover-foreground)",
		primary: "var(--semoss-office-primary)",
		primaryForeground: "var(--semoss-office-primary-foreground)",
		secondary: "var(--semoss-office-secondary)",
		secondaryForeground: "var(--semoss-office-secondary-foreground)",
		muted: "var(--semoss-office-muted)",
		mutedForeground: "var(--semoss-office-muted-foreground)",
		accent: "var(--semoss-office-accent)",
		accentForeground: "var(--semoss-office-accent-foreground)",
		destructive: "var(--semoss-office-destructive)",
		destructiveForeground: "var(--semoss-office-destructive-foreground)",
		border: "var(--semoss-office-border)",
		input: "var(--semoss-office-input)",
		ring: "var(--semoss-office-ring)",
	},
	radius: "var(--semoss-office-radius)",
	cssVars: { "--font-sans": "var(--semoss-office-font)" },
} satisfies ViewerTheme;
