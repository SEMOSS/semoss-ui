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

/** The panels open in the Workspace's main area, leaving out its rail. */
const mainPanelIds = (room: RoomStore) =>
	room.workbench
		.getState()
		.layout.tabsets.flatMap((tabset) => tabset.panelIds);

/** The panel types on the Workspace's left rail, in order. */
const railTypes = (room: RoomStore) => {
	const { borders, panels } = room.workbench.getState().layout;
	return borders.left.panelIds.map((pid) => panels[pid]?.type);
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
	expect(mainPanelIds(room)).toHaveLength(1);
	expect(room.sidebar.isOpen).toBe(true);
});

test("two files open as two panels, and reopening one reveals it", () => {
	const room = createRoom("room-files");

	const readme = room.openFileSidebarPanel("/README.md");
	const script = room.openFileSidebarPanel("/py/run.py");

	expect(script).not.toBe(readme);
	expect(room.openFileSidebarPanel("/README.md")).toBe(readme);
	expect(mainPanelIds(room)).toHaveLength(2);
});

test("closing the last tab closes the sidebar when its rail is collapsed", () => {
	const room = createRoom("room-autoclose");

	room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	room.openFileSidebarPanel("/README.md");
	expect(room.sidebar.isOpen).toBe(true);

	const { actions } = room.workbench.getState().layout;
	for (const pid of mainPanelIds(room)) {
		actions.closePanel(pid);
	}

	expect(room.sidebar.isOpen).toBe(false);
});

test("closing the last tab keeps the sidebar while a rail panel is open", () => {
	const room = createRoom("room-autoclose-rail");

	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	const log = room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	room.workbench.getState().layout.actions.closePanel(log);

	expect(room.sidebar.isOpen).toBe(true);
});

test("reopening restores existing panels without duplicating them", async () => {
	const room = createRoom("room-reopen");
	const panelId = room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	await room.closeSidebar();

	room.openSidebar();

	expect(room.sidebar.isOpen).toBe(true);
	expect(mainPanelIds(room)).toEqual([panelId]);
});

test("opening the sidebar shows Files and Settings on its collapsed rail", () => {
	const room = createRoom("room-default-panel");

	room.openSidebar();

	const { borders, panels } = room.workbench.getState().layout;
	expect(room.sidebar.isOpen).toBe(true);
	expect(mainPanelIds(room)).toEqual([]);
	expect(borders.left.activeId).toBeNull();
	expect(railTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
	]);
	for (const pid of borders.left.panelIds) {
		expect(panels[pid]?.canClose).toBe(false);
	}
});

test("a draft's rail has no Files", () => {
	const room = createRoom("temp", "new", false);

	expect(railTypes(room)).toEqual([ROOM_PANEL_TYPES.CONFIGURATION]);
});

test("Files and Settings expand their rail entries rather than adding tabs", () => {
	const room = createRoom("room-rail-reveal");
	const { borders } = room.workbench.getState().layout;
	const [files, settings] = borders.left.panelIds;

	expect(room.openSidebarFileExplorer()).toBe(files);
	expect(room.workbench.getState().layout.borders.left.activeId).toBe(files);

	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	expect(room.workbench.getState().layout.borders.left.activeId).toBe(
		settings,
	);
	expect(mainPanelIds(room)).toEqual([]);
});

test("the rail offers each connector viewer the chat can show, collapsed", () => {
	const room = createRoom("room-rail-connectors");
	const selected = room.workbench.getState().layout.selection.panel;

	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});

	expect(railTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
		ROOM_PANEL_TYPES.ONEDRIVE,
	]);
	expect(room.workbench.getState().layout.borders.left.activeId).toBeNull();
	expect(room.workbench.getState().layout.selection.panel).toBe(selected);

	runInAction(() => {
		room.connectors.services = [];
	});

	expect(railTypes(room)).toEqual([
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
	expect(room.sidebar.isOpen).toBe(false);
	expect(mainPanelIds(room)).toHaveLength(0);
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
	expect(mainPanelIds(room)).toEqual([filePanel]);
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
	expect(mainPanelIds(room)).toHaveLength(0);
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
	expect(mainPanelIds(room)).toHaveLength(0);
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
	// the draft had no Files; the prepared room adds it to the rail
	expect(railTypes(room)).toEqual([
		ROOM_PANEL_TYPES.CONFIGURATION,
		FILE_PANEL_TYPES.FILE_EXPLORER,
	]);
	const files = room.openSidebarFileExplorer();
	const { actions } = room.workbench.getState().layout;
	// Every shell mount, including navigation after submission, uses this reference.
	actions.loadSnapshot(room.sidebarSnapshot);
	expect(mainPanelIds(room)).toEqual([log]);
	expect(room.workbench.getState().layout.borders.left.activeId).toBe(files);
	expect(room.workbench.getState().layout.selection.panel).toBe(files);
});
