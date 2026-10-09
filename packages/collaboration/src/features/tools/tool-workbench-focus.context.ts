import { createContext } from "react";

/** Return focus to the visible dock after a panel removes its focused control. */
export const ToolWorkbenchFocusContext = createContext<(() => void) | null>(
	null,
);
