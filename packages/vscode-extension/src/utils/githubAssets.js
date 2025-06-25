import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import https from 'https';
import unzipper from 'unzipper';
import axios from 'axios';
import ncp from 'ncp';

/**
 * Downloads and extracts assets from a GitHub repository
 *
 * @param {string} githubLink - GitHub repository link
 * @param {string} downloadsDir - Directory to download files to
 * @param {string} appName - Name of the app being created
 * @param {string} unzipDir - Directory where the SEMOSS app was unzipped
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function processGithubAssets(
    githubLink,
    downloadsDir,
    appName,
    unzipDir
) {
    if (!githubLink) return false;

    let zipPath = '';
    let extractPath = '';

    try {
        // Parse GitHub link - handles URLs with or without protocol
        const match = githubLink.match(
            /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.+))?/
        );
        if (!match) {
            throw new Error(
                'Invalid GitHub link format. Expected format: github.com/user/repo'
            );
        }

        const owner = match[1];
        const repo = match[2];
        const branch = match[3] || 'main';
        const folderPath = match[4] || '';

        // Get default branch if not specified
        let usedBranch = branch;
        if (!match[3]) {
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
            const res = await axios.get(apiUrl, {
                headers: { 'User-Agent': 'node.js' },
            });
            usedBranch = res.data.default_branch;
        }

        // Download repo as zip with redirect support
        const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${usedBranch}.zip`;
        zipPath = path.join(downloadsDir, `${appName}_github.zip`);
        extractPath = path.join(
            downloadsDir,
            `${appName}_github_unzipped_${Date.now()}`
        );

        vscode.window.showInformationMessage(
            `Downloading repository from ${zipUrl}...`
        );

        // Download GitHub repo
        await downloadZipWithRedirect(zipUrl, zipPath);

        // Unzip GitHub repo
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
            throw new Error(
                `The specified folderPath (${folderPath}) does not exist in the repo.`
            );
        }

        // Copy assets to the app
        const assetsDir = path.join(unzipDir, 'assets');

        // Remove existing assets directory if it exists
        if (fs.existsSync(assetsDir)) {
            fs.rmSync(assetsDir, { recursive: true, force: true });
        }

        // Create assets directory
        fs.mkdirSync(assetsDir, { recursive: true });

        await new Promise((resolve, reject) => {
            fs.readdir(finalDir, (err, items) => {
                if (err) return reject(err);
                let pending = items.length;
                if (!pending) return resolve();
                items.forEach((item) => {
                    const srcPath = path.join(finalDir, item);
                    const destPath = path.join(assetsDir, item);
                    fs.stat(srcPath, (err, stat) => {
                        if (err) return reject(err);
                        if (stat.isDirectory()) {
                            ncp(srcPath, destPath, (err) => {
                                if (err) return reject(err);
                                if (!--pending) resolve();
                            });
                        } else {
                            fs.copyFile(srcPath, destPath, (err) => {
                                if (err) return reject(err);
                                if (!--pending) resolve();
                            });
                        }
                    });
                });
            });
        });

        vscode.window.showInformationMessage(
            `Successfully copied assets from GitHub repository.`
        );

        // Clean up: delete the zip file and extracted folder
        try {
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
                vscode.window.showInformationMessage(
                    `Deleted temporary GitHub zip file.`
                );
            }

            if (fs.existsSync(extractPath)) {
                fs.rmSync(extractPath, { recursive: true, force: true });
                vscode.window.showInformationMessage(
                    `Deleted temporary GitHub extracted folder.`
                );
            }
        } catch (cleanupErr) {
            vscode.window.showWarningMessage(
                `Warning: Failed to clean up temporary files: ${cleanupErr.message}`
            );
            // Continue anyway since the assets are already copied
        }

        return true;
    } catch (err) {
        vscode.window.showErrorMessage(
            `Error processing GitHub assets: ${err.message}`
        );

        // Attempt to clean up even on error
        try {
            if (zipPath && fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
            }

            if (extractPath && fs.existsSync(extractPath)) {
                fs.rmSync(extractPath, { recursive: true, force: true });
            }
        } catch (cleanupErr) {
            // Just log, don't throw additional errors during cleanup
            console.error('Error during cleanup:', cleanupErr);
        }

        return false;
    }
}

// Helper to follow redirects
const downloadZipWithRedirect = (url, dest) => {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode === 302 && res.headers.location) {
                    https
                        .get(res.headers.location, (res2) => {
                            if (res2.statusCode !== 200) {
                                reject(
                                    new Error(
                                        `Failed to download repo zip: ${res2.statusCode}`
                                    )
                                );
                                return;
                            }
                            const file = fs.createWriteStream(dest);
                            res2.pipe(file);
                            file.on('finish', () => file.close(resolve));
                            file.on('error', reject);
                        })
                        .on('error', reject);
                } else if (res.statusCode === 200) {
                    const file = fs.createWriteStream(dest);
                    res.pipe(file);
                    file.on('finish', () => file.close(resolve));
                    file.on('error', reject);
                } else {
                    reject(
                        new Error(
                            `Failed to download repo zip: ${res.statusCode}`
                        )
                    );
                }
            })
            .on('error', reject);
    });
};
