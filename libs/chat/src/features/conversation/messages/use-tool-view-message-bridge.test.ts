import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { decideAgentToolAction } from "../../room/turns/agent-turn-runner";
import { useToolViewMessageBridge } from "./use-tool-view-message-bridge";

vi.mock("../../room/turns/agent-turn-runner", () => ({
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
 * Add a tool view frame, as `ToolsView` draws one, to the page.
 *
 * @param toolId - The call it shows.
 * @returns The frame's window.
 */
const addToolFrame = (toolId: string): Window => {
	const frame = document.createElement("iframe");
	frame.dataset.toolCallId = toolId;
	document.body.append(frame);
	if (!frame.contentWindow) {
		throw new Error("The test frame has no window");
	}
	return frame.contentWindow;
};

/** The frame showing `call-1`, which the posts come from unless a test says otherwise. */
let toolFrame: Window;

/**
 * Post a message to the window, as a framed tool view does.
 *
 * @param data - What it posts.
 * @param source - The window it comes from; the frame showing `call-1` by default.
 */
const post = (data: unknown, source: Window | null = toolFrame) =>
	window.dispatchEvent(new MessageEvent("message", { data, source }));

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
	toolFrame = addToolFrame("call-1");
});

afterEach(() => {
	document.body.replaceChildren();
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

test("only the frame showing a call can post its result", () => {
	const otherFrame = addToolFrame("call-2");
	renderHook(() => useToolViewMessageBridge(room));

	// the page itself, a frame showing another call, and no window at all
	post(execTool({}), window);
	post(execTool({}), otherFrame);
	post(execTool({}), null);
	// the right frame, naming a call it does not show
	post(execTool({ id: "call-2" }));
	expect(room.processTool).not.toHaveBeenCalled();

	post(execTool({ id: "call-2" }), otherFrame);
	expect(room.processTool).toHaveBeenCalledWith(
		"message-1",
		"call-2",
		{ value: 42 },
		"completed",
		{ q: "x" },
	);
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
