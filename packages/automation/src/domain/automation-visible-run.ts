import type { AutomationRunDetail } from "./automation.types";

/**
 * The run whose workspace files the workbench shows: the live run while one is
 * running, otherwise the selected historical run, otherwise the latest live
 * run that still has a workspace.
 *
 * A newly started run owns this even if a historical selection has not
 * finished clearing from the shared workbench store.
 *
 * @param trace - The trace snapshot's running flag and live run.
 * @param selectedRun - The run selected in the workbench run store.
 * @return The run to show, or null when none applies.
 */
export function getVisibleRun(
	trace: {
		running: boolean;
		activeRun?: AutomationRunDetail | null;
	} | null,
	selectedRun: AutomationRunDetail | null,
): AutomationRunDetail | null {
	const activeRun = trace?.activeRun ?? null;
	if (trace?.running) return activeRun;
	return selectedRun ?? (activeRun?.executionInsightId ? activeRun : null);
}
