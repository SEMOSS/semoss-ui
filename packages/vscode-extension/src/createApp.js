// src/createApp.js
const vscode = require("vscode");
const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');

async function createNewApp(context, getSecretsWithValidation) {
    try {
        const appName = await vscode.window.showInputBox({ prompt: 'Enter app name' });
        if (!appName) return;
        const description = await vscode.window.showInputBox({ prompt: 'Enter app description (optional)' });
        const secrets = await getSecretsWithValidation(context);
        if (!secrets) return;
        const encoded = Buffer.from(secrets.accessKey + ':' + secrets.privateKey).toString('base64');
        const headers = {
            'Authorization': 'Basic ' + encoded,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const params = new URLSearchParams();
        params.append('expression', `CreateProject(project=["${appName}"], portal=[true], projectType=["CODE"], description=["${description || ''}"])`);
        params.append('insightId', 'new');
        const response = await axios.post(
            `${secrets.semossUrl}/Monolith/api/engine/runPixel`,
            params,
            { headers }
        );
        if (!response.data || !response.data.pixelReturn || !response.data.pixelReturn[0] || !response.data.pixelReturn[0].output || !response.data.pixelReturn[0].output.project_id) {
            vscode.window.showErrorMessage('App creation failed: Invalid response from server.');
            return;
        }
        const projectId = response.data.pixelReturn[0].output.project_id;
        vscode.window.showInformationMessage(`App "${appName}" created successfully! Project ID: ${projectId}`);
        const exportParams = new URLSearchParams();
        exportParams.append('expression', `ExportProjectApp(project=["${projectId}"]);`);
        exportParams.append('insightId', 'new');
        const exportResponse = await axios.post(
            `${secrets.semossUrl}/Monolith/api/engine/runPixel`,
            exportParams,
            { headers }
        );
        if (!exportResponse.data || !exportResponse.data.pixelReturn || !exportResponse.data.pixelReturn[0] || !exportResponse.data.pixelReturn[0].output) {
            vscode.window.showErrorMessage('Export failed: Invalid response from server.');
            return;
        }
        const fileKey = exportResponse.data.pixelReturn[0].output;
        const insightId = exportResponse.data.insightID;

        // Ask user for download location
        const uri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select download folder'
        });

         if (!uri || uri.length === 0) {
            vscode.window.showWarningMessage('Download cancelled: No folder selected.');
            return;
        }

        const downloadsDir = uri[0].fsPath;
        const filePath = path.join(downloadsDir, `${appName}.zip`);
        const downloadUrl = `${secrets.semossUrl}/Monolith/api/engine/downloadFile?insightId=${insightId}&fileKey=${encodeURIComponent(fileKey)}`;
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            const url = new URL(downloadUrl);
            const protocol = url.protocol === 'https:' ? require('https') : require('http');
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + encoded
                }
            };
            const req = protocol.request(options, (response) => {
                if (response.statusCode !== 200) {
                    let errorMsg = `Download failed with status code: ${response.statusCode}`;
                    response.on('data', chunk => errorMsg += chunk.toString());
                    response.on('end', () => {
                        vscode.window.showErrorMessage(errorMsg);
                        reject(new Error(errorMsg));
                    });
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
                file.on('error', (err) => reject(err));
            });
            req.on('error', (err) => {
                fs.unlink(filePath, () => {});
                vscode.window.showErrorMessage('Download error: ' + err.message);
                reject(err);
            });
            req.end();
        });
        try {
            const stats = fs.statSync(filePath);
            vscode.window.showInformationMessage(`Downloaded file size: ${stats.size} bytes`);
        } catch (e) {}
        await new Promise((resolve) => setTimeout(resolve, 500));
        const unzipDir = path.join(downloadsDir, `${appName}_unzipped_${Date.now()}`);
        if (!fs.existsSync(unzipDir)) {
            fs.mkdirSync(unzipDir);
        }
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(unzipper.Extract({ path: unzipDir }))
                .on('close', resolve)
                .on('error', reject);
        });
        vscode.window.showInformationMessage(`App unzipped to ${unzipDir}`);
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(unzipDir), true);
        vscode.window.showInformationMessage(`Export for App "${appName}" completed successfully!`);
    } catch (err) {
        vscode.window.showErrorMessage(`Error: ${err.message}`);
    }
}

module.exports = { createNewApp };
