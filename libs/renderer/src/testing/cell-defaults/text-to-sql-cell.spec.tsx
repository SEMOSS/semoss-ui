import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import TextToSqlCell, {
	type TextToSqlCellDef,
} from "../../components/cell-defaults/text-to-sql-cell/text-to-sql-cell";
import { type CellState, type Registry, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK interactions
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
		// columns = [],
		// value = null,
		// delimiter = null,
		// maintainColumns = [],
	} = overrides || {};

	const store = new StateStore({
		mode: "interactive",
		insightId: "test",
		state: {
			queries: {
				mcp_driver: {
					id: "mcp_driver",
					cells: [
						{
							id: "1",
							widget: "text-to-sql",
							parameters: {
								databaseId: "",
								userQuery:
									"select all data from database and on settings table",
								frameVariableName: targetFrameVariableName,
								model: "",
								dataFrameId: "",
								dataFrameQuery: "",
								targetCell: {
									id: targetCellId,
									frameVariableName: targetFrameVariableName,
								},
							},
						},
					],
				},
			},
			variables: {
				mcp_driver: {
					to: "mcp_driver",
					type: "query",
				},
				"mcp_driver--1": {
					type: "cell",
					to: "mcp_driver",
					cellId: "1",
				},
			},
			executionOrder: ["mcp_driver"],
			version: "1.0.0-alpha.17",
			blocks: {},
		},
		cellRegistry: {
			"text-to-sql": {
				name: "Code",
				widget: "text-to-sql",
				view: () => null,
				parameters: {
					databaseId: "",
					userQuery: "",
					frameVariableName: "",
					model: "",
					dataFrameId: "",
					dataFrameQuery: "",
					targetCell: {
						id: targetCellId,
						frameVariableName: targetFrameVariableName,
					},
				},
				toPixel: () => "",
			},
		},
	});

	// Simulate target cell execution via _update to set internal store values
	// (MobX computed properties cannot be overridden with Object.defineProperty)
	if (targetCellExecuted) {
		const targetCell = store.notebooks.mcp_driver.cells[targetCellId];
		if (targetCell) {
			targetCell._update("operation", ["FORMATTED_DATA_SET"]);
			if (targetCellOutput !== undefined) {
				targetCell._update("output", targetCellOutput);
			}
			console.log({
				targetCell: targetCell.toJSON(),
			});
		}
	}

	const cell = store.notebooks.mcp_driver.cells[
		"1"
		// ] as CellState<CollapseTransformationCellDef>;
	] as CellState<TextToSqlCellDef>;

	// console.log({ store: store.cellRegistry, cell: cell.toJSON() });

	return { store, cell };
};

/**
 * Renders the CollapseTransformationCell within a Blocks provider.
 */
const renderCell = (
	overrides?: Parameters<typeof createStoreWithCells>[0],
	isExpanded = true,
) => {
	const { store, cell } = createStoreWithCells(overrides);
	// console.log({ cell: cell.toJSON() });

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<TextToSqlCell cell={cell} isExpanded={isExpanded} />
		</Blocks>,
	);
	// console.log({ result, store, cell });

	return { ...result, store, cell };
};

describe("Text to SQL Cell", () => {
	beforeAll(() => {
		vi.useFakeTimers();

		vi.stubGlobal("jest", {
			advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
		});
	});

	afterAll(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
	it("renders cell collapsed", async () => {
		vi.advanceTimersByTime(1000);
		const { container } = renderCell({}, false);

		// screen.debug();
		const label = screen.queryByText("Type your query in natural language");
		expect(container).toBeDefined();
		expect(label).not.toBeInTheDocument();
	});

	it("renders cell expanded", async () => {
		vi.advanceTimersByTime(1000);

		const { container } = renderCell({}, true);

		expect(container).toBeDefined();
		const label = screen.queryByText("Type your query in natural language");
		expect(label).toBeInTheDocument();
		// screen.debug();
	});
	it("should have user query set correctly", async () => {
		vi.advanceTimersByTime(1000);

		const { container, cell } = renderCell({}, true);

		expect(container).toBeDefined();
		expect(cell.parameters.userQuery).toBe(
			"select all data from database and on settings table",
		);
	});
});
