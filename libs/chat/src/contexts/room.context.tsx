import { createContext, type ReactNode, useContext } from "react";
import type { RoomUiStore } from "../features/workbench/room-ui.store";

/** The room a sidebar panel, or a tool view in its conversation, belongs to. */
const RoomContext = createContext<RoomUiStore | undefined>(undefined);

interface RoomProviderProps {
	room: RoomUiStore;
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
export const useRoom = (): RoomUiStore => {
	const room = useContext(RoomContext);
	if (!room) {
		throw new Error("useRoom must be used underneath a RoomProvider");
	}
	return room;
};
