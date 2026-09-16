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
	Prompt,
} from "../../types";

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
	type:
		dep.engine_type === "SKILL" ||
		dep.engine_type === "WORKSPACE" ||
		dep.engine_type === "BLOCKS" ||
		dep.engine_type === "CODE" ||
		dep.engine_type === "INSIGHT"
			? "PROJECT"
			: dep.engine_type,
	subtype: dep.engine_subtype,
	description: dep.description ?? "",
	tags: dep.tags
		? dep.tags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean)
		: [],
	permission:
		dep.permission_name && dep.permission_name !== "DISCOVERABLE"
			? dep.permission_name
			: "READ_ONLY",
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

export const createMcpPlatformUrl =
	(baseUrl: string) =>
	(
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
			return `${baseUrl}/#/app/${id}/mcp-usage`;
		}
		return `${baseUrl}/#/engine/${type.toLowerCase()}/${id}/mcp-usage`;
	};

export const createPromptPlatformUrl =
	(baseUrl: string) =>
	(prompt: Pick<Prompt, "id">): string =>
		`${baseUrl}/#/prompt/${prompt.id}`;

/**
 * Reserved id the backend puts on SMSS_ENGINE_ID for room-scoped tools. There is
 * no catalog entry behind it: it tells the backend to read the tools from the
 * room's own asset folder, so it must never be used as a project or engine id.
 */
const ROOM_MCP_ID = "__room__";

/** The subset of a tool's `_meta` that carries its owning app. */
export type ToolOwnerMeta = {
	SMSS_ENGINE_ID?: string;
	SMSS_PROJECT_ID?: string;
};

/**
 * Id to pass to backend pixels that resolve a tool, such as RunMCPTool.
 *
 * SMSS_ENGINE_ID is the canonical key and is set for every engine type; the
 * deprecated SMSS_PROJECT_ID is only a fallback for older tool definitions. The
 * room sentinel is kept because the backend resolves room tools by it.
 */
export const getToolEngineId = (meta: ToolOwnerMeta | undefined): string =>
	meta?.SMSS_ENGINE_ID || meta?.SMSS_PROJECT_ID || "";

/**
 * Id to use when loading a tool's UI or looking up its metadata, where the value
 * has to be a real catalog entry. Same preference as {@link getToolEngineId},
 * except the room sentinel resolves to empty so callers skip the lookup rather
 * than asking the catalog for an id that cannot exist.
 */
export const getToolAppId = (meta: ToolOwnerMeta | undefined): string => {
	const engineId = getToolEngineId(meta);
	return engineId === ROOM_MCP_ID ? "" : engineId;
};
