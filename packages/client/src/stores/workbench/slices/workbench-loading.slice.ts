import type { WorkbenchSlice } from "../workbench.types";

/** Full-screen loading state owned by each workbench instance. */
interface WorkbenchLoadingSliceFields {
	/** Whether the workbench loading screen is visible. */
	isLoading: boolean;
}

/** Loading actions exposed under the store's `actions` namespace. */
interface WorkbenchLoadingActions {
	/**
	 * Set the loading state of the workbench.
	 *
	 * @param isLoading - Whether the workbench is currently loading.
	 */
	setLoading: (isLoading: boolean) => void;
}

/** The loading slice: fields plus its `actions` contribution. */
export interface WorkbenchLoadingSliceState
	extends WorkbenchLoadingSliceFields {
	actions: WorkbenchLoadingActions;
}

/**
 * Creates the full-screen loading state slice for one workbench.
 *
 * @name createWorkbenchLoadingSlice
 * @return Zustand state creator for the workbench loading slice.
 */
export const createWorkbenchLoadingSlice =
	(): WorkbenchSlice<WorkbenchLoadingSliceState> => (set) => ({
		isLoading: false,
		actions: {
			setLoading: (isLoading) => {
				set((root) => ({
					loading: { ...root.loading, isLoading: isLoading },
				}));
			},
		},
	});
