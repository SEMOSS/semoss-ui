// Client-specific lazy translations.
//
// Core + shared + githubApp namespaces are preloaded; the embedded workspace
// terminal's namespaces (console/file/chrome/dialog) are loadable on demand
// (see preloadNamespaces) so they don't weigh down first paint.
import type { LazyResources } from "./types";

export const clientResources: LazyResources = {
	ns: [
		"common",
		"notifications",
		"validation",
		"mcp",
		"prompts",
		"auditlog",
		"githubApp",
	],
	load: {
		// core
		common: (l) => import(`./locales/${l}/common.json`),
		notifications: (l) => import(`./locales/${l}/notifications.json`),
		validation: (l) => import(`./locales/${l}/validation.json`),
		// shared (MCP + prompt selectors + audit log)
		mcp: (l) => import(`./locales/${l}/shared/mcp.json`),
		prompts: (l) => import(`./locales/${l}/shared/prompts.json`),
		auditlog: (l) => import(`./locales/${l}/shared/auditlog.json`),
		// client
		githubApp: (l) => import(`./locales/${l}/client/githubApp.json`),
		// embedded terminal — fetched on demand when the terminal panel mounts
		console: (l) => import(`./locales/${l}/terminal/console.json`),
		file: (l) => import(`./locales/${l}/terminal/file.json`),
		chrome: (l) => import(`./locales/${l}/terminal/chrome.json`),
		dialog: (l) => import(`./locales/${l}/terminal/dialog.json`),
	},
};
