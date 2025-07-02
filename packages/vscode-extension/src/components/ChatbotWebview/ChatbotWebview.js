import * as vscode from "vscode";
import path from "path";
import { getSeparateChatbotHtml, mapMessageToCommand } from "./ChatbotSeparateManager.js";
import { getSecrets, getStoredInstances, storeInstance } from "../../utils/secrets.js";
import { createNewApp } from "../../utils/createApp.js";
import fs from "fs";

function getWebviewContent(webview, context) {
    // Always use the new implementation
    return getSeparateChatbotHtml(webview, context);
}

class SemossChatbotViewProvider {
    /**
     * @param {vscode.ExtensionContext} context
     */
    constructor(context) {
        this._context = context;
    }

    /**
     * @param {vscode.WebviewView} webviewView
     */
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'components', 'Chatbot')),
                vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'components', 'Chatbot-ui'))
            ]

        };

        webviewView.webview.html = getWebviewContent(webviewView.webview, this._context);

        // Restore chat history and state when webview becomes visible
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._restoreChatState();
            }
        });

        // Initial restore when webview is first created
        this._restoreChatState();

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            // Handle history-related messages
            if (msg.type === 'saveMessage') {
                this._addMessageToHistory(msg.message.text, msg.message.from, msg.status);
                return;
            }

            if (msg.type === 'saveState') {
                this._currentState = msg.state;
                return;
            }

            if (msg.type === 'getHistory') {
                webviewView.webview.postMessage({
                    type: 'restoreHistory',
                    history: this._chatHistory,
                    state: this._currentState
                });
                return;
            }

            if (msg.type === 'clearHistory') {
                this._chatHistory = [];
                this._currentState = 'start';
                return;
            }

            if (msg.type === 'openExternalResource' && msg.resource === 'user-manual') {
                // Get the path to the user manual PDF
                const userManualPath = vscode.Uri.file(
                    path.join(this._context.extensionPath, 'assets', 'docs', 'semoss_user_manual.pdf')
                );

                // Open the PDF in the default PDF viewer
                vscode.env.openExternal(userManualPath);

                // Log that the manual was accessed
                this._addMessageToHistory('User manual downloaded', 'bot', 'success');
                return;
            }

            if (msg.type === 'getInstanceAliases') {
                // Fetch aliases and send to webview, including URLs
                const instances = await getStoredInstances(this._context);
                const aliases = Object.keys(instances);
                // Build a map of alias to URL (no optional chaining for compatibility)
                const urls = {};
                for (const alias of aliases) {
                    urls[alias] = (instances[alias] && instances[alias].semossUrl) ? instances[alias].semossUrl : '';
                }
                webviewView.webview.postMessage({ type: 'instanceAliasesWithUrls', aliases, urls });
                return;
            }
            if (msg.type === 'checkSmssFile') {
                // Check for .smss file in the workspace root
                const fs = require('fs');
                let hasSmss = false;
                let folderPath = undefined;
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                    folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    try {
                        const files = fs.readdirSync(folderPath);
                        hasSmss = files.some(f => f.endsWith('.smss'));
                    } catch (e) {
                        hasSmss = false;
                    }
                }
                webviewView.webview.postMessage({ type: 'smssFileCheckResult', hasSmss });
                return;
            }
            if (msg.type === 'checkInstanceAuthorized') {
                // Check if any instance is authorized (secrets exist)
                const secrets = await getSecrets(this._context);
                const authorized = !!secrets && Object.keys(secrets).length > 0;
                webviewView.webview.postMessage({ type: 'instanceAuthorizedResult', authorized });
                return;
            }
            if (msg.type === 'chat') {
                let resultMsg = 'Command received: ' + JSON.stringify(msg);
                // Use msg.command if present, otherwise map from message
                const command = msg.command || mapMessageToCommand(msg);
                const folderCommands = [
                    'semoss.deployonly'
                ];
                if (!command) {
                    resultMsg = 'Sorry, I did not understand that command.';
                } else {
                    try {
                        if (msg.inputs) {
                            switch (command) {
                                case 'semoss.authorize': {
                                    const { alias, url, accessKey, privateKey } = msg.inputs;

                                    // Input validation
                                    if (!alias || !url || !accessKey || !privateKey) {
                                        webviewView.webview.postMessage({
                                            type: 'response',
                                            status: 'error',
                                            text: 'All fields are required for authorization.',
                                            hideLoading: true
                                        });
                                        return;
                                    }

                                    try {
                                        // Store the instance data
                                        await storeInstance(this._context, alias, {
                                            semossUrl: url,
                                            accessKey,
                                            privateKey
                                        });

                                        // Verify the data was stored correctly
                                        const instances = await getStoredInstances(this._context);
                                        const storedInstance = instances[alias];

                                        if (!storedInstance ||
                                            storedInstance.semossUrl !== url ||
                                            storedInstance.accessKey !== accessKey ||
                                            storedInstance.privateKey !== privateKey) {
                                            throw new Error('Failed to verify stored instance data');
                                        }

                                        // Set as current instance
                                        await this._context.secrets.store('CURRENT_INSTANCE_ALIAS', alias);

                                        webviewView.webview.postMessage({
                                            type: 'response',
                                            status: 'success',
                                            text: 'Instance "' + alias + '" authorized successfully!',
                                            hideLoading: true
                                        });
                                    } catch (e) {
                                        webviewView.webview.postMessage({
                                            type: 'response',
                                            status: 'error',
                                            text: 'Error authorizing instance: ' + e.message,
                                            hideLoading: true
                                        });
                                    }
                                    return;
                                }
                                case 'semoss.createNewApp': {
                                    const { appName, description } = msg.inputs;
                                    try {
                                        const secrets = await getSecrets(this._context);
                                        if (!secrets) {
                                            resultMsg = 'Please authorize an instance first.';
                                            break;
                                        }
                                        await createNewApp(this._context, async () => secrets, { appName, description });
                                        resultMsg = `App \"${appName}\" created successfully!`;
                                        // Always send hideLoading to stop spinner
                                        webviewView.webview.postMessage({ type: 'response', status: 'success', text: resultMsg, hideLoading: true });
                                        return;
                                    } catch (e) {
                                        resultMsg = `Error creating app: ${e.message}`;
                                        webviewView.webview.postMessage({ type: 'response', status: 'error', text: resultMsg, hideLoading: true });
                                        return;
                                    }
                                }
                                default: {
                                    // For folder commands, prompt for folder if not provided
                                    if (folderCommands.includes(command)) {
                                        let uri = msg.inputs.uri;
                                        if (!uri) {
                                            const folders = await vscode.window.showOpenDialog({
                                                canSelectFolders: true,
                                                canSelectFiles: false,
                                                canSelectMany: false,
                                                openLabel: 'Select folder for operation'
                                            });
                                            if (!folders || folders.length === 0) {
                                                resultMsg = 'Operation cancelled: No folder selected.';
                                                break;
                                            }
                                            uri = folders[0];
                                        }
                                        await vscode.commands.executeCommand(command, uri);
                                        resultMsg = `Action '${command}' executed on selected folder.`;
                                    } else {
                                        await vscode.commands.executeCommand(command, msg.inputs);
                                        resultMsg = `Action '${command}' executed with provided details.`;
                                    }
                                }
                            }
                        } else {
                            // For folder commands, prompt for folder if not provided
                            if (folderCommands.includes(command)) {
                                const folders = await vscode.window.showOpenDialog({
                                    canSelectFolders: true,
                                    canSelectFiles: false,
                                    canSelectMany: false,
                                    openLabel: 'Select folder for operation'
                                });
                                if (!folders || folders.length === 0) {
                                    resultMsg = 'Operation cancelled: No folder selected.';
                                } else {
                                    await vscode.commands.executeCommand(command, folders[0]);
                                    resultMsg = `Action '${command}' executed on selected folder.`;
                                }
                            } else {
                                await vscode.commands.executeCommand(command);
                                resultMsg = `Action '${command}' executed.`;
                            }
                        }
                    } catch (e) {
                        resultMsg = `Error: ${e.message}`;
                    }
                }
                webviewView.webview.postMessage({ type: 'response', text: resultMsg });
            }
        });
    }
}

function registerChatbotWebview(context) {
    const provider = new SemossChatbotViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'semossChatbotView',
            provider
        )
    );
    vscode.window.showInformationMessage('If you do not see the Semoss Chatbot sidebar, click the Semoss Chatbot icon in the Activity Bar or use the command: Semoss: Open Chatbot.');
}

module.exports = { registerChatbotWebview };
