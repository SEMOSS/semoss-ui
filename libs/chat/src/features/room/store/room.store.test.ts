import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "../../workbench/panels/room-panel.components";
import { RoomStore } from "./room.store";
import { ROOM_PANEL_TYPES } from "./room-sidebar";
import { useRoomSelector } from "./use-room-selector";

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
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		insightId: "insight-1",
		panelComponents: ROOM_PANEL_COMPONENTS,
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
	expect(after.sidebar).toBe(before.sidebar);
	expect(listener).toHaveBeenCalledTimes(1);

	room.setIsLoading(false);
	room.closeSidebar();
	expect(room.getSnapshot()).toBe(after);
	expect(listener).toHaveBeenCalledTimes(1);
});

test("opening a panel opens the Workspace once", () => {
	const room = createRoom();
	const listener = vi.fn();
	room.subscribe(listener);
	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	room.openSidebar();
	expect(room.sidebar.isOpen).toBe(true);
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

test("a room hears about its messages and tool calls", () => {
	const room = createRoom();
	const listener = vi.fn();
	room.subscribe(listener);
	room.syncTool("call-1", Object.create(null), {
		type: "TOOL_RESULT",
		toolResult: { toolCallId: "call-1", output: "ok" },
	} as never);
	listener.mockClear();

	room.getTool("call-1")?.setStatus("LOADING");
	expect(listener).toHaveBeenCalledTimes(1);
	room.dispose();
	room.getTool("call-1")?.setStatus("SUCCESS");
	expect(listener).toHaveBeenCalledTimes(1);
});
