// CommonJS imports
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
    // Initialize the status bar
    initStatusBar(context);
    await updateStatusBar(context);

    // Register the chatbot webview
    registerChatbotWebview(context);

    // Register authorize command (add new instance)
    const disposableAuthorize = vscode.commands.registerCommand(
        "semoss.authorize",
        async (args) => {
            // If called from chatbot, use args; otherwise, prompt
            if (args && args.alias && args.url && args.accessKey && args.privateKey) {
                await storeInstance(context, args.alias, {
                    semossUrl: args.url,
                    accessKey: args.accessKey,
                    privateKey: args.privateKey
                });
                await context.secrets.store('CURRENT_INSTANCE_ALIAS', args.alias);
                await updateStatusBar(context);
                vscode.window.showInformationMessage(`Instance "${args.alias}" saved successfully!`);
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else {
                await storeSecrets(context);
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        }
    );

    // Register select instance command
    const disposableSelectInstance = vscode.commands.registerCommand(
        "semoss.selectInstance",
        async (args) => {
            if (args && args.alias) {
                await context.secrets.store('CURRENT_INSTANCE_ALIAS', args.alias);
                await updateStatusBar(context);
                vscode.window.showInformationMessage(`Switched to instance: ${args.alias}`);
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else {
                const selected = await selectInstance(context);
                if (selected) {
                    await updateStatusBar(context);
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            }
        }
    );

    // Register remove instance command
    const disposableRemoveInstance = vscode.commands.registerCommand(
        "semoss.removeInstance",
        async (args) => {
            if (args && args.alias) {
                const instances = await getStoredInstances(context);
                if (instances[args.alias]) {
                    delete instances[args.alias];
                    await context.secrets.store('SEMOSS_INSTANCES', JSON.stringify(instances));
                    const currentAlias = await context.secrets.get('CURRENT_INSTANCE_ALIAS');
                    if (currentAlias === args.alias) {
                        await context.secrets.delete('CURRENT_INSTANCE_ALIAS');
                        await updateStatusBar(context);
                    }
                    vscode.window.showInformationMessage(`Instance "${args.alias}" removed successfully!`);
                } else {
                    vscode.window.showWarningMessage(`Instance "${args.alias}" not found.`);
                }
            } else {
                await removeInstance(context);
                await updateStatusBar(context);
            }
        }
    );    // Register create new project command
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
    const disposableZipDeploy = vscode.commands.registerCommand(
        "semoss.zipanddeploy",
        async (uri) => {
            // If called from Chatbot UI, uri may be undefined. Use first workspace folder.
            if (!uri || !uri.fsPath) {
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                    uri = vscode.workspace.workspaceFolders[0].uri;
                } else {
                    vscode.window.showErrorMessage('No workspace folder found.');
                    return;
                }
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

                // Zip the project (json, smss, assets as assets.zip)
                await zipProject();

                // Configure deployment to use assets.zip
                const outputZip = uri.fsPath + '/assets.zip';
                const encoded = Buffer.from(secrets.accessKey + ':' + secrets.privateKey).toString('base64');
                const headers = { 'Authorization': 'Basic ' + encoded };

                setDeployConfig({
                    semossUrl: secrets.semossUrl,
                    authHeaders: headers,
                    base64Encoded: encoded,
                    outputPath: outputZip
                });

                // Deploy the project
                await deployProject(projectId);
            } catch (error) {
                vscode.window.showErrorMessage(`Error in zip and deploy: ${error.message}`);
            }
        }
    );

    // Register zip only command
    const disposableZip = vscode.commands.registerCommand(
        "semoss.ziponly",
        async (uri) => {
            // If called from Chatbot UI, uri may be undefined. Use first workspace folder.
            if (!uri || !uri.fsPath) {
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                    uri = vscode.workspace.workspaceFolders[0].uri;
                } else {
                    vscode.window.showErrorMessage('No workspace folder found.');
                    return;
                }
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
    const disposableDeploy = vscode.commands.registerCommand(
        "semoss.deployonly",
        async (uri) => {
            // Always deploy assets.zip from the selected or first workspace folder
            if (!uri || !uri.fsPath) {
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                    uri = vscode.workspace.workspaceFolders[0].uri;
                } else {
                    vscode.window.showErrorMessage('No workspace folder found.');
                    return;
                }
            }
            try {
                const outputZip = uri.fsPath + '/assets.zip';
                if (!fs.existsSync(outputZip)) {
                    vscode.window.showErrorMessage('No assets.zip present in the selected folder.');
                    return;
                }
                const secrets = await getSecretsWithValidation(context);
                if (!secrets) return;

                setFolderPaths(uri);
                const projectId = getProjectId();

                if (!projectId) {
                    vscode.window.showErrorMessage('Unable to find project id in the smss file');
                    return;
                }

                // Configure deployment to use assets.zip
                const encoded = Buffer.from(secrets.accessKey + ':' + secrets.privateKey).toString('base64');
                const headers = { 'Authorization': 'Basic ' + encoded };

                setDeployConfig({
                    semossUrl: secrets.semossUrl,
                    authHeaders: headers,
                    base64Encoded: encoded,
                    outputPath: outputZip
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
        async (action, options = {}) => {
            if (action === 'removeInstance') {
                // Using the already imported getStoredInstances from the top of the file
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
                            await updateStatusBar(context);
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
        context.subscriptions.push(disposableAuthorize, disposableZipDeploy, disposableZip, disposableDeploy, disposableSelectInstance, disposableRemoveInstance);
    } else {
        vscode.window.showErrorMessage('Semoss: No instance configured. Use "Semoss: Authorize New Instance" to get started.');
        context.subscriptions.push(disposableAuthorize, disposableSelectInstance, disposableRemoveInstance); // Add instance management commands even if not authenticated
    }
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = { activate, deactivate };
