// MAIN world bridge - communicates with portal page
// This script runs in the page's main world context and can access window.postMessage
// It bridges communication between the portal page and the isolated content script
(function () {
	console.log("[MAIN-BRIDGE] Loaded in MAIN world");

	// Listen for messages from portal page
	window.addEventListener("message", (event) => {
		// Only accept messages from the same window
		if (event.source !== window) return;

		// Portal sends PING_EXTENSION to check if extension is available
		if (event.data?.type === "PING_EXTENSION") {
			console.log("[MAIN-BRIDGE] 🏓 Received PING from portal, relaying to isolated");
			// Relay to isolated content script
			window.postMessage({ type: "EXTENSION_PING_BRIDGE" }, "*");
		}

		// Portal sends EXECUTE_PLAYWRIGHT_SCRIPT to run a script
		if (event.data?.type === "EXECUTE_PLAYWRIGHT_SCRIPT") {
			console.log("[MAIN-BRIDGE] 📤 Received EXECUTE from portal, relaying to isolated");
			// Relay to isolated content script with payload
			window.postMessage(
				{
					type: "EXECUTE_SCRIPT_BRIDGE",
					payload: event.data.payload,
				},
				"*"
			);
		}
	});

	// Listen for responses from isolated content script
	window.addEventListener("message", (event) => {
		// Only accept messages from the same window
		if (event.source !== window) return;

		// Isolated script responds with EXTENSION_READY_BRIDGE
		if (event.data?.type === "EXTENSION_READY_BRIDGE") {
			console.log("[MAIN-BRIDGE] ✅ Received READY from isolated, sending to portal");
			// Forward to portal as EXTENSION_READY
			window.postMessage({ type: "EXTENSION_READY" }, "*");
		}

		// Forward completion/error messages from isolated script to portal
		if (
			event.data?.type === "PLAYWRIGHT_SCRIPT_COMPLETED" ||
			event.data?.type === "PLAYWRIGHT_SCRIPT_ERROR"
		) {
			console.log("[MAIN-BRIDGE] 📨 Forwarding result to portal:", event.data.type);
			window.postMessage(event.data, "*");
		}
	});

	console.log("[MAIN-BRIDGE] ✅ Event listeners registered");
})();
