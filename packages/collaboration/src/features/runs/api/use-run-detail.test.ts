import { act, renderHook } from "@testing-library/react";
import * as api from "@/features/rooms/api/agent-run-api";
import { useRunDetail } from "./use-run-detail";

vi.mock("@/features/rooms/api/agent-run-api", async (original) => ({
	...(await original<typeof import("@/features/rooms/api/agent-run-api")>()),
	readRun: vi.fn(),
	listChildRuns: vi.fn(),
	pollRun: vi.fn(),
}));
const run: api.AgentRun = {
	runId: "parent",
	status: "COMPLETED",
	pendingActions: [],
};
beforeEach(() => {
	vi.useFakeTimers();
	vi.resetAllMocks();
	vi.mocked(api.readRun).mockResolvedValue(run);
	vi.mocked(api.listChildRuns).mockResolvedValue([]);
});
afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
});

it("uses durable reads and keeps refreshing children after their parent completes", async () => {
	vi.mocked(api.listChildRuns).mockResolvedValue([
		{ ...run, runId: "child", status: "INPUT_REQUIRED" },
	]);
	const view = renderHook(() => useRunDetail("insight", "parent", true));
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1500);
	});
	expect(view.result.current.children[0]?.runId).toBe("child");
	expect(api.readRun).toHaveBeenCalledTimes(2);
	expect(api.pollRun).not.toHaveBeenCalled();
	view.unmount();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(3000);
	});
	expect(api.readRun).toHaveBeenCalledTimes(2);
});
it("pauses reads while the inspector is hidden", async () => {
	const view = renderHook(
		({ open }) => useRunDetail("insight", "parent", open),
		{ initialProps: { open: false } },
	);
	expect(api.readRun).not.toHaveBeenCalled();
	view.rerender({ open: true });
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
	expect(view.result.current.run).toEqual(run);
	await act(async () => {
		await vi.advanceTimersByTimeAsync(5000);
	});
	expect(api.readRun).toHaveBeenCalledTimes(1);
});
it("bounds failed reads and supports an explicit retry", async () => {
	vi.mocked(api.readRun).mockRejectedValue(new Error("Offline"));
	const view = renderHook(() => useRunDetail("insight", "parent", true));
	await act(async () => {
		await vi.advanceTimersByTimeAsync(10000);
	});
	expect(api.readRun).toHaveBeenCalledTimes(3);
	expect(view.result.current.error).toBe("Offline");
	vi.mocked(api.readRun).mockResolvedValue(run);
	await act(async () => {
		view.result.current.retry();
	});
	expect(view.result.current.error).toBeNull();
	expect(view.result.current.run).toEqual(run);
});
