import { createContext } from "react";

/** Undefined is a standalone room; null is a shell whose header is mounting. */
export const CollaborationHeaderContext = createContext<
	HTMLDivElement | null | undefined
>(undefined);

/** Registers the conversation column beside an open workbench for header sizing. */
export const CollaborationHeaderLayoutContext = createContext<
	((element: HTMLElement | null) => void) | undefined
>(undefined);
