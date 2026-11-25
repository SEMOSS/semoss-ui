import type { ViewerCustomization } from "pptx-react-viewer";

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
	hiddenPanels: [
		"notes",
		"accessibilityPane",
		"comparePane",
		"quickAccessToolbar",
	],
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
