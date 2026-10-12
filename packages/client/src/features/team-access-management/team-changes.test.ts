import { describe, expect, it } from "vitest";
import type { AccessPerson } from "@semoss/sdk";
import {
	buildTeamBatches,
	countTeamChanges,
	getTeamPersonKey,
	NO_PEOPLE_EDITS,
	NO_TEAM_EDITS,
	type TeamEdits,
	withoutPeople,
	withoutSettledChanges,
} from "./team-changes";

const person = (id: string): AccessPerson => ({
	kind: "USER",
	id,
	type: "NATIVE",
	name: `${id} name`,
	email: null,
});

const ADA = person("ada");
const GRACE = person("grace");

const MEMBER_EDITS: TeamEdits = {
	MEMBERS: {
		adds: new Map([["USER:NATIVE:ada", ADA]]),
		removals: new Set(["USER:NATIVE:grace"]),
	},
	MANAGERS: NO_PEOPLE_EDITS,
};

describe("buildTeamBatches", () => {
	it("makes nothing from no edits", () => {
		expect(
			buildTeamBatches("Sales", NO_TEAM_EDITS, {
				MEMBERS: [GRACE],
				MANAGERS: [ADA],
			}),
		).toEqual({ batches: [], roles: [], items: [] });
		expect(countTeamChanges(NO_TEAM_EDITS)).toBe(0);
	});

	it("puts the member changes in one batch for the team", () => {
		const { batches, roles, items } = buildTeamBatches(
			"Sales",
			MEMBER_EDITS,
			{
				MEMBERS: [GRACE],
				MANAGERS: [],
			},
		);

		expect(batches).toEqual([
			{
				target: { kind: "TEAM", id: "Sales" },
				changes: [
					{
						action: "ADD",
						subject: { kind: "USER", id: "ada", type: "NATIVE" },
					},
					{
						action: "REMOVE",
						subject: { kind: "USER", id: "grace", type: "NATIVE" },
					},
				],
			},
		]);
		expect(roles).toEqual(["MEMBERS"]);
		expect(items).toEqual([
			{
				batchIndex: 0,
				changeIndex: 0,
				key: "USER:NATIVE:ada",
				where: "Sales team members",
				action: "ADD",
				name: "ada name",
				kind: "USER",
				type: "NATIVE",
				id: "ada",
				email: null,
				detail: "",
			},
			{
				batchIndex: 0,
				changeIndex: 1,
				key: "USER:NATIVE:grace",
				where: "Sales team members",
				action: "REMOVE",
				name: "grace name",
				kind: "USER",
				type: "NATIVE",
				id: "grace",
				email: null,
				detail: "",
			},
		]);
		expect(countTeamChanges(MEMBER_EDITS)).toBe(2);
	});

	it("puts the manager changes in a second batch, after the members", () => {
		const edits: TeamEdits = {
			...MEMBER_EDITS,
			MANAGERS: {
				adds: new Map([["USER:NATIVE:grace", GRACE]]),
				removals: new Set(),
			},
		};

		const { batches, roles, items } = buildTeamBatches("Sales", edits, {
			MEMBERS: [GRACE],
			MANAGERS: [],
		});

		expect(batches.map((batch) => batch.target)).toEqual([
			{ kind: "TEAM", id: "Sales" },
			{ kind: "TEAM_MANAGERS", id: "Sales" },
		]);
		expect(roles).toEqual(["MEMBERS", "MANAGERS"]);
		const managerItem = items[items.length - 1];
		expect(managerItem.batchIndex).toBe(1);
		expect(managerItem.changeIndex).toBe(0);
		expect(managerItem.where).toBe("Sales team managers");
		expect(countTeamChanges(edits)).toBe(3);
	});

	it("leaves out a staged removal of someone who is no longer in the list", () => {
		const { batches } = buildTeamBatches("Sales", MEMBER_EDITS, {
			MEMBERS: [],
			MANAGERS: [],
		});

		expect(batches[0].changes).toHaveLength(1);
		expect(batches[0].changes[0].action).toBe("ADD");
	});
});

describe("getTeamPersonKey", () => {
	it("tells apart people with the same id on different logins", () => {
		expect(getTeamPersonKey(ADA)).toBe("USER:NATIVE:ada");
		expect(getTeamPersonKey({ ...ADA, type: "MICROSOFT" })).toBe(
			"USER:MICROSOFT:ada",
		);
	});
});

describe("withoutPeople", () => {
	it("drops the staged changes for the people given", () => {
		const left = withoutPeople(MEMBER_EDITS.MEMBERS, ["USER:NATIVE:grace"]);

		expect(left.removals.size).toBe(0);
		expect(left.adds.size).toBe(1);
	});
});

describe("withoutSettledChanges", () => {
	it("drops adds of people now in the list and removals of people gone from it", () => {
		const left = withoutSettledChanges(MEMBER_EDITS, {
			MEMBERS: [ADA],
			MANAGERS: [],
		});

		expect(left.MEMBERS.adds.size).toBe(0);
		expect(left.MEMBERS.removals.size).toBe(0);
	});

	it("keeps the changes still to make", () => {
		const left = withoutSettledChanges(MEMBER_EDITS, {
			MEMBERS: [GRACE],
			MANAGERS: [],
		});

		expect([...left.MEMBERS.adds.keys()]).toEqual(["USER:NATIVE:ada"]);
		expect([...left.MEMBERS.removals]).toEqual(["USER:NATIVE:grace"]);
	});
});
