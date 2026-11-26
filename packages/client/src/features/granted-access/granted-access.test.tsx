import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type GranteePermission,
	type GranteePermissionQuery,
	getAllGranteePermissions,
	savePermissionBatches,
} from "@semoss/sdk";
import { GrantedAccess } from "./granted-access";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	getAllGranteePermissions: vi.fn(),
	savePermissionBatches: vi.fn(),
}));

/**
 * The config resources, such as MODEL or SKILL, whose give-access setting a
 * test keeps for admins; every other one is open
 */
let adminOnlyAccess: string[] = [];

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useConfig: (
		selector: (state: {
			isAdminOnly: (resource: string, operation: string) => boolean;
		}) => unknown,
	) =>
		selector({
			isAdminOnly: (resource, operation) =>
				operation === "access" && adminOnlyAccess.includes(resource),
		}),
}));

/** Every config resource whose give-access setting covers a type the page shares */
const EVERY_RESOURCE = [
	"PROJECT",
	"WORKSPACE",
	"SKILL",
	"DATABASE",
	"MODEL",
	"STORAGE",
	"FUNCTION",
	"VECTOR",
	"GUARDRAIL",
];

/** An agent the skill's owner gave Read-Only */
const AGENT_ON_SKILL: GranteePermission = {
	target: {
		resourceType: "PROJECT",
		id: "skill1",
		type: "PROJECT",
		name: "Orders Skill",
		subtype: "SKILL",
	},
	subject: {
		category: "ENGINE",
		id: "agent1",
		type: "PROJECT",
		name: "Orders Agent",
		subtype: "WORKSPACE",
	},
	access: { level: "READ_ONLY", endDate: null, usageLimit: null },
	canChange: true,
};

/** An app's Editor on a database the user can only edit */
const APP_ON_DATABASE: GranteePermission = {
	target: {
		resourceType: "ENGINE",
		id: "db1",
		type: "DATABASE",
		name: "Orders Database",
		subtype: "H2_DB",
	},
	subject: {
		category: "ENGINE",
		id: "app1",
		type: "PROJECT",
		name: "Intake Form",
		subtype: "CODE",
	},
	access: { level: "EDIT", endDate: null, usageLimit: null },
	canChange: false,
};

/**
 * Answers each section's read with its kind's permissions: an agent on a
 * skill, an app on a database, and no engine on an engine
 */
const answerByKind = async (query: GranteePermissionQuery = {}) => {
	if (query.granteeKind === "PROJECT" && query.targetKind === "PROJECT") {
		return { grants: [AGENT_ON_SKILL], total: 1 };
	}
	if (query.granteeKind === "PROJECT" && query.targetKind === "ENGINE") {
		return { grants: [APP_ON_DATABASE], total: 1 };
	}
	return { grants: [], total: 0 };
};

const renderPage = (admin = false) =>
	render(
		<MemoryRouter>
			<GrantedAccess admin={admin} />
		</MemoryRouter>,
	);

/** A section, by the start of its title */
const section = (title: RegExp) => screen.getByRole("region", { name: title });

describe("GrantedAccess", () => {
	beforeEach(() => {
		adminOnlyAccess = [];
		vi.mocked(getAllGranteePermissions)
			.mockReset()
			.mockImplementation(answerByKind);
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

	it("lists projects using projects, projects using engines and engines using engines apart, each read by its kinds", async () => {
		renderPage();

		expect(await screen.findByText("Orders Agent")).toBeInTheDocument();
		for (const [granteeKind, targetKind] of [
			["PROJECT", "PROJECT"],
			["PROJECT", "ENGINE"],
			["ENGINE", "ENGINE"],
		]) {
			expect(getAllGranteePermissions).toHaveBeenCalledWith(
				{
					search: "",
					targetKind,
					targetType: "",
					granteeKind,
					granteeType: "",
					limit: 25,
					offset: 0,
				},
				false,
			);
		}
		const projects = section(/^Apps and Agents That Use Projects/);
		const engines = section(/^Apps and Agents That Use Engines/);
		expect(
			within(projects).getByRole("link", {
				name: "Orders Skill (opens in a new tab)",
			}),
		).toHaveAttribute("href", "/skill/skill1");
		expect(
			within(projects).getByText(
				"Reads its files, insights and reactors",
			),
		).toBeInTheDocument();
		expect(
			within(engines).getByText(
				"Reads and writes it, and uses its connection",
			),
		).toBeInTheDocument();
		expect(
			await within(section(/^Engines That Use Engines/)).findByText(
				"No permissions match",
			),
		).toBeInTheDocument();
	});

	it("gives controls only where the user can change the permission", async () => {
		renderPage();
		await screen.findByText("Orders Agent");

		expect(
			screen.getByRole("combobox", {
				name: "Permission for Orders Agent on Orders Skill",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("combobox", {
				name: "Permission for Intake Form on Orders Database",
			}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Remove access for Intake Form on Orders Database",
			}),
		).not.toBeInTheDocument();
	});

	it("takes a permission away on its own target after a confirmation, then reads its section again", async () => {
		renderPage(true);
		await screen.findByText("Orders Agent");
		const readsBefore = vi.mocked(getAllGranteePermissions).mock.calls
			.length;

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove access for Orders Agent on Orders Skill",
			}),
		);
		fireEvent.click(
			await screen.findByRole("button", { name: "Remove Access" }),
		);

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
				true,
			),
		);
		await waitFor(() =>
			expect(getAllGranteePermissions).toHaveBeenCalledTimes(
				readsBefore + 1,
			),
		);
	});

	it("names the types only admins give access to, and keeps Add Access while some type can be shared", async () => {
		adminOnlyAccess = ["MODEL"];
		renderPage();
		await screen.findByText("Orders Agent");

		expect(
			screen.getByText(
				/^Only admins can give access to models, from All Resource Delegated Access in admin mode\./,
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add Access" }),
		).toBeInTheDocument();
	});

	it("leaves out Add Access when only admins give access to every type", async () => {
		adminOnlyAccess = EVERY_RESOURCE;
		renderPage();
		await screen.findByText("Orders Agent");

		expect(
			screen.getByText(
				/^Only admins can give access to apps, agents, skills, notebooks, automations, databases, models, storage engines, functions, vector databases, and guardrails/,
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Add Access" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("combobox", {
				name: "Permission for Orders Agent on Orders Skill",
			}),
		).toBeInTheDocument();
	});

	it("offers Add Access and no note in admin mode, whatever the config keeps for admins", async () => {
		adminOnlyAccess = EVERY_RESOURCE;
		renderPage(true);
		await screen.findByText("Orders Agent");

		expect(
			screen.queryByText(/Only admins can give access/),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add Access" }),
		).toBeInTheDocument();
	});

	it("says why a section could not be read", async () => {
		vi.mocked(getAllGranteePermissions).mockRejectedValue(
			new Error("Server is down"),
		);
		renderPage();

		expect(
			await screen.findAllByText(
				/Could not read these permissions\. Server is down/,
			),
		).toHaveLength(3);
	});
});
