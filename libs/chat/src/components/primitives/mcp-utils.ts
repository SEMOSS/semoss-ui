import {
	Archive,
	Bolt,
	BoxIcon,
	Cpu,
	Database,
	LayoutGrid,
	type LucideIcon,
	Sigma,
} from "lucide-react";
import type {
	App,
	Engine,
	MCP,
	MCPConfig,
	ProjectDependency,
} from "../../types";

/**
 * Ported verbatim from @semoss/shared's mcp-utils.ts (libs/shared/src/components/mcp/mcp-utils.ts)
 * as part of decoupling @semoss/chat from @semoss/shared — see docs/chat-components/PLAN.md.
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
			return Cpu;
		case "VECTOR":
			return Bolt;
		default:
			return BoxIcon;
	}
};

/**
 * Engines (from MyEngines) and Apps (from MyProjects) come back with different
 * field shapes — `engine_*` vs `project_*`. This normalizes either one into the
 * common MCP format.
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
 * Convert a ProjectDependency (from GetProjectDependencies) to the MCP shape.
 */
export const projectDependencyToMCP = (dep: ProjectDependency): MCP => ({
	id: dep.engine_id,
	name: dep.engine_name,
	type: dep.engine_type,
	subtype: dep.engine_subtype,
	description: dep.description ?? "",
	tags: dep.tags
		? dep.tags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean)
		: [],
	permission: dep.permission_name ?? "READ_ONLY",
});

/**
 * Derive the effective permission for a ProjectDependency, including
 * inaccessible states (DISCOVERABLE, FULLY_PRIVATE, REQUESTED) that
 * the base MCP.permission type doesn't cover.
 */
export const getDepEffectivePermission = (
	dep: ProjectDependency,
):
	| "READ_ONLY"
	| "EDIT"
	| "OWNER"
	| "REQUESTED"
	| "DISCOVERABLE"
	| "FULLY_PRIVATE" => {
	if (dep.permission_name) return dep.permission_name;
	if (dep.engine_global) return "READ_ONLY";
	if (dep.engine_discoverable) {
		return typeof dep.access_permission === "number"
			? "REQUESTED"
			: "DISCOVERABLE";
	}
	return "FULLY_PRIVATE";
};

export const isKnowledgeMcp = (mcp: Pick<MCPConfig, "type">): boolean =>
	mcp.type === "VECTOR";

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
