import { createContext } from "react";
import type { PageStore } from "@/stores";

/**
 * Value
 */
export type PageContextType = {
	/** Page store. */
	store: PageStore;
};

/**
 * Context
 */
export const PageContext = createContext<PageContextType | undefined>(
	undefined,
);
