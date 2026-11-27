import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { getWorkspace, type WorkspaceDetails } from "@semoss/sdk";
import { useAgentWorkspace } from "./use-agent-workspace";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getWorkspace: vi.fn(),
}));

/** Runs each task in the session's insight, as `Session.insight.withInsight` does. */
const withInsight = vi.fn(
	(task: (insightId: string) => Promise<unknown>): Promise<unknown> =>
		task("insight-1"),
);
vi.mock("@semoss/sdk/react", () => ({
	useSessionInsight: () => ({ withInsight }),
}));

const mockGetWorkspace = vi.mocked(getWorkspace);

/** An agent, as the SDK reads it. */
const agent = (workspaceId: string) =>
	({
		workspace_id: workspaceId,
		name: workspaceId,
		mcp: [],
		skills: [],
		prompts: [],
	}) as unknown as WorkspaceDetails;

/** A read that resolves when the test says so. */
const deferred = () => {
	let resolve: (value: WorkspaceDetails) => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<WorkspaceDetails>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
};

beforeEach(() => {
	mockGetWorkspace.mockReset();
	withInsight.mockClear();
});

test("reads nothing without an agent", () => {
	const { result } = renderHook(() => useAgentWorkspace(""));

	expect(result.current).toMatchObject({
		workspace: null,
		status: "IDLE",
		error: null,
	});
	expect(mockGetWorkspace).not.toHaveBeenCalled();
});

test("reads the agent in the session's insight", async () => {
	mockGetWorkspace.mockResolvedValue(agent("agent-1"));

	const { result } = renderHook(() => useAgentWorkspace("agent-1"));

	expect(result.current.status).toBe("LOADING");
	await waitFor(() => expect(result.current.status).toBe("READY"));
	expect(result.current.workspace).toEqual(agent("agent-1"));
	expect(mockGetWorkspace).toHaveBeenCalledWith("insight-1", "agent-1");
});

test("holds only the agent asked for, and drops a read that lands late", async () => {
	const first = deferred();
	const second = deferred();
	mockGetWorkspace
		.mockReturnValueOnce(first.promise)
		.mockReturnValueOnce(second.promise);
	const { result, rerender } = renderHook(
		({ id }: { id: string | null }) => useAgentWorkspace(id),
		{ initialProps: { id: "agent-1" as string | null } },
	);

	rerender({ id: "agent-2" });
	expect(result.current.status).toBe("LOADING");
	await act(async () => {
		first.resolve(agent("agent-1"));
		await first.promise;
	});
	// the first agent's read is for an agent no longer asked for
	expect(result.current.status).toBe("LOADING");
	expect(result.current.workspace).toBeNull();

	await act(async () => {
		second.resolve(agent("agent-2"));
		await second.promise;
	});
	expect(result.current.workspace?.workspace_id).toBe("agent-2");

	// none asked for again: nothing held
	rerender({ id: null });
	expect(result.current).toMatchObject({ workspace: null, status: "IDLE" });
});

test("a failed read shows its error, and refresh reads again", async () => {
	mockGetWorkspace
		.mockRejectedValueOnce(new Error("No access"))
		.mockResolvedValueOnce(agent("agent-1"));
	const { result } = renderHook(() => useAgentWorkspace("agent-1"));

	await waitFor(() => expect(result.current.status).toBe("ERROR"));
	expect(result.current.error).toEqual(new Error("No access"));
	expect(result.current.workspace).toBeNull();

	act(() => result.current.refresh());
	expect(result.current.status).toBe("LOADING");
	await waitFor(() => expect(result.current.status).toBe("READY"));
	expect(result.current.error).toBeNull();
	expect(mockGetWorkspace).toHaveBeenCalledTimes(2);
});

test("each caller reads on its own", async () => {
	mockGetWorkspace.mockResolvedValue(agent("agent-1"));

	renderHook(() => useAgentWorkspace("agent-1"));
	renderHook(() => useAgentWorkspace("agent-1"));

	await waitFor(() => expect(mockGetWorkspace).toHaveBeenCalledTimes(2));
});
