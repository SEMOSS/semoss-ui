// Load saved settings
document.addEventListener("DOMContentLoaded", async () => {
	try {
		console.log("Loading settings...");

		if (!chrome || !chrome.storage) {
			console.error("Chrome API not available!");
			showStatus("Error: Chrome API not available", "error");
			return;
		}

		const result = await chrome.storage.local.get([
			"workshop_endpoint",
			"workshop_module",
			"workshop_app_id",
			"workshop_model_id",
			"workshop_access_key",
			"workshop_secret_key",
			"workshop_user_id",
		]);

		console.log("Loaded settings:", result);

		if (result.workshop_endpoint) {
			document.getElementById("endpoint").value =
				result.workshop_endpoint;
		}
		if (result.workshop_module) {
			document.getElementById("module").value = result.workshop_module;
		}
		if (result.workshop_app_id) {
			document.getElementById("appId").value = result.workshop_app_id;
		}
		if (result.workshop_model_id) {
			document.getElementById("modelId").value = result.workshop_model_id;
		}
		if (result.workshop_access_key) {
			document.getElementById("accessKey").value =
				result.workshop_access_key;
		}
		if (result.workshop_secret_key) {
			document.getElementById("secretKey").value =
				result.workshop_secret_key;
		}
		if (result.workshop_user_id) {
			document.getElementById("userId").value = result.workshop_user_id;
		}
	} catch (error) {
		console.error("Error loading settings:", error);
		showStatus(`Error loading settings: ${error.message}`, "error");
	}
});

// Save settings
document
	.getElementById("settings-form")
	.addEventListener("submit", async (e) => {
		e.preventDefault();

		console.log("Form submitted!");

		try {
			if (!chrome || !chrome.storage) {
				throw new Error("Chrome API not available");
			}

			const settings = {
				workshop_endpoint: document.getElementById("endpoint").value,
				workshop_module: document.getElementById("module").value,
				workshop_app_id: document.getElementById("appId").value,
				workshop_model_id: document.getElementById("modelId").value,
				workshop_access_key: document.getElementById("accessKey").value,
				workshop_secret_key: document.getElementById("secretKey").value,
				workshop_user_id: document.getElementById("userId").value,
			};

			console.log("Saving settings:", settings);

			await chrome.storage.local.set(settings);

			console.log("Settings saved successfully!");
			showStatus("Settings saved successfully!", "success");
		} catch (error) {
			console.error("Error saving settings:", error);
			showStatus(`Error: ${error.message}`, "error");
		}
	});

// Test connection (placeholder)
document.getElementById("test-btn").addEventListener("click", () => {
	console.log("Test button clicked");
	showStatus("Connection test not implemented yet (Phase 3)", "error");
});

function showStatus(message, type) {
	console.log("Showing status:", message, type);
	const statusEl = document.getElementById("status");
	statusEl.textContent = message;
	statusEl.className = `status ${type}`;
	statusEl.style.display = "block";

	setTimeout(() => {
		statusEl.style.display = "none";
	}, 3000);
}
