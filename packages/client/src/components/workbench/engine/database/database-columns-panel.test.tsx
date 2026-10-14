import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Role } from "@semoss/sdk";
import { DATABASE_COLUMNS_PANEL } from "./database-columns-panel";
import type { DatabaseType } from "./database-script-templates";

const { database, engine, uploadCsv } = vi.hoisted(() => ({
	database: {
		mode: "SQL" as DatabaseType,
		structure: {
			status: "SUCCESS",
			data: [
				{
					table: "CUSTOMERS",
					columns: [{ column: "CUSTOMER_ID", type: "INT" }],
				},
				{
					table: "ORDERS",
					columns: [{ column: "ORDER_ID", type: "INT" }],
				},
			],
			refresh: vi.fn(),
		},
		addQueryPanel: vi.fn(),
	},
	engine: { permission: "OWNER" as Role },
	uploadCsv: vi.fn(() => null),
}));

vi.mock("@/hooks/useEngine", () => ({
	useEngine: () => engine,
}));
vi.mock("@/hooks/use-database-workbench", () => ({
	useDatabaseWorkbench: <T,>(selector: (state: typeof database) => T): T =>
		selector(database),
}));
vi.mock("@semoss/shared", () => ({ DataTypeIcon: () => null }));
vi.mock("@semoss/workbench", () => ({ useWorkbenchControl: vi.fn() }));
vi.mock("./database-columns-refresh-control", () => ({
	DatabaseColumnsRefreshControl: () => null,
}));
vi.mock("./database-upload-file", () => ({ DatabaseUploadCsv: uploadCsv }));

/** Render the panel registered with the workbench using the real UI primitives. */
function renderColumnsPanel() {
	const ColumnsPanel = DATABASE_COLUMNS_PANEL.content;
	if (!ColumnsPanel) {
		throw new Error("The columns panel must have content");
	}
	// biome-ignore lint/correctness/useUniqueElementIds: This identifies a workbench panel, not a DOM element.
	return render(<ColumnsPanel id="columns" />);
}

beforeEach(() => {
	engine.permission = "OWNER";
	database.mode = "SQL";
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("database table interactions", () => {
	test("clicking a table toggles only its columns", () => {
		renderColumnsPanel();
		const customers = screen.getByTestId(
			"database-columns--table-header-CUSTOMERS",
		);

		fireEvent.click(customers);
		expect(screen.queryByText("CUSTOMER_ID")).not.toBeInTheDocument();
		expect(screen.getByText("ORDER_ID")).toBeVisible();
		expect(customers).toHaveAttribute("aria-expanded", "false");

		fireEvent.click(customers);
		expect(screen.getByText("CUSTOMER_ID")).toBeVisible();
		expect(customers).toHaveAttribute("aria-expanded", "true");
		expect(customers).toHaveAccessibleName(/CUSTOMERS/);
	});

	test("right-clicking a table opens actions without toggling its columns", () => {
		renderColumnsPanel();
		const customers = screen.getByTestId(
			"database-columns--table-header-CUSTOMERS",
		);

		fireEvent.contextMenu(customers);
		expect(screen.getByRole("menuitem", { name: "Upload" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Query" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Modify" })).toBeVisible();
		expect(screen.getByText("CUSTOMER_ID")).toBeVisible();
		expect(database.addQueryPanel).not.toHaveBeenCalled();
	});

	test.each(["OWNER", "EDIT"] as const)(
		"%s can open upload for the selected table",
		(permission) => {
			engine.permission = permission;
			renderColumnsPanel();
			fireEvent.contextMenu(
				screen.getByTestId("database-columns--table-header-ORDERS"),
			);
			fireEvent.click(screen.getByRole("menuitem", { name: "Upload" }));

			expect(uploadCsv).toHaveBeenLastCalledWith(
				expect.objectContaining({
					open: true,
					table: "ORDERS",
					structure: database.structure.data,
				}),
				undefined,
			);
		},
	);

	test.each(["SQL", "ADMIN_SQL"] as const)(
		"%s opens a top-100 query from the table menu",
		async (mode) => {
			database.mode = mode;
			renderColumnsPanel();
			fireEvent.contextMenu(
				screen.getByTestId("database-columns--table-header-CUSTOMERS"),
			);
			fireEvent.keyDown(screen.getByRole("menuitem", { name: "Query" }), {
				key: "ArrowRight",
			});
			fireEvent.keyDown(
				await screen.findByRole("menuitem", {
					name: "Select Top 100 Rows",
				}),
				{ key: "Enter" },
			);

			expect(database.addQueryPanel).toHaveBeenCalledExactlyOnceWith(
				"SELECT * FROM CUSTOMERS\nLIMIT 100;",
				"Select Top 100 Rows CUSTOMERS",
			);
		},
	);

	test("read-only users can access queries without upload or mutation actions", () => {
		engine.permission = "READ_ONLY";
		renderColumnsPanel();
		fireEvent.contextMenu(
			screen.getByTestId("database-columns--table-header-CUSTOMERS"),
		);

		expect(screen.getByRole("menuitem", { name: "Query" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Upload" })).toBeNull();
		expect(screen.queryByRole("menuitem", { name: "Modify" })).toBeNull();
	});

	test("SPARQL tables retain their query actions without CSV upload", async () => {
		database.mode = "SPARQL";
		renderColumnsPanel();
		fireEvent.contextMenu(
			screen.getByTestId("database-columns--table-header-CUSTOMERS"),
		);
		expect(screen.queryByRole("menuitem", { name: "Upload" })).toBeNull();
		fireEvent.keyDown(screen.getByRole("menuitem", { name: "Query" }), {
			key: "ArrowRight",
		});
		expect(
			await screen.findByRole("menuitem", { name: "Select Instances" }),
		).toBeVisible();
	});
});
