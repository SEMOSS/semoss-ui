import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { RoomStore } from "./room.store";

/** Stands in for a room that is not there, so the hook runs either way. */
const NO_ROOM = {
	getSnapshot: () => null,
	subscribe: () => () => {},
};

/**
 * Read a room and re-render when what you read changes. The selector reads
 * through the room's getters (`room.isLoading`, `room.history`,
 * `room.canCancel`), and runs again on every change to the room, which holds
 * its messages and tool calls; the component renders only when the value it
 * returns changes (compared one level deep). Read one message's streamed
 * content with `useMessage`, so a token renders only that message.
 *
 * @param room - The room; with none, the selector does not run.
 * @param selector - What to read.
 * @returns The selection, or undefined without a room.
 */
export function useRoomSelector<T>(
	room: RoomStore,
	selector: (room: RoomStore) => T,
): T;
export function useRoomSelector<T>(
	room: RoomStore | null | undefined,
	selector: (room: RoomStore) => T,
): T | undefined;
export function useRoomSelector<T>(
	room: RoomStore | null | undefined,
	selector: (room: RoomStore) => T,
): T | undefined {
	return useStoreSelector<unknown, T | undefined>(room ?? NO_ROOM, () =>
		room ? selector(room) : undefined,
	);
}
