import { beforeEach, expect, test, vi } from "vitest";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels";
import { RoomStore } from "./room.store";
import { ROOM_PANEL_TYPES, ROOM_SIDEBAR_LAYOUT } from "./room-sidebar";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

const THEME = {} as ThemeMap["playground"];

/**
 * A room with its sidebar blueprints registered, as `useRoomPanels` does once
 * the room is on screen. Without them the dock falls back to a shallow compare
 * of config and every dedupe assertion below would pass for the wrong reason.
 */
const createRoom = (roomId: string) => {
	const room = new RoomStore(THEME, roomId, "insight-1");
	room.workbench
		.getState()
		.layout.actions.registerComponents(ROOM_PANEL_COMPONENTS);
	return room;
};

beforeEach(() => {
	localStorage.clear();
});

test("opening the same tool twice reveals one panel", () => {
	const room = createRoom("room-dedupe");
	const config = { toolId: "t1", app: "app-1", message: "m1" };

	const first = room.openSidebarPanel(ROOM_PANEL_TYPES.TOOL, config, "Tool");
	// a second call from a later turn carries a different message id -- the
	// blueprint matches on toolId alone, so it must still be the same panel
	const second = room.openSidebarPanel(
		ROOM_PANEL_TYPES.TOOL,
		{ ...config, message: "m2" },
		"Tool",
	);

	expect(second).toBe(first);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(1);
	expect(room.sidebar.isOpen).toBe(true);
});

test("two files open as two panels, and reopening one reveals it", () => {
	const room = createRoom("room-files");

	const readme = room.openFileSidebarPanel("/README.md");
	const script = room.openFileSidebarPanel("/py/run.py");

	expect(script).not.toBe(readme);
	expect(room.openFileSidebarPanel("/README.md")).toBe(readme);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(2);
});

test("closing the last panel closes the sidebar", () => {
	const room = createRoom("room-autoclose");

	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	expect(room.sidebar.isOpen).toBe(true);

	const { actions } = room.workbench.getState().layout;
	for (const pid of [...room.workbench.getState().layout.openPanelIds]) {
		actions.closePanel(pid);
	}

	expect(room.sidebar.isOpen).toBe(false);
});

test("closing a tool's panel marks the tool closed", () => {
	const room = createRoom("room-tool-close");
	const setIsOpen = vi.fn();
	// stand in for the ToolStore the room would have built from a stream
	room.tools.t1 = { setIsOpen: setIsOpen } as never;

	const pid = room.openSidebarPanel(
		ROOM_PANEL_TYPES.TOOL,
		{ toolId: "t1", app: "", message: "m1" },
		"Tool",
	);
	room.workbench.getState().layout.actions.closePanel(pid);

	expect(setIsOpen).toHaveBeenCalledWith(false);
});

test("a restored file panel is re-pointed at the room's current insight", () => {
	const roomId = "room-restore";
	// a previous session's cache, written against an insight that is now gone
	const previous = createRoom(roomId);
	previous.openFileSidebarPanel("/README.md");
	previous.workbench.getState().layout.actions.persistNow();

	const room = new RoomStore(THEME, roomId, "insight-2");
	const [record] = room.workbench
		.getState()
		.layout.actions.findPanels(
			(candidate) =>
				candidate.type === FILE_PANEL_TYPES.FILE_MARKDOWN_EDITOR,
		);

	expect(record).toBeDefined();
	expect(
		(record.config as { mode: { insightId: string } }).mode.insightId,
	).toBe("insight-2");
});

test("the sidebar's default arrangement survives its last panel closing", () => {
	const room = createRoom("room-empty");
	const pid = room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	room.workbench.getState().layout.actions.closePanel(pid);

	// the dock prunes an empty tabset unless it opts out, and a sidebar with no
	// tabset has nowhere to put the next panel
	expect(room.workbench.getState().layout.tabsets).toHaveLength(1);
	expect(ROOM_SIDEBAR_LAYOUT.panels).toEqual({});
});
