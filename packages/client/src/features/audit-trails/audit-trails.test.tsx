import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_EVENT_COLUMNS } from "@/api/audit-trails";
import { AuditTrailsPage } from "@/pages/settings/audit-trails.page";
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
		data: {
			headers: AUDIT_EVENT_COLUMNS,
			values: Array.from({ length: count }, (_, index) =>
				AUDIT_EVENT_COLUMNS.map((column) => {
					if (column === "EVENT_ID") return `event-${index}`;
					if (column === "ACTION" || column === "EVENT_TYPE")
						return "LOGIN";
					if (column === "STATUS") return "SUCCESS";
					if (column === "SEVERITY") return "LOW";
					if (column === "ACTOR_USER_NAME") return "Example user";
					if (column === "ACTOR_IS_ADMIN") return false;
					if (column === "SUBJECT_USER_NAME") return "Affected user";
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
		<MemoryRouter initialEntries={["/settings/audit-trails"]}>
			<Routes>
				<Route
					path="/settings/audit-trails"
					element={<AuditTrailsPage />}
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

describe("Audit Trails settings", () => {
	it("exposes a navigable card only in admin mode", () => {
		const view = render(
			<MemoryRouter initialEntries={["/settings"]}>
				<SettingsIndexPage />
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("link", { name: /Audit Trails/ }),
		).toHaveAttribute("href", "/settings/audit-trails");
		mocks.adminMode = false;
		view.rerender(
			<MemoryRouter initialEntries={["/settings"]}>
				<SettingsIndexPage />
			</MemoryRouter>,
		);
		expect(
			screen.queryByRole("link", { name: /Audit Trails/ }),
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
			data: result(pixel.includes("Offset(0)") ? 26 : 1),
			refresh: mocks.refresh,
		}));
		renderPage();
		expect(
			screen.getAllByRole("button", { name: /View details for event/ }),
		).toHaveLength(25);
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain("Offset(25)");
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		fireEvent.change(screen.getByLabelText("Actor user ID"), {
			target: { value: "actor-1" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
		await waitFor(() =>
			expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
				'ACTOR_USER_ID == "actor-1"',
			),
		);
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain("Offset(0)");
		fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).not.toContain("Filter(");
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
		expect(dialog).toHaveTextContent("Session ID hash");
		expect(dialog).toHaveTextContent("Affected user name");
		expect(dialog).toHaveTextContent("Error code");
		expect(dialog).toHaveTextContent("Event hash");
		expect(dialog).toHaveTextContent("Previous value");
		expect(dialog).toHaveTextContent("<script>unsafe()</script>");
		expect(dialog.querySelector("script")).toBeNull();
		fireEvent.keyDown(dialog, { key: "Escape" });
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
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
			"AdminUserAuditEvents(export=[true])",
		);
		const [blob, fileName] = mocks.downloadBlob.mock.lastCall ?? [];
		expect(fileName).toMatch(/^audit-trails-\d{4}-\d{2}-\d{2}\.csv$/);
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
				<AuditTrailsPage />
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
				<AuditTrailsPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"User tracking is disabled.",
		);
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
});
