import { createContext, type ReactNode, useContext } from "react";
import type { RoomStore } from "@/stores";

/** The room a sidebar panel belongs to. */
const RoomContext = createContext<RoomStore | undefined>(undefined);

interface RoomProviderProps {
	room: RoomStore;
	children: ReactNode;
}

/**
 * Provide the room to its sidebar panels.
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
