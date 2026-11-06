// The chat UI's lazy translations (`@semoss/chat`): everything its rooms,
// composer, Workspace, agents, knowledge and settings read, including the
// core and shared namespaces it uses. A chat host loads these, then adds its
// own namespaces (see `playgroundResources`).
//
// `mcp` resolves to the chat's own copy (it intentionally overrides the
// shared MCP namespace); `prompts` comes from the shared selectors.
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
		// chat (note: chat/mcp.json overrides shared/mcp.json)
		mcp: (l) => import(`./locales/${l}/chat/mcp.json`),
		chat: (l) => import(`./locales/${l}/chat/chat.json`),
		knowledge: (l) => import(`./locales/${l}/chat/knowledge.json`),
		room: (l) => import(`./locales/${l}/chat/room.json`),
		// rooms lists, room actions and the settings dialog
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
