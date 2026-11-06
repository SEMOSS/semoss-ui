import { describe, expect, it } from "vitest";
import type { AutomationRunSummary } from "../../../domain/automation.types";
import {
	computeRunDashboardStats,
	toMirthStyleCounts,
} from "./run-dashboard-stats";

function run(overrides: Partial<AutomationRunSummary>): AutomationRunSummary {
	return {
		RUN_ID: "run-1",
		PROJECT_ID: "project-1",
		STARTED_AT: "2026-11-05T00:00:00Z",
		COMPLETED_AT: "2026-11-05T00:00:10Z",
		STATUS: "SUCCESS",
		TRIGGER_TYPE: "MANUAL",
		...overrides,
	};
}

describe("computeRunDashboardStats", () => {
	it("returns null rates and zero counts for an empty run list", () => {
		const stats = computeRunDashboardStats([]);
		expect(stats.totalRuns).toBe(0);
		expect(stats.successRatePct).toBeNull();
		expect(stats.avgDurationMs).toBeNull();
		expect(stats.statusCounts.SUCCESS).toBe(0);
		expect(stats.latestStatus).toBeNull();
	});

	it("reports latestStatus from the run with the most recent STARTED_AT, not list order", () => {
		const stats = computeRunDashboardStats([
			run({ STARTED_AT: "2026-11-05T00:00:00Z", STATUS: "FAILED" }),
			run({ STARTED_AT: "2026-11-05T00:00:20Z", STATUS: "SUCCESS" }),
			run({ STARTED_AT: "2026-11-05T00:00:10Z", STATUS: "CANCELLED" }),
		]);
		expect(stats.latestStatus).toBe("SUCCESS");
	});

	it("computes success rate only over finished runs, excluding RUNNING/WAITING_FOR_INPUT", () => {
		const stats = computeRunDashboardStats([
			run({ STATUS: "SUCCESS" }),
			run({ STATUS: "FAILED", COMPLETED_AT: "2026-11-05T00:00:05Z" }),
			run({ STATUS: "RUNNING", COMPLETED_AT: null }),
			run({ STATUS: "WAITING_FOR_INPUT", COMPLETED_AT: null }),
		]);
		expect(stats.totalRuns).toBe(4);
		expect(stats.successRatePct).toBe(50);
		expect(stats.statusCounts).toMatchObject({
			SUCCESS: 1,
			FAILED: 1,
			RUNNING: 1,
			WAITING_FOR_INPUT: 1,
		});
	});

	it("averages duration only over runs with a valid COMPLETED_AT", () => {
		const stats = computeRunDashboardStats([
			run({
				STARTED_AT: "2026-11-05T00:00:00Z",
				COMPLETED_AT: "2026-11-05T00:00:10Z",
			}),
			run({
				STARTED_AT: "2026-11-05T00:00:00Z",
				COMPLETED_AT: "2026-11-05T00:00:30Z",
			}),
			run({ STATUS: "RUNNING", COMPLETED_AT: null }),
		]);
		expect(stats.avgDurationMs).toBe(20_000);
	});

	it("buckets missing trigger types under UNKNOWN", () => {
		const stats = computeRunDashboardStats([
			run({ TRIGGER_TYPE: undefined }),
			run({ TRIGGER_TYPE: "SCHEDULED" }),
			run({ TRIGGER_TYPE: "PLAYGROUND" }),
		]);
		expect(stats.triggerCounts).toMatchObject({
			MANUAL: 0,
			SCHEDULED: 1,
			PLAYGROUND: 1,
			UNKNOWN: 1,
		});
	});
});

describe("toMirthStyleCounts", () => {
	it("maps run outcomes onto Received/Filtered/Queued/Sent/Errored", () => {
		const stats = computeRunDashboardStats([
			run({ STATUS: "SUCCESS" }),
			run({ STATUS: "SUCCESS" }),
			run({ STATUS: "FAILED", COMPLETED_AT: "2026-11-05T00:00:05Z" }),
			run({
				STATUS: "INTERRUPTED",
				COMPLETED_AT: "2026-11-05T00:00:05Z",
			}),
			run({ STATUS: "CANCELLED", COMPLETED_AT: "2026-11-05T00:00:05Z" }),
			run({ STATUS: "RUNNING", COMPLETED_AT: null }),
			run({ STATUS: "WAITING_FOR_INPUT", COMPLETED_AT: null }),
		]);
		expect(toMirthStyleCounts(stats)).toEqual({
			received: 7,
			filtered: 1,
			queued: 2,
			sent: 2,
			errored: 2,
		});
	});
});
