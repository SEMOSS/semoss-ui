import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { roomWriteSchema } from "./room-schemas";

/** Persist the owner's room pin; a false result is a failed write. */
export async function pinRoom(
	actions: InsightActions,
	roomId: string,
	pinned: boolean,
): Promise<void> {
	const saved = await callPixel(
		actions,
		pixel("PinRoom", { roomId, pinned }),
		roomWriteSchema,
	);
	if (!saved) throw new Error("The room pin could not be saved. Try again.");
}
