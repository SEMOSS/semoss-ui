import { runInAction } from "mobx";
import { beforeEach, expect, test, vi } from "vitest";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { ToolStore } from "@/stores/tool/tool.store";
import { RoomStore } from "./room.store";
import { ROOM_PANEL_TYPES } from "./room-sidebar";

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
const createRoom = (
	roomId: string,
	insightId = "insight-1",
	includeFiles = true,
) =>
	new RoomStore({
		theme: THEME,
		roomId,
		insightId,
		panelComponents: ROOM_PANEL_COMPONENTS,
		includeFiles,
	});

/** The panels open in the Workspace's main area. */
const mainPanelIds = (room: RoomStore) =>
	room.workbench
		.getState()
		.layout.tabsets.flatMap((tabset) => tabset.panelIds);

/** The panel types open in the Workspace's main area, in order. */
const mainPanelTypes = (room: RoomStore) => {
	const { panels } = room.workbench.getState().layout;
	return mainPanelIds(room).map((pid) => panels[pid]?.type);
};

/** The panels a test opened, leaving out the Files and Settings every room starts with. */
const openedPanelIds = (room: RoomStore) => {
	const { panels } = room.workbench.getState().layout;
	return mainPanelIds(room).filter((pid) => {
		const record = panels[pid];
		if (!record) return false;
		if (record.type === ROOM_PANEL_TYPES.CONFIGURATION) return false;
		// a file panel a test opened is an editor, never the room's explorer
		return record.type !== FILE_PANEL_TYPES.FILE_EXPLORER;
	});
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
	expect(openedPanelIds(room)).toHaveLength(1);
	expect(room.sidebar.isOpen).toBe(true);
});

test("two files open as two panels, and reopening one reveals it", () => {
	const room = createRoom("room-files");

	const readme = room.openFileSidebarPanel("/README.md");
	const script = room.openFileSidebarPanel("/py/run.py");

	expect(script).not.toBe(readme);
	expect(room.openFileSidebarPanel("/README.md")).toBe(readme);
	expect(openedPanelIds(room)).toHaveLength(2);
});

test("every tab closes, Files and Settings included, and the rail reopens them", () => {
	const room = createRoom("room-close-all");

	room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	room.openFileSidebarPanel("/README.md");
	expect(room.sidebar.isOpen).toBe(true);

	const { actions } = room.workbench.getState().layout;
	for (const pid of mainPanelIds(room)) {
		actions.closePanel(pid);
	}
	expect(mainPanelTypes(room)).toEqual([]);

	// the arrangement survives its last close, so the rail can fill it again
	expect(room.workbench.getState().layout.tabsets).toHaveLength(1);
	room.openSidebarFileExplorer();
	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	expect(mainPanelTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
	]);
});

test("reopening restores existing panels without duplicating them", async () => {
	const room = createRoom("room-reopen");
	const panelId = room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	await room.closeSidebar();

	room.openSidebar();

	expect(room.sidebar.isOpen).toBe(true);
	expect(openedPanelIds(room)).toEqual([panelId]);
});

test("opening the sidebar shows Files and Settings as tabs, Files in front", () => {
	const room = createRoom("room-default-panel");

	room.openSidebar();

	const { panels, tabsets, borders, selection } =
		room.workbench.getState().layout;
	expect(room.sidebar.isOpen).toBe(true);
	// Files is the first tab, Settings the second
	expect(mainPanelTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
	]);
	// and the room lands on Files: the front tab and the selected panel
	expect(panels[tabsets[0]?.activeId ?? ""]?.type).toBe(
		FILE_PANEL_TYPES.FILE_EXPLORER,
	);
	expect(panels[selection.panel ?? ""]?.type).toBe(
		FILE_PANEL_TYPES.FILE_EXPLORER,
	);
	// the panel rail is the host's own chrome; nothing docks in a border
	for (const border of Object.values(borders)) {
		expect(border.panelIds).toEqual([]);
	}
	// both close like any other tab; the rail is how they come back
	for (const pid of mainPanelIds(room)) {
		expect(panels[pid]?.canClose).not.toBe(false);
	}
});

test("a draft opens with Settings alone", () => {
	const room = createRoom("temp", "new", false);

	expect(mainPanelTypes(room)).toEqual([ROOM_PANEL_TYPES.CONFIGURATION]);
});

test("Files and Settings select their open tabs rather than adding another", () => {
	const room = createRoom("room-tab-reveal");
	const [files, settings] = mainPanelIds(room);

	expect(room.openSidebarFileExplorer()).toBe(files);
	expect(room.workbench.getState().layout.selection.panel).toBe(files);

	expect(room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION)).toBe(
		settings,
	);
	expect(room.workbench.getState().layout.selection.panel).toBe(settings);
	expect(openedPanelIds(room)).toEqual([]);
});

test("a connector viewer opens as a tab and closes with its connector", () => {
	const room = createRoom("room-connector-viewer");

	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});
	// a viewer is not opened until it is asked for
	expect(mainPanelTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
	]);

	// as the panel rail opens it; `openSourcePanel` only adds the viewer's name
	room.openSidebarPanel(ROOM_PANEL_TYPES.ONEDRIVE, {}, "OneDrive");
	expect(mainPanelTypes(room)).toContain(ROOM_PANEL_TYPES.ONEDRIVE);

	runInAction(() => {
		room.connectors.services = [];
	});

	expect(mainPanelTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
	]);
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
	// the Workspace stays open on Files and Settings
	expect(room.sidebar.isOpen).toBe(true);
	expect(openedPanelIds(room)).toHaveLength(0);
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
	expect(openedPanelIds(room)).toEqual([filePanel]);
});

test("moving the last sidebar tool inline leaves it open once", () => {
	const room = createRoom("room-last-tool-inline");
	const tool = new ToolStore(room, "t1");
	room.tools.t1 = tool;
	tool.openTool("sidebar");

	tool.openTool("inline");

	expect(tool.isOpen).toBe(true);
	expect(tool.display).toBe("inline");
	expect(openedPanelIds(room)).toHaveLength(0);
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
	expect(openedPanelIds(room)).toHaveLength(0);
});

test("the sidebar's default arrangement survives its last panel closing", () => {
	const room = createRoom("room-empty");
	const pid = room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	room.workbench.getState().layout.actions.closePanel(pid);

	// the dock prunes an empty tabset unless it opts out, and a sidebar with no
	// tabset has nowhere to put the next panel
	expect(room.workbench.getState().layout.tabsets).toHaveLength(1);
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

	const explorers = Object.values(
		room.workbench.getState().layout.panels,
	).filter((record) => record.type === FILE_PANEL_TYPES.FILE_EXPLORER);
	expect(explorers).toHaveLength(1);
});

test("a prepared layout retains its tabs through sidebar mounts and later opens", () => {
	const draft = createRoom("temp", "new", false);
	const log = draft.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	const snapshot = draft.workbench.getState().layout.actions.getSnapshot();
	const room = createRoom("prepared");
	room.restoreSidebarLayout(snapshot);
	expect(room.sidebarSnapshot).toBe(snapshot);
	// the draft had no Files; the prepared room gains it, behind the draft's tab
	expect(mainPanelTypes(room)).toEqual([
		ROOM_PANEL_TYPES.CONFIGURATION,
		ROOM_PANEL_TYPES.AUDIT_LOG,
		FILE_PANEL_TYPES.FILE_EXPLORER,
	]);
	expect(room.workbench.getState().layout.selection.panel).toBe(log);
	const files = room.openSidebarFileExplorer();
	const { actions } = room.workbench.getState().layout;
	// Every shell mount, including navigation after submission, uses this reference.
	actions.loadSnapshot(room.sidebarSnapshot);
	expect(openedPanelIds(room)).toEqual([log]);
	expect(room.workbench.getState().layout.selection.panel).toBe(files);
});
