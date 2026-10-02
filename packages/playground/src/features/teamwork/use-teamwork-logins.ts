import { useEffect } from "react";
import { useLogins } from "@semoss/sdk/react";
import type { TeamworkStore } from "./teamwork.store";

/**
 * Keep a view's sign in state current: hand the teamwork store what the SDK
 * knows about the session's logins, which it reads again when the view mounts
 * and whenever the window regains focus, and what the server says those sign
 * ins allow.
 *
 * @param teamwork - The room's teamwork state.
 */
export const useTeamworkLogins = (teamwork: TeamworkStore): void => {
	const { logins, status, connectorAccess, availableProviders } = useLogins();

	useEffect(() => {
		// nothing is known, sign ins offered included, until the config is read
		const isKnown = status !== "loading";
		teamwork.setSessionLogins({
			logins: isKnown ? logins : null,
			connectorAccess: connectorAccess,
			availableProviders: isKnown ? availableProviders : undefined,
		});
	}, [teamwork, logins, status, connectorAccess, availableProviders]);
};
