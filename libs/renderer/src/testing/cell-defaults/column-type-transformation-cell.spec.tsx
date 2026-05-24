import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	ColumnTypeTransformationCell,
	type ColumnTypeTransformationCellDef,
} from "../../components/cell-defaults/column-type-transformation-cell/column-type-transformation-cell";
import { type CellState, type Registry, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK pixel calls in ColumnTransformationField
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	column?: { name: string; dataType: string } | null;
	columnType?: string | null;
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		column = null,
		columnType = null,
	} = overrides || {};

	const store = new StateStore({
		mode: "interactive",
		insightId: "test",
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
								frameVariableName: targetFrameVariableName,
								selectQuery: "SELECT * FROM test",
								enableBatching: false,
								batchSize: 100,
								currentOffset: 0,
							},
						},
						{
							id: "2",
							widget: "column-type-transformation",
							parameters: {
								transformation: {
									key: "column-type",
									parameters: {
										column,
										columnType,
									},
								},
								targetCell: {
									id: targetCellId,
									frameVariableName: targetFrameVariableName,
								},
							},
						},
					],
				},
			},
			variables: {},
			version: "",
			blocks: {},
		},
		cellRegistry: {
			"query-import": {
				name: "Import",
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
			"column-type-transformation": {
				name: "Change Column Type",
				widget: "column-type-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "column-type",
						parameters: {
							column: null,
							columnType: null,
						},
					},
					targetCell: {
						id: "",
						frameVariableName: "",
					},
				},
				toPixel: () => "",
			},
		},
	});

	if (targetCellExecuted) {
		const targetCell = store.queries["query-1"].cells[targetCellId];
		if (targetCell) {
			targetCell._update("operation", ["FORMATTED_DATA_SET"]);
			if (targetCellOutput !== undefined) {
				targetCell._update("output", targetCellOutput);
			}
		}
	}

	const columnTypeCell = store.queries["query-1"].cells[
		"2"
	] as CellState<ColumnTypeTransformationCellDef>;

	return { store, columnTypeCell };
};

const renderColumnTypeCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, columnTypeCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<ColumnTypeTransformationCell
				cell={columnTypeCell}
				isExpanded={isExpanded}
			/>
		</Blocks>,
	);

	return { ...result, store, columnTypeCell };
};

describe("ColumnTypeTransformationCell", () => {
	beforeAll(() => {
		vi.stubGlobal("jest", {
			advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
		});
		vi.useFakeTimers();
	});

	afterAll(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.clearAllTimers();
		vi.unstubAllGlobals();
	});

	it("renders collapsed state as a chip when not expanded", () => {
		const { container } = renderColumnTypeCell({}, false);

		const chip = container.querySelector("span.rounded-full");
		expect(chip).toBeInTheDocument();
		expect(screen.getByText("Change Column Type")).toBeInTheDocument();
	});

	it("renders help text when target cell is not executed", () => {
		renderColumnTypeCell({ targetCellExecuted: false });

		expect(screen.getByText("Change Column Type")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderColumnTypeCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			columnType: "STRING",
		});

		expect(
			screen.getByText("Change the type of the selected column"),
		).toBeInTheDocument();
		expect(screen.getByText("Column")).toBeInTheDocument();
		expect(screen.getByText("STRING")).toBeInTheDocument();
	});
});
