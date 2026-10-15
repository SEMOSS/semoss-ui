import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useForm, z, zodResolver } from "@semoss/ui/next";
import { useRoutineAutosave } from "./use-routine-autosave";

const schema = z.object({
	time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid time."),
	emailCount: z.string().regex(/^\d+$/, "Choose a number."),
});
type Values = z.infer<typeof schema>;
const initial: Values = { time: "08:00", emailCount: "25" };

/** A request whose response can be delivered after more edits. */
function deferred() {
	let finish: (values: Values) => void = () => undefined;
	const promise = new Promise<Values>((resolve) => {
		finish = resolve;
	});
	return { promise, resolve: (values: Values) => finish(values) };
}

/** Exercises the public form API with actual schema validation and subscriptions. */
function renderAutosave(
	onSave = vi.fn(async (values: Values) => values),
	resolver = zodResolver(schema),
) {
	return {
		onSave,
		...renderHook(
			() => {
				const form = useForm<Values>({
					defaultValues: initial,
					resolver,
					shouldFocusError: false,
				});
				return {
					form,
					error: form.formState.errors.root?.server?.message,
					...useRoutineAutosave({ form, onSave }),
				};
			},
			{ wrapper: StrictMode },
		),
	};
}

async function advance(ms = 750): Promise<void> {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
	await act(async () => cleanup());
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("routine autosave", () => {
	it("does not save initial mapped defaults, including a Strict Mode remount", async () => {
		const { result, onSave, rerender } = renderAutosave();
		rerender();
		await advance(2000);
		expect(onSave).not.toHaveBeenCalled();
		expect(result.current.status).toBe("idle");
		expect(result.current.form.getValues()).toEqual(initial);
	});

	it("debounces changes and saves the latest typed values once", async () => {
		const { result, onSave } = renderAutosave();
		act(() => result.current.form.setValue("emailCount", "3"));
		expect(result.current.status).toBe("saving");
		await advance(500);
		act(() => result.current.form.setValue("emailCount", "30"));
		await advance(749);
		expect(onSave).not.toHaveBeenCalled();
		await advance(1);
		expect(onSave).toHaveBeenCalledExactlyOnceWith({
			...initial,
			emailCount: "30",
		});
		expect(result.current.status).toBe("saved");
		await advance(2000);
		expect(onSave).toHaveBeenCalledTimes(1);
	});

	it("serializes later edits and never resets them to an older response", async () => {
		const first = deferred();
		const onSave = vi
			.fn(async (values: Values) => values)
			.mockReturnValueOnce(first.promise);
		const { result } = renderAutosave(onSave);
		act(() => result.current.form.setValue("time", "09:00"));
		await advance();
		act(() => result.current.form.setValue("time", "10:00"));
		await advance();
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(result.current.form.getValues("time")).toBe("10:00");
		await act(async () => first.resolve({ ...initial, time: "09:00" }));
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(onSave).toHaveBeenLastCalledWith({ ...initial, time: "10:00" });
		expect(result.current.form.getValues("time")).toBe("10:00");
		expect(result.current.status).toBe("saved");
	});

	it("saves a reversal even when it matches the old defaults during a request", async () => {
		const first = deferred();
		const onSave = vi
			.fn(async (values: Values) => values)
			.mockReturnValueOnce(first.promise);
		const { result } = renderAutosave(onSave);
		act(() => result.current.form.setValue("time", "09:00"));
		await advance();
		act(() => result.current.form.setValue("time", "08:00"));
		await advance();
		await act(async () => first.resolve({ ...initial, time: "09:00" }));
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(onSave).toHaveBeenLastCalledWith(initial);
		expect(result.current.form.getValues()).toEqual(initial);
		expect(result.current.status).toBe("saved");
	});

	it("debounces a fresh edit even after an earlier edit was queued behind a request", async () => {
		const first = deferred();
		const onSave = vi
			.fn(async (values: Values) => values)
			.mockReturnValueOnce(first.promise);
		const { result } = renderAutosave(onSave);
		act(() => result.current.form.setValue("time", "09:00"));
		await advance();
		act(() => result.current.form.setValue("time", "10:00"));
		await advance();
		act(() => result.current.form.setValue("time", "11:00"));
		await act(async () => first.resolve({ ...initial, time: "09:00" }));
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(result.current.form.getValues("time")).toBe("11:00");
		await advance();
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(onSave).toHaveBeenLastCalledWith({ ...initial, time: "11:00" });
	});

	it("retains a rejected draft without retrying until asked", async () => {
		const onSave = vi
			.fn(async (values: Values) => values)
			.mockRejectedValueOnce(new Error("Mailbox unavailable"));
		const { result } = renderAutosave(onSave);
		act(() => result.current.form.setValue("time", "09:00"));
		await advance();
		expect(result.current.status).toBe("error");
		expect(result.current.form.getValues("time")).toBe("09:00");
		expect(result.current.error).toBe("Mailbox unavailable");
		await advance(5000);
		expect(onSave).toHaveBeenCalledTimes(1);
		await act(async () => result.current.retry());
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(result.current.status).toBe("saved");
	});

	it("drops an older queued valid draft when the latest input is invalid", async () => {
		const first = deferred();
		const onSave = vi
			.fn(async (values: Values) => values)
			.mockReturnValueOnce(first.promise);
		const { result } = renderAutosave(onSave);
		act(() => result.current.form.setValue("time", "09:00"));
		await advance();
		act(() => result.current.form.setValue("time", "10:00"));
		await advance();
		act(() => result.current.form.setValue("time", ""));
		await advance();
		expect(result.current.status).toBe("saving");
		await act(async () => first.resolve({ ...initial, time: "09:00" }));
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(result.current.form.getValues("time")).toBe("");
		expect(result.current.status).toBe("invalid");
		expect(result.current.form.getFieldState("time").error?.message).toBe(
			"Choose a valid time.",
		);
		act(() => result.current.form.setValue("time", "11:00"));
		await advance();
		expect(onSave).toHaveBeenLastCalledWith({ ...initial, time: "11:00" });
	});

	it("does not send a valid value superseded by invalid input before debounce", async () => {
		const { result, onSave } = renderAutosave();
		act(() => result.current.form.setValue("emailCount", "30"));
		await advance(500);
		act(() => result.current.form.setValue("emailCount", ""));
		await advance();
		expect(onSave).not.toHaveBeenCalled();
		expect(result.current.status).toBe("invalid");
	});

	it.each(["09:00", ""])(
		"discards stale validation of %j and validates the latest queued edit",
		async (older) => {
			const delayed = deferred();
			const validate = zodResolver(schema);
			const resolver: typeof validate = async (
				values,
				context,
				options,
			) => {
				const parsed = await validate(values, context, options);
				if (values.time === older) await delayed.promise;
				return parsed;
			};
			const onSave = vi.fn(async (values: Values) => values);
			const { result } = renderAutosave(onSave, resolver);
			act(() => result.current.form.setValue("time", older));
			await advance();
			act(() => result.current.form.setValue("time", "10:00"));
			await advance();
			expect(onSave).not.toHaveBeenCalled();
			await act(async () => delayed.resolve(initial));
			expect(onSave).toHaveBeenCalledExactlyOnceWith({
				...initial,
				time: "10:00",
			});
			expect(result.current.form.getValues("time")).toBe("10:00");
			expect(
				result.current.form.getFieldState("time").error,
			).toBeUndefined();
			expect(result.current.status).toBe("saved");
		},
	);

	it("does not overwrite edits when a native submit finishes validating an older draft", async () => {
		const delayed = deferred();
		const validate = zodResolver(schema);
		let isFirst = true;
		const resolver: typeof validate = async (values, context, options) => {
			const parsed = await validate(values, context, options);
			if (isFirst) {
				isFirst = false;
				await delayed.promise;
			}
			return parsed;
		};
		const onSave = vi.fn(async (values: Values) => values);
		const { result } = renderAutosave(onSave, resolver);
		act(() => result.current.form.setValue("time", "09:00"));
		let submission: Promise<void> | undefined;
		await act(async () => {
			submission = result.current.form.handleSubmit(
				result.current.handleSubmit,
			)();
		});
		act(() => result.current.form.setValue("time", "10:00"));
		await advance();
		await act(async () => {
			delayed.resolve(initial);
			await submission;
		});
		expect(onSave).toHaveBeenCalledExactlyOnceWith({
			...initial,
			time: "10:00",
		});
		expect(result.current.form.getValues("time")).toBe("10:00");
		expect(result.current.status).toBe("saved");
	});

	it("flushes the latest valid edit on cleanup without resetting the closed form", async () => {
		const pending = deferred();
		const onSave = vi.fn((_values: Values) => pending.promise);
		const { result, unmount } = renderAutosave(onSave);
		const reset = vi.spyOn(result.current.form, "reset");
		act(() => result.current.form.setValue("time", "09:00"));
		await act(async () => unmount());
		expect(onSave).toHaveBeenCalledExactlyOnceWith({
			...initial,
			time: "09:00",
		});
		await act(async () => pending.resolve({ ...initial, time: "09:00" }));
		expect(reset).not.toHaveBeenCalled();
		await advance(2000);
		expect(onSave).toHaveBeenCalledTimes(1);
	});

	it("flushes a later edit after an in-flight write finishes during cleanup", async () => {
		const first = deferred();
		const onSave = vi
			.fn(async (values: Values) => values)
			.mockReturnValueOnce(first.promise);
		const { result, unmount } = renderAutosave(onSave);
		act(() => result.current.form.setValue("time", "09:00"));
		await advance();
		act(() => result.current.form.setValue("time", "10:00"));
		act(() => result.current.form.setValue("time", "11:00"));
		await act(async () => unmount());
		expect(onSave).toHaveBeenCalledTimes(1);
		await act(async () => first.resolve({ ...initial, time: "09:00" }));
		expect(onSave).toHaveBeenCalledTimes(2);
		expect(onSave).toHaveBeenLastCalledWith({ ...initial, time: "11:00" });
	});

	it("does not retry a failed snapshot or send invalid values on cleanup", async () => {
		const onSave = vi
			.fn<(values: Values) => Promise<Values>>()
			.mockRejectedValue(new Error("Offline"));
		const failed = renderAutosave(onSave);
		act(() => failed.result.current.form.setValue("time", "09:00"));
		await advance();
		await act(async () => failed.unmount());
		expect(onSave).toHaveBeenCalledTimes(1);
		const invalid = renderAutosave();
		act(() => invalid.result.current.form.setValue("time", ""));
		await act(async () => invalid.unmount());
		expect(invalid.onSave).not.toHaveBeenCalled();
	});
});
