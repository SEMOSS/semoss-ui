import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import type { ChatConfig } from "../chat/config/chat-config.context";
import { ChatConfigContext } from "../chat/config/chat-config.context";
import type { LocalFoldersHost } from "../local-folders/store/local-folders-host";
import type { RoomStore } from "../room/store/room.store";
import type { NewRoomPreparation } from "./use-new-room";
import { useNewRoomPanels } from "./use-new-room-panels";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

/** A room with what attaching reaches for. */
const createRoom = (attach = vi.fn(async () => undefined)) => {
	const localFolders = {
		folders: [] as { id: string; name: string }[],
		attach: vi.fn(async () => {
			await attach();
			localFolders.folders = [{ id: "f1", name: "notes" }];
		}),
	};
	return {
		localFolders,
		openWorkbench: vi.fn(),
		openWorkbenchFileExplorer: vi.fn(),
		connectors: {},
		workbenchPane: { isOpen: false },
	} as unknown as RoomStore & { localFolders: typeof localFolders };
};

const render = (
	preparation: NewRoomPreparation,
	localFolders?: LocalFoldersHost,
) => {
	const draft = createRoom();
	const config = { localFolders } as unknown as ChatConfig;
	const wrapper = ({ children }: { children: ReactNode }) => (
		<ChatConfigContext.Provider value={config}>
			{children}
		</ChatConfigContext.Provider>
	);
	const { result } = renderHook(
		() => useNewRoomPanels(draft, preparation, false),
		{ wrapper },
	);
	return { result, draft };
};

describe("a new chat's Attach Folder", () => {
	test("is not offered where the host cannot reach the user's files", () => {
		const { result } = render({
			room: null,
			isPreparing: false,
			hasError: false,
			prepare: vi.fn(),
		});

		expect(result.current.newRoomPanels.onAttachFolder).toBeUndefined();
	});

	test("prepares the room, attaches to it, and shows its Files", async () => {
		const room = createRoom();
		const prepare = vi.fn(async () => room);
		const { result } = render(
			{ room: null, isPreparing: false, hasError: false, prepare },
			{} as LocalFoldersHost,
		);

		await act(async () => {
			result.current.newRoomPanels.onAttachFolder?.();
		});

		expect(prepare).toHaveBeenCalledTimes(1);
		expect(room.localFolders.attach).toHaveBeenCalledTimes(1);
		expect(room.openWorkbenchFileExplorer).toHaveBeenCalledTimes(1);
	});

	test("uses the room already prepared", async () => {
		const room = createRoom();
		const prepare = vi.fn();
		const { result } = render(
			{ room, isPreparing: false, hasError: false, prepare },
			{} as LocalFoldersHost,
		);

		await act(async () => {
			result.current.newRoomPanels.onAttachFolder?.();
		});

		expect(prepare).not.toHaveBeenCalled();
		expect(room.localFolders.attach).toHaveBeenCalledTimes(1);
	});

	test("shows the Workspace's error when the room cannot be prepared", async () => {
		const prepare = vi.fn(async () => null);
		const { result, draft } = render(
			{ room: null, isPreparing: false, hasError: false, prepare },
			{} as LocalFoldersHost,
		);

		await act(async () => {
			result.current.newRoomPanels.onAttachFolder?.();
		});

		expect(draft.openWorkbench).toHaveBeenCalledTimes(1);
	});
});
