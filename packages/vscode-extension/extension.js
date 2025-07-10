// CommonJS imports
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
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
                    }
                    // Always update status bar after instance removal
                    await updateStatusBar(context);
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
            const getSecretsWithValidation = async (context) => {
                const secrets = await getSecrets(context);
                if (!secrets || !secrets.semossUrl || !secrets.accessKey || !secrets.privateKey) {
                    vscode.window.showErrorMessage('No instance configured. Please authorize an instance first.');
                    return null;
                }
                return secrets;
            };

            try {
                if (args && args.appName) {
                    await createNewApp(context, getSecretsWithValidation, args);
                } else {
                    await createNewApp(context, getSecretsWithValidation);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`App creation failed: ${error.message}`);
                console.error('Error in createNewApp:', error);
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

                // Zip the project (json, smss, assets as assets.zip)
                await zipProject();

                // Find the zip file that was created (should be assets.zip, but let's be flexible)
                const zipFiles = fs.readdirSync(uri.fsPath).filter(file => file.endsWith('.zip'));
                let outputZip;

                if (zipFiles.includes('assets.zip')) {
                    // Prefer assets.zip if it exists (which it should after zipProject())
                    outputZip = path.join(uri.fsPath, 'assets.zip');
                } else if (zipFiles.length > 0) {
                    // Use the first zip file found
                    outputZip = path.join(uri.fsPath, zipFiles[0]);
                    vscode.window.showInformationMessage(`Using zip file: ${zipFiles[0]}`);
                } else {
                    vscode.window.showErrorMessage('No zip file was created during the zip process.');
                    return;
                }

                // Validate the zip file exists and is readable
                if (!fs.existsSync(outputZip)) {
                    vscode.window.showErrorMessage(`Zip file does not exist: ${path.basename(outputZip)}`);
                    return;
                }

                // Check if file is not empty
                const stats = fs.statSync(outputZip);
                if (stats.size === 0) {
                    vscode.window.showErrorMessage(`Zip file is empty: ${path.basename(outputZip)}`);
                    return;
                }

                vscode.window.showInformationMessage(`Created and ready to deploy: ${path.basename(outputZip)} (${Math.round(stats.size / 1024)} KB)`);

                // Configure deployment to use the found zip file
                const encoded = Buffer.from(secrets.accessKey + ':' + secrets.privateKey).toString('base64');
                const headers = { 'Authorization': 'Basic ' + encoded };

                setDeployConfig({
                    semossUrl: secrets.semossUrl,
                    authHeaders: headers,
                    base64Encoded: encoded,
                    outputPath: outputZip
                });

                // Retrieve and use the current project ID
                const projectId = await getProjectId(context);
                if (!projectId) {
                    vscode.window.showErrorMessage('Unable to find project id in the smss file');
                    return;
                }
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
                // Find zip files in the directory
                const zipFiles = fs.readdirSync(uri.fsPath).filter(file => file.endsWith('.zip'));
                let outputZip;

                if (zipFiles.length === 0) {
                    vscode.window.showErrorMessage('No zip files found in the selected folder. Please create a zip file first using "Zip Only" command or manually.');
                    return;
                } else if (zipFiles.includes('assets.zip')) {
                    // Prefer assets.zip if it exists
                    outputZip = path.join(uri.fsPath, 'assets.zip');
                    vscode.window.showInformationMessage('Using preferred zip file: assets.zip');
                } else if (zipFiles.length === 1) {
                    // If only one zip file exists (and it's not assets.zip), use it
                    outputZip = path.join(uri.fsPath, zipFiles[0]);
                    vscode.window.showInformationMessage(`Using zip file: ${zipFiles[0]}`);
                } else {
                    // Multiple zip files exist, let user choose
                    const selectedZip = await vscode.window.showQuickPick(zipFiles, {
                        placeHolder: 'Multiple zip files found. Select one to deploy:',
                        canPickMany: false
                    });
                    if (!selectedZip) {
                        vscode.window.showInformationMessage('Deploy cancelled.');
                        return;
                    }
                    outputZip = path.join(uri.fsPath, selectedZip);
                    vscode.window.showInformationMessage(`Selected zip file: ${selectedZip}`);
                }

                // Validate the zip file exists and is readable
                if (!fs.existsSync(outputZip)) {
                    vscode.window.showErrorMessage(`Selected zip file does not exist: ${path.basename(outputZip)}`);
                    return;
                }

                // Check if file is not empty
                const stats = fs.statSync(outputZip);
                if (stats.size === 0) {
                    vscode.window.showErrorMessage(`Selected zip file is empty: ${path.basename(outputZip)}`);
                    return;
                }

                vscode.window.showInformationMessage(`Ready to deploy: ${path.basename(outputZip)} (${Math.round(stats.size / 1024)} KB)`);

                const secrets = await getSecretsWithValidation(context);
                if (!secrets) return;

                setFolderPaths(uri);

                // Retrieve and use the current project ID
                const projectId = await getProjectId(context);
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
                        }
                        // Always update status bar after instance removal
                        await updateStatusBar(context);
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
