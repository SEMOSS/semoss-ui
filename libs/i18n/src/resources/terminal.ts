// Terminal-specific lazy translations (standalone terminal app).
import type { LazyResources } from "./types";

export const terminalResources: LazyResources = {
	ns: [
		"common",
		"notifications",
		"validation",
		"console",
		"file",
		"chrome",
		"dialog",
	],
	load: {
		// core
		common: (l) => import(`./locales/${l}/common.json`),
		notifications: (l) => import(`./locales/${l}/notifications.json`),
		validation: (l) => import(`./locales/${l}/validation.json`),
		// terminal
		console: (l) => import(`./locales/${l}/terminal/console.json`),
		file: (l) => import(`./locales/${l}/terminal/file.json`),
		chrome: (l) => import(`./locales/${l}/terminal/chrome.json`),
		dialog: (l) => import(`./locales/${l}/terminal/dialog.json`),
	},
};
