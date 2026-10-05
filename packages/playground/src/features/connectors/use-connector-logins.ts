import { useEffect } from "react";
import { useLogins } from "@semoss/sdk/react";
import type { ConnectorsStore } from "./connectors.store";

/**
 * Keep a view's sign in state current: hand the connectors store what the SDK
 * knows about the session's logins, which it reads again when the view mounts
 * and whenever the window regains focus, and what the server says those sign
 * ins allow.
 *
 * @param connectors - The room's connector state.
 */
export const useConnectorLogins = (connectors: ConnectorsStore): void => {
	const { logins, status, connectorAccess, availableProviders } = useLogins();

	useEffect(() => {
		// nothing is known, sign ins offered included, until the config is read
		const isKnown = status !== "loading";
		connectors.setSessionLogins({
			logins: isKnown ? logins : null,
			connectorAccess: connectorAccess,
			availableProviders: isKnown ? availableProviders : undefined,
		});
	}, [connectors, logins, status, connectorAccess, availableProviders]);
};
