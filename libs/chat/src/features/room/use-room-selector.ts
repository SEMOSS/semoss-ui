import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { RoomStore } from "./room.store";

/**
 * Read a room and re-render when what you read changes. The selector reads
 * through the room's getters (`room.isLoading`, `room.history`,
 * `room.canCancel`), and runs again on every change to the room, its
 * messages, and its tool calls; the component renders only when the value it
 * returns changes (compared one level deep). Read one message's streamed
 * content with `useMessage`, so a token renders only that message.
 *
 * @param room - The room.
 * @param selector - What to read.
 * @returns The selection.
 */
export const useRoomSelector = <T>(
	room: RoomStore,
	selector: (room: RoomStore) => T,
): T => useStoreSelector(room, () => selector(room));
