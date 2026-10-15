import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type InboxRoutine,
	type InboxRoutineSettings,
	inboxRoutineSchema,
	inboxRoutineSettingsSchema,
} from "./inbox-routine-schema";

/** Save explicit opt-in and schedule changes through the owner's SEMOSS insight. */
export async function saveInboxRoutine(
	actions: InsightActions,
	settings: InboxRoutineSettings,
): Promise<InboxRoutine> {
	return callPixel(
		actions,
		pixel("WorkSaveInboxRoutine", {
			settings: inboxRoutineSettingsSchema.parse(settings),
		}),
		inboxRoutineSchema,
	);
}
