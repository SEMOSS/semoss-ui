import { useEffect } from "react";
import { subscribeUserConnectorTools } from "./connector-tools";
import type { ConnectorsStore } from "./connectors.store";

/**
 * Bring a chat up to date the moment the user saves their connectors
 * elsewhere on the page, such as on the settings page, rather than the next
 * time the chat is opened.
 *
 * @param connectors - The chat's connector state.
 */
export const useUserConnectorsSync = (connectors: ConnectorsStore): void => {
	useEffect(
		() =>
			subscribeUserConnectorTools((tools) => {
				connectors.applyUserConnectorTools(tools).catch((error) => {
					console.warn(
						"Could not update the chat's connectors",
						error,
					);
				});
			}),
		[connectors],
	);
};
