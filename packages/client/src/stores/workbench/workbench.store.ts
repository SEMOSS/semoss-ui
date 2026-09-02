import { createStore, type StoreApi } from "zustand";
import {
	createWorkbenchAssistantNotificationSlice,
	createWorkbenchAssistantSlice,
	type WorkbenchAssistantNotificationSliceState,
	type WorkbenchAssistantSliceState,
} from "./assistant";
import {
	createWorkbenchCommandSlice,
	createWorkbenchControlsSlice,
	createWorkbenchEventsSlice,
	createWorkbenchLayoutSlice,
	createWorkbenchLoadingSlice,
	type WorkbenchCommandSliceState,
	type WorkbenchControlsSliceState,
	type WorkbenchEventsSliceState,
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
	/** Transient events scoped to this workbench instance. */
	events: WorkbenchEventsSliceState;
	assistant: WorkbenchAssistantSliceState;
	notifications: WorkbenchAssistantNotificationSliceState;
}

/**
 * Creates an isolated vanilla Zustand store for one workbench ID. Domain
 * state (e.g. the database workbench) lives in its own store, attached at
 * runtime via `layout.actions.attachDomainStore` — it is no longer merged in
 * here.
 *
 * @name createWorkbenchStore
 * @param id - Unique workbench ID used to isolate the cache.
 * @return Scoped workbench store composed from the layout, loading, command,
 * control, events, assistant, and assistant-notification slices.
 */
export const createWorkbenchStore = (id: string): StoreApi<WorkbenchState> => {
	return createStore<WorkbenchState>()((set, get, api) => {
		// Every slice takes the root set/get, returns its own state flat, and
		// is mounted under its namespace here.
		const layout = createWorkbenchLayoutSlice(id)(set, get, api);
		const loading = createWorkbenchLoadingSlice()(set, get, api);
		const command = createWorkbenchCommandSlice()(set, get, api);
		const control = createWorkbenchControlsSlice()(set, get, api);
		const events = createWorkbenchEventsSlice()(set, get, api);
		const assistant = createWorkbenchAssistantSlice(id)(set, get, api);
		// Subscribes to this store, so it is composed after the assistant
		// slice it watches.
		const notifications = createWorkbenchAssistantNotificationSlice()(
			set,
			get,
			api,
		);

		return {
			layout,
			loading,
			command,
			control,
			events,
			assistant,
			notifications,
		};
	});
};
