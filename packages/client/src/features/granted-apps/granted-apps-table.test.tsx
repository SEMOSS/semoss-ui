import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getResourcePermissions,
	type ModelUsageLimit,
	type ResourcePermissions,
	savePermissionBatches,
} from "@semoss/sdk";
import type { Grantee } from "@/features/grants/grants";
import { GrantedAppsTable } from "./granted-apps-table";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	getResourcePermissions: vi.fn(),
	savePermissionBatches: vi.fn(),
}));

/** 5,000 tokens a day for the app, and 100 a day for each of its users */
const APP_LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{ metric: "TOKENS", amount: 5000, window: "DAY", counts: "SHARED" },
		{
			metric: "TOKENS",
			amount: 100,
			window: "DAY",
			counts: "EACH_PERSON",
		},
	],
};

/** An app with an end date and a usage limit */
const INTAKE: Grantee = {
	subject: {
		category: "ENGINE",
		id: "app1",
		type: "PROJECT",
		name: "Intake Form",
		subtype: "CODE",
	},
	access: {
		level: "READ_ONLY",
		endDate: "2027-01-01T00:00:00Z",
		usageLimit: APP_LIMIT,
	},
};

/** An app with neither */
const REPORTS: Grantee = {
	subject: {
		category: "ENGINE",
		id: "app2",
		type: "PROJECT",
		name: "Reports",
		subtype: null,
	},
	access: { level: "EDIT", endDate: null, usageLimit: null },
};

/** Another engine the engine gives a permission to, which the Apps table leaves out */
const GUARDRAIL: Grantee = {
	subject: {
		category: "ENGINE",
		id: "guard1",
		type: "GUARDRAIL",
		name: "Prompt Guard",
		subtype: "PROMPT",
	},
	access: { level: "READ_ONLY", endDate: null, usageLimit: null },
};

/**
 * An engine's permissions as an owner reads them, with the apps given and an
 * engine grantee the table leaves out; an
 * editor's when the apps cannot be changed, and an owner's where only admins
 * give access when asked
 */
const permissionsWith = (
	apps: Grantee[],
	canChangeEngines = true,
	addsAreAdminOnly = false,
): ResourcePermissions => ({
	people: [],
	teams: [],
	engines: [...apps, GUARDRAIL],
	accessToEngines: [],
	allowedPermissionChanges: {
		canChangePeople: canChangeEngines,
		canGiveAuthorAccess: canChangeEngines,
		canChangeTeams: canChangeEngines,
		canViewEngines: true,
		canChangeEngines,
		canViewAccessToEngines: true,
		addsAreAdminOnly,
		limitLevels: canChangeEngines ? ["READ_ONLY", "EDIT", "OWNER"] : [],
		canChangeModelLimits: canChangeEngines,
	},
	publicUse: null,
	modelTotal: null,
	costLimitsAvailable: true,
	price: null,
});

/** Renders the table for a database, or for a model when asked */
const renderTable = ({ isModel = false, admin = false } = {}) => {
	const id = isModel ? "model-1" : "engine-1";
	return render(
		<MemoryRouter>
			<GrantedAppsTable
				target={{ resourceType: "ENGINE", id }}
				type={isModel ? "MODEL" : "DATABASE"}
				admin={admin}
			/>
		</MemoryRouter>,
	);
};

const getLevel = (name: string) =>
	screen.getByRole("combobox", { name: `Permission for ${name}` });

describe("GrantedAppsTable", () => {
	beforeEach(() => {
		vi.mocked(getResourcePermissions)
			.mockReset()
			.mockResolvedValue(permissionsWith([INTAKE, REPORTS]));
		vi.mocked(savePermissionBatches)
			.mockReset()
			.mockResolvedValue({ targets: 1, changes: 1 });
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

	it("reads the engine's apps and shows them to someone who cannot change them, with nothing to change", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([INTAKE, REPORTS], false),
		);
		renderTable();

		expect(
			screen.getByText("Loading apps and agents..."),
		).toBeInTheDocument();
		expect(await screen.findByText("Intake Form")).toBeInTheDocument();
		expect(screen.getByText("Reports")).toBeInTheDocument();
		expect(screen.getByText("id: app1")).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: "Intake Form (opens in a new tab)",
			}),
		).toHaveAttribute("href", "/app/app1");
		expect(screen.queryByText("Prompt Guard")).not.toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "ENGINE", id: "engine-1" },
			false,
		);
		expect(getLevel("Intake Form")).toBeDisabled();
		expect(getLevel("Intake Form")).toHaveTextContent("Read-Only");
		expect(getLevel("Reports")).toHaveTextContent("Editor");
		expect(
			screen.queryByRole("button", { name: "Add App or Agent" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Actions" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Remove access for Intake Form",
			}),
		).not.toBeInTheDocument();
	});

	it("tells an owner only admins give apps access where adds are left to admins, and keeps changing and removing", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([INTAKE, REPORTS], true, true),
		);
		renderTable();

		expect(await screen.findByText("Intake Form")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Add App or Agent" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(
				/Only admins can give access to databases, from this page in admin mode/,
			),
		).toBeInTheDocument();
		expect(getLevel("Intake Form")).toBeEnabled();
		expect(
			screen.getByRole("button", {
				name: "Remove access for Intake Form",
			}),
		).toBeEnabled();
	});

	it("offers an owner Add App, each level and Remove Access", async () => {
		renderTable();

		expect(await screen.findByText("Intake Form")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add App or Agent" }),
		).toBeInTheDocument();
		expect(getLevel("Intake Form")).toBeEnabled();
		expect(
			screen.getByRole("button", {
				name: "Remove access for Intake Form",
			}),
		).toBeEnabled();
	});

	it("has a Usage Limit column only on a model, and an Ends column only when an app has an end date", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([REPORTS]),
		);
		const view = renderTable();

		expect(await screen.findByText("Reports")).toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Usage Limit" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Ends" }),
		).not.toBeInTheDocument();

		view.unmount();
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([INTAKE, REPORTS]),
		);
		renderTable({ isModel: true });

		expect(await screen.findByText("Intake Form")).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Usage Limit" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Ends" }),
		).toBeInTheDocument();
		expect(screen.getByText(/tokens a day shared/)).toBeInTheDocument();
		expect(
			screen.getByText(/tokens a day for each user/),
		).toBeInTheDocument();
		expect(screen.getByText("No end date")).toBeInTheDocument();
	});

	it("shows an app's limit read-only to someone who cannot set it", async () => {
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([INTAKE], false),
		);
		renderTable({ isModel: true });

		expect(
			await screen.findByText("Only owners can set usage limits"),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: /^Usage limit for Intake Form/,
			}),
		).not.toBeInTheDocument();
	});

	it("changes a level in place with one change that carries the end date and usage limit, then reads the apps again", async () => {
		vi.mocked(getResourcePermissions)
			.mockResolvedValueOnce(permissionsWith([INTAKE, REPORTS]))
			.mockResolvedValue(
				permissionsWith([
					{
						subject: INTAKE.subject,
						access: { ...INTAKE.access, level: "EDIT" },
					},
					REPORTS,
				]),
			);
		renderTable({ isModel: true });
		await screen.findByText("Intake Form");

		fireEvent.click(getLevel("Intake Form"));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));

		await waitFor(() =>
			expect(getResourcePermissions).toHaveBeenCalledTimes(2),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						{
							action: "CHANGE",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
							to: {
								level: "EDIT",
								endDate: "2027-01-01T00:00:00Z",
								usageLimit: APP_LIMIT,
							},
						},
					],
				},
			],
			false,
		);
		await waitFor(() => expect(getLevel("Intake Form")).toBeEnabled());
		expect(getLevel("Intake Form")).toHaveTextContent("Editor");
	});

	it("shows why a level change was refused above the table, and keeps the level the app has", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error(
				"Only this engine's owners can change which apps can use it",
			),
		);
		renderTable();
		await screen.findByText("Intake Form");

		fireEvent.click(getLevel("Intake Form"));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));

		expect(
			await screen.findByText(
				"Only this engine's owners can change which apps can use it",
			),
		).toBeInTheDocument();
		expect(getLevel("Intake Form")).toHaveTextContent("Read-Only");
		expect(getResourcePermissions).toHaveBeenCalledTimes(1);
	});

	it("takes an app's access away after a confirmation, then reads the apps again", async () => {
		vi.mocked(getResourcePermissions)
			.mockResolvedValueOnce(permissionsWith([INTAKE, REPORTS]))
			.mockResolvedValue(permissionsWith([REPORTS]));
		renderTable();
		await screen.findByText("Intake Form");

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove access for Intake Form",
			}),
		);

		expect(
			await screen.findByRole("heading", { name: "Remove Access" }),
		).toBeInTheDocument();
		expect(savePermissionBatches).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Remove Access" }));

		await waitFor(() =>
			expect(screen.queryByText("Intake Form")).not.toBeInTheDocument(),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "engine-1" },
					changes: [
						{
							action: "REMOVE",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
						},
					],
				},
			],
			false,
		);
		expect(screen.getByText("Reports")).toBeInTheDocument();
	});

	it("shows a refused removal in the confirmation, which stays open", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error("Intake Form has no access to this engine"),
		);
		renderTable();
		await screen.findByText("Intake Form");

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove access for Intake Form",
			}),
		);
		fireEvent.click(
			await screen.findByRole("button", { name: "Remove Access" }),
		);

		expect(
			await screen.findByText("Intake Form has no access to this engine"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Remove Access" }),
		).toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledTimes(1);
	});

	it("saves an app's usage limit from its dialog, keeping its level and end date", async () => {
		renderTable({ isModel: true });

		fireEvent.click(
			await screen.findByRole("button", {
				name: /^Usage limit for Intake Form/,
			}),
		);

		expect(
			await screen.findByRole("heading", {
				name: "Usage Limit for Intake Form",
			}),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("radio", { name: "usageLimit.modes.notDefined" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Save Limit" }));

		await waitFor(() =>
			expect(getResourcePermissions).toHaveBeenCalledTimes(2),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						{
							action: "CHANGE",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
							to: {
								level: "READ_ONLY",
								endDate: "2027-01-01T00:00:00Z",
							},
						},
					],
				},
			],
			false,
		);
	});

	it("says why the apps could not be read, and reads them again on Try Again", async () => {
		vi.mocked(getResourcePermissions)
			.mockRejectedValueOnce(new Error("The engine could not be found"))
			.mockResolvedValue(permissionsWith([]));
		renderTable();

		expect(
			await screen.findByText(
				"Could not read the apps and agents that can use this engine. The engine could not be found",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText("No apps or agents have access yet"),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		expect(
			await screen.findByText("No apps or agents have access yet"),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/Could not read the apps and agents/),
		).not.toBeInTheDocument();
	});

	it("reads and saves in admin mode when asked", async () => {
		renderTable({ admin: true });
		await screen.findByText("Intake Form");

		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "ENGINE", id: "engine-1" },
			true,
		);

		fireEvent.click(getLevel("Reports"));
		fireEvent.click(
			await screen.findByRole("option", { name: "Read-Only" }),
		);

		await waitFor(() =>
			expect(savePermissionBatches).toHaveBeenCalledTimes(1),
		);
		expect(vi.mocked(savePermissionBatches).mock.calls[0][1]).toBe(true);
	});

	it("lists the apps and agents a skill gives a permission to, with no usage limits, and saves on the skill", async () => {
		const agent: Grantee = {
			subject: {
				category: "ENGINE",
				id: "agent1",
				type: "PROJECT",
				name: "Orders Agent",
				subtype: "WORKSPACE",
			},
			access: { level: "READ_ONLY", endDate: null, usageLimit: null },
		};
		vi.mocked(getResourcePermissions).mockResolvedValue(
			permissionsWith([agent]),
		);
		render(
			<MemoryRouter>
				<GrantedAppsTable
					target={{ resourceType: "PROJECT", id: "skill1" }}
					type="SKILL"
				/>
			</MemoryRouter>,
		);

		expect(await screen.findByText("Orders Agent")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: "Apps and Agents That Can Use This Skill",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(/such as an agent loading a skill/),
		).toBeInTheDocument();
		expect(getResourcePermissions).toHaveBeenCalledExactlyOnceWith(
			{ resourceType: "PROJECT", id: "skill1" },
			false,
		);
		expect(
			screen.queryByRole("columnheader", { name: "Usage Limit" }),
		).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove access for Orders Agent",
			}),
		);
		expect(
			await screen.findByText(/stop using this skill/),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Remove Access" }));

		await waitFor(() =>
			expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
				[
					{
						target: { resourceType: "PROJECT", id: "skill1" },
						changes: [
							{
								action: "REMOVE",
								subject: {
									category: "ENGINE",
									id: "agent1",
									type: "PROJECT",
								},
							},
						],
					},
				],
				false,
			),
		);
	});
});
