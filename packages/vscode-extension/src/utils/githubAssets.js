const fetch = require("node-fetch");
const fs = require("node:fs");
const https = require("node:https");
const ncp = require("ncp");
const StreamZip = require("node-stream-zip");
const path = require("path");
const vscode = require("vscode");

/**
 * Downloads and extracts assets from a GitHub repository
 *
 * @param {string} githubLink - GitHub repository link
 * @param {string} downloadsDir - Directory to download files to
 * @param {string} appName - Name of the app being created
 * @param {string} unzipDir - Directory where the SEMOSS app was unzipped
 * @param {boolean} isPrivateRepo - Whether the repository is private
 * @param {string} accessToken - GitHub access token for private repositories
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function processGithubAssets(
	githubLink,
	downloadsDir,
	appName,
	unzipDir,
	isPrivateRepo = false,
	accessToken = "",
) {
	if (!githubLink) return false;

	let zipPath = "";
	let extractPath = "";

	try {
		// Parse GitHub link - handles URLs with or without protocol
		const match = githubLink.match(
			/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)\/(.+))?/,
		);
		if (!match) {
			throw new Error(
				"Invalid GitHub link format. Expected format: github.com/user/repo",
			);
		}

		const owner = match[1];
		const repo = match[2];
		const branch = match[3] || "main";
		const folderPath = match[4] || "";

		// Get default branch if not specified
		let usedBranch = branch;
		if (!match[3]) {
			try {
				const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
				const headers = { "User-Agent": "node.js" };

				// Add authorization header for private repositories OR if we have a token
				if (
					(isPrivateRepo && accessToken) ||
					accessToken?.startsWith("ghp_")
				) {
					headers.Authorization = `token ${accessToken}`;
				}

				const res = await fetch(apiUrl, { headers });
				const data = await res.json();
				usedBranch = data.default_branch;
			} catch (apiError) {
				if (apiError.response?.status === 404) {
					throw new Error(
						`Repository not found: ${owner}/${repo}. Please check the URL and access permissions.`,
					);
				} else if (apiError.response?.status === 401) {
					throw new Error(
						`Unauthorized access to ${owner}/${repo}. Please check your access token.`,
					);
				} else {
					// If API call fails, try with default branch
					usedBranch = "main";
					vscode.window.showWarningMessage(
						`Could not fetch repository info, using default branch: ${usedBranch}`,
					);
				}
			}
		}

		// For private repositories, use the GitHub API zipball URL instead of the public archive URL
		let zipUrl;
		const shouldUsePrivateUrl = Boolean(accessToken);

		if (shouldUsePrivateUrl) {
			// Use the same format as your working PowerShell command
			zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${usedBranch}`;
		} else {
			zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${usedBranch}.zip`;
		}
		fs.mkdirSync(downloadsDir, { recursive: true });
		zipPath = path.join(downloadsDir, `${appName}_github.zip`);
		extractPath = path.join(
			downloadsDir,
			`${appName}_github_unzipped_${Date.now()}`,
		);

		vscode.window.showInformationMessage(
			`Downloading ${isPrivateRepo ? "private" : "public"} repository from GitHub...`,
		);

		// Download GitHub repo - Always use downloadPrivateRepo for private repos
		// Temporary workaround: If we have an access token but isPrivateRepo is false, force private repo logic
		const shouldUsePrivateLogic =
			(isPrivateRepo && accessToken) ||
			(!isPrivateRepo && accessToken && accessToken.startsWith("ghp_"));

		if (shouldUsePrivateLogic) {
			await downloadPrivateRepo(zipUrl, zipPath, accessToken);
		} else {
			await downloadZipWithRedirect(zipUrl, zipPath, null);
		}

		// Verify the download was successful before proceeding
		if (!fs.existsSync(zipPath)) {
			throw new Error(
				"Repository download failed: ZIP file was not created",
			);
		}

		const stats = fs.statSync(zipPath);
		if (stats.size === 0) {
			throw new Error("Repository download failed: ZIP file is empty");
		}

		vscode.window.showInformationMessage(
			`Repository downloaded successfully. File size: ${stats.size} bytes`,
		);

		// Unzip GitHub repo using node-stream-zip
		const zip = new StreamZip.async({ file: zipPath });
		await zip.extract(null, extractPath); // Extract all files
		await zip.close();

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
				`The specified path (${folderPath || "repository root"}) does not exist in the repo.`,
			);
		}

		// Copy assets to the app
		const assetsDir = path.join(unzipDir, "assets");

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
			`Successfully copied assets from GitHub repository.`,
		);

		// Clean up: delete the zip file and extracted folder
		try {
			if (fs.existsSync(zipPath)) {
				fs.unlinkSync(zipPath);
				vscode.window.showInformationMessage(
					`Deleted temporary GitHub zip file.`,
				);
			}

			if (fs.existsSync(extractPath)) {
				fs.rmSync(extractPath, { recursive: true, force: true });
				vscode.window.showInformationMessage(
					`Deleted temporary GitHub extracted folder.`,
				);
			}
		} catch (cleanupErr) {
			vscode.window.showWarningMessage(
				`Warning: Failed to clean up temporary files: ${cleanupErr.message}`,
			);
			// Continue anyway since the assets are already copied
		}

		return true;
	} catch (err) {
		vscode.window.showErrorMessage(
			`Error processing GitHub assets: ${err.message}`,
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
			console.error("Error during cleanup:", cleanupErr);
		}

		return false;
	}
}

// Helper to download private repositories using fetch
const downloadPrivateRepo = async (url, dest, accessToken) => {
	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `token ${accessToken}`,
				"User-Agent": "node.js",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const writer = fs.createWriteStream(dest);
		response.body.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on("finish", () => {
				resolve();
			});
			writer.on("error", reject);
			response.body.on("error", reject);
		});
	} catch (error) {
		const status = error.response?.status || "unknown";
		const statusText = error.response?.statusText || error.message;
		vscode.window.showErrorMessage(
			`Download failed - Status: ${status}, Message: ${statusText}`,
		);
		throw new Error(
			`Failed to download private repository: ${status} - ${statusText}`,
		);
	}
};

// Helper to follow redirects
const downloadZipWithRedirect = (url, dest, accessToken = null) => {
	return new Promise((resolve, reject) => {
		const headers = {};

		// Add authorization header for private repositories
		if (accessToken) {
			headers["Authorization"] = `token ${accessToken}`;
			headers["User-Agent"] = "node.js";
		}

		https
			.get(url, { headers }, (res) => {
				if (
					[301, 302, 303, 307, 308].includes(res.statusCode) &&
					res.headers.location
				) {
					// For redirects, preserve the authorization header if present
					https
						.get(res.headers.location, { headers }, (res2) => {
							if (res2.statusCode !== 200) {
								reject(
									new Error(
										`Failed to download repo zip: ${res2.statusCode}`,
									),
								);
								return;
							}
							const file = fs.createWriteStream(dest);
							res2.pipe(file);
							file.on("finish", () => file.close(resolve));
							file.on("error", reject);
						})
						.on("error", reject);
				} else if (res.statusCode === 200) {
					const file = fs.createWriteStream(dest);
					res.pipe(file);
					file.on("finish", () => file.close(resolve));
					file.on("error", reject);
				} else {
					vscode.window.showErrorMessage(
						`Download failed with status: ${res.statusCode} for URL: ${url}`,
					);
					reject(
						new Error(
							`Failed to download repo zip: ${res.statusCode}`,
						),
					);
				}
			})
			.on("error", reject);
	});
};

module.exports = { processGithubAssets };
