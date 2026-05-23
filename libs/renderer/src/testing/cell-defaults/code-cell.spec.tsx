import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	CodeCell,
	type CodeCellDef,
} from "../../components/cell-defaults/code-cell/code-cell";
import { type CellState, type Registry, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK interactions
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

// Mock runPixel to avoid network calls
vi.mock("@semoss/sdk/react", () => ({
	runPixel: vi.fn(() =>
		Promise.resolve({
			pixelReturn: [
				{
					output: {
						response: "mock response",
						someFunction: "value",
					},
				},
			],
		}),
	),
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
							id: "0",
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
							id: "1",
							widget: "code",
							parameters: {
								type: "py",
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

	const codeCell = store.queries["query-1"]
		.cells[1] as CellState<CodeCellDef>;
	return { store, codeCell };
};

describe("CodeCell", () => {
	it("should render the CodeCell component", () => {
		const { store, codeCell } = createCodeCellStore();

		const { container } = render(
			<Blocks state={store} registry={{} as Registry}>
				<CodeCell cell={codeCell} isExpanded={true} />
			</Blocks>,
		);

		expect(container).toBeDefined();
		expect(codeCell.widget).toBe("code");
	});

	it("should have code parameter set correctly", () => {
		const { codeCell } = createCodeCellStore();
		const params = codeCell.parameters as Record<string, unknown>;

		expect(params.code).toBe("print('test')");
		expect(params.language).toBe("python");
	});

	it("should have target cell reference configured", () => {
		const { codeCell } = createCodeCellStore();
		const params = codeCell.parameters as Record<string, unknown>;
		const targetCell = params.targetCell as Record<string, unknown>;

		expect(targetCell).toBeDefined();
		expect(targetCell.id).toBe("1");
		expect(targetCell.frameVariableName).toBe("sourceFrame");
	});
});
