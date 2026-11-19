import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTwinIndex } from "./use-twin-index";

const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const indexTwinFiles = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
vi.mock("./api/digital-twin", () => ({ indexTwinFiles }));

beforeEach(() => {
	vi.useFakeTimers();
	indexTwinFiles.mockReset();
	indexTwinFiles.mockResolvedValue(undefined);
});
afterEach(() => {
	vi.useRealTimers();
});

it("asks for the index a moment after the page has its twin, and not before", () => {
	const { rerender } = renderHook(
		({ twinId }: { twinId: string | undefined }) => useTwinIndex(twinId),
		{ initialProps: { twinId: undefined as string | undefined } },
	);
	vi.advanceTimersByTime(10_000);
	expect(indexTwinFiles).not.toHaveBeenCalled();

	rerender({ twinId: "twin-1" });
	vi.advanceTimersByTime(2_999);
	expect(indexTwinFiles).not.toHaveBeenCalled();
	vi.advanceTimersByTime(1);
	expect(indexTwinFiles).toHaveBeenCalledTimes(1);
	expect(indexTwinFiles).toHaveBeenCalledWith(insight.actions, "twin-1");
});

it("waits for a run of changes to end, then asks once", () => {
	const { result } = renderHook(() => useTwinIndex("twin-1"));
	// the pass for opening the page
	vi.advanceTimersByTime(3_000);
	indexTwinFiles.mockClear();

	for (let add = 0; add < 5; add += 1) {
		result.current();
		vi.advanceTimersByTime(2_000);
	}
	expect(indexTwinFiles).not.toHaveBeenCalled();
	vi.advanceTimersByTime(1_000);
	expect(indexTwinFiles).toHaveBeenCalledTimes(1);
});

it("drops a pass that has not started when the page is left", () => {
	const { result, unmount } = renderHook(() => useTwinIndex("twin-1"));
	result.current();
	unmount();
	vi.advanceTimersByTime(10_000);
	expect(indexTwinFiles).not.toHaveBeenCalled();
});
