import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "../utility";
import {
	getEffectivePermissions,
	getPermissionsToCopy,
	getResourcePermissions,
	getTeamPeople,
	type PermissionBatch,
	savePermissionBatches,
	validatePermissionBatches,
} from "./access";

vi.mock("../utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("../utility")>()),
	get: vi.fn(),
	post: vi.fn(),
}));

const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

/** Makes the next read answer with data */
const answerGet = (data: unknown) =>
	mockGet.mockResolvedValue({ data } as unknown as Awaited<
		ReturnType<typeof get>
	>);

/** Makes the next post answer with data */
const answerPost = (data: unknown) =>
	mockPost.mockResolvedValue({ data } as unknown as Awaited<
		ReturnType<typeof post>
	>);

/** The URL of the only read made */
const requestedUrl = (): URL => {
	expect(mockGet).toHaveBeenCalledTimes(1);
	return new URL(mockGet.mock.calls[0][0], "http://localhost");
};

const BATCH: PermissionBatch = {
	target: { kind: "PROJECT", id: "p1" },
	changes: [
		{
			action: "ADD",
			subject: { kind: "USER", id: "ada", type: "NATIVE" },
			to: { level: "EDIT", endDate: "2026-12-31T00:00Z" },
		},
	],
};

describe("getResourcePermissions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads a resource's people, teams and allowed changes", async () => {
		answerGet({
			people: [
				{
					subject: {
						kind: "USER",
						id: "ada",
						type: "NATIVE",
						name: "Ada",
						email: "ada@example.com",
					},
					access: {
						level: "OWNER",
						endDate: "2026-12-31T00:00Z",
						maxTokens: 100,
					},
				},
				{ subject: { id: "nolevel", type: "NATIVE" }, access: {} },
				{ subject: { type: "NATIVE" }, access: { level: "EDIT" } },
			],
			teams: [
				{
					subject: { kind: "TEAM", id: "Sales", type: "CUSTOM" },
					access: { level: "READ_ONLY" },
				},
			],
			allowedPermissionChanges: {
				canChangePeople: true,
				canChangeTeams: "yes",
			},
		});

		const access = await getResourcePermissions({
			kind: "ENGINE",
			id: "e1",
		});

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getPermissions",
		);
		expect(url.searchParams.get("kind")).toBe("ENGINE");
		expect(url.searchParams.get("id")).toBe("e1");
		expect(access.people).toEqual([
			{
				subject: {
					kind: "USER",
					id: "ada",
					type: "NATIVE",
					name: "Ada",
					email: "ada@example.com",
				},
				access: {
					level: "OWNER",
					endDate: "2026-12-31T00:00Z",
					usageRestriction: null,
					usageFrequency: null,
					maxTokens: 100,
					maxResponseTime: null,
				},
			},
		]);
		expect(access.teams).toHaveLength(1);
		expect(access.teams[0].subject).toEqual({
			kind: "TEAM",
			id: "Sales",
			type: "CUSTOM",
		});
		expect(access.allowedPermissionChanges).toEqual({
			canChangePeople: true,
			canGiveAuthorAccess: false,
			canChangeTeams: false,
			addsAreAdminOnly: false,
		});
	});

	it("fails when the response has no allowed changes", async () => {
		answerGet({ people: [], teams: [] });
		await expect(
			getResourcePermissions({ kind: "PROJECT", id: "p1" }),
		).rejects.toThrow("No Response to read the permissions");
	});
});

describe("admin mode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("uses the admin endpoints when asked, and the user's otherwise", async () => {
		answerPost({ targets: 1, changes: 1 });

		await savePermissionBatches([BATCH], true);
		await savePermissionBatches([BATCH]);

		expect(mockPost.mock.calls[0][0]).toContain(
			"/api/auth/admin/permissionBatch/savePermissionBatches",
		);
		expect(mockPost.mock.calls[1][0]).not.toContain("/admin/");
	});
});

describe("validatePermissionBatches and savePermissionBatches", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("posts the batches and reads each change's validation", async () => {
		answerPost([
			{
				target: { kind: "PROJECT", id: "p1" },
				changes: [
					{ index: 0, allowed: false, reason: "Already has access" },
				],
			},
			{ target: { kind: "NOPE", id: "x" }, changes: [] },
		]);

		const validations = await validatePermissionBatches([BATCH]);

		expect(mockPost).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining(
				"/api/auth/permissionBatch/validatePermissionBatches",
			),
			{ batches: [BATCH] },
			{},
		);
		expect(validations).toEqual([
			{
				target: { kind: "PROJECT", id: "p1" },
				reason: null,
				changes: [
					{ index: 0, allowed: false, reason: "Already has access" },
				],
			},
		]);
	});

	it("reads how much was saved", async () => {
		answerPost({ targets: 2, changes: 7 });

		await expect(savePermissionBatches([BATCH])).resolves.toEqual({
			targets: 2,
			changes: 7,
		});
		expect(mockPost.mock.calls[0][0]).toContain(
			"/api/auth/permissionBatch/savePermissionBatches",
		);
	});

	it("fails when the save has no answer", async () => {
		answerPost(null);
		await expect(savePermissionBatches([BATCH])).rejects.toThrow(
			"No Response to save the permission batch",
		);
	});
});

describe("getPermissionsToCopy", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sends the source and target and reads each person", async () => {
		answerGet([
			{
				subject: { id: "ada", type: "NATIVE", name: "Ada" },
				source: { level: "EDIT" },
				target: null,
				inTarget: false,
			},
			{ subject: { id: "nobody" }, source: null, inTarget: true },
		]);

		const rows = await getPermissionsToCopy(
			{ kind: "TEAM", id: "Sales & Ops" },
			{ kind: "PROJECT", id: "p1" },
		);

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getPermissionsToCopy",
		);
		expect(url.searchParams.get("sourceKind")).toBe("TEAM");
		expect(url.searchParams.get("sourceId")).toBe("Sales & Ops");
		expect(url.searchParams.get("targetKind")).toBe("PROJECT");
		expect(url.searchParams.get("targetId")).toBe("p1");
		expect(rows).toHaveLength(1);
		expect(rows[0].subject.name).toBe("Ada");
		expect(rows[0].source?.level).toBe("EDIT");
		expect(rows[0].target).toBeNull();
		expect(rows[0].inTarget).toBe(false);
	});
});

describe("getEffectivePermissions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads one row per person with each source of their access", async () => {
		answerGet({
			people: [
				{
					subject: { id: "ada", type: "NATIVE", name: "Ada" },
					level: "EDIT",
					sources: [
						{
							kind: "TEAM",
							id: "Sales",
							type: "CUSTOM",
							level: "EDIT",
						},
						{
							kind: "DIRECT",
							level: "READ_ONLY",
							endDate: "2026-12-31T00:00Z",
						},
						{ kind: "TEAM", level: "EDIT" },
					],
				},
				{
					subject: { id: "nosources", type: "NATIVE" },
					level: "EDIT",
					sources: [],
				},
				{
					subject: { id: "nolevel", type: "NATIVE" },
					sources: [{ kind: "DIRECT", level: "EDIT" }],
				},
			],
			unlistedTeams: [
				{ id: "Engineering", type: "MICROSOFT", level: "READ_ONLY" },
				{ id: "Broken" },
			],
		});

		const access = await getEffectivePermissions({
			kind: "PROJECT",
			id: "p1",
		});

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getEffectivePermissions",
		);
		expect(url.searchParams.get("kind")).toBe("PROJECT");
		expect(url.searchParams.get("id")).toBe("p1");
		expect(access.people).toHaveLength(1);
		expect(access.people[0].sources).toEqual([
			{
				kind: "TEAM",
				id: "Sales",
				type: "CUSTOM",
				level: "EDIT",
				endDate: null,
			},
			{
				kind: "DIRECT",
				level: "READ_ONLY",
				endDate: "2026-12-31T00:00Z",
			},
		]);
		expect(access.unlistedTeams).toEqual([
			{ id: "Engineering", type: "MICROSOFT", level: "READ_ONLY" },
		]);
	});
});

describe("getTeamPeople", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads a team's members through the permissions read", async () => {
		answerGet({
			people: [
				{
					subject: { id: "ada", type: "NATIVE", name: "Ada" },
					access: null,
				},
				{ subject: { id: "nobody" }, access: null },
			],
			teams: [],
			allowedPermissionChanges: { canChangePeople: true },
		});

		const members = await getTeamPeople("Sales", "MEMBERS");

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getPermissions",
		);
		expect(url.searchParams.get("kind")).toBe("TEAM");
		expect(url.searchParams.get("id")).toBe("Sales");
		expect(members.people.map((member) => member.id)).toEqual(["ada"]);
		expect(members.canChange).toBe(true);
	});

	it("reads a team's managers, in admin mode when asked", async () => {
		answerGet({
			people: [
				{
					subject: { id: "grace", type: "NATIVE", name: "Grace" },
					access: null,
				},
			],
			teams: [],
			allowedPermissionChanges: { canChangePeople: false },
		});

		const managers = await getTeamPeople("Sales", "MANAGERS", true);

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/admin/permissionBatch/getPermissions",
		);
		expect(url.searchParams.get("kind")).toBe("TEAM_MANAGERS");
		expect(managers.people.map((manager) => manager.id)).toEqual(["grace"]);
		expect(managers.canChange).toBe(false);
	});
});
