// src/createApp.js
const vscode = require("vscode");
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const { setDeployConfig, deployProject } = require('./deploy');
const ncp = require('ncp').ncp;

async function createNewApp(context, getSecretsWithValidation, args) {
    try {
        let appName, description, githubLink;
        if (args && args.appName) {
            appName = args.appName;
            description = args.description || '';
        } else {
            appName = await vscode.window.showInputBox({ prompt: 'Enter app name' });
            if (!appName) return;
            description = await vscode.window.showInputBox({ prompt: 'Enter app description (optional)' });
            githubLink = await vscode.window.showInputBox({ prompt: 'GitHub link for marketplace app (optional)' });
        }

        // 2. Select download folder
        const uri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select download folder'
        });
        if (!uri || uri.length === 0) {
            vscode.window.showWarningMessage('Cancelled: No folder selected.');
            return;
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
            vscode.window.showErrorMessage('App creation failed: Invalid response from server.');
            return;
        }
        const projectId = response.data.pixelReturn[0].output.project_id;
        vscode.window.showInformationMessage(`App "${appName}" created successfully! Project ID: ${projectId}`);
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
            vscode.window.showErrorMessage('Export failed: Invalid response from server.');
            return;
        }
        const fileKey = exportResponse.data.pixelReturn[0].output;
        const insightId = exportResponse.data.insightID;
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
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(unzipDir), true);

        // Download from GitHub (if provided)
        if (!githubLink) return null;
        // Parse GitHub link
        const match = githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.+))?/);
        if (!match) throw new Error('Invalid GitHub link format.');
        const owner = match[1];
        const repo = match[2];
        const branch = match[3] || 'main';
        const folderPath = match[4] || '';
        const axios = require('axios');
        const https = require('https');
        // Get default branch if not specified
        let usedBranch = branch;
        if (!match[3]) {
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
            const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'node.js' } });
            usedBranch = res.data.default_branch;
        }
        // Download repo as zip with redirect support
        const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${usedBranch}.zip`;
        const zipPath = path.join(downloadsDir, `${appName}_github.zip`);
        const extractPath = path.join(downloadsDir, `${appName}_github_unzipped_${Date.now()}`);
        // Helper to follow redirects
        const downloadZipWithRedirect = (url, dest) => {
            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    if (res.statusCode === 302 && res.headers.location) {
                        https.get(res.headers.location, (res2) => {
                            if (res2.statusCode !== 200) {
                                reject(new Error(`Failed to download repo zip: ${res2.statusCode}`));
                                return;
                            }
                            const file = fs.createWriteStream(dest);
                            res2.pipe(file);
                            file.on('finish', () => file.close(resolve));
                            file.on('error', reject);
                        }).on('error', reject);
                    } else if (res.statusCode === 200) {
                        const file = fs.createWriteStream(dest);
                        res.pipe(file);
                        file.on('finish', () => file.close(resolve));
                        file.on('error', reject);
                    } else {
                        reject(new Error(`Failed to download repo zip: ${res.statusCode}`));
                    }
                }).on('error', reject);
            });
        };
        await downloadZipWithRedirect(zipUrl, zipPath);
        // Unzip
        await new Promise((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: extractPath }))
                .on('close', resolve)
                .on('error', reject);
        });
        // Find the extracted top-level folder
        const [topFolder] = fs.readdirSync(extractPath);
        let finalDir = path.join(extractPath, topFolder);
        // If a folderPath is specified, use that subfolder
        if (folderPath) {
            finalDir = path.join(finalDir, folderPath);
        }
        // Check if finalDir exists and is a directory
        if (!fs.existsSync(finalDir) || !fs.lstatSync(finalDir).isDirectory()) {
            throw new Error(`The specified folderPath (${folderPath}) does not exist in the repo.`);
        }
        // Log contents for debugging
        const files = fs.readdirSync(finalDir);
        if (files.length === 0) {
            vscode.window.showWarningMessage(`The folder ${finalDir} is empty.`);
        } else {
            vscode.window.showInformationMessage(`The folder ${finalDir} contains: ${files.join(', ')}`);
        }

        // 7. If GitHub app, copy files into SEMOSS app's assets (replace everything)
        const assetsDir = path.join(unzipDir, 'assets');
        // Remove existing assets directory and recreate it
        if (fs.existsSync(assetsDir)) {
            fs.rmSync(assetsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(assetsDir, { recursive: true });
        // Copy all files and folders from finalDir to assetsDir
        await new Promise((resolve, reject) => {
            ncp(finalDir, assetsDir, function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // 8. Deploy the package
        // Prepare deploy config
        setDeployConfig({
            semossUrl: secrets.semossUrl,
            authHeaders: headers,
            base64Encoded: encoded,
            outputPath: path.join(downloadsDir, `${appName}.zip`)
        });
        await deployProject(projectId);

        vscode.window.showInformationMessage('App created, assets copied, and deployed successfully!');
    } catch (err) {
        vscode.window.showErrorMessage(`Error: ${err.message}`);
    }
}

module.exports = { createNewApp };
