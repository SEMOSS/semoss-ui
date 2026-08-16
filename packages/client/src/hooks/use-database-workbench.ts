import type { WorkbenchState } from "@/stores/workbench";
import type { DatabaseWorkbenchSliceState } from "@/stores/workbench/database";
import { useWorkbench } from "./use-workbench";

/**
 * Typed accessor for the `database` slice merged into a workbench store by `DatabaseWorkbench`.
 * Only valid within a `WorkbenchProvider` configured with `createDatabaseWorkbenchSlice`.
 */
export const useDatabaseWorkbench = <T>(
	selector: (state: DatabaseWorkbenchSliceState["database"]) => T,
): T =>
	useWorkbench((state) =>
		selector(
			(state as WorkbenchState & DatabaseWorkbenchSliceState).database,
		),
	);
