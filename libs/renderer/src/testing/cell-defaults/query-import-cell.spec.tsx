import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { usePixel } from "@semoss/sdk/react";
import { DefaultBlocks } from "../../components/block-defaults";
import { Blocks } from "../../components/blocks";
import { QueryImportCell } from "../../components/cell-defaults/query-import-cell/QueryImportCell";
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
					enableBatching: false,
					batchSize: undefined,
					currentOffset: 0,
				},
			},
		],
	},
};

describe("Query Import Cell", () => {
	/**
	 * Helper that wraps a component in the Blocks context provider,
	 * which QueryImportCell requires to access the state store and block registry.
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
		// Whenever usePixedl is invoked from the app, it returns the mockValue
		// for this test
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{ app_id: "db1", app_name: "Database 1" },
				{ app_id: "db2", app_name: "Database 2" },
			],
		} as never);

		// Spy on useBlocks so the component can access a dispatch function
		// without needing the real Blocks context wiring.
		// Difference from mocked is that mocked is replaced before code runs,
		// But spyOn runs after code runs, where it listens to whereever useBlocks is called,
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
			<QueryImportCell cell={cell as never} isExpanded={true} />,
		);

		// Wait for the async database list to resolve before asserting.
		await waitFor(() => {
			expect(screen.getByTitle("Select Database")).toBeInTheDocument();
		});
		// Initial state shows the toggle in "Show" mode until clicked.
		expect(
			screen.getByRole("button", { name: /Show Available Columns/i }),
		).toBeInTheDocument();
		expect(screen.getByTitle("Select Type")).toBeInTheDocument();
		expect(
			screen.getByTitle("Set Frame Variable Name"),
		).toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});

	// Confirms the frame variable name input is rendered and pre-populated
	// with the value from the cell's parameters ("result_frame").
	test("renders editor and frame variable name input", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [{ app_id: "db1", app_name: "Database 1" }],
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
			<QueryImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTitle("Set Frame Variable Name"),
			).toBeInTheDocument();
		});

		// The input should be initialized with the value from the cell parameters.
		const frameVariableInput = within(
			screen.getByTitle("Set Frame Variable Name"),
		).getByRole("textbox") as HTMLInputElement;
		expect(frameVariableInput).toHaveValue("result_frame");

		useBlocksSpy.mockRestore();
	});

	// Confirms the frame type selector reflects the "NATIVE" value specified
	// in the cell parameters, ensuring the component binds its initial value
	// from props rather than using a hardcoded default.
	test("renders frame type selector with correct value", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [{ app_id: "db1", app_name: "Database 1" }],
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
			<QueryImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(screen.getByTitle("Select Type")).toBeInTheDocument();
		});

		// The selector should show "NATIVE" as set in the fixture parameters.
		const frameTypeSelect = within(
			screen.getByTitle("Select Type"),
		).getByRole("combobox");
		expect(frameTypeSelect).toHaveTextContent(/Native/i);

		useBlocksSpy.mockRestore();
	});

	// When enableBatching is false (the default fixture), the "Batch Size" and
	// "Current Offset" inputs should be hidden. The "Enable Batching" toggle
	// itself must still be present so the user can opt in.
	test("does not display batching controls when batching is disabled", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [{ app_id: "db1", app_name: "Database 1" }],
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
			<QueryImportCell cell={cell as never} isExpanded={true} />,
		);

		// Wait until the toggle is rendered before checking for absent controls.
		await waitFor(() => {
			expect(
				screen.getByRole("checkbox", {
					name: /Enable Batching/i,
				}),
			).toBeInTheDocument();
		});

		// Batch Size and Current Offset should not be in the DOM when batching is off.
		expect(screen.queryByTitle("Batch Size")).not.toBeInTheDocument();
		expect(screen.queryByTitle("Current Offset")).not.toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});

	// Overrides the base fixture to enable batching with batchSize=100 and
	// currentOffset=0. Verifies that the Batch Size and Current Offset inputs
	// are rendered with the correct values, and that a Reset button is present
	// to allow the user to clear the current offset back to 0.
	test("displays batching controls when batching is enabled", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [{ app_id: "db1", app_name: "Database 1" }],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: {
				dispatch: vi.fn(),
			},
		} as never);

		// Spread the base parameters and override only the batching-related fields.
		const cell = {
			id: "1",
			isLoading: false,
			query: query.mcp_driver,
			parameters: {
				...query.mcp_driver.cells[0].parameters,
				enableBatching: true,
				batchSize: 100,
				currentOffset: 0,
			},
		};

		renderWithBlocks(
			<QueryImportCell cell={cell as never} isExpanded={true} />,
		);

		// Wait for the batching controls to appear before asserting values.
		await waitFor(() => {
			expect(screen.getByTitle("Batch Size")).toBeInTheDocument();
		});

		const batchSizeInput = within(
			screen.getByTitle("Batch Size"),
		).getByRole("spinbutton") as HTMLInputElement;
		const currentOffsetInput = within(
			screen.getByTitle("Current Offset"),
		).getByRole("spinbutton") as HTMLInputElement;

		expect(batchSizeInput).toHaveValue(100);
		expect(currentOffsetInput).toHaveValue(0);
		// A Reset button should be present to clear the current offset.
		expect(
			screen.getByRole("button", { name: "Reset" }),
		).toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});
});
