import { describe, expect, it } from "vitest";
import { isAccessReason, readAccessDetails } from "./access-reason";

describe("readAccessDetails", () => {
	it("reads the known details in the drawer's order", () => {
		expect(
			readAccessDetails(
				JSON.stringify({
					attempt: 2,
					via: "AGENT_RUN",
					levelNeeded: "EDIT",
					agentId: "orders-agent",
				}),
			),
		).toEqual([
			{ key: "via", value: "AGENT_RUN" },
			{ key: "agentId", value: "orders-agent" },
			{ key: "levelNeeded", value: "EDIT" },
			{ key: "attempt", value: "2" },
		]);
	});

	it("leaves out details it does not know and values that are not text or numbers", () => {
		expect(
			readAccessDetails(
				JSON.stringify({
					level: "EDIT",
					secret: "x",
					teamId: { id: "ops" },
				}),
			),
		).toEqual([{ key: "level", value: "EDIT" }]);
	});

	it("reads nothing from no details or details that are not a JSON object", () => {
		expect(readAccessDetails(null)).toEqual([]);
		expect(readAccessDetails("")).toEqual([]);
		expect(readAccessDetails("not json")).toEqual([]);
		expect(readAccessDetails("[1,2]")).toEqual([]);
	});
});

describe("isAccessReason", () => {
	it("knows the reasons the Activity Log records", () => {
		expect(isAccessReason("DELEGATED")).toBe(true);
		expect(isAccessReason("REFUSED")).toBe(true);
		expect(isAccessReason("SOMETHING_ELSE")).toBe(false);
		expect(isAccessReason(null)).toBe(false);
	});
});
