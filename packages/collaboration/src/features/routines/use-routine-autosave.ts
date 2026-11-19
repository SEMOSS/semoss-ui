import type { FieldValues } from "@semoss/ui/next";
import {
	type FormAutosave,
	type FormAutosaveOptions,
	type FormAutosaveStatus,
	useFormAutosave,
} from "@/lib/use-form-autosave";

export type RoutineAutosaveStatus = FormAutosaveStatus;

const describeFlushError = (reason: string | null): string =>
	reason
		? `Your changes did not save, so the run did not start. ${reason}`
		: "Fix the highlighted settings, then run it again.";

/** A run reads the saved routine. Explain when its settings prevent the run. */
export function useRoutineAutosave<T extends FieldValues>(
	options: FormAutosaveOptions<T>,
): FormAutosave<T> {
	return useFormAutosave({ ...options, describeFlushError });
}
