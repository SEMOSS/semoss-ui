import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type CustomRoutine,
	type CustomRoutineSettings,
	customRoutineSchema,
	customRoutineSettingsSchema,
} from "./custom-routine-schema";

/** Create (no routineId) or save one of the owner's routines. */
export async function saveCustomRoutine(
	actions: InsightActions,
	settings: CustomRoutineSettings,
	routineId?: string,
): Promise<CustomRoutine> {
	return callPixel(
		actions,
		pixel("WorkSaveCustomRoutine", {
			...customRoutineSettingsSchema.parse(settings),
			routineId,
		}),
		customRoutineSchema,
	);
}

/** Pause, resume, run now, or delete one of the owner's routines. */
export async function manageCustomRoutine(
	actions: InsightActions,
	routineId: string,
	action: "pause" | "resume" | "run" | "delete",
): Promise<void> {
	await callPixel(
		actions,
		pixel("WorkManageCustomRoutine", { routineId, action }),
		z.unknown(),
	);
}

/** Turn one of the owner's skills on or off for their assistant. */
export async function setSkillInAssistant(
	actions: InsightActions,
	skillId: string,
	use: boolean,
): Promise<void> {
	await callPixel(
		actions,
		pixel("WorkUseSkillInAssistant", { skillId, use }),
		z.unknown(),
	);
}
