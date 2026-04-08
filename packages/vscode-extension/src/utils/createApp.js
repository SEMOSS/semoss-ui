/**
 * Semoss App Creation Utility
 *
 * This module provides functionality for creating new applications in the Semoss platform.
 * It handles input collection, server communication, and local file operations.
 *
 * @module createApp
 */

const { post } = require("@semoss/sdk/react");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const StreamZip = require("node-stream-zip");
const path = require("node:path");
const vscode = require("vscode");
const { deployProject, setDeployConfig } = require("./deploy.js");
const { processGithubAssets } = require("./githubAssets.js");
const { zipProject } = require("./zip.js");

// Helper for error reporting
function logError(context, err) {
	const errorDetails = `${context}: ${err.message}`;
	vscode.window.showErrorMessage(errorDetails);
	console.error(errorDetails);
}

/**
 * Constants and configuration for the app creation process
 * @private
 */
const APP_CONFIG = {
	PLACEHOLDER_HTML: (appName) =>
		`<encode><html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${appName}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html></encode>`,
	DEFAULT_ASSET_PATH: "version/assets/portals/index.html",
	GITHUB_URL_PATTERN:
		/^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?.*$/,
};

/**
 * Creates a new application in Semoss
 *
 * @param {vscode.ExtensionContext} context - The extension context
 * @param {Function} getSecretsWithValidation - Function to get secrets with validation
 * @param {Object} [args] - Optional arguments for app creation
 * @param {string} [args.appName] - Name of the app to create
 * @param {string} [args.description] - Description of the app
 * @param {string} [args.githubLink] - GitHub repository link for assets
 * @param {boolean} [args.isPrivateRepo] - Whether the GitHub repo is private
 * @param {string} [args.accessToken] - GitHub access token for private repos
 * @returns {Promise<boolean>} - Whether app creation was successful
 * @throws {Error} - If app creation fails
 */
async function createNewApp(context, getSecretsWithValidation, args) {
	try {
		// 1. Collect all required inputs
		const appDetails = await collectAppDetails(args);
		if (!appDetails) return false;

		// 2. Select download folder
		const downloadsDir = await selectDownloadFolder();
		if (!downloadsDir) return false;

		// 3. Prepare SEMOSS API secrets
		const secrets = await getSecretsWithValidation(context);
		if (!secrets) return false;

		// 4. Set up HTTP headers and auth
		const auth = createAuthHeaders(secrets);

		// 5. Validate GitHub assets if provided before proceeding with app creation
		if (appDetails.githubLink) {
			const isValid = await validateGithubRepository(
				appDetails.githubLink,
				appDetails.isPrivateRepo,
				appDetails.accessToken,
			);
			if (!isValid) return false;
		}

		// 6. Create the app on the server
		const projectId = await createAppOnServer(
			secrets,
			auth.headers,
			appDetails,
		);

		// 7. Add placeholder assets if needed
		if (!appDetails.githubLink) {
			await addPlaceholderAsset(
				secrets,
				auth.headers,
				projectId,
				appDetails.appName,
			);
		}

		// 8. Export and download the project
		const filePath = await exportAndDownloadProject(
			secrets,
			auth.headers,
			auth.encoded,
			projectId,
			downloadsDir,
			appDetails.appName,
		);

		// 9. Extract the downloaded zip
		const unzipDir = await extractZipFile(
			filePath,
			downloadsDir,
			appDetails.appName,
		);

		// 10. Process GitHub assets if needed
		if (appDetails.githubLink) {
			await processGithubAssetsForApp(
				appDetails.githubLink,
				downloadsDir,
				appDetails.appName,
				unzipDir,
				appDetails.isPrivateRepo,
				appDetails.accessToken,
			);
		}

		// 11. Open folder in VS Code
		await vscode.commands.executeCommand(
			"vscode.openFolder",
			vscode.Uri.file(unzipDir),
			true,
		);

		// 12. Zip and deploy the project
		await zipAndDeployProject(
			unzipDir,
			projectId,
			secrets,
			auth.headers,
			auth.encoded,
		);

		vscode.window.showInformationMessage(
			"App created, zipped and deployed successfully!",
		);
		return true;
	} catch (err) {
		logError("App creation failed", err);
		throw err;
	}
}

/**
 * Collects app details from user input or provided arguments
 *
 * @param {Object} [args] - Optional arguments containing app details
 * @returns {Promise<Object|null>} - Object containing app details or null if cancelled
 */
async function collectAppDetails(args) {
	let appName,
		description,
		githubLink,
		isPrivateRepo = false,
		accessToken = "";

	if (args?.appName) {
		appName = args.appName;
		description = args.description || "";
		githubLink = args.githubLink || "";
		isPrivateRepo = args.isPrivateRepo || false;
		accessToken = args.accessToken || "";
	} else {
		appName = await vscode.window.showInputBox({
			prompt: "Enter app name",
		});
		if (!appName) return null;

		description = await vscode.window.showInputBox({
			prompt: "Enter app description (optional)",
		});
		githubLink = await vscode.window.showInputBox({
			prompt: "GitHub link for assets (optional)",
		});

		// Ask about private repository if GitHub link is provided
		if (githubLink) {
			const privateRepoChoice = await vscode.window.showQuickPick(
				["No", "Yes"],
				{
					placeHolder: "Is this a private repository?",
					ignoreFocusOut: true,
				},
			);

			if (privateRepoChoice === "Yes") {
				isPrivateRepo = true;
				accessToken = await vscode.window.showInputBox({
					prompt: "Enter GitHub access token (required for private repositories)",
					password: true,
				});
				if (!accessToken) {
					vscode.window.showErrorMessage(
						"Access token is required for private repositories",
					);
					return null;
				}
			}
		}
	}

	return { appName, description, githubLink, isPrivateRepo, accessToken };
}

/**
 * Prompts user to select a download folder
 *
 * @returns {Promise<string|null>} - Selected folder path or null if cancelled
 * @throws {Error} - If no folder is selected
 */
async function selectDownloadFolder() {
	const uri = await vscode.window.showOpenDialog({
		canSelectFolders: true,
		canSelectFiles: false,
		canSelectMany: false,
		openLabel: "Select download folder",
	});

	if (!uri || uri.length === 0) {
		return null;
	}

	return uri[0].fsPath;
}

/**
 * Creates authentication headers from secrets
 *
 * @param {Object} secrets - The secrets object
 * @returns {Object} - Object containing encoded credentials and headers
 */
function createAuthHeaders(secrets) {
	const encoded = Buffer.from(
		`${secrets.accessKey}:${secrets.privateKey}`,
	).toString("base64");
	const headers = {
		Authorization: `Basic ${encoded}`,
		"Content-Type": "application/x-www-form-urlencoded",
	};

	return { encoded, headers };
}

/**
 * Validates a GitHub repository
 *
 * @param {string} githubLink - The GitHub repository URL
 * @param {boolean} isPrivateRepo - Whether the repo is private
 * @param {string} accessToken - GitHub access token for private repos
 * @returns {Promise<boolean>} - Whether the repository is valid
 * @throws {Error} - If validation fails
 */
async function validateGithubRepository(
	githubLink,
	isPrivateRepo,
	accessToken,
) {
	try {
		vscode.window.showInformationMessage(
			`Validating GitHub repository: ${githubLink}`,
		);

		if (isPrivateRepo && (!accessToken || accessToken.trim() === "")) {
			throw new Error(
				"Access token is required for private repositories",
			);
		}

		const githubUrlPattern = APP_CONFIG.GITHUB_URL_PATTERN;
		if (!githubUrlPattern.test(githubLink)) {
			throw new Error("Invalid GitHub repository URL format");
		}

		return true;
	} catch (err) {
		const msg = `GitHub validation failed: ${err.message || err}`;
		vscode.window.showErrorMessage(msg);
		return false;
	}
}

/**
 * Creates a new application on the Semoss server
 *
 * @param {Object} secrets - The secrets object
 * @param {Object} headers - The HTTP headers
 * @param {Object} appDetails - The app details
 * @returns {Promise<string>} - The project ID
 * @throws {Error} - If app creation fails
 */
async function createAppOnServer(secrets, headers, appDetails) {
	const params = new URLSearchParams();
	params.append(
		"expression",
		`CreateProject(project=["${appDetails.appName}"], portal=[true], projectType=["CODE"])`,
	);
	params.append("insightId", "new");

	try {
		console.log(
			"Creating app on server with params:",
			params.toString(),
			secrets.semossUrl,
			headers,
		);
		const response = await post(
			`${secrets.semossUrl}/Monolith/api/engine/runPixel`,
			params,
			{ headers },
		);

		if (
			!response.data ||
			!response.data.pixelReturn ||
			!response.data.pixelReturn[0] ||
			!response.data.pixelReturn[0].output ||
			!response.data.pixelReturn[0].output.project_id
		) {
			logError(
				"CreateProject response invalid",
				new Error("Invalid response from SEMOSS API"),
			);
			throw new Error("Failed to create app: Invalid response");
		}

		const projectId = response.data.pixelReturn[0].output.project_id;

		// Set description using SetProjectMetadata if description is provided
		if (appDetails.description) {
			const metadataParams = new URLSearchParams();
			metadataParams.append(
				"expression",
				`SetProjectMetadata(project=["${projectId}"], meta=[{"tag":[],"description":"${appDetails.description}"}])`,
			);
			metadataParams.append(
				"insightId",
				response.data.insightID || "new",
			);

			await post(
				`${secrets.semossUrl}/Monolith/api/engine/runPixel`,
				metadataParams,
				{ headers },
			);
		}

		return projectId;
	} catch (err) {
		logError("App creation failed", err);
		throw err;
	}
}

/**
 * Adds a placeholder HTML asset to the project
 *
 * @param {Object} secrets - The secrets object
 * @param {Object} headers - The HTTP headers
 * @param {string} projectId - The project ID
 * @param {string} appName - The app name
 * @returns {Promise<void>}
 * @throws {Error} - If adding the placeholder asset fails
 */
async function addPlaceholderAsset(secrets, headers, projectId, appName) {
	const saveAssetParams = new URLSearchParams();
	saveAssetParams.append(
		"expression",
		`SaveAsset(fileName=["${APP_CONFIG.DEFAULT_ASSET_PATH}"], content=["${APP_CONFIG.PLACEHOLDER_HTML(appName)}"], space=["${projectId}"]);`,
	);
	saveAssetParams.append("insightId", "new");

	try {
		await post(
			`${secrets.semossUrl}/Monolith/api/engine/runPixel`,
			saveAssetParams,
			{ headers },
		);
		vscode.window.showInformationMessage(
			"Placeholder asset (index.html) added to the project.",
		);
	} catch (err) {
		throw new Error(
			"Failed to add placeholder asset: " +
				(err.message || "Unknown error"),
		);
	}
}

/**
 * Exports and downloads the project
 *
 * @param {Object} secrets - The secrets object
 * @param {Object} headers - The HTTP headers
 * @param {string} encoded - The encoded credentials
 * @param {string} projectId - The project ID
 * @param {string} downloadsDir - The downloads directory
 * @param {string} appName - The app name
 * @returns {Promise<string>} - The path to the downloaded file
 * @throws {Error} - If export or download fails
 */
async function exportAndDownloadProject(
	secrets,
	headers,
	encoded,
	projectId,
	downloadsDir,
	appName,
) {
	// Export project
	const exportParams = new URLSearchParams();
	exportParams.append(
		"expression",
		`ExportProjectApp(project=["${projectId}"]);`,
	);
	exportParams.append("insightId", "new");

	const exportResponse = await post(
		`${secrets.semossUrl}/Monolith/api/engine/runPixel`,
		exportParams,
		{ headers },
	);

	if (
		!exportResponse.data ||
		!exportResponse.data.pixelReturn ||
		!exportResponse.data.pixelReturn[0] ||
		!exportResponse.data.pixelReturn[0].output
	) {
		throw new Error("Export failed: Invalid response from server.");
	}

	const fileKey = exportResponse.data.pixelReturn[0].output;
	const insightId = exportResponse.data.insightID;
	const filePath = path.join(downloadsDir, `${appName}.zip`);
	const downloadUrl = `${secrets.semossUrl}/Monolith/api/engine/downloadFile?insightId=${insightId}&fileKey=${encodeURIComponent(fileKey)}`;

	await downloadFile(downloadUrl, filePath, encoded);

	try {
		const stats = fs.statSync(filePath);
		vscode.window.showInformationMessage(
			`Downloaded file size: ${stats.size} bytes`,
		);
		return filePath;
	} catch (e) {
		console.error(`Failed to get file stats for ${filePath}:`, e);
		throw new Error(`Could not get file size for ${filePath}.`);
	}
}

/**
 * Downloads a file from a URL
 *
 * @param {string} url - The URL to download from
 * @param {string} filePath - The path to save the file to
 * @param {string} encoded - The encoded credentials
 * @returns {Promise<void>}
 */
async function downloadFile(url, filePath, encoded) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(filePath);
		const parsedUrl = new URL(url);
		const protocol = parsedUrl.protocol === "https:" ? https : http;
		const options = {
			hostname: parsedUrl.hostname,
			port:
				parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
			path: parsedUrl.pathname + parsedUrl.search,
			method: "GET",
			headers: {
				Authorization: `Basic ${encoded}`,
			},
		};

		const req = protocol.request(options, (response) => {
			if (response.statusCode !== 200) {
				let errorMsg = `Download failed with status code: ${response.statusCode}`;
				response.on("data", (chunk) => {
					errorMsg += chunk.toString();
				});
				response.on("end", () => {
					vscode.window.showErrorMessage(errorMsg);
					reject(new Error(errorMsg));
				});
				return;
			}

			response.pipe(file);
			file.on("finish", () => {
				file.close(resolve);
			});
			file.on("error", (err) => reject(err));
		});

		req.on("error", (err) => {
			fs.unlink(filePath, () => {});
			vscode.window.showErrorMessage(`Download failed: ${err.message}`);
			reject(err);
		});

		req.end();
	});
}

/**
 * Extracts a zip file
 *
 * @param {string} filePath - The path to the zip file
 * @param {string} downloadsDir - The directory containing the zip
 * @param {string} appName - The app name
 * @returns {Promise<string>} - The path to the extracted directory
 */
async function extractZipFile(filePath, downloadsDir, appName) {
	const unzipDir = path.join(
		downloadsDir,
		`${appName}_unzipped_${Date.now()}`,
	);

	if (!fs.existsSync(unzipDir)) {
		fs.mkdirSync(unzipDir);
	}

	const zip = new StreamZip.async({ file: filePath });
	await zip.extract(null, unzipDir); // Extract all files
	await zip.close();

	vscode.window.showInformationMessage(`App unzipped to ${unzipDir}`);
	return unzipDir;
}

/**
 * Processes GitHub assets for an app
 *
 * @param {string} githubLink - The GitHub repository URL
 * @param {string} downloadsDir - The downloads directory
 * @param {string} appName - The app name
 * @param {string} unzipDir - The directory containing the unzipped app
 * @param {boolean} isPrivateRepo - Whether the repo is private
 * @param {string} accessToken - GitHub access token for private repos
 * @returns {Promise<void>}
 * @throws {Error} - If processing GitHub assets fails
 */
async function processGithubAssetsForApp(
	githubLink,
	downloadsDir,
	appName,
	unzipDir,
	isPrivateRepo,
	accessToken,
) {
	vscode.window.showInformationMessage(
		`Processing GitHub assets from: ${githubLink}`,
	);

	const githubSuccess = await processGithubAssets(
		githubLink,
		downloadsDir,
		appName,
		unzipDir,
		isPrivateRepo,
		accessToken,
	);

	if (!githubSuccess) {
		throw new Error(
			"Failed to process GitHub assets. App creation aborted.",
		);
	}

	vscode.window.showInformationMessage(
		"GitHub assets processed successfully. Continuing with app setup...",
	);
}

/**
 * Zips and deploys a project
 *
 * @param {string} unzipDir - The directory containing the unzipped app
 * @param {string} projectId - The project ID
 * @param {Object} secrets - The secrets object
 * @param {Object} headers - The HTTP headers
 * @param {string} encoded - The encoded credentials
 * @returns {Promise<string>} - The path to the zip file
 */
async function zipAndDeployProject(
	unzipDir,
	projectId,
	secrets,
	headers,
	encoded,
) {
	await zipProject(unzipDir, (m) => console.log("[zip]", m));
	const zipOutputPath = path.join(unzipDir, "assets.zip");
	vscode.window.showInformationMessage(`App zipped to ${zipOutputPath}`);

	// Deploy the zipped app
	setDeployConfig({
		semossUrl: secrets.semossUrl,
		authHeaders: headers,
		base64Encoded: encoded,
		outputPath: zipOutputPath,
	});

	await deployProject(projectId, (m) => console.log("[deploy]", m));
	return zipOutputPath;
}

module.exports = { createNewApp };
