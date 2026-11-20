import { useCallback, useState } from "react";

/** What {@link useWorkbenchNavigation} returns. */
interface WorkbenchNavigation {
	/** Whether the navigation shows now. */
	isNavigationOpen: boolean;
	/** Tell the hook the room's Workspace opened or closed. */
	setWorkbenchOpen: (isOpen: boolean) => void;
	/** Open or close the navigation, as the user asked. */
	setNavigationOpen: (isOpen: boolean) => void;
}

/**
 * Fold the navigation while the room's Workspace is open, without changing
 * the user's saved preference. While it is open, opening or closing the
 * navigation lasts until it closes; otherwise it saves the preference.
 *
 * @param isPreferredOpen - The user's saved preference.
 * @param onPreferenceChange - Saves a new preference.
 * @returns Whether the navigation shows, and the calls that change it.
 */
export function useWorkbenchNavigation(
	isPreferredOpen: boolean,
	onPreferenceChange: (isOpen: boolean) => void,
): WorkbenchNavigation {
	// `override` is the user's choice while the Workspace is open; null folds it.
	const [workbench, setWorkbench] = useState<{
		isOpen: boolean;
		override: boolean | null;
	}>({ isOpen: false, override: null });
	const setWorkbenchOpen = useCallback((isOpen: boolean) => {
		setWorkbench((current) =>
			current.isOpen === isOpen ? current : { isOpen, override: null },
		);
	}, []);
	const setNavigationOpen = (isOpen: boolean): void => {
		if (workbench.isOpen) {
			setWorkbench((current) => ({ ...current, override: isOpen }));
		} else {
			onPreferenceChange(isOpen);
		}
	};
	return {
		isNavigationOpen: workbench.isOpen
			? (workbench.override ?? false)
			: isPreferredOpen,
		setWorkbenchOpen,
		setNavigationOpen,
	};
}
