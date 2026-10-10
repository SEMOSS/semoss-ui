import { createContext, useContext } from "react";
import type { RoomConnectorsContextValue } from "./room-connectors.types";

export const RoomConnectorsContext =
	createContext<RoomConnectorsContextValue | null>(null);

/** Read the current chat's connector navigation and lifetime owner. */
export function useRoomConnectors(): RoomConnectorsContextValue {
	const context = useContext(RoomConnectorsContext);
	if (!context) throw new Error("RoomConnectorsProvider is required.");
	return context;
}
