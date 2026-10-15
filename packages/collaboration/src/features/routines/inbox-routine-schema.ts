import { z } from "@semoss/ui/next";
import {
	routineDaySchema,
	routineScheduleSchema,
	routineStatusSchema,
} from "./routine-schema";

const { enabled, time, timezone } = routineScheduleSchema.shape;

/** Owner-selected schedule and inbox bounds, shared by form and transport. */
export const inboxRoutineSettingsSchema = z.object({
	enabled,
	time,
	days: z
		.array(routineDaySchema)
		.min(1, "Choose at least one day.")
		.max(7)
		.refine(
			(days) => new Set(days).size === days.length,
			"Choose each day only once.",
		),
	timezone,
	emailCount: z
		.number()
		.int("Choose a whole number of emails.")
		.min(1, "Scan at least 1 email.")
		.max(100, "Scan up to 100 emails per brief."),
});

/** Validate server availability and the latest durable run before rendering. */
export const inboxRoutineSchema = inboxRoutineSettingsSchema
	.extend(routineStatusSchema.shape)
	.extend({ id: z.literal("inbox-daily-brief") });

export type InboxRoutineSettings = z.infer<typeof inboxRoutineSettingsSchema>;
export type InboxRoutine = z.infer<typeof inboxRoutineSchema>;
