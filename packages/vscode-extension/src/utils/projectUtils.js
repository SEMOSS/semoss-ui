// Converted to CommonJS for consistency with rest of extension runtime
const fs = require("node:fs");
const path = require("node:path");

let assetsFolderPath = "";
let outputFilePath = "";

/**
 * Set folder paths based on the provided URI
 * @param {vscode.Uri} uri - The URI from the context menu
 */
function setFolderPaths(uri) {
	if (!uri || !uri.fsPath) {
		throw new Error("Invalid URI passed to setFolderPaths");
	}
	// Remove trailing recognized subdirectories (client/py/portals) to get root
	assetsFolderPath = uri.fsPath.replace(
		/\\client|\/client|\\py|\/py|\\portals|\/portals/g,
		"",
	);
	if (!fs.existsSync(assetsFolderPath)) {
		throw new Error(
			`Resolved assets folder does not exist: ${assetsFolderPath}`,
		);
	}
	const projectName = path.basename(assetsFolderPath);
	outputFilePath = path.join(assetsFolderPath, `${projectName}.zip`);
	return { assetsFolderPath, outputFilePath };
}

/**
 * Get the project ID from the smss file
 * @returns {string} The project ID
 */
function getProjectId() {
	// Guard: ensure paths set
	if (!assetsFolderPath) {
		throw new Error(
			"Assets folder path not initialized. Call setFolderPaths first.",
		);
	}
	const projectFolderPath = assetsFolderPath.replace(
		/\\assets|\/assets/g,
		"",
	);
	if (!fs.existsSync(projectFolderPath)) {
		throw new Error(`Project folder does not exist: ${projectFolderPath}`);
	}
	const smssFile = fs
		.readdirSync(projectFolderPath)
		.find((f) => f.endsWith(".smss"));
	if (!smssFile) {
		throw new Error(
			`No .smss file found in project folder: ${projectFolderPath}`,
		);
	}
	const smssContent = fs.readFileSync(
		path.join(projectFolderPath, smssFile),
		"utf8",
	);
	const projectLines = smssContent.split(/\r?\n/);
	const projectLine = projectLines.find((l) => l.startsWith("PROJECT\t"));
	if (!projectLine) {
		throw new Error(`PROJECT line not found in smss file: ${smssFile}`);
	}
	const parts = projectLine.split("\t");
	if (parts.length < 2 || !parts[1]) {
		throw new Error(`Malformed PROJECT line in smss file: ${projectLine}`);
	}
	return parts[1].trim();
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
	getOutputFilePath,
};
