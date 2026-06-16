import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePixel } from "@semoss/sdk/react";
import { DefaultBlocks } from "../../components/block-defaults";
import { Blocks } from "../../components/blocks";
import { DataImportCell } from "../../components/cell-defaults/data-import-cell";
import * as hooks from "../../hooks";
import { StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK interactions
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

// Mock @semoss/shared to avoid pulling transitive @semoss/i18n imports
// that are unrelated to this cell behavior test.
vi.mock("@semoss/shared", () => ({
	MonacoEditor: () => null,
	EngineSubtypeIcon: ({ alt }: { alt?: string }) => (
		<span data-testid="engine-icon">{alt ?? ""}</span>
	),
}));

// Mock DataImportFormModal to break the circular dependency chain:
// data-import-cell → data-import-form-modal → cell-defaults/index → data-import-cell
vi.mock("../../components/shared/data-import-form-modal", () => ({
	DataImportFormModal: () => <div data-testid="data-import-form-modal" />,
}));

// Mock usePixel as a bare vi.fn(); each test sets a stable return value
// via mockReturnValue to avoid creating new object references on every
// render (which would cause infinite useEffect → dispatch → re-render loops).
vi.mock("@semoss/sdk/react", () => ({
	usePixel: vi.fn(),
}));

const query = {
	"query-1": {
		id: "query-1",
		cells: [
			{
				id: "0",
				widget: "data-import",
				parameters: {
					databaseId: "db-1",
					frameType: "NATIVE",
					frameVariableName: "testFrame",
					selectQuery:
						"Database(database=['db-1']) | Select(Table1) | Limit(-1);",
					rootTable: "Table1",
					selectedColumns: [],
					columnAliases: [],
					tableNames: ["Table1"],
					joins: [],
					dataLimit: -1,
				},
			},
		],
	},
};

describe("DataImportCell", () => {
	/**
	 * Helper that wraps a component in the Blocks context provider.
	 * The store's dispatch is replaced with a spy so tests can assert on
	 * actions dispatched without triggering real state mutations.
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

		// Replace dispatch with a spy to prevent real state mutations.
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

	it("should render the DataImportCell component", () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db-1",
					engine_name: "Test Database",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: { dispatch: vi.fn() },
		} as never);

		const cell = {
			id: "0",
			isLoading: false,
			query: query["query-1"],
			parameters: query["query-1"].cells[0].parameters,
		};

		const { container } = renderWithBlocks(
			<DataImportCell cell={cell as never} isExpanded={true} />,
		);

		expect(container).toBeDefined();

		useBlocksSpy.mockRestore();
	});

	it("renders Edit button when expanded", () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db-1",
					engine_name: "Test Database",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: { dispatch: vi.fn() },
		} as never);

		const cell = {
			id: "0",
			isLoading: false,
			query: query["query-1"],
			parameters: query["query-1"].cells[0].parameters,
		};

		renderWithBlocks(
			<DataImportCell cell={cell as never} isExpanded={true} />,
		);

		expect(screen.getByText("Edit")).toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});

	it("renders frame type selector with correct value", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db-1",
					engine_name: "Test Database",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: { dispatch: vi.fn() },
		} as never);

		const cell = {
			id: "0",
			isLoading: false,
			query: query["query-1"],
			parameters: query["query-1"].cells[0].parameters,
		};

		renderWithBlocks(
			<DataImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Frame type")).toBeInTheDocument();
		});

		const frameTypeSection = screen.getByText("Frame type").closest("div");
		const frameTypeSelect =
			frameTypeSection?.querySelector("[role='combobox']");
		expect(frameTypeSelect).toHaveTextContent(/Native/i);

		useBlocksSpy.mockRestore();
	});

	it("renders variable name input with correct value", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db-1",
					engine_name: "Test Database",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: { dispatch: vi.fn() },
		} as never);

		const cell = {
			id: "0",
			isLoading: false,
			query: query["query-1"],
			parameters: query["query-1"].cells[0].parameters,
		};

		renderWithBlocks(
			<DataImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTitle("Set frame variable name"),
			).toBeInTheDocument();
		});

		const frameVariableInput = screen.getByTitle(
			"Set frame variable name",
		) as HTMLInputElement;
		expect(frameVariableInput).toHaveValue("testFrame");

		useBlocksSpy.mockRestore();
	});

	it("renders Show Pixel button when expanded", () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db-1",
					engine_name: "Test Database",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: { dispatch: vi.fn() },
		} as never);

		const cell = {
			id: "0",
			isLoading: false,
			query: query["query-1"],
			parameters: query["query-1"].cells[0].parameters,
		};

		renderWithBlocks(
			<DataImportCell cell={cell as never} isExpanded={true} />,
		);

		expect(
			screen.getByRole("button", { name: /Show Pixel/i }),
		).toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});

	it("renders database info when database is selected", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: [
				{
					engine_id: "db-1",
					engine_name: "Test Database",
					engine_type: "DATABASE",
				},
				{
					engine_id: "db-2",
					engine_name: "Sample Database",
					engine_type: "DATABASE",
				},
			],
		} as never);

		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: { dispatch: vi.fn() },
		} as never);

		const cell = {
			id: "0",
			isLoading: false,
			query: query["query-1"],
			parameters: query["query-1"].cells[0].parameters,
		};

		renderWithBlocks(
			<DataImportCell cell={cell as never} isExpanded={true} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Database")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText("Test Database")).toBeInTheDocument();
		});

		useBlocksSpy.mockRestore();
	});
});
