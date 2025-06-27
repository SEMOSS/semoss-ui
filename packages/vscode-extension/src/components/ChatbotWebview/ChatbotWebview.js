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
        this._chatHistory = [];
        this._currentState = 'start'; // 'start', 'options', 'authorized'
    }

    /**
     * @param {vscode.WebviewView} webviewView
     */
    resolveWebviewView(webviewView) {
        this._webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'components', 'Chatbot'))
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
            if (msg.type === 'getInstanceAliases') {
                // Fetch aliases and send to webview, including URLs
                const instances = await getStoredInstances(this._context);
                const aliases = Object.keys(instances);
                // Build a map of alias to URL (no optional chaining for compatibility)
                const urls = {};
                for (const alias of aliases) {
                    urls[alias] = (instances[alias] && instances[alias].semossUrl) ? instances[alias].semossUrl : '';
                }
                // Get current instance alias
                const currentAlias = await this._context.secrets.get('CURRENT_INSTANCE_ALIAS');
                webviewView.webview.postMessage({
                    type: 'instanceAliasesWithUrls',
                    aliases,
                    urls,
                    currentInstance: currentAlias
                });
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
                                        this._addMessageToHistory('Instance "' + alias + '" authorized successfully!', 'bot', 'success');
                                    } catch (e) {
                                        webviewView.webview.postMessage({
                                            type: 'response',
                                            status: 'error',
                                            text: 'Error authorizing instance: ' + e.message,
                                            hideLoading: true
                                        });
                                        this._addMessageToHistory('Error authorizing instance: ' + e.message, 'bot', 'error');
                                    }
                                    return;
                                } case 'semoss.createNewApp': {
                                    const { appName, description, githubLink, isPrivateRepo, accessToken } = msg.inputs;

                                    // Debug logging to confirm values are passed correctly
                                    console.log('ChatbotWebview received inputs:', {
                                        appName,
                                        description,
                                        githubLink,
                                        isPrivateRepo,
                                        accessToken: accessToken ? 'PROVIDED' : 'NOT_PROVIDED'
                                    });

                                    try {
                                        const secrets = await getSecrets(this._context);
                                        if (!secrets) {
                                            resultMsg = 'Please authorize an instance first.';
                                            webviewView.webview.postMessage({ type: 'response', status: 'error', text: resultMsg, hideLoading: true });
                                            return;
                                        }
                                        const result = await createNewApp(this._context, async () => secrets, { appName, description, githubLink, isPrivateRepo, accessToken });
                                        if (result === false) {
                                            resultMsg = `Cancelled: No folder selected.`;
                                            webviewView.webview.postMessage({ type: 'response', status: 'warning', text: resultMsg, hideLoading: true });
                                            this._addMessageToHistory(resultMsg, 'bot', 'warning');
                                            return;
                                        }
                                        resultMsg = `App \"${appName}\" created successfully!`;
                                        // Always send hideLoading to stop spinner
                                        webviewView.webview.postMessage({ type: 'response', status: 'success', text: resultMsg, hideLoading: true });
                                        this._addMessageToHistory(resultMsg, 'bot', 'success');
                                        return;
                                    } catch (e) {
                                        resultMsg = `Error creating app: ${e.message}`;
                                        webviewView.webview.postMessage({ type: 'response', status: 'error', text: resultMsg, hideLoading: true });
                                        this._addMessageToHistory(resultMsg, 'bot', 'error');
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
                                                resultMsg = 'No workspace folder found.';                                        // Always hide loading even on error
                                                webviewView.webview.postMessage({ type: 'response', status: 'error', text: resultMsg, hideLoading: true });
                                                this._addMessageToHistory(resultMsg, 'bot', 'error');
                                                return;
                                            }
                                        }
                                        await vscode.commands.executeCommand(command, uri);
                                        resultMsg = `Action '${command}' executed on selected folder.`;
                                        // Always hide loading after deploy
                                        webviewView.webview.postMessage({ type: 'response', status: 'success', text: resultMsg, hideLoading: true });
                                        this._addMessageToHistory(resultMsg, 'bot', 'success');
                                        return;
                                    } else {
                                        await vscode.commands.executeCommand(command, msg.inputs);
                                        resultMsg = `Action '${command}' executed with provided details.`;
                                        // Always hide loading after any command
                                        webviewView.webview.postMessage({ type: 'response', status: 'success', text: resultMsg, hideLoading: true });
                                        this._addMessageToHistory(resultMsg, 'bot', 'success');
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
                        // Save error to history
                        this._addMessageToHistory(resultMsg, 'bot', 'error');
                    }
                }
                // Ensure resultMsg is always a string before sending
                const finalMsg = typeof resultMsg === 'string' ? resultMsg : String(resultMsg);
                webviewView.webview.postMessage({ type: 'response', text: finalMsg });
            }
            if (msg.type === 'getInstanceAliasesForRemoval') {
                // Send aliases for removal
                const instances = await getStoredInstances(this._context);
                const aliases = Object.keys(instances);


                // Build a map of alias to URL
                const urls = {};
                for (const alias of aliases) {
                    urls[alias] = (instances[alias] && instances[alias].semossUrl) ? instances[alias].semossUrl : '';
                }

                // Get current instance alias
                const currentAlias = await this._context.secrets.get('CURRENT_INSTANCE_ALIAS');
                webviewView.webview.postMessage({
                    type: 'instanceAliasesForRemoval',
                    aliases,
                    urls,
                    currentInstance: currentAlias
                });
                return;
            }
            if (msg.type === 'removeInstanceByAlias') {
                const { alias } = msg;
                const instances = await getStoredInstances(this._context);
                if (!instances[alias]) {
                    webviewView.webview.postMessage({ type: 'response', status: 'error', text: `Instance "${alias}" not found.`, hideLoading: true });
                    this._addMessageToHistory(`Instance "${alias}" not found.`, 'bot', 'error');
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
                this._addMessageToHistory(`Instance "${alias}" removed successfully!`, 'bot', 'success');
                return;
            }
        });
    }

    /**
     * Add a message to the chat history
     * @param {string} text - The message text
     * @param {string} from - Who sent the message ('user', 'bot', 'error')
     * @param {string} status - The status of the message ('success', 'error', 'warning')
     */
    _addMessageToHistory(text, from, status = null) {
        // Ensure text is always a string
        const messageText = typeof text === 'string' ? text : String(text);

        const message = {
            text: messageText,
            from,
            status,
            timestamp: Date.now()
        };
        this._chatHistory.push(message);

        // Keep only last 100 messages to prevent memory issues
        if (this._chatHistory.length > 100) {
            this._chatHistory = this._chatHistory.slice(-100);
        }
    }

    /**
     * Restore the chat state when webview becomes visible
     */
    _restoreChatState() {
        if (this._webviewView && this._webviewView.visible) {
            // Send a small delay to ensure webview is fully loaded
            setTimeout(() => {
                this._webviewView.webview.postMessage({
                    type: 'restoreHistory',
                    history: this._chatHistory,
                    state: this._currentState
                });
            }, 100);
        }
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
