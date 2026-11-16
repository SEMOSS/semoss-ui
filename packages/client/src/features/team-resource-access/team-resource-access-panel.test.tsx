import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
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

/** An engine the team can use at the Editor level */
const SALES_DB: TeamResource = {
	id: "eid1",
	name: "Sales DB",
	resourceType: "DATABASE",
	subtype: "H2_DB",
	permission: 2,
	dateCreated: null,
};

/** The panel's names link to pages, so it renders inside a router */
const renderPanel = (panel: ReactElement) =>
	render(<MemoryRouter>{panel}</MemoryRouter>);

describe("TeamResourceAccessPanel", () => {
	beforeEach(() => {
		vi.mocked(getTeamResources).mockReset().mockResolvedValue([PIPELINE]);
		vi.mocked(getTeamResourceCount).mockReset().mockResolvedValue(1);
	});

	afterEach(() => {
		cleanup();
	});

	it("shows a team's managers its projects without ways to change them", async () => {
		renderPanel(
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
		renderPanel(
			<TeamResourceAccessPanel kind="ENGINE" group={TEAM} readOnly />,
		);

		expect(
			await screen.findByText("This team cannot use any engines yet"),
		).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: /Add Engines/ }),
		).toBeNull();
	});

	it("lets admins add, change and remove access", async () => {
		renderPanel(<TeamResourceAccessPanel kind="PROJECT" group={TEAM} />);

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

	it("links each project and engine to its page in a new tab", async () => {
		renderPanel(
			<TeamResourceAccessPanel kind="PROJECT" group={TEAM} readOnly />,
		);
		const project = await screen.findByRole("link", {
			name: "Pipeline (opens in a new tab)",
		});
		expect(project.getAttribute("href")).toBe("/app/pid1");
		expect(project.getAttribute("target")).toBe("_blank");
		expect(project.getAttribute("rel")).toBe("noopener noreferrer");
		cleanup();

		vi.mocked(getTeamResources).mockResolvedValue([
			SALES_DB,
			{ ...SALES_DB, id: "eid2", name: "Mystery", resourceType: null },
		]);
		renderPanel(
			<TeamResourceAccessPanel kind="ENGINE" group={TEAM} readOnly />,
		);
		const engine = await screen.findByRole("link", {
			name: "Sales DB (opens in a new tab)",
		});
		expect(engine.getAttribute("href")).toBe("/database/eid1");
		expect(screen.getByText("Mystery").closest("a")).toBeNull();
	});

	it("copies a project's id", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});
		renderPanel(
			<TeamResourceAccessPanel kind="PROJECT" group={TEAM} readOnly />,
		);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Copy the id of Pipeline",
			}),
		);

		await waitFor(() => expect(writeText).toHaveBeenCalledWith("pid1"));
	});
});
