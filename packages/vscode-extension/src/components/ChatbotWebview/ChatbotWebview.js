import * as vscode from "vscode";
import path from "path";
import { getChatbotHtml, mapMessageToCommand } from "../Chatbot/Chatbot.js";
import { getSecrets, getStoredInstances, storeInstance } from "../../utils/secrets.js";
import { createNewApp } from "../../utils/createApp.js";
import fs from "fs";

// Hard-coded relative path from this file to the Chatbot.css file
// This is a simpler solution that avoids using __dirname or import.meta.url

function getWebviewContent(webview, context) {
    // Use the extension's file system path instead of __dirname
    const extensionPath = context.extensionPath;

    // Path to the CSS file relative to the extension root
    const cssPath = vscode.Uri.file(
        path.join(extensionPath, 'src', 'components', 'Chatbot', 'Chatbot.css')
    );
    const cssUri = webview.asWebviewUri(cssPath);
    return getChatbotHtml(cssUri);
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
     */    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'components', 'Chatbot'))
            ]

        };



        webviewView.webview.html = getWebviewContent(webviewView.webview, this._context);
        webviewView.webview.onDidReceiveMessage(async (msg) => {
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
                // Remove deployonly from folderCommands so it never prompts for a folder
                const folderCommands = [];
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
                                } case 'semoss.createNewApp': {
                                    const { appName, description, githubLink } = msg.inputs;
                                    try {
                                        const secrets = await getSecrets(this._context);
                                        if (!secrets) {
                                            resultMsg = 'Please authorize an instance first.';
                                            break;
                                        }
                                        await createNewApp(this._context, async () => secrets, { appName, description, githubLink });
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
                                    // For folder commands, always use first workspace folder
                                    if (folderCommands.includes(command)) {
                                        let uri = msg.inputs && msg.inputs.uri;
                                        if (!uri) {
                                            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                                                uri = vscode.workspace.workspaceFolders[0].uri;
                                            } else {
                                                resultMsg = 'No workspace folder found.';
                                                // Always hide loading even on error
                                                webviewView.webview.postMessage({ type: 'response', status: 'error', text: resultMsg, hideLoading: true });
                                                return;
                                            }
                                        }
                                        await vscode.commands.executeCommand(command, uri);
                                        resultMsg = `Action '${command}' executed on selected folder.`;
                                        // Always hide loading after deploy
                                        webviewView.webview.postMessage({ type: 'response', status: 'success', text: resultMsg, hideLoading: true });
                                        return;
                                    } else {
                                        await vscode.commands.executeCommand(command, msg.inputs);
                                        resultMsg = `Action '${command}' executed with provided details.`;
                                        // Always hide loading after any command
                                        webviewView.webview.postMessage({ type: 'response', status: 'success', text: resultMsg, hideLoading: true });
                                        return;
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
            if (msg.type === 'getInstanceAliasesForRemoval') {
                // Send aliases for removal
                const instances = await getStoredInstances(this._context);
                const aliases = Object.keys(instances);
                webviewView.webview.postMessage({ type: 'instanceAliasesForRemoval', aliases });
                return;
            }
            if (msg.type === 'removeInstanceByAlias') {
                const { alias } = msg;
                const instances = await getStoredInstances(this._context);
                if (!instances[alias]) {
                    webviewView.webview.postMessage({ type: 'response', status: 'error', text: `Instance "${alias}" not found.`, hideLoading: true });
                    return;
                }
                delete instances[alias];
                await this._context.secrets.store('SEMOSS_INSTANCES', JSON.stringify(instances));
                // If this was the current instance, clear it
                const currentAlias = await this._context.secrets.get('CURRENT_INSTANCE_ALIAS');
                if (currentAlias === alias) {
                    await this._context.secrets.delete('CURRENT_INSTANCE_ALIAS');
                }
                webviewView.webview.postMessage({ type: 'response', status: 'success', text: `Instance "${alias}" removed successfully!`, hideLoading: true });
                return;
            }
        });
    }
}

export function registerChatbotWebview(context) {
    const provider = new SemossChatbotViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'semossChatbotView',
            provider
        )
    );
    vscode.window.showInformationMessage('If you do not see the Semoss Chatbot sidebar, click the Semoss Chatbot icon in the Activity Bar or use the command: Semoss: Open Chatbot.');
}
