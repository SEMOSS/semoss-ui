import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Persist a room's pinned state for the current user. */
export async function pinRoom(
	actions: InsightActions,
	roomId: string,
	pinned: boolean,
): Promise<boolean> {
	return callPixel(
		actions,
		pixel("PinRoom", { roomId, pinned }),
		z.boolean(),
	);
}
