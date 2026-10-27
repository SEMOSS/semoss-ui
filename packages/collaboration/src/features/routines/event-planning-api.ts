import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type EventPlanningRoutine,
	type EventPlanningSettings,
	eventPlanningRoutineSchema,
	eventPlanningSettingsSchema,
} from "./event-planning-schema";

/** Save explicit opt-in, the weekly schedule, and the pinned meetings through the owner's SEMOSS insight. */
export async function saveEventPlanningRoutine(
	actions: InsightActions,
	settings: EventPlanningSettings,
): Promise<EventPlanningRoutine> {
	return callPixel(
		actions,
		pixel("WorkSaveEventPlanningRoutine", {
			settings: eventPlanningSettingsSchema.parse(settings),
		}),
		eventPlanningRoutineSchema,
	);
}

const startedSchema = z.object({ status: z.string() });

/** Start a run now on the scheduler, then read the routine again so it shows as running. */
export async function runEventPlanningNow(
	actions: InsightActions,
): Promise<EventPlanningRoutine> {
	await callPixel(
		actions,
		pixel("WorkRunEventPlanningRoutine", { now: true }),
		startedSchema,
	);
	return callPixel(
		actions,
		"WorkGetEventPlanningRoutine();",
		eventPlanningRoutineSchema,
	);
}
