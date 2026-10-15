import { createContext } from "react";

/** Reveals the route's Workspace, including its narrow-screen tab. */
export const ConversationWorkspaceActionsContext = createContext<
	(() => void) | null
>(null);
