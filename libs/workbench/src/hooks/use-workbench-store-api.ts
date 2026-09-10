import { useContext } from "react";
import type { StoreApi } from "zustand";
import type { WorkbenchState } from "../store";
import { WorkbenchStoreContext } from "../workbench.context";

/**
 * The raw store handle of the nearest workbench, for vanilla
 * subscribe/getState use (event bridges, drag hit-testing, domain stores).
 */
export const useWorkbenchStoreApi = (): StoreApi<WorkbenchState> => {
	const store = useContext(WorkbenchStoreContext);
	if (!store) {
		throw new Error(
			"useWorkbenchStoreApi must be used within a WorkbenchProvider",
		);
	}

	return store;
};
