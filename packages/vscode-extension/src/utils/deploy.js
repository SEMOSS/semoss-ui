const vscode = require("vscode");
const fs = require("node:fs");
const { post } = require("@semoss/sdk/react");
const FormData = require("form-data");

let SEMOSS_URL = "";
let headers = {};
let encoded = "";
let outputFilePath = "";

/**
 * Helper function to get meaningful error messages from axios errors
 * @param {Error} error - The axios error
 * @returns {string} - A user-friendly error message
 */
function getErrorMessage(error) {
	if (error.response) {
		// Server responded with error status
		return `Server error ${error.response.status}: ${error.response.statusText}`;
	} else if (error.request) {
		// Request made but no response received
		return "No response from server - check your connection and server URL";
	} else {
		// Error in setting up the request
		return error.message;
	}
}

/**
 * Configure deployment settings
 * @param {Object} config - The configuration object
 * @param {string} config.semossUrl - The Semoss URL
 * @param {Object} config.authHeaders - The authentication headers
 * @param {string} config.base64Encoded - The base64 encoded credentials
 * @param {string} config.outputPath - The output file path
 */
function setDeployConfig(config) {
	SEMOSS_URL = config.semossUrl;
	headers = config.authHeaders;
	encoded = config.base64Encoded;
	outputFilePath = config.outputPath;
}

/**
 * Deploy the project to Semoss
 * @param {string} projectId - The project ID
 * @returns {Promise<void>}
 */
async function deployProject(projectId, progressCallback) {
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "Deploying Project",
			cancellable: false,
		},
		async (progress) => {
			progress.report({ increment: 10 });
			progressCallback?.("Creating new insight...");

			let response,
				params,
				insightId = "";

			// Create new insight
			try {
				params = new URLSearchParams();
				params.append("expression", "true");
				params.append("insightId", "new");

				response = await post(
					`${SEMOSS_URL}/Monolith/api/engine/runPixel`,
					params,
					{ headers },
				);
				insightId = response.data.insightID;
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to create new insight: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to create new insight: ${getErrorMessage(error)}`,
				);
				return;
			}

			if (!insightId) {
				vscode.window.showErrorMessage(
					"Empty insight ID returned created",
				);
				progressCallback?.("Empty insight ID returned created");
				return;
			}

			progress.report({ increment: 15 });
			progressCallback?.("Deleting existing assets (if any)...");

			// Delete existing assets
			try {
				params = new URLSearchParams();
				params.append(
					"expression",
					`DeleteAsset(filePath=["version/assets/"], space=["${projectId}"]);`,
				);
				params.append("insightId", insightId);

				console.log(`Deleting assets for project: ${projectId}`);
				response = await post(
					`${SEMOSS_URL}/Monolith/api/engine/runPixel`,
					params,
					{ headers },
				);
			} catch (error) {
				console.error("Delete assets error:", error);
				vscode.window.showErrorMessage(
					`Failed to delete assets: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to delete assets: ${getErrorMessage(error)}`,
				);
				return;
			}

			// Check if deletion was successful or if assets didn't exist (both are OK)
			if (response.data.pixelReturn[0].operationType[0] !== "SUCCESS") {
				const errorOutput = response.data.pixelReturn[0].output;
				console.error("Delete assets failed:", errorOutput);

				// If the error is just that the folder doesn't exist, that's fine - continue
				if (
					errorOutput?.includes("does not exist") ||
					errorOutput?.includes("not found")
				) {
					console.log(
						"Assets folder does not exist, continuing with upload...",
					);
				} else {
					vscode.window.showErrorMessage(
						`Failed to delete assets: ${errorOutput}`,
					);
					progressCallback?.(
						`Failed to delete assets: ${errorOutput}`,
					);
					return;
				}
			} else {
				console.log("Assets deleted successfully");
				progressCallback?.("Assets deleted successfully");
			}

			progress.report({ increment: 20 });
			progressCallback?.("Uploading new assets...");

			// Upload new assets
			try {
				// Verify the file exists and is readable
				if (!fs.existsSync(outputFilePath)) {
					vscode.window.showErrorMessage(
						`Upload file does not exist: ${outputFilePath}`,
					);
					progressCallback?.(
						`Upload file does not exist: ${outputFilePath}`,
					);
					return;
				}

				const stats = fs.statSync(outputFilePath);
				if (stats.size === 0) {
					vscode.window.showErrorMessage(
						`Upload file is empty: ${outputFilePath}`,
					);
					progressCallback?.(
						`Upload file is empty: ${outputFilePath}`,
					);
					return;
				}

				const formData = new FormData();
				formData.append("file", fs.createReadStream(outputFilePath));

				console.log(
					`Uploading file: ${outputFilePath} (${Math.round(stats.size / 1024)} KB) to project: ${projectId}`,
				);
				response = await post(
					`${SEMOSS_URL}/Monolith/api/uploadFile/baseUpload?insightId=${insightId}&projectId=${projectId}&path=version/assets/`,
					formData,
					{
						headers: {
							...formData.getHeaders(),
							Authorization: `Basic ${encoded}`,
						},
						timeout: 60000, // 60 second timeout for large files
					},
				);
			} catch (error) {
				console.error("Upload assets error:", error);
				vscode.window.showErrorMessage(
					`Failed to upload assets: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to upload assets: ${getErrorMessage(error)}`,
				);
				return;
			}

			if (
				!response.data ||
				!response.data[0] ||
				!response.data[0].fileLocation
			) {
				console.error("Upload response:", response.data);
				vscode.window.showErrorMessage(
					"Failed to upload assets: Invalid response from server",
				);
				progressCallback?.(
					"Failed to upload assets: Invalid response from server",
				);
				return;
			}

			console.log(
				"Assets uploaded successfully:",
				response.data[0].fileLocation,
			);

			progress.report({ increment: 50 });
			progressCallback?.("Unzipping assets on server...");

			// Unzip the uploaded file
			const fileLocation = response.data[0].fileLocation;
			try {
				params = new URLSearchParams();
				params.append(
					"expression",
					`UnzipFile(filePath=["${fileLocation}"], space=["${projectId}"]);`,
				);
				params.append("insightId", insightId);

				response = await post(
					`${SEMOSS_URL}/Monolith/api/engine/runPixel`,
					params,
					{ headers },
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to unzip file: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to unzip file: ${getErrorMessage(error)}`,
				);
				return;
			}

			if (response.data.pixelReturn[0].output !== true) {
				const apiError = response.data.pixelReturn[0].output;
				vscode.window.showErrorMessage(
					`Failed to unzip the uploaded file on the server. API response: ${apiError}`,
				);
				progressCallback?.(
					`Failed to unzip the uploaded file on the server. API response: ${apiError}`,
				);
				return;
			}

			progress.report({ increment: 70 });
			progressCallback?.("Reloading insight classes...");

			// Reload insight classes
			try {
				params = new URLSearchParams();
				params.append(
					"expression",
					`ReloadInsightClasses('${projectId}');`,
				);
				params.append("insightId", insightId);

				response = await post(
					`${SEMOSS_URL}/Monolith/api/engine/runPixel`,
					params,
					{ headers },
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to reload insight classes: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to reload insight classes: ${getErrorMessage(error)}`,
				);
				return;
			}

			if (!response.data.pixelReturn[0].output) {
				vscode.window.showErrorMessage(
					"Failed to reload insight classes",
				);
				progressCallback?.("Failed to reload insight classes");
				return;
			}

			progress.report({ increment: 80 });
			progressCallback?.("Setting project portal...");

			// Set project portal
			try {
				params = new URLSearchParams();
				params.append("projectId", projectId);
				params.append("hasPortal", true);

				response = await post(
					`${SEMOSS_URL}/Monolith/api/auth/project/setProjectPortal`,
					params,
					{ headers },
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to set project portal: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to set project portal: ${getErrorMessage(error)}`,
				);
				return;
			}

			if (!response.data) {
				vscode.window.showErrorMessage("Failed to set project portal");
				progressCallback?.("Failed to set project portal");
				return;
			}

			progress.report({ increment: 90 });
			progressCallback?.("Publishing project...");

			// Publish project
			try {
				params = new URLSearchParams();
				params.append(
					"expression",
					`PublishProject('${projectId}', release=true);`,
				);
				params.append("insightId", insightId);

				response = await post(
					`${SEMOSS_URL}/Monolith/api/engine/runPixel`,
					params,
					{ headers },
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to publish project: ${getErrorMessage(error)}`,
				);
				progressCallback?.(
					`Failed to publish project: ${getErrorMessage(error)}`,
				);
				return;
			}

			progress.report({ increment: 100 });

			if (
				response.data.pixelReturn[0].additionalOutput[0]
					.operationType[0] !== "SUCCESS"
			) {
				vscode.window.showErrorMessage("Failed to publish project");
				progressCallback?.("Failed to publish project");
				return;
			}

			vscode.window.showInformationMessage(
				"Project deployed successfully!",
			);
			progressCallback?.("Project deployed successfully!");
		},
	);
}

module.exports = {
	setDeployConfig,
	deployProject,
};
