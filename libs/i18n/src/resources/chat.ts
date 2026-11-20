// Lazy translations for `@semoss/chat`: every namespace its pieces read.
// A host that mounts chat UI loads all of them, with its own on top.
//
// `mcp` is the chat's own copy; it intentionally overrides the shared MCP
// namespace that the client loads.
import type { LazyResources } from "./types";

export const chatResources: LazyResources = {
	ns: [
		"common",
		"notifications",
		"validation",
		"prompts",
		"auditlog",
		"members",
		"agent",
		"transcript",
		"connectors",
		"mcp",
		"chat",
		"knowledge",
		"room",
		"sidebar",
		"tool",
		"workspace",
		"chatTools",
		"chatConnectors",
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
		// how a chat reply's reasoning and tool calls read, in every chat
		transcript: (l) => import(`./locales/${l}/shared/transcript.json`),
		// connectors: the Microsoft 365 and Google Workspace viewers
		connectors: (l) => import(`./locales/${l}/connectors/connectors.json`),
		// the chat itself
		mcp: (l) => import(`./locales/${l}/chat/mcp.json`),
		chat: (l) => import(`./locales/${l}/chat/chat.json`),
		knowledge: (l) => import(`./locales/${l}/chat/knowledge.json`),
		room: (l) => import(`./locales/${l}/chat/room.json`),
		sidebar: (l) => import(`./locales/${l}/chat/sidebar.json`),
		tool: (l) => import(`./locales/${l}/chat/tool.json`),
		workspace: (l) => import(`./locales/${l}/chat/workspace.json`),
		// the default tools and the Tools section of Settings
		chatTools: (l) => import(`./locales/${l}/chat/chat-tools.json`),
		// the Microsoft 365 and Google Workspace connectors in a chat
		chatConnectors: (l) =>
			import(`./locales/${l}/chat/chat-connectors.json`),
	},
};
