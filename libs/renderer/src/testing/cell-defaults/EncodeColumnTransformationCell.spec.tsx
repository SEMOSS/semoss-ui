import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	EncodeColumnTransformationCell,
	type EncodeColumnTransformationCellDef,
} from "../../components/cell-defaults/encode-column-transformation-cell/EncodeColumnTransformationCell";
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
 * a query-import cell and an encode-column-transformation cell.
 */
const createStoreWithCells = (overrides?: {
	targetCellId?: string;
	targetFrameVariableName?: string;
	targetCellExecuted?: boolean;
	targetCellOutput?: unknown;
	columns?: { name: string; dataType: string }[];
}) => {
	const {
		targetCellId = "1",
		targetFrameVariableName = "testFrame",
		targetCellExecuted = false,
		targetCellOutput = undefined,
		columns = [],
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
							widget: "encode-column-transformation",
							parameters: {
								transformation: {
									key: "encode-column",
									parameters: {
										columns,
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
			"encode-column-transformation": {
				name: "Encode Column",
				widget: "encode-column-transformation",
				view: () => null,
				parameters: {
					transformation: {
						key: "encode-column",
						parameters: {
							columns: [],
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

	const encodeCell = store.queries["query-1"].cells[
		"2"
	] as CellState<EncodeColumnTransformationCellDef>;

	return { store, encodeCell };
};

/**
 * Renders the EncodeColumnTransformationCell within a Blocks provider.
 */
const renderEncodeCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, encodeCell } = createStoreWithCells(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<EncodeColumnTransformationCell
				cell={encodeCell}
				isExpanded={isExpanded}
			/>
		</Blocks>,
	);

	return { ...result, store, encodeCell };
};

describe("EncodeColumnTransformationCell", () => {
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
		const { container } = renderEncodeCell({}, false);

		const chip = container.querySelector("span.rounded-full");
		expect(chip).toBeInTheDocument();
		expect(screen.getByText("Encode Column")).toBeInTheDocument();
	});

	it("renders help text when target cell is not executed", () => {
		renderEncodeCell({ targetCellExecuted: false });

		expect(screen.getByText("Encode Column")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying a transformation.",
			),
		).toBeInTheDocument();
	});

	it("renders full form when target cell is executed", () => {
		renderEncodeCell({
			targetCellExecuted: true,
			targetCellOutput: { frameHeaders: [] },
		});

		expect(
			screen.getByText("Obfuscate the values of a column"),
		).toBeInTheDocument();
	});
});
