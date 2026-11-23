import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { testChatOptions } from "../../../test/chat-options";
import type { InputPixelMessage, ResponsePixelMessage } from "../../../types";
import { FOLDER_TOOL_NAMES } from "../../tools/chat-tools/folder-tools";
import {
	MCP_EXECUTION_ASK,
	MCP_EXECUTION_AUTO,
} from "../../tools/mcp/mcp-execution";
import { DEFAULT_WORKBENCH_PANELS } from "../../workbench/panels/default-workbench-panels";
import { RoomStore } from "./room.store";
import { ROOM_PANEL_TYPES } from "./room-workbench-layout";
import { useRoomSelector } from "./use-room-selector";

// a folder call's title is translated

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

/** A room with the app's panel blueprints, bound to an insight. */
const createRoom = () =>
	new RoomStore({
		chatOptions: testChatOptions(),
		roomId: "room-1",
		insightId: "insight-1",
		workbenchPanels: DEFAULT_WORKBENCH_PANELS,
	});

test("writes replace what they change and keep the rest", () => {
	const room = createRoom();
	const listener = vi.fn();
	room.subscribe(listener);
	const before = room.getSnapshot();

	room.setOptions({ instructions: "Be brief" });
	const after = room.getSnapshot();
	expect(after.options).toMatchObject({ instructions: "Be brief", mcp: [] });
	expect(before.options.instructions).toBe("");
	// siblings keep their references
	expect(after.metadata).toBe(before.metadata);
	expect(after.workbenchPane).toBe(before.workbenchPane);
	expect(listener).toHaveBeenCalledTimes(1);

	room.setIsLoading(false);
	room.closeWorkbench();
	expect(room.getSnapshot()).toBe(after);
	expect(listener).toHaveBeenCalledTimes(1);
});

test("opening a panel opens the Workspace once", () => {
	const room = createRoom();
	const listener = vi.fn();
	room.subscribe(listener);
	room.openWorkbenchPanel(ROOM_PANEL_TYPES.SETTINGS);
	room.openWorkbench();
	expect(room.workbenchPane.isOpen).toBe(true);
	expect(listener).toHaveBeenCalledTimes(1);
});

test("useRoomSelector renders on a change to what it selects, not on others", () => {
	const room = createRoom();
	let renders = 0;
	const { result } = renderHook(() => {
		renders += 1;
		return useRoomSelector(room, (current) => current.mode);
	});

	act(() => room.setMetadata({ name: "Plan" }));
	expect(renders).toBe(1);

	act(() => room.setMode("agent"));
	expect(result.current).toBe("agent");
	expect(renders).toBe(2);
});

test("a room hears about its messages and tool calls, and replaces only the one that changed", () => {
	const room = createRoom();
	const listener = vi.fn();
	room.subscribe(listener);
	for (const id of ["call-1", "call-2"]) {
		room.syncTool(id, Object.create(null), {
			type: "TOOL_RESULT",
			toolResult: { toolCallId: id, output: "ok" },
		} as never);
	}
	listener.mockClear();
	const before = room.getSnapshot();

	room.getTool("call-1")?.setStatus("LOADING");
	expect(listener).toHaveBeenCalledTimes(1);
	const after = room.getSnapshot();
	expect(after.tools["call-1"].status).toBe("LOADING");
	expect(before.tools["call-1"].status).toBe("SUCCESS");
	// the other call and the messages keep their references
	expect(after.tools["call-2"]).toBe(before.tools["call-2"]);
	expect(after.messages).toBe(before.messages);
	// one view per call
	expect(room.getTool("call-1")).toBe(room.getTool("call-1"));

	room.getTool("call-1")?.setStatus("LOADING");
	expect(room.getSnapshot()).toBe(after);
	expect(listener).toHaveBeenCalledTimes(1);
});

/** The fields every pixel message here shares. */
const PIXEL = {
	visible: true,
	platform_generated: false,
	modelId: "model-1",
	modelType: "",
	dateCreated: "2026-01-01T00:00:00Z",
	tokens: 0,
	ornaments: {},
	pruneToolsAbove: false,
};

/** A tool call part, as the model sends one. */
const toolCallPart = (id: string, name = "lookup") =>
	({
		type: "TOOL_CALL",
		toolCall: {
			id,
			type: "function",
			name,
			arguments: {},
			_tool_found: true,
			original_name: name,
			description: "",
		},
	}) as ResponsePixelMessage["parts"][number];

/** A response holding `parts`. */
const response = (
	room: RoomStore,
	messageId: string,
	parts: ResponsePixelMessage["parts"] = [],
) =>
	room.createMessage({
		...PIXEL,
		io: "OUTPUT",
		messageId,
		parts,
	} as ResponsePixelMessage);

test("changing the options works out the calls' json again in the same notification", () => {
	const room = createRoom();
	response(room, "r1", [toolCallPart("call-1", FOLDER_TOOL_NAMES.WRITE)]);
	const tool = room.getTool("call-1");
	expect(tool?.json._meta?.SMSS_MCP_EXECUTION).toBe(MCP_EXECUTION_ASK);
	const listener = vi.fn();
	room.subscribe(listener);

	room.setOptions({ defaultTools: { [FOLDER_TOOL_NAMES.WRITE]: "auto" } });

	expect(listener).toHaveBeenCalledTimes(1);
	expect(room.options.defaultTools).toEqual({
		[FOLDER_TOOL_NAMES.WRITE]: "auto",
	});
	expect(tool?.json._meta?.SMSS_MCP_EXECUTION).toBe(MCP_EXECUTION_AUTO);
});

test("removing a child deletes its branch and the calls it made, and their views read as empty", () => {
	const room = createRoom();
	const root = response(room, "root");
	const input = room.createMessage({
		...PIXEL,
		io: "INPUT",
		type: "INPUT_TEXT",
		messageId: "i1",
		parts: [{ type: "TEXT", text: "hi", uiText: "hi" }],
	} as InputPixelMessage);
	const reply = response(room, "r1", [toolCallPart("call-1")]);
	const kept = response(room, "kept", [toolCallPart("call-kept")]);
	root.addChild(input);
	input.addChild(reply);
	root.addChild(kept);
	input.activateMessage();
	const tool = room.getTool("call-1");
	const listener = vi.fn();
	room.subscribe(listener);

	root.removeChild(input);

	expect(listener).toHaveBeenCalledTimes(1);
	const { messages, tools } = room.getSnapshot();
	expect(messages[input.key]).toBeUndefined();
	expect(messages[reply.key]).toBeUndefined();
	expect(tools["call-1"]).toBeUndefined();
	expect(room.getMessageByKey(reply.key)).toBeNull();
	expect(room.getTool("call-1")).toBeNull();
	// the rest stays
	expect(root.children).toEqual([kept]);
	expect(room.getTool("call-kept")?.id).toBe("call-kept");
	// views held elsewhere read as empty and never throw
	expect(input.parent).toBeNull();
	expect(input.parts).toEqual([]);
	expect(reply.id).toBe("");
	expect(reply.children).toEqual([]);
	expect(reply.isThinking).toBe(false);
	expect(reply.hasUnfinishedTools).toBe(false);
	expect(tool?.status).toBe("INITIAL");
	expect(tool?.message).toBeNull();
	// and writing through them changes nothing
	const before = room.getSnapshot();
	reply.setIsThinking(true);
	tool?.setStatus("LOADING");
	expect(room.getSnapshot()).toBe(before);
});
