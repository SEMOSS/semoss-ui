import type { CellConfig } from "../../../store";
import { MCPToolCell, type MCPToolCellDef } from "./MCPToolCell";

export const MCPToolCellConfig: CellConfig<MCPToolCellDef> = {
	name: "MCP tool",
	widget: "mcp-tool",
	parameters: {
		projectId: "",
		name: "",
		params: {},
		paramType: "pixel" as const,
	},
	view: MCPToolCell,
	toPixel: (params) => {
		const projId = params.projectId;
		const functionName = params.name;
		const mcpParams = params.params;
		return `RunMCPTool(project=["${projId}"], function=["${functionName}"], paramValues=[${JSON.stringify(mcpParams)}])`;
	},
};
