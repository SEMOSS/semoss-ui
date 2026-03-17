import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	CollapseTransformationCell,
	type CollapseTransformationCellDef,
} from "../../components/cell-defaults/collapse-transformation-cell/CollapseTransformationCell";
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
 * a query-import cell and a collapse-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	columns?: { name: string; dataType: string }[];
	value?: { name: string; dataType: string } | null;
	delimiter?: string | null;
	maintainColumns?: { name: string; dataType: string }[];
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		columns = [],
		value = null,
		delimiter = null,
		maintainColumns = [],
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
							widget: "collapse-transformation",
							parameters: {
								transformation: {
									key: "collapse",
									parameters: {
										columns,
										value,
										delimiter,
										maintainColumns,
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
			"collapse-transformation": {
				name: "Collapse",
				widget: "collapse-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "collapse",
						parameters: {
							columns: [],
							value: null,
							delimiter: null,
							maintainColumns: [],
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

	const collapseCell = store.queries["query-1"].cells[
		"2"
	] as CellState<CollapseTransformationCellDef>;

	return { store, collapseCell };
};

/**
 * Renders the CollapseTransformationCell within a Blocks provider.
 */
const renderCollapseCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, collapseCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<CollapseTransformationCell
				cell={collapseCell}
				isExpanded={isExpanded}
			/>
		</Blocks>,
	);

	return { ...result, store, collapseCell };
};

describe("CollapseTransformationCell", () => {
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
		const { container } = renderCollapseCell({}, false);

		const chip = container.querySelector(".MuiChip-root");
		expect(chip).toBeInTheDocument();
		expect(screen.getByText("Collapse")).toBeInTheDocument();
	});

	it("renders help text when target cell is not executed", () => {
		renderCollapseCell({ targetCellExecuted: false });

		expect(screen.getByText("Collapse")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderCollapseCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
			delimiter: ", ",
		});

		expect(
			screen.getByText(
				"Aggregate data for a group based on the delimiter",
			),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Group by Column(s)")).toBeInTheDocument();
		expect(screen.getByLabelText("Value Column")).toBeInTheDocument();
		expect(screen.getByLabelText("String Separator")).toBeInTheDocument();
		expect(screen.getByLabelText("String Separator")).toHaveValue(", ");
		expect(
			screen.getByLabelText("Other Column(s) to Maintain"),
		).toBeInTheDocument();
	});
});
