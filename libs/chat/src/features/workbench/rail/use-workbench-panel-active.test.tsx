import { renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { testChatOptions } from "../../../test/chat-options";
import { RoomStore } from "../../room/store/room.store";
import { ROOM_PANEL_TYPES } from "../../room/store/room-workbench-layout";
import { DEFAULT_WORKBENCH_PANELS } from "../panels/default-workbench-panels";
import { useWorkbenchPanelActive } from "./use-workbench-panel-active";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

const CHAT_OPTIONS = testChatOptions();

/** A room with the real blueprints, so the dock matches panels as the app does. */
const createRoom = (roomId: string) => {
	return new RoomStore({
		chatOptions: CHAT_OPTIONS,
		roomId,
		insightId: "insight-1",
		workbenchPanels: DEFAULT_WORKBENCH_PANELS,
	});
};

beforeEach(() => {
	localStorage.clear();
});

test("reports the open Workbench's selected panel as active", () => {
	const room = createRoom("active-open");
	const config = { mode: room.fileMode };
	room.openWorkbenchFileExplorer();

	const { result } = renderHook(() =>
		useWorkbenchPanelActive(room, FILE_PANEL_TYPES.FILE_EXPLORER, config),
	);

	expect(result.current).toBe(true);
});

test("a panel that is not the selection is not active", () => {
	const room = createRoom("active-other");
	room.openWorkbenchFileExplorer();
	room.openWorkbenchPanel(ROOM_PANEL_TYPES.SETTINGS);

	const { result } = renderHook(() =>
		useWorkbenchPanelActive(room, FILE_PANEL_TYPES.FILE_EXPLORER, {
			mode: room.fileMode,
		}),
	);

	expect(result.current).toBe(false);
});

/**
 * Closing the Workbench only flips `isOpen` — the dock keeps its panels and its
 * selection. Without the `isOpen` half of the question, the file explorer's
 * menu item reads "Close" for a panel that is not on screen, and clicking it
 * destroys the panel instead of reopening the Workbench.
 */
test("nothing is active once the Workbench is closed", async () => {
	const room = createRoom("active-closed");
	const config = { mode: room.fileMode };
	room.openWorkbenchFileExplorer();

	await room.closeWorkbench();

	const { result } = renderHook(() =>
		useWorkbenchPanelActive(room, FILE_PANEL_TYPES.FILE_EXPLORER, config),
	);

	// the panel is still open in the dock, and still the selection
	const { actions, selection } = room.workbench.getState().layout;
	expect(
		actions
			.matchPanels(FILE_PANEL_TYPES.FILE_EXPLORER, config)
			.map((record) => record.id),
	).toContain(selection.panel);
	expect(result.current).toBe(false);
});
