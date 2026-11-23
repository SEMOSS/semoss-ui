import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { RoomStore } from "../room/store/room.store";
import { useDraftPanels } from "./use-draft-panels";
import type { RoomPreparation } from "./use-prepared-room";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

/** A room with what preparing reaches for. */
const createRoom = () =>
	({
		openWorkbench: vi.fn(),
		openWorkbenchFileExplorer: vi.fn(),
		connectors: {},
		workbenchPane: { isOpen: false },
	}) as unknown as RoomStore;

const render = (preparation: RoomPreparation, isLoading = false) => {
	const draft = createRoom();
	const { result } = renderHook(() =>
		useDraftPanels(draft, preparation, isLoading),
	);
	return { result, draft };
};

describe("a new chat's prepareRoom", () => {
	test("prepares the room for what a host keeps for it", async () => {
		const room = createRoom();
		const prepare = vi.fn(async () => room);
		const { result } = render({
			room: null,
			isPreparing: false,
			hasError: false,
			prepare,
		});

		let prepared: RoomStore | null = null;
		await act(async () => {
			prepared = await result.current.draftPanels.prepareRoom();
		});

		expect(prepare).toHaveBeenCalledTimes(1);
		expect(prepared).toBe(room);
	});

	test("uses the room already prepared", async () => {
		const room = createRoom();
		const prepare = vi.fn();
		const { result } = render({
			room,
			isPreparing: false,
			hasError: false,
			prepare,
		});

		let prepared: RoomStore | null = null;
		await act(async () => {
			prepared = await result.current.draftPanels.prepareRoom();
		});

		expect(prepare).not.toHaveBeenCalled();
		expect(prepared).toBe(room);
	});

	test("leaves the Workspace closed when the room cannot be prepared", async () => {
		const prepare = vi.fn(async () => null);
		const { result, draft } = render({
			room: null,
			isPreparing: false,
			hasError: false,
			prepare,
		});

		let prepared: RoomStore | null = createRoom();
		await act(async () => {
			prepared = await result.current.draftPanels.prepareRoom();
		});

		expect(prepared).toBeNull();
		expect(draft.openWorkbench).not.toHaveBeenCalled();
	});

	test("prepares nothing while the first message creates the room", async () => {
		const prepare = vi.fn();
		const { result } = render(
			{ room: null, isPreparing: false, hasError: false, prepare },
			true,
		);

		let prepared: RoomStore | null = createRoom();
		await act(async () => {
			prepared = await result.current.draftPanels.prepareRoom();
		});

		expect(prepare).not.toHaveBeenCalled();
		expect(prepared).toBeNull();
	});
});
