import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { RoomStore } from "../../room/store/room.store";
import { decideAgentToolAction } from "../store/agent-harness";
import type { ToolStore } from "../store/tool.store";
import { useToolViewMessageBridge } from "./use-tool-view-message-bridge";

vi.mock("../store/agent-harness", () => ({
	decideAgentToolAction: vi.fn(),
}));

/** The calls the fake room knows, by id. */
let tools: Record<string, Partial<ToolStore>> = {};

/** A room with only what the bridge reads and writes. */
const room = {
	getTool: (id: string) => tools[id],
	processTool: vi.fn(),
} as unknown as RoomStore & { processTool: ReturnType<typeof vi.fn> };

/**
 * Post a message to the window, as a framed tool view does.
 *
 * @param data - What it posts.
 */
const post = (data: unknown) =>
	window.dispatchEvent(new MessageEvent("message", { data }));

/**
 * A tool result a view posts.
 *
 * @param fields - The result's fields.
 * @returns The `SMSS_EXEC_TOOL` message.
 */
const execTool = (fields: Record<string, unknown>) => ({
	type: "SMSS_EXEC_TOOL",
	tool: {
		id: "call-1",
		message: "message-1",
		response: { value: 42 },
		tool_status: "completed",
		executedParameters: { q: "x" },
		...fields,
	},
});

beforeEach(() => {
	vi.clearAllMocks();
	tools = {};
});

test("a posted result is saved into the room, with a legacy pause as a cancel", () => {
	renderHook(() => useToolViewMessageBridge(room));

	post(execTool({}));
	expect(room.processTool).toHaveBeenCalledWith(
		"message-1",
		"call-1",
		{ value: 42 },
		"completed",
		{ q: "x" },
	);

	post(execTool({ tool_status: "paused", executedParameters: undefined }));
	expect(room.processTool).toHaveBeenLastCalledWith(
		"message-1",
		"call-1",
		{ value: 42 },
		"cancelled",
		{},
	);
	expect(decideAgentToolAction).not.toHaveBeenCalled();
});

test("a call an agent run waits on resumes the run with the decision", async () => {
	const liveTool = { pendingAction: { id: "action-1" } };
	tools["call-1"] = liveTool as unknown as Partial<ToolStore>;
	renderHook(() => useToolViewMessageBridge(room));

	post(execTool({}));
	await waitFor(() =>
		expect(decideAgentToolAction).toHaveBeenCalledWith(liveTool, "submit", {
			q: "x",
		}),
	);

	post(execTool({ tool_status: "cancelled" }));
	post(execTool({ tool_status: "paused" }));
	await waitFor(() => expect(decideAgentToolAction).toHaveBeenCalledTimes(3));
	expect(
		vi.mocked(decideAgentToolAction).mock.calls.map((c) => c[1]),
	).toEqual(["submit", "reject", "reject"]);
	expect(room.processTool).not.toHaveBeenCalled();
});

test("other posts are ignored, and a failing one does not stop the listener", () => {
	renderHook(() => useToolViewMessageBridge(room));

	post(null);
	post({ type: "SOMETHING_ELSE" });
	expect(room.processTool).not.toHaveBeenCalled();

	room.processTool.mockImplementationOnce(() => {
		throw new Error("bad result");
	});
	expect(() => post(execTool({}))).not.toThrow();
	post(execTool({}));
	expect(room.processTool).toHaveBeenCalledTimes(2);
});

test("unmounting, or a new room, stops the old room hearing posts", () => {
	const other = {
		getTool: () => undefined,
		processTool: vi.fn(),
	} as unknown as RoomStore & { processTool: ReturnType<typeof vi.fn> };
	const { rerender, unmount } = renderHook(
		({ current }) => useToolViewMessageBridge(current),
		{ initialProps: { current: room } },
	);

	rerender({ current: other });
	post(execTool({}));
	expect(room.processTool).not.toHaveBeenCalled();
	expect(other.processTool).toHaveBeenCalledTimes(1);

	unmount();
	post(execTool({}));
	expect(other.processTool).toHaveBeenCalledTimes(1);
});
