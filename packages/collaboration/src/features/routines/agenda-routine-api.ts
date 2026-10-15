import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type AgendaRoutine,
	type AgendaRoutineSettings,
	agendaRoutineSchema,
	agendaRoutineSettingsSchema,
} from "./agenda-routine-schema";

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
