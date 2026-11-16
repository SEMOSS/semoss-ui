import { describe, expect, it } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import {
	DEFAULT_ENGINE_APP_LEVEL,
	ENGINE_APP_LEVELS,
	type EngineApp,
	isEngineAppLevel,
	toAddAppBatch,
	toAppLevelBatch,
	toAppLimitBatch,
	toRemoveAppBatch,
} from "./engine-app-permissions";

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

/** An app with an end date and a usage limit on a model */
const INTAKE: EngineApp = {
	subject: { category: "PROJECT", id: "app1", name: "Intake Form" },
	access: {
		level: "READ_ONLY",
		endDate: "2027-01-01T00:00:00Z",
		usageLimit: APP_LIMIT,
	},
};

describe("the levels an engine gives an app", () => {
	it("are Read-Only and Editor, never Author, starting at Read-Only", () => {
		expect(ENGINE_APP_LEVELS.map(getLevelLabel)).toEqual([
			"Read-Only",
			"Editor",
		]);
		expect(DEFAULT_ENGINE_APP_LEVEL).toBe("READ_ONLY");
		expect(isEngineAppLevel("EDIT")).toBe(true);
		expect(isEngineAppLevel("READ_ONLY")).toBe(true);
		expect(isEngineAppLevel("OWNER")).toBe(false);
		expect(isEngineAppLevel("")).toBe(false);
	});
});

describe("toAddAppBatch", () => {
	it("adds the app to the engine at the level, with no end date", () => {
		expect(toAddAppBatch("e1", "app1", "EDIT")).toEqual({
			target: { resourceType: "ENGINE", id: "e1" },
			changes: [
				{
					action: "ADD",
					subject: { category: "PROJECT", id: "app1" },
					to: { level: "EDIT", endDate: null },
				},
			],
		});
	});

	it("sends a model's limit with the app, and leaves out no limit defined", () => {
		const [withLimit] = toAddAppBatch(
			"m1",
			"app1",
			"READ_ONLY",
			APP_LIMIT,
		).changes;
		expect(withLimit).toEqual({
			action: "ADD",
			subject: { category: "PROJECT", id: "app1" },
			to: { level: "READ_ONLY", endDate: null, usageLimit: APP_LIMIT },
		});

		const [withoutLimit] = toAddAppBatch(
			"m1",
			"app1",
			"READ_ONLY",
			null,
		).changes;
		expect(withoutLimit).toEqual({
			action: "ADD",
			subject: { category: "PROJECT", id: "app1" },
			to: { level: "READ_ONLY", endDate: null },
		});
	});
});

describe("toAppLevelBatch", () => {
	it("changes the level and carries the end date and usage limit forward", () => {
		expect(toAppLevelBatch("m1", INTAKE, "EDIT")).toEqual({
			target: { resourceType: "ENGINE", id: "m1" },
			changes: [
				{
					action: "CHANGE",
					subject: { category: "PROJECT", id: "app1" },
					to: {
						level: "EDIT",
						endDate: "2027-01-01T00:00:00Z",
						usageLimit: APP_LIMIT,
					},
				},
			],
		});
	});

	it("sends no end date and no limit for an app that has neither", () => {
		const [change] = toAppLevelBatch(
			"e1",
			{
				subject: INTAKE.subject,
				access: { level: "EDIT", endDate: null, usageLimit: null },
			},
			"READ_ONLY",
		).changes;
		expect(change).toEqual({
			action: "CHANGE",
			subject: { category: "PROJECT", id: "app1" },
			to: { level: "READ_ONLY", endDate: null },
		});
	});
});

describe("toAppLimitBatch", () => {
	it("changes the limit and carries the level and end date forward", () => {
		const unlimited: ModelUsageLimit = { unlimited: true, rules: [] };
		expect(toAppLimitBatch("m1", INTAKE, unlimited)).toEqual({
			target: { resourceType: "ENGINE", id: "m1" },
			changes: [
				{
					action: "CHANGE",
					subject: { category: "PROJECT", id: "app1" },
					to: {
						level: "READ_ONLY",
						endDate: "2027-01-01T00:00:00Z",
						usageLimit: unlimited,
					},
				},
			],
		});
	});

	it("leaves the limit out for no limit defined", () => {
		const [change] = toAppLimitBatch("m1", INTAKE, null).changes;
		expect(change).toEqual({
			action: "CHANGE",
			subject: { category: "PROJECT", id: "app1" },
			to: { level: "READ_ONLY", endDate: "2027-01-01T00:00:00Z" },
		});
	});
});

describe("toRemoveAppBatch", () => {
	it("takes the app's permission away, with no access to give", () => {
		expect(toRemoveAppBatch("e1", "app1")).toEqual({
			target: { resourceType: "ENGINE", id: "e1" },
			changes: [
				{
					action: "REMOVE",
					subject: { category: "PROJECT", id: "app1" },
				},
			],
		});
	});
});
