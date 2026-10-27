import { z } from "@semoss/ui/next";
import { routineFlowSchema } from "./routine-flow-schema";
import { routineScheduleSchema, routineStatusSchema } from "./routine-schema";

const { enabled, timezone } = routineScheduleSchema.shape;

/** Opt-in and the time zone reviews are dated in; the routine runs when a request arrives, not on a schedule. */
export const expenseRoutineSettingsSchema = z.object({ enabled, timezone });

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
	});

export type ExpenseRoutineSettings = z.infer<
	typeof expenseRoutineSettingsSchema
>;
export type ExpenseRoutine = z.infer<typeof expenseRoutineSchema>;
