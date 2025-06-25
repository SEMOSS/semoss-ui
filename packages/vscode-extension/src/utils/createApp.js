import * as vscode from "vscode";
import path from "path";
import fs from "fs";
import { setDeployConfig, deployProject } from "./deploy.js";
import { zipProject } from "./zip.js";
import unzipper from "unzipper";
import axios from "axios";
import http from "http";
import https from "https";
import { processGithubAssets } from "./githubAssets.js";

export async function createNewApp(context, getSecretsWithValidation, args) {
    try {
        let appName, description, githubLink;
        if (args && args.appName) {
            appName = args.appName;
            description = args.description || '';
            githubLink = args.githubLink || '';
        } else {
            appName = await vscode.window.showInputBox({ prompt: 'Enter app name' });
            if (!appName) return;
            description = await vscode.window.showInputBox({ prompt: 'Enter app description (optional)' });
            githubLink = await vscode.window.showInputBox({ prompt: 'GitHub link for assets (optional)' });
        }

        // 2. Select download folder
        const uri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select download folder'
        });
        if (!uri || uri.length === 0) {
            throw new Error('No folder selected');
        }
        const downloadsDir = uri[0].fsPath;

        // 3. Prepare SEMOSS API secrets
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
            throw new Error('App creation failed: Invalid response from server.');
        }
        const projectId = response.data.pixelReturn[0].output.project_id;
        vscode.window.showInformationMessage(`App "${appName}" created successfully! Project ID: ${projectId}`);

        // Add a placeholder asset (index.html) to the project using SaveAsset ONLY if githubLink is NOT provided
        if (!githubLink) {
            const saveAssetParams = new URLSearchParams();
            saveAssetParams.append(
                'expression',
                `SaveAsset(fileName=["version/assets/portals/index.html"], content=["<encode><html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${appName}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html></encode>"], space=["${projectId}"]);`
            );
            saveAssetParams.append('insightId', 'new');
            try {
                await axios.post(
                    `${secrets.semossUrl}/Monolith/api/engine/runPixel`,
                    saveAssetParams,
                    { headers }
                );
                vscode.window.showInformationMessage('Placeholder asset (index.html) added to the project.');
            } catch (err) {
               throw new Error('Failed to add placeholder asset: ' + ( err.message || 'Unknown error'));
            }
        }
        // Export project
        const exportParams = new URLSearchParams();
        exportParams.append('expression', `ExportProjectApp(project=["${projectId}"]);`);
        exportParams.append('insightId', 'new');
        const exportResponse = await axios.post(
            `${secrets.semossUrl}/Monolith/api/engine/runPixel`,
            exportParams,
            { headers }
        );
        if (!exportResponse.data || !exportResponse.data.pixelReturn || !exportResponse.data.pixelReturn[0] || !exportResponse.data.pixelReturn[0].output) {
            throw new Error('Export failed: Invalid response from server.');
        }
        const fileKey = exportResponse.data.pixelReturn[0].output;
        const insightId = exportResponse.data.insightID;
        const filePath = path.join(downloadsDir, `${appName}.zip`);
        const downloadUrl = `${secrets.semossUrl}/Monolith/api/engine/downloadFile?insightId=${insightId}&fileKey=${encodeURIComponent(fileKey)}`;
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            const url = new URL(downloadUrl);
            const protocol = url.protocol === 'https:' ? https : http;
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
                fs.unlink(filePath, () => { });
                vscode.window.showErrorMessage(`Download failed: ${err.message}`);
                reject(err);
            });
            req.end();
        });
        try {
            const stats = fs.statSync(filePath);
            vscode.window.showInformationMessage(`Downloaded file size: ${stats.size} bytes`);
        } catch (e) {
            console.error(`Failed to get file stats for ${filePath}:`, e);
            throw new Error(`Could not get file size for ${filePath}.`);
        }
        // Automatically unzip in the same folder as the zip
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

        // Process GitHub assets if a link was provided
        if (githubLink) {
            vscode.window.showInformationMessage(`Processing GitHub assets from: ${githubLink}`);
            await processGithubAssets(githubLink, downloadsDir, appName, unzipDir);
        }

        // Open the folder in VS Code
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(unzipDir), true);

        let zipOutputPath;
        await zipProject(unzipDir); // Pass the folder path explicitly
        zipOutputPath = path.join(unzipDir, 'assets.zip');
        vscode.window.showInformationMessage(`GitHub App zipped to ${zipOutputPath}`);
            

        // Deploy the zipped app using your deploy logic
        setDeployConfig({
            semossUrl: secrets.semossUrl,
            authHeaders: headers,
            base64Encoded: encoded,
            outputPath: zipOutputPath
        });
        await deployProject(projectId);

        vscode.window.showInformationMessage('App created, zipped and deployed successfully!');
    } catch (err) {
        throw new Error(`Failed to create app: ${err.message || err}`);
    }
}
