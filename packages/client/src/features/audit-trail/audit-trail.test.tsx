import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AUDIT_EVENT_COLUMNS,
	AUDIT_TARGET_CATALOG_COLUMNS,
	type AuditEventColumn,
} from "@/api/audit-trail";
import { AuditTrailPage } from "@/pages/settings/audit-trail.page";
import { SettingsIndexPage } from "@/pages/settings/settings-index-page";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	runPixel: vi.fn(),
	downloadBlob: vi.fn(),
	refresh: vi.fn(),
	adminMode: true,
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	runPixel: mocks.runPixel,
}));
vi.mock("@semoss/utility/browser", () => ({
	downloadBlob: mocks.downloadBlob,
}));
vi.mock("@/hooks/useSettings", () => ({
	useSettings: () => ({ adminMode: mocks.adminMode }),
}));

/** Model the actual Collect table shape, including nullable event fields. */
function result(count: number) {
	return {
		snapshot: "100",
		data: {
			headers: [...AUDIT_EVENT_COLUMNS] as string[],
			values: Array.from({ length: count }, (_, index) =>
				AUDIT_EVENT_COLUMNS.map((column) => {
					if (column === "EVENT_ID") return `event-${index}`;
					if (column === "ACTION" || column === "EVENT_TYPE")
						return "LOGIN";
					if (column === "STATUS") return "SUCCESS";
					if (column === "SEVERITY") return "LOW";
					if (column === "ACTOR_USER_NAME") return "Example user";
					if (column === "ACTOR_IS_ADMIN") return false;
					if (column === "SUBJECT_USER_NAME")
						return "Affected person";
					if (column === "SESSION_ID_HASH") return "session-hash";
					if (column === "ERROR_CODE") return "OPERATION_FAILED";
					if (column === "HASH_CURRENT") return "event-hash";
					if (column === "OLD_VALUE")
						return '{"permission":"READ_ONLY"}';
					if (column === "DETAILS")
						return '{"reason":"USER_LOGOUT","text":"<script>unsafe()</script>"}';
					return null;
				}),
			),
		},
	};
}

/** Supply the Settings routes without mounting unrelated app providers. */
function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/settings/audit-trail"]}>
			<Routes>
				<Route
					path="/settings/audit-trail"
					element={<AuditTrailPage />}
				/>
				<Route path="/settings" element={<div>Settings home</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	mocks.adminMode = true;
	mocks.usePixel.mockReset();
	mocks.runPixel.mockReset();
	mocks.downloadBlob.mockReset();
	mocks.refresh.mockReset();
	mocks.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: result(1),
		refresh: mocks.refresh,
	});
});
afterEach(cleanup);

describe("Audit Trail settings", () => {
	it("groups controls and pagination around the table with collapsed admin filters", () => {
		renderPage();
		const toolbar = screen.getByRole("toolbar", {
			name: "Audit table controls",
		});
		const toggle = within(toolbar).getByRole("button", {
			name: "Audit filters",
		});
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.queryByRole("combobox", { name: "Category" }),
		).not.toBeInTheDocument();
		expect(
			within(toolbar).getByRole("button", { name: "Refresh" }),
		).toBeInTheDocument();
		expect(
			within(toolbar).getByRole("button", { name: "Export CSV" }),
		).toBeInTheDocument();
		fireEvent.click(toggle);
		expect(
			screen.getByRole("combobox", { name: "Category" }),
		).toBeInTheDocument();
		const pagination = screen.getByRole("navigation", {
			name: "Audit events pagination",
		});
		expect(pagination.parentElement).toHaveTextContent(
			"Showing 1-1 events",
		);
		expect(within(pagination).getByText("Page 1")).toBeInTheDocument();
	});
	it("exposes a navigable card only in admin mode", () => {
		const view = render(
			<MemoryRouter initialEntries={["/settings"]}>
				<SettingsIndexPage />
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("link", { name: /Audit Trail/ }),
		).toHaveAttribute("href", "/settings/audit-trail");
		mocks.adminMode = false;
		view.rerender(
			<MemoryRouter initialEntries={["/settings"]}>
				<SettingsIndexPage />
			</MemoryRouter>,
		);
		expect(
			screen.queryByRole("link", { name: /Audit Trail/ }),
		).not.toBeInTheDocument();
	});

	it("redirects non-admin mode without issuing an audit read", () => {
		mocks.adminMode = false;
		renderPage();
		expect(screen.getByText("Settings home")).toBeInTheDocument();
		expect(mocks.usePixel).not.toHaveBeenCalled();
	});

	it("uses the lookahead row for pagination and resets the page when applying filters", async () => {
		mocks.usePixel.mockImplementation((pixel: string) => ({
			status: "SUCCESS",
			data: result(pixel.includes("page=[0]") ? 26 : 1),
			refresh: mocks.refresh,
		}));
		renderPage();
		expect(
			screen.getAllByRole("button", { name: /View details for event/ }),
		).toHaveLength(25);
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain("page=[1]");
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain('snapshot=["100"]');
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Audit filters" }));
		fireEvent.change(screen.getByLabelText("Actor user ID"), {
			target: { value: "actor-1" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
		await waitFor(() =>
			expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
				'actorId=["actor-1"]',
			),
		);
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain("page=[0]");
		expect(mocks.usePixel.mock.lastCall?.[0]).not.toContain("snapshot=");
		fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).not.toContain("actorId=");
	});

	it("shows all details as text and closes with Escape", async () => {
		renderPage();
		fireEvent.click(
			screen.getByRole("button", {
				name: "View details for event event-0",
			}),
		);
		const dialog = screen.getByRole("dialog", {
			name: "Audit event details",
		});
		expect(dialog).toHaveTextContent("Signed In");
		expect(dialog).toHaveTextContent("Succeeded");
		expect(dialog).toHaveTextContent("Affected person");
		expect(dialog).toHaveTextContent("Session ID hash");
		expect(dialog).toHaveTextContent("Error code");
		expect(dialog).toHaveTextContent("Event hash");
		expect(dialog).toHaveTextContent("Previous value");
		// fields the event did not record are left out
		expect(dialog).not.toHaveTextContent("Request path");
		expect(dialog).toHaveTextContent("<script>unsafe()</script>");
		expect(dialog.querySelector("script")).toBeNull();
		fireEvent.keyDown(dialog, { key: "Escape" });
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
	});

	it("shows each event by name, its people with their identity, and what it was on", () => {
		const event = result(1);
		const row = event.data.values[0];
		const set = (column: AuditEventColumn, value: string) => {
			row[AUDIT_EVENT_COLUMNS.indexOf(column)] = value;
		};
		set("EVENT_TYPE", "PERMISSION_DELETE");
		set("ACTION", "PERMISSION_EXPIRED");
		set("ACTOR_USER_ID", "SYSTEM");
		set("ACTOR_USER_TYPE", "SYSTEM");
		set("ACTOR_USER_NAME", "SYSTEM");
		set("TARGET_TYPE", "MODEL");
		set("TARGET_ID", "model-1");
		set("TARGET_NAME", "Model One");
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: event,
			refresh: mocks.refresh,
		});
		renderPage();
		expect(screen.getByText("Access Ended")).toBeInTheDocument();
		expect(screen.getByText("PERMISSION_DELETE")).toBeInTheDocument();
		expect(screen.getByText("SEMOSS")).toBeInTheDocument();
		expect(screen.getByText("System")).toBeInTheDocument();
		expect(screen.getByText("Model One")).toBeInTheDocument();
		expect(screen.getByText("Model")).toBeInTheDocument();
		expect(screen.getByText("Affected person")).toBeInTheDocument();
	});

	it("shows the resource as the catalog has it now, over the name the event recorded", () => {
		const event = result(1);
		const row = event.data.values[0];
		row[AUDIT_EVENT_COLUMNS.indexOf("TARGET_TYPE")] = "ENGINE";
		row[AUDIT_EVENT_COLUMNS.indexOf("TARGET_ID")] = "model-1";
		row[AUDIT_EVENT_COLUMNS.indexOf("TARGET_NAME")] = "Old name";
		event.data.headers.push(...AUDIT_TARGET_CATALOG_COLUMNS);
		row.push("Model One", "MODEL", "OPEN_AI");
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: event,
			refresh: mocks.refresh,
		});
		renderPage();
		expect(screen.getByText("Model One")).toBeInTheDocument();
		expect(screen.queryByText("Old name")).not.toBeInTheDocument();
		// the catalog knows the kind of an engine the event recorded only as an engine
		expect(screen.getByText("Model")).toBeInTheDocument();
		expect(screen.getByText("id: model-1")).toBeInTheDocument();
	});

	it("shows a user the event was on as a person, with their id", () => {
		const event = result(1);
		const row = event.data.values[0];
		row[AUDIT_EVENT_COLUMNS.indexOf("EVENT_TYPE")] = "USER_UPDATE";
		row[AUDIT_EVENT_COLUMNS.indexOf("TARGET_TYPE")] = "USER";
		row[AUDIT_EVENT_COLUMNS.indexOf("TARGET_ID")] = "target-user";
		row[AUDIT_EVENT_COLUMNS.indexOf("TARGET_NAME")] = "Target Person";
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: event,
			refresh: mocks.refresh,
		});
		renderPage();
		expect(screen.getByText("Target Person")).toBeInTheDocument();
		expect(screen.getByText("id: target-user")).toBeInTheDocument();
	});

	it("exports the filtered events as CSV through the export-marked read", async () => {
		mocks.runPixel.mockResolvedValue({
			pixelReturn: [{ operationType: ["TASK_DATA"], output: result(2) }],
		});
		renderPage();
		expect(
			screen.getByRole("columnheader", { name: "Affected user" }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
		await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalledOnce());
		expect(mocks.runPixel.mock.lastCall?.[0]).toContain(
			"AdminAuditEvents(export=[true]",
		);
		const [blob, fileName] = mocks.downloadBlob.mock.lastCall ?? [];
		expect(fileName).toMatch(/^audit-trail-\d{4}-\d{2}-\d{2}\.csv$/);
		expect((blob as Blob).type).toContain("text/csv");
		expect((blob as Blob).size).toBeGreaterThan(0);
	});

	it("does not download when the export read is denied", async () => {
		mocks.runPixel.mockResolvedValue({
			pixelReturn: [
				{
					operationType: ["ERROR"],
					output: "Functionality is only exposed for admins",
				},
			],
		});
		renderPage();
		fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
		await waitFor(() => expect(mocks.runPixel).toHaveBeenCalledOnce());
		expect(mocks.downloadBlob).not.toHaveBeenCalled();
	});

	it("distinguishes loading, empty results, and a backend error with retry", () => {
		mocks.usePixel.mockReturnValue({
			status: "LOADING",
			data: null,
			refresh: mocks.refresh,
		});
		const view = renderPage();
		expect(screen.getByRole("status")).toHaveTextContent(
			"Loading audit events",
		);
		expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: result(0),
			refresh: mocks.refresh,
		});
		view.rerender(
			<MemoryRouter>
				<AuditTrailPage />
			</MemoryRouter>,
		);
		expect(screen.getByText("No audit events yet")).toBeInTheDocument();
		mocks.usePixel.mockReturnValue({
			status: "ERROR",
			error: new Error("User tracking is disabled."),
			data: null,
			refresh: mocks.refresh,
		});
		view.rerender(
			<MemoryRouter>
				<AuditTrailPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"User tracking is disabled.",
		);
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
});
