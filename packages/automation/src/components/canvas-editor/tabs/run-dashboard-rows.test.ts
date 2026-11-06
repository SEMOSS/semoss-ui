import { describe, expect, it } from "vitest";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
} from "../../../domain/automation.types";
import { buildDashboardRows, loopRowKey } from "./run-dashboard-rows";

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

function node(overrides: Partial<AutomationNodeResult>): AutomationNodeResult {
	return {
		NODE_ID: "node-1",
		NODE_LABEL: "Node 1",
		STATUS: "SUCCESS",
		DURATION_MS: 5,
		OUTPUT_PREVIEW: null,
		ERROR_MESSAGE: null,
		...overrides,
	};
}

function detail(
	runId: string,
	nodeResults: AutomationNodeResult[],
): AutomationRunDetail {
	return { ...run({ RUN_ID: runId }), nodeResults };
}

describe("buildDashboardRows", () => {
	it("returns one collapsed run row per run when nothing is expanded", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" }), run({ RUN_ID: "run-2" })],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			expandedLoopKeys: new Set(),
		});
		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.kind)).toEqual(["run", "run"]);
	});

	it("does not add node rows for an expanded run whose detail hasn't loaded yet", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map(),
			loadingRunIds: new Set(["run-1"]),
			runErrors: new Map(),
			expandedLoopKeys: new Set(),
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ kind: "run", loading: true });
	});

	it("adds one node row per non-loop node once the run is expanded with loaded detail", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map([
				[
					"run-1",
					detail("run-1", [
						node({ NODE_ID: "a" }),
						node({ NODE_ID: "b" }),
					]),
				],
			]),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			expandedLoopKeys: new Set(),
		});
		expect(rows.map((row) => row.kind)).toEqual(["run", "node", "node"]);
	});

	it("reports a loop node's iteration count without expanding it by default", () => {
		const loopNode = node({
			NODE_ID: "loop-1",
			iterations: [
				{ index: 0, nodeResults: [node({ NODE_ID: "inner" })] },
				{ index: 1, nodeResults: [node({ NODE_ID: "inner" })] },
			],
		});
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map([["run-1", detail("run-1", [loopNode])]]),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			expandedLoopKeys: new Set(),
		});
		expect(rows).toHaveLength(2);
		expect(rows[1]).toMatchObject({
			kind: "node",
			isLoop: true,
			iterationCount: 2,
			expanded: false,
		});
	});

	it("adds one iteration row per loop pass when the loop is expanded — 5000 iterations yields 5000 rows", () => {
		const iterations = Array.from({ length: 5000 }, (_, index) => ({
			index,
			nodeResults: [
				node({ NODE_ID: "inner-a", DURATION_MS: 2 }),
				node({ NODE_ID: "inner-b", DURATION_MS: 3 }),
			],
		}));
		const loopNode = node({ NODE_ID: "loop-1", iterations });
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map([["run-1", detail("run-1", [loopNode])]]),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			expandedLoopKeys: new Set([loopRowKey("run-1", "loop-1")]),
		});
		const iterationRows = rows.filter((row) => row.kind === "iteration");
		expect(iterationRows).toHaveLength(5000);
		expect(iterationRows[0]).toMatchObject({
			iterationIndex: 0,
			status: "SUCCESS",
			durationMs: 5,
			stepCount: 2,
			result: expect.objectContaining({ NODE_ID: "inner-b" }),
		});
	});

	it("numbers runs 1-based in ascending STARTED_AT order, independent of input order", () => {
		const rows = buildDashboardRows({
			runs: [
				run({
					RUN_ID: "run-newest",
					STARTED_AT: "2026-11-05T02:00:00Z",
				}),
				run({
					RUN_ID: "run-oldest",
					STARTED_AT: "2026-11-05T00:00:00Z",
				}),
				run({
					RUN_ID: "run-middle",
					STARTED_AT: "2026-11-05T01:00:00Z",
				}),
			],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			expandedLoopKeys: new Set(),
		});
		const numbersById = new Map(
			rows.map((row) => [
				(row as { run: AutomationRunSummary }).run.RUN_ID,
				(row as { runNumber: number }).runNumber,
			]),
		);
		expect(numbersById.get("run-oldest")).toBe(1);
		expect(numbersById.get("run-middle")).toBe(2);
		expect(numbersById.get("run-newest")).toBe(3);
	});

	it("surfaces a run-level load error without adding node rows", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map([["run-1", "Unable to load run details."]]),
			expandedLoopKeys: new Set(),
		});
		expect(rows).toEqual([
			expect.objectContaining({
				kind: "run",
				loadError: "Unable to load run details.",
			}),
		]);
	});
});
