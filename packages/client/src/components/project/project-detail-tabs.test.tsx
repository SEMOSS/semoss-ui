import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectDetailTabs } from "./project-detail-tabs";

const mocks = vi.hoisted(() => ({
	permission: "OWNER",
	admin: false,
	audit: vi.fn(),
}));
vi.mock("@/hooks/use-project", () => ({
	useProject: () => ({
		project: { project_id: "automation-1" },
		type: "AUTOMATION",
		permission: mocks.permission,
	}),
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => mocks.admin }));
vi.mock("@/components/project", () => ({
	ProjectOverview: () => null,
	ProjectAccessControl: () => null,
}));
vi.mock("@/pages/app/app-activity-page", () => ({
	AppActivityPage: () => <div>App activity log</div>,
}));
vi.mock("@/pages/app/app-github-page", () => ({ AppGithubPage: () => null }));
vi.mock("@/pages/app/app-mcp-usage-page", () => ({
	AppMcpUsagePage: () => null,
}));
vi.mock("@/components/project/project-settings-panel", () => ({
	ProjectSettingsPanel: () => null,
}));
vi.mock("@/pages/app/app-smss-page", () => ({ AppSmssPage: () => null }));
vi.mock("@/pages/project/agent/agent-activity-page", () => ({
	AgentActivityPage: () => null,
}));
vi.mock("@/pages/project/project-dependencies-page", () => ({
	ProjectDependenciesPage: () => null,
}));
vi.mock("@/features/audit-trail/resource-audit-trail", () => ({
	ResourceAuditTrail: (props: unknown) => {
		mocks.audit(props);
		return <div>Automation audit history</div>;
	},
}));

const tabs = [
	{ name: "Overview", component: "project-overview" as const },
	{
		name: "Audit Trail",
		component: "audit" as const,
		restrict: ["OWNER" as const],
	},
];
beforeEach(() => {
	mocks.permission = "OWNER";
	mocks.admin = false;
	mocks.audit.mockClear();
});
afterEach(cleanup);

describe("workbench project audit tab", () => {
	it("loads the current automation's project-scoped history only when selected", () => {
		render(<ProjectDetailTabs tabs={tabs} />);
		expect(mocks.audit).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("tab", { name: "Audit Trail" }));
		expect(mocks.audit).toHaveBeenLastCalledWith({
			scope: "PROJECT",
			resourceId: "automation-1",
		});
	});
	it.each(["EDIT", "READ_ONLY"])(
		"hides audit history from %s users",
		(permission) => {
			mocks.permission = permission;
			render(<ProjectDetailTabs tabs={tabs} />);
			expect(
				screen.queryByRole("tab", { name: "Audit Trail" }),
			).not.toBeInTheDocument();
			expect(mocks.audit).not.toHaveBeenCalled();
		},
	);
	it("permits admins without an owner role and stops rendering after access is revoked", () => {
		mocks.permission = "READ_ONLY";
		mocks.admin = true;
		const view = render(<ProjectDetailTabs tabs={tabs} />);
		fireEvent.click(screen.getByRole("tab", { name: "Audit Trail" }));
		expect(
			screen.getByText("Automation audit history"),
		).toBeInTheDocument();
		mocks.admin = false;
		view.rerender(<ProjectDetailTabs tabs={tabs} />);
		expect(
			screen.queryByText("Automation audit history"),
		).not.toBeInTheDocument();
	});
});

describe("workbench project activity log tab", () => {
	const activityTabs = [
		{ name: "Overview", component: "project-overview" as const },
		{
			name: "Activity Log",
			component: "activity" as const,
			restrict: ["OWNER" as const, "EDIT" as const, "READ_ONLY" as const],
		},
	];

	it.each(["OWNER", "EDIT", "READ_ONLY"])(
		"shows the app's activity log to %s members once selected",
		(permission) => {
			mocks.permission = permission;
			render(<ProjectDetailTabs tabs={activityTabs} />);
			expect(
				screen.queryByText("App activity log"),
			).not.toBeInTheDocument();
			fireEvent.click(screen.getByRole("tab", { name: "Activity Log" }));
			expect(screen.getByText("App activity log")).toBeInTheDocument();
		},
	);
});
