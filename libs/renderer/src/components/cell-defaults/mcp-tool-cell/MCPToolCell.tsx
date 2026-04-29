import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Input } from "@semoss/ui/next";
import { useBlocks } from "@/hooks";
import { ActionMessages, type CellComponent, type CellDef } from "@/store";

export interface MCPToolCellDef extends CellDef<"mcp-tool"> {
	widget: "mcp-tool";
	parameters: {
		projectId: string;
		name: string;
		params: Record<string, unknown>;
		paramType: "python" | "pixel";
	};
}

export const MCPToolCell: CellComponent<MCPToolCellDef> = observer((props) => {
	const { cell } = props;
	const { state } = useBlocks();

	const [params, setParams] = useState<Record<string, unknown>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchParams = async () => {
			try {
				setLoading(true);
				const { pixelReturn } = await runPixel(
					`GetAppAssets(project="${cell.parameters.projectId}", filePath="${cell.parameters.paramType === "python" ? "/mcp/py_mcp.json" : "/mcp/pixel_mcp.json"}")`,
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
		return <p className="text-sm">Loading parameters...</p>;
	}

	return (
		<div className="flex flex-col gap-2">
			{hasParams ? (
				Object.entries(params).map(([key]) => (
					<div key={key} className="flex flex-col gap-1.5">
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
						<label className="text-muted-foreground text-xs">
							{key}
						</label>
						<Input
							value={
								(cell.parameters.params[key] as string) || ""
							}
							onChange={(e) => {
								state.dispatch({
									message: ActionMessages.UPDATE_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
										path: `parameters.params.${key}`,
										value: e.target.value,
									},
								});
							}}
						/>
					</div>
				))
			) : (
				<p className="text-sm">
					No params found for {cell.parameters.name}
				</p>
			)}
		</div>
	);
});
