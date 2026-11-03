import { describe, expect, it } from "vitest";
import type {
	MyModelUsagePath,
	UsageLimitPathStep,
	UsageLimitRuleUsage,
} from "@semoss/sdk";
import { getUsedPercent } from "@semoss/shared";
import {
	describeTightestDetail,
	summarizeModelUsage,
	summarizeMyModelUsage,
} from "./my-model-usage";

/** 1,000,000 tokens a day with some of it used */
const dayRule = (used: number | null): UsageLimitRuleUsage => ({
	metric: "TOKENS",
	amount: 1_000_000,
	window: "DAY",
	counts: "EACH_PERSON",
	used,
	resetsAt: "2026-10-13T00:00:00Z",
});

const step = (overrides: Partial<UsageLimitPathStep>): UsageLimitPathStep => ({
	layer: "BILLED",
	limitType: "DIRECT",
	id: null,
	type: null,
	state: "BILLED",
	reason: null,
	accessSince: null,
	unlimited: false,
	rules: [],
	teamTotal: null,
	...overrides,
});

const model = (
	engineId: string,
	steps: UsageLimitPathStep[],
	ceilings: UsageLimitPathStep[] = [],
): MyModelUsagePath => ({
	engineId,
	name: engineId.toUpperCase(),
	subtype: null,
	path: {
		engineId,
		person: { id: "eli", type: "NATIVE" },
		billedLimitType: null,
		ceilings,
		steps,
	},
});

describe("summarizeModelUsage", () => {
	it("finds the limit applied and its most used rule", () => {
		const summary = summarizeModelUsage(
			model("a", [step({ rules: [dayRule(250_000), dayRule(950_000)] })]),
		);
		expect(summary.applied?.limitType).toBe("DIRECT");
		expect(summary.tightest?.share).toBe(0.95);
		expect(summary.standing).toBe("ALMOST_REACHED");
	});

	it("counts a ceiling that is fuller than the limit applied", () => {
		const summary = summarizeModelUsage(
			model(
				"a",
				[step({ rules: [dayRule(100_000)] })],
				[
					step({
						layer: "CEILING",
						limitType: "MODEL_TOTAL",
						state: "CHECKED",
						rules: [{ ...dayRule(400_000), counts: "SHARED" }],
					}),
				],
			),
		);
		expect(summary.tightest?.step.limitType).toBe("MODEL_TOTAL");
		expect(summary.tightest?.source).toBe("MODEL_TOTAL");
		expect(summary.standing).toBe("WITHIN_LIMIT");
	});

	it("says used up when a step refuses calls", () => {
		const summary = summarizeModelUsage(
			model("a", [
				step({ state: "REACHED", rules: [dayRule(1_000_000)] }),
			]),
		);
		expect(summary.standing).toBe("USED_UP");
		expect(summary.applied?.limitType).toBe("DIRECT");
		expect(summary.tightest?.share).toBe(1);
	});

	it("tells Unlimited, no limit and use that is not known apart", () => {
		expect(
			summarizeModelUsage(model("a", [step({ unlimited: true })]))
				.standing,
		).toBe("UNLIMITED");
		expect(
			summarizeModelUsage(model("a", [step({ state: "NOT_DEFINED" })]))
				.standing,
		).toBe("NO_LIMIT");
		expect(
			summarizeModelUsage(model("a", [step({ rules: [dayRule(null)] })]))
				.standing,
		).toBe("NOT_KNOWN");
	});
});

describe("the most used rule's percent and detail", () => {
	it("never reads 100% before a rule is used up", () => {
		const summary = summarizeModelUsage(
			model("a", [step({ rules: [dayRule(999_999)] })]),
		);
		expect(summary.standing).toBe("ALMOST_REACHED");
		expect(getUsedPercent(summary.tightest?.share ?? 0)).toBe(99);
		expect(getUsedPercent(0.995)).toBe(99);
		expect(getUsedPercent(0.29)).toBe(29);
		expect(getUsedPercent(0)).toBe(0);
		expect(getUsedPercent(1)).toBe(100);
	});

	it("starts at almost reached at 90%", () => {
		expect(
			summarizeModelUsage(
				model("a", [step({ rules: [dayRule(899_999)] })]),
			).standing,
		).toBe("WITHIN_LIMIT");
		expect(
			summarizeModelUsage(
				model("a", [step({ rules: [dayRule(900_000)] })]),
			).standing,
		).toBe("ALMOST_REACHED");
	});

	it("names a team's total and a ceiling, but not a rule of the limit applied", () => {
		const teamTotal = summarizeModelUsage(
			model("a", [
				step({
					limitType: "TEAM",
					id: "Ops",
					rules: [dayRule(100_000)],
					teamTotal: {
						unlimited: false,
						rules: [{ ...dayRule(800_000), counts: "SHARED" }],
					},
				}),
			]),
		).tightest;
		expect(teamTotal?.source).toBe("TEAM_TOTAL");
		expect(
			teamTotal &&
				describeTightestDetail(teamTotal, "Oct 13 at 12:00 AM"),
		).toBe("Team Total, resets Oct 13 at 12:00 AM");

		const ceiling = summarizeModelUsage(
			model(
				"a",
				[step({ rules: [dayRule(100_000)] })],
				[
					step({
						layer: "CEILING",
						limitType: "MODEL_TOTAL",
						state: "CHECKED",
						rules: [{ ...dayRule(400_000), counts: "SHARED" }],
					}),
				],
			),
		).tightest;
		expect(ceiling && describeTightestDetail(ceiling, "")).toBe(
			"Model Total",
		);

		const direct = summarizeModelUsage(
			model("a", [step({ rules: [dayRule(100_000)] })]),
		).tightest;
		expect(
			direct && describeTightestDetail(direct, "Oct 13 at 12:00 AM"),
		).toBe("resets Oct 13 at 12:00 AM");
	});
});

describe("summarizeMyModelUsage", () => {
	it("puts the most urgent models first, then the most used", () => {
		const order = summarizeMyModelUsage([
			model("none", [step({ state: "NOT_DEFINED" })]),
			model("low", [step({ rules: [dayRule(100_000)] })]),
			model("full", [
				step({ state: "REACHED", rules: [dayRule(1_000_000)] }),
			]),
			model("half", [step({ rules: [dayRule(500_000)] })]),
		]).map((summary) => summary.engineId);
		expect(order).toEqual(["full", "half", "low", "none"]);
	});
});
