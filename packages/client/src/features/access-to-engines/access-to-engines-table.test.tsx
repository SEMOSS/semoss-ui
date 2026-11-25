import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AccessToEngine,
	getResourcePermissions,
	type ResourcePermissions,
} from "@semoss/sdk";
import { AccessToEnginesTable } from "./access-to-engines-table";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	getResourcePermissions: vi.fn(),
}));

/** A model that gives the app Read-Only with an App Limit and an end date */
const MODEL: AccessToEngine = {
	target: {
		resourceType: "ENGINE",
		id: "model1",
		type: "MODEL",
		name: "Orders Model",
		subtype: "OPEN_AI",
	},
	access: {
		level: "READ_ONLY",
		endDate: "2027-01-01T00:00:00Z",
		usageLimit: {
			unlimited: false,
			rules: [
				{
					metric: "TOKENS",
					amount: 5000,
					window: "DAY",
					counts: "SHARED",
				},
			],
		},
	},
};

/** A database that gives the app Editor */
const DATABASE: AccessToEngine = {
	target: {
		resourceType: "ENGINE",
		id: "db1",
		type: "DATABASE",
		name: "Orders Database",
		subtype: "H2_DB",
	},
	access: { level: "EDIT", endDate: null, usageLimit: null },
};

/** The permissions of an app or engine with the engines that give it one */
const permissionsWith = (
	accessToEngines: AccessToEngine[],
): ResourcePermissions => ({
	people: [],
	teams: [],
	engines: [],
	accessToEngines,
	allowedPermissionChanges: {
		canChangePeople: true,
		canGiveAuthorAccess: true,
		canChangeTeams: true,
		canViewEngines: false,
		canChangeEngines: false,
		canViewAccessToEngines: true,
		addsAreAdminOnly: false,
		limitLevels: [],
		canChangeModelLimits: false,
	},
	publicUse: null,
	modelTotal: null,
	costLimitsAvailable: true,
	price: null,
});

const renderTable = (
	resourceType: "PROJECT" | "ENGINE" = "PROJECT",
	admin = false,
) =>
	render(
		<MemoryRouter>
			<AccessToEnginesTable
				resourceType={resourceType}
				id={resourceType === "PROJECT" ? "app-1" : "vectors-1"}
				type={resourceType === "PROJECT" ? "CODE" : "VECTOR"}
				admin={admin}
			/>
		</MemoryRouter>,
	);

describe("AccessToEnginesTable", () => {
	beforeEach(() => {
		vi.mocked(getResourcePermissions)
			.mockReset()
			.mockResolvedValue(permissionsWith([MODEL, DATABASE]));
		Element.prototype.scrollIntoView = vi.fn();
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("lists the engines an app can use with their level, limit and end date, each linking to its catalog page", async () => {
		renderTable();

		expect(screen.getByText("Loading...")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "What This App Can Use" }),
		).toBeInTheDocument();
		const model = await screen.findByRole("link", {
			name: "Orders Model (opens in a new tab)",
		});
		expect(model).toHaveAttribute("href", "/model/model1");
		expect(model).toHaveAttribute("target", "_blank");
		expect(
			screen.getByRole("link", {
				name: "Orders Database (opens in a new tab)",
			}),
		).toHaveAttribute("href", "/database/db1");
		expect(screen.getByText("id: model1")).toBeInTheDocument();
		expect(screen.getByText("Read-Only")).toBeInTheDocument();
		expect(screen.getByText("Editor")).toBeInTheDocument();
		expect(
			screen.getByText("Set by the model's owners"),
		).toBeInTheDocument();
		expect(screen.getByText("No usage limit")).toBeInTheDocument();
		expect(
			screen.getByText("Reads and writes it, and uses its connection"),
		).toBeInTheDocument();
		expect(screen.getByText("No end date")).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Usage Limit" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "PROJECT", id: "app-1" },
			false,
		);
	});

	it("names an engine's own list for it, reads it in admin mode when asked, and leaves out columns no engine needs", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([DATABASE]),
		);
		renderTable("ENGINE", true);

		expect(
			screen.getByRole("heading", {
				name: "What This Engine Can Use",
			}),
		).toBeInTheDocument();
		expect(await screen.findByText("Orders Database")).toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Usage Limit" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Ends" }),
		).not.toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "ENGINE", id: "vectors-1" },
			true,
		);
	});

	it("says when no engine gives the app a permission", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([]),
		);
		renderTable();

		expect(
			await screen.findByText(
				"No engine or project gives this app a permission yet",
			),
		).toBeInTheDocument();
	});

	it("shows why a read failed and reads again on Try Again", async () => {
		vi.mocked(getResourcePermissions)
			.mockRejectedValueOnce(new Error("Server is down"))
			.mockResolvedValueOnce(permissionsWith([MODEL]));
		renderTable();

		expect(
			await screen.findByText(
				/Could not read what this app can use\. Server is down/,
			),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		expect(await screen.findByText("Orders Model")).toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledTimes(2);
	});

	it("lists a skill an agent can use, linking to the skill's page and saying what its level allows", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([
				{
					target: {
						resourceType: "PROJECT",
						id: "skill1",
						type: "PROJECT",
						name: "Orders Skill",
						subtype: "SKILL",
					},
					access: {
						level: "READ_ONLY",
						endDate: null,
						usageLimit: null,
					},
				},
			]),
		);
		const agentId = "agent-1";
		render(
			<MemoryRouter>
				<AccessToEnginesTable
					resourceType="PROJECT"
					id={agentId}
					type="WORKSPACE"
				/>
			</MemoryRouter>,
		);

		expect(
			await screen.findByRole("link", {
				name: "Orders Skill (opens in a new tab)",
			}),
		).toHaveAttribute("href", "/skill/skill1");
		expect(
			screen.getByRole("heading", { name: "What This Agent Can Use" }),
		).toBeInTheDocument();
		expect(screen.getByText(/Its runs use each one/)).toBeInTheDocument();
		expect(
			screen.getByText("Reads its files, insights and reactors"),
		).toBeInTheDocument();
	});
});
