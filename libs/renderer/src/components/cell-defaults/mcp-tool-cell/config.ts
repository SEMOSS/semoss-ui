import type { CellConfig } from "../../../store";
import { MCPToolCell, type MCPToolCellDef } from "./MCPToolCell";

export const MCPToolCellConfig: CellConfig<MCPToolCellDef> = {
    name: "MCP tool",
    widget: "mcp-tool",
    parameters: {
        projectId: "",
        name: "",
        params: {}
    },
    view: MCPToolCell,
    toPixel: (params) => {
        const projId = params.projectId
        const functionName = params.name
        const mcpParams = params.params

        console.log("projId", projId)
        console.log("functionName", functionName)
        console.log("mcpParams", mcpParams)

        const pixel = `RunMCPTool(project=["${projId}"], function=["${functionName}"], paramValues=[${JSON.stringify(mcpParams)}])`;

        console.log(pixel)

        
        return `1+2`
    },
};
