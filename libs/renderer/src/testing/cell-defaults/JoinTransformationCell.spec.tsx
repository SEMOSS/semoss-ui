import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	JoinTransformationCell,
	type JoinTransformationCellDef,
} from "../../components/cell-defaults/join-transformation-cell";
import { type CellState, type Registry, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK pixel calls in MultiCellColumnTransformationField
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

/**
 * Helper to create a StateStore with a query containing
 * two query-import cells and a join-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	fromTargetCellId?: string;
	fromFrameVariableName?: string;
	toTargetCellId?: string;
	toFrameVariableName?: string;
	bothCellsExecuted?: boolean;
	targetCellOutput?: unknown;
	fromNameColumn?: { name: string; dataType: string };
	toNameColumn?: { name: string; dataType: string };
	joinType?: { name: string; code: string };
	compareOperation?: string;
}) => {
	const {
		fromTargetCellId = "1",
		fromFrameVariableName = "frameA",
		toTargetCellId = "2",
		toFrameVariableName = "frameB",
		bothCellsExecuted = false,
		targetCellOutput = undefined,
		fromNameColumn = { name: "", dataType: "" },
		toNameColumn = { name: "", dataType: "" },
		joinType = { name: "", code: "" },
		compareOperation = "==",
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
								databaseId: "test-db-a",
								frameType: "PY",
								frameVariableName: fromFrameVariableName,
								selectQuery: "SELECT * FROM tableA",
								enableBatching: false,
								batchSize: 100,
								currentOffset: 0,
							},
						},
						{
							id: "2",
							widget: "query-import",
							parameters: {
								databaseId: "test-db-b",
								frameType: "PY",
								frameVariableName: toFrameVariableName,
								selectQuery: "SELECT * FROM tableB",
								enableBatching: false,
								batchSize: 100,
								currentOffset: 0,
							},
						},
						{
							id: "3",
							widget: "join-transformation",
							parameters: {
								transformation: {
									key: "join",
									parameters: {
										fromNameColumn,
										toNameColumn,
										joinType,
										compareOperation,
									},
								},
								fromTargetCell: {
									id: fromTargetCellId,
									frameVariableName: fromFrameVariableName,
								},
								toTargetCell: {
									id: toTargetCellId,
									frameVariableName: toFrameVariableName,
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
			"join-transformation": {
				name: "Join",
				widget: "join-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "join",
						parameters: {
							fromNameColumn: { name: "", dataType: "" },
							toNameColumn: { name: "", dataType: "" },
							joinType: { name: "", code: "" },
							compareOperation: "==",
						},
					},
					fromTargetCell: {
						id: "",
						frameVariableName: "",
					},
					toTargetCell: {
						id: "",
						frameVariableName: "",
					},
				},
				toPixel: () => "",
			},
		},
	});

	if (bothCellsExecuted) {
		const cellA = store.notebooks["query-1"].cells[fromTargetCellId];
		if (cellA) {
			cellA._update("operation", ["FORMATTED_DATA_SET"]);
			if (targetCellOutput !== undefined) {
				cellA._update("output", targetCellOutput);
			}
		}
		const cellB = store.notebooks["query-1"].cells[toTargetCellId];
		if (cellB) {
			cellB._update("operation", ["FORMATTED_DATA_SET"]);
			if (targetCellOutput !== undefined) {
				cellB._update("output", targetCellOutput);
			}
		}
	}

	const joinCell = store.notebooks["query-1"].cells[
		"3"
	] as CellState<JoinTransformationCellDef>;

	return { store, joinCell };
};

/**
 * Renders the JoinTransformationCell within a Blocks provider.
 */
const renderJoinCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, joinCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<JoinTransformationCell cell={joinCell} isExpanded={isExpanded} />
		</Blocks>,
	);

	return { ...result, store, joinCell };
};

describe("JoinTransformationCell", () => {
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
		const { container } = renderJoinCell({}, false);

		const chip = container.querySelector("span.rounded-full");
		expect(chip).toBeInTheDocument();
		expect(screen.getByText("Join")).toBeInTheDocument();
	});

	it("renders help text when target cells are not executed", () => {
		renderJoinCell({ bothCellsExecuted: false });

		expect(
			screen.getByText(
				"At least two Python / R target frame variables must be defined in order to apply the join transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when both target cells are executed", () => {
		renderJoinCell({
			bothCellsExecuted: true,
			targetCellOutput: { frameHeaders: [] },
		});

		expect(
			screen.getByText(
				"Select columns from each table. Specify how you want to join the columns.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Join Type")).toBeInTheDocument();
		expect(screen.getByText("==")).toBeInTheDocument();
	});
});
