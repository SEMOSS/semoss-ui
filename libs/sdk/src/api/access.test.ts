import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "../utility/fetch";
import {
	getEffectivePermissions,
	getMyUsageLimitPath,
	getMyUsageLimitPaths,
	getPermissionsToCopy,
	getResourcePermissions,
	getTeamPeople,
	getUsageLimitPath,
	type PermissionBatch,
	readModelUsageLimit,
	savePermissionBatches,
	validatePermissionBatches,
} from "./access";

vi.mock("../utility/fetch", async (importOriginal) => ({
	...(await importOriginal<typeof import("../utility/fetch")>()),
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
	target: { resourceType: "PROJECT", id: "p1" },
	changes: [
		{
			action: "ADD",
			subject: { category: "USER", id: "ada", type: "NATIVE" },
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
						category: "USER",
						id: "ada",
						type: "NATIVE",
						name: "Ada",
						email: "ada@example.com",
					},
					access: {
						level: "OWNER",
						endDate: "2026-12-31T00:00Z",
						usageLimit: {
							unlimited: false,
							rules: [
								{
									metric: "TOKENS",
									amount: 100,
									window: "DAY",
									counts: "EACH_PERSON",
								},
								{ metric: "NOPE", amount: 5, window: "DAY" },
							],
						},
					},
				},
				{ subject: { id: "nolevel", type: "NATIVE" }, access: {} },
				{ subject: { type: "NATIVE" }, access: { level: "EDIT" } },
			],
			teams: [
				{
					subject: { category: "TEAM", id: "Sales", type: "CUSTOM" },
					access: { level: "READ_ONLY" },
				},
			],
			allowedPermissionChanges: {
				canChangePeople: true,
				canChangeTeams: "yes",
			},
		});

		const access = await getResourcePermissions({
			resourceType: "ENGINE",
			id: "e1",
		});

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getPermissions",
		);
		expect(url.searchParams.get("resourceType")).toBe("ENGINE");
		expect(url.searchParams.get("id")).toBe("e1");
		expect(access.people).toEqual([
			{
				subject: {
					category: "USER",
					id: "ada",
					type: "NATIVE",
					name: "Ada",
					email: "ada@example.com",
				},
				access: {
					level: "OWNER",
					endDate: "2026-12-31T00:00Z",
					usageLimit: {
						unlimited: false,
						rules: [
							{
								metric: "TOKENS",
								amount: 100,
								window: "DAY",
								counts: "EACH_PERSON",
							},
						],
					},
				},
			},
		]);
		expect(access.teams).toHaveLength(1);
		expect(access.teams[0].subject).toEqual({
			category: "TEAM",
			id: "Sales",
			type: "CUSTOM",
		});
		expect(access.allowedPermissionChanges).toEqual({
			canChangePeople: true,
			canGiveAuthorAccess: false,
			canChangeTeams: false,
			addsAreAdminOnly: false,
			limitLevels: [],
			canChangeModelLimits: false,
		});
		expect(access.publicUse).toBeNull();
		expect(access.modelTotal).toBeNull();
		expect(access.costLimitsAvailable).toBe(false);
		expect(access.price).toBeNull();
	});

	it("reads a model's public use, total, prices and the levels whose limits can change", async () => {
		answerGet({
			people: [],
			teams: [],
			allowedPermissionChanges: {
				canChangePeople: true,
				limitLevels: ["READ_ONLY", "NOPE"],
				canChangeModelLimits: true,
			},
			publicUse: {
				isPublic: false,
				usageLimit: {
					unlimited: false,
					rules: [
						{
							metric: "COST",
							amount: 2000000,
							window: "DAY",
							counts: "EACH_PERSON",
						},
					],
				},
			},
			modelTotal: { usageLimit: { unlimited: false, rules: [] } },
			costLimitsAvailable: true,
			price: { servingProvider: "openai", input: 2.5, output: 10 },
		});

		const access = await getResourcePermissions({
			resourceType: "ENGINE",
			id: "e1",
		});

		expect(access.allowedPermissionChanges.limitLevels).toEqual([
			"READ_ONLY",
		]);
		expect(access.allowedPermissionChanges.canChangeModelLimits).toBe(true);
		expect(access.publicUse).toEqual({
			isPublic: false,
			usageLimit: {
				unlimited: false,
				rules: [
					{
						metric: "COST",
						amount: 2000000,
						window: "DAY",
						counts: "EACH_PERSON",
					},
				],
			},
		});
		// a limit with no rules is no limit defined
		expect(access.modelTotal).toEqual({ usageLimit: null });
		expect(access.costLimitsAvailable).toBe(true);
		expect(access.price).toEqual({
			servingProvider: "openai",
			modelId: null,
			input: 2.5,
			output: 10,
			cache_read: null,
			cache_write: null,
			reasoning: null,
		});
	});

	it("fails when the response has no allowed changes", async () => {
		answerGet({ people: [], teams: [] });
		await expect(
			getResourcePermissions({ resourceType: "PROJECT", id: "p1" }),
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
				target: { resourceType: "PROJECT", id: "p1" },
				changes: [
					{ index: 0, allowed: false, reason: "Already has access" },
				],
			},
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
				target: { resourceType: "PROJECT", id: "p1" },
				reason: null,
				changes: [
					{ index: 0, allowed: false, reason: "Already has access" },
				],
			},
		]);
	});

	it("fails rather than leave out a result, since results match batches by position", async () => {
		answerPost([
			{ target: { resourceType: "NOPE", id: "x" }, changes: [] },
		]);
		await expect(validatePermissionBatches([BATCH])).rejects.toThrow(
			"a batch has no target",
		);

		answerPost([
			{
				target: { resourceType: "PROJECT", id: "p1" },
				changes: [{ allowed: true }],
			},
		]);
		await expect(validatePermissionBatches([BATCH])).rejects.toThrow(
			"a change has no index",
		);

		answerPost([]);
		await expect(validatePermissionBatches([BATCH])).rejects.toThrow(
			"not one result per batch",
		);
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
			{ resourceType: "TEAM", id: "Sales & Ops" },
			{ resourceType: "PROJECT", id: "p1" },
		);

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getPermissionsToCopy",
		);
		expect(url.searchParams.get("sourceResourceType")).toBe("TEAM");
		expect(url.searchParams.get("sourceId")).toBe("Sales & Ops");
		expect(url.searchParams.get("targetResourceType")).toBe("PROJECT");
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
							sourceType: "TEAM",
							id: "Sales",
							type: "CUSTOM",
							level: "EDIT",
						},
						{
							sourceType: "DIRECT",
							level: "READ_ONLY",
							endDate: "2026-12-31T00:00Z",
						},
						{ sourceType: "TEAM", level: "EDIT" },
					],
				},
				{
					subject: { id: "nosources", type: "NATIVE" },
					level: "EDIT",
					sources: [],
				},
				{
					subject: { id: "nolevel", type: "NATIVE" },
					sources: [{ sourceType: "DIRECT", level: "EDIT" }],
				},
			],
			unlistedTeams: [
				{ id: "Engineering", type: "MICROSOFT", level: "READ_ONLY" },
				{ id: "Broken" },
			],
		});

		const access = await getEffectivePermissions({
			resourceType: "PROJECT",
			id: "p1",
		});

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getEffectivePermissions",
		);
		expect(url.searchParams.get("resourceType")).toBe("PROJECT");
		expect(url.searchParams.get("id")).toBe("p1");
		expect(access.people).toHaveLength(1);
		expect(access.people[0].sources).toEqual([
			{
				sourceType: "TEAM",
				id: "Sales",
				type: "CUSTOM",
				level: "EDIT",
				endDate: null,
			},
			{
				sourceType: "DIRECT",
				level: "READ_ONLY",
				endDate: "2026-12-31T00:00Z",
			},
		]);
		expect(access.unlistedTeams).toEqual([
			{
				id: "Engineering",
				type: "MICROSOFT",
				level: "READ_ONLY",
				usageLimit: null,
			},
		]);
		expect(access.people[0].usage).toBeNull();
		expect(access.publicUse).toBeNull();
		expect(access.ceilings).toEqual([]);
	});

	it("reads which limit each person is billed to on a model", async () => {
		const shared = {
			metric: "COST",
			amount: 100000000,
			window: "DAY",
			counts: "SHARED",
		};
		answerGet({
			people: [
				{
					subject: { id: "eli", type: "NATIVE" },
					level: "READ_ONLY",
					sources: [
						{
							sourceType: "TEAM",
							id: "Ops",
							type: "CUSTOM",
							level: "READ_ONLY",
						},
					],
					usage: {
						billedTo: {
							limitType: "TEAM",
							id: "Ops",
							type: "CUSTOM",
						},
						unlimited: false,
						rules: [shared],
						nextTeams: [
							{ id: "Data", type: "CUSTOM", rules: [shared] },
							{ id: "Broken" },
						],
						notApplied: [
							{ limitType: "PUBLIC", reason: "TEAM_WINS" },
							{ limitType: "TEAM" },
							{ limitType: "MODEL_TOTAL", reason: "TEAM_WINS" },
							{ limitType: "UNKNOWN", reason: "TEAM_WINS" },
						],
					},
				},
				{
					subject: { id: "lee", type: "NATIVE" },
					level: "READ_ONLY",
					sources: [{ sourceType: "DIRECT", level: "READ_ONLY" }],
					usage: { billedTo: null, unlimited: false, rules: [] },
				},
			],
			unlistedTeams: [
				{
					id: "Engineering",
					type: "MICROSOFT",
					level: "READ_ONLY",
					usageLimit: { unlimited: true },
				},
			],
			publicUse: { isPublic: true, usageLimit: null },
			ceilings: [
				{ limitType: "MODEL_TOTAL", usageLimit: { rules: [shared] } },
				{ limitType: "APP" },
			],
		});

		const access = await getEffectivePermissions({
			resourceType: "ENGINE",
			id: "m1",
		});

		expect(access.people[0].usage).toEqual({
			billedTo: { limitType: "TEAM", id: "Ops", type: "CUSTOM" },
			unlimited: false,
			rules: [shared],
			nextTeams: [
				{
					id: "Data",
					type: "CUSTOM",
					unlimited: false,
					rules: [shared],
				},
			],
			notApplied: [
				{
					limitType: "PUBLIC",
					id: null,
					type: null,
					reason: "TEAM_WINS",
				},
			],
		});
		expect(access.people[1].usage?.billedTo).toBeNull();
		expect(access.unlistedTeams[0].usageLimit).toEqual({
			unlimited: true,
			rules: [],
		});
		expect(access.publicUse).toEqual({ isPublic: true, usageLimit: null });
		expect(access.ceilings).toEqual([
			{
				limitType: "MODEL_TOTAL",
				usageLimit: { unlimited: false, rules: [shared] },
			},
		]);
	});
});

describe("readModelUsageLimit", () => {
	it("reads a limit from an object or a JSON string, and no rules as no limit defined", () => {
		const rule = {
			metric: "TOKENS",
			amount: 40000,
			window: "MINUTE",
			counts: "EACH_PERSON",
		};
		expect(
			readModelUsageLimit(
				JSON.stringify({ unlimited: false, rules: [rule] }),
			),
		).toEqual({ unlimited: false, rules: [rule] });
		expect(readModelUsageLimit({ unlimited: true, rules: [rule] })).toEqual(
			{
				unlimited: true,
				rules: [],
			},
		);
		expect(readModelUsageLimit({ unlimited: false, rules: [] })).toBeNull();
		expect(
			readModelUsageLimit({
				rules: [{ metric: "TOKENS", window: "DAY", counts: "SHARED" }],
			}),
		).toBeNull();
		expect(readModelUsageLimit("not json")).toBeNull();
		expect(readModelUsageLimit(null)).toBeNull();
	});

	it("keeps a window length above 1 on a minute or hour window, and leaves out the rest", () => {
		const rule = {
			metric: "TOKENS",
			amount: 100000,
			counts: "EACH_PERSON",
		};
		expect(
			readModelUsageLimit({
				unlimited: false,
				rules: [
					{ ...rule, window: "MINUTE", windowLength: 10 },
					{ ...rule, window: "HOUR", windowLength: 6 },
					{ ...rule, window: "HOUR", windowLength: 1 },
					{ ...rule, window: "MINUTE", windowLength: null },
					{ ...rule, window: "DAY", windowLength: 3 },
					{ ...rule, window: "MINUTE", windowLength: 2.5 },
				],
			})?.rules,
		).toEqual([
			{ ...rule, window: "MINUTE", windowLength: 10 },
			{ ...rule, window: "HOUR", windowLength: 6 },
			{ ...rule, window: "HOUR" },
			{ ...rule, window: "MINUTE" },
			{ ...rule, window: "DAY" },
			{ ...rule, window: "MINUTE" },
		]);
	});
});

describe("getUsageLimitPath and getMyUsageLimitPath", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const PATH = {
		engineId: "m1",
		person: { id: "eli", type: "NATIVE" },
		billedLimitType: "TEAM",
		ceilings: [
			{
				layer: "CEILING",
				limitType: "MODEL_TOTAL",
				state: "CHECKED",
				unlimited: false,
				rules: [
					{
						metric: "COST",
						amount: 2000000000,
						window: "MONTH",
						counts: "SHARED",
						used: 1240000000,
						resetsAt: "2026-11-01T00:00:00Z",
					},
				],
			},
		],
		steps: [
			// the backend leaves out null and empty fields
			{
				layer: "BILLED",
				limitType: "DIRECT",
				state: "NOT_DEFINED",
				reason: "NO_GRANT",
			},
			{
				layer: "BILLED",
				limitType: "TEAM",
				id: "Data",
				type: "CUSTOM",
				state: "BILLED",
				accessSince: "2026-04-01T00:00:00Z",
				unlimited: false,
				rules: [],
				teamTotal: { unlimited: true, rules: [] },
			},
			{ layer: "BILLED", limitType: "APP", state: "CHECKED" },
		],
	};

	it("reads a person's path through the model's permission batch endpoint", async () => {
		answerGet(PATH);

		const path = await getUsageLimitPath("m1", {
			id: "eli",
			type: "NATIVE",
		});

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getUsageLimitPath",
		);
		expect(url.searchParams.get("engineId")).toBe("m1");
		expect(url.searchParams.get("userId")).toBe("eli");
		expect(url.searchParams.get("userType")).toBe("NATIVE");
		expect(path.billedLimitType).toBe("TEAM");
		expect(path.ceilings[0].rules[0]).toEqual({
			metric: "COST",
			amount: 2000000000,
			window: "MONTH",
			counts: "SHARED",
			used: 1240000000,
			resetsAt: "2026-11-01T00:00:00Z",
		});
		// a step of a limit type the view does not know is left out
		expect(path.steps.map((step) => step.limitType)).toEqual([
			"DIRECT",
			"TEAM",
		]);
		expect(path.steps[0]).toEqual({
			layer: "BILLED",
			limitType: "DIRECT",
			id: null,
			type: null,
			state: "NOT_DEFINED",
			reason: "NO_GRANT",
			accessSince: null,
			unlimited: false,
			rules: [],
			rulesHidden: false,
			teamTotal: null,
		});
		expect(path.steps[1]).toMatchObject({
			id: "Data",
			accessSince: "2026-04-01T00:00:00Z",
			teamTotal: { unlimited: true, rules: [] },
		});
	});

	it("reads steps whose rules or team total the backend hides", async () => {
		answerGet({
			...PATH,
			steps: [
				{
					layer: "BILLED",
					limitType: "TEAM",
					id: "Data",
					type: "CUSTOM",
					state: "NEXT",
					unlimited: false,
					rules: [
						{
							metric: "TOKENS",
							amount: 1000,
							window: "DAY",
							counts: "SHARED",
							used: 10,
						},
					],
				},
				{
					layer: "BILLED",
					limitType: "ALL_MODELS",
					state: "BILLED",
					rulesHidden: true,
				},
				{
					layer: "BILLED",
					limitType: "PLATFORM",
					state: "NOT_REACHED",
				},
			],
		});

		const path = await getUsageLimitPath("m1", {
			id: "eli",
			type: "NATIVE",
		});

		expect(path.steps[0]).toMatchObject({
			limitType: "TEAM",
			rulesHidden: false,
			teamTotal: null,
		});
		expect(path.steps[0]?.rules).toHaveLength(1);
		expect(path.steps[1]).toMatchObject({
			limitType: "ALL_MODELS",
			state: "BILLED",
			rules: [],
			rulesHidden: true,
			teamTotal: null,
		});
		expect(path.steps[2]).toMatchObject({
			limitType: "PLATFORM",
			rules: [],
			rulesHidden: false,
		});
	});

	it("uses the admin endpoint in admin mode", async () => {
		answerGet(PATH);

		await getUsageLimitPath("m1", { id: "eli", type: "NATIVE" }, true);

		expect(requestedUrl().pathname).toContain(
			"/api/auth/admin/permissionBatch/getUsageLimitPath",
		);
	});

	it("reads the signed in person's own path", async () => {
		answerGet(PATH);

		const path = await getMyUsageLimitPath("m1");

		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/permissionBatch/getMyUsageLimitPath",
		);
		expect(url.searchParams.get("engineId")).toBe("m1");
		expect(path.person).toEqual({ id: "eli", type: "NATIVE" });
	});

	it("fails when the response names no person", async () => {
		answerGet({ engineId: "m1", steps: [] });
		await expect(getMyUsageLimitPath("m1")).rejects.toThrow(
			"No Response to read your limit on this model",
		);
	});

	it("reads the signed in person's path on every model, leaving out one that cannot be read", async () => {
		answerGet({
			models: [
				{
					engineId: "m1",
					name: "GPT-5",
					subtype: "OPEN_AI",
					path: PATH,
				},
				{ engineId: "m2", name: "Broken", path: { engineId: "m2" } },
				{ engineId: "m3", path: { ...PATH, engineId: "m3" } },
			],
		});

		const models = await getMyUsageLimitPaths();

		expect(requestedUrl().pathname).toContain(
			"/api/auth/permissionBatch/getMyUsageLimitPaths",
		);
		expect(models.map((model) => model.engineId)).toEqual(["m1", "m3"]);
		expect(models[0]).toMatchObject({ name: "GPT-5", subtype: "OPEN_AI" });
		expect(models[1]).toMatchObject({ name: "m3", subtype: null });
		expect(models[0]?.path.billedLimitType).toBe("TEAM");
	});

	it("fails when the response has no list of models", async () => {
		answerGet({});
		await expect(getMyUsageLimitPaths()).rejects.toThrow(
			"No Response to read your limits on your models",
		);
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
		expect(url.searchParams.get("resourceType")).toBe("TEAM");
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
		expect(url.searchParams.get("resourceType")).toBe("TEAM_MANAGERS");
		expect(managers.people.map((manager) => manager.id)).toEqual(["grace"]);
		expect(managers.canChange).toBe(false);
	});
});
