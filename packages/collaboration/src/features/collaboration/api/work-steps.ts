import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import { runBatch } from "../live/live-state";

/** What the owner can change on a step; only the keys given are sent. */
export interface WorkStepChange {
	/** `dropped` takes the step off the list without calling it done. */
	status?: "open" | "done" | "dropped";
	text?: string;
	/** Why it changed, kept with the step (for example "not mine"). */
	note?: string;
	assigneeId?: string;
}

/** Change one step of a work item. Throws when the server refuses. */
export async function updateWorkStep(
	actions: InsightActions,
	stepId: string,
	change: WorkStepChange,
): Promise<void> {
	await runBatch(actions, [pixel("WorkUpdateStep", { stepId, ...change })]);
}

/** Add a step for the owner under a work item. Throws when the server refuses. */
export async function addWorkStep(
	actions: InsightActions,
	taskId: string,
	text: string,
): Promise<void> {
	await runBatch(actions, [pixel("WorkAddStep", { taskId, text })]);
}
