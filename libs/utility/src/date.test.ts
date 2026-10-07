import dayjs from "dayjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	addLocalDays,
	DATE_BUCKET_ORDER,
	formatDateTimeWithRelativeDay,
	formatDurationMs,
	formatLocalDateKey,
	formatLocalDateTime,
	formatLocalWallClock,
	formatRoundedDurationMs,
	getDateBucket,
	isSameLocalDay,
	parseLocalWallClock,
	parseTimestamp,
	parseTimestampWithUtcDefault,
	startOfLocalDay,
} from "./date";

afterEach(() => vi.useRealTimers());

describe("date contracts", () => {
	it("formats local date/time with default and custom formats", () => {
		const timestamp = new Date(2026, 0, 2, 12, 30).toISOString();
		expect(formatLocalDateTime(timestamp)).toBe("Jan 2, 2026 at 12:30 PM");
		expect(formatLocalDateTime(timestamp, "YYYY-MM-DD HH:mm")).toBe(
			"2026-01-02 12:30",
		);
		expect(formatLocalDateTime(undefined)).toBeNull();
		expect(formatLocalDateTime("not a date")).toBeNull();
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
		expect(formatLocalDateKey(day)).toBe("2026-01-02");
		expect(formatLocalWallClock(day)).toBe("2026-01-02T23:04:05");
		expect(parseLocalWallClock("2026-01-02T23:04:05")).toEqual(day);
		expect(isSameLocalDay(day, startOfLocalDay(day))).toBe(true);
		expect(startOfLocalDay(day)).not.toBe(day);
		expect(parseLocalWallClock(undefined)).toBeNull();
		expect(formatLocalDateKey(new Date("invalid"))).toBe("NaN-NaN-NaN");
	});
	it("normalizes zoneless SEMOSS timestamps to UTC", () => {
		expect(
			parseTimestampWithUtcDefault("2026-01-02 12:30:00").toISOString(),
		).toBe("2026-01-02T12:30:00.000Z");
		expect(
			parseTimestampWithUtcDefault(
				"2026-01-02T12:30:00+02:00",
			).toISOString(),
		).toBe("2026-01-02T10:30:00.000Z");
	});
	it("preserves native Today/Yesterday formatting and invalid input", () => {
		vi.useFakeTimers();
		const now = new Date(2026, 0, 2, 12);
		vi.setSystemTime(now);
		expect(formatDateTimeWithRelativeDay(now.toISOString())).toBe(
			"Today, 12:00 PM",
		);
		expect(
			formatDateTimeWithRelativeDay(
				new Date(2026, 0, 1, 12).toISOString(),
			),
		).toBe("Yesterday, 12:00 PM");
		expect(formatDateTimeWithRelativeDay("not a date")).toBe("");
	});
	it("keeps the distinct duration rounding and missing-value contracts", () => {
		expect(formatDurationMs(null)).toBe("—");
		expect(formatDurationMs(0)).toBe("0ms");
		expect(formatDurationMs(1.5)).toBe("1.5ms");
		expect(formatRoundedDurationMs(1.5)).toBe("2ms");
		expect(formatDurationMs(119900)).toBe("1m 59s");
		expect(formatRoundedDurationMs(119900)).toBe("1m 60s");
		expect(formatDurationMs(1234, 2)).toBe("1.23s");
	});
});

describe("relative date buckets", () => {
	it("groups all seven ranges in display order", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 15, 12));
		const dates = [
			new Date(2026, 0, 15, 0),
			new Date(2026, 0, 14, 23, 59),
			new Date(2026, 0, 13, 12),
			new Date(2026, 0, 10, 12),
			new Date(2026, 0, 1, 12),
			new Date(2025, 11, 15, 12),
			new Date(2025, 10, 15, 12),
		];
		const buckets = dates.map((date) => getDateBucket(dayjs(date)));
		expect(buckets).toEqual([
			"today",
			"yesterday",
			"fewDaysAgo",
			"lastWeek",
			"thisMonth",
			"lastMonth",
			"older",
		]);
		expect(DATE_BUCKET_ORDER).toEqual(buckets);
	});
	it("uses strict rolling cutoffs instead of midnight for three and seven days", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 15, 12));
		const threeDaysAgo = dayjs(new Date(2026, 0, 12, 12));
		const sevenDaysAgo = dayjs(new Date(2026, 0, 8, 12));
		expect(getDateBucket(threeDaysAgo)).toBe("lastWeek");
		expect(getDateBucket(threeDaysAgo.add(1, "millisecond"))).toBe(
			"fewDaysAgo",
		);
		expect(getDateBucket(sevenDaysAgo)).toBe("thisMonth");
		expect(getDateBucket(sevenDaysAgo.add(1, "millisecond"))).toBe(
			"lastWeek",
		);
	});
	it("prioritizes recent days across year and month boundaries", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 1, 12));
		expect(getDateBucket(dayjs(new Date(2025, 11, 31, 0)))).toBe(
			"yesterday",
		);
		expect(getDateBucket(dayjs(new Date(2025, 11, 30, 12)))).toBe(
			"fewDaysAgo",
		);
		expect(getDateBucket(dayjs(new Date(2025, 11, 28, 12)))).toBe(
			"lastWeek",
		);
		expect(getDateBucket(dayjs(new Date(2025, 11, 15, 12)))).toBe(
			"lastMonth",
		);
	});
	it("keeps local cutoffs across both daylight-saving transitions", () => {
		vi.useFakeTimers();
		for (const [now, cutoff] of [
			[new Date(2026, 2, 10, 12), new Date(2026, 2, 7, 12)],
			[new Date(2026, 10, 3, 12), new Date(2026, 9, 31, 12)],
		]) {
			vi.setSystemTime(now);
			expect(getDateBucket(dayjs(cutoff))).toBe("lastWeek");
			expect(getDateBucket(dayjs(cutoff).add(1, "millisecond"))).toBe(
				"fewDaysAgo",
			);
		}
	});
	it("preserves the existing invalid-date and future-date fallbacks", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 15, 12));
		expect(getDateBucket(dayjs("invalid"))).toBe("older");
		expect(getDateBucket(dayjs(new Date(2026, 0, 16, 12)))).toBe(
			"fewDaysAgo",
		);
	});
});

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
