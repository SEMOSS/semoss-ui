import { useCallback, useState } from "react";

/** What {@link useWorkspaceNavigation} returns. */
interface WorkspaceNavigation {
	/** Whether the navigation shows now. */
	isNavigationOpen: boolean;
	/** Tell the hook the room's Workspace opened or closed. */
	setWorkAreaOpen: (isOpen: boolean) => void;
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
export function useWorkspaceNavigation(
	isPreferredOpen: boolean,
	onPreferenceChange: (isOpen: boolean) => void,
): WorkspaceNavigation {
	// `override` is the user's choice while the Workspace is open; null folds it.
	const [workArea, setWorkArea] = useState<{
		isOpen: boolean;
		override: boolean | null;
	}>({ isOpen: false, override: null });
	const setWorkAreaOpen = useCallback((isOpen: boolean) => {
		setWorkArea((current) =>
			current.isOpen === isOpen ? current : { isOpen, override: null },
		);
	}, []);
	const setNavigationOpen = (isOpen: boolean): void => {
		if (workArea.isOpen) {
			setWorkArea((current) => ({ ...current, override: isOpen }));
		} else {
			onPreferenceChange(isOpen);
		}
	};
	return {
		isNavigationOpen: workArea.isOpen
			? (workArea.override ?? false)
			: isPreferredOpen,
		setWorkAreaOpen,
		setNavigationOpen,
	};
}
