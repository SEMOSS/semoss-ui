import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppTestDatabasePanel } from "./app-test-database-panel";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const mocks = vi.hoisted(() => ({
	query: {
		status: "SUCCESS",
		data: {
			target: "app",
			configuration: {
				enabled: false,
				sourceEngineId: "",
				schemaSql: "",
				seedSql: "",
			},
		},
		error: null,
		refresh: vi.fn(),
	},
	save: vi.fn(),
	open: vi.fn(),
	close: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({ useSessionPixel: () => mocks.query }));
vi.mock("@semoss/sdk", () => ({ Env: { MODULE: "/Monolith" } }));
vi.mock("@/api/app-testing", async (original) => ({
	...(await original<typeof import("@/api/app-testing")>()),
	saveAppTestDatabase: mocks.save,
	openAppTestDatabase: mocks.open,
	closeAppTestDatabase: mocks.close,
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("ResizeObserver", ResizeObserverMock);
	mocks.query.status = "SUCCESS";
	mocks.query.data = {
		target: "app",
		configuration: {
			enabled: false,
			sourceEngineId: "",
			schemaSql: "",
			seedSql: "",
		},
	};
	mocks.save.mockImplementation(async (_app, config) => config);
	mocks.close.mockResolvedValue(undefined);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("test database configuration", () => {
	it("requires source/schema for enabled fixtures and retains values after a rejected save", async () => {
		mocks.save.mockRejectedValueOnce(
			new Error("Invalid fixture statement"),
		);
		render(
			<AppTestDatabasePanel
				appId="app"
				frame={null}
				isBusy={false}
				onConfigurationSaved={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Test Database"));
		fireEvent.click(
			screen.getByRole("switch", { name: "Use Isolated H2 for Tests" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Save Test Database" }),
		);
		await screen.findByText("Enter the H2 database ID used by this app");
		expect(mocks.save).not.toHaveBeenCalled();
		fireEvent.change(
			screen.getByRole("textbox", {
				name: "Source H2 Database ID (Required When Enabled)",
			}),
			{ target: { value: "source" } },
		);
		fireEvent.change(
			screen.getByRole("textbox", {
				name: "Schema SQL (Required When Enabled)",
			}),
			{
				target: { value: "CREATE TABLE TASKS (ID INTEGER);" },
			},
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Save Test Database" }),
		);
		await screen.findByText("Invalid fixture statement");
		expect(
			screen.getByRole("textbox", {
				name: "Source H2 Database ID (Required When Enabled)",
			}),
		).toHaveValue("source");
		fireEvent.click(
			screen.getByRole("button", { name: "Save Test Database" }),
		);
		await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
	});

	it("opens a fresh recording preview and restores the original iframe when closed", async () => {
		mocks.query.data.configuration = {
			enabled: true,
			sourceEngineId: "source",
			schemaSql: "CREATE TABLE TASKS (ID INTEGER);",
			seedSql: "",
		};
		const frame = document.createElement("iframe");
		frame.src = "/Monolith/public_home/app/portals/";
		const original = frame.src;
		mocks.open.mockResolvedValue({
			environmentId: "preview",
			previewPath:
				"app-test-preview/preview/capability/public_home/app/portals/",
			expiresAt: "2026-11-23T12:30:00Z",
		});
		render(
			<AppTestDatabasePanel
				appId="app"
				frame={frame}
				isBusy={false}
				onConfigurationSaved={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Test Database"));
		fireEvent.click(
			screen.getByRole("button", { name: "Open Test Preview" }),
		);
		await screen.findByRole("button", { name: "Return to Normal App" });
		expect(frame.src).toContain("/Monolith/app-test-preview/");
		fireEvent.click(
			screen.getByRole("button", { name: "Return to Normal App" }),
		);
		await waitFor(() => expect(frame.src).toBe(original));
		expect(mocks.close).toHaveBeenCalledWith("app", "preview");
	});

	it("disposes a preview whose open request completes after unmount", async () => {
		mocks.query.data.configuration = {
			enabled: true,
			sourceEngineId: "source",
			schemaSql: "CREATE TABLE TASKS (ID INTEGER);",
			seedSql: "",
		};
		let resolve: (value: unknown) => void = () => {};
		mocks.open.mockReturnValue(
			new Promise((done) => {
				resolve = done;
			}),
		);
		const frame = document.createElement("iframe");
		frame.src = "/normal/";
		const { unmount } = render(
			<AppTestDatabasePanel
				appId="app"
				frame={frame}
				isBusy={false}
				onConfigurationSaved={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Test Database"));
		fireEvent.click(
			screen.getByRole("button", { name: "Open Test Preview" }),
		);
		await waitFor(() => expect(mocks.open).toHaveBeenCalled());
		unmount();
		resolve({
			environmentId: "late",
			previewPath: "unused",
			expiresAt: "2026-11-23T12:30:00Z",
		});
		await waitFor(() =>
			expect(mocks.close).toHaveBeenCalledWith("app", "late"),
		);
		expect(frame.src).toContain("/normal/");
	});

	it("preserves the selected query/hash and never loads the normal app during reset", async () => {
		mocks.query.data.configuration = {
			enabled: true,
			sourceEngineId: "source",
			schemaSql: "CREATE TABLE TASKS (ID INTEGER);",
			seedSql: "",
		};
		const frame = document.createElement("iframe");
		frame.src = "/Monolith/public_home/app/portals/";
		Object.defineProperty(frame, "contentDocument", {
			value: { URL: `${frame.src}?env=test#/boards/b1` },
		});
		mocks.open.mockResolvedValueOnce({
			environmentId: "first",
			previewPath:
				"app-test-preview/first/capability/public_home/app/portals/",
			expiresAt: "2026-11-23T12:30:00Z",
		});
		render(
			<AppTestDatabasePanel
				appId="app"
				frame={frame}
				isBusy={false}
				onConfigurationSaved={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Test Database"));
		fireEvent.click(
			screen.getByRole("button", { name: "Open Test Preview" }),
		);
		await screen.findByRole("button", { name: "Reset Test Preview" });
		const oldUrl = frame.src;
		expect(oldUrl).toContain("?env=test#/boards/b1");
		let resolve: (value: unknown) => void = () => {};
		mocks.open.mockReturnValueOnce(
			new Promise((done) => {
				resolve = done;
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Reset Test Preview" }),
		);
		await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(2));
		expect(frame.src).toBe(oldUrl);
		resolve({
			environmentId: "second",
			previewPath:
				"app-test-preview/second/capability/public_home/app/portals/",
			expiresAt: "2026-11-23T12:40:00Z",
		});
		await waitFor(() =>
			expect(frame.src).toContain("app-test-preview/second/"),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Return to Normal App" }),
		);
		await waitFor(() =>
			expect(frame.src).toContain(
				"/Monolith/public_home/app/portals/?env=test#/boards/b1",
			),
		);
	});
});
