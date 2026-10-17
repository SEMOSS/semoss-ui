import { describe, expect, it } from "vitest";
import {
	describeBilledTo,
	describeLoggedBilledTo,
	getUsageSourceLabel,
} from "./usage-limit-labels";

describe("describeLoggedBilledTo", () => {
	it("names the limit a call was billed to as the logs record it", () => {
		expect(describeLoggedBilledTo("USER", "u-1", "NATIVE")).toBe(
			"Direct Limit",
		);
		expect(describeLoggedBilledTo("TEAM", "Ops", "CUSTOM")).toBe(
			"Ops Team Limit",
		);
		expect(describeLoggedBilledTo("PUBLIC", null, null)).toBe(
			"Public Use Limit",
		);
		expect(describeLoggedBilledTo("ALL_MODELS", "u-1", "NATIVE")).toBe(
			"User's Total Model Limit",
		);
		expect(describeLoggedBilledTo("PLATFORM", null, null)).toBe(
			"General Platform Limit",
		);
	});

	it("keeps a source it does not know and has nothing for none", () => {
		expect(describeLoggedBilledTo("SOMETHING_NEW", null, null)).toBe(
			"SOMETHING_NEW",
		);
		expect(describeLoggedBilledTo(null, null, null)).toBeNull();
		expect(describeLoggedBilledTo("", null, null)).toBeNull();
	});
});

describe("getUsageSourceLabel", () => {
	it("names each limit a call can be applied by", () => {
		expect(getUsageSourceLabel("DIRECT")).toBe("Direct Limit");
		expect(getUsageSourceLabel("TEAM")).toBe("Team Limit");
		expect(getUsageSourceLabel("PUBLIC")).toBe("Public Use Limit");
		expect(getUsageSourceLabel("ALL_MODELS")).toBe(
			"User's Total Model Limit",
		);
		expect(getUsageSourceLabel("PLATFORM")).toBe("General Platform Limit");
	});

	it("names a team's limit after the team", () => {
		expect(getUsageSourceLabel("TEAM", "Ops")).toBe("Ops Team Limit");
	});
});

describe("describeBilledTo", () => {
	it("says which limit applies, with the teams calls move on to", () => {
		expect(describeBilledTo(null)).toBe("No Limit");
		expect(
			describeBilledTo({
				limitType: "DIRECT",
				id: "eli",
				type: "NATIVE",
			}),
		).toBe("Direct Limit");
		expect(
			describeBilledTo({ limitType: "TEAM", id: "Ops", type: "CUSTOM" }, [
				{ id: "Data", type: "CUSTOM", unlimited: false, rules: [] },
			]),
		).toBe("Ops Team Limit, then Data");
	});
});
