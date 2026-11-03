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
import { AUDIT_EVENT_COLUMNS } from "@/api/audit-trail";
import { EngineAuditPage } from "@/pages/engine/engine-audit.page";
import { ProjectAuditPage } from "@/pages/project/project-audit.page";
import { AuditTrailFilterForm } from "./audit-trail-filter-form";
import { ResourceAuditTrail } from "./resource-audit-trail";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	refresh: vi.fn(),
	permission: "OWNER",
	isAdmin: false,
}));
vi.mock("@semoss/sdk/react", () => ({ usePixel: mocks.usePixel }));
vi.mock("@/hooks/useEngine", () => ({
	useEngine: () => ({
		engine: { engine_id: "a" },
		permission: mocks.permission,
	}),
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => mocks.isAdmin }));
vi.mock("@/hooks/use-project", () => ({
	useProject: () => ({
		project: { project_id: "p" },
		permission: mocks.permission,
	}),
}));

function result() {
	return {
		events: [
			{
				...Object.fromEntries(
					AUDIT_EVENT_COLUMNS.map((column) => [column, null]),
				),
				EVENT_ID: "event-1",
				EVENT_TYPE: "PERMISSION_ADD",
				STATUS: "SUCCESS",
				ACTOR_USER_NAME: "Owner",
			},
		],
		page: 0,
		pageSize: 25,
		hasNextPage: true,
	};
}
beforeEach(() => {
	mocks.permission = "OWNER";
	mocks.isAdmin = false;
	mocks.usePixel.mockReset();
	mocks.refresh.mockReset();
	mocks.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: result(),
		refresh: mocks.refresh,
	});
});
afterEach(cleanup);

describe("resource audit trail", () => {
	it("groups table actions above the table and the event range with pagination below it", () => {
		render(<ResourceAuditTrail scope="ENGINE" resourceId="a" />);
		const toolbar = screen.getByRole("toolbar", {
			name: "Audit table controls",
		});
		expect(
			within(toolbar).getByRole("button", { name: "Audit filters" }),
		).toBeInTheDocument();
		expect(
			within(toolbar).getByRole("button", {
				name: "Refresh audit trail",
			}),
		).toBeInTheDocument();
		const pagination = screen.getByRole("navigation", {
			name: "Audit table pagination",
		});
		expect(within(pagination).getByText("Page 1")).toBeInTheDocument();
		expect(pagination.parentElement).toHaveTextContent(
			"Showing 1-1 events",
		);
		fireEvent.click(
			within(pagination).getByRole("button", { name: "Next page" }),
		);
		expect(within(pagination).getByText("Page 2")).toBeInTheDocument();
		expect(pagination.parentElement).toHaveTextContent(
			"Showing 26-26 events",
		);
	});
	it("starts collapsed and preserves filter drafts and applied filters when toggled", async () => {
		render(<ResourceAuditTrail scope="ENGINE" resourceId="a" />);
		const toggle = screen.getByRole("button", { name: "Audit filters" });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.queryByRole("textbox", { name: "Actor user ID" }),
		).not.toBeInTheDocument();
		fireEvent.click(toggle);
		fireEvent.change(screen.getByLabelText("Actor user ID"), {
			target: { value: "owner" },
		});
		fireEvent.click(toggle);
		fireEvent.click(toggle);
		expect(screen.getByLabelText("Actor user ID")).toHaveValue("owner");
		fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
		await waitFor(() => expect(toggle).toHaveTextContent("1"));
		fireEvent.click(toggle);
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
			'actorId=["owner"]',
		);
		fireEvent.click(toggle);
		fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
		expect(toggle).not.toHaveTextContent("1");
		expect(mocks.usePixel.mock.lastCall?.[0]).not.toContain("actorId=");
	});
	it.each(["ENGINE", "PROJECT"] as const)(
		"hides the category filter in the %s audit tab",
		(scope) => {
			render(<ResourceAuditTrail scope={scope} resourceId="a" />);
			expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
			expect(screen.getByLabelText("Event type")).toBeInTheDocument();
			expect(mocks.usePixel.mock.lastCall?.[0]).not.toContain(
				"category=",
			);
		},
	);
	it("keeps the category filter in the central admin viewer", () => {
		render(<AuditTrailFilterForm onApply={vi.fn()} />);
		expect(screen.getByLabelText("Category")).toBeInTheDocument();
	});
	it("renders an event when the backend omits its null fields", () => {
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			refresh: mocks.refresh,
			data: {
				page: 0,
				pageSize: 25,
				hasNextPage: false,
				events: [
					{
						EVENT_ID: "event-1",
						EVENT_TIME: "2026-10-12T08:26:46.053294Z",
						EVENT_TYPE: "PROJECT_CREATE",
						ACTION: "PROJECT_CREATE",
						STATUS: "SUCCESS",
						CATEGORY: "PROJECT",
						SEVERITY: "LOW",
						ACTOR_USER_NAME: "Ibrahim Mahaba",
						TARGET_TYPE: "PROJECT",
						TARGET_ID: "p",
						TARGET_NAME: "New App test Audit",
					},
				],
			},
		});
		render(<ResourceAuditTrail scope="PROJECT" resourceId="p" />);
		expect(screen.getByText("PROJECT_CREATE")).toBeInTheDocument();
		expect(screen.getByText("Ibrahim Mahaba")).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Next page" }),
		).toBeDisabled();
		fireEvent.click(
			screen.getByRole("button", {
				name: "View details for event event-1",
			}),
		);
		expect(screen.getByRole("dialog")).toHaveTextContent(
			"New App test Audit",
		);
	});
	it("allows admins through the resource route even without an owner role", () => {
		mocks.permission = "READ_ONLY";
		mocks.isAdmin = true;
		render(
			<MemoryRouter>
				<EngineAuditPage />
			</MemoryRouter>,
		);
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
			'EngineAuditEvents(id=["a"]',
		);
	});
	it("uses the project context for the project owner route", () => {
		render(
			<MemoryRouter>
				<ProjectAuditPage />
			</MemoryRouter>,
		);
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
			'ProjectAuditEvents(id=["p"]',
		);
	});
	it("paginates, sorts on the server, and resets pagination when filters change", async () => {
		render(<ResourceAuditTrail scope="ENGINE" resourceId="a" />);
		fireEvent.click(screen.getByRole("button", { name: "Audit filters" }));
		expect(screen.queryByLabelText("Engine ID")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Next page" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain("page=[1]");
		fireEvent.click(screen.getByRole("button", { name: "Status" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain('sort=["STATUS"]');
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain("page=[0]");
		fireEvent.click(screen.getByRole("button", { name: "Status" }));
		expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
			'direction=["ASC"]',
		);
		fireEvent.change(screen.getByLabelText("Actor user ID"), {
			target: { value: "other" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
		await waitFor(() =>
			expect(mocks.usePixel.mock.lastCall?.[0]).toContain(
				'actorId=["other"]',
			),
		);
		expect(mocks.usePixel.mock.lastCall?.[0]).not.toContain("category=");
		fireEvent.click(
			screen.getByRole("button", { name: "Refresh audit trail" }),
		);
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
	it("does not render administrative fields or export controls", () => {
		render(<ResourceAuditTrail scope="PROJECT" resourceId="p" />);
		fireEvent.click(
			screen.getByRole("button", {
				name: "View details for event event-1",
			}),
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog).not.toHaveTextContent("IP address");
		expect(dialog).not.toHaveTextContent("Session ID hash");
		expect(dialog).not.toHaveTextContent("Error message");
		expect(dialog).not.toHaveTextContent("Event hash");
		expect(
			screen.queryByRole("button", { name: "Export CSV" }),
		).not.toBeInTheDocument();
	});
	it("handles backend denial and disables forward pagination", () => {
		mocks.usePixel.mockReturnValue({
			status: "ERROR",
			data: null,
			error: { message: "Only current owners" },
			refresh: mocks.refresh,
		});
		render(<ResourceAuditTrail scope="ENGINE" resourceId="a" />);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Only current owners",
		);
		expect(
			screen.getByRole("button", { name: "Next page" }),
		).toBeDisabled();
	});
	it("redirects an editor before issuing any audit request", () => {
		mocks.permission = "EDIT";
		render(
			<MemoryRouter initialEntries={["/model/a/audit"]}>
				<Routes>
					<Route path="/model/a">
						<Route path="audit" element={<EngineAuditPage />} />
						<Route index element={<div>Overview</div>} />
					</Route>
				</Routes>
			</MemoryRouter>,
		);
		expect(mocks.usePixel).not.toHaveBeenCalled();
		expect(screen.getByText("Overview")).toBeInTheDocument();
	});
});
