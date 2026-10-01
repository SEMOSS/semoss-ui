import { createContext } from "react";

/** Reports work-area visibility to the host application shell. */
export const WorkspaceNavigationContext = createContext<
	((isOpen: boolean) => void) | null
>(null);
