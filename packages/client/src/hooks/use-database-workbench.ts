import { useContext } from "react";
import { useStore } from "zustand";
import { DatabaseWorkbenchStoreContext } from "@/contexts/database-workbench.context";
import type { DatabaseWorkbenchState } from "@/stores/workbench/database";

/**
 * Typed accessor for the dedicated database store provided by the nearest
 * `DatabaseWorkbench` or `AdminQueryWorkbench`.
 */
export const useDatabaseWorkbench = <T>(
	selector: (state: DatabaseWorkbenchState) => T,
): T => {
	const databaseStore = useContext(DatabaseWorkbenchStoreContext);
	if (!databaseStore) {
		throw new Error(
			"useDatabaseWorkbench must be used underneath a database workbench store provider",
		);
	}

	return useStore(databaseStore, selector);
};
