import { z } from "@semoss/ui/next";

/** Routines whose completed output can be opened as a conversation. */
export type RoutineId =
	| "inbox-daily-brief"
	| "weekly-meeting-agendas"
	// the id of one of the owner's own routines
	| (string & {});

export const ROUTINE_DAYS = [
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT",
	"SUN",
] as const;

/** Full weekday names for labels; the short form is the first three letters. */
export const ROUTINE_DAY_NAMES = {
	MON: "Monday",
	TUE: "Tuesday",
	WED: "Wednesday",
	THU: "Thursday",
	FRI: "Friday",
	SAT: "Saturday",
	SUN: "Sunday",
} as const;

export const routineDaySchema = z.enum(ROUTINE_DAYS);

/** Opt-in, local run time, and time zone every routine schedule shares. */
export const routineScheduleSchema = z.object({
	enabled: z.boolean(),
	time: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid run time."),
	timezone: z.string().refine((value) => {
		try {
			new Intl.DateTimeFormat("en", { timeZone: value });
			return true;
		} catch {
			return false;
		}
	}, "Enter a valid time zone, such as America/New_York."),
});

/** Server availability and the latest durable run, reported for every routine. */
export const routineStatusSchema = z.object({
	configured: z.boolean(),
	nextRunAt: z.iso.datetime().nullish().default(null),
	schedulerAvailable: z.boolean(),
	assistantAvailable: z.boolean(),
	mailboxAvailable: z.boolean(),
	availabilityMessage: z.string().nullish().default(null),
	lastRun: z
		.object({
			status: z.enum(["running", "completed", "failed"]),
			startedAt: z.iso.datetime(),
			finishedAt: z.iso.datetime().nullish().default(null),
			roomId: z.string().min(1).nullish().default(null),
			summary: z.string().nullish().default(null),
			html: z.string().nullish(),
			error: z.string().nullish().default(null),
			// connection, model, agent, delivery or interrupted; null on older runs
			errorCause: z.string().nullish(),
		})
		.nullish()
		.default(null),
});

export type RoutineDay = z.infer<typeof routineDaySchema>;
/** What the shared result view and form parts read from either routine. */
export type RoutineStatus = z.infer<typeof routineStatusSchema> & {
	enabled: boolean;
	timezone: string;
};
