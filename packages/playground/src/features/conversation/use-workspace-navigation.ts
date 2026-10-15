import { useCallback, useState } from "react";

interface WorkspaceNavigation {
	isNavigationOpen: boolean;
	setWorkAreaOpen: (isOpen: boolean) => void;
	setNavigationOpen: (isOpen: boolean) => void;
}

/** Temporarily folds navigation without changing the user's saved preference. */
export function useWorkspaceNavigation(
	isPreferredOpen: boolean,
	onPreferenceChange: (isOpen: boolean) => void,
): WorkspaceNavigation {
	const [workspace, setWorkspace] = useState<{
		isOpen: boolean;
		override: boolean | null;
	}>({ isOpen: false, override: null });
	const setWorkAreaOpen = useCallback((isOpen: boolean) => {
		setWorkspace((current) =>
			current.isOpen === isOpen ? current : { isOpen, override: null },
		);
	}, []);
	const setNavigationOpen = (isOpen: boolean): void => {
		if (workspace.isOpen) {
			setWorkspace((current) => ({ ...current, override: isOpen }));
		} else {
			onPreferenceChange(isOpen);
		}
	};
	return {
		isNavigationOpen: workspace.isOpen
			? (workspace.override ?? false)
			: isPreferredOpen,
		setWorkAreaOpen,
		setNavigationOpen,
	};
}
