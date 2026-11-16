import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Sent on `window` after a run is deleted here, so its routine's History and latest result re-read. */
export const ROUTINE_RUN_DELETED = "collaboration:routine-run-deleted";

/**
 * Delete one finished run of the owner's routine from its history, with the chats opened from it and the rooms its
 * agent worked in; resolves to those rooms' ids. The caller sends `ROUTINE_RUNS_CHANGED` and `ROUTINE_RUN_DELETED`
 * once its own view has settled, so a list does not drop the row that holds focus mid-dialog.
 */
export async function deleteRoutineRun(
	actions: InsightActions,
	routineId: string,
	runId: string,
): Promise<string[]> {
	const { roomIds } = await callPixel(
		actions,
		pixel("WorkDeleteRoutineRun", { routineId, runId }),
		z.object({ deleted: z.literal(true), roomIds: z.array(z.string()) }),
	);
	return roomIds;
}
