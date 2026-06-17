import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	UpdateRowTransformationCell,
	type UpdateRowTransformationCellDef,
} from "../../components/cell-defaults/update-row-transformation-cell/update-row-transformation-cell";
import { type CellState, type Registry, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK pixel calls in ColumnTransformationField
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

/**
 * Helper to create a StateStore with a query containing
 * a query-import cell and a update-row-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	compareColumn?: { name: string; dataType: string } | null;
	compareValue?: string;
	targetColumn?: { name: string; dataType: string } | null;
	targetValue?: string;
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		compareColumn = { name: "", dataType: "" },
		compareValue = "",
		targetColumn = null,
		targetValue = "",
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
							widget: "update-row-transformation",
							parameters: {
								transformation: {
									key: "update-row",
									parameters: {
										compareColumn,
										compareValue,
										targetColumn,
										targetValue,
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
			"update-row-transformation": {
				name: "Update Row Values",
				widget: "update-row-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "update-row",
						parameters: {
							compareColumn: { name: "", dataType: "" },
							compareValue: "",
							targetColumn: null,
							targetValue: "",
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

	// Simulate target cell execution via _update to set internal store values
	// (MobX computed properties cannot be overridden with Object.defineProperty)
	if (targetCellExecuted) {
		const targetCell = store.notebooks["query-1"].cells[targetCellId];
		if (targetCell) {
			targetCell._update("operation", ["FORMATTED_DATA_SET"]);
			if (targetCellOutput !== undefined) {
				targetCell._update("output", targetCellOutput);
			}
		}
	}

	const cell = store.notebooks["query-1"].cells[
		"2"
	] as CellState<UpdateRowTransformationCellDef>;

	return { store, cell };
};

/**
 * Renders the UpdateRowTransformationCell within a Blocks provider.
 */
const renderCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, cell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<UpdateRowTransformationCell cell={cell} isExpanded={isExpanded} />
		</Blocks>,
	);

	return { ...result, store, cell };
};

describe("UpdateRowTransformationCell", () => {
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

	it("renders UpdateRowTransformationCell when not expanded", () => {
		const { container } = renderCell({}, false);

		const chip = container.querySelector("span.rounded-full");
		expect(chip).toBeInTheDocument();
		screen.debug();

		expect(screen.getByText("Update Row Values")).toBeInTheDocument();
	});

	it("renders help text when target cell is not executed", () => {
		renderCell({ targetCellExecuted: false });

		expect(screen.getByText("Update Row Values")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			targetColumn: { name: "targetCol", dataType: "TEXT" },
		});

		expect(
			screen.getByText(
				"Replace values of a column by defining a conditional statement",
			),
		);
		expect(screen.getByText("Compare Value")).toBeInTheDocument();
		expect(screen.getByText("Update Value")).toBeInTheDocument();
	});
});
