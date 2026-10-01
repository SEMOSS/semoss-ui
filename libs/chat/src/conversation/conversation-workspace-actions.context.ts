import { createContext } from "react";

/** Reveals the conversation work area, including its narrow-screen tab. */
export const ConversationWorkspaceActionsContext = createContext<
	(() => void) | null
>(null);
