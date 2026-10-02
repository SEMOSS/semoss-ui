import { useEffect } from "react";
import type { TeamworkStore } from "./teamwork.store";

/**
 * Keep a view's sign in state current: read the session's logins when it
 * mounts and whenever the window regains focus, so signing in or out in
 * another tab shows up, and read the server's login settings once. The read
 * is shared with the rest of the page and reused for a short while, so
 * focusing the window over and over does not read them each time.
 *
 * @param teamwork - The room's teamwork state.
 */
export const useTeamworkLogins = (teamwork: TeamworkStore): void => {
	useEffect(() => {
		const refresh = () => {
			void teamwork.refreshConnectedProviders();
		};
		refresh();
		void teamwork.refreshLoginConfig();
		window.addEventListener("focus", refresh);
		return () => window.removeEventListener("focus", refresh);
	}, [teamwork]);
};
