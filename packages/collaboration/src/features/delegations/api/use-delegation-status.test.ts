import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConversationMessage } from "@/features/messages/types/message";
import { type AgentRun, readRun } from "@/features/rooms/api/agent-run-api";
import { useDelegationStatus } from "./use-delegation-status";

vi.mock("@/features/rooms/api/agent-run-api", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/features/rooms/api/agent-run-api")
	>()),
	readRun: vi.fn(),
}));
const read = vi.mocked(readRun);

// one thread, as the room gives between messages; a new one restarts the polling
const thread: ConversationMessage[] = [
	{
		id: "m1",
		role: "assistant",
		parts: [
			{
				type: "tool",
				tool: {
					id: "t1",
					parentMessageId: "m1",
					name: "DelegateToPerson",
					title: "Ask Dana",
					arguments: {},
					status: "COMPLETED",
					output: JSON.stringify({
						runId: "child",
						assignee: "Dana",
					}),
				},
			},
		],
	},
];
const childRun = (status: AgentRun["status"]): AgentRun => ({
	runId: "child",
	status,
	pendingActions: [],
});

beforeEach(() => {
	vi.useFakeTimers();
	read.mockReset();
});
afterEach(() => {
	vi.useRealTimers();
});

it("keeps polling after a failed first read and reports the answer", async () => {
	read.mockRejectedValueOnce(new Error("offline"))
		.mockResolvedValueOnce(childRun("INPUT_REQUIRED"))
		.mockResolvedValueOnce(childRun("COMPLETED"));
	const onAnswered = vi.fn();
	const { result } = renderHook(() =>
		useDelegationStatus("insight", thread, onAnswered),
	);
	const card = () => result.current(thread)[0]?.parts[0];
	await act(() => vi.advanceTimersByTimeAsync(0));
	expect(read).toHaveBeenCalledTimes(1);
	expect(card()).toMatchObject({ tool: { title: "Waiting on Dana" } });
	await act(() => vi.advanceTimersByTimeAsync(10_000));
	expect(read).toHaveBeenCalledTimes(2);
	await act(() => vi.advanceTimersByTimeAsync(10_000));
	expect(read).toHaveBeenCalledTimes(3);
	expect(onAnswered).toHaveBeenCalledOnce();
	expect(card()).toMatchObject({ tool: { title: "Dana responded" } });
	// a settled request is not read again
	await act(() => vi.advanceTimersByTimeAsync(30_000));
	expect(read).toHaveBeenCalledTimes(3);
});
