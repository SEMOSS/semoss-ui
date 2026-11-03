import { describe, expect, it } from "vitest";
import { describeMessageBilledTo } from "./usage-billed-to";

describe("whom a model message was billed to", () => {
	it("names the usage limit the call counted against", () => {
		expect(
			describeMessageBilledTo({
				USER_TYPE: "NATIVE",
				BILLED_SOURCE_TYPE: "USER",
				BILLED_SUBJECT_ID: "u-1",
				BILLED_SUBJECT_TYPE: "NATIVE",
			}),
		).toBe("Direct Limit");
		expect(
			describeMessageBilledTo({
				USER_TYPE: "NATIVE",
				BILLED_SOURCE_TYPE: "TEAM",
				BILLED_SUBJECT_ID: "Ops",
				BILLED_SUBJECT_TYPE: "CUSTOM",
			}),
		).toBe("Ops Team Limit");
		expect(
			describeMessageBilledTo({
				USER_TYPE: "NATIVE",
				BILLED_SOURCE_TYPE: "ALL_MODELS",
			}),
		).toBe("User's Total Model Limit");
	});

	it("tells a call no limit applied to from one logged before calls recorded it", () => {
		expect(
			describeMessageBilledTo({
				USER_TYPE: "NATIVE",
				BILLED_SOURCE_TYPE: null,
			}),
		).toBe("No Limit");
		expect(
			describeMessageBilledTo({
				USER_TYPE: null,
				BILLED_SOURCE_TYPE: null,
			}),
		).toBe("Not Recorded");
	});
});
