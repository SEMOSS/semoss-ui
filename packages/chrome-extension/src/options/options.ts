/**
 * Options page logic for Chrome Extension settings
 * Handles Semoss authentication and project selection
 */

import { AuthService, type Project } from "../services/authService";

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
function showStatus(message: string, type: "success" | "error" | "info") {
	if (authStatus) {
		authStatus.textContent = message;
		authStatus.className = `status ${type} show`;

		// Auto-hide after 5 seconds for success messages
		if (type === "success") {
			setTimeout(() => {
				authStatus.classList.remove("show");
			}, 5000);
		}
	}
}

/**
 * Auto-select and save "Playwright recorded scripts" project
 */
function populateProjects(projects: Project[]) {
	// Filter to only show projects where user can edit
	const editableProjects = projects.filter((p) => p.canEdit);

	if (editableProjects.length === 0) {
		showStatus("You don't have edit permission for any projects", "error");
		return;
	}

	// Auto-select "Playwright recorded scripts" project
	const playwrightProject = editableProjects.find((p) => {
		const name = (p.name || "").toLowerCase();
		const displayName = (p.displayName || "").toLowerCase();

		// Exact match for "Playwright recorded scripts"
		if (
			name === "playwright recorded scripts" ||
			displayName === "playwright recorded scripts"
		) {
			return true;
		}

		// Match if contains both "playwright" and "recorded" or "scripts"
		return (
			(name.includes("playwright") &&
				(name.includes("recorded") || name.includes("scripts"))) ||
			(displayName.includes("playwright") &&
				(displayName.includes("recorded") ||
					displayName.includes("scripts")))
		);
	});

	if (playwrightProject) {
		// Auto-save the selected project
		AuthService.saveSelectedProject(playwrightProject.id).then(() => {
			showStatus(
				`✅ Connected successfully! Recordings will be saved to: Playwright recorded scripts`,
				"success",
			);
		});
	} else {
		showStatus(
			"✅ Connected successfully! Recordings will be saved to your project.",
			"success",
		);
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

		// Populate projects
		populateProjects(response.projects);
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

		// Populate projects
		populateProjects(response.projects);
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

			// Show saved status if authenticated
			const isAuth = await AuthService.isAuthenticated();
			if (isAuth) {
				showStatus(
					"✅ Connected successfully! Recordings will be saved to: Playwright recorded scripts",
					"success",
				);
			}
		}
	} catch (error) {
		console.error("Failed to load saved credentials:", error);
	}
});
