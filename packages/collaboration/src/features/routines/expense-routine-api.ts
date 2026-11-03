import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type ExpenseRoutine,
	type ExpenseRoutineSettings,
	expenseRoutineSchema,
	expenseRoutineSettingsSchema,
} from "./expense-routine-schema";

/** Save explicit opt-in to expense reviews through the owner's SEMOSS insight. */
export async function saveExpenseRoutine(
	actions: InsightActions,
	settings: ExpenseRoutineSettings,
): Promise<ExpenseRoutine> {
	return callPixel(
		actions,
		pixel("WorkSaveExpenseRoutine", {
			settings: expenseRoutineSettingsSchema.parse(settings),
		}),
		expenseRoutineSchema,
	);
}
