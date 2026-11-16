import { createContext, type ReactNode, useContext } from "react";
import type { RoomStore } from "./room.store";

/** The room a sidebar panel, or a tool view in its conversation, belongs to. */
const RoomContext = createContext<RoomStore | undefined>(undefined);

interface RoomProviderProps {
	room: RoomStore;
	children: ReactNode;
}

/**
 * Provide the room to its sidebar panels, and to the tool views in its
 * conversation, which save into its files.
 *
 * Panel blueprints receive only their own `config` from the dock, so the room
 * arrives through context rather than a prop — the same way the client's
 * workbenches reach their domain stores.
 */
export function RoomProvider({ room, children }: RoomProviderProps) {
	return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
}

/** The nearest room. */
export const useRoom = (): RoomStore => {
	const room = useContext(RoomContext);
	if (!room) {
		throw new Error("useRoom must be used underneath a RoomProvider");
	}
	return room;
};

/**
 * The room a piece shows: the one it was given, else the nearest `RoomScope`.
 *
 * @param room - The room passed as a prop, if any.
 * @returns The room.
 * @throws Error when there is neither.
 */
export const useRoomOrContext = (room?: RoomStore): RoomStore => {
	const contextRoom = useContext(RoomContext);
	const resolved = room ?? contextRoom;
	if (!resolved) {
		throw new Error("Pass a room, or render this piece inside RoomScope");
	}
	return resolved;
};
