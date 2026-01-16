import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Stack, TextField, Typography } from "@semoss/ui";
import { useBlocks } from "@/hooks";
import { ActionMessages, type CellComponent, type CellDef } from "@/store";

export interface MCPToolCellDef extends CellDef<"mcp-tool"> {
	widget: "mcp-tool";
	parameters: {
		/** Project id to run the tool call */
		projectId: string;
		/** Name of the function stored in smss driver */
		name: string;
		/** Params to execute tool */
		params: Record<string, unknown>;
	};
}

export const MCPToolCell: CellComponent<MCPToolCellDef> = observer((props) => {
	const { cell } = props;
	const { state } = useBlocks();

	const [params, setParams] = useState<Record<string, unknown>>({});
	const [loading, setLoading] = useState(true);

	/**
	 * @description
	 * Gets Params based on the mapped tool name
	 */
	useEffect(() => {
		const fetchParams = async () => {
			try {
				setLoading(true);
				const { errors, pixelReturn } = await runPixel(
					`GetAppAssets(project="${cell.parameters.projectId}", filePath="/mcp/py_mcp.json")`,
				);
				const mcpJson = JSON.parse(pixelReturn[0].output as string);
				const tool = mcpJson.tools.find(
					(t) => t.name === cell.parameters.name,
				);
				setParams(tool.inputSchema.properties || {});
			} catch (error) {
				console.error("Error fetching params:", error);
				setParams({});
			} finally {
				setLoading(false);
			}
		};

		fetchParams();
	}, [cell.parameters.projectId, cell.parameters.name]);

	const hasParams = Object.keys(params).length > 0;

	if (loading) {
		return <Typography variant="body1">Loading parameters...</Typography>;
	}

	return (
		<Stack>
			{hasParams ? (
				Object.entries(params).map(
					([key, value]: [string, unknown]) => {
						console.log("show field");
						return (
							<TextField
								key={key}
								label={(key as string) || ""}
								value={cell.parameters.params[key] || ""}
								onChange={(e) => {
									state.dispatch({
										message: ActionMessages.UPDATE_CELL,
										payload: {
											queryId: cell.query.id,
											cellId: cell.id,
											path: `parameters.params.${key}`,
											value: e.target.value, // Changed from 'value' to 'e.target.value'
										},
									});
								}}
							/>
						);
					},
				)
			) : (
				<Typography variant={"body1"}>
					No params found for {cell.parameters.name}
				</Typography>
			)}
		</Stack>
	);
});
