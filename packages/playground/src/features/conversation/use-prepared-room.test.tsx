import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import { RootStore } from "@/stores/root/root.store";
import { usePreparedRoom } from "./use-prepared-room";

const chat = vi.hoisted(() => ({
	createEmptyRoom: vi.fn(),
	closeRoom: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/hooks/use-chat", () => ({ useChat: () => ({ chat }) }));
let draft: RoomStore;
let prepared: RoomStore;
beforeEach(() => {
	vi.clearAllMocks();
	const theme = new RootStore().theme;
	draft = new RoomStore({ theme, roomId: "temp", panelComponents: {} });
	draft.setOptions({ instructions: "Draft", mcp: [], predefinedPrompts: [] });
	prepared = new RoomStore({
		theme,
		roomId: "prepared",
		panelComponents: {},
	});
});

test("prepares only on demand, shares concurrent requests, and disposes an abandoned draft", async () => {
	let resolve: (room: RoomStore) => void = () => {};
	chat.createEmptyRoom.mockReturnValue(
		new Promise<RoomStore>((done) => {
			resolve = done;
		}),
	);
	const submitted = { current: false };
	const { result, unmount } = renderHook(() =>
		usePreparedRoom(draft, "agent", submitted),
	);
	expect(chat.createEmptyRoom).not.toHaveBeenCalled();
	let first: Promise<RoomStore | null> | undefined;
	act(() => {
		first = result.current.prepare();
		expect(result.current.prepare()).toBe(first);
	});
	expect(chat.createEmptyRoom).toHaveBeenCalledTimes(1);
	expect(chat.createEmptyRoom).toHaveBeenCalledWith(
		"agent",
		"",
		expect.objectContaining({
			instructions: "Draft",
			harnessType: "semoss",
		}),
		undefined,
	);
	await act(async () => {
		draft.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION, {}, "Settings");
		resolve(prepared);
		await first;
	});
	expect(result.current.room).toBe(prepared);
	expect(prepared.workbench.getState().layout.actions.getSnapshot()).toEqual(
		draft.workbench.getState().layout.actions.getSnapshot(),
	);
	await act(async () => {
		expect(await result.current.prepare()).toBe(prepared);
	});
	unmount();
	expect(chat.closeRoom).toHaveBeenCalledWith("prepared");
});

test("failed preparation is retryable and submitted rooms survive unmount", async () => {
	chat.createEmptyRoom
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValueOnce(prepared);
	const submitted = { current: false };
	const { result, unmount } = renderHook(() =>
		usePreparedRoom(draft, "chat", submitted),
	);
	await act(async () => {
		await result.current.prepare();
	});
	expect(result.current.hasError).toBe(true);
	await act(async () => {
		await result.current.prepare();
	});
	expect(result.current.hasError).toBe(false);
	submitted.current = true;
	unmount();
	expect(chat.closeRoom).not.toHaveBeenCalled();
});

test("a late preparation result is disposed after navigating away", async () => {
	let resolve: (room: RoomStore) => void = () => {};
	chat.createEmptyRoom.mockReturnValue(
		new Promise<RoomStore>((done) => {
			resolve = done;
		}),
	);
	const submitted = { current: false };
	const { result, unmount } = renderHook(() =>
		usePreparedRoom(draft, "chat", submitted),
	);
	let pending: Promise<RoomStore | null> | undefined;
	act(() => {
		pending = result.current.prepare();
	});
	unmount();
	await act(async () => {
		resolve(prepared);
		await pending;
	});
	expect(chat.closeRoom).toHaveBeenCalledWith("prepared");
});
