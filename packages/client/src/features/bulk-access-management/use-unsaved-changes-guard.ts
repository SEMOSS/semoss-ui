import { useEffect } from "react";
import { type Blocker, useBlocker } from "react-router";

/**
 * Warns before changes that are not saved are lost by leaving their page. Closing or
 * reloading the tab gets the browser's own warning, and moving to another page
 * in the app waits until the user chooses.
 *
 * @param hasChanges - whether there are changes that are not saved
 * @returns the blocker for moves within the app: while its state is
 * "blocked", ask the user, then call its proceed or reset
 */
export const useUnsavedChangesGuard = (hasChanges: boolean): Blocker => {
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			hasChanges && currentLocation.pathname !== nextLocation.pathname,
	);

	useEffect(() => {
		if (!hasChanges) {
			return;
		}
		const warnBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", warnBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", warnBeforeUnload);
	}, [hasChanges]);

	return blocker;
};
