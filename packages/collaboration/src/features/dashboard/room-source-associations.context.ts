import { createContext, useContext } from "react";
import type { RoomSourceAssociations } from "./room-source-associations";

export const RoomSourceAssociationsContext =
	createContext<RoomSourceAssociations | null>(null);

/** Access the authenticated shell's metadata cache without loading any rooms. */
export function useRoomSourceAssociations(): RoomSourceAssociations {
	const value = useContext(RoomSourceAssociationsContext);
	if (!value) throw new Error("RoomSourceAssociationsProvider is required");
	return value;
}
