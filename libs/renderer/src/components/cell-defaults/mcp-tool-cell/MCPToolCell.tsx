import { useBlocks } from '@/hooks';
import { CellComponent, CellDef } from '@/store';
import { Stack, TextField } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import React from 'react'

export interface MCPToolCellDef extends CellDef<"mcp-tool"> {
    widget: "mcp-tool";
    parameters: {
        /** Project id to run the tool call */
        projectId: string;
        /** Name of the function stored in smss driver */
        name: string;
        /** Params to execute tool */
        params: Record<string, unknown>
    }
}

export const MCPToolCell: CellComponent<MCPToolCellDef> = observer((props) => {
  const { cell, isExpanded, agentModelEngine } = props;

    const { state, notebook } = useBlocks();
    const query = cell.query.id;

    console.log("MCPTOOLCell", cell)

  return (
    <Stack>
			{Object.entries(cell.mcpEnabled.inputSchema.properties).map(
				([key, value]: [string, unknown]) => {
					return (
						<TextField
							label={(key as string) || ""}
							value={cell.mcpParameters[key] || ""}
							onChange={(e) => {
								debugger;
								cell.setMCPParameters(key, e.target.value);
							}}
						/>
					);
				},
			)}
		</Stack>
  )
})
