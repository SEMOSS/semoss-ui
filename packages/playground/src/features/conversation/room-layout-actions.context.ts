import { createContext } from "react";

/** What the room split view lets its header and the Workspace's panels do. */
export interface RoomLayoutActions {
	/**
	 * Brings the Workspace into view, selecting its tab on narrow screens.
	 *
	 * @param trigger - The header control that asked, which gets focus back
	 * when the Workspace closes.
	 */
	revealWorkbench: (trigger?: HTMLElement | null) => void;
	/** Whether the Workspace is open and on screen, not behind the Chat tab. */
	isWorkbenchVisible: boolean;
}

/** The room split view, for the panels that open in its Workspace. */
export const RoomLayoutActionsContext = createContext<RoomLayoutActions | null>(
	null,
);
