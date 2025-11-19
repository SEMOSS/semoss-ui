import { Env } from "./env";
import type { MCPToolRequest } from "./types";

/**
 * Method to add the listener for tool initialization
 */
export const addToolListener = (
	onRecieve: (toolRequest: MCPToolRequest) => void,
): void => {
	// only works in browser
	if (typeof window !== "undefined") {
		// add the listener
		window?.addEventListener(
			"message",
			(event) => {
				try {
					if (!event.data || event.data.type !== "SMSS_INIT_TOOL") {
						return;
					}

					const eventData = event.data as {
						type: "SMSS_INIT_TOOL";
						tool: MCPToolRequest;
					};

					onRecieve(eventData.tool);
				} catch {
					// noop
				}
			},
			false,
		);
	}
};

addToolListener((tool) => {
	Env.update({
		TOOL: tool,
	});
});
