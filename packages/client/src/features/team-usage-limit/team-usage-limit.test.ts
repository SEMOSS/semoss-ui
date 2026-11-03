import { describe, expect, it } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import { getTeamLimitKey, toTeamLimitBatch } from "./team-usage-limit";

/** $200 every 6 hours shared by the team */
const SHARED_LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{
			metric: "COST",
			amount: 200_000_000,
			window: "HOUR",
			windowLength: 6,
			counts: "SHARED",
		},
	],
};

const TEAM = { id: "Ops", type: "CUSTOM" };

describe("toTeamLimitBatch", () => {
	it("changes one team's limit on the model, keeping its level and end date", () => {
		expect(
			toTeamLimitBatch(
				"m1",
				TEAM,
				{
					level: "EDIT",
					endDate: "2027-01-01T00:00:00Z",
					usageLimit: null,
				},
				SHARED_LIMIT,
			),
		).toEqual({
			target: { resourceType: "ENGINE", id: "m1" },
			changes: [
				{
					action: "CHANGE",
					subject: { category: "TEAM", id: "Ops", type: "CUSTOM" },
					to: {
						level: "EDIT",
						endDate: "2027-01-01T00:00:00Z",
						usageLimit: SHARED_LIMIT,
					},
				},
			],
		});
	});

	it("leaves the limit out for no limit defined", () => {
		const [change] = toTeamLimitBatch(
			"m1",
			TEAM,
			{ level: "READ_ONLY", usageLimit: SHARED_LIMIT },
			null,
		).changes;
		expect(change).toEqual({
			action: "CHANGE",
			subject: { category: "TEAM", id: "Ops", type: "CUSTOM" },
			to: { level: "READ_ONLY", endDate: null },
		});
	});
});

describe("getTeamLimitKey", () => {
	it("keys a team by its type and name, so teams of two types never match", () => {
		expect(getTeamLimitKey(TEAM)).toBe("CUSTOM:Ops");
		expect(getTeamLimitKey({ id: "Ops", type: "MICROSOFT" })).not.toBe(
			getTeamLimitKey(TEAM),
		);
	});
});
