// Required modules and project imports
const vscode = require("vscode");
const { storeSecrets, getSecrets, selectInstance, removeInstance } = require('./src/secrets');
const { setFolderPaths, getProjectId, getOutputFilePath } = require('./src/projectUtils');
const { setDeployConfig, deployProject } = require('./src/deploy');
const { zipProject } = require('./src/zip');
const { createNewApp } = require('./src/createApp');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    // Register authorize command (add new instance)
    const disposable1 = vscode.commands.registerCommand(
        "semoss.authorize",
        async () => {
            await storeSecrets(context);
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    );

    // Register select instance command
    const disposable5 = vscode.commands.registerCommand(
        "semoss.selectInstance",
        async () => {
            const selected = await selectInstance(context);
            if (selected) {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        }
    );

    // Register remove instance command
    const disposable6 = vscode.commands.registerCommand(
        "semoss.removeInstance",
        async () => {
            await removeInstance(context);
        }
    );

    //Register create new project command
    const disposableCreateApp = vscode.commands.registerCommand(
        "semoss.createNewApp",
        async () => {
            await createNewApp(context, getSecretsWithValidation);
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
