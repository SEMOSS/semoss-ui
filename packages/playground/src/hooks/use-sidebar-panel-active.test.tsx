import { renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels";
import { ROOM_PANEL_TYPES, RoomStore } from "@/stores";
import { useSidebarPanelActive } from "./use-sidebar-panel-active";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

const THEME = {} as ThemeMap["playground"];

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

test("reports the open sidebar's selected panel as active", () => {
	const room = createRoom("active-open");
	const config = { mode: room.fileMode };
	room.openSidebarFileExplorer();

	const { result } = renderHook(() =>
		useSidebarPanelActive(room, FILE_PANEL_TYPES.FILE_EXPLORER, config),
	);

	expect(result.current).toBe(true);
});

test("a panel that is not the selection is not active", () => {
	const room = createRoom("active-other");
	room.openSidebarFileExplorer();
	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);

	const { result } = renderHook(() =>
		useSidebarPanelActive(room, FILE_PANEL_TYPES.FILE_EXPLORER, {
			mode: room.fileMode,
		}),
	);

	expect(result.current).toBe(false);
});

/**
 * Closing the sidebar only flips `isOpen` — the dock keeps its panels and its
 * selection. Without the `isOpen` half of the question, the file explorer's
 * menu item reads "Close" for a panel that is not on screen, and clicking it
 * destroys the panel instead of reopening the sidebar.
 */
test("nothing is active once the sidebar is closed", async () => {
	const room = createRoom("active-closed");
	const config = { mode: room.fileMode };
	room.openSidebarFileExplorer();

	await room.closeSidebar();

	const { result } = renderHook(() =>
		useSidebarPanelActive(room, FILE_PANEL_TYPES.FILE_EXPLORER, config),
	);

	// the panel is still open in the dock, and still the selection
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(1);
	expect(result.current).toBe(false);
});
