import { createContext } from "react";
import type { RootStore } from "@/stores";

/**
 * Value
 */
type RootContextProps = {
	/** root store */
	root: RootStore;
};

/**
 * Context
 */
export const RootContext = createContext<RootContextProps | undefined>(
	undefined,
);
