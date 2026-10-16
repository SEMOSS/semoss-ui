import { describe, expect, it } from "vitest";
import type {
	AccessPerson,
	CurrentAccess,
	ModelUsageLimit,
	PermissionAllowedChanges,
	PermissionsToCopy,
	ResourcePermissions,
} from "@semoss/sdk";
import {
	OWNERS_END_LIMITED_ACCESS_REASON,
	OWNERS_ONLY_LIMIT_REASON,
} from "@semoss/shared";
import {
	type BatchEdit,
	buildEntries,
	buildModelLimitEntries,
	describeChangeDetail,
	describeModelLimitChange,
	getEntryStatus,
	getLimitBlockReason,
	getRemoveBlockReason,
	getSubjectKey,
	isSameGrant,
	type ModelLimitCategory,
	matchesSearch,
	mergeCopiedAccess,
	toChanges,
	toModelLimitChanges,
	withEdit,
} from "./permission-batch";

/** A limit of one each-person token rule */
const tokensADay = (amount: number): ModelUsageLimit => ({
	unlimited: false,
	rules: [
		{
			metric: "TOKENS",
			amount,
			window: "DAY",
			counts: "EACH_PERSON",
		},
	],
});

/** A limit of one each-person cost rule, in millionths of a dollar */
const dollarsADay = (micros: number): ModelUsageLimit => ({
	unlimited: false,
	rules: [
		{
			metric: "COST",
			amount: micros,
			window: "DAY",
			counts: "EACH_PERSON",
		},
	],
});

const person = (id: string, name: string | null = null): AccessPerson => ({
	category: "USER",
	id,
	type: "NATIVE",
	name,
	email: `${id}@example.com`,
});

const ADA = person("ada", "Ada Lovelace");
const GRACE = person("grace", "Grace Hopper");
const ALAN = person("alan");

const TEAM: CurrentAccess = {
	subject: { category: "TEAM", id: "Sales", type: "CUSTOM" },
	access: { level: "READ_ONLY" },
};

const ACCESS: ResourcePermissions = {
	people: [
		{ subject: ADA, access: { level: "OWNER" } },
		{
			subject: GRACE,
			access: { level: "EDIT", endDate: "2026-12-31T00:00Z" },
		},
	],
	teams: [TEAM],
	allowedPermissionChanges: {
		canChangePeople: true,
		canGiveAuthorAccess: true,
		canChangeTeams: true,
		addsAreAdminOnly: false,
		limitLevels: ["READ_ONLY", "EDIT", "OWNER"],
		canChangeModelLimits: true,
	},
	publicUse: null,
	modelTotal: null,
	costLimitsAvailable: false,
	price: null,
};

const NO_EDITS: ReadonlyMap<string, BatchEdit> = new Map();

/** The edit giving a person a level */
const editFor = (
	subject: AccessPerson,
	level: "OWNER" | "EDIT" | "READ_ONLY" | null,
): BatchEdit => ({
	subject,
	person: subject,
	staged: level ? { level } : null,
	note: null,
});

describe("getSubjectKey", () => {
	it("keys people by id and teams by type and name", () => {
		expect(getSubjectKey(ADA)).toBe("USER:ada");
		expect(getSubjectKey({ ...ADA, type: "MICROSOFT" })).toBe("USER:ada");
		expect(getSubjectKey(TEAM.subject)).toBe("TEAM:CUSTOM:Sales");
	});
});

describe("isSameGrant", () => {
	it("compares the level, end date and model limits, with missing values as none", () => {
		expect(
			isSameGrant({ level: "EDIT" }, { level: "EDIT", endDate: null }),
		).toBe(true);
		expect(isSameGrant({ level: "EDIT" }, { level: "READ_ONLY" })).toBe(
			false,
		);
		expect(
			isSameGrant(
				{ level: "EDIT", usageLimit: tokensADay(10) },
				{ level: "EDIT", usageLimit: tokensADay(20) },
			),
		).toBe(false);
		expect(
			isSameGrant(
				{ level: "EDIT", usageLimit: null },
				{ level: "EDIT", usageLimit: { unlimited: false, rules: [] } },
			),
		).toBe(true);
		expect(
			isSameGrant(
				{ level: "EDIT", endDate: "2026-12-31T00:00Z" },
				{ level: "EDIT" },
			),
		).toBe(false);
	});
});

describe("buildEntries and toChanges", () => {
	it("lists everyone with access, unchanged, before the batch has edits", () => {
		const entries = buildEntries(ACCESS, NO_EDITS);

		expect(entries.map((entry) => entry.key)).toEqual([
			"USER:ada",
			"USER:grace",
			"TEAM:CUSTOM:Sales",
		]);
		expect(entries.map(getEntryStatus)).toEqual([
			"UNCHANGED",
			"UNCHANGED",
			"UNCHANGED",
		]);
		expect(toChanges(entries)).toEqual([]);
		expect(buildEntries(null, NO_EDITS)).toEqual([]);
	});

	it("turns edits into additions, changes and removals", () => {
		let edits = withEdit(NO_EDITS, editFor(ALAN, "READ_ONLY"), null);
		edits = withEdit(edits, editFor(GRACE, "OWNER"), { level: "EDIT" });
		edits = withEdit(edits, editFor(ADA, null), { level: "OWNER" });

		const entries = buildEntries(ACCESS, edits);

		expect(entries.map(getEntryStatus)).toEqual([
			"REMOVED",
			"CHANGED",
			"UNCHANGED",
			"ADDED",
		]);
		expect(toChanges(entries)).toEqual([
			{
				key: "USER:ada",
				change: {
					action: "REMOVE",
					subject: { category: "USER", id: "ada", type: "NATIVE" },
				},
			},
			{
				key: "USER:grace",
				change: {
					action: "CHANGE",
					subject: { category: "USER", id: "grace", type: "NATIVE" },
					to: { level: "OWNER", endDate: null },
				},
			},
			{
				key: "USER:alan",
				change: {
					action: "ADD",
					subject: { category: "USER", id: "alan", type: "NATIVE" },
					to: { level: "READ_ONLY", endDate: null },
				},
			},
		]);
	});
});

describe("withEdit", () => {
	it("drops an edit that leaves the access as it is now", () => {
		const changed = withEdit(NO_EDITS, editFor(GRACE, "OWNER"), {
			level: "EDIT",
		});
		expect(changed.size).toBe(1);

		const undone = withEdit(changed, editFor(GRACE, "EDIT"), {
			level: "EDIT",
		});
		expect(undone.size).toBe(0);

		const removedAddition = withEdit(
			withEdit(NO_EDITS, editFor(ALAN, "EDIT"), null),
			editFor(ALAN, null),
			null,
		);
		expect(removedAddition.size).toBe(0);
	});
});

describe("getLimitBlockReason", () => {
	const OWNER_CHANGES = ACCESS.allowedPermissionChanges;
	/** What the backend says an editor may change on a model */
	const EDITOR_CHANGES: PermissionAllowedChanges = {
		...OWNER_CHANGES,
		canGiveAuthorAccess: false,
		limitLevels: [],
		canChangeModelLimits: false,
	};
	const entries = buildEntries(ACCESS, NO_EDITS);
	const byKey = new Map(entries.map((entry) => [entry.key, entry]));
	const grace = byKey.get("USER:grace");
	const sales = byKey.get("TEAM:CUSTOM:Sales");

	it("lets owners set every person's and team's limit", () => {
		for (const entry of entries) {
			expect(getLimitBlockReason(entry, OWNER_CHANGES)).toBeNull();
		}
	});

	it("shows editors every limit read-only, a read-only person's included", () => {
		const readOnly = buildEntries(
			ACCESS,
			withEdit(NO_EDITS, editFor(ALAN, "READ_ONLY"), null),
		).find((entry) => entry.key === "USER:alan");
		for (const entry of [grace, sales, readOnly]) {
			expect(entry && getLimitBlockReason(entry, EDITOR_CHANGES)).toBe(
				OWNERS_ONLY_LIMIT_REASON,
			);
		}
		// only owners set limits, even when a level is listed
		expect(
			grace &&
				getLimitBlockReason(grace, {
					...EDITOR_CHANGES,
					limitLevels: ["READ_ONLY", "EDIT"],
				}),
		).toBe(OWNERS_ONLY_LIMIT_REASON);
	});

	it("says why a person whose access is taken away has no limit to set", () => {
		const removed = buildEntries(
			ACCESS,
			withEdit(NO_EDITS, editFor(GRACE, null), { level: "EDIT" }),
		).find((entry) => entry.key === "USER:grace");
		expect(removed && getLimitBlockReason(removed, OWNER_CHANGES)).toBe(
			"Their access is taken away in your changes",
		);
	});
});

describe("mergeCopiedAccess", () => {
	const rows: PermissionsToCopy[] = [
		{
			subject: ALAN,
			source: {
				level: "EDIT",
				usageLimit: tokensADay(50),
				endDate: "2027-01-01T00:00Z",
			},
			target: null,
			inTarget: false,
		},
		{
			subject: GRACE,
			source: { level: "EDIT", endDate: "2026-12-31T00:00Z" },
			target: null,
			inTarget: true,
		},
		{
			subject: ADA,
			source: { level: "READ_ONLY" },
			target: null,
			inTarget: true,
		},
		{
			subject: person("nolevel"),
			source: null,
			target: null,
			inTarget: false,
		},
	];

	it("adds new people, skips the same access, and reports different access as a conflict", () => {
		const result = mergeCopiedAccess(buildEntries(ACCESS, NO_EDITS), rows, {
			note: "Copied from Finance",
			keepModelLimits: true,
		});

		expect(result.additions).toEqual([
			{
				subject: ALAN,
				person: ALAN,
				staged: {
					level: "EDIT",
					usageLimit: tokensADay(50),
					endDate: "2027-01-01T00:00Z",
				},
				note: "Copied from Finance",
			},
		]);
		expect(result.conflicts).toEqual([
			{
				key: "USER:ada",
				person: ADA,
				kept: { level: "OWNER" },
				isNew: false,
				incoming: { level: "READ_ONLY" },
				note: "Copied from Finance",
			},
		]);
	});

	it("drops model limits for a target without them and gives a team's members one level", () => {
		const withoutLimits = mergeCopiedAccess(
			buildEntries(ACCESS, NO_EDITS),
			rows,
			{
				note: "Copied from Finance",
				keepModelLimits: false,
			},
		);
		expect(withoutLimits.additions[0].staged).toEqual({
			level: "EDIT",
			endDate: "2027-01-01T00:00Z",
		});

		const fromTeam = mergeCopiedAccess(
			buildEntries(ACCESS, NO_EDITS),
			rows,
			{
				note: "Copied from the Sales team",
				level: "READ_ONLY",
				keepModelLimits: false,
			},
		);
		// the team's member without access of their own is added at the chosen level too
		expect(fromTeam.additions.map((addition) => addition.staged)).toEqual([
			{ level: "READ_ONLY", endDate: null },
			{ level: "READ_ONLY", endDate: null },
		]);
		expect(fromTeam.conflicts.map((conflict) => conflict.key)).toEqual([
			"USER:grace",
			"USER:ada",
		]);
	});

	it("gives a team's members the Add With limit on a model", () => {
		const fromTeam = mergeCopiedAccess(
			buildEntries(ACCESS, NO_EDITS),
			rows,
			{
				note: "Copied from the Sales team",
				level: "READ_ONLY",
				usageLimit: tokensADay(1000),
				keepModelLimits: true,
			},
		);
		expect(fromTeam.additions[0].staged).toEqual({
			level: "READ_ONLY",
			usageLimit: tokensADay(1000),
		});
	});

	it("leaves copied cost rules out on a model without known prices, as a conflict", () => {
		const result = mergeCopiedAccess(
			buildEntries(ACCESS, NO_EDITS),
			[
				{
					subject: ALAN,
					source: {
						level: "READ_ONLY",
						usageLimit: dollarsADay(2000000),
					},
					target: null,
					inTarget: false,
				},
			],
			{
				note: "Copied from Finance",
				keepModelLimits: true,
				costLimitsAvailable: false,
			},
		);

		expect(result.additions).toEqual([]);
		expect(result.conflicts).toEqual([
			{
				key: "USER:alan",
				person: ALAN,
				kept: null,
				isNew: true,
				incoming: { level: "READ_ONLY", usageLimit: null },
				note: "Copied from Finance, without its cost rules, since this model has no known prices",
			},
		]);
	});

	it("keeps each person's limit as it is when the user cannot set limits", () => {
		const access: ResourcePermissions = {
			...ACCESS,
			people: [
				{ subject: ADA, access: { level: "OWNER" } },
				{
					subject: GRACE,
					access: { level: "READ_ONLY", usageLimit: tokensADay(10) },
				},
			],
		};
		const copied: PermissionsToCopy[] = [
			{
				subject: ALAN,
				source: { level: "EDIT", usageLimit: tokensADay(50) },
				target: null,
				inTarget: false,
			},
			{
				subject: GRACE,
				source: { level: "EDIT", usageLimit: tokensADay(99) },
				target: null,
				inTarget: true,
			},
			{
				subject: ADA,
				source: { level: "OWNER", usageLimit: tokensADay(99) },
				target: null,
				inTarget: true,
			},
		];

		const result = mergeCopiedAccess(
			buildEntries(access, NO_EDITS),
			copied,
			{
				note: "Copied from Finance",
				keepModelLimits: true,
				canSetLimits: false,
			},
		);

		// someone new gets the level and no limit
		expect(result.additions).toEqual([
			{
				subject: ALAN,
				person: ALAN,
				staged: { level: "EDIT", endDate: null },
				note: "Copied from Finance",
			},
		]);
		// a level change carries the limit they have now; the same level is no change
		expect(result.conflicts).toEqual([
			{
				key: "USER:grace",
				person: GRACE,
				kept: { level: "READ_ONLY", usageLimit: tokensADay(10) },
				isNew: false,
				incoming: {
					level: "EDIT",
					endDate: null,
					usageLimit: tokensADay(10),
				},
				note: "Copied from Finance",
			},
		]);
	});

	it("keeps each team member's limit when a user who cannot set limits copies a team", () => {
		const access: ResourcePermissions = {
			...ACCESS,
			people: [
				{
					subject: GRACE,
					access: { level: "EDIT", usageLimit: tokensADay(10) },
				},
			],
		};

		const result = mergeCopiedAccess(
			buildEntries(access, NO_EDITS),
			[
				{
					subject: GRACE,
					source: { level: "EDIT" },
					target: null,
					inTarget: true,
				},
			],
			{
				note: "Copied from the Sales team",
				level: "EDIT",
				usageLimit: null,
				keepModelLimits: true,
				canSetLimits: false,
			},
		);

		expect(result).toEqual({ additions: [], conflicts: [] });
	});

	it("treats someone the batch takes away as a conflict", () => {
		const edits = withEdit(NO_EDITS, editFor(GRACE, null), {
			level: "EDIT",
		});

		const result = mergeCopiedAccess(buildEntries(ACCESS, edits), rows, {
			note: "Copied from Finance",
			keepModelLimits: false,
		});

		const conflict = result.conflicts.find(
			(item) => item.key === "USER:grace",
		);
		expect(conflict?.kept).toBeNull();
	});
});

describe("matchesSearch", () => {
	it("matches the name, email, id or type", () => {
		const [ada, , team] = buildEntries(ACCESS, NO_EDITS);

		expect(matchesSearch(ada, "")).toBe(true);
		expect(matchesSearch(ada, "lovelace")).toBe(true);
		expect(matchesSearch(ada, "ada@example")).toBe(true);
		expect(matchesSearch(ada, "hopper")).toBe(false);
		expect(matchesSearch(team, "custom")).toBe(true);
	});
});

describe("describeChangeDetail", () => {
	it("says what a change does to someone's access", () => {
		expect(describeChangeDetail(null, { level: "EDIT" })).toBe("Editor");
		expect(
			describeChangeDetail({ level: "READ_ONLY" }, { level: "EDIT" }),
		).toBe("Read-Only to Editor");
		expect(describeChangeDetail({ level: "OWNER" }, null)).toBe(
			"Loses Author",
		);
		expect(
			describeChangeDetail(
				{ level: "EDIT", endDate: "2026-12-31T00:00Z" },
				{ level: "EDIT" },
			),
		).toBe("Editor, no end date");
		expect(
			describeChangeDetail(null, {
				level: "EDIT",
				endDate: "2026-12-31T12:00Z",
			}),
		).toContain("Editor until ");
	});

	it("names the limit when a model's limit changes, with a level change too", () => {
		expect(
			describeChangeDetail(
				{ level: "EDIT", usageLimit: null },
				{ level: "EDIT", usageLimit: tokensADay(100) },
			),
		).toBe("Editor, usage limit 100 tokens a day");
		expect(
			describeChangeDetail(
				{ level: "EDIT", usageLimit: tokensADay(100) },
				{ level: "EDIT", usageLimit: null },
			),
		).toBe("Editor, no usage limit defined");
		expect(
			describeChangeDetail(
				{ level: "READ_ONLY", usageLimit: null },
				{ level: "EDIT", usageLimit: { unlimited: true, rules: [] } },
			),
		).toBe("Read-Only to Editor, usage limit Unlimited");
		expect(
			describeChangeDetail(null, {
				level: "READ_ONLY",
				usageLimit: tokensADay(100),
			}),
		).toBe("Read-Only, usage limit 100 tokens a day");
	});
});

describe("the model total and public use limit", () => {
	const MODEL_ACCESS: ResourcePermissions = {
		...ACCESS,
		publicUse: { isPublic: true, usageLimit: null },
		modelTotal: { usageLimit: tokensADay(5000) },
	};

	it("lists the model total, then the public use limit, and stages changes to them", () => {
		const unchanged = buildModelLimitEntries(MODEL_ACCESS, new Map());
		expect(unchanged.map((entry) => entry.key)).toEqual([
			"MODEL_LIMIT:MODEL",
			"MODEL_LIMIT:PUBLIC",
		]);
		expect(toModelLimitChanges(unchanged)).toEqual([]);
		expect(buildModelLimitEntries(ACCESS, new Map())).toEqual([]);

		const entries = buildModelLimitEntries(
			MODEL_ACCESS,
			new Map<ModelLimitCategory, ModelUsageLimit | null>([
				["PUBLIC", tokensADay(10)],
			]),
		);
		expect(toModelLimitChanges(entries)).toEqual([
			{
				key: "MODEL_LIMIT:PUBLIC",
				change: {
					action: "CHANGE",
					subject: { category: "PUBLIC" },
					to: { usageLimit: tokensADay(10) },
				},
			},
		]);
		expect(describeModelLimitChange(entries[1])).toBe(
			"10 tokens a day for each person, was No Limit Defined",
		);
	});
});

describe("toChanges", () => {
	it("sends a model grant's usage limit with its level and end date", () => {
		const edits = withEdit(
			NO_EDITS,
			{
				subject: ALAN,
				person: ALAN,
				staged: {
					level: "READ_ONLY",
					usageLimit: tokensADay(10),
				},
				note: null,
			},
			null,
		);
		const [change] = toChanges(buildEntries(ACCESS, edits));
		expect(change.change).toEqual({
			action: "ADD",
			subject: { category: "USER", id: "alan", type: "NATIVE" },
			to: {
				level: "READ_ONLY",
				endDate: null,
				usageLimit: tokensADay(10),
			},
		});
	});
});

describe("getRemoveBlockReason", () => {
	const OWNER_CHANGES = ACCESS.allowedPermissionChanges;
	/** What the backend says an editor may change on a model */
	const EDITOR_CHANGES: PermissionAllowedChanges = {
		...OWNER_CHANGES,
		canGiveAuthorAccess: false,
		limitLevels: [],
		canChangeModelLimits: false,
	};
	const limited: ResourcePermissions = {
		...ACCESS,
		people: [
			{
				subject: GRACE,
				access: { level: "EDIT", usageLimit: tokensADay(10) },
			},
			{ subject: ALAN, access: { level: "READ_ONLY" } },
		],
	};
	const byKey = new Map(
		buildEntries(limited, NO_EDITS).map((entry) => [entry.key, entry]),
	);
	const grace = byKey.get("USER:grace");
	const alan = byKey.get("USER:alan");

	it("keeps someone with a usage limit for an owner to take away", () => {
		expect(grace && getRemoveBlockReason(grace, EDITOR_CHANGES)).toBe(
			OWNERS_END_LIMITED_ACCESS_REASON,
		);
		expect(grace && getRemoveBlockReason(grace, OWNER_CHANGES)).toBeNull();
	});

	it("lets an editor take away someone with no limit defined", () => {
		expect(alan && getRemoveBlockReason(alan, EDITOR_CHANGES)).toBeNull();
	});
});
