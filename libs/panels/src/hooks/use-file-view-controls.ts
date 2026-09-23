import { useEffect } from "react";
import type { FileViewControls } from "../types/file-view.types";

/**
 * Hand the host this view's chrome state whenever any part of it changes.
 *
 * The object is rebuilt inside the effect from the individual fields rather
 * than taken as a dependency: a view assembles it inline every render, so
 * depending on it would publish on every render, and a workbench host writes
 * what it is handed to the dock, which re-renders the view: an infinite loop
 * rather than a slow one. Every field here is either a primitive or an
 * identity-stable callback, so the effect runs only on a real change.
 *
 * @param onControls - The host's receiver, or undefined when it draws no chrome.
 * @param controls - This render's control state.
 */
export const useFileViewControls = (
	onControls: ((controls: FileViewControls) => void) | undefined,
	controls: FileViewControls,
): void => {
	const {
		canRefresh,
		canSave,
		isBusy,
		isDirty,
		refresh,
		save,
		setViewMode,
		viewMode,
		viewModes,
	} = controls;

	useEffect(() => {
		onControls?.({
			canRefresh,
			canSave,
			isBusy,
			isDirty,
			refresh,
			save,
			setViewMode,
			viewMode,
			viewModes,
		});
	}, [
		onControls,
		canRefresh,
		canSave,
		isBusy,
		isDirty,
		refresh,
		save,
		setViewMode,
		viewMode,
		viewModes,
	]);
};
