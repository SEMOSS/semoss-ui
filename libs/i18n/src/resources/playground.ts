// Playground-specific translations

import { coreResources } from "./core";
import chatAR from "./locales/ar/playground/chat.json";
import knowledgeAR from "./locales/ar/playground/knowledge.json";
import mcpAR from "./locales/ar/playground/mcp.json";
import roomAR from "./locales/ar/playground/room.json";
import sidebarAR from "./locales/ar/playground/sidebar.json";
import toolAR from "./locales/ar/playground/tool.json";
import tourAR from "./locales/ar/playground/tour.json";
import workspaceAR from "./locales/ar/playground/workspace.json";
// Playground-specific namespaces
import chatEN from "./locales/en/playground/chat.json";
import knowledgeEN from "./locales/en/playground/knowledge.json";
import mcpEN from "./locales/en/playground/mcp.json";
import roomEN from "./locales/en/playground/room.json";
import sidebarEN from "./locales/en/playground/sidebar.json";
import toolEN from "./locales/en/playground/tool.json";
import tourEN from "./locales/en/playground/tour.json";
import workspaceEN from "./locales/en/playground/workspace.json";
import chatES from "./locales/es/playground/chat.json";
import knowledgeES from "./locales/es/playground/knowledge.json";
import mcpES from "./locales/es/playground/mcp.json";
import roomES from "./locales/es/playground/room.json";
import sidebarES from "./locales/es/playground/sidebar.json";
import toolES from "./locales/es/playground/tool.json";
import tourES from "./locales/es/playground/tour.json";
import workspaceES from "./locales/es/playground/workspace.json";
import chatFR from "./locales/fr/playground/chat.json";
import knowledgeFR from "./locales/fr/playground/knowledge.json";
import mcpFR from "./locales/fr/playground/mcp.json";
import roomFR from "./locales/fr/playground/room.json";
import sidebarFR from "./locales/fr/playground/sidebar.json";
import toolFR from "./locales/fr/playground/tool.json";
import tourFR from "./locales/fr/playground/tour.json";
import workspaceFR from "./locales/fr/playground/workspace.json";
import chatHI from "./locales/hi/playground/chat.json";
import knowledgeHI from "./locales/hi/playground/knowledge.json";
import mcpHI from "./locales/hi/playground/mcp.json";
import roomHI from "./locales/hi/playground/room.json";
import sidebarHI from "./locales/hi/playground/sidebar.json";
import toolHI from "./locales/hi/playground/tool.json";
import tourHI from "./locales/hi/playground/tour.json";
import workspaceHI from "./locales/hi/playground/workspace.json";
import chatJA from "./locales/ja/playground/chat.json";
import knowledgeJA from "./locales/ja/playground/knowledge.json";
import mcpJA from "./locales/ja/playground/mcp.json";
import roomJA from "./locales/ja/playground/room.json";
import sidebarJA from "./locales/ja/playground/sidebar.json";
import toolJA from "./locales/ja/playground/tool.json";
import tourJA from "./locales/ja/playground/tour.json";
import workspaceJA from "./locales/ja/playground/workspace.json";
import chatNL from "./locales/nl/playground/chat.json";
import knowledgeNL from "./locales/nl/playground/knowledge.json";
import mcpNL from "./locales/nl/playground/mcp.json";
import roomNL from "./locales/nl/playground/room.json";
import sidebarNL from "./locales/nl/playground/sidebar.json";
import toolNL from "./locales/nl/playground/tool.json";
import tourNL from "./locales/nl/playground/tour.json";
import workspaceNL from "./locales/nl/playground/workspace.json";
import { sharedResources } from "./shared";

export const playgroundResources = {
	en: {
		...coreResources.en,
		...sharedResources.en,
		chat: chatEN,
		knowledge: knowledgeEN,
		mcp: mcpEN,
		room: roomEN,
		workspace: workspaceEN,
		sidebar: sidebarEN,
		tool: toolEN,
		tour: tourEN,
	},
	es: {
		...coreResources.es,
		...sharedResources.es,
		chat: chatES,
		knowledge: knowledgeES,
		mcp: mcpES,
		room: roomES,
		workspace: workspaceES,
		sidebar: sidebarES,
		tool: toolES,
		tour: tourES,
	},
	fr: {
		...coreResources.fr,
		...sharedResources.fr,
		chat: chatFR,
		knowledge: knowledgeFR,
		mcp: mcpFR,
		room: roomFR,
		workspace: workspaceFR,
		sidebar: sidebarFR,
		tool: toolFR,
		tour: tourFR,
	},
	hi: {
		...coreResources.hi,
		...sharedResources.hi,
		chat: chatHI,
		knowledge: knowledgeHI,
		mcp: mcpHI,
		room: roomHI,
		workspace: workspaceHI,
		sidebar: sidebarHI,
		tool: toolHI,
		tour: tourHI,
	},
	ar: {
		...coreResources.ar,
		...sharedResources.ar,
		chat: chatAR,
		knowledge: knowledgeAR,
		mcp: mcpAR,
		room: roomAR,
		workspace: workspaceAR,
		sidebar: sidebarAR,
		tool: toolAR,
		tour: tourAR,
	},
	ja: {
		...coreResources.ja,
		...sharedResources.ja,
		chat: chatJA,
		knowledge: knowledgeJA,
		mcp: mcpJA,
		room: roomJA,
		workspace: workspaceJA,
		sidebar: sidebarJA,
		tool: toolJA,
		tour: tourJA,
	},
	nl: {
		...coreResources.nl,
		chat: chatNL,
		knowledge: knowledgeNL,
		mcp: mcpNL,
		room: roomNL,
		workspace: workspaceNL,
		sidebar: sidebarNL,
		tool: toolNL,
		tour: tourNL,
	},
} as const;
