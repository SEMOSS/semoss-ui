import "@testing-library/jest-dom";
// import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// import { Blocks } from "../../components/blocks";
import type {
	// CodeCell,
	CodeCellDef,
} from "../../components/cell-defaults/code-cell/CodeCell";
import { type CellState, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK interactions
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

const createCodeCellStore = () => {
	const store = new StateStore({
		mode: "interactive",
		insightId: "test-insight",
		state: {
			executionOrder: [],
			queries: {
				"query-1": {
					id: "query-1",
					cells: [
						{
							id: "1",
							widget: "query-import",
							parameters: {
								databaseId: "test-db",
								frameType: "PY",
								frameVariableName: "sourceFrame",
								selectQuery: "SELECT * FROM test",
								enableBatching: false,
								batchSize: 100,
								currentOffset: 0,
							},
						},
						{
							id: "2",
							widget: "code",
							parameters: {
								code: "print('test')",
								targetCell: {
									id: "1",
									frameVariableName: "sourceFrame",
								},
								language: "python",
							},
						},
					],
				},
			},
			variables: {},
			version: "1",
			blocks: {},
		},
		cellRegistry: {
			"query-import": {
				name: "Query",
				widget: "query-import",
				view: () => null,
				parameters: {
					databaseId: "",
					frameType: "PY",
					frameVariableName: "",
					selectQuery: "",
					enableBatching: false,
					batchSize: 100,
					currentOffset: 0,
				},
				toPixel: () => "",
			},
			code: {
				name: "Code",
				widget: "code",
				view: () => null,
				parameters: {
					code: "",
					targetCell: { id: "", frameVariableName: "" },
					language: "python",
				},
				toPixel: () => "",
			},
		},
	});

	const codeCell = store.queries["query-1"].cells[
		"2"
	] as CellState<CodeCellDef>;
	return { store, codeCell };
};

describe("CodeCell", () => {
	// it("should render the CodeCell component", () => {
	// 	const { store, codeCell } = createCodeCellStore();

	// 	const { container } = render(
	// 		<Blocks state={store} registry={{} as Registry}>
	// 			<CodeCell cell={codeCell} isExpanded={true} />
	// 		</Blocks>,
	// 	);

	// 	console.log({container})

	// 	expect(container).toBeDefined();
	// 	expect(codeCell.widget).toBe("code");
	// });

	it("should have code parameter set correctly", () => {
		const { codeCell } = createCodeCellStore();

		expect(codeCell.parameters.code).toBe("print('test')");
		expect(codeCell.parameters.language).toBe("python");
	});

	it("should have target cell reference configured", () => {
		const { codeCell } = createCodeCellStore();

		expect(codeCell.parameters.targetCell).toBeDefined();
		expect(codeCell.parameters.targetCell.id).toBe("1");
		expect(codeCell.parameters.targetCell.frameVariableName).toBe(
			"sourceFrame",
		);
	});
});
