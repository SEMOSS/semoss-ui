import { createContext, useContext } from "react";

export interface VizNameEntry {
	id: string;
	name: string;
	eventParams?: string[];
	sheetName?: string;
}

/** All visualizations on the current dashboard, keyed by id. Provided by NewDashboardPage. */
export const VizNamesContext = createContext<VizNameEntry[]>([]);

export function useVizNames(): VizNameEntry[] {
	return useContext(VizNamesContext);
}
