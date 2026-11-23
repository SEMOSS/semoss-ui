import { describe, expect, it } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import {
	DEFAULT_ENGINE_GRANTEE_LEVEL,
	ENGINE_GRANTEE_LEVELS,
	type EngineGrantee,
	isEngineGranteeLevel,
	toAddEngineBatch,
	toEngineGranteeType,
	toEngineLevelBatch,
	toEngineLimitBatch,
	toRemoveEngineBatch,
} from "./engine-engine-permissions";

/** 5,000 tokens a day for the engine, and 100 a day for each of its users */
const ENGINE_LIMIT: ModelUsageLimit = {
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

/** A guardrail with an end date and a usage limit on a model */
const GUARD: EngineGrantee = {
	subject: {
		category: "ENGINE",
		id: "guard1",
		type: "GUARDRAIL",
		name: "Prompt Guard",
		subtype: "PROMPT",
	},
	access: {
		level: "READ_ONLY",
		endDate: "2027-01-01T00:00:00Z",
		usageLimit: ENGINE_LIMIT,
	},
};

/** The subject every batch sends for the guardrail */
const GUARD_SUBJECT = { category: "ENGINE", id: "guard1", type: "GUARDRAIL" };

describe("the levels an engine gives another engine", () => {
	it("are Read-Only and Editor, never Author, starting at Read-Only", () => {
		expect(ENGINE_GRANTEE_LEVELS.map(getLevelLabel)).toEqual([
			"Read-Only",
			"Editor",
		]);
		expect(DEFAULT_ENGINE_GRANTEE_LEVEL).toBe("READ_ONLY");
		expect(isEngineGranteeLevel("EDIT")).toBe(true);
		expect(isEngineGranteeLevel("READ_ONLY")).toBe(true);
		expect(isEngineGranteeLevel("OWNER")).toBe(false);
		expect(isEngineGranteeLevel("")).toBe(false);
	});
});

describe("toEngineGranteeType", () => {
	it("takes an engine type Add Engine offers, and nothing else", () => {
		expect(toEngineGranteeType("VECTOR")).toBe("VECTOR");
		expect(toEngineGranteeType("GUARDRAIL")).toBe("GUARDRAIL");
		expect(toEngineGranteeType("PROJECT")).toBeNull();
		expect(toEngineGranteeType("VENV")).toBeNull();
		expect(toEngineGranteeType("")).toBeNull();
	});
});

describe("toAddEngineBatch", () => {
	it("adds the engine by its id and type at the level, with no end date", () => {
		expect(
			toAddEngineBatch(
				"model-1",
				{ id: "guard1", type: "GUARDRAIL" },
				"EDIT",
			),
		).toEqual({
			target: { resourceType: "ENGINE", id: "model-1" },
			changes: [
				{
					action: "ADD",
					subject: GUARD_SUBJECT,
					to: { level: "EDIT", endDate: null },
				},
			],
		});
	});

	it("sends an engine limit on a model, and leaves out no limit defined", () => {
		const [withLimit] = toAddEngineBatch(
			"model-1",
			{ id: "guard1", type: "GUARDRAIL" },
			"READ_ONLY",
			ENGINE_LIMIT,
		).changes;
		expect(withLimit).toEqual({
			action: "ADD",
			subject: GUARD_SUBJECT,
			to: { level: "READ_ONLY", endDate: null, usageLimit: ENGINE_LIMIT },
		});
		const [noLimit] = toAddEngineBatch(
			"model-1",
			{ id: "guard1", type: "GUARDRAIL" },
			"READ_ONLY",
			null,
		).changes;
		expect(noLimit).toEqual({
			action: "ADD",
			subject: GUARD_SUBJECT,
			to: { level: "READ_ONLY", endDate: null },
		});
	});
});

describe("toEngineLevelBatch", () => {
	it("changes the level and carries the end date and limit forward", () => {
		expect(toEngineLevelBatch("model-1", GUARD, "EDIT")).toEqual({
			target: { resourceType: "ENGINE", id: "model-1" },
			changes: [
				{
					action: "CHANGE",
					subject: GUARD_SUBJECT,
					to: {
						level: "EDIT",
						endDate: "2027-01-01T00:00:00Z",
						usageLimit: ENGINE_LIMIT,
					},
				},
			],
		});
	});
});

describe("toEngineLimitBatch", () => {
	it("changes the limit and carries the level and end date forward", () => {
		const [change] = toEngineLimitBatch("model-1", GUARD, {
			unlimited: true,
			rules: [],
		}).changes;
		expect(change).toEqual({
			action: "CHANGE",
			subject: GUARD_SUBJECT,
			to: {
				level: "READ_ONLY",
				endDate: "2027-01-01T00:00:00Z",
				usageLimit: { unlimited: true, rules: [] },
			},
		});
	});

	it("leaves the limit out for no limit defined", () => {
		const [change] = toEngineLimitBatch("model-1", GUARD, null).changes;
		expect(change).toEqual({
			action: "CHANGE",
			subject: GUARD_SUBJECT,
			to: { level: "READ_ONLY", endDate: "2027-01-01T00:00:00Z" },
		});
	});
});

describe("toRemoveEngineBatch", () => {
	it("takes the engine's access away by its id and type, with no grant", () => {
		expect(
			toRemoveEngineBatch("model-1", { id: "guard1", type: "GUARDRAIL" }),
		).toEqual({
			target: { resourceType: "ENGINE", id: "model-1" },
			changes: [{ action: "REMOVE", subject: GUARD_SUBJECT }],
		});
	});
});
