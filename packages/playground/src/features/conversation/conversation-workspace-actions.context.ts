import { createContext } from "react";

/** What the route's conversation workspace lets its header and places do. */
export interface ConversationWorkspaceActions {
	/**
	 * Brings the work area into view, selecting its tab on narrow screens.
	 *
	 * @param trigger - The header control that asked, which gets focus back
	 * when the work area closes.
	 */
	revealWorkArea: (trigger?: HTMLElement | null) => void;
	/** Whether the work area is open and on screen, not behind the Chat tab. */
	isWorkAreaVisible: boolean;
}

/** The route's conversation workspace, for the places that open in it. */
export const ConversationWorkspaceActionsContext =
	createContext<ConversationWorkspaceActions | null>(null);
