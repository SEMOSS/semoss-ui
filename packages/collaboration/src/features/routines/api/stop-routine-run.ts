import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Stop the owner's running run of a routine, with its agent; Run now can start it again right away. */
export async function stopRoutineRun(
	actions: InsightActions,
	routineId: string,
): Promise<void> {
	await callPixel(
		actions,
		pixel("WorkStopRoutineRun", { routineId }),
		z.object({ stopped: z.literal(true) }),
	);
}
