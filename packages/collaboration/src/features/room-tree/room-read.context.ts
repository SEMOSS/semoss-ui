import { createContext } from "react";

interface RoomReadContextValue {
	/** Mark a visible room read until the returned cleanup releases its view. */
	viewRoom: (roomId: string) => () => void;
}

/** Optional because standalone room surfaces do not own sidebar read state. */
export const RoomReadContext = createContext<RoomReadContextValue | null>(null);
