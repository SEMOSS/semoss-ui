import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	TimestampTransformationCell,
	type TimestampTransformationCellDef,
} from "../../components/cell-defaults/timestamp-transformation-cell/TimestampTransformationCell";
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
 * a query-import cell and a timestamp-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	columnName?: string;
	includeTime?: boolean;
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		columnName = "",
		includeTime = false,
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
							widget: "timestamp-transformation",
							parameters: {
								transformation: {
									key: "timestamp",
									parameters: {
										columnName,
										includeTime,
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
			"timestamp-transformation": {
				name: "Timestamp",
				widget: "timestamp-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "timestamp",
						parameters: {
							columnName: "",
							includeTime: false,
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

	const timestampCell = store.queries["query-1"].cells[
		"2"
	] as CellState<TimestampTransformationCellDef>;

	return { store, timestampCell };
};

/**
 * Renders the TimestampTransformationCell within a Blocks provider.
 */
const renderTimestampCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, timestampCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<TimestampTransformationCell
				cell={timestampCell}
				isExpanded={isExpanded}
			/>
		</Blocks>,
	);

	return { ...result, store, timestampCell };
};

describe("TimestampTransformationCell", () => {
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
		renderTimestampCell({}, false);

		const chip = screen.getByText("Timestamp");
		expect(chip).toBeInTheDocument();
		expect(chip.closest("span")).toHaveClass("rounded-full");
	});

	it("renders help text when target cell is not executed", () => {
		renderTimestampCell({ targetCellExecuted: false });

		expect(screen.getByText("Timestamp")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderTimestampCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			columnName: "created_at",
		});

		expect(
			screen.getByText(
				"Add a new column with today's date as the column value",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Column Name")).toBeInTheDocument();
		expect(screen.getByDisplayValue("created_at")).toBeInTheDocument();
		expect(screen.getByText("Include time")).toBeInTheDocument();
	});

	it("renders include time checkbox unchecked by default", () => {
		renderTimestampCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			columnName: "date_col",
		});

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).not.toBeChecked();
	});

	it("renders include time checkbox checked when includeTime is true", () => {
		renderTimestampCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			columnName: "date_col",
			includeTime: true,
		});

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeChecked();
	});
});
