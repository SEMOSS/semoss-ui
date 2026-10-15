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
		"members",
		"agent",
		"mcp",
		"chat",
		"knowledge",
		"room",
		"sidebar",
		"tool",
		"tour",
		"workspace",
		"mobile",
		"chatTools",
		"chatConnectors",
		"connectors",
	],
	load: {
		// core
		common: (l) => import(`./locales/${l}/common.json`),
		notifications: (l) => import(`./locales/${l}/notifications.json`),
		validation: (l) => import(`./locales/${l}/validation.json`),
		// shared
		prompts: (l) => import(`./locales/${l}/shared/prompts.json`),
		auditlog: (l) => import(`./locales/${l}/shared/auditlog.json`),
		members: (l) => import(`./locales/${l}/shared/members.json`),
		agent: (l) => import(`./locales/${l}/shared/agent.json`),
		// connectors: the Microsoft 365 and Google Workspace viewers
		connectors: (l) => import(`./locales/${l}/connectors/connectors.json`),
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
		// the default tools and the Chat Tools panel
		chatTools: (l) => import(`./locales/${l}/playground/chat-tools.json`),
		// the Microsoft 365 and Google Workspace connectors in a chat
		chatConnectors: (l) =>
			import(`./locales/${l}/playground/chat-connectors.json`),
	},
};
