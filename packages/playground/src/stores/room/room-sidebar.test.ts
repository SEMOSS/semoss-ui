import { beforeEach, expect, test, vi } from "vitest";
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
 * A room built the way the app builds one. The blueprints are load-bearing:
 * without them the dock falls back to a shallow compare of config and every
 * dedupe assertion below would pass for the wrong reason.
 */
const createRoom = (roomId: string, insightId = "insight-1") =>
	new RoomStore({
		theme: THEME,
		roomId,
		insightId,
		panelComponents: ROOM_PANEL_COMPONENTS,
	});

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

test("the sidebar's default arrangement survives its last panel closing", () => {
	const room = createRoom("room-empty");
	const pid = room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	room.workbench.getState().layout.actions.closePanel(pid);

	// the dock prunes an empty tabset unless it opts out, and a sidebar with no
	// tabset has nowhere to put the next panel
	expect(room.workbench.getState().layout.tabsets).toHaveLength(1);
	expect(ROOM_SIDEBAR_LAYOUT.panels).toEqual({});
});

test("a room whose sidebar never mounted still dedupes", () => {
	// The regression the old registration hook papered over: blueprints used to
	// arrive from a React effect, so a room built outside React -- the "open a
	// file explorer" menu item does exactly this -- matched on a shallow
	// compare of config instead. `mode` is a fresh object per call, so it never
	// matched and every open spawned another tab.
	const room = createRoom("room-never-mounted");

	room.openSidebarFileExplorer();
	room.openSidebarFileExplorer();

	expect(Object.keys(room.workbench.getState().layout.panels)).toHaveLength(
		1,
	);
});
