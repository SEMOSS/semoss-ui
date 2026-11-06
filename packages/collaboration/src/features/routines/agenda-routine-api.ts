import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type AgendaRoutine,
	type AgendaRoutineSettings,
	agendaRoutineSchema,
	agendaRoutineSettingsSchema,
} from "./agenda-routine-schema";
import { ROUTINE_RUNS_CHANGED } from "./api/list-recent-routine-runs";

/** Save explicit opt-in, the weekly schedule, and the chosen meetings through the owner's SEMOSS insight. */
export async function saveAgendaRoutine(
	actions: InsightActions,
	settings: AgendaRoutineSettings,
): Promise<AgendaRoutine> {
	return callPixel(
		actions,
		pixel("WorkSaveAgendaRoutine", {
			settings: agendaRoutineSettingsSchema.parse(settings),
		}),
		agendaRoutineSchema,
	);
}

const startedSchema = z.object({ status: z.string() });

/** Start the agendas now on the scheduler, then read the routine again so it shows as running. */
export async function runAgendaRoutineNow(
	actions: InsightActions,
): Promise<AgendaRoutine> {
	await callPixel(
		actions,
		pixel("WorkRunAgendaRoutine", { now: true }),
		startedSchema,
	);
	window.dispatchEvent(new Event(ROUTINE_RUNS_CHANGED));
	return callPixel(actions, "WorkGetAgendaRoutine();", agendaRoutineSchema);
}
