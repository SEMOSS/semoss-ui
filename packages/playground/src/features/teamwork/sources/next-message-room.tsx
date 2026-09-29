import { createContext, type ReactNode, useContext } from "react";
import type { RoomStore } from "@/stores/room/room.store";

/**
 * The room whose next message the sidebar's viewers add to, when it is not
 * the sidebar's own room.
 */
const NextMessageRoomContext = createContext<RoomStore | null>(null);

/** Props for {@link NextMessageRoomProvider}. */
export interface NextMessageRoomProviderProps {
	/** The room whose input shows what is added, and sends it. */
	room: RoomStore;
	children: ReactNode;
}

/**
 * Have the viewers below queue what they add to context on another room than
 * the one whose sidebar they are in. The new-chat page queues on its draft,
 * whose input shows the queue, while the viewers run in the room it created
 * early; the room takes the queue when the first message is sent.
 */
export const NextMessageRoomProvider = ({
	room,
	children,
}: NextMessageRoomProviderProps) => (
	<NextMessageRoomContext.Provider value={room}>
		{children}
	</NextMessageRoomContext.Provider>
);

/**
 * The room a viewer should queue on, when it is not the sidebar's own.
 *
 * @return The room, or null for the sidebar's own.
 */
export const useNextMessageRoom = (): RoomStore | null =>
	useContext(NextMessageRoomContext);
