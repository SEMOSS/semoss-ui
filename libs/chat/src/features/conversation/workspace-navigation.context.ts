import { createContext } from "react";

/**
 * Reports whether the room's Workspace is open to the application shell, so
 * the host can adjust its navigation. Null when the host does not listen.
 */
export const WorkspaceNavigationContext = createContext<
	((isOpen: boolean) => void) | null
>(null);
