import { z } from "@semoss/ui/next";
import {
	routineDaySchema,
	routineScheduleSchema,
	routineStatusSchema,
} from "./routine-schema";

/** How many meetings one weekly run prepares, matching the server limit. */
export const AGENDA_MEETING_LIMIT = 20;
/** How many meetings the owner can hide from the picker, matching the server limit. */
export const AGENDA_IGNORED_LIMIT = 200;

const meetingTitle = z
	.string()
	.trim()
	.min(1, "A meeting needs a title.")
	.max(255, "Meeting titles are at most 255 characters.");

const { enabled, time, timezone } = routineScheduleSchema.shape;

/** Owner-selected weekly schedule and the meetings to prepare, shared by form and transport. */
export const agendaRoutineSettingsSchema = z
	.object({
		enabled,
		time,
		days: z.array(routineDaySchema).length(1, "Choose a day."),
		timezone,
		meetings: z
			.array(meetingTitle)
			.max(
				AGENDA_MEETING_LIMIT,
				`Choose up to ${AGENDA_MEETING_LIMIT} meetings.`,
			)
			.refine(
				(meetings) =>
					new Set(meetings.map((title) => title.toLowerCase()))
						.size === meetings.length,
				"Choose each meeting only once.",
			),
		// Hidden from the picker only; runs read meetings alone.
		ignored: z
			.array(meetingTitle)
			.max(
				AGENDA_IGNORED_LIMIT,
				`Ignore up to ${AGENDA_IGNORED_LIMIT} meetings.`,
			),
	})
	.refine((settings) => !settings.enabled || settings.meetings.length > 0, {
		message: "Choose at least one meeting to prepare.",
		path: ["meetings"],
	});

/** Validate server availability and the latest durable run before rendering. */
export const agendaRoutineSchema = routineScheduleSchema
	.extend({
		days: z.array(routineDaySchema).length(1),
		meetings: z.array(z.string()),
		// Settings saved before the ignore list existed have none.
		ignored: z.array(z.string()).default([]),
	})
	.extend(routineStatusSchema.shape)
	.extend({ id: z.literal("weekly-meeting-agendas") });

export type AgendaRoutineSettings = z.infer<typeof agendaRoutineSettingsSchema>;
export type AgendaRoutine = z.infer<typeof agendaRoutineSchema>;
