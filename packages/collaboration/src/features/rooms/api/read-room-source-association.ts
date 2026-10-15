import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { roomSourceSchema } from "../source-import/room-source";
import { roomOptionsEnvelopeSchema } from "./room-schemas";

/** Read source identity and delegation status without opening room messages. */
export async function readRoomSourceAssociation(
	actions: InsightActions,
	roomId: string,
): Promise<{ threadId: string | null; isDelegation: boolean }> {
	const { OPTIONS: options } = await callPixel(
		actions,
		pixel("GetRoomOptions", { roomId }),
		roomOptionsEnvelopeSchema,
	);
	const delegation = options.delegation_action_id;
	const isDelegation =
		delegation != null &&
		(typeof delegation !== "string" || delegation.trim() !== "");
	if (options.source === undefined) return { threadId: null, isDelegation };
	const source = roomSourceSchema.safeParse(options.source);
	if (!source.success)
		throw new Error("This session's source link could not be read.");
	return { threadId: source.data.threadId, isDelegation };
}
