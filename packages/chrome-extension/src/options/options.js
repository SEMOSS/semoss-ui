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
			"workshop_model_id",
			"workshop_access_key",
			"workshop_secret_key",
		]);

		console.log("Loaded settings:", result);

		if (result.workshop_endpoint) {
			document.getElementById("endpoint").value =
				result.workshop_endpoint;
		}
		if (result.workshop_module) {
			document.getElementById("module").value = result.workshop_module;
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
				workshop_model_id: document.getElementById("modelId").value,
				workshop_access_key: document.getElementById("accessKey").value,
				workshop_secret_key: document.getElementById("secretKey").value,
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
document.getElementById("test-btn").addEventListener("click", async () => {
	console.log("Test button clicked");
	showStatus("Testing connection...", "info");

	try {
		// Get current form values
		const settings = {
			workshop_endpoint: document.getElementById("endpoint").value,
			workshop_module: document.getElementById("module").value,
			workshop_model_id: document.getElementById("modelId").value,
			workshop_access_key: document.getElementById("accessKey").value,
			workshop_secret_key: document.getElementById("secretKey").value,
		};

		// Validate required fields
		if (
			!settings.workshop_endpoint ||
			!settings.workshop_access_key ||
			!settings.workshop_secret_key
		) {
			showStatus(
				"Please fill in Endpoint, Access Key, and Secret Key",
				"error",
			);
			return;
		}

		// Build test URL
		const url = `${settings.workshop_endpoint}${settings.workshop_module}/api/engine/runPixel`;

		// Simple test command - just ask LLM to respond
		const testPrompt = "Respond with: Connection successful";
		const escapedPrompt = testPrompt.replace(/"/g, '\\"');

		let pixelString;
		if (settings.workshop_model_id) {
			pixelString = `LLM(engine=["${settings.workshop_model_id}"], command=["${escapedPrompt}"], temperature=0.2, maxTokens=50);`;
		} else {
			pixelString = `LLM(command=["${escapedPrompt}"], temperature=0.2, maxTokens=50);`;
		}

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${btoa(`${settings.workshop_access_key}:${settings.workshop_secret_key}`)}`,
			},
			body: JSON.stringify({ expression: pixelString }),
		});

		const responseText = await response.text();
		console.log("Test response:", responseText);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = JSON.parse(responseText);

		// Check for errors
		if (data.pixelReturn && data.pixelReturn[0]) {
			const result = data.pixelReturn[0];

			if (
				result.operationType &&
				result.operationType.includes("ERROR")
			) {
				const errorMsg = result.output || "Unknown error";

				// Provide helpful messages
				if (errorMsg.includes("Model null does not exist")) {
					throw new Error(
						"Invalid Model ID. Please enter a valid Workshop LLM Engine ID (UUID format).",
					);
				}

				throw new Error(errorMsg);
			}

			// Success!
			showStatus(
				"✓ Connection successful! Workshop API is working.",
				"success",
			);
			return;
		}

		throw new Error("Unexpected response format");
	} catch (error) {
		console.error("Connection test failed:", error);
		showStatus("✗ Connection failed: " + error.message, "error");
	}
});

function showStatus(message, type) {
	console.log("Showing status:", message, type);
	const statusEl = document.getElementById("status");
	statusEl.textContent = message;
	statusEl.className = `status ${type}`;
	statusEl.style.display = "block";

	// Don't auto-hide for test results - let user read them
	if (type !== "info") {
		setTimeout(() => {
			statusEl.style.display = "none";
		}, 5000);
	}
}
