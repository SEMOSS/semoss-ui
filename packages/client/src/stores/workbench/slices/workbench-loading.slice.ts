import type { WorkbenchSlice } from "../workbench.types";

/** Full-screen loading state owned by each workbench instance. */
export interface WorkbenchLoadingSliceState {
	/** Whether the workbench loading screen is visible. */
	isLoading: boolean;

	/**
	 * Set the loading state of the workbench.
	 *
	 * @param isLoading - Whether the workbench is currently loading.
	 */
	setLoading: (isLoading: boolean) => void;
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
		setLoading: (isLoading) => {
			set(() => ({
				isLoading: isLoading,
			}));
		},
	});
