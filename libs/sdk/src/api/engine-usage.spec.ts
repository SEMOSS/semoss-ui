import { describe, expect, it } from "vitest";
import { readEngineUsageLimit, readEngineUsageSettings } from "./engine-usage";

const rows = {
	unlimited: false,
	rules: [
		{
			metric: "ROWS",
			amount: 10,
			window: "MINUTE",
			windowLength: 10,
			counts: "EACH_PERSON",
		},
	],
};
describe("engine usage contract", () => {
	it("reads catalog metrics and distinguishes Undefined from Unlimited", () => {
		expect(readEngineUsageLimit(null)).toBeNull();
		expect(
			readEngineUsageLimit({ unlimited: false, rules: [] }),
		).toBeNull();
		expect(readEngineUsageLimit({ unlimited: true, rules: [] })).toEqual({
			unlimited: true,
			rules: [],
		});
		expect(readEngineUsageLimit(JSON.stringify(rows))).toEqual(rows);
	});
	it.each([NaN, Infinity, -1, 0, 1.5, Number.MAX_SAFE_INTEGER + 1])(
		"rejects unsafe rule amount %s",
		(amount) => {
			expect(() =>
				readEngineUsageLimit({
					...rows,
					rules: [{ ...rows.rules[0], amount }],
				}),
			).toThrow("Invalid engine usage rule");
		},
	);
	it("does not silently drop malformed policy rules", () => {
		for (const patch of [
			{ metric: "UNKNOWN" },
			{ window: "UNKNOWN" },
			{ counts: "UNKNOWN" },
			{ windowLength: 60 },
		]) {
			expect(() =>
				readEngineUsageLimit({
					...rows,
					rules: [{ ...rows.rules[0], ...patch }],
				}),
			).toThrow();
		}
		expect(() =>
			readEngineUsageLimit({ ...rows, unlimited: true }),
		).toThrow("Unlimited has no rules");
	});
	it("keeps new capability metadata optional on legacy responses", () => {
		expect(readEngineUsageSettings(undefined)).toBeUndefined();
		expect(
			readEngineUsageSettings({
				catalogType: "DATABASE",
				metrics: ["QUERIES", "ROWS", "COMPUTE_TIME"],
				publicUse: { isPublic: false, usageLimit: null },
				engineTotal: { usageLimit: rows },
			}),
		).toEqual({
			catalogType: "DATABASE",
			metrics: ["QUERIES", "ROWS", "COMPUTE_TIME"],
			publicUse: { isPublic: false, usageLimit: null },
			engineTotal: { usageLimit: rows },
		});
		expect(() =>
			readEngineUsageSettings({
				catalogType: "DATABASE",
				metrics: ["UNKNOWN"],
				publicUse: {},
				engineTotal: {},
			}),
		).toThrow();
	});
});
