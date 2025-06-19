const fs = require("fs");
const path = require('path');

let assetsFolderPath = "";
let outputFilePath = "";

/**
 * Set folder paths based on the provided URI
 * @param {vscode.Uri} uri - The URI from the context menu
 */
function setFolderPaths(uri) {
    assetsFolderPath = uri.fsPath.replace(/\\client|\/client|\\py|\/py|\\portals|\/portals/g, "");
    const projectName = path.basename(assetsFolderPath);
    outputFilePath = path.join(assetsFolderPath, `${projectName}.zip`);
}

/**
 * Get the project ID from the smss file
 * @returns {string} The project ID
 */
function getProjectId() {
    let projectId = "";
    const projectFolderPath = assetsFolderPath.replace(/\\assets|\/assets/g, "");
    const smssFile = fs.readdirSync(projectFolderPath).find((file) => file.endsWith('.smss'));

    if (!smssFile) {
        throw new Error('No .smss file found in the project folder');
    }

    const smssContent = fs.readFileSync(path.join(projectFolderPath, smssFile), 'utf8');
    const projectLines = smssContent.split('\n');
    
    projectLines.forEach((line) => {
        if (line.startsWith('PROJECT\t')) {
            projectId = line.split('\t')[1];
        }
    });
    
    return projectId;
}

/**
 * Get the assets folder path
 * @returns {string} The assets folder path
 */
function getAssetsFolderPath() {
    return assetsFolderPath;
}

/**
 * Get the output file path
 * @returns {string} The output file path
 */
function getOutputFilePath() {
    return outputFilePath;
}

module.exports = {
    setFolderPaths,
    getProjectId,
    getAssetsFolderPath,
    getOutputFilePath
};
