// Playground-specific translations

import { coreResources } from "./core";
import chatAR from "./locales/ar/playground/chat.json";
import knowledgeAR from "./locales/ar/playground/knowledge.json";
import mcpAR from "./locales/ar/playground/mcp.json";
import roomAR from "./locales/ar/playground/room.json";
import sidebarAR from "./locales/ar/playground/sidebar.json";
import workspaceAR from "./locales/ar/playground/workspace.json";
// Playground-specific namespaces
import chatEN from "./locales/en/playground/chat.json";
import knowledgeEN from "./locales/en/playground/knowledge.json";
import mcpEN from "./locales/en/playground/mcp.json";
import roomEN from "./locales/en/playground/room.json";
import sidebarEN from "./locales/en/playground/sidebar.json";
import workspaceEN from "./locales/en/playground/workspace.json";
import chatES from "./locales/es/playground/chat.json";
import knowledgeES from "./locales/es/playground/knowledge.json";
import mcpES from "./locales/es/playground/mcp.json";
import roomES from "./locales/es/playground/room.json";
import sidebarES from "./locales/es/playground/sidebar.json";
import workspaceES from "./locales/es/playground/workspace.json";
import chatFR from "./locales/fr/playground/chat.json";
import knowledgeFR from "./locales/fr/playground/knowledge.json";
import mcpFR from "./locales/fr/playground/mcp.json";
import roomFR from "./locales/fr/playground/room.json";
import sidebarFR from "./locales/fr/playground/sidebar.json";
import workspaceFR from "./locales/fr/playground/workspace.json";
import chatHI from "./locales/hi/playground/chat.json";
import knowledgeHI from "./locales/hi/playground/knowledge.json";
import mcpHI from "./locales/hi/playground/mcp.json";
import roomHI from "./locales/hi/playground/room.json";
import sidebarHI from "./locales/hi/playground/sidebar.json";
import workspaceHI from "./locales/hi/playground/workspace.json";
import chatJA from "./locales/ja/playground/chat.json";
import knowledgeJA from "./locales/ja/playground/knowledge.json";
import mcpJA from "./locales/ja/playground/mcp.json";
import roomJA from "./locales/ja/playground/room.json";
import sidebarJA from "./locales/ja/playground/sidebar.json";
import workspaceJA from "./locales/ja/playground/workspace.json";

export const playgroundResources = {
	en: {
		...coreResources.en,
		chat: chatEN,
		knowledge: knowledgeEN,
		mcp: mcpEN,
		room: roomEN,
		workspace: workspaceEN,
		sidebar: sidebarEN,
	},
	es: {
		...coreResources.es,
		chat: chatES,
		knowledge: knowledgeES,
		mcp: mcpES,
		room: roomES,
		workspace: workspaceES,
		sidebar: sidebarES,
	},
	fr: {
		...coreResources.fr,
		chat: chatFR,
		knowledge: knowledgeFR,
		mcp: mcpFR,
		room: roomFR,
		workspace: workspaceFR,
		sidebar: sidebarFR,
	},
	hi: {
		...coreResources.hi,
		chat: chatHI,
		knowledge: knowledgeHI,
		mcp: mcpHI,
		room: roomHI,
		workspace: workspaceHI,
		sidebar: sidebarHI,
	},
	ar: {
		...coreResources.ar,
		chat: chatAR,
		knowledge: knowledgeAR,
		mcp: mcpAR,
		room: roomAR,
		workspace: workspaceAR,
		sidebar: sidebarAR,
	},
	ja: {
		...coreResources.ja,
		chat: chatJA,
		knowledge: knowledgeJA,
		mcp: mcpJA,
		room: roomJA,
		workspace: workspaceJA,
		sidebar: sidebarJA,
	},
} as const;
