import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { createTestHostConfig } from "../../testing/test-host-config";
import { ROOM_PANEL_TYPES } from "../workbench/room-sidebar";
import { RoomUiStore } from "../workbench/room-ui.store";
import { useNewRoom } from "./use-new-room";

const chat = vi.hoisted(() => ({
	createEmptyRoom: vi.fn(),
	closeRoom: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../host/chat.context", () => ({ useChat: () => ({ chat }) }));
let draft: RoomUiStore;
let prepared: RoomUiStore;
beforeEach(() => {
	vi.clearAllMocks();
	draft = new RoomUiStore({
		host: createTestHostConfig(),
		roomId: "temp",
	});
	draft.setOptions({ instructions: "Draft", mcp: [], predefinedPrompts: [] });
	prepared = new RoomUiStore({
		roomId: "prepared",
		host: createTestHostConfig(),
	});
});

test("prepares only on demand, shares concurrent requests, and disposes an abandoned draft", async () => {
	let resolve: (room: RoomUiStore) => void = () => {};
	chat.createEmptyRoom.mockReturnValue(
		new Promise<RoomUiStore>((done) => {
			resolve = done;
		}),
	);
	const submitted = { current: false };
	const { result, unmount } = renderHook(() =>
		useNewRoom(draft, "agent", submitted),
	);
	expect(chat.createEmptyRoom).not.toHaveBeenCalled();
	let first: Promise<RoomUiStore | null> | undefined;
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
		useNewRoom(draft, "chat", submitted),
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
	let resolve: (room: RoomUiStore) => void = () => {};
	chat.createEmptyRoom.mockReturnValue(
		new Promise<RoomUiStore>((done) => {
			resolve = done;
		}),
	);
	const submitted = { current: false };
	const { result, unmount } = renderHook(() =>
		useNewRoom(draft, "chat", submitted),
	);
	let pending: Promise<RoomUiStore | null> | undefined;
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
