import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import type { RoutineId } from "../routine-schema";

/** Open the owner's saved output, or one past run's, as a conversation, reusing its room on retry. */
export async function openRoutineRoom(
	actions: InsightActions,
	routineId: RoutineId,
	startedAt?: string,
	runId?: string,
): Promise<string> {
	const { roomId } = await callPixel(
		actions,
		pixel("WorkOpenRoutineRoom", { routineId, startedAt, runId }),
		z.object({ roomId: z.string().trim().min(1) }),
	);
	return roomId;
}
