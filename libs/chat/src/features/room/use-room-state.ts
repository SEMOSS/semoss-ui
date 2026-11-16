import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { RoomSnapshot, RoomStore } from "./room.store";

/**
 * Read a room's own state (loading, error, mode, options, the sidebar, ...)
 * and re-render when it changes. Its messages and tool calls are stores of
 * their own: read them with `useMessage` and `useTool`.
 *
 * @param room - The room.
 * @param selector - What to read; the whole snapshot when left out.
 * @returns The selection.
 */
export const useRoomState = <T = RoomSnapshot>(
	room: RoomStore,
	selector: (snapshot: RoomSnapshot) => T = (snapshot) =>
		snapshot as unknown as T,
): T => useStoreSelector(room, selector);
