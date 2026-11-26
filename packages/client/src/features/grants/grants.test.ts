import { describe, expect, it } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	type Grantee,
	granteeKey,
	isAgent,
	toAddGranteesBatch,
	toGranteeChangeBatch,
	toRemoveGranteeBatch,
} from "./grants";

/** 5,000 tokens a day shared, and 100 a day for each user */
const LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{ metric: "TOKENS", amount: 5000, window: "DAY", counts: "SHARED" },
		{ metric: "TOKENS", amount: 100, window: "DAY", counts: "EACH_PERSON" },
	],
};

/** An app with an end date and a usage limit on a model */
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
		usageLimit: LIMIT,
	},
};

const MODEL = { resourceType: "ENGINE" as const, id: "model1" };
const SKILL = { resourceType: "PROJECT" as const, id: "skill1" };

describe("toAddGranteesBatch", () => {
	it("adds every grantee to the target in one batch at the level, with no end date", () => {
		expect(
			toAddGranteesBatch(
				SKILL,
				[
					{ id: "agent1", type: "PROJECT" },
					{ id: "app1", type: "PROJECT" },
				],
				"EDIT",
			),
		).toEqual({
			target: { resourceType: "PROJECT", id: "skill1" },
			changes: ["agent1", "app1"].map((id) => ({
				action: "ADD",
				subject: { category: "ENGINE", id, type: "PROJECT" },
				to: { level: "EDIT", endDate: null },
			})),
		});
	});

	it("sends a model's limit with each grantee, and leaves out no limit defined", () => {
		expect(
			toAddGranteesBatch(
				MODEL,
				[{ id: "vectors1", type: "VECTOR" }],
				"READ_ONLY",
				LIMIT,
			).changes,
		).toEqual([
			{
				action: "ADD",
				subject: { category: "ENGINE", id: "vectors1", type: "VECTOR" },
				to: { level: "READ_ONLY", endDate: null, usageLimit: LIMIT },
			},
		]);
		expect(
			toAddGranteesBatch(
				MODEL,
				[{ id: "app1", type: "PROJECT" }],
				"READ_ONLY",
			).changes[0],
		).toEqual({
			action: "ADD",
			subject: { category: "ENGINE", id: "app1", type: "PROJECT" },
			to: { level: "READ_ONLY", endDate: null },
		});
	});
});

describe("toGranteeChangeBatch and toRemoveGranteeBatch", () => {
	it("change the level and carry the end date and usage limit forward", () => {
		expect(toGranteeChangeBatch(MODEL, INTAKE, { level: "EDIT" })).toEqual({
			target: { resourceType: "ENGINE", id: "model1" },
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
						usageLimit: LIMIT,
					},
				},
			],
		});
	});

	it("change the limit and carry the level forward, leaving out no limit defined", () => {
		expect(
			toGranteeChangeBatch(MODEL, INTAKE, { usageLimit: null })
				.changes[0],
		).toEqual({
			action: "CHANGE",
			subject: { category: "ENGINE", id: "app1", type: "PROJECT" },
			to: { level: "READ_ONLY", endDate: "2027-01-01T00:00:00Z" },
		});
	});

	it("take the permission away by the grantee's id and type, with no grant", () => {
		expect(
			toRemoveGranteeBatch(SKILL, { id: "agent1", type: "PROJECT" }),
		).toEqual({
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
		});
	});
});

describe("isAgent and granteeKey", () => {
	it("tell an agent from an app, and key a pair by both sides", () => {
		expect(isAgent(INTAKE)).toBe(false);
		expect(
			isAgent({
				...INTAKE,
				subject: { ...INTAKE.subject, subtype: "WORKSPACE" },
			}),
		).toBe(true);
		expect(granteeKey(SKILL, { id: "agent1", type: "PROJECT" })).toBe(
			"PROJECT:skill1|PROJECT:agent1",
		);
		expect(granteeKey(MODEL, { id: "skill1", type: "PROJECT" })).not.toBe(
			granteeKey(SKILL, { id: "skill1", type: "PROJECT" }),
		);
	});
});
