import { describe, expect, it, vi } from "vitest";
import type { ModelUsageLimit, ModelUsageLimitRule } from "@semoss/sdk";
import {
	checkModelUsageLimitRules,
	findModelUsageLimitProblem,
	findWindowLengthProblem,
} from "./model-usage-limit-checks";
import {
	describeModelUsageLimit,
	formatComputeTime,
	formatDollars,
	getUsageShareStatus,
	getUsedPercent,
	isSameModelUsageLimit,
	parseDollarsToMicros,
	toExplicitUsageLimit,
} from "./model-usage-limit-format";
import {
	clampLengthInput,
	cleanAmountInput,
	fromRuleDraft,
	makeNewRuleDraft,
	toRuleDraft,
} from "./model-usage-rule-draft";

/** A rule with a fixed amount */
const rule = (
	overrides: Partial<ModelUsageLimitRule> = {},
): ModelUsageLimitRule => ({
	metric: "TOKENS",
	amount: 100000,
	window: "MINUTE",
	counts: "EACH_PERSON",
	...overrides,
});

/** $200 a day shared, and $80 a day for each member */
const TEAM_LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		rule({
			metric: "COST",
			amount: 200_000_000,
			window: "DAY",
			counts: "SHARED",
		}),
		rule({
			metric: "COST",
			amount: 80_000_000,
			window: "DAY",
		}),
	],
};

describe("amounts", () => {
	it("reads dollars into millionths exactly, and writes them back", () => {
		expect(parseDollarsToMicros("1,500.25")).toBe(1_500_250_000);
		expect(parseDollarsToMicros("0.1")).toBe(100_000);
		expect(parseDollarsToMicros(".5")).toBe(500_000);
		expect(parseDollarsToMicros("0.0000019")).toBe(1);
		expect(parseDollarsToMicros("")).toBeNull();
		expect(parseDollarsToMicros("abc")).toBeNull();
		expect(formatDollars(500_000_000)).toBe("$500");
		expect(formatDollars(1_920_000)).toBe("$1.92");
	});

	it("says compute time in the largest unit that reads well", () => {
		expect(formatComputeTime(500)).toBe("500 ms");
		expect(formatComputeTime(30_000)).toBe("30 seconds");
		expect(formatComputeTime(3_600_000)).toBe("1 hour");
		expect(formatComputeTime(9_000_000)).toBe("2.5 hours");
	});
});

describe("how much of a rule is used", () => {
	it("says almost reached from 90% and used up at the amount", () => {
		expect(getUsageShareStatus(0.89)).toBeNull();
		expect(getUsageShareStatus(0.9)).toBe("ALMOST_REACHED");
		expect(getUsageShareStatus(0.999)).toBe("ALMOST_REACHED");
		expect(getUsageShareStatus(1)).toBe("USED_UP");
	});

	it("rounds a rule not used up down, so it never reads 100%", () => {
		expect(getUsedPercent(0.999)).toBe(99);
		expect(getUsedPercent(0.29)).toBe(29);
		expect(getUsedPercent(0.004)).toBe(0);
		expect(getUsedPercent(1)).toBe(100);
	});
});

describe("describeModelUsageLimit", () => {
	it("says no limit defined, Unlimited or the rules", () => {
		expect(describeModelUsageLimit(null)).toBe("No Limit Defined");
		expect(describeModelUsageLimit({ unlimited: true, rules: [] })).toBe(
			"Unlimited",
		);
		expect(
			describeModelUsageLimit(
				{
					unlimited: false,
					rules: [
						rule(),
						rule({
							metric: "COST",
							amount: 500_000_000,
							window: "MONTH",
							counts: "SHARED",
						}),
					],
				},
				"TEAM",
			),
		).toBe(
			`${(100000).toLocaleString()} tokens a minute for each member and $500 a month shared`,
		);
	});

	it("says each rule in full, whose use it counts included", () => {
		expect(describeModelUsageLimit(TEAM_LIMIT, "TEAM")).toBe(
			"$200 a day shared and $80 a day for each member",
		);
		expect(
			describeModelUsageLimit(
				{ unlimited: false, rules: [...TEAM_LIMIT.rules].reverse() },
				"PUBLIC",
			),
		).toBe("$80 a day for each person and $200 a day shared");
	});
});

describe("window lengths", () => {
	it("say a length of 1 as before, and a longer window as every so many minutes or hours", () => {
		expect(
			describeModelUsageLimit({
				unlimited: false,
				rules: [
					rule(),
					rule({
						window: "MINUTE",
						windowLength: 10,
						amount: 500000,
					}),
					rule({ window: "HOUR", windowLength: 6, amount: 900000 }),
					rule({ window: "HOUR", amount: 300000 }),
				],
			}),
		).toBe(
			[
				`${(100000).toLocaleString()} tokens a minute`,
				`${(500000).toLocaleString()} tokens every 10 minutes`,
				`${(900000).toLocaleString()} tokens every 6 hours`,
				`${(300000).toLocaleString()} tokens an hour`,
			].join(" and "),
		);
	});

	it("are 1 to 59 minutes or 1 to 24 hours, and only on minute and hour windows", () => {
		expect(
			findWindowLengthProblem({ window: "MINUTE", windowLength: 59 }),
		).toBeNull();
		expect(findWindowLengthProblem({ window: "DAY" })).toBeNull();
		expect(
			findWindowLengthProblem({ window: "MINUTE", windowLength: 60 }),
		).toBe("Enter a length from 1 to 59 minutes");
		expect(
			findWindowLengthProblem({ window: "HOUR", windowLength: 25 }),
		).toBe("Enter a length from 1 to 24 hours");
		expect(
			findWindowLengthProblem({ window: "HOUR", windowLength: 0 }),
		).toBe("Enter a length from 1 to 24 hours");
		expect(
			findWindowLengthProblem({ window: "DAY", windowLength: 2 }),
		).toBe("Only minute and hour rules can have a length");
		expect(
			findModelUsageLimitProblem(
				{
					unlimited: false,
					rules: [rule({ window: "MINUTE", windowLength: 90 })],
				},
				{ source: "DIRECT", isCostAvailable: true },
			),
		).toBe("Enter a length from 1 to 59 minutes");
	});

	it("make windows of different lengths different windows", () => {
		const options = { source: "DIRECT" as const, isCostAvailable: true };
		expect(
			findModelUsageLimitProblem(
				{
					unlimited: false,
					rules: [rule(), rule({ windowLength: 10, amount: 500000 })],
				},
				options,
			),
		).toBeNull();
		expect(
			findModelUsageLimitProblem(
				{
					unlimited: false,
					rules: [
						rule({ windowLength: 10 }),
						rule({ windowLength: 10, amount: 500000 }),
					],
				},
				options,
			),
		).toBe("Another rule already counts this measure over this window");
		expect(
			isSameModelUsageLimit(
				{ unlimited: false, rules: [rule({ windowLength: 10 })] },
				{ unlimited: false, rules: [rule()] },
			),
		).toBe(false);
	});

	it("warn by how long each window really spans", () => {
		const options = { source: "DIRECT" as const, isCostAvailable: true };
		// 50,000 an hour leaves 100,000 every 10 minutes nothing to stop
		const [tenMinutes, hour] = checkModelUsageLimitRules(
			{
				unlimited: false,
				rules: [
					rule({ windowLength: 10 }),
					rule({ window: "HOUR", amount: 50000 }),
				],
			},
			options,
		);
		expect(tenMinutes.warning).toBe(
			`${(100000).toLocaleString()} tokens every 10 minutes can never be reached, since ${(50000).toLocaleString()} tokens an hour is less`,
		);
		expect(hour.warning).toBeNull();
		// every 30 minutes is shorter than an hour, so it is the one warned about
		const [halfHour] = checkModelUsageLimitRules(
			{
				unlimited: false,
				rules: [
					rule({ windowLength: 30, amount: 50000 }),
					rule({ window: "HOUR", amount: 40000 }),
				],
			},
			options,
		);
		expect(halfHour.warning).not.toBeNull();
		// a longer window that allows more leaves the shorter rule to stop calls
		expect(
			checkModelUsageLimitRules(
				{
					unlimited: false,
					rules: [rule(), rule({ windowLength: 10, amount: 500000 })],
				},
				options,
			).map((check) => check.warning),
		).toEqual([null, null]);
		// every 24 hours spans as long as a day
		expect(
			checkModelUsageLimitRules(
				{
					unlimited: false,
					rules: [
						rule({ window: "HOUR", windowLength: 24 }),
						rule({ window: "DAY", amount: 50000 }),
					],
				},
				options,
			).map((check) => check.warning),
		).toEqual([null, null]);
	});
});

describe("isSameModelUsageLimit and toExplicitUsageLimit", () => {
	it("compares rules in any order, with no rules as no limit defined", () => {
		const reversed = {
			unlimited: false,
			rules: [...TEAM_LIMIT.rules].reverse(),
		};
		expect(isSameModelUsageLimit(TEAM_LIMIT, reversed)).toBe(true);
		expect(
			isSameModelUsageLimit(null, { unlimited: false, rules: [] }),
		).toBe(true);
		expect(
			isSameModelUsageLimit(null, { unlimited: true, rules: [] }),
		).toBe(false);
		expect(toExplicitUsageLimit(null)).toEqual({
			unlimited: false,
			rules: [],
		});
	});
});

describe("the checks", () => {
	const options = { source: "TEAM" as const, isCostAvailable: true };

	it("finds rules that cannot be saved", () => {
		expect(
			findModelUsageLimitProblem(
				{ unlimited: false, rules: [rule({ amount: null })] },
				options,
			),
		).toBe("Enter an amount above 0");
		expect(
			findModelUsageLimitProblem(
				{ unlimited: false, rules: [rule(), rule({ amount: 5 })] },
				options,
			),
		).toBe("Another rule already counts this measure over this window");
		expect(
			findModelUsageLimitProblem(TEAM_LIMIT, {
				source: "TEAM",
				isCostAvailable: false,
			}),
		).toBe("This model has no known prices");
		expect(
			findModelUsageLimitProblem(TEAM_LIMIT, {
				source: "ALL_MODELS",
				isCostAvailable: false,
			}),
		).toBe("This limit counts only each person's own use");
		expect(
			findModelUsageLimitProblem(
				{ unlimited: false, rules: [] },
				options,
			),
		).toBe("Add a rule, or choose No Limit Defined");
		expect(findModelUsageLimitProblem(TEAM_LIMIT, options)).toBeNull();
	});

	it("warns about a rule a tighter one leaves nothing to stop", () => {
		const [minute, day] = checkModelUsageLimitRules(
			{
				unlimited: false,
				rules: [rule(), rule({ amount: 50000, window: "DAY" })],
			},
			{ source: "DIRECT", isCostAvailable: true },
		);
		expect(minute.warning).toBe(
			`${(100000).toLocaleString()} tokens a minute can never be reached, since ${(50000).toLocaleString()} tokens a day is less`,
		);
		expect(day.warning).toBeNull();
	});
});

describe("rule drafts", () => {
	it("keep dollars as typed and give them back in millionths", () => {
		const draft = toRuleDraft(TEAM_LIMIT.rules[0]);
		expect(draft.amountText).toBe("200");
		expect(fromRuleDraft({ ...draft, amountText: "12.5" }).amount).toBe(
			12_500_000,
		);
		expect(fromRuleDraft(toRuleDraft(TEAM_LIMIT.rules[1]))).toEqual(
			TEAM_LIMIT.rules[1],
		);
	});

	it("write whole amounts with ASCII digits whatever the browser's locale", () => {
		const formatNumber = Number.prototype.toLocaleString;
		// a browser set to Arabic (Egypt) writes Arabic-Indic digits by default
		const spy = vi
			.spyOn(Number.prototype, "toLocaleString")
			.mockImplementation(function (
				this: number,
				locales?: Intl.LocalesArgument,
				options?: Intl.NumberFormatOptions,
			) {
				return formatNumber.call(this, locales ?? "ar-EG", options);
			});
		try {
			const draft = toRuleDraft(rule({ amount: 1_234_567 }));
			expect(draft.amountText).toBe("1,234,567");
			expect(fromRuleDraft(draft).amount).toBe(1_234_567);
			expect(cleanAmountInput("TOKENS", "1234567")).toBe("1,234,567");
			expect(cleanAmountInput("COMPUTE_TIME", "90,000x")).toBe("90,000");
		} finally {
			spy.mockRestore();
		}
	});

	it("keep a window length as typed, and send it only when it is more than 1", () => {
		const draft = toRuleDraft(rule({ windowLength: 10 }));
		expect(draft.lengthText).toBe("10");
		expect(fromRuleDraft(draft).windowLength).toBe(10);
		expect(fromRuleDraft({ ...draft, lengthText: "1" })).toEqual(rule());
		expect(fromRuleDraft({ ...draft, lengthText: "" }).windowLength).toBe(
			0,
		);
		expect(
			"windowLength" in fromRuleDraft({ ...draft, window: "DAY" }),
		).toBe(false);
		expect(toRuleDraft(rule()).lengthText).toBe("1");
		expect(clampLengthInput("HOUR", "30")).toBe("24");
		expect(clampLengthInput("MINUTE", "")).toBe("1");
		expect(clampLengthInput("MINUTE", "0")).toBe("1");
		expect(clampLengthInput("MINUTE", "45")).toBe("45");
	});

	it("start a team's first rule shared and later ones for each member, on a new window", () => {
		const first = makeNewRuleDraft([], "TEAM");
		expect(first.counts).toBe("SHARED");
		const second = makeNewRuleDraft([first], "TEAM");
		expect(second.counts).toBe("EACH_PERSON");
		const third = makeNewRuleDraft([first, second], "TEAM");
		expect(third.window).toBe("MONTH");
		expect(makeNewRuleDraft([], "MODEL_TOTAL").counts).toBe("SHARED");
	});
});
