import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import {
	type ChatConfig,
	ChatConfigContext,
} from "../../chat/config/chat-config.context";
import { DEFAULT_CHAT_THEME } from "../../chat/config/chat-theme";
import { RoomStore } from "../../room/store/room.store";
import type { NewRoomWorkbenchPanels } from "../../workbench/rail/use-workbench-panels";
import { useRoomSlashCommands } from "./use-room-slash-commands";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** The commands a draft's composer offers, by id. */
const getCommandIds = (newRoomPanels: NewRoomWorkbenchPanels): string[] => {
	const room = new RoomStore({
		theme: DEFAULT_CHAT_THEME,
		roomId: "slash-commands",
		panelComponents: {},
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
	const connectors = new RoomStore({
		theme: DEFAULT_CHAT_THEME,
		roomId: "new-room",
		panelComponents: {},
	}).connectors;
	const newRoomPanels = { onOpenPanel: vi.fn(), isBusy: true, connectors };
	const busyIds = getCommandIds(newRoomPanels);
	expect(busyIds).toContain("settings");
	expect(busyIds).not.toContain("files");
	expect(busyIds).not.toContain("activity");
	// outside a room there are no room actions
	expect(busyIds).not.toContain("favorite");

	const readyIds = getCommandIds({ ...newRoomPanels, isBusy: false });
	expect(readyIds).toEqual(expect.arrayContaining(["files", "activity"]));
});

test("the host adds and removes panels and commands from the chat's own", () => {
	const room = new RoomStore({
		theme: DEFAULT_CHAT_THEME,
		roomId: "customized",
		panelComponents: {},
	});
	const config = {
		customize: {
			// remove a panel, and add the host's own
			workbenchPanels: (defaults) => [
				...defaults.filter((panel) => panel.id !== "activity"),
				{
					kind: "room",
					id: "host-panel",
					label: "Host panel",
					icon: () => null,
					panelType: "host-panel",
					panelConfig: {},
					isDisabled: false,
					isLoading: false,
					onOpen: vi.fn(),
				},
			],
			// remove a command, after the panels are in the list
			slashCommands: (defaults) =>
				defaults.filter((command) => command.id !== "attach"),
		},
	} as unknown as ChatConfig;
	const { result } = renderHook(
		() =>
			useRoomSlashCommands({
				room: room,
				onOpenMcpOverlay: vi.fn(),
				onAttachFiles: vi.fn(),
				onSwitchToAgent: vi.fn(),
				canChooseAgent: false,
				prompts: [],
				onRunPrompt: vi.fn(),
			}),
		{
			wrapper: ({ children }: { children: ReactNode }) => (
				<ChatConfigContext.Provider value={config}>
					{children}
				</ChatConfigContext.Provider>
			),
		},
	);
	const ids = result.current.map((command) => command.id);
	expect(ids).toEqual(expect.arrayContaining(["files", "host-panel"]));
	expect(ids).not.toContain("activity");
	expect(ids).not.toContain("attach");
});
