import { describe, expect, it } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import { toModelLimitBatch } from "./model-usage-limits";

/** 50,000,000 tokens a month for everyone together */
const TOTAL_LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{
			metric: "TOKENS",
			amount: 50_000_000,
			window: "MONTH",
			counts: "SHARED",
		},
	],
};

describe("toModelLimitBatch", () => {
	it("changes the model total on the model", () => {
		expect(toModelLimitBatch("m1", "MODEL", TOTAL_LIMIT)).toEqual({
			target: { resourceType: "ENGINE", id: "m1" },
			changes: [
				{
					action: "CHANGE",
					subject: { category: "MODEL" },
					to: { usageLimit: TOTAL_LIMIT },
				},
			],
		});
	});

	it("sends null to clear the public use limit to no limit defined", () => {
		expect(toModelLimitBatch("m1", "PUBLIC", null).changes).toEqual([
			{
				action: "CHANGE",
				subject: { category: "PUBLIC" },
				to: { usageLimit: null },
			},
		]);
	});
});
