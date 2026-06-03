import type { MCP, MCPConfig, Prompt } from "@semoss/shared";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

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

/**
 * Convert the Prompt into a platform url
 */
export const promptToPlatformUrl = (prompt: Pick<Prompt, "id">): string => {
	return `${PLATFORM_URL}/#/prompt/${prompt.id}`;
};
