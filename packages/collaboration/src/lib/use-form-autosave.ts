import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "@semoss/ui/next";

export type FormAutosaveStatus =
	| "idle"
	| "saving"
	| "saved"
	| "error"
	| "invalid";

export interface FormAutosaveOptions<T extends FieldValues> {
	/** The form owns the draft and its validation. */
	form: UseFormReturn<T>;
	/** Persists a validated snapshot and returns the mapped, saved form values. */
	onSave: (values: T) => Promise<T>;
	/** Identifies the draft, including values such as File that JSON alone cannot distinguish. */
	getKey?: (values: T) => string;
	/** Wording for the action waiting on a flush. A null reason means field validation failed. */
	describeFlushError?: (reason: string | null) => string;
}

export interface FormAutosave<T extends FieldValues> {
	status: FormAutosaveStatus;
	/** Revalidates the latest draft, including after a native submission's async validation. */
	handleSubmit: (values: T) => Promise<void>;
	retry: () => void;
	/** Saves the draft now, after any write in flight; rejects when the draft is invalid or does not save. */
	flush: () => Promise<void>;
	/** Includes writes in flight and partially written drafts. */
	hasUnsavedChanges: () => boolean;
}

const defaultFlushError = (reason: string | null): string =>
	reason || "Check the highlighted fields.";

/** Debounces form edits, serializes writes, and flushes valid edits on unmount. */
export function useFormAutosave<T extends FieldValues>({
	form,
	onSave,
	getKey = JSON.stringify,
	describeFlushError = defaultFlushError,
}: FormAutosaveOptions<T>): FormAutosave<T> {
	const [status, setStatus] = useState<FormAutosaveStatus>("idle");
	const values = getKey(form.watch());
	const observed = useRef(values);
	const saved = useRef<string | null>(values);
	const failed = useRef<string | null>(null);
	const failure = useRef("");
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const isMounted = useRef(false);
	const isSaving = useRef(false);
	// settles when the write in flight, and any edit queued behind it, is done
	const saving = useRef<Promise<void>>(Promise.resolve());
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
			const submitted = getKey(form.getValues());
			if (submitted === saved.current) {
				if (isMounted.current) {
					form.clearErrors("root.server");
					setStatus("saved");
				}
				return;
			}
			isSaving.current = true;
			let settle = (): void => undefined;
			saving.current = new Promise((resolve) => {
				settle = resolve;
			});
			failed.current = null;
			if (isMounted.current) {
				form.clearErrors("root.server");
				setStatus("saving");
			}
			try {
				await form.handleSubmit(
					async (validated) => {
						if (submitted !== getKey(form.getValues())) return;
						const result = await save.current(validated);
						saved.current = getKey(result);
						if (isMounted.current) {
							const current = getKey(form.getValues());
							if (current === submitted) {
								observed.current = saved.current;
								form.reset(result, {
									keepValues: submitted === saved.current,
								});
								setStatus("saved");
							} else if (current === saved.current) {
								setStatus("saved");
							}
						}
					},
					() => {
						if (!isMounted.current) return;
						if (submitted === getKey(form.getValues())) {
							setStatus("invalid");
						} else {
							form.clearErrors();
						}
					},
				)();
			} catch (error: unknown) {
				// A multi-step write may have partially committed, even when the draft is reverted.
				saved.current = null;
				failed.current = submitted;
				failure.current =
					error instanceof Error
						? error.message
						: "Your changes could not be saved. Please try again.";
				if (
					isMounted.current &&
					submitted === getKey(form.getValues())
				) {
					form.setError("root.server", {
						type: "server",
						message: failure.current,
					});
					setStatus("error");
				}
			} finally {
				isSaving.current = false;
				if (isQueued.current) {
					isQueued.current = false;
					if (getKey(form.getValues()) !== failed.current) {
						await submit();
					}
				}
				settle();
			}
		},
		[form, getKey],
	);

	const retry = useCallback((): void => {
		void handleSubmit();
	}, [handleSubmit]);

	const flush = useCallback(async (): Promise<void> => {
		// Navigation or a routine run may be waiting while the user keeps typing.
		for (;;) {
			clearTimeout(timer.current);
			while (isSaving.current) await saving.current;
			const submitted = getKey(form.getValues());
			if (submitted === saved.current) return;
			await handleSubmit();
			const current = getKey(form.getValues());
			if (current === saved.current) return;
			if (current === submitted) {
				throw new Error(
					describeFlushError(
						current === failed.current ? failure.current : null,
					),
				);
			}
		}
	}, [form, getKey, handleSubmit, describeFlushError]);

	const hasUnsavedChanges = useCallback(
		() => isSaving.current || getKey(form.getValues()) !== saved.current,
		[form, getKey],
	);

	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
			clearTimeout(timer.current);
			const current = getKey(form.getValues());
			if (
				(isSaving.current || current !== saved.current) &&
				current !== failed.current
			) {
				retry();
			}
		};
	}, [form, retry, getKey]);

	useEffect(() => {
		if (values === observed.current) return;
		observed.current = values;
		failed.current = null;
		isQueued.current = false;
		form.clearErrors("root.server");
		if (values === saved.current && !isSaving.current) {
			form.clearErrors();
			setStatus("saved");
			return;
		}
		setStatus("saving");
		timer.current = setTimeout(retry, 750);
		return () => clearTimeout(timer.current);
	}, [form, retry, values]);

	return { status, handleSubmit, retry, flush, hasUnsavedChanges };
}
