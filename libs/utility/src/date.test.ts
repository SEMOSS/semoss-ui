import { afterEach, describe, expect, it, vi } from "vitest";
import {
	addLocalDays,
	calendarDayKey,
	formatDate,
	formatDateTime,
	formatDateToLocal,
	formatDurationMs,
	isSameLocalDay,
	normalizeTimestamp,
	parseDuration,
	parseWallClock,
	startOfLocalDay,
	toWallClockString,
} from "./date";

afterEach(() => vi.useRealTimers());

describe("date contracts", () => {
	it("preserves both names for local date formatting and their defaults", () => {
		const timestamp = new Date(2026, 0, 2, 12, 30).toISOString();
		for (const format of [formatDateTime, formatDateToLocal]) {
			expect(format(timestamp)).toBe("Jan 2, 2026 at 12:30 PM");
			expect(format(timestamp, "YYYY-MM-DD HH:mm")).toBe(
				"2026-01-02 12:30",
			);
			expect(format(undefined)).toBeNull();
			expect(format("not a date")).toBeNull();
		}
	});
	it("keeps local midnight across both daylight-saving boundaries", () => {
		for (const day of [new Date(2026, 2, 8), new Date(2026, 10, 1)]) {
			const next = addLocalDays(day, 1);
			expect(next.getHours()).toBe(0);
			expect(next.getDate()).toBe(day.getDate() + 1);
			expect(addLocalDays(next, -1)).toEqual(day);
		}
	});
	it("uses local calendar fields for keys and wall-clock strings", () => {
		const day = new Date(2026, 0, 2, 23, 4, 5);
		expect(calendarDayKey(day)).toBe("2026-01-02");
		expect(toWallClockString(day)).toBe("2026-01-02T23:04:05");
		expect(parseWallClock("2026-01-02T23:04:05")).toEqual(day);
		expect(isSameLocalDay(day, startOfLocalDay(day))).toBe(true);
		expect(startOfLocalDay(day)).not.toBe(day);
		expect(parseWallClock(undefined)).toBeNull();
	});
	it("normalizes zoneless SEMOSS timestamps to UTC", () => {
		expect(normalizeTimestamp("2026-01-02 12:30:00").toISOString()).toBe(
			"2026-01-02T12:30:00.000Z",
		);
		expect(
			normalizeTimestamp("2026-01-02T12:30:00+02:00").toISOString(),
		).toBe("2026-01-02T10:30:00.000Z");
	});
	it("preserves native Today/Yesterday formatting and invalid input", () => {
		vi.useFakeTimers();
		const now = new Date(2026, 0, 2, 12);
		vi.setSystemTime(now);
		expect(formatDate(now.toISOString())).toBe("Today, 12:00 PM");
		expect(formatDate(new Date(2026, 0, 1, 12).toISOString())).toBe(
			"Yesterday, 12:00 PM",
		);
		expect(formatDate("not a date")).toBe("");
	});
	it("keeps the distinct duration rounding and missing-value contracts", () => {
		expect(formatDurationMs(null)).toBe("—");
		expect(formatDurationMs(0)).toBe("0ms");
		expect(formatDurationMs(1.5)).toBe("1.5ms");
		expect(parseDuration(1.5)).toBe("2ms");
		expect(formatDurationMs(119900)).toBe("1m 59s");
		expect(parseDuration(119900)).toBe("1m 60s");
		expect(formatDurationMs(1234, 2)).toBe("1.23s");
	});
});
