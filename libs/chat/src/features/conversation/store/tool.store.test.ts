import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import type {
	PixelMessageToolCallPart,
	ResponsePixelMessage,
} from "../../../types";
import { RoomStore } from "../../room/store/room.store";
import { useTool } from "./use-tool";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

let room: RoomStore;

beforeEach(() => {
	room = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		panelComponents: {},
	});
	vi.spyOn(room, "openSidebarPanel").mockReturnValue("panel-1");
	vi.spyOn(room, "closeSidebarPanel").mockImplementation(() => undefined);
});

/** A TOOL_CALL part that shows where `display` says. */
const callPart = (
	display?: "inline" | "sidebar",
): PixelMessageToolCallPart => ({
	type: "TOOL_CALL",
	toolCall: {
		id: "call-1",
		type: "function",
		_tool_found: true,
		name: "search",
		original_name: "search",
		title: "Search",
		description: "",
		arguments: { query: "plans" },
		_meta: {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			SMSS_MCP_EXECUTION: "auto",
			...(display ? { SMSS_MCP_UI: { displayLocation: display } } : {}),
		},
	},
});

/** A response in the room, to hold the call. */
const message = () =>
	room.createMessage({
		io: "OUTPUT",
		messageId: "message-1",
		visible: true,
		platform_generated: false,
		modelId: "model-1",
		modelType: "",
		dateCreated: "2026-01-01 00:00:00",
		parts: [],
		tokens: 0,
		ornaments: {},
		pruneToolsAbove: false,
	} as ResponsePixelMessage);

test("a write that changes nothing keeps the snapshot and tells no one", () => {
	const tool = room.getOrCreateTool("call-1");
	const listener = vi.fn();
	tool.subscribe(listener);
	const before = tool.getSnapshot();

	tool.setStatus("INITIAL");
	expect(tool.getSnapshot()).toBe(before);
	expect(listener).not.toHaveBeenCalled();

	tool.setStatus("LOADING");
	expect(tool.getSnapshot()).not.toBe(before);
	expect(before.status).toBe("INITIAL");
	expect(listener).toHaveBeenCalledTimes(1);
});

test("streams in, then takes the final part and its result", () => {
	const tool = room.getOrCreateTool("call-1");
	tool.setStreamingName("search");
	tool.appendStreamingArguments('{"query":');
	tool.appendStreamingArguments('"plans"}');
	expect(tool.argumentsBuffer).toBe('{"query":"plans"}');
	expect(tool.displayName).toBe("search");
	expect(tool.isResolved).toBe(false);

	const owner = message();
	tool.syncMessage(owner, callPart("inline"));
	expect(tool.isResolved).toBe(true);
	expect(tool.message).toBe(owner);
	expect(tool.display).toBe("inline");
	expect(tool.displayName).toBe("Search");
	expect(tool.getSnapshot()).toMatchObject({
		argumentsBuffer: "",
		streamingName: "",
		parameters: { query: "plans" },
	});

	tool.syncMessage(owner, {
		type: "TOOL_RESULT",
		toolResult: { id: "call-1", output: "3 found" },
	} as never);
	expect(tool.status).toBe("SUCCESS");
	expect(tool.response).toBe("3 found");
	// a result without arguments keeps the call's own
	expect(tool.parameters).toEqual({ query: "plans" });
});

test("settles with its outcome, keeping the arguments unless given", () => {
	const tool = room.getOrCreateTool("call-1");
	tool.setParameters({ query: "plans" });
	tool.settle({ status: "CANCELLED", response: "stopped" });
	expect(tool.getSnapshot()).toMatchObject({
		status: "CANCELLED",
		response: "stopped",
		parameters: { query: "plans" },
	});
	tool.settle({
		status: "SUCCESS",
		response: "ok",
		parameters: { query: "x" },
	});
	expect(tool.parameters).toEqual({ query: "x" });
});

test("opens in the Workspace, and moves when asked to show elsewhere", () => {
	const tool = room.getOrCreateTool("call-1");
	tool.syncMessage(message(), callPart());
	tool.openTool();
	expect(tool.isOpen).toBe(true);
	expect(room.openSidebarPanel).toHaveBeenCalledTimes(1);

	tool.openTool("inline");
	expect(room.closeSidebarPanel).toHaveBeenCalledTimes(1);
	expect(tool.display).toBe("inline");
	expect(tool.isOpen).toBe(true);

	tool.setIsExpanded(true);
	tool.closeTool();
	expect(tool.getSnapshot()).toMatchObject({
		isOpen: false,
		isExpanded: false,
	});
});

test("useTool renders on a change to what it selects, not on others", () => {
	const tool = room.getOrCreateTool("call-1");
	let renders = 0;
	const { result } = renderHook(() => {
		renders += 1;
		return useTool(tool, (current) => current.status);
	});
	expect(result.current).toBe("INITIAL");

	act(() => tool.setIsExpanded(true));
	expect(renders).toBe(1);

	act(() => tool.setStatus("LOADING"));
	expect(result.current).toBe("LOADING");
	expect(renders).toBe(2);
});
