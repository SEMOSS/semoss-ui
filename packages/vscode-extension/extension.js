// Entry point for the Semoss VS Code extension. Provides commands for instance
// management (authorize/select/remove), project packaging (zip/deploy), and a
// chatbot webview interface used for progress + response messaging.
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const {
	storeSecrets,
	getSecrets,
	selectInstance,
	removeInstance,
	storeInstance,
	getStoredInstances,
} = require("./src/utils/secrets.js");
const { setFolderPaths, getProjectId } = require("./src/utils/projectUtils.js");
const { setDeployConfig, deployProject } = require("./src/utils/deploy.js");
const { zipProject } = require("./src/utils/zip.js");
const { createNewApp } = require("./src/utils/createApp.js");
const { initStatusBar, updateStatusBar } = require("./src/utils/statusBar.js");
const {
	handleChatbotAction,
} = require("./src/components/ChatbotWebview/ChatbotSeparateManager.js");
const {
	registerChatbotWebview,
	getCurrentChatbotProvider,
} = require("./src/components/ChatbotWebview/ChatbotWebview.js");

/**
 * Send an incremental progress update to the chatbot webview (non-blocking).
 * Silently ignores errors so build / command flow is never interrupted.
 * @param {string} text Human‑readable progress detail.
 */
function postProgress(text) {
	try {
		const provider = getCurrentChatbotProvider?.();
		provider?._view?.webview?.postMessage?.({ type: "progress", text });
	} catch (_) {
		/* best effort only */
	}
}

/**
 * Send a final response / outcome message to the chatbot webview.
 * @param {string} text Summary message.
 * @param {('ok'|'error')} [status='ok'] Optional status indicator.
 */
function postResponse(text, status = "ok") {
	try {
		const provider = getCurrentChatbotProvider?.();
		provider?._view?.webview?.postMessage?.({
			type: "response",
			text,
			status,
		});
	} catch (_) {
		/* best effort only */
	}
}

/**
 * Detect whether any .smss file exists in the current workspace folders.
 * @returns {Promise<boolean>}
 */
async function detectSmss() {
	if (!vscode.workspace.workspaceFolders) return false;
	try {
		for (const folder of vscode.workspace.workspaceFolders) {
			const files = await vscode.workspace.findFiles(
				new vscode.RelativePattern(folder, "**/*.smss"),
				"**/node_modules/**",
				1,
			);
			if (files && files.length > 0) return true;
		}
		return false;
	} catch (e) {
		console.warn("Failed scanning for .smss files:", e.message);
		return false;
	}
}

/**
 * Extension activation hook. Registers all commands, initializes status bar & chatbot
 * webview, watches for .smss project files, and exposes zip/deploy workflows.
 * Only called once per VS Code session (on first command invocation / activation event).
 * @param {vscode.ExtensionContext} context VS Code extension lifecycle context.
 */
async function activate(context) {
	// Initialize the status bar
	initStatusBar(context);
	await updateStatusBar(context);

	// Initialize MCP service
	try {
		const mcpService = require("./src/utils/mcpService.js");
		await mcpService.initialize();
	} catch (error) {
		console.error("Extension: Failed to initialize MCP service:", error);
	}

	// Register chatbot webview (keep provider reference for later messaging)
	registerChatbotWebview(context);

	// Initial .smss detection & context key, also push directly to webview if loaded
	const pushSmssStateToWebview = (hasSmss) => {
		const provider = getCurrentChatbotProvider?.();
		try {
			provider?._view?.webview?.postMessage?.({
				type: "smssFileCheckResult",
				hasSmss,
			});
		} catch (e) {
			console.warn("Unable to push smss state to webview:", e.message);
		}
	};

	const setSmssContext = async () => {
		const hasSmss = await detectSmss();
		await vscode.commands.executeCommand(
			"setContext",
			"semoss.hasSmss",
			hasSmss,
		);
		pushSmssStateToWebview(hasSmss);
	};

	await setSmssContext();

	// Watch for file create/delete/rename to refresh .smss presence
	context.subscriptions.push(
		vscode.workspace.onDidCreateFiles(setSmssContext),
		vscode.workspace.onDidDeleteFiles(setSmssContext),
		vscode.workspace.onDidRenameFiles(setSmssContext),
	);

	// Register: authorize (create / persist a new Semoss instance definition)
	const disposableAuthorize = vscode.commands.registerCommand(
		"semoss.authorize",
		async (args) => {
			// If called from chatbot, use args; otherwise, prompt
			if (
				args?.alias &&
				args?.url &&
				args?.accessKey &&
				args?.privateKey
			) {
				await storeInstance(context, args.alias, {
					semossUrl: args.url,
					accessKey: args.accessKey,
					privateKey: args.privateKey,
				});
				await context.secrets.store(
					"CURRENT_INSTANCE_ALIAS",
					args.alias,
				);
				await updateStatusBar(context);
				vscode.window.showInformationMessage(
					`Instance "${args.alias}" saved successfully!`,
				);
				vscode.commands.executeCommand("workbench.action.reloadWindow");
			} else {
				await storeSecrets(context);
				vscode.commands.executeCommand("workbench.action.reloadWindow");
			}
		},
	);

	// Register: switch the active Semoss instance alias
	const disposableSelectInstance = vscode.commands.registerCommand(
		"semoss.selectInstance",
		async (args) => {
			if (args?.alias) {
				await context.secrets.store(
					"CURRENT_INSTANCE_ALIAS",
					args.alias,
				);
				await updateStatusBar(context);
				vscode.window.showInformationMessage(
					`Switched to instance: ${args.alias}`,
				);
				vscode.commands.executeCommand("workbench.action.reloadWindow");
			} else {
				const selected = await selectInstance(context);
				if (selected) {
					await updateStatusBar(context);
					vscode.commands.executeCommand(
						"workbench.action.reloadWindow",
					);
				}
			}
		},
	);

	// Register: remove a stored Semoss instance (and clear if active)
	const disposableRemoveInstance = vscode.commands.registerCommand(
		"semoss.removeInstance",
		async (args) => {
			if (args?.alias) {
				const instances = await getStoredInstances(context);
				if (instances[args.alias]) {
					delete instances[args.alias];
					await context.secrets.store(
						"SEMOSS_INSTANCES",
						JSON.stringify(instances),
					);
					const currentAlias = await context.secrets.get(
						"CURRENT_INSTANCE_ALIAS",
					);
					if (currentAlias === args.alias) {
						await context.secrets.delete("CURRENT_INSTANCE_ALIAS");
					}
					// Always update status bar after instance removal
					await updateStatusBar(context);
					vscode.window.showInformationMessage(
						`Instance "${args.alias}" removed successfully!`,
					);
				} else {
					vscode.window.showWarningMessage(
						`Instance "${args.alias}" not found.`,
					);
				}
			} else {
				await removeInstance(context);
				await updateStatusBar(context);
			}
		},
	);

	// Helper: fetch credentials; surface a user error if not configured
	const getSecretsWithValidation = async (context) => {
		const secrets = await getSecrets(context);
		if (
			!secrets ||
			!secrets.semossUrl ||
			!secrets.accessKey ||
			!secrets.privateKey
		) {
			vscode.window.showErrorMessage(
				"No instance configured. Please authorize an instance first.",
			);
			return null;
		}
		return secrets;
	};

	// Register create new project command
	const disposableCreateApp = vscode.commands.registerCommand(
		"semoss.createNewApp",
		async (args) => {
			try {
				if (args?.appName) {
					await createNewApp(context, getSecretsWithValidation, args);
				} else {
					await createNewApp(context, getSecretsWithValidation);
				}
			} catch (error) {
				vscode.window.showErrorMessage(
					`App creation failed: ${error.message}`,
				);
				console.error("Error in createNewApp:", error);
			}
		},
	);
	context.subscriptions.push(disposableCreateApp);

	// Combined workflow: zip current project (json, smss, assets) then deploy archive
	const disposableZipDeploy = vscode.commands.registerCommand(
		"semoss.zipanddeploy",
		async (uri) => {
			const startTime = Date.now();
			// Normalize: if command executed on a single .smss file, operate from containing folder
			if (uri?.fsPath?.endsWith(".smss")) {
				uri = vscode.Uri.file(path.dirname(uri.fsPath));
			}
			// Fallback: default to first workspace folder when no explicit resource given
			if (!uri || !uri.fsPath) {
				if (
					vscode.workspace.workspaceFolders &&
					vscode.workspace.workspaceFolders.length > 0
				) {
					uri = vscode.workspace.workspaceFolders[0].uri;
				} else {
					vscode.window.showErrorMessage(
						"No workspace folder found.",
					);
					return;
				}
			}
			try {
				postProgress("Preparing zip and deploy...");
				const secrets = await getSecretsWithValidation(context);
				if (!secrets) return;

				setFolderPaths(uri);

				// Zip the project (json, smss, assets as assets.zip)
				postProgress("Zipping project...");
				await zipProject(undefined, (m) => postProgress(m));

				// Find the zip file that was created (should be assets.zip, but let's be flexible)
				const zipFiles = fs
					.readdirSync(uri.fsPath)
					.filter((file) => file.endsWith(".zip"));
				let outputZip;

				if (zipFiles.includes("assets.zip")) {
					// Prefer assets.zip if it exists (which it should after zipProject())
					outputZip = path.join(uri.fsPath, "assets.zip");
				} else if (zipFiles.length > 0) {
					// Use the first zip file found
					outputZip = path.join(uri.fsPath, zipFiles[0]);
					vscode.window.showInformationMessage(
						`Using zip file: ${zipFiles[0]}`,
					);
				} else {
					vscode.window.showErrorMessage(
						"No zip file was created during the zip process.",
					);
					return;
				}

				// Validate the zip file exists and is readable
				if (!fs.existsSync(outputZip)) {
					vscode.window.showErrorMessage(
						`Zip file does not exist: ${path.basename(outputZip)}`,
					);
					return;
				}

				// Check if file is not empty
				const stats = fs.statSync(outputZip);
				if (stats.size === 0) {
					vscode.window.showErrorMessage(
						`Zip file is empty: ${path.basename(outputZip)}`,
					);
					return;
				}

				const zipMsg = `Created archive: ${path.basename(outputZip)} (${Math.round(stats.size / 1024)} KB)`;
				vscode.window.showInformationMessage(zipMsg);
				postProgress(zipMsg);

				// Configure deployment to use the found zip file
				const encoded = Buffer.from(
					secrets.accessKey + ":" + secrets.privateKey,
				).toString("base64");
				const headers = { Authorization: "Basic " + encoded };

				setDeployConfig({
					semossUrl: secrets.semossUrl,
					authHeaders: headers,
					base64Encoded: encoded,
					outputPath: outputZip,
				});

				// Retrieve and use the current project ID
				const projectId = await getProjectId(context);
				if (!projectId) {
					vscode.window.showErrorMessage(
						"Unable to find project id in the smss file",
					);
					return;
				}
				postProgress("Deploying project...");
				await deployProject(projectId, (m) => postProgress(m));
				const totalMs = Date.now() - startTime;
				postResponse(
					`Zip and deploy completed in ${Math.round(totalMs / 1000)}s.`,
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error in zip and deploy: ${error.message}`,
				);
				postResponse(
					`Zip and deploy failed: ${error.message}`,
					"error",
				);
			}
		},
	);

	// Zip only: create assets archive without deploying
	const disposableZip = vscode.commands.registerCommand(
		"semoss.ziponly",
		async (uri) => {
			const startTime = Date.now();
			if (uri?.fsPath?.endsWith(".smss")) {
				uri = vscode.Uri.file(path.dirname(uri.fsPath));
			}
			if (!uri || !uri.fsPath) {
				if (
					vscode.workspace.workspaceFolders &&
					vscode.workspace.workspaceFolders.length > 0
				) {
					uri = vscode.workspace.workspaceFolders[0].uri;
				} else {
					vscode.window.showErrorMessage(
						"No workspace folder found.",
					);
					return;
				}
			}
			try {
				postProgress("Zipping project...");
				setFolderPaths(uri);
				await zipProject(undefined, (m) => postProgress(m));
				postProgress("Zip archive created.");
				const totalMs = Date.now() - startTime;
				postResponse(
					`Zip completed in ${Math.round(totalMs / 1000)}s.`,
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error in zip: ${error.message}`,
				);
				postResponse(`Zip failed: ${error.message}`, "error");
			}
		},
	);

	// Deploy only: deploy an existing zip (prefers assets.zip, otherwise user selection)
	const disposableDeploy = vscode.commands.registerCommand(
		"semoss.deployonly",
		async (uri) => {
			const startTime = Date.now();
			if (uri?.fsPath?.endsWith(".smss")) {
				uri = vscode.Uri.file(path.dirname(uri.fsPath));
			}
			if (!uri || !uri.fsPath) {
				if (
					vscode.workspace.workspaceFolders &&
					vscode.workspace.workspaceFolders.length > 0
				) {
					uri = vscode.workspace.workspaceFolders[0].uri;
				} else {
					vscode.window.showErrorMessage(
						"No workspace folder found.",
					);
					return;
				}
			}
			try {
				postProgress("Preparing deployment...");
				// Find zip files in the directory
				const zipFiles = fs
					.readdirSync(uri.fsPath)
					.filter((file) => file.endsWith(".zip"));
				let outputZip;

				if (zipFiles.length === 0) {
					vscode.window.showErrorMessage(
						'No zip files found in the selected folder. Please create a zip file first using "Zip Only" command or manually.',
					);
					return;
				} else if (zipFiles.includes("assets.zip")) {
					// Prefer assets.zip if it exists
					outputZip = path.join(uri.fsPath, "assets.zip");
					vscode.window.showInformationMessage(
						"Using preferred zip file: assets.zip",
					);
				} else if (zipFiles.length === 1) {
					// If only one zip file exists (and it's not assets.zip), use it
					outputZip = path.join(uri.fsPath, zipFiles[0]);
					vscode.window.showInformationMessage(
						`Using zip file: ${zipFiles[0]}`,
					);
				} else {
					// Multiple zip files exist, let user choose
					const selectedZip = await vscode.window.showQuickPick(
						zipFiles,
						{
							placeHolder:
								"Multiple zip files found. Select one to deploy:",
							canPickMany: false,
						},
					);
					if (!selectedZip) {
						vscode.window.showInformationMessage(
							"Deploy cancelled.",
						);
						return;
					}
					outputZip = path.join(uri.fsPath, selectedZip);
					vscode.window.showInformationMessage(
						`Selected zip file: ${selectedZip}`,
					);
				}

				// Validate the zip file exists and is readable
				if (!fs.existsSync(outputZip)) {
					vscode.window.showErrorMessage(
						`Selected zip file does not exist: ${path.basename(outputZip)}`,
					);
					return;
				}

				// Check if file is not empty
				const stats = fs.statSync(outputZip);
				if (stats.size === 0) {
					vscode.window.showErrorMessage(
						`Selected zip file is empty: ${path.basename(outputZip)}`,
					);
					return;
				}

				vscode.window.showInformationMessage(
					`Ready to deploy: ${path.basename(outputZip)} (${Math.round(stats.size / 1024)} KB)`,
				);

				const secrets = await getSecretsWithValidation(context);
				if (!secrets) return;

				setFolderPaths(uri);

				// Retrieve and use the current project ID
				const projectId = await getProjectId(context);
				if (!projectId) {
					vscode.window.showErrorMessage(
						"Unable to find project id in the smss file",
					);
					return;
				}

				// Configure deployment to use assets.zip
				const encoded = Buffer.from(
					secrets.accessKey + ":" + secrets.privateKey,
				).toString("base64");
				const headers = { Authorization: "Basic " + encoded };

				setDeployConfig({
					semossUrl: secrets.semossUrl,
					authHeaders: headers,
					base64Encoded: encoded,
					outputPath: outputZip,
				});

				postProgress("Deploying project...");
				await deployProject(projectId, (m) => postProgress(m));
				const totalMs = Date.now() - startTime;
				postResponse(
					`Deploy completed in ${Math.round(totalMs / 1000)}s.`,
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error in deploy: ${error.message}`,
				);
				postResponse(`Deploy failed: ${error.message}`, "error");
			}
		},
	);

	// Chatbot action bridge: exposes instance removal + delegated actions to webview manager
	const disposableChatbot = vscode.commands.registerCommand(
		"semoss.chatbotAction",
		async (action, options = {}) => {
			if (action === "removeInstance") {
				// Using the already imported getStoredInstances from the top of the file
				const instances = await getStoredInstances(context);
				const aliases = Object.keys(instances);
				if (aliases.length === 0) {
					vscode.window.showWarningMessage(
						"No stored instances found.",
					);
					return;
				}
				const items = aliases.map((alias) => ({
					label: alias,
					description: instances[alias].semossUrl,
				}));
				const selected = await vscode.window.showQuickPick(items, {
					placeHolder: "Select instance to remove",
				});
				if (selected) {
					const confirm = await vscode.window.showQuickPick(
						["Yes", "No"],
						{
							placeHolder: `Are you sure you want to remove "${selected.label}"?`,
						},
					);
					if (confirm === "Yes") {
						delete instances[selected.label];
						await context.secrets.store(
							"SEMOSS_INSTANCES",
							JSON.stringify(instances),
						);
						// If this was the current instance, clear it
						const currentAlias = await context.secrets.get(
							"CURRENT_INSTANCE_ALIAS",
						);
						if (currentAlias === selected.label) {
							await context.secrets.delete(
								"CURRENT_INSTANCE_ALIAS",
							);
						}
						// Always update status bar after instance removal
						await updateStatusBar(context);
						vscode.window.showInformationMessage(
							`Instance "${selected.label}" removed successfully!`,
						);
					}
				}
				return;
			}
			await handleChatbotAction(action, options, context);
		},
	);
	context.subscriptions.push(disposableChatbot);

	// Command: focus/open the Semoss chatbot view container
	const disposableOpenChatbot = vscode.commands.registerCommand(
		"semoss.openChatbot",
		() => {
			// Reveal the Semoss Chatbot sidebar container
			vscode.commands.executeCommand(
				"workbench.view.extension.semossChatbotContainer",
			);
			// Reveal the chatbot view inside the container
			vscode.commands.executeCommand(
				"workbench.view.extension.semossChatbotView",
			);
		},
	);
	context.subscriptions.push(disposableOpenChatbot);

	// Post‑activation: show connection status & register command set per auth state
	const secrets = await getSecrets(context);

	if (secrets?.semossUrl && secrets?.accessKey && secrets?.privateKey) {
		vscode.window.showInformationMessage(
			`Semoss: Connected to "${secrets.alias || "Default"}" (${secrets.semossUrl})`,
		);
		context.subscriptions.push(
			disposableAuthorize,
			disposableZipDeploy,
			disposableZip,
			disposableDeploy,
			disposableSelectInstance,
			disposableRemoveInstance,
		);
	} else {
		vscode.window.showErrorMessage(
			'Semoss: No instance configured. Use "Semoss: Authorize New Instance" to get started.',
		);
		context.subscriptions.push(
			disposableAuthorize,
			disposableSelectInstance,
			disposableRemoveInstance,
		); // Add instance management commands even if not authenticated
	}
}

/**
 * Extension deactivation hook. Currently no teardown needed because
 * VS Code disposables are managed via context.subscriptions.
 */
function deactivate() {
	// Cleanup MCP service
	try {
		const mcpService = require("./src/utils/mcpService.js");
		mcpService.shutdown();
	} catch (error) {
		console.error("Error shutting down MCP service:", error);
	}
}

module.exports = { activate, deactivate };
