import {
	cleanup,
	createEvent,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { DataImportFormModal } from "../components/shared/data-import-form-modal";

const mocks = vi.hoisted(() => ({
	pixel: vi.fn(),
	run: vi.fn(),
	dispatch: vi.fn(),
	refresh: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.pixel,
	runPixel: mocks.run,
}));
vi.mock("@semoss/shared", () => ({ EngineSubtypeIcon: () => null }));
vi.mock("../hooks", () => ({
	useBlocks: () => ({ state: { dispatch: mocks.dispatch }, notebook: {} }),
}));
vi.mock("../store", () => ({
	ActionMessages: { UPDATE_CELL: "UPDATE_CELL", NEW_CELL: "NEW_CELL" },
}));
vi.mock("../components/cell-defaults", () => ({ DefaultCells: {} }));
vi.mock("../components/cell-defaults/code-cell", () => ({
	CodeCellConfig: {},
}));
vi.mock("../components/cell-defaults/data-import-cell", () => ({
	DataImportCellConfig: {},
}));

const scrollIntoView = HTMLElement.prototype.scrollIntoView;
const hasPointerCapture = HTMLElement.prototype.hasPointerCapture;
beforeAll(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	HTMLElement.prototype.scrollIntoView = vi.fn();
	HTMLElement.prototype.hasPointerCapture = () => false;
});
afterAll(() => {
	vi.unstubAllGlobals();
	HTMLElement.prototype.scrollIntoView = scrollIntoView;
	HTMLElement.prototype.hasPointerCapture = hasPointerCapture;
});
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
beforeEach(() => {
	mocks.run.mockResolvedValue({
		pixelReturn: [
			{ output: [], operationType: [] },
			{ output: { edges: [] }, operationType: [] },
		],
	});
});

describe("Query Builder database selection", () => {
	it("renders legacy database names and selects their IDs for metadata requests", async () => {
		mocks.pixel.mockReturnValue({
			status: "SUCCESS",
			data: [{ database_id: "sales-db", database_name: "Sales" }],
			refresh: mocks.refresh,
		});
		render(<DataImportFormModal setIsDataImportModalOpen={vi.fn()} />);
		const trigger = screen.getByRole("combobox", { name: "Database" });
		trigger.focus();
		fireEvent.keyDown(trigger, { key: "ArrowDown" });
		const option = await screen.findByRole("option", { name: /Sales/ });
		fireEvent.keyDown(option, { key: "Enter" });
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				expect.stringContaining('database=[ "sales-db" ]'),
			),
		);
		expect(mocks.dispatch).not.toHaveBeenCalled();
		expect(trigger).toHaveTextContent("Sales");
	});

	it("keeps long lists scrollable inside the dialog and makes the last option keyboard-accessible", async () => {
		mocks.pixel.mockReturnValue({
			status: "SUCCESS",
			data: Array.from({ length: 60 }, (_, i) => ({
				engine_id: `db-${i}`,
				engine_name: `Database ${i}`,
			})),
			refresh: mocks.refresh,
		});
		render(<DataImportFormModal setIsDataImportModalOpen={vi.fn()} />);
		const trigger = screen.getByRole("combobox", { name: "Database" });
		trigger.focus();
		fireEvent.keyDown(trigger, { key: "ArrowDown" });
		const list = await screen.findByRole("listbox");
		const viewport = list.querySelector<HTMLElement>(
			"[data-radix-select-viewport]",
		);
		expect(viewport).not.toBeNull();
		// JSDOM has no layout: give the real Radix scroll-lock handler a scrollable viewport.
		Object.defineProperties(viewport, {
			clientHeight: { value: 288, configurable: true },
			scrollHeight: { value: 1800, configurable: true },
		});
		const wheel = createEvent.wheel(viewport, {
			deltaY: 100,
			bubbles: true,
			cancelable: true,
		});
		fireEvent(viewport, wheel);
		expect(wheel.defaultPrevented).toBe(false);
		fireEvent.keyDown(list, { key: "End" });
		const last = screen.getByRole("option", { name: /Database 59/ });
		await waitFor(() => expect(last).toHaveFocus());
		fireEvent.keyDown(last, { key: "Enter" });
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				expect.stringContaining('database=[ "db-59" ]'),
			),
		);
	});

	it("explains failed loads and lets the user retry", () => {
		mocks.pixel.mockReturnValue({
			status: "ERROR",
			data: undefined,
			refresh: mocks.refresh,
		});
		render(<DataImportFormModal setIsDataImportModalOpen={vi.fn()} />);
		expect(
			screen.getByRole("combobox", { name: "Database" }),
		).toBeDisabled();
		expect(
			screen.getByText(/Unable to load databases/),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(mocks.refresh).toHaveBeenCalledTimes(1);
	});
});

describe("Query Builder editing lifecycle", () => {
	const savedCell = {
		id: "1",
		query: { id: "notebook" },
		parameters: {
			databaseId: "sales-db",
			rootTable: "Orders",
			dataLimit: -1,
			selectedColumns: ["Orders__order_id", "Customers__customer_id"],
			columnAliases: ["OrderId", "CustomerId"],
			selectQuery: "saved query",
			joins: [
				{
					leftTable: "Orders",
					rightTable: "Customers",
					joinType: "left.outer",
					leftKey: "order_id",
					rightKey: "customer_id",
				},
			],
		},
	};
	beforeEach(() => {
		mocks.pixel.mockReturnValue({
			status: "SUCCESS",
			data: [
				{ engine_id: "sales-db", engine_name: "Sales" },
				{ engine_id: "other-db", engine_name: "Other" },
			],
			refresh: mocks.refresh,
		});
		mocks.run.mockImplementation((query: string) =>
			Promise.resolve(
				query.startsWith("META|")
					? {
							pixelReturn: [
								{
									operationType: [],
									output: [
										["Orders", "order_id", "STRING", false],
										[
											"Customers",
											"customer_id",
											"STRING",
											false,
										],
									],
								},
								{
									operationType: [],
									output: {
										edges: [
											{
												source: "Orders",
												target: "Customers",
												sourceColumn: "order_id",
												targetColumn: "customer_id",
												relation: "orders-customers",
											},
										],
									},
								},
							],
						}
					: {
							pixelReturn: [
								{ operationType: [], output: {} },
								{
									operationType: [],
									output: {
										data: {
											headers: ["OrderId"],
											values: [["preview row"]],
										},
									},
								},
							],
						},
			),
		);
	});

	it("loads saved selections once and previews current aliases without a request loop", async () => {
		const { rerender } = render(
			<DataImportFormModal
				editMode
				cell={savedCell}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		const alias = await screen.findByDisplayValue("OrderId");
		fireEvent.change(alias, { target: { value: "RenamedOrder" } });
		rerender(
			<DataImportFormModal
				editMode
				cell={{ ...savedCell }}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		expect(screen.getByDisplayValue("RenamedOrder")).toBeInTheDocument();
		expect(mocks.run).toHaveBeenCalledTimes(1);

		fireEvent.keyDown(
			screen.getByRole("tab", { name: "Preview", exact: true }),
			{ key: "Enter" },
		);
		await screen.findByText("preview row");
		expect(mocks.run).toHaveBeenCalledTimes(2);
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("RenamedOrder , CustomerId"),
		);
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("left.outer.join"),
		);
		rerender(
			<DataImportFormModal
				editMode
				cell={{ ...savedCell }}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		expect(screen.getByText("preview row")).toBeInTheDocument();
		expect(mocks.run).toHaveBeenCalledTimes(2);

		const trigger = screen.getByRole("combobox", { name: "Database" });
		trigger.focus();
		fireEvent.keyDown(trigger, { key: "ArrowDown" });
		fireEvent.keyDown(
			await screen.findByRole("option", { name: /Other/ }),
			{ key: "Enter" },
		);
		await screen.findByDisplayValue("order_id");
		expect(screen.queryByText("preview row")).not.toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: "Preview", exact: true }),
		).toBeDisabled();
		expect(mocks.run).toHaveBeenCalledTimes(3);
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining('database=[ "other-db" ]'),
		);
		expect(mocks.dispatch).not.toHaveBeenCalled();
	});

	it("updates joins when columns are deselected and reselected without restoring saved selections", async () => {
		render(
			<DataImportFormModal
				editMode
				cell={savedCell}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		await screen.findByDisplayValue("OrderId");
		const customerRow = screen.getByRole("row", { name: /customer_id/ });
		fireEvent.click(within(customerRow).getByRole("checkbox"));
		expect(within(customerRow).getByRole("checkbox")).not.toBeChecked();
		fireEvent.keyDown(
			screen.getByRole("tab", { name: "Preview", exact: true }),
			{ key: "Enter" },
		);
		await screen.findByText("preview row");
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.not.stringContaining("| Join"),
		);

		fireEvent.keyDown(
			screen.getByRole("tab", { name: "Columns", exact: true }),
			{ key: "Enter" },
		);
		fireEvent.click(
			within(screen.getByRole("row", { name: /customer_id/ })).getByRole(
				"checkbox",
			),
		);
		fireEvent.keyDown(
			screen.getByRole("tab", { name: "Preview", exact: true }),
			{ key: "Enter" },
		);
		await screen.findByText("preview row");
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining(
				"| Join ( ( Orders , inner.join , Customers ) )",
			),
		);
		expect(mocks.run).toHaveBeenCalledTimes(3);
	});

	it("initializes an empty saved selection without repeating metadata or resetting edits", async () => {
		const cell = {
			...savedCell,
			parameters: {
				...savedCell.parameters,
				selectedColumns: [],
				columnAliases: [],
				joins: [],
			},
		};
		const { rerender } = render(
			<DataImportFormModal
				editMode
				cell={cell}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		await screen.findByDisplayValue("order_id");
		expect(
			screen.getByRole("tab", { name: "Preview", exact: true }),
		).toBeDisabled();
		fireEvent.click(
			within(screen.getByRole("row", { name: /order_id/ })).getByRole(
				"checkbox",
			),
		);
		rerender(
			<DataImportFormModal
				editMode
				cell={{ ...cell }}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		expect(
			within(screen.getByRole("row", { name: /order_id/ })).getByRole(
				"checkbox",
			),
		).toBeChecked();
		expect(mocks.run).toHaveBeenCalledTimes(1);
	});

	it("preserves aliases across table collapse and exposes validation beside the named input", async () => {
		render(
			<DataImportFormModal
				editMode
				cell={savedCell}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		const alias = await screen.findByRole("textbox", {
			name: "Alias for Orders.order_id",
		});
		await waitFor(() => expect(alias).toHaveValue("OrderId"));
		fireEvent.change(alias, { target: { value: "RenamedOrder" } });
		const disclosure = screen.getByRole("button", {
			name: "Orders",
			exact: true,
		});
		fireEvent.click(disclosure);
		expect(disclosure).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.queryByRole("region", { name: "Orders columns" }),
		).not.toBeInTheDocument();
		fireEvent.click(disclosure);
		const reopenedAlias = screen.getByRole("textbox", {
			name: "Alias for Orders.order_id",
		});
		expect(reopenedAlias).toHaveValue("RenamedOrder");
		expect(
			within(
				screen.getByRole("region", { name: "Orders columns" }),
			).queryByRole("combobox"),
		).not.toBeInTheDocument();

		fireEvent.change(reopenedAlias, { target: { value: "CustomerId" } });
		expect(reopenedAlias).toHaveAttribute("aria-invalid", "true");
		expect(reopenedAlias).toHaveAccessibleDescription(
			"Use a unique alias.",
		);
		expect(
			screen.getByRole("button", { name: "Update Cell" }),
		).toBeDisabled();
		expect(screen.getByRole("tab", { name: "Preview" })).toBeDisabled();
		expect(
			screen.getByText("Give each selected column a unique alias."),
		).toBeInTheDocument();
		fireEvent.change(reopenedAlias, { target: { value: "" } });
		expect(reopenedAlias).toHaveAccessibleDescription("Enter an alias.");
		fireEvent.change(reopenedAlias, { target: { value: "OrderId" } });
		expect(
			screen.getByRole("button", { name: "Update Cell" }),
		).toBeEnabled();
	});

	it("keeps selections and alias validation across tables when using Select all", async () => {
		render(
			<DataImportFormModal
				editMode
				cell={savedCell}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		await screen.findByDisplayValue("OrderId");
		const selectCustomers = screen.getByRole("checkbox", {
			name: "Select all columns in Customers",
		});
		fireEvent.click(selectCustomers);
		expect(screen.getByText("1 column selected")).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Preview" })).toBeEnabled();
		expect(
			screen.queryByRole("region", { name: "Joins" }),
		).not.toBeInTheDocument();
		fireEvent.click(selectCustomers);
		expect(screen.getByText("2 columns selected")).toBeInTheDocument();
		fireEvent.keyDown(screen.getByRole("tab", { name: "Preview" }), {
			key: "Enter",
		});
		await screen.findByText("preview row");
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining(
				"| Join ( ( Orders , inner.join , Customers ) )",
			),
		);
		fireEvent.keyDown(screen.getByRole("tab", { name: "Columns" }), {
			key: "Enter",
		});
		fireEvent.change(
			screen.getByRole("textbox", {
				name: "Alias for Customers.customer_id",
			}),
			{
				target: { value: "OrderId" },
			},
		);
		const selectOrders = screen.getByRole("checkbox", {
			name: "Select all columns in Orders",
		});
		fireEvent.click(selectOrders);
		expect(
			screen.getByRole("button", { name: "Update Cell" }),
		).toBeEnabled();
		fireEvent.click(selectOrders);
		expect(screen.getByText("2 columns selected")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Update Cell" }),
		).toBeDisabled();
		expect(
			screen.getByRole("textbox", {
				name: "Alias for Customers.customer_id",
			}),
		).toHaveAccessibleDescription("Use a unique alias.");
	});

	it("uses the named join selector for keyboard changes and preserves the saved join keys", async () => {
		render(
			<DataImportFormModal
				editMode
				cell={savedCell}
				setIsDataImportModalOpen={vi.fn()}
			/>,
		);
		const join = await screen.findByRole("combobox", {
			name: "Join type for Orders and Customers",
		});
		expect(join).toHaveTextContent("Left join");
		join.focus();
		fireEvent.keyDown(join, { key: "ArrowDown" });
		fireEvent.keyDown(
			await screen.findByRole("option", { name: "Right join" }),
			{ key: "Enter" },
		);
		expect(join).toHaveTextContent("Right join");
		fireEvent.keyDown(screen.getByRole("tab", { name: "Preview" }), {
			key: "Enter",
		});
		await screen.findByText("preview row");
		expect(mocks.run).toHaveBeenLastCalledWith(
			expect.stringContaining("right.outer.join"),
		);
		fireEvent.click(screen.getByRole("button", { name: "Update Cell" }));
		await waitFor(() =>
			expect(mocks.dispatch).toHaveBeenCalledWith({
				message: "UPDATE_CELL",
				payload: {
					queryId: "notebook",
					cellId: "1",
					path: "parameters.joins",
					value: [
						{
							leftTable: "Orders",
							rightTable: "Customers",
							joinType: "right.outer",
							leftKey: "order_id",
							rightKey: "customer_id",
						},
					],
				},
			}),
		);
	});
});
