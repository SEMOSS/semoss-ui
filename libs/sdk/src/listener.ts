import { Env } from "./env";

/**
 * Listener to messages on the window
 */
(() => {
	// add the listener
	window?.addEventListener(
		"message",
		(event) => {
			console.log("Message received:", event.data, event.origin);

			try {
				if (!event.data || event.data.type !== "SMSS_INIT_TOOL") {
					return;
				}

				const eventData = event.data as {
					type: "SMSS_INIT_TOOL";
					tool: {
						type: "MCP";
						message: string;
						id: string;
						name: string;
						parameters: Record<string, unknown>;
					};
				};

				Env.update({
					TOOL: {
						type: eventData.tool.type,
						message: eventData.tool.message || "",
						id: eventData.tool.id || "",
						name: eventData.tool.name || "",
						parameters: eventData.tool.parameters || {},
					},
				});
			} catch {
				// noop
			}
		},
		false,
	);
})();
