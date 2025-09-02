import { observer } from "mobx-react-lite";
import { useBlocks } from "@semoss/renderer";
import { Stack, TextField } from "@semoss/ui";

interface CellMCPFormProps {
	/** Id of the  the query */
	queryId: string;

	/** Id of the cell of the query */
	cellId: string;
}
export const CellMCPForm = observer((props: CellMCPFormProps): JSX.Element => {
	const { queryId, cellId } = props;
	const { state, notebook } = useBlocks();
	const query = state.getQuery(queryId);
	const cell = query.getCell(cellId);

	console.log(cell.mcpEnabled);

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
	);
});
