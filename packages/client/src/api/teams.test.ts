import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "@semoss/sdk/react";
import {
	addGroupManager,
	addTeam,
	addTeamUser,
	deleteTeam,
	deleteTeamUser,
	editTeam,
	getAvailableGroupsForResource,
	getGroupDetails,
	getGroupManagers,
	getGroupsWithAccessToEngine,
	getGroupsWithAccessToProject,
	getTeamResourceCount,
	getTeamResources,
	getTeams,
	getTeamUsers,
	readTeamDescription,
	removeGroupManager,
	toTeamMembers,
	toTeamSummaries,
	unquoteDescription,
} from "./teams";

vi.mock("@semoss/sdk/react", () => ({
	Env: { MODULE: "/Monolith" },
	get: vi.fn(),
	post: vi.fn(),
	runPixel: vi.fn(),
}));

/** A successful response carrying `data` */
const respond = (data: unknown) => ({ response: {} as Response, data });

beforeEach(() => {
	vi.mocked(get).mockReset();
	vi.mocked(post).mockReset();
});

describe("toTeamSummaries", () => {
	it("reads team rows and leaves out rows without a name or type", () => {
		expect(
			toTeamSummaries([
				{
					id: "Sales",
					type: "CUSTOM",
					description: "&quot;Sales &amp; marketing&quot;",
					dateadded: "2024-01-01",
					manager_since: "2024-02-01",
					member_count: 4,
				},
				{ id: "Engineering", type: "MICROSOFT", member_count: "12" },
				{ id: "", type: "CUSTOM" },
				{ id: "No Type" },
				{ type: "CUSTOM" },
				"Sales",
				null,
			]),
		).toEqual([
			{
				id: "Sales",
				type: "CUSTOM",
				description: "Sales & marketing",
				dateAdded: "2024-01-01",
				managerSince: "2024-02-01",
				memberCount: 4,
			},
			{
				id: "Engineering",
				type: "MICROSOFT",
				description: null,
				dateAdded: null,
				managerSince: null,
				memberCount: null,
			},
		]);
	});

	it("reads anything but a list as no teams", () => {
		expect(toTeamSummaries({ id: "Sales", type: "CUSTOM" })).toEqual([]);
		expect(toTeamSummaries(null)).toEqual([]);
	});
});

describe("toTeamMembers", () => {
	it("reads the user id from userid or id and leaves out rows without one or a type", () => {
		expect(
			toTeamMembers([
				{
					userid: "ada",
					id: "ignored",
					type: "NATIVE",
					name: "Ada Lovelace",
					email: "ada@example.com",
					username: "ada",
					dateadded: "2024-01-01",
				},
				{ id: "grace", type: "MICROSOFT", name: "  ", email: null },
				{ userid: "alan" },
				{ type: "NATIVE", name: "No Id" },
				42,
			]),
		).toEqual([
			{
				userId: "ada",
				type: "NATIVE",
				name: "Ada Lovelace",
				email: "ada@example.com",
				username: "ada",
				dateAdded: "2024-01-01",
			},
			{
				userId: "grace",
				type: "MICROSOFT",
				name: null,
				email: null,
				username: null,
				dateAdded: null,
			},
		]);
		expect(toTeamMembers("ada")).toEqual([]);
	});
});

describe("readTeamDescription", () => {
	it.each([
		["&quot;Quarterly &amp; annual&quot;", "Quarterly & annual"],
		["&#39;Wrapped&#39;", "Wrapped"],
		["'Wrapped'", "Wrapped"],
		["&lt;b&gt;Bold&lt;/b&gt;", "<b>Bold</b>"],
		["Plain text", "Plain text"],
	])("reads %j as %j", (stored, text) => {
		expect(readTeamDescription(stored)).toBe(text);
	});

	it.each(["", "   ", '""', "&quot;&quot;", null, undefined, 42, {}])(
		"reads %j as no description",
		(stored) => {
			expect(readTeamDescription(stored)).toBeNull();
		},
	);
});

describe("unquoteDescription", () => {
	it.each([
		['"Hello"', "Hello"],
		["''Hi''", "Hi"],
		["It's fine", "It's fine"],
		["No quotes", "No quotes"],
		['"Fast" lane', '"Fast" lane'],
		["the Smiths'", "the Smiths'"],
		["'\"Nested\"'", "Nested"],
	])("reads %j as %j", (text, unquoted) => {
		expect(unquoteDescription(text)).toBe(unquoted);
	});
});

describe("getAvailableGroupsForResource", () => {
	it("reads the teams a project can be given, decoding their descriptions", async () => {
		vi.mocked(get).mockResolvedValue(
			respond([
				{
					id: "Sales",
					type: "CUSTOM",
					description: "&quot;Sales &amp; marketing&quot;",
				},
				{ id: "Engineering", type: "MICROSOFT" },
				{ id: 7, type: "CUSTOM" },
				{ id: "No Type" },
				null,
			]),
		);

		await expect(
			getAvailableGroupsForResource(
				"PROJECT",
				"project 1",
				"sales",
				20,
				40,
			),
		).resolves.toEqual([
			{ id: "Sales", type: "CUSTOM", description: "Sales & marketing" },
			{ id: "Engineering", type: "MICROSOFT", description: null },
		]);
		expect(get).toHaveBeenCalledExactlyOnceWith(
			"/Monolith/api/auth/group/project/getAvailableGroupsForProject?projectId=project+1&limit=20&offset=40&searchTerm=sales",
		);
	});

	it("asks the engine endpoint by engineId, without a blank search", async () => {
		vi.mocked(get).mockResolvedValue(respond([]));

		await expect(
			getAvailableGroupsForResource("ENGINE", "engine-1", "", 20, 0),
		).resolves.toEqual([]);
		expect(get).toHaveBeenCalledExactlyOnceWith(
			"/Monolith/api/auth/group/engine/getAvailableGroupsForEngine?engineId=engine-1&limit=20&offset=0",
		);
	});

	it("rejects a response that is not a list", async () => {
		vi.mocked(get).mockResolvedValue(respond({ message: "Not a list" }));

		await expect(
			getAvailableGroupsForResource("PROJECT", "project-1", "", 20, 0),
		).rejects.toThrow("No Response to get available teams");
	});
});

describe("getGroupManagers", () => {
	it("reads the managers and leaves out entries without a user id", async () => {
		vi.mocked(get).mockResolvedValue(
			respond([
				{ userid: "ada", type: "NATIVE", name: "Ada Lovelace" },
				{ type: "NATIVE", name: "No Id" },
				{ userid: 42, type: "NATIVE" },
				"ada",
			]),
		);

		await expect(getGroupManagers("Sales & Ops", true)).resolves.toEqual([
			{ userid: "ada", type: "NATIVE", name: "Ada Lovelace" },
		]);
		expect(get).toHaveBeenCalledExactlyOnceWith(
			"/Monolith/api/auth/admin/group/getGroupManagers?groupId=Sales+%26+Ops",
		);
	});

	it.each([
		["PROJECT", "projectId"],
		["ENGINE", "engineId"],
	] as const)(
		"names the %s an owner is sharing so they can read its managers",
		async (resource, param) => {
			vi.mocked(get).mockResolvedValue(respond([]));

			await getGroupManagers("Sales", false, {
				resource,
				resourceId: "resource-1",
			});
			expect(get).toHaveBeenCalledExactlyOnceWith(
				`/Monolith/api/auth/group/getGroupManagers?groupId=Sales&${param}=resource-1`,
			);
		},
	);

	it("rejects a response that is not a list", async () => {
		vi.mocked(get).mockResolvedValue(respond(null));

		await expect(getGroupManagers("Sales", true)).rejects.toThrow(
			"No Response to get team managers",
		);
	});
});

describe("getGroupsWithAccessToEngine and getGroupsWithAccessToProject", () => {
	it("encodes the engine id and pages only when asked", async () => {
		vi.mocked(get).mockResolvedValue(respond(["Sales"]));

		await expect(
			getGroupsWithAccessToEngine("engine 1", 10, 0),
		).resolves.toEqual(["Sales"]);
		await getGroupsWithAccessToEngine("engine-1");
		expect(get).toHaveBeenNthCalledWith(
			1,
			"/Monolith/api/auth/group/engine/getGroupsWithAccessToEngine?engineId=engine+1&limit=10&offset=0",
		);
		expect(get).toHaveBeenNthCalledWith(
			2,
			"/Monolith/api/auth/group/engine/getGroupsWithAccessToEngine?engineId=engine-1",
		);
	});

	it("encodes the project id", async () => {
		vi.mocked(get).mockResolvedValue(respond([]));

		await getGroupsWithAccessToProject("a&b", 5, 10);
		expect(get).toHaveBeenCalledExactlyOnceWith(
			"/Monolith/api/auth/group/project/getGroupsWithAccessToProject?projectId=a%26b&limit=5&offset=10",
		);
	});
});

/** A write helper, what it posts, and how it fails */
interface TeamWrite {
	name: string;
	send: () => Promise<void>;
	url: string;
	body: Record<string, unknown>;
	failure: string;
}

const MEMBER = { groupId: "Sales", type: "NATIVE", userId: "ada" };

const WRITES: TeamWrite[] = [
	{
		name: "addTeam",
		send: () => addTeam("Sales", "Sales and marketing", false, "CUSTOM"),
		url: "/Monolith/api/auth/admin/group/addGroup",
		body: {
			groupId: "Sales",
			description: "Sales and marketing",
			isCustomGroup: false,
			type: "CUSTOM",
		},
		failure: "The team was not created",
	},
	{
		name: "addTeam without a type",
		send: () => addTeam("Sales", "", true),
		url: "/Monolith/api/auth/admin/group/addGroup",
		body: { groupId: "Sales", description: "", isCustomGroup: true },
		failure: "The team was not created",
	},
	{
		name: "editTeam",
		send: () => editTeam("Sales Team", "New description", "Sales", "MS AD"),
		url: "/Monolith/api/auth/admin/group/editGroupDetails",
		body: {
			groupId: "Sales",
			type: "MS AD",
			newGroupId: "Sales Team",
			newDescription: "New description",
		},
		failure: "The team was not saved",
	},
	{
		name: "deleteTeam",
		send: () => deleteTeam("Sales", "CUSTOM"),
		url: "/Monolith/api/auth/admin/group/deleteGroup",
		body: { groupId: "Sales", type: "CUSTOM" },
		failure: "The team was not deleted",
	},
	{
		name: "addTeamUser as an admin",
		send: () => addTeamUser("Sales", "NATIVE", "ada", true),
		url: "/Monolith/api/auth/admin/group/addGroupMember",
		body: MEMBER,
		failure: "The member was not added",
	},
	{
		name: "addTeamUser as a manager, with an end date",
		send: () => addTeamUser("Sales", "NATIVE", "ada", false, "2030-01-01"),
		url: "/Monolith/api/auth/group/addGroupMember",
		body: { ...MEMBER, endDate: "2030-01-01" },
		failure: "The member was not added",
	},
	{
		name: "deleteTeamUser as an admin",
		send: () =>
			deleteTeamUser({ groupid: "Sales", type: "NATIVE", userid: "ada" }),
		url: "/Monolith/api/auth/admin/group/deleteGroupMember",
		body: MEMBER,
		failure: "The member was not removed",
	},
	{
		name: "deleteTeamUser as a manager",
		send: () =>
			deleteTeamUser(
				{ groupid: "Sales", type: "NATIVE", userid: "ada" },
				false,
			),
		url: "/Monolith/api/auth/group/deleteGroupMember",
		body: MEMBER,
		failure: "The member was not removed",
	},
	{
		name: "addGroupManager",
		send: () => addGroupManager("Sales", "NATIVE", "ada", false),
		url: "/Monolith/api/auth/group/addGroupManager",
		body: MEMBER,
		failure: "The manager was not added",
	},
	{
		name: "removeGroupManager",
		send: () => removeGroupManager("Sales", "NATIVE", "ada", true),
		url: "/Monolith/api/auth/admin/group/removeGroupManager",
		body: MEMBER,
		failure: "The manager was not removed",
	},
];

describe("getTeamResources and getTeamResourceCount", () => {
	const team = { id: "Sales", type: "CUSTOM" };

	it.each([
		[
			true,
			"/Monolith/api/auth/admin/group/getProjectsForGroup?groupId=Sales&groupType=CUSTOM&limit=50",
		],
		[
			false,
			"/Monolith/api/auth/group/getProjectsForGroup?groupId=Sales&groupType=CUSTOM&limit=50",
		],
	])("reads a team's projects with admin %s", async (admin, url) => {
		vi.mocked(get).mockResolvedValue(
			respond([
				{
					project_id: "pid1",
					project_name: "Pipeline",
					project_type: "APP",
					permission: 3,
				},
			]),
		);

		const resources = await getTeamResources(
			"PROJECT",
			team,
			"",
			50,
			0,
			admin,
		);

		expect(get).toHaveBeenCalledWith(url);
		expect(resources).toEqual([
			{
				id: "pid1",
				name: "Pipeline",
				resourceType: "APP",
				subtype: null,
				permission: 3,
				dateCreated: null,
			},
		]);
	});

	it("reads a team's engines through the managers' endpoint", async () => {
		vi.mocked(get).mockResolvedValue(respond([]));

		await getTeamResources("ENGINE", team, "sales", 50, 50, false);

		expect(get).toHaveBeenCalledWith(
			"/Monolith/api/auth/group/getEnginesForGroup?groupId=Sales&groupType=CUSTOM&limit=50&offset=50&searchTerm=sales",
		);
	});

	it.each([
		["PROJECT", "getNumProjectsForGroup"],
		["ENGINE", "getNumEnginesForGroup"],
	] as const)(
		"counts a team's %s for its managers",
		async (kind, endpoint) => {
			vi.mocked(get).mockResolvedValue(respond(4));

			expect(await getTeamResourceCount(kind, team, "", false)).toBe(4);
			expect(get).toHaveBeenCalledWith(
				`/Monolith/api/auth/group/${endpoint}?groupId=Sales&groupType=CUSTOM`,
			);
		},
	);

	it("uses the admin endpoints by default", async () => {
		vi.mocked(get).mockResolvedValue(respond(2));

		await getTeamResourceCount("ENGINE", team, "");

		expect(get).toHaveBeenCalledWith(
			"/Monolith/api/auth/admin/group/getNumEnginesForGroup?groupId=Sales&groupType=CUSTOM",
		);
	});
});

describe("team writes", () => {
	it.each(WRITES)(
		"$name posts exactly its form fields",
		async ({ send, url, body }) => {
			vi.mocked(post).mockResolvedValue(respond(true));

			await expect(send()).resolves.toBeUndefined();
			expect(post).toHaveBeenCalledExactlyOnceWith(url, body, {});
		},
	);

	it.each(WRITES)(
		"$name rejects unless the backend answers true",
		async ({ send, failure }) => {
			for (const data of [false, { success: true }, "true", null]) {
				vi.mocked(post).mockResolvedValueOnce(respond(data));
				await expect(send()).rejects.toThrow(failure);
			}
		},
	);
});

describe("request errors", () => {
	it.each([
		["getTeams", () => getTeams(true)],
		["getGroupDetails", () => getGroupDetails(true, "Sales", "CUSTOM")],
		["getTeamUsers", () => getTeamUsers("Sales", 10, 0, "")],
		["getGroupManagers", () => getGroupManagers("Sales", true)],
		[
			"getAvailableGroupsForResource",
			() => getAvailableGroupsForResource("PROJECT", "p1", "", 20, 0),
		],
	])("%s rejects with the request's own error", async (_name, read) => {
		const error = new Error("Forbidden");
		vi.mocked(get).mockRejectedValue(error);

		await expect(read()).rejects.toBe(error);
		await expect(read()).rejects.toThrow(/^Forbidden$/);
	});

	it.each([
		["addTeam", () => addTeam("Sales", "", true)],
		["editTeam", () => editTeam("Sales", "", "Sales", "CUSTOM")],
		[
			"addGroupManager",
			() => addGroupManager("Sales", "NATIVE", "a", true),
		],
	])("%s rejects with the request's own error", async (_name, write) => {
		const error = new Error("Forbidden");
		vi.mocked(post).mockRejectedValue(error);

		await expect(write()).rejects.toBe(error);
	});
});
