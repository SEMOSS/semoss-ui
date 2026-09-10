import { createStore, type StoreApi } from "zustand";
import type { Role } from "@semoss/sdk";
import {
	createWorkbenchAccessSlice,
	createWorkbenchCommandSlice,
	createWorkbenchControlsSlice,
	createWorkbenchLayoutSlice,
	createWorkbenchLoadingSlice,
	type WorkbenchAccessSliceState,
	type WorkbenchAccessType,
	type WorkbenchCommandSliceState,
	type WorkbenchControlsSliceState,
	type WorkbenchLayoutSliceState,
	type WorkbenchLoadingSliceState,
} from "./slices";

interface WorkbenchConfiguration {
	resource: {
		type: WorkbenchAccessType;
		id: string;
		permission: Role;
	};
}

/**
 * State and actions exposed by a scoped workbench store, one namespace per
 * domain. Each namespace carries its own fields and its own `actions` object,
 * created once per store — so selecting one never causes a re-render:
 * `const actions = useWorkbench((s) => s.layout.actions)`.
 */
export interface WorkbenchState {
	/** Record the active resource so panels can resolve its permission. */
	configure: (configuration: WorkbenchConfiguration) => void;
	access: WorkbenchAccessSliceState;
	layout: WorkbenchLayoutSliceState;
	loading: WorkbenchLoadingSliceState;
	command: WorkbenchCommandSliceState;
	control: WorkbenchControlsSliceState;
}

/**
 * Creates an isolated vanilla Zustand store for one workbench cache key. Domain
 * workbenches own their independent stores and React contexts; this store
 * contains only generic workbench state.
 *
 * The assistant is deliberately *not* a slice here. It owns its own store
 * (`stores/assistant`), created by the domain workbench and provided
 * separately, so the dock carries no agent-harness dependency.
 *
 * @name createWorkbenchStore
 * @param cacheKey - Unique key used to isolate persisted workbench state.
 * @return Scoped workbench store composed from the access, layout, loading,
 * command, and control slices.
 */
export const createWorkbenchStore = (
	cacheKey: string,
): StoreApi<WorkbenchState> => {
	return createStore<WorkbenchState>()((set, get, api) => {
		// Every slice takes the root set/get, returns its own state flat, and
		// is mounted under its namespace here.
		const access = createWorkbenchAccessSlice()(set, get, api);
		const layout = createWorkbenchLayoutSlice(cacheKey)(set, get, api);
		const loading = createWorkbenchLoadingSlice()(set, get, api);
		const command = createWorkbenchCommandSlice(cacheKey)(set, get, api);
		const control = createWorkbenchControlsSlice()(set, get, api);

		return {
			configure: ({ resource }) => {
				access.actions.syncPermission(
					resource.type,
					resource.id,
					resource.permission,
				);
			},
			access,
			layout,
			loading,
			command,
			control,
		};
	});
};
