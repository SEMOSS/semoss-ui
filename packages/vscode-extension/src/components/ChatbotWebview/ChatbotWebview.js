const vscode = require("vscode");
const path = require("node:path");
const fs = require("node:fs");
const llmService = require("../../utils/llmService");
const configManager = require("../../utils/configManager");
// Static imports for instance management & status bar
const {
	getStoredInstances,
	getCurrentInstance,
} = require("../../utils/secrets.js");
const { updateStatusBar } = require("../../utils/statusBar.js");

/**
 * Register the chatbot webview provider
 */
let _chatbotProviderInstance;
function registerChatbotWebview(context) {
	_chatbotProviderInstance = new ChatbotWebviewProvider(
		context.extensionUri,
		context,
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"semossChatbotView",
			_chatbotProviderInstance,
			{
				webviewOptions: { retainContextWhenHidden: true },
			},
		),
	);
}

function getCurrentChatbotProvider() {
	return _chatbotProviderInstance;
}

class ChatbotWebviewProvider {
	constructor(extensionUri, context) {
		this._extensionUri = extensionUri;
		this._view = undefined;
		this._context = context; // needed for secrets-based instance management
	}

	resolveWebviewView(webviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, "src"),
				vscode.Uri.joinPath(this._extensionUri, "media"),
			],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "chat": {
					// Generic command execution path from React (executeCommand in useChatState)
					try {
						if (data.command) {
							await vscode.commands.executeCommand(
								data.command,
								data.inputs || data.args,
							);
							// For long-running zip/deploy commands we rely on their own progress + final response from extension logic.
							if (
								![
									"semoss.zipanddeploy",
									"semoss.ziponly",
									"semoss.deployonly",
								].includes(data.command)
							) {
								webviewView.webview.postMessage({
									type: "response",
									text: `${data.command} completed`,
									status: "ok",
								});
							}
						} else {
							webviewView.webview.postMessage({
								type: "response",
								text: "No command provided",
								status: "error",
							});
						}
					} catch (e) {
						console.error("Chat command execution failed:", e);
						webviewView.webview.postMessage({
							type: "response",
							text: `Command failed: ${e.message}`,
							status: "error",
						});
					}
					break;
				}
				case "checkSmssFile": {
					try {
						const hasSmss = await (async () => {
							if (!vscode.workspace.workspaceFolders)
								return false;
							for (const folder of vscode.workspace
								.workspaceFolders) {
								const matches =
									await vscode.workspace.findFiles(
										new vscode.RelativePattern(
											folder,
											"**/*.smss",
										),
										"**/node_modules/**",
										1,
									);
								if (matches && matches.length > 0) return true;
							}
							return false;
						})();
						webviewView.webview.postMessage({
							type: "smssFileCheckResult",
							hasSmss,
						});
					} catch (e) {
						console.warn("SMSS detection failed:", e.message);
						webviewView.webview.postMessage({
							type: "smssFileCheckResult",
							hasSmss: false,
						});
					}
					break;
				}
				case "command": {
					try {
						if (!data.command) {
							webviewView.webview.postMessage({
								type: "response",
								text: "No command specified",
								status: "error",
							});
							break;
						}
						const commands =
							await vscode.commands.getCommands(true);
						if (!commands.includes(data.command)) {
							webviewView.webview.postMessage({
								type: "response",
								text: `Unknown command: ${data.command}`,
								status: "error",
							});
							break;
						}
						await vscode.commands.executeCommand(
							data.command,
							data.args,
						);
						webviewView.webview.postMessage({
							type: "response",
							text: `${data.command} executed`,
							status: "ok",
						});
					} catch (err) {
						console.error(
							"Error executing command from webview:",
							err,
						);
						webviewView.webview.postMessage({
							type: "response",
							text: `Command failed: ${err.message}`,
							status: "error",
						});
					}
					break;
				}
				case "sendToLLM":
					// Handle LLM communication (accept optional model)
					await this._handleLLMMessage(
						data.message,
						webviewView.webview,
						data.model,
					);
					break;
				case "getConfig":
					// Handle config request from React app
					await this._handleGetConfig(webviewView.webview);
					break;
				case "saveConfig":
					// Handle config save from React app
					await this._handleSaveConfig(
						data.config,
						webviewView.webview,
					);
					break;
				case "testModel":
					// Handle model testing
					await this._handleTestModel(
						data.modelName,
						webviewView.webview,
					);
					break;
				case "log":
					console.log("Webview log:", data.message);
					break;
				case "error":
					console.error("Webview error:", data.message);
					break;
				case "downloadManual": {
					try {
						// Locate the PDF in the extension's assets folder
						const manualPath = vscode.Uri.joinPath(
							this._extensionUri,
							"assets",
							"docs",
							"semoss_user_manual.pdf",
						);

						// Check if file exists
						try {
							await vscode.workspace.fs.stat(manualPath);
						} catch (err) {
							webviewView.webview.postMessage({
								type: "response",
								text: "User manual not found in extension assets.",
								status: "error",
							});
							break;
						}

						// Prompt user to save the file
						const saveUri = await vscode.window.showSaveDialog({
							defaultUri: vscode.Uri.file(
								path.join(
									require("os").homedir(),
									"Downloads",
									"semoss_user_manual.pdf",
								),
							),
							filters: {
								PDF: ["pdf"],
							},
							saveLabel: "Save User Manual",
						});

						if (saveUri) {
							// Copy the PDF to the selected location
							const pdfContent =
								await vscode.workspace.fs.readFile(manualPath);
							await vscode.workspace.fs.writeFile(
								saveUri,
								pdfContent,
							);

							// Show success message with option to open
							const action = await vscode.window.showInformationMessage(
								`User manual saved to ${saveUri.fsPath}`,
								"Open File",
							);

							if (action === "Open File") {
								// Open with system default PDF viewer
								await vscode.env.openExternal(saveUri);
							}

							webviewView.webview.postMessage({
								type: "response",
								text: `User manual saved successfully to ${saveUri.fsPath}`,
								status: "ok",
							});
						} else {
							webviewView.webview.postMessage({
								type: "response",
								text: "Download cancelled by user.",
								status: "info",
							});
						}
					} catch (err) {
						console.error("Failed to download user manual:", err);
						webviewView.webview.postMessage({
							type: "response",
							text: `Failed to download user manual: ${err.message}`,
							status: "error",
						});
					}
					break;
				}
				case "listInstances": {
					try {
						const instances = await getStoredInstances(
							this._context,
						);
						const current = await getCurrentInstance(this._context);
						const list = Object.entries(instances).map(
							([alias, details]) => ({
								alias,
								semossUrl: details.semossUrl,
							}),
						);
						webviewView.webview.postMessage({
							type: "instancesList",
							instances: list,
							mode: data.mode,
							currentInstance: current?.alias,
						});
					} catch (err) {
						console.error("Error listing instances:", err);
						webviewView.webview.postMessage({
							type: "instanceActionResult",
							feedback: `Failed to list instances: ${err.message}`,
							currentInstance: null,
						});
					}
					break;
				}
				case "selectInstanceWebview": {
					try {
						const instances = await getStoredInstances(
							this._context,
						);
						if (!instances[data.alias])
							throw new Error("Instance not found");
						await this._context.secrets.store(
							"CURRENT_INSTANCE_ALIAS",
							data.alias,
						);
						await updateStatusBar(this._context);
						// Return refreshed list (keepMode for continuous operations if user wants to switch again)
						const freshInstances = await getStoredInstances(
							this._context,
						);
						const list = Object.entries(freshInstances).map(
							([alias, details]) => ({
								alias,
								semossUrl: details.semossUrl,
							}),
						);
						webviewView.webview.postMessage({
							type: "instanceActionResult",
							feedback: `Switched to instance: ${data.alias}`,
							currentInstance: data.alias,
							keepMode: false,
							instances: list,
						});
					} catch (err) {
						webviewView.webview.postMessage({
							type: "instanceActionResult",
							feedback: `Failed to switch instance: ${err.message}`,
							keepMode: true,
						});
					}
					break;
				}
				case "removeInstanceWebview": {
					try {
						const instances = await getStoredInstances(
							this._context,
						);
						if (!instances[data.alias])
							throw new Error("Instance not found");
						delete instances[data.alias];
						await this._context.secrets.store(
							"SEMOSS_INSTANCES",
							JSON.stringify(instances),
						);
						let currentAlias = await this._context.secrets.get(
							"CURRENT_INSTANCE_ALIAS",
						);
						if (currentAlias === data.alias) {
							await this._context.secrets.delete(
								"CURRENT_INSTANCE_ALIAS",
							);
							currentAlias = null;
						}
						await updateStatusBar(this._context);
						// Refreshed list for potential subsequent removals
						const refreshed = await getStoredInstances(
							this._context,
						);
						const list = Object.entries(refreshed).map(
							([alias, details]) => ({
								alias,
								semossUrl: details.semossUrl,
							}),
						);
						webviewView.webview.postMessage({
							type: "instanceActionResult",
							feedback: `Instance "${data.alias}" removed successfully!`,
							currentInstance: currentAlias,
							keepMode: true, // stay in dialog for multiple removals
							instances: list,
						});
					} catch (err) {
						webviewView.webview.postMessage({
							type: "instanceActionResult",
							feedback: `Failed to remove instance: ${err.message}`,
							keepMode: true,
						});
					}
					break;
				}
				case "clearInstancesMode": {
					webviewView.webview.postMessage({
						type: "instanceActionResult",
						feedback: null,
					});
					break;
				}
			}
		});

		// Re-sync .smss presence each time the view becomes visible
		webviewView.onDidChangeVisibility(async () => {
			if (webviewView.visible) {
				try {
					const hasSmss = await (async () => {
						if (!vscode.workspace.workspaceFolders) return false;
						for (const folder of vscode.workspace
							.workspaceFolders) {
							const matches = await vscode.workspace.findFiles(
								new vscode.RelativePattern(folder, "**/*.smss"),
								"**/node_modules/**",
								1,
							);
							if (matches && matches.length > 0) return true;
						}
						return false;
					})();
					webviewView.webview.postMessage({
						type: "smssFileCheckResult",
						hasSmss,
					});
				} catch (e) {
					console.warn(
						"Visibility SMSS detection failed:",
						e.message,
					);
					webviewView.webview.postMessage({
						type: "smssFileCheckResult",
						hasSmss: false,
					});
				}
			}
		});
	}

	_getHtmlForWebview(webview) {
		try {
			// Path to the built React app
			const reactAppPath = path.join(
				this._extensionUri.fsPath,
				"src",
				"webviews",
				"chatbot-react",
				"dist",
				"index.html",
			);

			if (fs.existsSync(reactAppPath)) {
				console.log("Loading React app from:", reactAppPath);
				let html = fs.readFileSync(reactAppPath, "utf8");

				// Convert relative paths to VS Code webview URIs
				const distPath = path.join(
					this._extensionUri.fsPath,
					"src",
					"webviews",
					"chatbot-react",
					"dist",
				);

				// Replace asset paths with webview URIs
				html = html.replace(
					/(href|src)=["']\.\/([^"']+)["']/g,
					(match, attribute, relativePath) => {
						const fullPath = path.join(distPath, relativePath);
						if (fs.existsSync(fullPath)) {
							const webviewUri = webview.asWebviewUri(
								vscode.Uri.file(fullPath),
							);
							return `${attribute}="${webviewUri.toString()}"`;
						}
						return match;
					},
				);

				// Add Content Security Policy for webview
				const nonce = this._getNonce();
				const cspSource = webview.cspSource;

				// CSP that allows ES modules and unsafe-eval for React
				const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline'; font-src ${cspSource}; img-src ${cspSource} data: https:; connect-src ${cspSource}; script-src-elem ${cspSource} 'unsafe-inline';">`;

				// Insert CSP after charset meta tag
				html = html.replace(
					'<meta charset="UTF-8">',
					`<meta charset="UTF-8">\n    ${csp}`,
				);

				// Add nonce to scripts but preserve type="module"
				html = html.replace(
					/<script(?![^>]*nonce)(?![^>]*type="module")/g,
					`<script nonce="${nonce}"`,
				);

				// Handle module scripts separately
				html = html.replace(
					/<script type="module"(?![^>]*nonce)/g,
					`<script type="module" nonce="${nonce}"`,
				);

				console.log("React app HTML processed successfully");

				// Add debug script to check if React is loading
				const debugScript = `
                    <script nonce="${nonce}">
                        console.log('Webview HTML injected successfully');
                        window.addEventListener('load', () => {
                            console.log('Webview window loaded');
                            setTimeout(() => {
                                const root = document.getElementById('root');
                                if (root && root.children.length > 0) {
                                    console.log('React app rendered successfully:', root.innerHTML.length + ' characters');
                                    if (window.vscode) {
                                        window.vscode.postMessage({
                                            type: 'log',
                                            message: 'React app loaded successfully'
                                        });
                                    }
                                } else {
                                    console.error('React app failed to render - root element is empty');
                                    if (window.vscode) {
                                        window.vscode.postMessage({
                                            type: 'error',
                                            message: 'React app failed to render'
                                        });
                                    }
                                }
                            }, 2000);
                        });
                    </script>
                `;

				html = html.replace("</body>", `${debugScript}</body>`);

				return html;
			} else {
				console.log(`React app HTML not found at: ${reactAppPath}`);
				return this._getFallbackHtml(webview);
			}
		} catch (error) {
			console.error("Error loading React app HTML:", error);
			return this._getFallbackHtml(webview);
		}
	}

	/**
	 * Handle LLM message communication
	 */
	async _handleLLMMessage(message, webview, modelName = null) {
		try {
			console.log("Received LLM message:", message);

			// Send acknowledgment that we're processing
			webview.postMessage({
				type: "llmProcessing",
				message: "Processing your message...",
				timestamp: Date.now(),
			});

			// Call the actual LLM service
			const result = await llmService.sendMessage(message, modelName);

			if (result.success) {
				// Send successful response
				webview.postMessage({
					type: "llmResponse",
					message: result.response,
					model: result.model,
					usage: result.usage,
					timestamp: Date.now(),
				});
			} else {
				// Sanitize error (avoid leaking keys)
				let detail = result.error || "Unknown error";
				if (typeof detail === "string") {
					// Strip any long tokens / keys (simple heuristic)
					detail = detail.replace(
						/[A-Za-z0-9_-]{20,}/g,
						"[redacted]",
					);
				}
				webview.postMessage({
					type: "llmError",
					message:
						"Sorry, I encountered an error processing your message.",
					error: detail,
					model: result.model,
					timestamp: Date.now(),
				});
			}
		} catch (error) {
			console.error("Error handling LLM message:", error);
			let detail = error.message || String(error);
			if (typeof detail === "string") {
				detail = detail.replace(/[A-Za-z0-9_-]{20,}/g, "[redacted]");
			}
			webview.postMessage({
				type: "llmError",
				message:
					"Sorry, I encountered an error processing your message.",
				error: detail,
				timestamp: Date.now(),
			});
		}
	}

	/**
	 * Handle config request from React app
	 */
	async _handleGetConfig(webview) {
		try {
			const fs = require("fs");
			const path = require("path");
			
			// Get the config file path
			const configPath = path.join(
				this._context.extensionPath,
				"config",
				"semoss-config.yaml"
			);
			
			// Read the raw file content
			let yamlString = "";
			if (fs.existsSync(configPath)) {
				yamlString = fs.readFileSync(configPath, "utf8");
			}

			webview.postMessage({
				type: "configData",
				config: yamlString,
				timestamp: Date.now(),
			});
		} catch (error) {
			console.error("Error getting config:", error);
			webview.postMessage({
				type: "configError",
				error: error.message,
				timestamp: Date.now(),
			});
		}
	}

	/**
	 * Handle config save from React app
	 */
	async _handleSaveConfig(configString, webview) {
		try {
			// Parse the YAML config string to object
			let configObject;
			if (typeof configString === "string") {
				const yaml = require("js-yaml");
				configObject = yaml.load(configString);
			} else {
				configObject = configString;
			}

			const success = await configManager.saveConfig(configObject);

			// Restart MCP servers if config was saved successfully
			if (success) {
				try {
					const mcpService = require("../../utils/mcpService.js");
					await mcpService.restart();
				} catch (mcpError) {
					console.error("Failed to restart MCP servers:", mcpError);
				}
			}

			webview.postMessage({
				type: "configSaved",
				success: success,
				timestamp: Date.now(),
			});
		} catch (error) {
			console.error("Error saving config:", error);
			webview.postMessage({
				type: "configError",
				error: error.message,
				timestamp: Date.now(),
			});
		}
	}

	/**
	 * Handle model testing
	 */
	async _handleTestModel(modelName, webview) {
		try {
			const result = await llmService.testModel(modelName);

			webview.postMessage({
				type: "modelTestResult",
				result: result,
				timestamp: Date.now(),
			});
		} catch (error) {
			console.error("Error testing model:", error);
			webview.postMessage({
				type: "modelTestResult",
				result: {
					success: false,
					model: modelName,
					error: error.message,
				},
				timestamp: Date.now(),
			});
		}
	}

	_getNonce() {
		let text = "";
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(
				Math.floor(Math.random() * possible.length),
			);
		}
		return text;
	}

	_getFallbackHtml(webview) {
		const nonce = this._getNonce();
		const cspSource = webview ? webview.cspSource : "'self'";

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'nonce-${nonce}'; font-src ${cspSource}; img-src ${cspSource} data:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Semoss Chatbot</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .error-message {
            text-align: center;
            color: var(--vscode-errorForeground);
            margin-bottom: 20px;
        }
        .refresh-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 4px;
        }
        .refresh-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .debug-info {
            margin-top: 20px;
            padding: 10px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            max-width: 400px;
        }
    </style>
</head>
<body>
    <div class="error-message">
        <h3>⚠️ React App Loading Issue</h3>
        <p>The React chatbot app could not be loaded.</p>
        <p>Falling back to basic interface...</p>
    </div>
    <button class="refresh-button" onclick="location.reload()">Refresh</button>
    <div class="debug-info">
        <div>Extension Path: ${this._extensionUri.fsPath}</div>
        <div>Timestamp: ${new Date().toISOString()}</div>
        <div>Expected React App: src/webviews/chatbot-react/dist/index.html</div>
    </div>
    <script nonce="${nonce}">
        if (typeof acquireVsCodeApi !== 'undefined') {
            window.vscode = acquireVsCodeApi();
            window.vscode.postMessage({ 
                type: 'log', 
                message: 'Fallback HTML loaded - React app not available',
                extensionPath: '${this._extensionUri.fsPath}'
            });
        }
    </script>
</body>
</html>`;
	}

	/**
	 * Post a message to the webview
	 */
	postMessage(message) {
		if (this._view) {
			this._view.webview.postMessage(message);
		}
	}

	/**
	 * Show the webview
	 */
	show() {
		if (this._view) {
			this._view.show();
		}
	}
}

module.exports = {
	registerChatbotWebview,
	ChatbotWebviewProvider,
	getCurrentChatbotProvider,
};
