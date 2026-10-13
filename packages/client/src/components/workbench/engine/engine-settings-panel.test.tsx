import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useId } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createEngineSettingsPanel,
	ENGINE_SETTINGS_TABS,
} from "./engine-settings-panel";

const mocks = vi.hoisted(() => ({
	permission: "OWNER",
	admin: false,
	audit: vi.fn(),
}));
vi.mock("@/hooks/useEngine", () => ({
	useEngine: () => ({
		engine: { engine_id: "engine-1" },
		permission: mocks.permission,
	}),
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => mocks.admin }));
vi.mock("@/pages/engine/engine-activity-page", () => ({
	EngineActivityPage: () => null,
}));
vi.mock("@/pages/engine/engine-mcp-usage-page", () => ({
	EngineMcpUsagePage: () => null,
}));
vi.mock("@/pages/engine/engine-metadata-page", () => ({
	EngineMetadataPage: () => null,
}));
vi.mock("@/pages/engine/engine-overview-page", () => ({
	EngineOverviewPage: () => null,
}));
vi.mock("@/pages/engine/engine-settings-page", () => ({
	EngineSettingsPage: () => null,
}));
vi.mock("@/pages/engine/engine-smss-page", () => ({
	EngineSmssPage: () => null,
}));
vi.mock("@/pages/engine/engine-usage-page", () => ({
	EngineUsagePage: () => null,
}));
vi.mock("@/features/audit-trails/resource-audit-trails", () => ({
	ResourceAuditTrails: (props: unknown) => {
		mocks.audit(props);
		return <div>Engine audit history</div>;
	},
}));
const Settings = createEngineSettingsPanel(ENGINE_SETTINGS_TABS).content;
function SettingsFixture() {
	const id = useId();
	return <Settings id={id} />;
}
beforeEach(() => {
	mocks.permission = "OWNER";
	mocks.admin = false;
	mocks.audit.mockClear();
});
afterEach(cleanup);

describe("engine workbench audit tab", () => {
	it("loads engine-scoped history only after the owner selects the tab", () => {
		render(<SettingsFixture />);
		expect(mocks.audit).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("tab", { name: "Audit Trail" }));
		expect(mocks.audit).toHaveBeenLastCalledWith({
			scope: "ENGINE",
			resourceId: "engine-1",
		});
	});
	it.each(["EDIT", "READ_ONLY", "DISCOVERABLE"])(
		"hides audit history from %s users",
		(permission) => {
			mocks.permission = permission;
			render(<SettingsFixture />);
			expect(
				screen.queryByRole("tab", { name: "Audit Trail" }),
			).not.toBeInTheDocument();
			expect(mocks.audit).not.toHaveBeenCalled();
		},
	);
	it("allows admins and removes the audit view when authorization is revoked", () => {
		mocks.permission = "READ_ONLY";
		mocks.admin = true;
		const view = render(<SettingsFixture />);
		fireEvent.click(screen.getByRole("tab", { name: "Audit Trail" }));
		expect(screen.getByText("Engine audit history")).toBeInTheDocument();
		mocks.admin = false;
		view.rerender(<SettingsFixture />);
		expect(
			screen.queryByText("Engine audit history"),
		).not.toBeInTheDocument();
	});
});
