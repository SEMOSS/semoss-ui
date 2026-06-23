import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { usePixel } from "@semoss/sdk/react";
import { DefaultBlocks } from "../../components/block-defaults";
import { Blocks } from "../../components/blocks";
import { NotebookImportCell } from "../../components/cell-defaults/notebook-import-cell";
import * as hooks from "../../hooks";
import { StateStore } from "../../store";

// Mock the usePixel hook so tests don't make real API calls for fetching database lists.
vi.mock("@semoss/sdk/react", () => ({
	usePixel: vi.fn(),
}));

// Mock MonacoEditor to avoid pulling @semoss/shared transitive UI-next imports
// that are unrelated to this cell behavior test.
vi.mock("@semoss/shared", () => ({
	MonacoEditor: () => null,
	EngineSubtypeIcon: () => null,
	registerSparqlLanguage: vi.fn(),
	SPARQL_LANGUAGE_ID: "sparql",
	SPARQL_THEME_LIGHT: "sparql-light",
}));

const query = {
	mcp_driver: {
		id: "mcp_driver",
		cells: [
			{
				id: "1",
				widget: "query-import",
				parameters: {
					databaseId: "db1",
					frameType: "NATIVE",
					frameVariableName: "result_frame",
					selectQuery: "SELECT * FROM table1",
				},
			},
		],
	},
};

describe("Notebook Import Cell", () => {
	/**
	 * Helper that wraps a component in the Blocks context provider,
	 * which NotebookImportCell requires to access the state store and block registry.
	 * The store's dispatch is replaced with a spy so tests can assert on actions
	 * dispatched without triggering real state mutations.
	 */
	const renderWithBlocks = (ui: React.ReactElement) => {
		const store = new StateStore({
			mode: "interactive",
			insightId: "new",
			state: {
				executionOrder: [],
				queries: {},
				variables: {},
				version: "",
				blocks: {},
			},
			cellRegistry: {},
		});

		// Replace dispatch with a spy to prevent real state mutations in tests.
		store.dispatch = vi.fn() as never;

		return {
			store,
			...render(
				<Blocks state={store} registry={DefaultBlocks}>
					{ui}
				</Blocks>,
			),
		};
	};

	// Verifies that the full set of controls (database selector, columns toggle,
	// frame type selector, and frame variable name input) are present when the
	// cell is in expanded mode. Two databases are provided to confirm the
	// dropdown is populated from the mocked usePixel response.
	test("renders database selector and editor when expanded", async () => {
		// Mock usePixel to return two available databases.
		// Whenever usePixel is invoked from the app, it returns the mockValue
		// for this test
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db1",
					engine_name: "Database 1",
					engine_type: "DATABASE",
				},
				{
					engine_id: "db2",
					engine_name: "Database 2",
					engine_type: "DATABASE",
				},
			],
		} as never);

		// Spy on useBlocks so the component can access a dispatch function
		// without needing the real Blocks context wiring.
		// Difference from mocked is that mocked is replaced before code runs,
		// But spyOn runs after code runs, where it listens to wherever useBlocks is called,
		// and return the mock value.
		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: {
				dispatch: vi.fn(),
			},
		} as never);

		const cell = {
			id: "1",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		renderWithBlocks(
			<NotebookImportCell cell={cell as never} isExpanded={true} />,
		);

		// Wait for the async database list to resolve before asserting.
		await waitFor(() => {
			expect(screen.getByText("Database")).toBeInTheDocument();
		});
		// Initial state shows the toggle in "Show" mode until clicked.
		expect(
			screen.getByRole("button", { name: /Show columns/i }),
		).toBeInTheDocument();
		expect(screen.getByText("Frame type")).toBeInTheDocument();
		expect(
			screen.getByTitle("Set frame variable name"),
		).toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});

	// Confirms the frame variable name input is rendered and pre-populated
	// with the value from the cell's parameters ("result_frame").
	test("renders editor and frame variable name input", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db1",
					engine_name: "Database 1",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: {
				dispatch: vi.fn(),
			},
		} as never);

		const cell = {
			id: "1",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		renderWithBlocks(
			<NotebookImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTitle("Set frame variable name"),
			).toBeInTheDocument();
		});

		// The input should be initialized with the value from the cell parameters.
		const frameVariableInput = screen.getByTitle(
			"Set frame variable name",
		) as HTMLInputElement;
		expect(frameVariableInput).toHaveValue("result_frame");

		useBlocksSpy.mockRestore();
	});

	// Confirms the frame type selector reflects the "NATIVE" value specified
	// in the cell parameters, ensuring the component binds its initial value
	// from props rather than using a hardcoded default.
	test("renders frame type selector with correct value", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db1",
					engine_name: "Database 1",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: {
				dispatch: vi.fn(),
			},
		} as never);

		const cell = {
			id: "1",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		renderWithBlocks(
			<NotebookImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Frame type")).toBeInTheDocument();
		});

		// The selector should show "NATIVE" as set in the fixture parameters.
		const frameTypeSection = screen.getByText("Frame type").closest("div");
		const frameTypeSelect = within(
			frameTypeSection as HTMLElement,
		).getByRole("combobox");
		expect(frameTypeSelect).toHaveTextContent(/Native/i);

		useBlocksSpy.mockRestore();
	});
});
