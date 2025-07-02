// Required modules and project imports
const vscode = require("vscode");
const fs = require("fs");
const { storeSecrets, getSecrets, selectInstance, removeInstance, storeInstance, getStoredInstances } = require('./src/utils/secrets.js');
const { setFolderPaths, getProjectId } = require('./src/utils/projectUtils.js');
const { setDeployConfig, deployProject } = require('./src/utils/deploy.js');
const { zipProject } = require('./src/utils/zip.js');
const { createNewApp } = require('./src/utils/createApp.js');
const { initStatusBar, updateStatusBar } = require('./src/utils/statusBar.js');
const { handleChatbotAction } = require('./src/components/ChatbotWebview/ChatbotSeparateManager.js');
const { registerChatbotWebview } = require('./src/components/ChatbotWebview/ChatbotWebview.js');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    // Register the chatbot webview
    registerChatbotWebview(context);

    // Register authorize command (add new instance)
    const disposable1 = vscode.commands.registerCommand(
        "semoss.authorize",
        async (args) => {
            // If called from chatbot, use args; otherwise, prompt
            if (args && args.alias && args.url && args.accessKey && args.privateKey) {
                // Store instance directly
                const { storeInstance } = require('./src/secrets');
                await storeInstance(context, args.alias, {
                    semossUrl: args.url,
                    accessKey: args.accessKey,
                    privateKey: args.privateKey
                });
                await context.secrets.store('CURRENT_INSTANCE_ALIAS', args.alias);
                vscode.window.showInformationMessage(`Instance "${args.alias}" saved successfully!`);
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else {
                await storeSecrets(context);
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        }
    );

    // Register select instance command
    const disposable5 = vscode.commands.registerCommand(
        "semoss.selectInstance",
        async (args) => {
            if (args && args.alias) {
                await context.secrets.store('CURRENT_INSTANCE_ALIAS', args.alias);
                vscode.window.showInformationMessage(`Switched to instance: ${args.alias}`);
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else {
                const selected = await selectInstance(context);
                if (selected) {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            }
        }
    );

    // Register remove instance command
    const disposable6 = vscode.commands.registerCommand(
        "semoss.removeInstance",
        async (args) => {
            if (args && args.alias) {
                const { getStoredInstances } = require('./src/secrets');
                const instances = await getStoredInstances(context);
                if (instances[args.alias]) {
                    delete instances[args.alias];
                    await context.secrets.store('SEMOSS_INSTANCES', JSON.stringify(instances));
                    const currentAlias = await context.secrets.get('CURRENT_INSTANCE_ALIAS');
                    if (currentAlias === args.alias) {
                        await context.secrets.delete('CURRENT_INSTANCE_ALIAS');
                    }
                    vscode.window.showInformationMessage(`Instance "${args.alias}" removed successfully!`);
                } else {
                    vscode.window.showWarningMessage(`Instance "${args.alias}" not found.`);
                }
            } else {
                await removeInstance(context);
            }
        }
    );

    // Register create new project command
    const disposableCreateApp = vscode.commands.registerCommand(
        "semoss.createNewApp",
        async (args) => {
            // If called from chatbot, use args; otherwise, prompt
            if (args && args.appName) {
                const getSecretsWithValidation = async (context) => {
                    const secrets = await getSecrets(context);
                    if (!secrets || !secrets.semossUrl || !secrets.accessKey || !secrets.privateKey) {
                        vscode.window.showErrorMessage('No instance configured. Please authorize an instance first.');
                        return null;
                    }
                    return secrets;
                };
                // Patch createNewApp to accept args
                const { createNewApp } = require('./src/createApp');
                await createNewApp(context, getSecretsWithValidation, args);
            } else {
                await createNewApp(context, getSecretsWithValidation);
            }
        }
    );
    context.subscriptions.push(disposableCreateApp);

    // Helper function to get secrets with error handling
    const getSecretsWithValidation = async (context) => {
        const secrets = await getSecrets(context);
        if (!secrets || !secrets.semossUrl || !secrets.accessKey || !secrets.privateKey) {
            vscode.window.showErrorMessage('No instance configured. Please authorize an instance first.');
            return null;
        }
        return secrets;
    };

    // Register zip and deploy command
    const disposable2 = vscode.commands.registerCommand(
        "semoss.zipanddeploy",
        async (uri) => {
            if (!uri || !uri.fsPath) {
                vscode.window.showErrorMessage('Please right-click a folder (client, portals, or py) and select "Semoss: Zip and deploy".');
                return;
            }
            try {
                const secrets = await getSecretsWithValidation(context);
                if (!secrets) return;

                setFolderPaths(uri);
                const projectId = getProjectId();

                if (!projectId) {
                    vscode.window.showErrorMessage('Unable to find project id in the smss file');
                    return;
                }

                // Zip the project
                await zipProject();

                // Configure deployment
                const encoded = Buffer.from(secrets.accessKey + ':' + secrets.privateKey).toString('base64');
                const headers = { 'Authorization': 'Basic ' + encoded };

                setDeployConfig({
                    semossUrl: secrets.semossUrl,
                    authHeaders: headers,
                    base64Encoded: encoded,
                    outputPath: getOutputFilePath()
                });

                // Deploy the project
                await deployProject(projectId);
            } catch (error) {
                vscode.window.showErrorMessage(`Error in zip and deploy: ${error.message}`);
            }
        }
    );

    // Register zip only command
    const disposable3 = vscode.commands.registerCommand(
        "semoss.ziponly",
        async (uri) => {
            if (!uri || !uri.fsPath) {
                vscode.window.showErrorMessage('Please right-click a folder (client, portals, or py) and select "Semoss: Zip only".');
                return;
            }
            try {
                setFolderPaths(uri);
                await zipProject();
            } catch (error) {
                vscode.window.showErrorMessage(`Error in zip: ${error.message}`);
            }
        }
    );

    // Register deploy only command
    const disposable4 = vscode.commands.registerCommand(
        "semoss.deployonly",
        async (uri) => {
            if (!uri || !uri.fsPath) {
                vscode.window.showErrorMessage('Please right-click a folder (client, portals, or py) and select "Semoss: Deploy only".');
                return;
            }
            try {
                const secrets = await getSecretsWithValidation(context);
                if (!secrets) return;

                setFolderPaths(uri);
                const projectId = getProjectId();

                if (!projectId) {
                    vscode.window.showErrorMessage('Unable to find project id in the smss file');
                    return;
                }

                // Configure deployment
                const encoded = Buffer.from(secrets.accessKey + ':' + secrets.privateKey).toString('base64');
                const headers = { 'Authorization': 'Basic ' + encoded };

                setDeployConfig({
                    semossUrl: secrets.semossUrl,
                    authHeaders: headers,
                    base64Encoded: encoded,
                    outputPath: getOutputFilePath()
                });

                await deployProject(projectId);
            } catch (error) {
                vscode.window.showErrorMessage(`Error in deploy: ${error.message}`);
            }
        }
    );

    // Register chatbot action command for programmatic use
    const disposableChatbot = vscode.commands.registerCommand(
        "semoss.chatbotAction",
        /**
         * @param {string} action - The action to perform (zipanddeploy, ziponly, deployonly, authorize, selectInstance, removeInstance, createNewApp)
         * @param {object} options - Additional options (e.g., uri)
         */


        async (action, options = {}) => {
            if (action === 'removeInstance') {
                const { getStoredInstances } = require('./src/secrets');
                const instances = await getStoredInstances(context);
                const aliases = Object.keys(instances);
                if (aliases.length === 0) {
                    vscode.window.showWarningMessage('No stored instances found.');
                    return;
                }
                const items = aliases.map(alias => ({
                    label: alias,
                    description: instances[alias].semossUrl
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select instance to remove'
                });
                if (selected) {
                    const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
                        placeHolder: `Are you sure you want to remove "${selected.label}"?`
                    });
                    if (confirm === 'Yes') {
                        delete instances[selected.label];
                        await context.secrets.store('SEMOSS_INSTANCES', JSON.stringify(instances));
                        // If this was the current instance, clear it
                        const currentAlias = await context.secrets.get('CURRENT_INSTANCE_ALIAS');
                        if (currentAlias === selected.label) {
                            await context.secrets.delete('CURRENT_INSTANCE_ALIAS');
                        }
                        vscode.window.showInformationMessage(`Instance "${selected.label}" removed successfully!`);
                    }
                }
                return;
            }
            await handleChatbotAction(action, options, context);
        }
    );
    context.subscriptions.push(disposableChatbot);

    // Register command to open the chatbot sidebar
    const disposableOpenChatbot = vscode.commands.registerCommand(
        "semoss.openChatbot",
        () => {
            // Reveal the Semoss Chatbot sidebar container
            vscode.commands.executeCommand('workbench.view.extension.semossChatbotContainer');
            // Reveal the chatbot view inside the container
            vscode.commands.executeCommand('workbench.view.extension.semossChatbotView');
        }
    );
    context.subscriptions.push(disposableOpenChatbot);

    // Check if credentials are available and show status
    const secrets = await getSecrets(context);

    if (secrets && secrets.semossUrl && secrets.accessKey && secrets.privateKey) {
        vscode.window.showInformationMessage(`Semoss: Connected to "${secrets.alias || 'Default'}" (${secrets.semossUrl})`);
        context.subscriptions.push(disposable1, disposable2, disposable3, disposable4, disposable5, disposable6);
    } else {
        vscode.window.showErrorMessage('Semoss: No instance configured. Use "Semoss: Authorize New Instance" to get started.');
        context.subscriptions.push(disposable1, disposable5, disposable6); // Add instance management commands even if not authenticated
    }
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
