import { createContext, useContext } from "react";
import type { RoomTreeState } from "./room-tree.types";

export const RoomTreeContext = createContext<RoomTreeState | null>(null);

/** Access room navigation without reloading it when the current route changes. */
export function useRoomTree(): RoomTreeState {
	const value = useContext(RoomTreeContext);
	if (!value) throw new Error("RoomTreeProvider is required");
	return value;
}
