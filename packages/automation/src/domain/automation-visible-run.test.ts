import { describe, expect, it } from "vitest";
import type { AutomationRunDetail } from "./automation.types";
import { getVisibleRun } from "./automation-visible-run";

const run = (id: string, executionInsightId?: string) =>
	({ RUN_ID: id, executionInsightId }) as unknown as AutomationRunDetail;

describe("getVisibleRun", () => {
	it("shows the live run while one is running, even over a selected run", () => {
		const live = run("live", "live-insight");

		expect(
			getVisibleRun({ running: true, activeRun: live }, run("old")),
		).toBe(live);
	});

	it("shows the selected run when nothing is running", () => {
		const selected = run("old", "old-insight");

		expect(
			getVisibleRun(
				{ running: false, activeRun: run("live", "live-insight") },
				selected,
			),
		).toBe(selected);
	});

	it("falls back to a finished live run that still has a workspace", () => {
		const live = run("live", "live-insight");

		expect(getVisibleRun({ running: false, activeRun: live }, null)).toBe(
			live,
		);
	});

	it("shows nothing when the live run has no workspace and none is selected", () => {
		expect(
			getVisibleRun({ running: false, activeRun: run("live") }, null),
		).toBeNull();
		expect(getVisibleRun(null, null)).toBeNull();
	});
});
