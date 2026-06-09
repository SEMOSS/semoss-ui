import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	DataImportCell,
	type DataImportCellDef,
} from "../../components/cell-defaults/data-import-cell/DataImportCell";
import { type CellState, type Registry, StateStore } from "../../store";

/*** 
 * calls being made in DataImportCell
 * 
 * - pixelExpression": "META | GetDatabaseList ( ) ;", to get database list for the dropdown
 * - "pixelExpression": "META | GetDatabaseTableStructure ( database = [ \"363f1405-0044-4d77-9838-e03845340c6b\" ] ) ;", to get table structure for the selected database
 * -   "pixelId": "0",
            "pixelExpression": "Database ( database = [ \"363f1405-0044-4d77-9838-e03845340c6b\" ] ) | Select ( workstreams__active , workstreams__created_at , workstreams__created_by_principal_id , workstreams__description , workstreams__id , workstreams__lead , workstreams__name , workstreams__updated_at ) .as ( [ active , created_at , created_by_principal_id , description , id , lead , name , updated_at ] ) | Distinct ( false ) | Limit ( - 1 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] ) ;", to run the select query and import results into a frame
            "isMeta": false,
            "timeToRun": 820,
            "output": {
                "name": "consolidated_settings_FRAME932867_Preview",
                "type": "GRID"
            },
            "operationType": [
                "FRAME_DATA_CHANGE",
                "FRAME_HEADERS_CHANGE"
            ],
            "additionalOutput": [
                {
                    "output": {
                        "h ....

 * */

// Mock useBlocksPixel to avoid SDK interactions
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

// Mock usePixel to load database list and table structure for the DataImportCell
vi.mock("@semoss/sdk/react", () => ({
    usePixel: vi.fn((pixelExpression: string) => {
        if (pixelExpression.includes("MyEngines")) {
            return {
                status: "SUCCESS",
                data: [
                    { engine_id: "db-1", engine_name: "Test Database" },
                    { engine_id: "db-2", engine_name: "Sample Database" },
                ],
            };
        }
        return { status: "INITIAL", data: [] };
    }),

    runPixel: vi.fn((pixelExpression: string) => {
        if (pixelExpression.includes("GetDatabaseTableStructure")) {
            return Promise.resolve({
                pixelReturn: [
                    {
                        // Each row: [tableName, columnName, columnType, isBoolean, columnName2, tableName2]
                        output: [
                            ["Table1", "id", "INT", false, "id", "Table1"],
                            ["Table1", "name", "VARCHAR", false, "name", "Table1"],
                            ["Table2", "order_id", "INT", false, "order_id", "Table2"],
                        ],
                        operationType: ["DATABASE_TABLE_STRUCTURE"],
                    },
                    {
                        output: { edges: [] },
                        operationType: ["DATABASE_METAMODEL"],
                    },
                ],
            });
        }
        // Returns both GetDatabaseTableStructure and GetDatabaseMetamodel in one call
        return Promise.resolve({ pixelReturn: [] });
    }),
}));

/**
 * Helper to create a StateStore with a data-import cell.
 */
const createDataImportCellStore = (overrides?: {
    databaseId?: string;
    frameType?: "NATIVE" | "PY" | "R" | "GRID" | "PIXEL";
    frameVariableName?: string;
    selectQuery?: string;
    tableNames?: string[];
    joins?: {
        id: string;
        joinType: string;
        leftTable: string;
        rightTable: string;
        leftKey: string;
        rightKey: string;
    }[];
    dataLimit?: number;
    enableBatching?: boolean;
    batchSize?: number;
    currentOffset?: number;
}) => {
    const {
        databaseId = "db-1",
        frameType = "NATIVE",
        frameVariableName = "testFrame",
        selectQuery = "Database(database=['db-1']) | Select(Table1) | Limit(-1);",
        tableNames = ["Table1"],
        joins = [],
        dataLimit = -1,
        enableBatching = false,
        batchSize = 100,
        currentOffset = 0,
    } = overrides || {};

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
                            widget: "data-import",
                            parameters: {
                                databaseId,
                                frameType,
                                frameVariableName,
                                selectQuery,
                                rootTable: tableNames[0] ?? "",
                                selectedColumns: [],
                                columnAliases: [],
                                tableNames,
                                joins,
                                dataLimit,
                                enableBatching,
                                batchSize,
                                currentOffset,
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
            "data-import": {
                name: "Data Import",
                widget: "data-import",
                view: () => null,
                parameters: {
                    databaseId: "",
                    frameType: "NATIVE",
                    frameVariableName: "",
                    selectQuery: "",
                    rootTable: "",
                    selectedColumns: [],
                    columnAliases: [],
                    tableNames: [],
                    joins: [],
                    dataLimit: -1,
                    enableBatching: false,
                    batchSize: 100,
                    currentOffset: 0,
                },
                toPixel: () => "",
            },
        },
    });

    const dataImportCell = store.queries["query-1"]
        .cells["0"] as CellState<DataImportCellDef>;

    return { store, dataImportCell };
};


describe("DataImportCell", () => {
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

	it("should render the DataImportCell component", () => {
		const { store, dataImportCell } = createDataImportCellStore();

		const { container } = render(
			<Blocks state={store} registry={{} as Registry}>
				<DataImportCell cell={dataImportCell} isExpanded={true} />
			</Blocks>,
		);

		screen.debug();

		expect(container).toBeDefined();
		expect(dataImportCell.widget).toBe("data-import");
	});

    it("loads tables from the cell's databaseId when modal opens", async () => {
        const { store, dataImportCell } = createDataImportCellStore();

		const { container } = render(
			<Blocks state={store} registry={{} as Registry}>
				<DataImportCell cell={dataImportCell} isExpanded={true} />
			</Blocks>,
		);

        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        await user.click(screen.getByText("Edit"));

        // Tables load automatically on mount because editMode=true calls
        // retrieveDatabaseTablesAndEdges(cell.parameters.databaseId)
        await waitFor(() => {
            expect(screen.getByText("Table1")).toBeInTheDocument();
            expect(screen.getByText("Table2")).toBeInTheDocument();
        });
    });

    it("should display table names when expanded", () => {
        const { store, dataImportCell } = createDataImportCellStore({
            tableNames: ["Table1", "Table2"],
        });

        render(
            <Blocks state={store} registry={{} as Registry}>
                <DataImportCell cell={dataImportCell} isExpanded={true} />
            </Blocks>,
        );

        expect(screen.getByText("Table1")).toBeInTheDocument();
        expect(screen.getByText("Table2")).toBeInTheDocument();
    });

});



