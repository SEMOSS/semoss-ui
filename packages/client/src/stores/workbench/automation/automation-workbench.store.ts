import { createStore, type StoreApi } from "zustand";
import type {
	AutomationRunDetail,
	AutomationRunSummary,
	AutomationTraceSnapshot,
} from "@semoss/automation";

const isActiveRun = (run: AutomationRunSummary): boolean =>
	run.STATUS === "RUNNING" || run.STATUS === "WAITING_FOR_INPUT";

/** Run and selection state shared by the Automation workbench panels. */
export interface AutomationWorkbenchState {
	traceSnapshot: AutomationTraceSnapshot | null;
	activeRuns: AutomationRunSummary[];
	followedRunId: string | null;
	selectedRun: AutomationRunDetail | null;
	historyRefreshToken: number;
	runDetailsFocus: { nodeId: string; token: number } | null;

	setTraceSnapshot: (snapshot: AutomationTraceSnapshot) => void;
	setKnownRuns: (runs: AutomationRunSummary[]) => void;
	selectRun: (run: AutomationRunDetail) => void;
	clearSelectedRun: () => void;
	markHistoryChanged: () => void;
	focusRunNode: (nodeId: string) => void;
}

/** Creates one run-state owner for an Automation workbench instance. */
export const createAutomationWorkbenchStore =
	(): StoreApi<AutomationWorkbenchState> =>
		createStore<AutomationWorkbenchState>()((set) => ({
			traceSnapshot: null,
			activeRuns: [],
			followedRunId: null,
			selectedRun: null,
			historyRefreshToken: 0,
			runDetailsFocus: null,

			setTraceSnapshot: (snapshot) =>
				set((state) => {
					const currentRun = snapshot.activeRun;
					let activeRuns = state.activeRuns;
					let followedRunId = state.followedRunId;

					if (currentRun) {
						activeRuns = isActiveRun(currentRun)
							? [
									currentRun,
									...activeRuns.filter(
										(run) =>
											run.RUN_ID !== currentRun.RUN_ID,
									),
								]
							: activeRuns.filter(
									(run) => run.RUN_ID !== currentRun.RUN_ID,
								);
						followedRunId = isActiveRun(currentRun)
							? currentRun.RUN_ID
							: null;
					}

					return {
						traceSnapshot: snapshot,
						activeRuns,
						followedRunId,
					};
				}),

			setKnownRuns: (runs) =>
				set((state) => {
					const activeRuns = runs.filter(isActiveRun);
					return {
						activeRuns,
						followedRunId:
							state.followedRunId &&
							activeRuns.some(
								(run) => run.RUN_ID === state.followedRunId,
							)
								? state.followedRunId
								: null,
					};
				}),

			selectRun: (run) =>
				set((state) => ({
					selectedRun: run,
					activeRuns: isActiveRun(run)
						? [
								run,
								...state.activeRuns.filter(
									(candidate) =>
										candidate.RUN_ID !== run.RUN_ID,
								),
							]
						: state.activeRuns.filter(
								(candidate) => candidate.RUN_ID !== run.RUN_ID,
							),
					followedRunId: isActiveRun(run)
						? run.RUN_ID
						: state.followedRunId === run.RUN_ID
							? null
							: state.followedRunId,
				})),

			clearSelectedRun: () => set({ selectedRun: null }),

			markHistoryChanged: () =>
				set((state) => ({
					historyRefreshToken: state.historyRefreshToken + 1,
				})),

			focusRunNode: (nodeId) =>
				set((state) => ({
					runDetailsFocus: {
						nodeId,
						token: (state.runDetailsFocus?.token ?? 0) + 1,
					},
				})),
		}));
