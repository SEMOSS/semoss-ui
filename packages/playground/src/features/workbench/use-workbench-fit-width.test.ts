import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import { useWorkbenchFitWidth } from "./use-workbench-fit-width";

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

const renderFitWidth = (room: RoomStore) =>
	renderHook(() => useWorkbenchFitWidth(room));

test("a collapsed rail fits the rail alone", () => {
	const { result } = renderFitWidth(createRoom());
	expect(result.current).toBe(64);
});

test("an open rail panel adds its width, and resizing it follows", () => {
	const room = createRoom();
	const { result } = renderFitWidth(room);
	act(() => {
		room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	});
	// the rail opens to the panel's own minimum width when it asks for more
	const { size } = room.workbench.getState().layout.borders.left;
	expect(result.current).toBe(64 + size);

	act(() => {
		room.workbench.getState().layout.actions.resizeBorder("left", 420);
	});
	expect(result.current).toBe(64 + 420);
});

test("a tab in the main area fills", () => {
	const room = createRoom();
	const { result } = renderFitWidth(room);
	act(() => {
		room.openSidebarPanel(ROOM_PANEL_TYPES.AUDIT_LOG);
	});
	expect(result.current).toBeNull();
});
