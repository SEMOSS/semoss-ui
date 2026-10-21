import { createContext, useContext } from "react";
import type { ToolWorkbenchContextValue } from "./types/tool-workbench";

export const ToolWorkbenchContext =
	createContext<ToolWorkbenchContextValue | null>(null);

/** Read the room-scoped tool workbench. */
export function useToolWorkbench(): ToolWorkbenchContextValue {
	const context = useContext(ToolWorkbenchContext);
	if (!context) {
		throw new Error(
			"useToolWorkbench must be used within ToolWorkbenchProvider",
		);
	}
	return context;
}
