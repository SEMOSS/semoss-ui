const vscode = require("vscode");
const fs = require("fs");
const axios = require("axios");
const FormData = require('form-data');

let SEMOSS_URL = "";
let headers = {};
let encoded = "";
let outputFilePath = "";

/**
 * Configure deployment settings
 * @param {Object} config - The configuration object
 * @param {string} config.semossUrl - The Semoss URL
 * @param {Object} config.authHeaders - The authentication headers
 * @param {string} config.base64Encoded - The base64 encoded credentials
 * @param {string} config.outputPath - The output file path
 */
function setDeployConfig(config) {
    SEMOSS_URL = config.semossUrl;
    headers = config.authHeaders;
    encoded = config.base64Encoded;
    outputFilePath = config.outputPath;
}

/**
 * Deploy the project to Semoss
 * @param {string} projectId - The project ID
 * @returns {Promise<void>}
 */
async function deployProject(projectId) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Deploying Project",
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 10 });

        let response, params, insightId = "";
        
        // Create new insight
        try {
            params = new URLSearchParams();
            params.append('expression', 'true');
            params.append('insightId', 'new');

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/engine/runPixel`, params, { headers });
            insightId = response.data.insightID;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to create new insight', error);
            return;
        }

        if (!insightId) {
            vscode.window.showErrorMessage('Empty insight ID returned created');
            return;
        }

        progress.report({ increment: 15 });

        // Delete existing assets
        try {
            params = new URLSearchParams();
            params.append('expression', `DeleteAsset(filePath=["version/assets/"], space=["${projectId}"]);`);
            params.append('insightId', insightId);

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/engine/runPixel`, params, { headers });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to delete assets', error);
            return;
        }

        if (response.data.pixelReturn[0].operationType[0] !== "SUCCESS") {
            vscode.window.showErrorMessage('Failed to delete assets', response.data.pixelReturn[0].output);
        }

        progress.report({ increment: 20 });

        // Upload new assets
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(outputFilePath));

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/uploadFile/baseUpload?insightId=${insightId}&projectId=${projectId}&path=version/assets/`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': 'Basic ' + encoded
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to upload assets', error);
            return;
        }

        if (!response.data[0].fileLocation) {
            vscode.window.showErrorMessage('Failed to upload assets');
            return;
        }

        progress.report({ increment: 50 });

        // Unzip the uploaded file
        const fileLocation = response.data[0].fileLocation;
        try {
            params = new URLSearchParams();
            params.append('expression', `UnzipFile(filePath=["${fileLocation}"], space=["${projectId}"]);`)
            params.append('insightId', insightId);

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/engine/runPixel`, params, { headers });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to unzip file', error);
            return;
        }

        if (response.data.pixelReturn[0].output !== true) {
            vscode.window.showErrorMessage('Failed to unzip file');
            return;
        }

        progress.report({ increment: 70 });

        // Reload insight classes
        try {
            params = new URLSearchParams();
            params.append('expression', `ReloadInsightClasses('${projectId}');`)
            params.append('insightId', insightId);

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/engine/runPixel`, params, { headers });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to reload insight classes', error);
            return;
        }

        if (!response.data.pixelReturn[0].output) {
            vscode.window.showErrorMessage('Failed to reload insight classes');
            return;
        }

        progress.report({ increment: 80 });

        // Set project portal
        try {
            params = new URLSearchParams();
            params.append('projectId', projectId)
            params.append('hasPortal', true);
            params.append('projectId', "public");

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/auth/project/setProjectPortal`, params, { headers });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to set project portal', error);
            return;
        }

        if (!response.data) {
            vscode.window.showErrorMessage('Failed to set project portal');
            return;
        }

        progress.report({ increment: 90 });

        // Publish project
        try {
            params = new URLSearchParams();
            params.append('expression', `PublishProject('${projectId}', release=true);`)
            params.append('insightId', insightId);

            response = await axios.post(`${SEMOSS_URL}/Monolith/api/engine/runPixel`, params, { headers });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to reload insight classes', error);
            return;
        }

        progress.report({ increment: 100 });

        if (response.data.pixelReturn[0].additionalOutput[0].operationType[0] !== "SUCCESS") {
            vscode.window.showErrorMessage('Failed to reload insight classes');
            return;
        }

        vscode.window.showInformationMessage('Project deployed successfully!');
    });
}

module.exports = {
    setDeployConfig,
    deployProject
};
