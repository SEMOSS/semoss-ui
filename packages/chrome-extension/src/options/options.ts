/**
 * Options page logic for Chrome Extension settings
 * Handles Semoss authentication
 */

import { AuthService } from "../services/authService";

// DOM elements
const endpointUrlInput = document.getElementById(
	"endpointUrl",
) as HTMLInputElement;
const clientKeyInput = document.getElementById("clientKey") as HTMLInputElement;
const secretKeyInput = document.getElementById("secretKey") as HTMLInputElement;
const testConnectionBtn = document.getElementById("testConnection");
const saveSettingsBtn = document.getElementById("saveSettings");
const authStatus = document.getElementById("authStatus");

/**
 * Show status message
 */
function showStatus(
	message: string,
	type: "success" | "error" | "info",
	element: HTMLElement | null = authStatus,
) {
	if (element) {
		element.textContent = message;
		element.className = `status ${type} show`;

		// Auto-hide after 5 seconds for success messages
		if (type === "success") {
			setTimeout(() => {
				element.classList.remove("show");
			}, 5000);
		}
	}
}

/**
 * Test connection button handler
 */
testConnectionBtn?.addEventListener("click", async () => {
	try {
		const endpointUrl = endpointUrlInput.value.trim();
		const clientKey = clientKeyInput.value.trim();
		const secretKey = secretKeyInput.value.trim();

		if (!endpointUrl || !clientKey || !secretKey) {
			showStatus(
				"Please fill in all required fields (Endpoint URL, Client Key, Secret Key)",
				"error",
			);
			return;
		}

		showStatus("Testing connection...", "info");

		const response = await AuthService.testConnection({
			endpointUrl,
			clientKey,
			secretKey,
		});

		showStatus(
			`✅ Connected successfully! Welcome, ${response.userName} (${response.userEmail})`,
			"success",
		);
	} catch (error) {
		console.error("Test connection failed:", error);
		showStatus(
			`❌ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			"error",
		);
	}
});

/**
 * Save settings button handler
 */
saveSettingsBtn?.addEventListener("click", async () => {
	try {
		const endpointUrl = endpointUrlInput.value.trim();
		const clientKey = clientKeyInput.value.trim();
		const secretKey = secretKeyInput.value.trim();

		if (!endpointUrl || !clientKey || !secretKey) {
			showStatus(
				"Please fill in all required fields (Endpoint URL, Client Key, Secret Key)",
				"error",
			);
			return;
		}

		showStatus("Authenticating and saving...", "info");

		// Test connection first
		const response = await AuthService.authenticate({
			endpointUrl,
			clientKey,
			secretKey,
		});

		// Save credentials and projects
		await AuthService.saveCredentials(
			{ endpointUrl, clientKey, secretKey },
			response.projects,
		);

		showStatus("✅ Settings saved successfully!", "success");
	} catch (error) {
		console.error("Save settings failed:", error);
		showStatus(
			`❌ Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
			"error",
		);
	}
});

/**
 * Load saved credentials on page load
 */
document.addEventListener("DOMContentLoaded", async () => {
	try {
		const credentials = await AuthService.getCredentials();

		if (credentials) {
			endpointUrlInput.value = credentials.endpointUrl;
			clientKeyInput.value = credentials.clientKey;
			secretKeyInput.value = credentials.secretKey;

			// Check authentication status
			const isAuth = await AuthService.isAuthenticated();
			if (isAuth) {
				showStatus("✅ Connected", "success");
			}
		}
	} catch (error) {
		console.error("Failed to load saved credentials:", error);
	}
});
