import { createStore, type StoreApi } from "zustand";
import { createWorkbenchChatSlice, type WorkbenchChatSliceState } from "./chat";
import {
	createWorkbenchCommandSlice,
	createWorkbenchLayoutSlice,
	createWorkbenchLoadingSlice,
	type WorkbenchCommandSliceState,
	type WorkbenchLayoutSliceState,
	type WorkbenchLoadingSliceState,
} from "./slices";
import type { WorkbenchSlice } from "./workbench.types";

/** State and actions exposed by a scoped workbench store. */
export interface WorkbenchState
	extends WorkbenchLayoutSliceState,
		WorkbenchLoadingSliceState,
		WorkbenchCommandSliceState,
		WorkbenchChatSliceState {}

/**
 * Creates an isolated vanilla Zustand store for one workbench ID, optionally merging in one
 * namespaced domain slice (e.g. `{ database: DatabaseWorkbenchSliceState }`) contributed by the
 * engine-specific workbench that owns this instance.
 *
 * @name createWorkbenchStore
 * @param id - Unique workbench ID used to isolate the cache.
 * @param createDomainSlice - Optional namespaced domain slice merged into the same store.
 * @return Scoped workbench store composed from layout, loading, command, and optional extra slices.
 */
export const createWorkbenchStore = <
	TExtra extends object = Record<string, never>,
>(
	id: string,
	createDomainSlice?: WorkbenchSlice<TExtra, WorkbenchState & TExtra>,
): StoreApi<WorkbenchState & TExtra> => {
	const store = createStore<WorkbenchState & TExtra>()((...args) => ({
		// Base slices only ever read/write WorkbenchState fields, so widening their FullState
		// param here to WorkbenchState & TExtra is safe even though they aren't generic.
		...(
			createWorkbenchLayoutSlice(id) as WorkbenchSlice<
				WorkbenchLayoutSliceState,
				WorkbenchState & TExtra
			>
		)(...args),
		...(
			createWorkbenchLoadingSlice() as WorkbenchSlice<
				WorkbenchLoadingSliceState,
				WorkbenchState & TExtra
			>
		)(...args),
		...(
			createWorkbenchCommandSlice() as WorkbenchSlice<
				WorkbenchCommandSliceState,
				WorkbenchState & TExtra
			>
		)(...args),
		...(
			createWorkbenchChatSlice() as WorkbenchSlice<
				WorkbenchChatSliceState,
				WorkbenchState & TExtra
			>
		)(...args),
		...(createDomainSlice ? createDomainSlice(...args) : ({} as TExtra)),
	}));

	return store;
};
