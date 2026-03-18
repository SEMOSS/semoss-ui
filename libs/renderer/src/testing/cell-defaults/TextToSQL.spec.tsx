import TextToSqlCell from "../../components/cell-defaults/text-to-sql-cell/TextToSqlCell";
import { useBlocks } from "../../hooks";
import { render, renderHook, screen } from "../utils";

const blocks = {
	mcp_driver: {
		id: "mcp_driver",
		cells: [
			{
				id: "2",
				widget: "text-to-sql",
				parameters: {
					databaseId: "f9b656cc-06e7-4cce-bae8-b5f92075b6da",
					userQuery:
						"select all data from consolidated_settings database and on user_settings table",
					frameVariableName: "",
					model: "4acbe913-df40-4ac0-b28a-daa5ad91b172",
					dataFrameId: "",
					dataFrameQuery: "",
					targetCell: {
						id: "",
						frameVariableName: "",
					},
				},
			},
		],
	},

	variables: {
		mcp_driver: {
			to: "mcp_driver",
			type: "query",
		},
		"mcp_driver--2": {
			type: "cell",
			to: "mcp_driver",
			cellId: "2",
		},
	},
	executionOrder: ["mcp_driver"],
	version: "1.0.0-alpha.17",
};

describe("Text to SQL", () => {
	it("renders correctly", async () => {
		const { result } = renderHook(() => useBlocks(), {
			blocks,
		});

		// console.log({
		// 	result: JSON.stringify(result.current.notebook, undefined, 3),
		// });

		const { container } = render(<TextToSqlCell isExpanded={true} />, {
			blocks,
		});
		console.log({ result, container });
		screen.debug();
	});
});
