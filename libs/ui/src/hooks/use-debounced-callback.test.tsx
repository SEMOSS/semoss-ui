import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedCallback } from "./use-debounced-callback";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("useDebouncedCallback", () => {
	it.each([10, 200, 500])(
		"waits %i ms and invokes the latest arguments once",
		(delay) => {
			const callback = vi.fn<(value: string) => void>();
			const { result } = renderHook(() =>
				useDebouncedCallback(callback, delay),
			);

			act(() => {
				result.current("first");
				result.current("latest");
			});
			act(() => vi.advanceTimersByTime(delay - 1));
			expect(callback).not.toHaveBeenCalled();

			act(() => vi.advanceTimersByTime(1));
			expect(callback).toHaveBeenCalledExactlyOnceWith("latest");
		},
	);

	it("uses the latest callback without changing the returned function", () => {
		const first = vi.fn<(value: string) => void>();
		const latest = vi.fn<(value: string) => void>();
		const { result, rerender } = renderHook(
			(callback) => useDebouncedCallback(callback, 200),
			{ initialProps: first },
		);
		const debouncedCallback = result.current;

		act(() => result.current("pending"));
		rerender(latest);
		expect(result.current).toBe(debouncedCallback);

		act(() => vi.advanceTimersByTime(200));
		expect(first).not.toHaveBeenCalled();
		expect(latest).toHaveBeenCalledExactlyOnceWith("pending");
	});

	it("uses a changed delay for the next call", () => {
		const callback = vi.fn<(value: string) => void>();
		const { result, rerender } = renderHook(
			(delay: number) => useDebouncedCallback(callback, delay),
			{ initialProps: 200 },
		);

		act(() => result.current("first"));
		act(() => vi.advanceTimersByTime(100));
		rerender(500);
		act(() => result.current("latest"));
		act(() => vi.advanceTimersByTime(499));
		expect(callback).not.toHaveBeenCalled();

		act(() => vi.advanceTimersByTime(1));
		expect(callback).toHaveBeenCalledExactlyOnceWith("latest");
	});

	it("keeps separate consumers independent", () => {
		const firstCallback = vi.fn();
		const secondCallback = vi.fn();
		const first = renderHook(() =>
			useDebouncedCallback(firstCallback, 200),
		);
		const second = renderHook(() =>
			useDebouncedCallback(secondCallback, 10),
		);

		act(() => {
			first.result.current();
			second.result.current();
		});
		act(() => vi.advanceTimersByTime(10));
		expect(firstCallback).not.toHaveBeenCalled();
		expect(secondCallback).toHaveBeenCalledTimes(1);

		act(() => vi.advanceTimersByTime(190));
		expect(firstCallback).toHaveBeenCalledTimes(1);
		expect(secondCallback).toHaveBeenCalledTimes(1);
	});

	it("cancels a pending callback on unmount under Strict Mode", () => {
		const callback = vi.fn();
		const { result, unmount } = renderHook(
			() => useDebouncedCallback(callback, 200),
			{ wrapper: StrictMode },
		);

		act(() => result.current());
		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);

		act(() => vi.advanceTimersByTime(200));
		expect(callback).not.toHaveBeenCalled();
	});
});
