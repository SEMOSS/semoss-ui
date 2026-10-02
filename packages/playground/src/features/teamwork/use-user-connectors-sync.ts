import { useEffect } from "react";
import { subscribeUserConnectorTools } from "./connectors/connector-tools";
import type { TeamworkStore } from "./teamwork.store";

/**
 * Bring a chat up to date the moment the user saves their connectors
 * elsewhere on the page, such as on the settings page, rather than the next
 * time the chat is opened.
 *
 * @param teamwork - The chat's teamwork state.
 */
export const useUserConnectorsSync = (teamwork: TeamworkStore): void => {
	useEffect(
		() =>
			subscribeUserConnectorTools((tools) => {
				teamwork.applyUserConnectorTools(tools).catch((error) => {
					console.warn(
						"Could not update the chat's connectors",
						error,
					);
				});
			}),
		[teamwork],
	);
};
