import { describe, expect, it } from "vitest";
import { parseTimestamp } from "./date";

describe("parseTimestamp", () => {
	it("parses timestamps with explicit timezones", () => {
		expect(parseTimestamp("2026-09-23T12:00:00Z")).toBe(
			Date.parse("2026-09-23T12:00:00Z"),
		);
	});

	it("returns null for missing and invalid timestamps", () => {
		expect(parseTimestamp()).toBeNull();
		expect(parseTimestamp("")).toBeNull();
		expect(parseTimestamp("not-a-date")).toBeNull();
	});
});
