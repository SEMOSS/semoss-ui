import { useContext } from "react";
import { useStore } from "zustand";
import { WorkbenchStoreContext } from "../contexts/workbench.context";
import type { WorkbenchState } from "../stores";

/** Select state from the nearest scoped workbench store. */
export const useWorkbench = <T>(selector: (state: WorkbenchState) => T): T => {
	const store = useContext(WorkbenchStoreContext);
	if (!store) {
		throw new Error("useWorkbench must be used within a WorkbenchProvider");
	}

	return useStore(store, selector);
};
