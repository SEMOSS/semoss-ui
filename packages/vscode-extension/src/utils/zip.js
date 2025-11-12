const vscode = require("vscode");
const fs = require("node:fs");
const path = require("node:path");
const archiver = require("archiver");
const { promisify } = require("node:util");

// Constants
const MAX_SEARCH_DEPTH = 5;

// Convert callback-based fs methods to Promise-based versions when needed
const fsExists = promisify(fs.exists);
const fsLstat = promisify(fs.lstat);
const fsReaddir = promisify(fs.readdir);

/**
 * Recursively finds a folder with the specified name in the given directory
 * @param {string} startPath - Directory to start searching from
 * @param {string} folderName - Name of the folder to find
 * @param {number} maxDepth - Maximum depth to search (prevent infinite recursion)
 * @returns {Promise<string|null>} - Path to the found folder or null if not found
 */
async function findFolderRecursive(
	startPath,
	folderName,
	maxDepth = MAX_SEARCH_DEPTH,
) {
	try {
		if (maxDepth <= 0) return null;

		const exists = await fsExists(startPath);
		if (!exists) return null;

		const files = await fsReaddir(startPath);

		// First check immediate children (faster search for common case)
		const directMatch = files.find((file) => file === folderName);
		if (directMatch) {
			return path.join(startPath, directMatch);
		}

		// Then search recursively
		for (const file of files) {
			const filename = path.join(startPath, file);
			try {
				const stat = await fsLstat(filename);

				if (stat.isDirectory()) {
					const found = await findFolderRecursive(
						filename,
						folderName,
						maxDepth - 1,
					);
					if (found) return found;
				}
			} catch (_error) {}
		}
	} catch (error) {
		console.error(`Error searching directory ${startPath}:`, error);
	}

	return null;
}

/**
 * Zip the parent folder of portals folder as parentfolder.zip
 * If portals folder isn't found, falls back to assets folder if it exists
 * Automatically uses the current workspace folder as the base
 * @returns {Promise<string>} Path to the created zip file
 */
async function zipProject(baseFolder, progressCallback) {
	return vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "Zipping Project Folder",
			cancellable: false,
		},
		async (progress) => {
			try {
				progress.report({
					increment: 0,
					message: "Determining project folder...",
				});
				progressCallback?.("Determining project folder...");

				// Determine the base folder path
				let folderPath = baseFolder;
				if (!folderPath) {
					const folders = vscode.workspace.workspaceFolders;
					if (!folders || folders.length === 0) {
						throw new Error(
							"No workspace folder open and no folder path provided.",
						);
					}
					folderPath = folders[0].uri.fsPath;
				}

				// First, try to find the portals folder
				progress.report({
					increment: 20,
					message: "Finding portals folder...",
				});
				progressCallback?.("Searching for portals folder...");
				const portalsFolder = await findFolderRecursive(
					folderPath,
					"portals",
				);

				let folderToZip;
				let zipFolderName;

				if (portalsFolder) {
					// Use the parent directory of the portals folder
					folderToZip = path.dirname(portalsFolder);
					zipFolderName = path.basename(folderToZip);
					progress.report({
						increment: 20,
						message: `Found portals in ${zipFolderName}`,
					});
					progressCallback?.(`Found portals in ${zipFolderName}`);
				} else {
					// Fallback to assets folder if it exists
					progress.report({
						increment: 20,
						message: "Looking for assets folder...",
					});
					progressCallback?.("Looking for assets folder...");
					const assetsFolder = path.join(folderPath, "assets");

					const assetsExists = await fsExists(assetsFolder);
					if (assetsExists) {
						const stats = await fsLstat(assetsFolder);
						if (stats.isDirectory()) {
							folderToZip = assetsFolder;
							zipFolderName = "assets";
							progress.report({
								increment: 0,
								message: "Using assets folder",
							});
							progressCallback?.("Using assets folder");
						} else {
							throw new Error(
								"Assets exists but is not a directory.",
							);
						}
					} else {
						throw new Error(
							"No portals folder or assets folder found in the project.",
						);
					}
				}

				// Output zip in the parent directory with the folder name
				const zipFileName = `${zipFolderName}.zip`;
				const outputFilePath = path.join(folderPath, zipFileName);
				progress.report({
					increment: 20,
					message: `Creating ${zipFileName}...`,
				});
				progressCallback?.(`Creating ${zipFileName}...`);

				// Create zip file
				await new Promise((resolve, reject) => {
					// Create a file to stream archive data to
					const writeStream = fs.createWriteStream(outputFilePath);
					const archive = archiver("zip", {});

					// Handle any errors that occur
					archive.on("error", (err) => {
						vscode.window.showErrorMessage(
							"Failed to create archive",
						);
						reject(err);
					});

					// Pipe archive data to the file
					archive.pipe(writeStream);

					// Append files, excluding unwanted files and directories
					archive.glob("**/*", {
						cwd: folderToZip,
						dot: true,
						ignore: [
							"client/node_modules/**",
							".DS_Store",
							"__MACOSX",
							"*.zip",
						],
					});

					// Finalize the archive
					archive.finalize();

					// Listen for all archive data to be written
					writeStream.on("finish", () => {
						progress.report({
							increment: 40,
							message: "Zip completed!",
						});
						progressCallback?.("Zip completed!");
						resolve(outputFilePath);
					});

					writeStream.on("error", (err) => {
						vscode.window.showErrorMessage(
							"Failed to write zip file",
						);
						reject(err);
					});
				});

				vscode.window.showInformationMessage(
					`${zipFolderName} folder zipped as ${zipFileName} successfully!`,
				);
				progressCallback?.(
					`${zipFolderName} folder zipped as ${zipFileName} successfully!`,
				);
				return outputFilePath;
			} catch (error) {
				vscode.window.showErrorMessage(`Zip error: ${error.message}`);
				progressCallback?.(`Zip error: ${error.message}`);
				throw error;
			}
		},
	);
}

/**
 * Find a folder by name in the workspace
 * Exported for potential use by other modules
 */
module.exports = {
	zipProject,
	findFolderRecursive,
};
