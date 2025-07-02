// ChatbotSeparateManager.js
// This is a utility file to manage the separate chatbot implementation

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * Get the HTML content for the separate chatbot implementation
 * @param {vscode.Webview} webview - The webview instance
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {string} HTML content for the webview
 */
export function getSeparateChatbotHtml(webview, context) {
    // Use the extension's file system path
    const extensionPath = context.extensionPath;

    // Get paths to the HTML, CSS, and JS files
    const htmlPath = vscode.Uri.file(
        path.join(extensionPath, 'src', 'components', 'Chatbot-ui', 'index.html')
    );
    const cssPath = vscode.Uri.file(
        path.join(extensionPath, 'src', 'components', 'Chatbot-ui', 'style.css')
    );
    const jsPath = vscode.Uri.file(
        path.join(extensionPath, 'src', 'components', 'Chatbot-ui', 'script.js')
    );

    // Convert URIs to webview-friendly format
    const cssUri = webview.asWebviewUri(cssPath);
    const jsUri = webview.asWebviewUri(jsPath);

    // Read the HTML file
    try {
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Replace resource references with webview URIs
        htmlContent = htmlContent
            .replace('href="style.css"', `href="${cssUri}"`)
            .replace('src="script.js"', `src="${jsUri}"`);

        return htmlContent;
    } catch (error) {
        console.error('Failed to load chatbot HTML:', error);
        return getErrorHtml(error);
    }
}

/**
 * Get path to user manual file
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {string} Path to user manual PDF
 */
export function getUserManualPath(context) {
    return path.join(context.extensionPath, 'assets', 'docs', 'semoss_user_manual.pdf');
}

/**
 * Generate error HTML in case the chatbot files cannot be loaded
 * @param {Error} error - The error that occurred
 * @returns {string} Error HTML
 */
function getErrorHtml(error) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Semoss Chatbot - Error</title>
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    margin: 0;
                    padding: 20px;
                }
                .error-container {
                    background: #303030;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px auto;
                    max-width: 600px;
                    border: 1px solid #454545;
                }
                .error-title {
                    color: #ff6b6b;
                    margin-bottom: 10px;
                }
                .error-message {
                    margin-bottom: 15px;
                    line-height: 1.5;
                }
                .error-stack {
                    font-family: monospace;
                    background: #252525;
                    padding: 10px;
                    border-radius: 4px;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h2 class="error-title">Failed to load Semoss Chatbot</h2>
                <div class="error-message">
                    There was an error loading the chatbot interface. Please check the console for more details.
                </div>
                <div class="error-stack">${error.toString()}</div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Exports the original getChatbotHtml and handleChatbotAction functions for backward compatibility
 */
export function handleChatbotAction(action, options) {
    console.log('handleChatbotAction called with:', action, options);
    // Implementation can be added here if needed
}

/**
 * Maps a chat message to a VS Code command string
 * @param {object} msg - The chat message object
 * @returns {string|null} The command string or null if not recognized
 */
export function mapMessageToCommand(msg) {
    if (!msg || !msg.text) return null;
    const text = msg.text.toLowerCase();

    if (text.includes('authorize')) return 'semoss.authorize';
    if (text.includes('create') && text.includes('app')) return 'semoss.createNewApp';
    if (text.includes('zip') && text.includes('deploy')) return 'semoss.zipanddeploy';
    if (text.includes('zip')) return 'semoss.ziponly';
    if (text.includes('deploy')) return 'semoss.deployonly';
    if (text.includes('remove') && text.includes('instance')) return 'semoss.removeInstance';
    if (text.includes('select') && text.includes('instance')) return 'semoss.selectInstance';
    if (text.includes('chatbot')) return 'semoss.openChatbot';

    return null;
}
