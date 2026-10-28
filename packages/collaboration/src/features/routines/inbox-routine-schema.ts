import { z } from "@semoss/ui/next";
import { routineFlowSchema } from "./routine-flow-schema";
import {
	routineDaySchema,
	routinePreferencesSchema,
	routineScheduleSchema,
	routineStatusSchema,
} from "./routine-schema";

const { enabled, time, timezone } = routineScheduleSchema.shape;

/** The brief's sections in writing order; the owner may turn any off, but not all. */
export const INBOX_SECTIONS = [
	"priorities",
	"replies",
	"meetings",
	"actions",
] as const;
export const INBOX_SECTION_LABELS = {
	priorities: "Suggested priorities",
	replies: "Needs your reply",
	meetings: "Today's meetings",
	actions: "Open action items",
} as const;
/** How many suggested priorities one brief may list, matching the server limit. */
export const INBOX_PRIORITY_LIMIT = 10;

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
	preferences: routinePreferencesSchema,
	sections: z
		.array(z.enum(INBOX_SECTIONS))
		.min(1, "Keep at least one section.")
		.refine(
			(sections) => new Set(sections).size === sections.length,
			"Choose each section only once.",
		),
	priorityCount: z
		.number()
		.int("Choose a whole number of priorities.")
		.min(1, "List at least 1 priority.")
		.max(
			INBOX_PRIORITY_LIMIT,
			`List up to ${INBOX_PRIORITY_LIMIT} priorities.`,
		),
	writeDrafts: z.boolean(),
});

/** Validate server availability and the latest durable run before rendering. */
export const inboxRoutineSchema = inboxRoutineSettingsSchema
	.extend(routineStatusSchema.shape)
	.extend({
		id: z.literal("inbox-daily-brief"),
		flow: routineFlowSchema.optional(),
		// Servers before preferences return none.
		preferences: routinePreferencesSchema.default(""),
		// Servers before the brief knobs return none: the whole brief, five priorities, drafts on.
		sections: z.array(z.enum(INBOX_SECTIONS)).default([...INBOX_SECTIONS]),
		priorityCount: z.number().int().default(5),
		writeDrafts: z.boolean().default(true),
	});

export type InboxRoutineSettings = z.infer<typeof inboxRoutineSettingsSchema>;
export type InboxRoutine = z.infer<typeof inboxRoutineSchema>;
