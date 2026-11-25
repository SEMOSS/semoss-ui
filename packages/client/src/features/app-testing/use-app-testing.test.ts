import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAppTesting } from "./use-app-testing";

const actions = vi.hoisted(() => ({
	one: vi.fn(),
	all: vi.fn(),
	save: vi.fn(),
	refresh: vi.fn(),
	database: vi.fn(),
	get: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	useSessionPixel: () => ({
		status: "SUCCESS",
		data: { target: "app", recordings: [] },
		refresh: actions.refresh,
		error: null,
	}),
}));
vi.mock("@/api/app-testing", async (original) => ({
	...(await original<typeof import("@/api/app-testing")>()),
	runAppTests: actions.one,
	runAllAppTests: actions.all,
	saveAppTestRecording: actions.save,
	getAppTestDatabase: actions.database,
	getAppTestRun: actions.get,
}));
const draft = {
	name: "Imported workflow",
	description: "Verify the imported behavior.",
	startPath: "",
	steps: [{ type: "ASSERT_VISIBLE", selector: "#result" }],
};

beforeEach(() => {
	vi.clearAllMocks();
	actions.database.mockResolvedValue({ enabled: false });
	actions.one.mockResolvedValue({
		target: "app",
		runId: "one",
		status: "COMPLETED",
	});
	actions.all.mockResolvedValue({
		target: "app",
		runId: "all",
		status: "COMPLETED",
	});
	actions.save.mockResolvedValue({
		...draft,
		id: "new-id",
		version: 1,
		updatedAt: "2026-11-18",
	});
});
afterEach(cleanup);

it("runs the clicked UUID directly, then runs all only through its separate action", async () => {
	const { result } = renderHook(() => useAppTesting("app", null));
	await act(async () => result.current.startRun("clicked-id"));
	expect(actions.one).toHaveBeenCalledWith("app", "clicked-id", 1, undefined);
	expect(actions.all).not.toHaveBeenCalled();
	await act(async () => result.current.runAll());
	expect(actions.all).toHaveBeenCalledWith("app", undefined);
});

it("imports as a new test and refreshes the list without sending the original id", async () => {
	const file = new File(["data"], "test.json", { type: "application/json" });
	Object.defineProperty(file, "text", {
		value: async () =>
			JSON.stringify({ ...draft, id: "old-id", version: 1 }),
	});
	const { result } = renderHook(() => useAppTesting("app", null));
	await act(async () => result.current.uploadTest(file));
	expect(actions.save).toHaveBeenCalledWith("app", draft);
	expect(actions.refresh).toHaveBeenCalledTimes(1);
	expect(result.current.notice).toBe("Imported Imported workflow.");
});

it("reports invalid/oversized uploads and failed saves without claiming import success", async () => {
	const { result } = renderHook(() => useAppTesting("app", null));
	const tooLarge = new File(["x".repeat(256001)], "huge.json");
	await act(async () => result.current.uploadTest(tooLarge));
	expect(result.current.error).toContain("256 KB");
	expect(actions.save).not.toHaveBeenCalled();
	const invalid = new File(["data"], "invalid.json");
	Object.defineProperty(invalid, "text", { value: async () => "not JSON" });
	await act(async () => result.current.uploadTest(invalid));
	expect(result.current.error).toContain("valid test JSON");
	expect(actions.save).not.toHaveBeenCalled();
	const valid = new File(["data"], "valid.json");
	Object.defineProperty(valid, "text", {
		value: async () => JSON.stringify(draft),
	});
	actions.save.mockRejectedValueOnce(new Error("Write refused"));
	await act(async () => result.current.uploadTest(valid));
	expect(result.current.error).toBe("Write refused");
	expect(result.current.notice).toBe("");
	expect(actions.refresh).not.toHaveBeenCalled();
});

it("refuses to record the normal app when isolated H2 is enabled", async () => {
	actions.database.mockResolvedValue({ enabled: true });
	const frame = document.createElement("iframe");
	frame.src = "http://localhost/Monolith/public_home/app/portals/";
	Object.defineProperty(frame, "contentDocument", {
		value: { URL: frame.src },
	});
	const { result } = renderHook(() => useAppTesting("app", frame));
	await act(async () => result.current.startRecording());
	expect(actions.database).toHaveBeenCalledWith("app");
	expect(result.current.isRecording).toBe(false);
	expect(result.current.error).toContain("Open Test Preview");
});

it("forwards headed inspection settings to individual, all and smoke runs", async () => {
	const options = { headless: false, keepOpen: true };
	const { result } = renderHook(() => useAppTesting("app", null));
	await act(async () => result.current.startRun("clicked-id", options));
	expect(actions.one).toHaveBeenLastCalledWith(
		"app",
		"clicked-id",
		1,
		options,
	);
	await act(async () => result.current.runAll(options));
	expect(actions.all).toHaveBeenLastCalledWith("app", options);
	await act(async () =>
		result.current.startRun("__platform_smoke__", options),
	);
	expect(actions.one).toHaveBeenLastCalledWith(
		"app",
		"__platform_smoke__",
		1,
		options,
	);
});

it("keeps the app busy during inspection even though results have completed", async () => {
	actions.one.mockResolvedValueOnce({
		target: "app",
		runId: "one",
		status: "COMPLETED",
		browserOpen: true,
	});
	const { result } = renderHook(() => useAppTesting("app", null));
	await act(async () =>
		result.current.startRun("clicked-id", {
			headless: false,
			keepOpen: true,
		}),
	);
	expect(result.current.isRunning).toBe(true);
	await act(async () => result.current.runAll());
	expect(actions.all).not.toHaveBeenCalled();
});

it("polls completed inspection until the window closes, then enables another run", async () => {
	vi.useFakeTimers();
	try {
		actions.one.mockResolvedValueOnce({
			target: "app",
			runId: "one",
			status: "COMPLETED",
			browserOpen: true,
			keepOpen: true,
		});
		actions.get.mockResolvedValueOnce({
			target: "app",
			runId: "one",
			status: "COMPLETED",
			browserOpen: false,
		});
		const { result, unmount } = renderHook(() =>
			useAppTesting("app", null),
		);
		await act(async () =>
			result.current.startRun("clicked-id", {
				headless: false,
				keepOpen: true,
			}),
		);
		expect(result.current.isRunning).toBe(true);
		await act(async () => vi.advanceTimersByTimeAsync(1000));
		expect(actions.get).toHaveBeenCalledWith("app", "one");
		expect(result.current.run?.status).toBe("COMPLETED");
		expect(result.current.isRunning).toBe(false);
		await act(async () => result.current.runAll());
		expect(actions.all).toHaveBeenCalledTimes(1);
		unmount();
	} finally {
		vi.useRealTimers();
	}
});

it("stops inspection polling on unmount", async () => {
	vi.useFakeTimers();
	try {
		actions.one.mockResolvedValueOnce({
			target: "app",
			runId: "one",
			status: "COMPLETED",
			browserOpen: true,
		});
		const { result, unmount } = renderHook(() =>
			useAppTesting("app", null),
		);
		await act(async () =>
			result.current.startRun("clicked-id", {
				headless: false,
				keepOpen: true,
			}),
		);
		unmount();
		await act(async () => vi.advanceTimersByTimeAsync(5000));
		expect(actions.get).not.toHaveBeenCalled();
	} finally {
		vi.useRealTimers();
	}
});
