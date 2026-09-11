import { useContext } from "react";
import type { StoreApi } from "zustand";
import { WorkbenchStoreContext } from "@/contexts";
import type { WorkbenchState } from "@/stores/workbench";

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
