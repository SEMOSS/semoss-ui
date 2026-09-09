import { createContext } from "react";
import type { PageStore } from "@/stores";

/**
 * Value
 */
type PageContextType = {
	/** Page store. */
	store: PageStore;
};

/**
 * Context
 */
export const PageContext = createContext<PageContextType | undefined>(
	undefined,
);
