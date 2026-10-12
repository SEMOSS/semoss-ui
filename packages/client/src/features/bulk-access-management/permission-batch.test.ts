import { describe, expect, it } from "vitest";
import type {
	AccessPerson,
	CurrentAccess,
	PermissionsToCopy,
	ResourcePermissions,
} from "@semoss/sdk";
import {
	type BatchEdit,
	buildEntries,
	describeChangeDetail,
	describeModelLimit,
	getEntryStatus,
	getSubjectKey,
	isSameGrant,
	matchesSearch,
	mergeCopiedAccess,
	toChanges,
	withEdit,
} from "./permission-batch";

const person = (id: string, name: string | null = null): AccessPerson => ({
	kind: "USER",
	id,
	type: "NATIVE",
	name,
	email: `${id}@example.com`,
});

const ADA = person("ada", "Ada Lovelace");
const GRACE = person("grace", "Grace Hopper");
const ALAN = person("alan");

const TEAM: CurrentAccess = {
	subject: { kind: "TEAM", id: "Sales", type: "CUSTOM" },
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
	},
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
				{ level: "EDIT", maxTokens: 10 },
				{ level: "EDIT", maxTokens: 20 },
			),
		).toBe(false);
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
					subject: { kind: "USER", id: "ada", type: "NATIVE" },
				},
			},
			{
				key: "USER:grace",
				change: {
					action: "CHANGE",
					subject: { kind: "USER", id: "grace", type: "NATIVE" },
					to: { level: "OWNER" },
				},
			},
			{
				key: "USER:alan",
				change: {
					action: "ADD",
					subject: { kind: "USER", id: "alan", type: "NATIVE" },
					to: { level: "READ_ONLY" },
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

describe("mergeCopiedAccess", () => {
	const rows: PermissionsToCopy[] = [
		{
			subject: ALAN,
			source: {
				level: "EDIT",
				maxTokens: 50,
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
					maxTokens: 50,
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

describe("describeModelLimit", () => {
	it("says the limit and how often it resets", () => {
		expect(
			describeModelLimit({
				level: "READ_ONLY",
				usageRestriction: "token",
				maxTokens: 10000,
				usageFrequency: "DAY",
			}),
		).toBe(`${(10000).toLocaleString()} tokens a day`);
		expect(
			describeModelLimit({
				level: "READ_ONLY",
				usageRestriction: "COMPUTE",
				maxResponseTime: 500,
				usageFrequency: "ALL_TIME",
			}),
		).toBe("500 ms in total");
	});

	it("says there is no limit when none is set", () => {
		expect(describeModelLimit(null)).toBe("No limit");
		expect(describeModelLimit({ level: "EDIT" })).toBe("No limit");
		expect(
			describeModelLimit({ level: "EDIT", usageRestriction: "TOKEN" }),
		).toBe("No limit");
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

	it("names the limit when only a model's limits change", () => {
		expect(
			describeChangeDetail(
				{ level: "EDIT" },
				{ level: "EDIT", usageRestriction: "TOKEN", maxTokens: 100 },
			),
		).toBe("Editor, 100 tokens");
		expect(
			describeChangeDetail(
				{ level: "EDIT", usageRestriction: "TOKEN", maxTokens: 100 },
				{ level: "EDIT" },
			),
		).toBe("Editor, no usage limit");
	});
});
