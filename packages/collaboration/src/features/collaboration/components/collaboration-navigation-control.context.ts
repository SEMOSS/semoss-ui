import { createContext, type ReactNode } from "react";

/** Lets the active room header host the shell's shared navigation control. */
export const CollaborationNavigationControlContext =
	createContext<ReactNode>(null);
