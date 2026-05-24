import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	CumulativeSumTransformationCell,
	type CumulativeSumTransformationCellDef,
} from "../../components/cell-defaults/cumulative-sum-transformation-cell/cumulative-sum-transformation-cell";
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
 * a query-import cell and a cumulative-sum-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	newColumn?: string;
	valueColumn?: { name: string; dataType: string } | null;
	sortColumns?: { name: string; dataType: string }[];
	groupByColumns?: { name: string; dataType: string }[];
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		newColumn = "",
		valueColumn = null,
		sortColumns = [],
		groupByColumns = [],
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
							widget: "cumulative-sum-transformation",
							parameters: {
								transformation: {
									key: "cumulative-sum",
									parameters: {
										newColumn,
										valueColumn,
										sortColumns,
										groupByColumns,
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
			"cumulative-sum-transformation": {
				name: "Cumulative Sum",
				widget: "cumulative-sum-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "cumulative-sum",
						parameters: {
							newColumn: "",
							valueColumn: null,
							sortColumns: [],
							groupByColumns: [],
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

	const cumulativeSumCell = store.queries["query-1"].cells[
		"2"
	] as CellState<CumulativeSumTransformationCellDef>;

	return { store, cumulativeSumCell };
};

/**
 * Renders the CumulativeSumTransformationCell within a Blocks provider.
 */
const renderCumulativeSumCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, cumulativeSumCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<CumulativeSumTransformationCell
				cell={cumulativeSumCell}
				isExpanded={isExpanded}
			/>
		</Blocks>,
	);

	return { ...result, store, cumulativeSumCell };
};

describe("CumulativeSumTransformationCell", () => {
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
		const { container } = renderCumulativeSumCell({}, false);

		const chip = container.querySelector("span.rounded-full");
		expect(chip).toBeInTheDocument();
		expect(screen.getByText("Cumulative Sum")).toBeInTheDocument();
	});

	it("renders help text when target cell is not executed", () => {
		renderCumulativeSumCell({ targetCellExecuted: false });

		expect(screen.getByText("Cumulative Sum")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderCumulativeSumCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			newColumn: "running_total",
		});

		expect(
			screen.getByText(
				"Add a new column for the cumulative sum of another column's values",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Column Name")).toBeInTheDocument();
		const columnNameInput = screen
			.getByText("Column Name")
			.closest("div")
			?.querySelector("input") as HTMLInputElement;
		expect(columnNameInput.value).toBe("running_total");
		expect(screen.getByText("Aggregate Value")).toBeInTheDocument();
		expect(screen.getByText("Sort by Column(s)")).toBeInTheDocument();
		expect(screen.getByText("Group by Column(s)")).toBeInTheDocument();
	});
});
