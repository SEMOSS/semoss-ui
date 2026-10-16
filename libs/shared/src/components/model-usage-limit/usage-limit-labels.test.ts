import { describe, expect, it } from "vitest";
import { describeBilledTo, getUsageSourceLabel } from "./usage-limit-labels";

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
