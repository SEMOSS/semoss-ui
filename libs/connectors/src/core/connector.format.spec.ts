import { describe, expect, it } from "vitest";
import {
	addLocalDays,
	formatConnectorSize,
	formatListDate,
	parseGraphDate,
	parseGraphDay,
} from "./connector.format";

describe("parseGraphDate", () => {
	it("reads ISO instants", () => {
		expect(parseGraphDate("2026-09-27T12:00:00Z")?.toISOString()).toBe(
			"2026-09-27T12:00:00.000Z",
		);
	});

	it("reads Graph's seven digit fractions without an offset as UTC", () => {
		expect(
			parseGraphDate("2026-09-27T13:00:00.0000000", "UTC")?.toISOString(),
		).toBe("2026-09-27T13:00:00.000Z");
	});

	it("does not guess at another zone", () => {
		expect(
			parseGraphDate("2026-09-27T13:00:00", "Pacific Standard Time"),
		).toBeNull();
	});

	it("rejects values that are not dates", () => {
		expect(parseGraphDate("soon")).toBeNull();
		expect(parseGraphDate(undefined)).toBeNull();
	});
});

describe("parseGraphDay", () => {
	it("reads the calendar day, whatever the time zone", () => {
		const day = parseGraphDay("2026-09-27T00:00:00.0000000");
		expect(day?.getFullYear()).toBe(2026);
		expect(day?.getMonth()).toBe(8);
		expect(day?.getDate()).toBe(27);
	});
});

describe("addLocalDays", () => {
	it("moves by whole days", () => {
		expect(addLocalDays(new Date(2026, 8, 30), 1).getDate()).toBe(1);
	});
});

describe("formatConnectorSize", () => {
	it("scales bytes", () => {
		expect(formatConnectorSize(512, "en")).toBe("512 B");
		expect(formatConnectorSize(1536, "en")).toBe("1.5 KB");
	});
});

describe("formatListDate", () => {
	it("shows a time today and a date otherwise", () => {
		const now = new Date(2026, 8, 27, 18, 0);
		const today = new Date(2026, 8, 27, 9, 30).toISOString();
		const older = new Date(2025, 0, 2, 9, 30).toISOString();
		expect(formatListDate(today, "en-US", now)).toMatch(/9:30/);
		expect(formatListDate(older, "en-US", now)).toMatch(/2025/);
		expect(formatListDate("not a date", "en-US", now)).toBe("");
	});
});
