import { describe, expect, it } from "vitest";
import type {
	AutomationRunDetail,
	AutomationRunSummary,
	AutomationTraceSnapshot,
} from "@semoss/automation";
import { createAutomationWorkbenchStore } from "./automation-workbench.store";

const runSummary = (
	id: string,
	status: AutomationRunSummary["STATUS"],
): AutomationRunSummary => ({
	RUN_ID: id,
	PROJECT_ID: "project-1",
	STARTED_AT: "2026-10-01T12:00:00Z",
	COMPLETED_AT: null,
	STATUS: status,
});

const runDetail = (
	id: string,
	status: AutomationRunDetail["STATUS"],
): AutomationRunDetail => ({
	...runSummary(id, status),
	nodeResults: [],
});

const trace = (run: AutomationRunDetail): AutomationTraceSnapshot => ({
	running: run.STATUS === "RUNNING",
	latestRunStatus: run.STATUS,
	aiRunSummary: null,
	generatingAiSummary: false,
	steps: [],
	results: [],
	executedDefinition: null,
	activeRun: run,
});

describe("Automation workbench store", () => {
	it("tracks every active run reported by run history", () => {
		const store = createAutomationWorkbenchStore();
		store
			.getState()
			.setKnownRuns([
				runSummary("run-1", "RUNNING"),
				runSummary("run-2", "WAITING_FOR_INPUT"),
				runSummary("run-3", "SUCCESS"),
			]);

		expect(store.getState().activeRuns.map((run) => run.RUN_ID)).toEqual([
			"run-1",
			"run-2",
		]);
	});

	it("owns the followed run and removes it when execution completes", () => {
		const store = createAutomationWorkbenchStore();
		store.getState().setTraceSnapshot(trace(runDetail("run-1", "RUNNING")));

		expect(store.getState().followedRunId).toBe("run-1");

		store.getState().setTraceSnapshot(trace(runDetail("run-1", "SUCCESS")));
		expect(store.getState().followedRunId).toBeNull();
		expect(store.getState().activeRuns).toEqual([]);
	});

	it("stops following an opened run after polling observes completion", () => {
		const store = createAutomationWorkbenchStore();
		store.getState().selectRun(runDetail("run-1", "RUNNING"));
		store.getState().selectRun(runDetail("run-1", "SUCCESS"));

		expect(store.getState().followedRunId).toBeNull();
		expect(store.getState().activeRuns).toEqual([]);
	});

	it("keeps historical selection and focus requests in one state owner", () => {
		const store = createAutomationWorkbenchStore();
		const run = runDetail("run-1", "SUCCESS");

		store.getState().selectRun(run);
		store.getState().focusRunNode("node-1");
		store.getState().focusRunNode("node-1");
		store.getState().markHistoryChanged();

		expect(store.getState().selectedRun).toBe(run);
		expect(store.getState().runDetailsFocus).toEqual({
			nodeId: "node-1",
			token: 2,
		});
		expect(store.getState().historyRefreshToken).toBe(1);

		store.getState().clearSelectedRun();
		expect(store.getState().selectedRun).toBeNull();
	});
});
