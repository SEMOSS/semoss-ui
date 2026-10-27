import { z } from "@semoss/ui/next";
import { routineFlowSchema } from "./routine-flow-schema";
import {
	routineDaySchema,
	routinePreferencesSchema,
	routineScheduleSchema,
	routineStatusSchema,
} from "./routine-schema";

/** How many meetings one run plans, matching the server limit. */
export const EVENT_PLANNING_MEETING_LIMIT = 10;
/** How many meetings the owner can hide from the picker, matching the server limit. */
export const EVENT_PLANNING_IGNORED_LIMIT = 200;

/** A pinned meeting: a series by its series id, a one-off by its event id; the title names its sheet. */
export const meetingPinSchema = z.object({
	kind: z.enum(["series", "event"]),
	id: z.string().min(1).max(1024),
	title: z
		.string()
		.trim()
		.min(1, "A meeting needs a title.")
		.max(120, "Meeting titles are at most 120 characters."),
});

/** The identity of a pin, the same for a pin and the calendar option it came from. */
export function pinKey(pin: Pick<MeetingPin, "kind" | "id">): string {
	return `${pin.kind}:${pin.id}`;
}

const { enabled, time, timezone } = routineScheduleSchema.shape;

/** Owner-selected weekly schedule and the pinned meetings, shared by form and transport. */
export const eventPlanningSettingsSchema = z
	.object({
		enabled,
		time,
		days: z.array(routineDaySchema).length(1, "Choose a day."),
		timezone,
		meetings: z
			.array(meetingPinSchema)
			.max(
				EVENT_PLANNING_MEETING_LIMIT,
				`Pin up to ${EVENT_PLANNING_MEETING_LIMIT} meetings.`,
			)
			// each title names a sheet, so two pins cannot share one
			.refine(
				(meetings) =>
					new Set(meetings.map((pin) => pin.title.toLowerCase()))
						.size === meetings.length,
				"Two pinned meetings cannot have the same title.",
			),
		ignored: z
			.array(meetingPinSchema)
			.max(
				EVENT_PLANNING_IGNORED_LIMIT,
				`Ignore up to ${EVENT_PLANNING_IGNORED_LIMIT} meetings.`,
			),
		preferences: routinePreferencesSchema,
	})
	.refine((settings) => !settings.enabled || settings.meetings.length > 0, {
		message: "Pin at least one meeting to plan.",
		path: ["meetings"],
	});

/** Validate server availability and the latest durable run before rendering. */
export const eventPlanningRoutineSchema = routineScheduleSchema
	.extend({
		days: z.array(routineDaySchema).length(1),
		meetings: z.array(meetingPinSchema),
		ignored: z.array(meetingPinSchema).default([]),
		preferences: routinePreferencesSchema.default(""),
	})
	.extend(routineStatusSchema.shape)
	.extend({
		id: z.literal("event-planning"),
		// only the read names it; a save answers without it
		folder: z.string().default("Collaboration/Event Planning"),
		flow: routineFlowSchema.optional(),
	});

export type MeetingPin = z.infer<typeof meetingPinSchema>;
export type EventPlanningSettings = z.infer<typeof eventPlanningSettingsSchema>;
export type EventPlanningRoutine = z.infer<typeof eventPlanningRoutineSchema>;
