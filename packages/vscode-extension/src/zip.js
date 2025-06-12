const vscode = require("vscode");
const fs = require("fs");
const archiver = require('archiver');
const { getAssetsFolderPath, getOutputFilePath } = require('./projectUtils');

/**
 * Zip the project files
 * @returns {Promise<void>}
 */
async function zipProject() {
    return new Promise((resolve, reject) => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Zipping Project",
            cancellable: false
        }, async () => {
            const assetsFolderPath = getAssetsFolderPath();
            const outputFilePath = getOutputFilePath();
            
            // Create a file to stream archive data to
            const writeStream = fs.createWriteStream(outputFilePath);
            const archive = archiver('zip', {});

            // Handle any errors that occur
            archive.on('error', (err) => {
                vscode.window.showErrorMessage('Failed to create archive');
                reject(err);
            });

            // Pipe archive data to the file
            archive.pipe(writeStream);

            // Append files, excluding `node_modules`
            archive.glob('**/*', {
                cwd: assetsFolderPath,
                dot: true,
                ignore: ['client/node_modules/**', '.DS_Store', '__MACOSX', '*.zip']
            });

            // Finalize the archive
            await archive.finalize();

            // Listen for all archive data to be written
            writeStream.on('finish', () => {
                vscode.window.showInformationMessage('Project zipped successfully!');
                resolve();
            });

            writeStream.on('error', (err) => {
                vscode.window.showErrorMessage('Failed to write zip file');
                reject(err);
            });
        });
    });
}

module.exports = {
    zipProject
};
