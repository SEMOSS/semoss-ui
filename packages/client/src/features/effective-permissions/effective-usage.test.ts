import { describe, expect, it } from "vitest";
import type { EffectivePermissionRow, EffectiveUsage } from "@semoss/sdk";
import {
	describeNotApplied,
	getEffectiveLimit,
	isNotCapped,
	matchesBilledTo,
} from "./effective-usage";

const usage = (overrides: Partial<EffectiveUsage>): EffectiveUsage => ({
	billedTo: { limitType: "TEAM", id: "Ops", type: "CUSTOM" },
	unlimited: false,
	rules: [
		{
			metric: "COST",
			amount: 100000000,
			window: "DAY",
			counts: "SHARED",
		},
	],
	nextTeams: [],
	notApplied: [],
	...overrides,
});

const row = (value: EffectiveUsage | null): EffectivePermissionRow => ({
	subject: {
		category: "USER",
		id: "eli",
		type: "NATIVE",
		name: "Eli",
		email: null,
	},
	level: "READ_ONLY",
	sources: [{ sourceType: "DIRECT", level: "READ_ONLY", endDate: null }],
	usage: value,
});

describe("matchesBilledTo and isNotCapped", () => {
	it("filters by the source billed, with no limit as its own choice", () => {
		const billedToTeam = row(usage({}));
		const noLimit = row(usage({ billedTo: null, rules: [] }));

		expect(matchesBilledTo(billedToTeam, "ALL")).toBe(true);
		expect(matchesBilledTo(billedToTeam, "TEAM")).toBe(true);
		expect(matchesBilledTo(billedToTeam, "DIRECT")).toBe(false);
		expect(matchesBilledTo(noLimit, "NONE")).toBe(true);
		expect(matchesBilledTo(billedToTeam, "NONE")).toBe(false);
	});

	it("finds the people nothing caps", () => {
		expect(isNotCapped(row(usage({})))).toBe(false);
		expect(isNotCapped(row(usage({ unlimited: true, rules: [] })))).toBe(
			true,
		);
		expect(isNotCapped(row(usage({ billedTo: null })))).toBe(true);
	});
});

describe("getEffectiveLimit and describeNotApplied", () => {
	it("gives the billed source's limit and where it is set", () => {
		expect(getEffectiveLimit(usage({}))).toEqual({
			limit: { unlimited: false, rules: usage({}).rules },
			source: "TEAM",
		});
		expect(
			getEffectiveLimit(
				usage({
					billedTo: { limitType: "PLATFORM", id: null, type: null },
				}),
			).source,
		).toBe("PLATFORM");
		expect(getEffectiveLimit(usage({ unlimited: true })).limit).toEqual({
			unlimited: true,
			rules: [],
		});
		expect(getEffectiveLimit(null).limit).toBeNull();
	});

	it("says why a limit does not apply", () => {
		expect(
			describeNotApplied({
				limitType: "TEAM",
				id: "Data",
				type: "CUSTOM",
				reason: "DIRECT_WINS",
			}),
		).toBe("Data Team Limit does not apply: the Direct Limit applies");
		expect(
			describeNotApplied({
				limitType: "PUBLIC",
				id: null,
				type: null,
				reason: "NOT_PUBLIC",
			}),
		).toBe("Public Use Limit does not apply: the model is not public");
	});
});
