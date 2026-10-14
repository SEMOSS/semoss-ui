import { createContext } from "react";

/** Reports the route's work-area visibility to the application shell. */
export const WorkspaceNavigationContext = createContext<
	((isOpen: boolean) => void) | null
>(null);
