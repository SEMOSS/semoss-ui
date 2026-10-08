import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { roomSourceSchema } from "../source-import/room-source";
import { roomOptionsEnvelopeSchema } from "./room-schemas";

/** Read a saved source association without opening the room or its messages. */
export async function readRoomSourceAssociation(
	actions: InsightActions,
	roomId: string,
): Promise<string | null> {
	const { OPTIONS: options } = await callPixel(
		actions,
		pixel("GetRoomOptions", { roomId }),
		roomOptionsEnvelopeSchema,
	);
	if (options.source === undefined) return null;
	const source = roomSourceSchema.safeParse(options.source);
	if (!source.success)
		throw new Error("This session's source link could not be read.");
	return source.data.threadId;
}
