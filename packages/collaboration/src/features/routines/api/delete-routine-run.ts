import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/**
 * Delete one finished run of the owner's routine from its history. The caller sends `ROUTINE_RUNS_CHANGED` once its
 * own view has settled, so a list does not drop the row that holds focus mid-dialog.
 */
export async function deleteRoutineRun(
	actions: InsightActions,
	routineId: string,
	runId: string,
): Promise<void> {
	await callPixel(
		actions,
		pixel("WorkDeleteRoutineRun", { routineId, runId }),
		z.object({ deleted: z.literal(true) }),
	);
}
