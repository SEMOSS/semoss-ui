import { z } from "@semoss/ui/next";

export const INBOX_ROUTINE_DAYS = [
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT",
	"SUN",
] as const;

const daySchema = z.enum(INBOX_ROUTINE_DAYS);

/** Owner-selected schedule and inbox bounds, shared by form and transport. */
export const inboxRoutineSettingsSchema = z.object({
	enabled: z.boolean(),
	time: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid run time."),
	days: z
		.array(daySchema)
		.min(1, "Choose at least one day.")
		.max(7)
		.refine(
			(days) => new Set(days).size === days.length,
			"Choose each day only once.",
		),
	timezone: z.string().refine((value) => {
		try {
			new Intl.DateTimeFormat("en", { timeZone: value });
			return true;
		} catch {
			return false;
		}
	}, "Enter a valid time zone, such as America/New_York."),
	emailCount: z
		.number()
		.int("Choose a whole number of emails.")
		.min(1, "Scan at least 1 email.")
		.max(100, "Scan up to 100 emails per brief."),
});

/** Validate server availability and the latest durable run before rendering. */
export const inboxRoutineSchema = inboxRoutineSettingsSchema.extend({
	id: z.literal("inbox-daily-brief"),
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
			error: z.string().nullish().default(null),
		})
		.nullish()
		.default(null),
});

export type InboxRoutineDay = z.infer<typeof daySchema>;
export type InboxRoutineSettings = z.infer<typeof inboxRoutineSettingsSchema>;
export type InboxRoutine = z.infer<typeof inboxRoutineSchema>;
