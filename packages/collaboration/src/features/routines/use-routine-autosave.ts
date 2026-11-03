import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "@semoss/ui/next";

export type RoutineAutosaveStatus =
	| "idle"
	| "saving"
	| "saved"
	| "error"
	| "invalid";

interface RoutineAutosaveOptions<T extends FieldValues> {
	/** The form owns the draft and its validation. */
	form: UseFormReturn<T>;
	/** Persists a validated snapshot and returns the mapped, saved form values. */
	onSave: (values: T) => Promise<T>;
}

interface RoutineAutosave<T extends FieldValues> {
	status: RoutineAutosaveStatus;
	/** Revalidates the latest draft, including after a native submission's async validation. */
	handleSubmit: (values: T) => Promise<void>;
	retry: () => void;
}

/** Debounces routine edits, serializes writes, and flushes valid edits on unmount. */
export function useRoutineAutosave<T extends FieldValues>({
	form,
	onSave,
}: RoutineAutosaveOptions<T>): RoutineAutosave<T> {
	const [status, setStatus] = useState<RoutineAutosaveStatus>("idle");
	const values = JSON.stringify(form.watch());
	const observed = useRef(values);
	const saved = useRef(values);
	const failed = useRef<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const isMounted = useRef(false);
	const isSaving = useRef(false);
	const isQueued = useRef(false);
	const save = useRef(onSave);
	useEffect(() => {
		save.current = onSave;
	}, [onSave]);

	const handleSubmit = useCallback(
		async function submit(): Promise<void> {
			clearTimeout(timer.current);
			if (isSaving.current) {
				isQueued.current = true;
				return;
			}
			const submitted = JSON.stringify(form.getValues());
			if (submitted === saved.current) {
				if (isMounted.current) {
					form.clearErrors("root.server");
					setStatus("saved");
				}
				return;
			}
			isSaving.current = true;
			failed.current = null;
			if (isMounted.current) {
				form.clearErrors("root.server");
				setStatus("saving");
			}
			try {
				await form.handleSubmit(
					async (validated) => {
						if (submitted !== JSON.stringify(form.getValues()))
							return;
						const result = await save.current(validated);
						saved.current = JSON.stringify(result);
						if (isMounted.current) {
							const current = JSON.stringify(form.getValues());
							if (current === submitted) {
								observed.current = saved.current;
								form.reset(result);
								setStatus("saved");
							} else if (current === saved.current) {
								setStatus("saved");
							}
						}
					},
					() => {
						if (!isMounted.current) return;
						if (submitted === JSON.stringify(form.getValues())) {
							setStatus("invalid");
						} else {
							form.clearErrors();
						}
					},
				)();
			} catch (error: unknown) {
				failed.current = submitted;
				if (isMounted.current) {
					form.setError("root.server", {
						type: "server",
						message:
							error instanceof Error
								? error.message
								: "Your routine could not be saved. Please try again.",
					});
					setStatus("error");
				}
			} finally {
				isSaving.current = false;
				if (isQueued.current) {
					isQueued.current = false;
					if (JSON.stringify(form.getValues()) !== failed.current) {
						await submit();
					}
				}
			}
		},
		[form],
	);

	const retry = useCallback((): void => {
		void handleSubmit();
	}, [handleSubmit]);

	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
			clearTimeout(timer.current);
			const current = JSON.stringify(form.getValues());
			if (
				(isSaving.current || current !== saved.current) &&
				current !== failed.current
			) {
				retry();
			}
		};
	}, [form, retry]);

	useEffect(() => {
		if (values === observed.current) return;
		observed.current = values;
		failed.current = null;
		isQueued.current = false;
		form.clearErrors("root.server");
		if (values === saved.current && !isSaving.current) {
			setStatus("saved");
			return;
		}
		setStatus("saving");
		timer.current = setTimeout(retry, 750);
		return () => clearTimeout(timer.current);
	}, [form, retry, values]);

	return { status, handleSubmit, retry };
}
