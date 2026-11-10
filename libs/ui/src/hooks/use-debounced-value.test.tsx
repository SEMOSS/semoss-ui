import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./use-debounced-value";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("useDebouncedValue", () => {
	it.each(["", "initial"])(
		"returns the initial value %j immediately",
		(value) => {
			const { result } = renderHook(() => useDebouncedValue(value));

			expect(result.current).toBe(value);
		},
	);

	it("applies only the latest value after the default 300 ms delay", () => {
		const { result, rerender } = renderHook(
			(value: string) => useDebouncedValue(value),
			{ initialProps: "initial" },
		);

		rerender("intermediate");
		act(() => vi.advanceTimersByTime(150));
		rerender("latest");
		act(() => vi.advanceTimersByTime(299));
		expect(result.current).toBe("initial");

		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe("latest");
	});

	it("honors an explicit delay", () => {
		const { result, rerender } = renderHook(
			(value: string) => useDebouncedValue(value, 500),
			{ initialProps: "" },
		);

		rerender("search");
		act(() => vi.advanceTimersByTime(499));
		expect(result.current).toBe("");

		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe("search");
	});

	it("reschedules a pending update when the delay changes", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebouncedValue(value, delay),
			{ initialProps: { value: "initial", delay: 500 } },
		);

		rerender({ value: "next", delay: 500 });
		act(() => vi.advanceTimersByTime(100));
		rerender({ value: "next", delay: 200 });
		act(() => vi.advanceTimersByTime(199));
		expect(result.current).toBe("initial");

		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe("next");
		expect(vi.getTimerCount()).toBe(0);
	});

	it("keeps separate consumers independent", () => {
		const first = renderHook((value: string) => useDebouncedValue(value), {
			initialProps: "first",
		});
		const second = renderHook(() => useDebouncedValue("second"));

		first.rerender("updated");
		act(() => vi.advanceTimersByTime(300));

		expect(first.result.current).toBe("updated");
		expect(second.result.current).toBe("second");
	});

	it("cleans up timers on changes and unmount under Strict Mode", () => {
		const { rerender, unmount } = renderHook(
			(value: string) => useDebouncedValue(value),
			{ initialProps: "", wrapper: StrictMode },
		);

		expect(vi.getTimerCount()).toBe(1);
		rerender("pending");
		expect(vi.getTimerCount()).toBe(1);

		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
