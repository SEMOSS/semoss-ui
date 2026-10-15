import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import type { RoutineId } from "../routine-schema";

/** Open the owner's saved output as a conversation, reusing its room on retry. */
export async function openRoutineRoom(
	actions: InsightActions,
	routineId: RoutineId,
	startedAt: string,
): Promise<string> {
	const { roomId } = await callPixel(
		actions,
		pixel("WorkOpenRoutineRoom", { routineId, startedAt }),
		z.object({ roomId: z.string().trim().min(1) }),
	);
	return roomId;
}
