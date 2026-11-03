import { runInAction } from "mobx";
import { beforeEach, expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { ToolStore } from "@/stores/tool/tool.store";
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

test("reopening restores existing panels without duplicating them", async () => {
	const room = createRoom("room-reopen");
	const panelId = room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	await room.closeSidebar();

	room.openSidebar();

	expect(room.sidebar.isOpen).toBe(true);
	expect(room.workbench.getState().layout.openPanelIds).toEqual([panelId]);
});

test("opening an empty sidebar defaults to Room settings", () => {
	const room = createRoom("room-default-panel");

	room.openSidebar();

	const panels = Object.values(room.workbench.getState().layout.panels);
	expect(room.sidebar.isOpen).toBe(true);
	expect(panels).toHaveLength(1);
	expect(panels[0]?.type).toBe(ROOM_PANEL_TYPES.CONFIGURATION);
});

test("closing a tool's tab returns it inline", () => {
	const room = createRoom("room-tool-close");
	const tool = new ToolStore(room, "t1");
	room.tools.t1 = tool;
	tool.openTool("sidebar");

	const pid = room.openSidebarPanel(
		ROOM_PANEL_TYPES.TOOL,
		tool.panelConfig,
		"Tool",
	);
	room.workbench.getState().layout.actions.closePanel(pid);

	expect(tool.isOpen).toBe(true);
	expect(tool.display).toBe("inline");
	expect(room.sidebar.isOpen).toBe(false);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(0);
});

test("closing Workspace returns all its tools inline and retains file panels", async () => {
	const room = createRoom("room-tools-return-inline");
	const tools = ["t1", "t2", "t3"].map((id) => {
		const tool = new ToolStore(room, id);
		room.tools[id] = tool;
		tool.openTool("sidebar");
		return tool;
	});
	const filePanel = room.openFileSidebarPanel("/draft.md");

	await room.closeSidebar();

	for (const tool of tools) {
		expect(tool.isOpen).toBe(true);
		expect(tool.display).toBe("inline");
	}
	expect(room.sidebar.isOpen).toBe(false);
	expect(room.workbench.getState().layout.openPanelIds).toEqual([filePanel]);
});

test("moving the last sidebar tool inline leaves it open once", () => {
	const room = createRoom("room-last-tool-inline");
	const tool = new ToolStore(room, "t1");
	room.tools.t1 = tool;
	tool.openTool("sidebar");

	tool.openTool("inline");

	expect(tool.isOpen).toBe(true);
	expect(tool.display).toBe("inline");
	expect(room.sidebar.isOpen).toBe(false);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(0);
});

test("explicitly closing a cancelled tool does not reopen it inline", () => {
	const room = createRoom("room-cancelled-tool-close");
	const tool = new ToolStore(room, "t1");
	room.tools.t1 = tool;
	tool.openTool("sidebar");
	runInAction(() => {
		tool.status = "CANCELLED";
	});

	tool.closeTool();

	expect(tool.isOpen).toBe(false);
	expect(room.sidebar.isOpen).toBe(false);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(0);
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

test("a prepared layout retains its tabs through sidebar mounts and later opens", () => {
	const draft = createRoom("temp");
	const settings = draft.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	const snapshot = draft.workbench.getState().layout.actions.getSnapshot();
	const room = createRoom("prepared");
	room.restoreSidebarLayout(snapshot);
	expect(room.sidebarSnapshot).toBe(snapshot);
	const files = room.openSidebarFileExplorer();
	const { actions } = room.workbench.getState().layout;
	// Every shell mount, including navigation after submission, uses this reference.
	actions.loadSnapshot(room.sidebarSnapshot);
	expect(room.workbench.getState().layout.openPanelIds).toEqual([
		settings,
		files,
	]);
	expect(room.workbench.getState().layout.selection.panel).toBe(files);
});
