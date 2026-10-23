// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, useCallback } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type APIConfig, useAPI } from "./use-api";

afterEach(cleanup);

describe("useAPI", () => {
	it("spreads typed positional arguments in order", async () => {
		const read = vi.fn(
			async (id: string, limit: number, ...tags: string[]) => ({
				id,
				limit,
				tags,
			}),
		);
		const onSuccess = vi.fn();
		const { result } = renderHook(() =>
			useAPI([read, "project", 20, "first", "second"], { onSuccess }),
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(read).toHaveBeenCalledExactlyOnceWith(
			"project",
			20,
			"first",
			"second",
		);
		expect(onSuccess).toHaveBeenCalledWith({
			id: "project",
			limit: 20,
			tags: ["first", "second"],
		});
	});

	it("accepts no-argument tuples and omitted optional arguments", async () => {
		const read = vi.fn(async (limit = 20) => limit);
		const { result } = renderHook(() => useAPI([read]));
		await waitFor(() => expect(result.current.data).toBe(20));
		expect(read).toHaveBeenCalledExactlyOnceWith();
	});

	it("keeps equivalent inline argument objects stable and refreshes with current values", async () => {
		const read = vi.fn(
			async (params: { filter: { words: string[] }; limit: number }) =>
				params,
		);
		const { result, rerender } = renderHook(
			({ word }) =>
				useAPI([read, { filter: { words: [word] }, limit: 20 }]),
			{ initialProps: { word: "first" } },
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		rerender({ word: "first" });
		expect(read).toHaveBeenCalledOnce();

		rerender({ word: "second" });
		await waitFor(() =>
			expect(result.current.data?.filter.words).toEqual(["second"]),
		);
		expect(read).toHaveBeenCalledTimes(2);
		await act(async () => result.current.refresh());
		expect(read).toHaveBeenCalledTimes(3);
		expect(read).toHaveBeenLastCalledWith({
			filter: { words: ["second"] },
			limit: 20,
		});
	});

	it("refetches when the method changes with the same arguments", async () => {
		const first = vi.fn(async (id: string) => `first-${id}`);
		const second = vi.fn(async (id: string) => `second-${id}`);
		const { result, rerender } = renderHook(
			({ method }) => useAPI([method, "id"]),
			{ initialProps: { method: first } },
		);
		await waitFor(() => expect(result.current.data).toBe("first-id"));
		rerender({ method: second });
		await waitFor(() => expect(result.current.data).toBe("second-id"));
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledExactlyOnceWith("id");
	});

	it("preserves request object identities and detects a changed signal", async () => {
		const first = new AbortController().signal;
		const second = new AbortController().signal;
		const body = new FormData();
		body.append("file", new File(["contents"], "example.txt"));
		const read = vi.fn(
			async (payload: FormData, options: { signal: AbortSignal }) => ({
				payload,
				options,
			}),
		);
		const { result, rerender } = renderHook(
			({ signal }) => useAPI([read, body, { signal }]),
			{ initialProps: { signal: first } },
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(read.mock.calls[0][0]).toBe(body);
		expect(read.mock.calls[0][1].signal).toBe(first);
		rerender({ signal: first });
		expect(read).toHaveBeenCalledOnce();
		rerender({ signal: second });
		await waitFor(() =>
			expect(result.current.data?.options.signal).toBe(second),
		);
		expect(read).toHaveBeenCalledTimes(2);
	});

	it("distinguishes null from undefined and supports bigint arguments", async () => {
		const read = vi.fn(async (value: null | undefined, id: bigint) => ({
			value,
			id,
		}));
		const { result, rerender } = renderHook(
			({ value }: { value: null | undefined }) =>
				useAPI([read, value, BigInt(42)]),
			{ initialProps: { value: undefined } },
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		rerender({ value: null });
		await waitFor(() => expect(result.current.data?.value).toBeNull());
		expect(read.mock.calls).toEqual([
			[undefined, BigInt(42)],
			[null, BigInt(42)],
		]);
	});

	it("compares cyclic plain arguments without serializing them", async () => {
		interface Params {
			id: string;
			self?: Params;
		}
		const read = vi.fn(async (params: Params) => params.id);
		const { result, rerender } = renderHook(
			({ id }) => {
				const params: Params = { id };
				params.self = params;
				return useAPI([read, params]);
			},
			{ initialProps: { id: "first" } },
		);
		await waitFor(() => expect(result.current.data).toBe("first"));
		rerender({ id: "first" });
		expect(read).toHaveBeenCalledOnce();
		rerender({ id: "second" });
		await waitFor(() => expect(result.current.data).toBe("second"));
		expect(read).toHaveBeenCalledTimes(2);
	});

	it("skips null requests and restores the initial data when disabled", async () => {
		const read = vi.fn().mockResolvedValue("server");
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result, rerender } = renderHook(
			({ isEnabled }) =>
				useAPI(isEnabled ? [read] : null, {
					data: "initial",
					onSuccess,
					onFinal,
				}),
			{ initialProps: { isEnabled: false } },
		);

		expect(result.current).toMatchObject({
			status: "INITIAL",
			data: "initial",
		});
		act(() => result.current.refresh());
		expect(read).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();

		rerender({ isEnabled: true });
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(result.current.data).toBe("server");
		rerender({ isEnabled: false });
		expect(result.current).toMatchObject({
			status: "INITIAL",
			data: "initial",
		});
		expect(onSuccess).toHaveBeenCalledOnce();
		expect(onFinal).toHaveBeenCalledOnce();
	});

	it("tracks loading and success, refreshes, and updates data without fetching", async () => {
		const pending = Promise.withResolvers<{ id: number }>();
		const read = vi
			.fn()
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValue({ id: 2 });
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(() =>
			useAPI(read, { onSuccess, onFinal }),
		);
		expect(result.current.status).toBe("LOADING");
		expect(result.current.data).toBeUndefined();

		await act(async () => pending.resolve({ id: 1 }));
		expect(result.current).toMatchObject({
			status: "SUCCESS",
			data: { id: 1 },
		});
		expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
		expect(onFinal).toHaveBeenCalledOnce();

		const { refresh, update } = result.current;
		act(() => update({ id: 10 }));
		expect(result.current.data).toEqual({ id: 10 });
		expect(result.current.status).toBe("SUCCESS");
		expect(read).toHaveBeenCalledOnce();

		await act(async () => refresh());
		expect(result.current.data).toEqual({ id: 2 });
		expect(read).toHaveBeenCalledTimes(2);
		expect(onFinal).toHaveBeenCalledTimes(2);
		expect(result.current.refresh).toBe(refresh);
		expect(result.current.update).toBe(update);
	});

	it.each([new Error("failed"), "failed", null])(
		"normalizes a rejection (%s) and can recover on refresh",
		async (rejection) => {
			const read = vi
				.fn()
				.mockRejectedValueOnce(rejection)
				.mockResolvedValue("ok");
			const onError = vi.fn();
			const onSuccess = vi.fn();
			const onFinal = vi.fn();
			const { result } = renderHook(() =>
				useAPI(read, { data: "initial", onError, onSuccess, onFinal }),
			);
			await waitFor(() => expect(result.current.status).toBe("ERROR"));
			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(
				rejection instanceof Error
					? rejection.message
					: String(rejection),
			);
			if (rejection instanceof Error)
				expect(result.current.error).toBe(rejection);
			expect(result.current.data).toBeUndefined();
			expect(onError).toHaveBeenCalledWith(
				"initial",
				result.current.error,
			);
			expect(onSuccess).not.toHaveBeenCalled();
			expect(onFinal).toHaveBeenCalledOnce();

			act(() => result.current.update("local"));
			expect(result.current.data).toBe("local");
			expect(result.current.error).toBeUndefined();
			expect(result.current.status).toBe("ERROR");

			await act(async () => result.current.refresh());
			expect(result.current).toMatchObject({
				status: "SUCCESS",
				data: "ok",
			});
			expect(result.current.error).toBeUndefined();
			expect(onSuccess).toHaveBeenCalledWith("ok");
		},
	);

	it("handles synchronous throws from request setup", async () => {
		const error = new Error("invalid arguments");
		const read = (): Promise<string> => {
			throw error;
		};
		const onError = vi.fn();
		const { result } = renderHook(() => useAPI(read, { onError }));
		await waitFor(() => expect(result.current.error).toBe(error));
		expect(onError).toHaveBeenCalledWith(undefined, error);
	});

	it("refetches when tuple arguments change and ignores stale responses", async () => {
		const older = Promise.withResolvers<string>();
		const newer = Promise.withResolvers<string>();
		const read = vi.fn((id: string) =>
			id === "old" ? older.promise : newer.promise,
		);
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result, rerender } = renderHook(
			({ id }) => useAPI([read, id], { onSuccess, onFinal }),
			{ initialProps: { id: "old" } },
		);
		rerender({ id: "new" });
		expect(read.mock.calls).toEqual([["old"], ["new"]]);
		await act(async () => newer.resolve("new data"));
		await act(async () => older.resolve("stale data"));
		expect(result.current.data).toBe("new data");
		expect(onSuccess).toHaveBeenCalledExactlyOnceWith("new data");
		expect(onFinal).toHaveBeenCalledOnce();
	});

	it("preserves the existing memoized callback form", async () => {
		const read = vi.fn(async (id: string) => id);
		const { result, rerender } = renderHook(
			({ id }) => {
				const request = useCallback(() => read(id), [id]);
				return useAPI(request);
			},
			{ initialProps: { id: "first" } },
		);
		await waitFor(() => expect(result.current.data).toBe("first"));
		rerender({ id: "second" });
		await waitFor(() => expect(result.current.data).toBe("second"));
	});

	it("ignores errors and final callbacks from superseded requests", async () => {
		const older = Promise.withResolvers<string>();
		const newer = Promise.withResolvers<string>();
		const read = vi
			.fn()
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(newer.promise);
		const onError = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(() => useAPI(read, { onError, onFinal }));
		act(() => result.current.refresh());
		await act(async () => older.reject(new Error("stale failure")));
		expect(result.current.status).toBe("LOADING");
		expect(onError).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();
		await act(async () => newer.resolve("current"));
		expect(result.current.data).toBe("current");
		expect(onFinal).toHaveBeenCalledOnce();
	});

	it.each(["success", "error"] as const)(
		"uses the latest %s callbacks without restarting the request",
		async (outcome) => {
			const pending = Promise.withResolvers<string>();
			const read = vi.fn(() => pending.promise);
			const first = {
				onSuccess: vi.fn(),
				onError: vi.fn(),
				onFinal: vi.fn(),
			};
			const latest = {
				onSuccess: vi.fn(),
				onError: vi.fn(),
				onFinal: vi.fn(),
			};
			const { rerender } = renderHook(
				(config: APIConfig<string>) => useAPI([read], config),
				{ initialProps: first },
			);
			rerender(latest);
			expect(read).toHaveBeenCalledOnce();
			await act(async () => {
				if (outcome === "success") pending.resolve("result");
				else pending.reject(new Error("failure"));
			});
			expect(first.onSuccess).not.toHaveBeenCalled();
			expect(first.onError).not.toHaveBeenCalled();
			expect(first.onFinal).not.toHaveBeenCalled();
			expect(
				latest[outcome === "success" ? "onSuccess" : "onError"],
			).toHaveBeenCalledOnce();
			expect(latest.onFinal).toHaveBeenCalledOnce();
		},
	);

	it.each(["disabled", "unmounted"] as const)(
		"ignores in-flight results after being %s",
		async (transition) => {
			const pending = Promise.withResolvers<string>();
			const read = vi.fn(() => pending.promise);
			const onSuccess = vi.fn();
			const onFinal = vi.fn();
			const { result, rerender, unmount } = renderHook(
				({ isEnabled }) =>
					useAPI(isEnabled ? [read] : null, { onSuccess, onFinal }),
				{ initialProps: { isEnabled: true } },
			);
			if (transition === "disabled") rerender({ isEnabled: false });
			else unmount();
			await act(async () => pending.resolve("late"));
			expect(onSuccess).not.toHaveBeenCalled();
			expect(onFinal).not.toHaveBeenCalled();
			if (transition === "disabled")
				expect(result.current.status).toBe("INITIAL");
		},
	);

	it("keeps separate hook instances independent", async () => {
		const read = vi.fn().mockResolvedValue("server");
		const { result } = renderHook(() => ({
			first: useAPI(read),
			second: useAPI(read),
		}));
		await waitFor(() =>
			expect(result.current.second.status).toBe("SUCCESS"),
		);
		act(() => result.current.first.update("local"));
		expect(result.current.first.data).toBe("local");
		expect(result.current.second.data).toBe("server");
		expect(read).toHaveBeenCalledTimes(2);
	});

	it("ignores the discarded setup under Strict Mode", async () => {
		const discarded = Promise.withResolvers<string>();
		const active = Promise.withResolvers<string>();
		const read = vi
			.fn()
			.mockReturnValueOnce(discarded.promise)
			.mockReturnValueOnce(active.promise);
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(
			() => useAPI([read], { onSuccess, onFinal }),
			{ wrapper: StrictMode },
		);
		expect(read).toHaveBeenCalledTimes(2);
		await act(async () => discarded.resolve("discarded"));
		expect(result.current.status).toBe("LOADING");
		expect(onSuccess).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();
		await act(async () => active.resolve("active"));
		expect(result.current.data).toBe("active");
		expect(onSuccess).toHaveBeenCalledExactlyOnceWith("active");
		expect(onFinal).toHaveBeenCalledOnce();
	});
});
