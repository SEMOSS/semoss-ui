import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import archiver from "archiver";

/**
 * Zip only the assets folder as assets.zip in its parent directory
 * Automatically uses the current workspace folder as the base
 * @returns {Promise<void>}
 */
export async function zipProject() {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Zipping Assets Folder",
        cancellable: false
    }, async () => {
        // Get the current workspace folder
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open.');
            throw new Error('No workspace folder open.');
        }
        const folderPath = folders[0].uri.fsPath;

        // Path to the assets folder
        const assetsFolder = path.join(folderPath, 'assets');
        if (!fs.existsSync(assetsFolder) || !fs.lstatSync(assetsFolder).isDirectory()) {
            vscode.window.showErrorMessage('No assets folder found in the workspace folder.');
            throw new Error('No assets folder found.');
        }

        // Output zip in the parent directory as assets.zip
        const outputFilePath = path.join(folderPath, 'assets.zip');

        // Create a file to stream archive data to
        const writeStream = fs.createWriteStream(outputFilePath);
        const archive = archiver('zip', {});

        archive.on('error', (err) => {
            vscode.window.showErrorMessage('Failed to create archive');
            throw err;
        });

        archive.pipe(writeStream);

        // Add the assets folder only (single assets folder at top level)
        archive.directory(assetsFolder, false);

        await archive.finalize();

        // Wait for the write stream to finish
        await new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                vscode.window.showInformationMessage(`Assets folder zipped as assets.zip successfully!`);
                resolve();
            });
            writeStream.on('error', (err) => {
                vscode.window.showErrorMessage('Failed to write zip file');
                reject(err);
            });
        });
    });
}
