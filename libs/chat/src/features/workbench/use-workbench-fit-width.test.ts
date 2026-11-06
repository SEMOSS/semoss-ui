import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CHAT_FILE_PANELS } from "../../panels/file-panels";
import { createTestHostConfig } from "../../testing/test-host-config";
import { TEST_PANEL_COMPONENTS } from "../../testing/test-panel-components";
import { ROOM_PANEL_TYPES } from "./room-sidebar";
import { RoomUiStore } from "./room-ui.store";
import { useWorkbenchFitWidth } from "./use-workbench-fit-width";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

const createRoom = () =>
	new RoomUiStore({
		roomId: "fit-width",
		insightId: "insight-1",
		host: createTestHostConfig({
			panelComponents: TEST_PANEL_COMPONENTS,

			filePanels: CHAT_FILE_PANELS,
		}),
	});

const renderFitWidth = (room: RoomUiStore) =>
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
