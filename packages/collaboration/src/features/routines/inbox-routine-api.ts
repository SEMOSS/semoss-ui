import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { ROUTINE_RUNS_CHANGED } from "./api/list-recent-routine-runs";
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

const startedSchema = z.object({ status: z.string() });

/** Start a brief now on the scheduler, then read the routine again so it shows as running. */
export async function runInboxRoutineNow(
	actions: InsightActions,
): Promise<InboxRoutine> {
	await callPixel(
		actions,
		pixel("WorkRunInboxRoutine", { now: true }),
		startedSchema,
	);
	window.dispatchEvent(new Event(ROUTINE_RUNS_CHANGED));
	return callPixel(actions, "WorkGetInboxRoutine();", inboxRoutineSchema);
}
