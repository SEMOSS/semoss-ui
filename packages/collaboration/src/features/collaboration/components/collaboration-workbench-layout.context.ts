import { createContext } from "react";

/** Connects a room's conversation column to the persistent workspace header. */
export interface CollaborationWorkbenchLayout {
	/** Constrain the shell header until this conversation releases its layout. */
	registerConversation: (element: HTMLDivElement) => () => void;
}

/** Standalone rooms retain their own header and do not reserve shell space. */
export const CollaborationWorkbenchLayoutContext =
	createContext<CollaborationWorkbenchLayout | null>(null);
