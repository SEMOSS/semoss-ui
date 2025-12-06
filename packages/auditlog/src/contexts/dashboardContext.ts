import { createContext } from "react";
import type { DashboardStore } from "@/stores";

/**
 * Value
 */
type DashboardContextProps = {
	/** root store */
	dashboard: DashboardStore;
};

/**
 * Context
 */
export const DashboardContext = createContext<
	DashboardContextProps | undefined
>(undefined);
