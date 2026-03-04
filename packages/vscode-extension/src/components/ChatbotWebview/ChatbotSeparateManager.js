const vscode = require("vscode");

/**
 * Handle chatbot actions called from the extension
 */
async function handleChatbotAction(action, options = {}, context) {
	try {
		switch (action) {
			case "open":
				// Open/show the chatbot
				await vscode.commands.executeCommand("semoss.openChatbot");
				break;

			case "sendMessage":
				// Send a message to the chatbot
				if (options.message) {
					// Find the chatbot webview and send the message
					// This would need to be implemented with proper webview communication
					console.log("Sending message to chatbot:", options.message);
				}
				break;

			case "executeCommand":
				// Execute a VS Code command from the chatbot
				if (options.command) {
					await vscode.commands.executeCommand(
						options.command,
						options.args,
					);
				}
				break;

			case "showInfo":
				// Show an information message
				if (options.message) {
					vscode.window.showInformationMessage(options.message);
				}
				break;

			case "showError":
				// Show an error message
				if (options.message) {
					vscode.window.showErrorMessage(options.message);
				}
				break;

			case "showWarning":
				// Show a warning message
				if (options.message) {
					vscode.window.showWarningMessage(options.message);
				}
				break;

			case "getWorkspaceInfo": {
				// Get information about the current workspace
				const workspaceFolders = vscode.workspace.workspaceFolders;
				const activeEditor = vscode.window.activeTextEditor;

				return {
					workspaceFolders: workspaceFolders?.map((folder) => ({
						name: folder.name,
						uri: folder.uri.toString(),
						path: folder.uri.fsPath,
					})),
					activeFile: activeEditor
						? {
								fileName: activeEditor.document.fileName,
								language: activeEditor.document.languageId,
								isDirty: activeEditor.document.isDirty,
							}
						: null,
				};
			}

			case "readFile":
				// Read a file from the workspace
				if (options.filePath) {
					try {
						const document =
							await vscode.workspace.openTextDocument(
								options.filePath,
							);
						return {
							content: document.getText(),
							language: document.languageId,
						};
					} catch (error) {
						throw new Error(
							`Failed to read file: ${error.message}`,
						);
					}
				}
				break;

			case "writeFile":
				// Write content to a file
				if (options.filePath && options.content !== undefined) {
					try {
						const uri = vscode.Uri.file(options.filePath);
						const encoder = new TextEncoder();
						await vscode.workspace.fs.writeFile(
							uri,
							encoder.encode(options.content),
						);
						return { success: true };
					} catch (error) {
						throw new Error(
							`Failed to write file: ${error.message}`,
						);
					}
				}
				break;

			case "getExtensionInfo": {
				// Get information about the extension
				const extension = vscode.extensions.getExtension(
					"Semoss.semoss-vscode",
				);
				return {
					id: extension?.id,
					version: extension?.packageJSON?.version,
					isActive: extension?.isActive,
				};
			}

			case "getSecrets":
				// Get stored secrets (instances)
				try {
					const { getSecrets } = require("../../utils/secrets.js");
					return await getSecrets(context);
				} catch (error) {
					throw new Error(`Failed to get secrets: ${error.message}`);
				}

			case "storeSecret":
				// Store a secret
				if (options.key && options.value !== undefined) {
					try {
						await context.secrets.store(options.key, options.value);
						return { success: true };
					} catch (error) {
						throw new Error(
							`Failed to store secret: ${error.message}`,
						);
					}
				}
				break;

			default:
				throw new Error(`Unknown action: ${action}`);
		}
	} catch (error) {
		console.error(`Error handling chatbot action "${action}":`, error);
		vscode.window.showErrorMessage(
			`Chatbot action failed: ${error.message}`,
		);
		throw error;
	}
}

/**
 * Send a message to the chatbot webview
 */
function sendMessageToChatbot(message) {
	// This would need to be implemented with proper webview reference
	// For now, just log the message
	console.log("Message to chatbot:", message);
}

/**
 * Utility function to check if the chatbot is available
 */
function isChatbotAvailable() {
	// Check if the chatbot webview is registered and available
	return true; // Simplified for now
}

module.exports = {
	handleChatbotAction,
	sendMessageToChatbot,
	isChatbotAvailable,
};
