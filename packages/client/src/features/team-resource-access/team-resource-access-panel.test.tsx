import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getTeamResourceCount,
	getTeamResources,
	type TeamResource,
} from "@/api/teams";
import { TeamResourceAccessPanel } from "./team-resource-access-panel";

vi.mock("@/api/teams", () => ({
	editTeamResourceAccess: vi.fn(),
	getTeamResourceCount: vi.fn(),
	getTeamResources: vi.fn(),
	removeTeamResourceAccess: vi.fn(),
}));
vi.mock("@semoss/shared", () => ({
	AppCatalogAvatar: ({ name }: { name: string }) => <span>{name} icon</span>,
	EngineSubtypeIcon: () => <span>engine icon</span>,
}));
vi.mock("./add-team-resource-access-dialog", () => ({
	AddTeamResourceAccessDialog: () => <div>Add Dialog</div>,
}));

/** The team the panel lists; stable so it does not reload */
const TEAM = { id: "Sales", type: "CUSTOM" };

/** A project the team can use at the Read-Only level */
const PIPELINE: TeamResource = {
	id: "pid1",
	name: "Pipeline",
	resourceType: "APP",
	subtype: null,
	permission: 3,
	dateCreated: null,
};

describe("TeamResourceAccessPanel", () => {
	beforeEach(() => {
		vi.mocked(getTeamResources).mockReset().mockResolvedValue([PIPELINE]);
		vi.mocked(getTeamResourceCount).mockReset().mockResolvedValue(1);
	});

	afterEach(() => {
		cleanup();
	});

	it("shows a team's managers its projects without ways to change them", async () => {
		render(
			<TeamResourceAccessPanel kind="PROJECT" group={TEAM} readOnly />,
		);

		expect(await screen.findByText("Pipeline")).toBeTruthy();
		expect(screen.getByText("id: pid1")).toBeTruthy();
		expect(screen.getByText("Read-Only")).toBeTruthy();
		expect(
			screen.getByText(/Their owners decide which teams can use them/),
		).toBeTruthy();

		expect(screen.queryByRole("checkbox")).toBeNull();
		expect(screen.queryByRole("combobox")).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Remove access to Pipeline" }),
		).toBeNull();
		expect(
			screen.queryByRole("button", { name: /Add Projects/ }),
		).toBeNull();
		expect(screen.queryByText("Add Dialog")).toBeNull();

		// a manager reads through the managers' endpoints
		expect(getTeamResources).toHaveBeenCalledWith(
			"PROJECT",
			TEAM,
			"",
			50,
			0,
			false,
		);
		expect(getTeamResourceCount).toHaveBeenCalledWith(
			"PROJECT",
			TEAM,
			"",
			false,
		);
	});

	it("has no add button when a read-only team has no engines", async () => {
		vi.mocked(getTeamResources).mockResolvedValue([]);
		vi.mocked(getTeamResourceCount).mockResolvedValue(0);
		render(<TeamResourceAccessPanel kind="ENGINE" group={TEAM} readOnly />);

		expect(
			await screen.findByText("This team cannot use any engines yet"),
		).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: /Add Engines/ }),
		).toBeNull();
	});

	it("lets admins add, change and remove access", async () => {
		render(<TeamResourceAccessPanel kind="PROJECT" group={TEAM} />);

		expect(await screen.findByText("Pipeline")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Remove access to Pipeline" }),
		).toBeTruthy();
		expect(
			screen.getByRole("combobox", { name: "Access level for Pipeline" }),
		).toBeTruthy();
		expect(
			screen.getAllByRole("button", { name: /Add Projects/ }).length,
		).toBe(1);
		await waitFor(() =>
			expect(getTeamResources).toHaveBeenCalledWith(
				"PROJECT",
				TEAM,
				"",
				50,
				0,
				true,
			),
		);
	});
});
