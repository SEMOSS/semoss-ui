import { createContext } from "react";
import type { WorkspaceStore } from "@/stores";

/**
 * Value
 */
export type WorkspaceContextType = {
	/** Widgets available to all of the blocks */
	workspace: WorkspaceStore;
};

/**
 * Context
 */
export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
	undefined,
);
