import { act, renderHook, waitFor } from "@testing-library/react";
import type { AgentRun } from "./agent-run-api";
import * as api from "./agent-run-api";
import { submitAgentTurn, useAgentTurn } from "./use-agent-turn";

vi.mock("./agent-run-api", async (original) => ({
	...(await original<typeof import("./agent-run-api")>()),
	listRoomRuns: vi.fn(async () => []),
	listChildRuns: vi.fn(async () => []),
	startAgentRun: vi.fn(),
	pollRun: vi.fn(),
	readRun: vi.fn(),
}));
vi.mock("./upload-room-files", () => ({
	uploadRoomFiles: vi.fn(async () => []),
}));

it("shares one run observer across subscribers and room navigation", async () => {
	const snapshot: AgentRun = {
		runId: "shared-run",
		roomId: "shared-room",
		status: "RUNNING",
		pendingActions: [],
	};
	let complete: (value: Awaited<ReturnType<typeof api.pollRun>>) => void =
		() => undefined;
	vi.mocked(api.startAgentRun).mockResolvedValue(snapshot);
	vi.mocked(api.pollRun).mockReturnValue(
		new Promise((resolve) => {
			complete = resolve;
		}),
	);
	const config = {
		insightId: "shared-insight",
		roomId: "shared-room",
		agentId: "agent-1",
		engine: "model-1",
		maxTurns: 40,
	};
	const first = renderHook(() => useAgentTurn(config));
	const second = renderHook(() => useAgentTurn(config));
	await waitFor(() => expect(first.result.current.isRestoring).toBe(false));
	expect(api.listRoomRuns).toHaveBeenCalledTimes(1);
	await act(async () => {
		await first.result.current.send({ text: "Hello", files: [] });
	});
	expect(second.result.current.isRunning).toBe(true);
	expect(api.pollRun).toHaveBeenCalledTimes(1);
	first.unmount();
	second.unmount();
	const onSettled = vi.fn();
	const reopened = renderHook(() => useAgentTurn({ ...config, onSettled }));
	expect(reopened.result.current.isRunning).toBe(true);
	expect(api.pollRun).toHaveBeenCalledTimes(1);
	const terminal = {
		...snapshot,
		status: "COMPLETED" as const,
		finalText: "Done",
		messages: [],
	};
	vi.mocked(api.readRun).mockResolvedValue(terminal);
	await act(async () => {
		complete({ run: terminal, events: [], droppedEvents: 0 });
	});
	await waitFor(() => expect(reopened.result.current.isRunning).toBe(false));
	expect(onSettled).toHaveBeenCalledExactlyOnceWith("shared-room");
	expect(api.startAgentRun).toHaveBeenCalledTimes(1);
	reopened.unmount();
});

it("hands a draft submission to the room subscriber without starting it twice", async () => {
	vi.mocked(api.startAgentRun).mockClear();
	vi.mocked(api.pollRun).mockClear();
	const snapshot: AgentRun = {
		runId: "draft-run",
		roomId: "draft-room",
		status: "RUNNING",
		pendingActions: [],
	};
	vi.mocked(api.startAgentRun).mockResolvedValue(snapshot);
	vi.mocked(api.pollRun).mockReturnValue(new Promise(() => undefined));
	const config = {
		insightId: "draft-insight",
		roomId: "draft-room",
		agentId: "agent-1",
		engine: "model-1",
		maxTurns: 40,
	};

	await submitAgentTurn(config, { text: "Start from a draft", files: [] });
	const room = renderHook(() => useAgentTurn(config));

	expect(room.result.current.isRunning).toBe(true);
	expect(
		room.result.current.messages.some(
			(message) =>
				message.role === "user" &&
				message.parts.some(
					(part) =>
						part.type === "text" &&
						part.text === "Start from a draft",
				),
		),
	).toBe(true);
	expect(api.startAgentRun).toHaveBeenCalledTimes(1);
	expect(api.pollRun).toHaveBeenCalledTimes(1);
	room.unmount();
});
