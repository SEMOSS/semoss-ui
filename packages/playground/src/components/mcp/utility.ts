import {
	Archive,
	Bolt,
	Bot,
	BoxIcon,
	Database,
	LayoutGrid,
	type LucideIcon,
	Sigma,
} from "lucide-react";
import type { App, Engine, MCP, MCPConfig } from "@/types";

/**
 * Map each MCP type to its standard lucide icon. Mirrors the catalog
 * sidebar in `packages/client/src/components/shared/app-sidebar.tsx`
 * so the same engine concepts share a visual across products.
 */
export const getMcpTypeIcon = (type: MCPConfig["type"]): LucideIcon => {
	switch (type) {
		case "PROJECT":
			return LayoutGrid;
		case "STORAGE":
			return Archive;
		case "DATABASE":
			return Database;
		case "FUNCTION":
			return Sigma;
		case "MODEL":
			return Bot;
		case "VECTOR":
			return Bolt;
		default:
			return BoxIcon;
	}
};

/**
 * Knowledge MCPs are backed by a VECTOR engine. Everything else is toolbox.
 */
export const isKnowledgeMcp = (mcp: Pick<MCPConfig, "type">): boolean =>
	mcp.type === "VECTOR";

/**
 * Split a mixed MCP list into its knowledge and toolbox subsets.
 */
export const splitMcpByType = (
	mcps: MCPConfig[],
): { knowledge: MCPConfig[]; toolbox: MCPConfig[] } => {
	const knowledge: MCPConfig[] = [];
	const toolbox: MCPConfig[] = [];
	for (const mcp of mcps) {
		if (isKnowledgeMcp(mcp)) {
			knowledge.push(mcp);
		} else {
			toolbox.push(mcp);
		}
	}
	return { knowledge, toolbox };
};

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

/**
 * MyEngineProjects returns responses in a strange foramt where Engines and Apps have different structures.
 * This function normalizes them into a common Toolbox format.
 * @param tool The engine or app to convert
 * @returns The normalized MCP object
 */
export const engineProjectToMCP = (tool: Engine | App): MCP => {
	if ("engine_type" in tool) {
		// It's an Engine
		return {
			type: tool.engine_type,
			id: tool.engine_id,
			name: tool.engine_display_name || tool.engine_name,
			subtype: tool.engine_subtype,
			description: tool.description || "",
			tags: [], // Tags are not provided in the current response
			permission:
				tool.engine_user_permission === 1
					? "OWNER"
					: tool.engine_user_permission === 2
						? "EDIT"
						: "READ_ONLY",
		};
	} else {
		// It's an App
		return {
			type: "PROJECT",
			id: tool.project_id,
			name: tool.project_display_name || tool.project_name,
			description: tool.description || "",
			tags: [], // Tags are not provided in the current response
			permission:
				tool.user_permission === 1
					? "OWNER"
					: tool.user_permission === 2
						? "EDIT"
						: "READ_ONLY",
		};
	}
};

/**
 * Convert the MCP into a platform url
 */
export const mcpToPlatformUrl = (
	mcp:
		| Pick<MCP, "type" | "id">
		| {
				engine_id: string;
				engine_type: string;
		  },
): string => {
	const id = "id" in mcp ? mcp.id : mcp.engine_id;
	const type = "type" in mcp ? mcp.type : mcp.engine_type;
	if (type === "PROJECT") {
		return `${PLATFORM_URL}/#/app/${id}/mcp-usage`;
	}
	return `${PLATFORM_URL}/#/engine/${type.toLowerCase()}/${id}/mcp-usage`;
};
