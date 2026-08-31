import type {
	WorkbenchControl,
	WorkbenchControlAny,
	WorkbenchPanelId,
	WorkbenchSlice,
} from "../workbench.types";

/** Panel-contributed chrome controls, keyed by panel instance. */
interface WorkbenchControlsSliceFields {
	/**
	 * One control per panel. The chrome draws only the active panel's control
	 * in each stack, so a registration for a hidden keepAlive panel simply
	 * waits until its tab is front again.
	 */
	controls: Record<WorkbenchPanelId, WorkbenchControlAny>;
}

/** Control actions exposed under the store's `actions` namespace. */
interface WorkbenchControlsActions {
	/**
	 * Register (or replace) a panel's chrome control.
	 *
	 * @param pid - Panel instance the control belongs to.
	 * @param control - The control to draw beside the panel's active tab.
	 * @return Cleanup that unregisters this panel's control.
	 */
	registerControl: <P, V>(
		pid: WorkbenchPanelId,
		control: WorkbenchControl<P, V>,
	) => () => void;
	/**
	 * Remove a panel's chrome control.
	 *
	 * @param pid - Panel instance to clear.
	 */
	unregisterControl: (pid: WorkbenchPanelId) => void;
}

/** The controls slice: fields plus its `actions` contribution. */
export interface WorkbenchControlsSliceState
	extends WorkbenchControlsSliceFields {
	actions: WorkbenchControlsActions;
}

/**
 * Creates the panel-controls slice for one workbench.
 *
 * @name createWorkbenchControlsSlice
 * @return Zustand state creator for the workbench controls slice.
 */
export const createWorkbenchControlsSlice =
	(): WorkbenchSlice<WorkbenchControlsSliceState> => (set, get) => ({
		controls: {},
		actions: {
			registerControl: (pid, control) => {
				set((root) => ({
					control: {
						...root.control,
						controls: { ...root.control.controls, [pid]: control },
					},
				}));
				return () => get().control.actions.unregisterControl(pid);
			},
			unregisterControl: (pid) => {
				set((root) => {
					if (!(pid in root.control.controls)) {
						return root;
					}
					const controls = { ...root.control.controls };
					delete controls[pid];
					return { control: { ...root.control, controls } };
				});
			},
		},
	});
