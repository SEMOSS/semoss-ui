import { createContext } from "react";

/** Undefined is a standalone room; null is a shell whose header is mounting. */
export const CollaborationHeaderContext = createContext<
	HTMLDivElement | null | undefined
>(undefined);
