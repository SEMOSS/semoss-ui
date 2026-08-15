import { createStore, type StoreApi } from "zustand";
import {
	createWorkbenchCommandSlice,
	createWorkbenchLayoutSlice,
	createWorkbenchLoadingSlice,
	type WorkbenchCommandSliceState,
	type WorkbenchLayoutSliceState,
	type WorkbenchLoadingSliceState,
} from "./slices";

/** State and actions exposed by a scoped workbench store. */
export interface WorkbenchState
	extends WorkbenchLayoutSliceState,
		WorkbenchLoadingSliceState,
		WorkbenchCommandSliceState {}

/**
 * Creates an isolated vanilla Zustand store for one workbench ID.
 *
 * @name createWorkbenchStore
 * @param id - Unique workbench ID used to isolate the cache.
 * @param layout - initial layout for the workbench
 * @return Scoped workbench store composed from layout, loading, command, and action slices.
 */
export const createWorkbenchStore = (id: string): StoreApi<WorkbenchState> => {
	const store = createStore<WorkbenchState>()((...args) => ({
		...createWorkbenchLayoutSlice(id)(...args),
		...createWorkbenchLoadingSlice()(...args),
		...createWorkbenchCommandSlice()(...args),
	}));

	return store;
};
