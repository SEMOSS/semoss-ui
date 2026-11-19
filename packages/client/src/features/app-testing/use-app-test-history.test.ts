import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAppTestHistory } from "./use-app-test-history";

const state = vi.hoisted(() => ({
	status: "SUCCESS",
	data: null as unknown,
	error: undefined as { message: string } | undefined,
	refresh: vi.fn(),
}));
const pixel = vi.hoisted(() => vi.fn((_statement: string) => state));
vi.mock("@semoss/sdk/react", () => ({ useSessionPixel: pixel }));
const result = {
	id: "test",
	name: "Workflow",
	status: "RUNNING",
	steps: 3,
	stepsAttempted: 0,
	stepsCompleted: 0,
	assertions: 1,
	assertionsPassed: 0,
	runId: "run",
	startedAt: "2026-11-19T12:00:00Z",
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
	state.status = "SUCCESS";
	state.error = undefined;
	state.data = {
		target: "app",
		runs: [],
		latest: [],
		total: 0,
		offset: 0,
		hasMore: false,
		retainedRuns: 100,
	};
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

it("loads bounded summaries for the requested UUID and refreshes on a local run transition", () => {
	const { result: hook, rerender } = renderHook(
		({ runKey }) =>
			useAppTestHistory("app", {
				recordingId: "test",
				offset: 20,
				runKey,
			}),
		{ initialProps: { runKey: "run:RUNNING" } },
	);
	expect(pixel).toHaveBeenCalledWith(
		'META | ListAppTestRuns(project=["app"], recordingId=["test"], offset=[20], limit=[20]);',
	);
	expect(hook.current.page?.total).toBe(0);
	expect(state.refresh).toHaveBeenCalledTimes(1);
	rerender({ runKey: "run:COMPLETED" });
	expect(state.refresh).toHaveBeenCalledTimes(2);
});

it("follows active runs and removes timers and focus listeners on unmount", () => {
	state.data = {
		target: "app",
		runs: [],
		latest: [result],
		total: 1,
		offset: 0,
		hasMore: false,
		retainedRuns: 100,
	};
	const hook = renderHook(() => useAppTestHistory("app"));
	act(() => vi.advanceTimersByTime(2000));
	expect(state.refresh).toHaveBeenCalledTimes(1);
	state.status = "LOADING";
	hook.rerender();
	state.status = "SUCCESS";
	hook.rerender();
	act(() => vi.advanceTimersByTime(2000));
	expect(state.refresh).toHaveBeenCalledTimes(2);
	act(() => window.dispatchEvent(new Event("focus")));
	expect(state.refresh).toHaveBeenCalledTimes(3);
	hook.unmount();
	act(() => {
		vi.advanceTimersByTime(4000);
		window.dispatchEvent(new Event("focus"));
	});
	expect(state.refresh).toHaveBeenCalledTimes(3);
});

it("rejects another app's history and preserves a recoverable service error", () => {
	state.data = {
		target: "another-app",
		runs: [],
		latest: [],
		total: 0,
		offset: 0,
		hasMore: false,
		retainedRuns: 100,
	};
	const hook = renderHook(() => useAppTestHistory("app"));
	expect(hook.result.current.page).toBeNull();
	expect(hook.result.current.error).toContain("could not be read");
	state.status = "ERROR";
	state.error = { message: "Storage unavailable" };
	hook.rerender();
	expect(hook.result.current.error).toBe("Storage unavailable");
	hook.result.current.refresh();
	expect(state.refresh).toHaveBeenCalledOnce();
});
