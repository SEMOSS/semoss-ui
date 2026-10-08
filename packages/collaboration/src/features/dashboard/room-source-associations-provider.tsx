import { type ReactNode, useRef, useState } from "react";
import type { InsightActions } from "@/lib/pixel";
import { createRoomSourceAssociations } from "./room-source-associations";
import { RoomSourceAssociationsContext } from "./room-source-associations.context";

interface RoomSourceAssociationsProviderProps {
	/** Read-only transport for the current authenticated insight. */
	actions: InsightActions;
	/** Shell content that may opt into source metadata. */
	children: ReactNode;
}

/** Key this provider by account and insight so source identities never cross owners. */
export function RoomSourceAssociationsProvider({
	actions,
	children,
}: RoomSourceAssociationsProviderProps) {
	const actionsRef = useRef(actions);
	actionsRef.current = actions;
	const [associations] = useState(() =>
		createRoomSourceAssociations(() => actionsRef.current),
	);
	return (
		<RoomSourceAssociationsContext.Provider value={associations}>
			{children}
		</RoomSourceAssociationsContext.Provider>
	);
}
