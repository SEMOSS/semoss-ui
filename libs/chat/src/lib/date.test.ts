import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDateBucket, normalizeTimestamp } from "./date";

describe("normalizeTimestamp", () => {
	it("appends Z to a timestamp with no timezone", () => {
		expect(normalizeTimestamp("2026-06-22 17:48:07").toISOString()).toBe(
			"2026-06-22T17:48:07.000Z",
		);
	});

	it("leaves a timestamp that already has Z untouched", () => {
		expect(normalizeTimestamp("2026-06-22T17:48:07Z").toISOString()).toBe(
			"2026-06-22T17:48:07.000Z",
		);
	});

	it("leaves a timestamp with a numeric offset untouched", () => {
		expect(
			normalizeTimestamp("2026-06-22T17:48:07+05:00").toISOString(),
		).toBe("2026-06-22T12:48:07.000Z");
	});
});

describe("getDateBucket", () => {
	const NOW = new Date("2026-06-22T12:00:00.000Z");

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("buckets a timestamp from today as today", () => {
		expect(getDateBucket(dayjs("2026-06-22T12:00:00.000Z"))).toBe("today");
	});

	it("buckets yesterday", () => {
		expect(getDateBucket(dayjs("2026-06-21T12:00:00.000Z"))).toBe(
			"yesterday",
		);
	});

	it("buckets 2 days ago as fewDaysAgo", () => {
		expect(getDateBucket(dayjs("2026-06-20T12:00:00.000Z"))).toBe(
			"fewDaysAgo",
		);
	});

	it("buckets 5 days ago as lastWeek", () => {
		expect(getDateBucket(dayjs("2026-06-17T12:00:00.000Z"))).toBe(
			"lastWeek",
		);
	});

	it("buckets earlier this month as thisMonth", () => {
		expect(getDateBucket(dayjs("2026-06-02T12:00:00.000Z"))).toBe(
			"thisMonth",
		);
	});

	it("buckets last month as lastMonth", () => {
		expect(getDateBucket(dayjs("2026-05-15T12:00:00.000Z"))).toBe(
			"lastMonth",
		);
	});

	it("buckets anything older as older", () => {
		expect(getDateBucket(dayjs("2026-01-01T12:00:00.000Z"))).toBe("older");
	});
});
