import { expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import { getWorkspaceFitWidth } from "./use-workspace-fit-width";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

const createRoom = () =>
	new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "fit-width",
		insightId: "insight-1",
		panelComponents: ROOM_PANEL_COMPONENTS,
	});

const fitWidth = (room: RoomStore) =>
	getWorkspaceFitWidth(room.workbench.getState());

test("a collapsed rail fits the rail alone", () => {
	expect(fitWidth(createRoom())).toBe(64);
});

test("an open rail panel adds its width, and resizing it follows", () => {
	const room = createRoom();
	room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	// the rail opens to the panel's own minimum width when it asks for more
	const { size } = room.workbench.getState().layout.borders.left;
	expect(fitWidth(room)).toBe(64 + size);

	room.workbench.getState().layout.actions.resizeBorder("left", 420);
	expect(fitWidth(room)).toBe(64 + 420);
});

test("a tab in the main area fills", () => {
	const room = createRoom();
	room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	expect(fitWidth(room)).toBeNull();
});
