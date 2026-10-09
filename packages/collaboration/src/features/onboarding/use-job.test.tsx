import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { getJob, type Job } from "./onboarding-api";
import { deferred } from "./topic-review.test-fixtures";
import { useJob } from "./use-job";

vi.mock("./onboarding-api", async (original) => ({
	...(await original<typeof import("./onboarding-api")>()),
	getJob: vi.fn(),
}));
const actions = {} as InsightActions;
const job = (id = "job-1", status: Job["status"] = "running"): Job => ({
	id,
	status,
	mode: "topics",
	progress: 30,
	counts: {},
	step: "filing",
	error: "",
	finishedAt: "",
	reviewId: "review-1",
	reviewRevision: 1,
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.mocked(getJob).mockReset();
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("onboarding job tracking", () => {
	it("defers reads until an exact ID is available", () => {
		const { result } = renderHook(() =>
			useJob(actions, "classify", "", "topics"),
		);
		expect(getJob).not.toHaveBeenCalled();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.job).toBeNull();
	});

	it("follows the exact job found on the first read, even if a newer job could exist", async () => {
		vi.mocked(getJob)
			.mockResolvedValueOnce(job())
			.mockResolvedValue(job("job-1", "done"));
		const { result } = renderHook(() =>
			useJob(actions, "classify", undefined, "topics"),
		);
		await act(async () => undefined);
		expect(getJob).toHaveBeenNthCalledWith(
			1,
			actions,
			"classify",
			undefined,
			"topics",
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(getJob).toHaveBeenNthCalledWith(
			2,
			actions,
			"classify",
			"job-1",
			"topics",
		);
		expect(result.current.job?.status).toBe("done");
	});

	it("ignores a stale latest-job response after following a newly started job", async () => {
		const pending = deferred<Job>();
		vi.mocked(getJob)
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValue(job("job-new", "done"));
		const { result } = renderHook(() =>
			useJob(actions, "classify", undefined, "topics"),
		);
		act(() => result.current.follow(job("job-new")));
		await act(async () => pending.resolve(job("job-old", "done")));
		expect(result.current.job?.id).toBe("job-new");
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(getJob).toHaveBeenLastCalledWith(
			actions,
			"classify",
			"job-new",
			"topics",
		);
	});

	it.each(["success", "failure"])(
		"ignores a late %s after the insight changes",
		async (outcome) => {
			const pending = deferred<Job>();
			const nextActions = {} as InsightActions;
			vi.mocked(getJob)
				.mockReturnValueOnce(pending.promise)
				.mockResolvedValue(job("job-current", "done"));
			const { result, rerender } = renderHook(
				({ source }) => useJob(source, "classify", undefined, "topics"),
				{ initialProps: { source: actions } },
			);
			rerender({ source: nextActions });
			await act(async () => undefined);
			await act(async () => {
				if (outcome === "success")
					pending.resolve(job("job-old", "done"));
				else pending.reject(new Error("Old read failed"));
			});
			expect(result.current.job?.id).toBe("job-current");
			expect(result.current.error).toBeNull();
		},
	);

	it.each(["wrong-id", "wrong-mode", "missing"])(
		"rejects a %s response instead of treating it as completion",
		async (problem) => {
			const response = job(
				problem === "wrong-id" ? "job-other" : "job-1",
				problem === "missing" ? "none" : "done",
			);
			if (problem === "wrong-mode") response.mode = "sort";
			vi.mocked(getJob).mockResolvedValue(response);
			const { result } = renderHook(() =>
				useJob(actions, "classify", "job-1", "topics"),
			);
			await act(async () => undefined);
			expect(result.current.error).toBeTruthy();
			expect(result.current.job).toBeNull();
		},
	);

	it("does not follow or refresh through an old insight callback", async () => {
		const nextActions = {} as InsightActions;
		vi.mocked(getJob).mockResolvedValue(job("job-current", "done"));
		const { result, rerender } = renderHook(
			({ source }) => useJob(source, "classify", undefined, "topics"),
			{ initialProps: { source: actions } },
		);
		await act(async () => undefined);
		const old = result.current;
		rerender({ source: nextActions });
		await act(async () => undefined);
		act(() => {
			old.follow(job("job-old"));
			old.refresh();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(result.current.job?.id).toBe("job-current");
		expect(getJob).toHaveBeenCalledTimes(2);
		expect(vi.getTimerCount()).toBe(0);
	});

	it("does not restart polling through a callback from a closed step", async () => {
		vi.mocked(getJob).mockResolvedValue(job("job-1", "done"));
		const { result, unmount } = renderHook(() =>
			useJob(actions, "classify", undefined, "topics"),
		);
		await act(async () => undefined);
		const old = result.current;
		unmount();
		act(() => {
			old.follow(job("job-old"));
			old.refresh();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(getJob).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
	});
});
