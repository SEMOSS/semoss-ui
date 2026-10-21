import { z } from "@semoss/ui/next";
import { routineFlowSchema } from "./routine-flow-schema";
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
	lookbackHours: z
		.number()
		.int("Choose a whole number of hours.")
		.min(1, "Look back at least 1 hour.")
		.max(720, "Look back up to 30 days (720 hours)."),
});

/** Validate server availability and the latest durable run before rendering. */
export const inboxRoutineSchema = inboxRoutineSettingsSchema
	.extend(routineStatusSchema.shape)
	.extend({
		id: z.literal("inbox-daily-brief"),
		flow: routineFlowSchema.optional(),
	});

export type InboxRoutineSettings = z.infer<typeof inboxRoutineSettingsSchema>;
export type InboxRoutine = z.infer<typeof inboxRoutineSchema>;
