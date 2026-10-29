import { z } from "@semoss/ui/next";
import { routineFlowSchema } from "./routine-flow-schema";
import { routineScheduleSchema, routineStatusSchema } from "./routine-schema";

const { enabled, timezone } = routineScheduleSchema.shape;

/** How many addresses one owner can copy each review to, matching the server limit. */
export const EXPENSE_RECIPIENT_LIMIT = 10;

/**
 * Opt-in, the time zone reviews are dated in, and who else gets each review;
 * the routine runs when a request arrives, not on a schedule.
 */
export const expenseRoutineSettingsSchema = z.object({
	enabled,
	timezone,
	recipients: z
		.array(z.email("Enter email addresses separated by commas."))
		.max(
			EXPENSE_RECIPIENT_LIMIT,
			`Copy each review to at most ${EXPENSE_RECIPIENT_LIMIT} addresses.`,
		),
});

/** Validate server availability and the latest durable run before rendering. */
export const expenseRoutineSchema = expenseRoutineSettingsSchema
	.extend(routineStatusSchema.shape)
	.extend({
		id: z.literal("expense-review"),
		/** The fixed routine id of the guideline documents folder. */
		documentsId: z.string().min(1),
		/** The mail subject prefixes that start a review. */
		subjects: z.array(z.string()),
		flow: routineFlowSchema.optional(),
		// Servers before review copies return none.
		recipients: z.array(z.string()).default([]),
	});

export type ExpenseRoutineSettings = z.infer<
	typeof expenseRoutineSettingsSchema
>;
export type ExpenseRoutine = z.infer<typeof expenseRoutineSchema>;
