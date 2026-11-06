import { createContext } from "react";
import type { RootStore } from "@/host/root.store";

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
