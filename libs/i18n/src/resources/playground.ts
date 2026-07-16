// Playground-specific lazy translations.
//
// `mcp` resolves to the playground's own copy (it intentionally overrides the
// shared MCP namespace); `prompts` comes from the shared selectors.
import type { LazyResources } from "./types";

export const playgroundResources: LazyResources = {
	ns: [
		"common",
		"notifications",
		"validation",
		"prompts",
		"auditlog",
		"mcp",
		"chat",
		"knowledge",
		"room",
		"sidebar",
		"tool",
		"tour",
		"workspace",
		"mobile",
	],
	load: {
		// core
		common: (l) => import(`./locales/${l}/common.json`),
		notifications: (l) => import(`./locales/${l}/notifications.json`),
		validation: (l) => import(`./locales/${l}/validation.json`),
		// shared
		prompts: (l) => import(`./locales/${l}/shared/prompts.json`),
		auditlog: (l) => import(`./locales/${l}/shared/auditlog.json`),
		// playground (note: playground/mcp.json overrides shared/mcp.json)
		mcp: (l) => import(`./locales/${l}/playground/mcp.json`),
		chat: (l) => import(`./locales/${l}/playground/chat.json`),
		knowledge: (l) => import(`./locales/${l}/playground/knowledge.json`),
		room: (l) => import(`./locales/${l}/playground/room.json`),
		sidebar: (l) => import(`./locales/${l}/playground/sidebar.json`),
		tool: (l) => import(`./locales/${l}/playground/tool.json`),
		tour: (l) => import(`./locales/${l}/playground/tour.json`),
		workspace: (l) => import(`./locales/${l}/playground/workspace.json`),
		mobile: (l) => import(`./locales/${l}/playground/mobile.json`),
	},
};
