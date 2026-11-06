import { renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { createTestHostConfig } from "../../testing/test-host-config";
import { RoomUiStore } from "../workbench/room-ui.store";
import type { NewRoomWorkbenchPanels } from "../workbench/use-workbench-panels";
import { useRoomSlashCommands } from "./use-room-slash-commands";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** The commands a draft's composer offers, by id. */
const getCommandIds = (newRoomPanels: NewRoomWorkbenchPanels): string[] => {
	const room = new RoomUiStore({
		roomId: "slash-commands",
		host: createTestHostConfig(),
	});
	const { result } = renderHook(() =>
		useRoomSlashCommands({
			room: room,
			newRoomPanels: newRoomPanels,
			onOpenMcpOverlay: vi.fn(),
			onAttachFiles: vi.fn(),
			onSwitchToAgent: vi.fn(),
			canChooseAgent: false,
			prompts: [],
			onRunPrompt: vi.fn(),
		}),
	);
	return result.current.map((cmd) => cmd.id);
};

test("a draft's slash menu leaves out panels that wait for its room while it prepares", () => {
	const draft = new RoomUiStore({
		roomId: "new-room",
		host: createTestHostConfig(),
	});
	const newRoomPanels = { onOpenPanel: vi.fn(), isBusy: true, draft };
	const busyIds = getCommandIds(newRoomPanels);
	expect(busyIds).toContain("settings");
	expect(busyIds).not.toContain("files");
	expect(busyIds).not.toContain("activity");
	// outside a room there are no room actions
	expect(busyIds).not.toContain("favorite");

	const readyIds = getCommandIds({ ...newRoomPanels, isBusy: false });
	expect(readyIds).toEqual(expect.arrayContaining(["files", "activity"]));
});
