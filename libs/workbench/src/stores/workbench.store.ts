import { createStore, type StoreApi } from "zustand";
import type { WorkbenchLayoutSliceOptions } from "./slices";
import {
	createWorkbenchCommandSlice,
	createWorkbenchControlsSlice,
	createWorkbenchLayoutSlice,
	createWorkbenchLoadingSlice,
	type WorkbenchCommandSliceState,
	type WorkbenchControlsSliceState,
	type WorkbenchLayoutSliceState,
	type WorkbenchLoadingSliceState,
} from "./slices";

/**
 * State and actions exposed by a scoped workbench store, one namespace per
 * domain. Each namespace carries its own fields and its own `actions` object,
 * created once per store — so selecting one never causes a re-render:
 * `const actions = useWorkbench((s) => s.layout.actions)`.
 */
export interface WorkbenchState {
	layout: WorkbenchLayoutSliceState;
	loading: WorkbenchLoadingSliceState;
	command: WorkbenchCommandSliceState;
	control: WorkbenchControlsSliceState;
}

/** What one workbench store is built with. */
export type WorkbenchStoreOptions = WorkbenchLayoutSliceOptions;

/**
 * Creates an isolated vanilla Zustand store for one workbench. Domain
 * workbenches own their independent stores and React contexts; this store
 * contains only generic workbench state.
 *
 * Blueprints are supplied here rather than registered later because the store
 * itself reads them from its first call -- `matchPanels` takes each type's
 * identity rule from the map, and a host that opens a panel before its shell
 * has ever mounted would otherwise dedupe against a shallow compare.
 *
 * Persistence is the host's: the shell's `onChange` and `onUnmount` props hand
 * back a snapshot, and `layout.actions.getSnapshot()` is that same read for a
 * host driving the dock itself. Nothing here touches storage.
 *
 * Neither the assistant nor resource access is a slice here. The assistant
 * owns its own store (`stores/assistant`), created by the domain workbench;
 * permissions live on the session store, because they are a fact about
 * (user, resource) rather than about one dock. What is left is generic enough
 * to carry no SEMOSS dependency at all.
 *
 * @name createWorkbenchStore
 * @param options - The blueprints this dock can open.
 * @return Scoped workbench store composed from the layout, loading, command,
 * and control slices.
 */
export const createWorkbenchStore = (
	options: WorkbenchStoreOptions,
): StoreApi<WorkbenchState> => {
	return createStore<WorkbenchState>()((set, get, api) => {
		// Every slice takes the root set/get, returns its own state flat, and
		// is mounted under its namespace here.
		const layout = createWorkbenchLayoutSlice(options)(set, get, api);
		const loading = createWorkbenchLoadingSlice()(set, get, api);
		const command = createWorkbenchCommandSlice()(set, get, api);
		const control = createWorkbenchControlsSlice()(set, get, api);

		return {
			layout,
			loading,
			command,
			control,
		};
	});
};
