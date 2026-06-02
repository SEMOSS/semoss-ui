import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	DateDifferenceTransformationCell,
	type DateDifferenceTransformationCellDef,
} from "../../components/cell-defaults/date-difference-transformation-cell/DateDifferenceTransformationCell";
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
 * a query-import cell and a date-difference-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	startType?: "column" | "custom";
	startCustomDate?: string;
	startColumn?: { name: string; dataType: string } | null;
	endType?: "column" | "custom";
	endCustomDate?: string;
	endColumn?: { name: string; dataType: string } | null;
	unit?: string;
	columnName?: string;
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		startType = "column",
		startCustomDate = "",
		startColumn = null,
		endType = "column",
		endCustomDate = "",
		endColumn = null,
		unit = "day",
		columnName = "",
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
							widget: "date-difference-transformation",
							parameters: {
								transformation: {
									key: "date-difference",
									parameters: {
										startType,
										startCustomDate,
										startColumn,
										endType,
										endCustomDate,
										endColumn,
										unit,
										columnName,
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
			"date-difference-transformation": {
				name: "Date Difference",
				widget: "date-difference-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "date-difference",
						parameters: {
							startType: "column",
							startCustomDate: "",
							startColumn: null,
							endType: "column",
							endCustomDate: "",
							endColumn: null,
							unit: "day",
							columnName: "",
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
		const targetCell = store.queries["query-1"].cells[targetCellId];
		if (targetCell) {
			targetCell._update("operation", ["FORMATTED_DATA_SET"]);
			if (targetCellOutput !== undefined) {
				targetCell._update("output", targetCellOutput);
			}
		}
	}

	const dateDiffCell = store.queries["query-1"].cells[
		"2"
	] as CellState<DateDifferenceTransformationCellDef>;

	return { store, dateDiffCell };
};

/**
 * Renders the DateDifferenceTransformationCell within a Blocks provider.
 */
const renderDateDiffCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, dateDiffCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<DateDifferenceTransformationCell
				cell={dateDiffCell}
				isExpanded={isExpanded}
			/>
		</Blocks>,
	);

	return { ...result, store, dateDiffCell };
};

describe("DateDifferenceTransformationCell", () => {
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
		const { container } = renderDateDiffCell({}, false);

		const chip = container.querySelector("span.rounded-full");
		expect(chip).toBeInTheDocument();
		expect(screen.getByText("Date Difference")).toBeInTheDocument();
	});

	it("renders help text when target cell is not executed", () => {
		renderDateDiffCell({ targetCellExecuted: false });

		expect(screen.getByText("Date Difference")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderDateDiffCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			columnName: "date_diff",
		});

		expect(
			screen.getByText(
				"Compute the difference between dates and add the computed value as a new column",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Start Date Column")).toBeInTheDocument();
		expect(screen.getByText("End Date Column")).toBeInTheDocument();
		expect(screen.getByText("day")).toBeInTheDocument();
		expect(screen.getByText("Column Name")).toBeInTheDocument();
		const columnNameInput = screen
			.getByText("Column Name")
			.closest("div")
			?.querySelector("input") as HTMLInputElement;
		expect(columnNameInput.value).toBe("date_diff");
	});
});
