import { Command, Flags } from "@oclif/core";
import AdmZip from "adm-zip";
import { config } from "dotenv";
import { glob } from "glob";
import Listr from "listr";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { Env, Insight, upload } from "@semoss/sdk";
import {
	getBatchConfig,
	initializeAndTestInsight,
	logWithTiming,
	shouldLog,
} from "../utils/index.js";

const DEFAULT_IGNORE = [
	"node_modules/**",
	"**/.git/**",
	"**/*.local",
	"client/**",
	"**/package.json",
	"**/package-lock.json",
	"**/pnpm-lock.yaml",
	"**/vite.config.ts",
	"**/vite.config.js",
	"**/vite-env.d.ts",
	"**/vitest.config.ts",
	"**/vitest.config.js",
	"**/tsconfig.json",
	"**/components.json",
	"target/**",
	"test_classes/**",
	"classes/**",
];

export default class Deploy extends Command {
	static args = {};

	static description = "Deploy an existing app";

	static examples = [
		`<%= config.bin %> <%= command.id %>
deploy (./src/commands/deploy.ts)
`,
		`<%= config.bin %> <%= command.id %> --target java
deploy only java folder
`,
		`<%= config.bin %> <%= command.id %> --target java --target py
deploy java and python folders
`,
	];

	static flags = {
		// environment variables
		env: Flags.string({
			char: "e",
			description: "Path to the environment variables. Default is .env",
		}),
		// config
		config: Flags.string({
			char: "c",
			description: "Path to the configuration. Default is smss.json",
		}),
		// log level flag
		logLevel: Flags.string({
			char: "l",
			description:
				"Set log verbosity: silent, normal, verbose, debug (default: normal)",
			options: ["silent", "normal", "verbose", "debug"],
			default: "normal",
		}),
		// breakpoint flag
		breakpoint: Flags.boolean({
			char: "b",
			description: "Add debugger breakpoint for debugging",
		}),
		// target deployment flag
		target: Flags.string({
			char: "t",
			description:
				"Target directory to deploy (e.g., 'java', 'python'). Can be specified multiple times.",
			multiple: true,
		}),
		// dry-run flag
		dryRun: Flags.boolean({
			description: "Preview deployment without actually deploying",
		}),
		// rollback flag
		rollback: Flags.boolean({
			char: "r",
			description: "Rollback to previous deployment",
		}),
		// batch flag
		batch: Flags.string({
			char: "B",
			description:
				"Deploy to multiple instances via batch config in smss.json. Use 'all' or comma-separated names (e.g., 'dev,prod')",
		}),
		// backup flag
		backup: Flags.boolean({
			description:
				"Create a server backup before deploying. Use --no-backup to skip.",
			default: true,
			allowNo: true,
		}),
		// backup retention flag
		backupRetention: Flags.integer({
			description:
				"Number of backups to keep. Older backups are auto-pruned. Set to 0 to keep all.",
			default: 5,
		}),
	};

	private async loadConfig(
		configPath?: string,
	): Promise<Record<string, unknown> | null> {
		const resolvedPath = configPath || "smss.json";

		try {
			const content = await fs.promises.readFile(resolvedPath, "utf-8");
			return JSON.parse(content);
		} catch {
			return null;
		}
	}

	/**
	 * Download a file using Node.js http/https
	 * Similar to VSCode extension approach
	 */
	private async downloadWithHttp(
		downloadUrl: string,
		accessKey: string,
		secretKey: string,
		debugMode: boolean = false,
	): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			if (debugMode) {
				this.log(`📡 Downloading via HTTP(S): ${downloadUrl}`);
			}

			try {
				const parsedUrl = new URL(downloadUrl);
				const protocol = parsedUrl.protocol === "https:" ? https : http;

				// Create Basic auth header
				const credentials = Buffer.from(
					`${accessKey}:${secretKey}`,
				).toString("base64");

				const options = {
					hostname: parsedUrl.hostname,
					port:
						parsedUrl.port ||
						(parsedUrl.protocol === "https:" ? 443 : 80),
					path: parsedUrl.pathname + parsedUrl.search,
					method: "GET",
					headers: {
						Authorization: `Basic ${credentials}`,
					},
				};

				const req = protocol.request(options, (response) => {
					if (debugMode) {
						this.log(
							`📡 HTTP Response received - Status: ${response.statusCode}, Headers: ${JSON.stringify(response.headers)}`,
						);
					}

					if (response.statusCode !== 200) {
						const errorMsg = `Download failed with status code: ${response.statusCode}`;

						const chunks: Buffer[] = [];
						response.on("data", (chunk: Buffer) => {
							chunks.push(chunk);
						});
						response.on("end", () => {
							const responseBody = Buffer.concat(
								chunks as Uint8Array[],
							).toString("utf-8");
							if (debugMode) {
								this.log(`\n${"`".repeat(80)}`);
								this.log(
									`📋 ERROR RESPONSE (${responseBody.length} bytes):`,
								);
								this.log(`${"=".repeat(80)}`);
								this.log(responseBody);
								this.log(`${"=".repeat(80)}\n`);
							}
							reject(new Error(errorMsg));
						});
						return;
					}

					const chunks: Buffer[] = [];

					response.on("data", (chunk: Buffer) => {
						chunks.push(chunk);
					});

					response.on("end", () => {
						const buffer = Buffer.concat(chunks as Uint8Array[]);
						if (debugMode) {
							this.log(`📦 Downloaded ${buffer.length} bytes`);
							const firstBytes = buffer
								.slice(0, 4)
								.toString("hex");
							this.log(
								`📥 First 4 bytes (hex): ${firstBytes} (should start with "504b" for zip)`,
							);
						}

						resolve(
							(buffer.buffer as ArrayBuffer).slice(
								buffer.byteOffset,
								buffer.byteOffset + buffer.byteLength,
							),
						);
					});

					response.on("error", (err) => {
						reject(err);
					});
				});

				req.on("error", (err) => {
					if (debugMode) {
						this.log(`❌ HTTP Request Error: ${err.message}`);
					}
					reject(err);
				});

				req.end();
			} catch (err) {
				reject(err);
			}
		});
	}

	private async createBackup(
		deployTargets: string[] | "all",
		insight: Insight,
		debugMode: boolean = false,
		opts: {
			app?: string;
			module?: string;
			accessKey?: string;
			secretKey?: string;
			endpoint?: string;
		},
	): Promise<{ backupDir: string; backupZipPath: string }> {
		const backupBaseDir = ".semoss-backups";
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const targetStr =
			deployTargets === "all"
				? "full"
				: (deployTargets as string[]).join("-");
		const backupDir = path.join(backupBaseDir, `${targetStr}-${timestamp}`);
		const tempDir = path.join(backupBaseDir, `temp-${timestamp}`);

		try {
			await fs.promises.mkdir(backupDir, { recursive: true });
			await fs.promises.mkdir(tempDir, { recursive: true });

			// Export the project using the ExportProjectApp reactor
			if (debugMode) {
				this.log(
					`🔍 Before ExportProjectApp - insight.insightId: ${insight.insightId}`,
				);
			}

			const { pixelReturn } = await insight.actions.run<[string]>(
				`ExportProjectApp(project=['${opts.app}']);`,
			);

			if (debugMode) {
				this.log(
					`📦 ExportProjectApp response: ${JSON.stringify(pixelReturn[0])}`,
				);
			}

			// Call download to get the exported zip file
			const { operationType, output } = pixelReturn[0];

			if (operationType?.includes("FILE_DOWNLOAD")) {
				// Build the download URL
				const downloadUrl = `${
					opts.module
				}/api/engine/downloadFile?insightId=${insight.insightId}&fileKey=${encodeURIComponent(
					output,
				)}`;

				// Download using http/https (Node.js approach)
				let downloadResult: ArrayBuffer;
				try {
					downloadResult = await this.downloadWithHttp(
						downloadUrl,
						opts.accessKey || "",
						opts.secretKey || "",
						debugMode,
					);
				} catch (downloadError) {
					throw new Error(
						`HTTP download failed: ${downloadError}. Make sure the server endpoint is accessible.`,
					);
				}

				if (!downloadResult || downloadResult.byteLength === 0) {
					throw new Error(
						"Download returned empty result. This might indicate the server response was not a valid zip file.",
					);
				}

				if (debugMode) {
					this.log(`📥 Download result is ArrayBuffer: true`);
					this.log(
						`📥 Download result length: ${downloadResult.byteLength}`,
					);
				}

				// Convert to Buffer for AdmZip
				const zipBuffer = Buffer.from(downloadResult);

				if (debugMode) {
					this.log(
						`📥 Converted to Buffer, size: ${zipBuffer.length} bytes`,
					);
					// Log first few bytes to verify it's a zip (should start with 504B)
					const firstFewBytes = zipBuffer.slice(0, 4).toString("hex");
					this.log(
						`📥 First 4 bytes (hex): ${firstFewBytes} (should start with "504b")`,
					);
				}

				// Validate it's a zip file
				if (zipBuffer.length === 0) {
					throw new Error("Downloaded file is empty");
				}

				const fileSignature = zipBuffer.slice(0, 2).toString("hex");
				if (fileSignature !== "504b") {
					this.log(`❌ Not a valid ZIP file!`);
					this.log(
						`📄 File signature: ${fileSignature} (expected "504b")`,
					);
					const content = zipBuffer.toString("utf-8");

					// Log the entire content in a clear section
					this.log(`\n${"=".repeat(80)}`);
					this.log(
						`📋 FULL SERVER RESPONSE (${zipBuffer.length} bytes):`,
					);
					this.log(`${"=".repeat(80)}`);
					this.log(content);
					this.log(`${"=".repeat(80)}\n`);

					// Check if it's HTML error response
					if (
						content.includes("<!DOCTYPE") ||
						content.includes("<html")
					) {
						this.log(
							`ℹ️  Server returned HTML page (possibly a redirect or error page).`,
						);
						throw new Error(
							`Server returned HTML instead of zip file. This might be a redirect or authentication error. Check the response printed above.`,
						);
					}

					throw new Error(
						`Downloaded content is not a valid zip file. Got signature: ${fileSignature}. Expected "504b" for zip files. See response above.`,
					);
				}

				// Extract the zip from the buffer
				try {
					const zip = new AdmZip(zipBuffer);
					zip.extractAllTo(tempDir, true);

					if (debugMode) {
						this.log(
							`✅ Successfully extracted zip to temp directory`,
						);
					}
				} catch (zipError) {
					throw new Error(
						`Failed to extract zip: ${zipError}. Buffer size: ${zipBuffer.length} bytes, Signature: ${fileSignature}`,
					);
				}
			} else {
				throw new Error(
					"ExportProjectApp did not return a FILE_DOWNLOAD operation",
				);
			}

			// Search for the assets folder in the extracted directory
			// The exported zip structure has assets folder directly at the root
			let assetsSource: string | undefined;

			// List directories in temp and find the assets folder
			const entries = await fs.promises.readdir(tempDir, {
				withFileTypes: true,
			});

			// Look for 'assets' folder directly
			for (const entry of entries) {
				if (entry.isDirectory() && entry.name === "assets") {
					assetsSource = path.join(tempDir, "assets");

					if (debugMode) {
						const assetFiles =
							await fs.promises.readdir(assetsSource);
						this.log(
							`📦 Found assets folder with ${assetFiles.length} items`,
						);
					}
					break;
				}
			}

			if (!assetsSource) {
				console.log(`❌ NO ASSETS FOLDER FOUND IN EXTRACTED ZIP`);
			}

			// Create the backup zip directly from the extracted assets folder
			const backupZip = new AdmZip();
			const backupZipPath = path.join(backupDir, "backup.zip");

			if (assetsSource) {
				try {
					backupZip.addLocalFolder(assetsSource, "");

					this.log(`📦 Added assets to backup.zip at root level`);
				} catch (error) {
					// Assets folder couldn't be added
					if (debugMode) {
						this.log(
							`⚠️ Failed to add assets to backup.zip: ${error}`,
						);
					}
				}
			} else {
				console.log(`❌ No assets folder found to backup`);
			}

			backupZip.writeZip(backupZipPath);

			if (debugMode) {
				const backupStats = await fs.promises.stat(backupZipPath);
				this.log(
					`✅ Backup created: ${backupZipPath} (${backupStats.size} bytes)`,
				);
			}

			// Create metadata file
			await fs.promises.writeFile(
				path.join(backupDir, "metadata.json"),
				JSON.stringify(
					{
						timestamp,
						targets: deployTargets,
						app: opts.app,
						module: opts.module,
						backed_up_from_server: true,
					},
					null,
					2,
				),
			);

			// Clean up temp directory
			await fs.promises.rm(tempDir, { recursive: true, force: true });

			return { backupDir, backupZipPath };
		} catch (error) {
			// Clean up temp directory on error
			try {
				await fs.promises.rm(tempDir, { recursive: true, force: true });
			} catch {
				// Ignore cleanup errors
			}

			throw new Error(`Failed to create backup: ${error}`);
		}
	}

	/**
	 * Prune old backups to keep only the most recent N.
	 */
	private async pruneBackups(
		retention: number,
		verbose: boolean = false,
	): Promise<void> {
		const backupBaseDir = ".semoss-backups";

		try {
			const entries = await fs.promises.readdir(backupBaseDir, {
				withFileTypes: true,
			});

			const backupDirs: { name: string; timestamp: string }[] = [];

			for (const entry of entries) {
				if (!entry.isDirectory() || entry.name.startsWith("temp-")) {
					continue;
				}

				const dirPath = path.join(backupBaseDir, entry.name);

				// Only consider directories that have a backup.zip
				try {
					await fs.promises.access(path.join(dirPath, "backup.zip"));
				} catch {
					continue;
				}

				// Try to get timestamp from metadata, fall back to dir name
				let timestamp = entry.name;
				try {
					const meta = JSON.parse(
						await fs.promises.readFile(
							path.join(dirPath, "metadata.json"),
							"utf-8",
						),
					);
					if (meta.timestamp) {
						timestamp = meta.timestamp;
					}
				} catch {
					// Use directory name
				}

				backupDirs.push({ name: entry.name, timestamp });
			}

			if (backupDirs.length <= retention) {
				return; // Nothing to prune
			}

			// Sort by timestamp descending (newest first)
			backupDirs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

			// Remove everything after the retention limit
			const toRemove = backupDirs.slice(retention);

			for (const backup of toRemove) {
				const dirPath = path.join(backupBaseDir, backup.name);
				await fs.promises.rm(dirPath, { recursive: true, force: true });

				if (verbose) {
					this.log(`🗑️  Pruned old backup: ${backup.name}`);
				}
			}

			if (verbose && toRemove.length > 0) {
				this.log(
					`📋 Kept ${retention} backup(s), pruned ${toRemove.length}`,
				);
			}
		} catch {
			// Don't fail if pruning encounters issues
		}
	}

	private async logDeploymentHistory(deployRecord: {
		timestamp: string;
		targets: string[] | "all";
		status: "success" | "failure" | "dry-run";
		zipSize?: number;
		duration?: number;
		backupDir?: string;
		rollback?: boolean;
		app?: string;
		module?: string;
	}): Promise<void> {
		const historyFile = ".semoss-deployments";

		try {
			let history: unknown[] = [];

			// Load existing history if file exists
			try {
				const content = await fs.promises.readFile(
					historyFile,
					"utf-8",
				);
				history = JSON.parse(content);
			} catch {
				// File doesn't exist yet, start with empty array
			}

			// Add new record
			history.push({
				...deployRecord,
			});

			// Keep only last 20 deployments
			if (history.length > 20) {
				history = history.slice(-20);
			}

			// Write updated history
			await fs.promises.writeFile(
				historyFile,
				JSON.stringify(history, null, 2),
			);
		} catch (error) {
			// Don't fail deployment if history logging fails
			console.warn(`Failed to log deployment history: ${error}`);
		}
	}

	private async rollbackToPrevious(): Promise<string> {
		const historyFile = ".semoss-deployments";
		const backupBaseDir = ".semoss-backups";

		// 1. Try the history file first (fast path)
		try {
			const content = await fs.promises.readFile(historyFile, "utf-8");
			const history = JSON.parse(content) as Array<{
				backupDir?: string;
				status: string;
				timestamp: string;
			}>;

			const backupRecord = history
				.reverse()
				.find(
					(record) =>
						record.status === "success" &&
						record.backupDir &&
						record.backupDir !== null,
				);

			if (backupRecord?.backupDir) {
				// Verify the backup directory and zip actually exist
				const zipPath = path.join(backupRecord.backupDir, "backup.zip");
				try {
					await fs.promises.access(zipPath);
					return backupRecord.backupDir;
				} catch {
					// Backup dir from history is gone, fall through to directory scan
				}
			}
		} catch {
			// History file missing or unreadable, fall through to directory scan
		}

		// 2. Fallback: scan .semoss-backups/ for valid backup directories
		try {
			const entries = await fs.promises.readdir(backupBaseDir, {
				withFileTypes: true,
			});

			const validBackups: { dir: string; timestamp: string }[] = [];

			for (const entry of entries) {
				if (!entry.isDirectory() || entry.name.startsWith("temp-")) {
					continue;
				}

				const dirPath = path.join(backupBaseDir, entry.name);
				const zipPath = path.join(dirPath, "backup.zip");

				try {
					await fs.promises.access(zipPath);
				} catch {
					continue; // No backup.zip, skip
				}

				// Try to read metadata for timestamp, fall back to dir name
				let timestamp = entry.name;
				try {
					const meta = JSON.parse(
						await fs.promises.readFile(
							path.join(dirPath, "metadata.json"),
							"utf-8",
						),
					);
					if (meta.timestamp) {
						timestamp = meta.timestamp;
					}
				} catch {
					// Use directory name for sorting
				}

				validBackups.push({ dir: dirPath, timestamp });
			}

			if (validBackups.length === 0) {
				throw new Error("No previous deployment found for rollback.");
			}

			// Sort by timestamp descending and return the most recent
			validBackups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
			return validBackups[0].dir;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "No previous deployment found for rollback."
			) {
				throw error;
			}
			if (
				error instanceof Error &&
				"code" in error &&
				(error as NodeJS.ErrnoException).code === "ENOENT"
			) {
				throw new Error("No previous deployment found for rollback.");
			}
			if (error instanceof Error) {
				throw error;
			}
			throw new Error(`Rollback failed: ${error}`);
		}
	}

	private getDeployTargets(
		flags: {
			target?: string | string[];
		},
		config?: Record<string, unknown>,
	): string[] | "all" {
		// Priority: CLI flag > config targets > deploy everything
		if (
			flags.target &&
			Array.isArray(flags.target) &&
			flags.target.length > 0
		) {
			return flags.target;
		}

		if (flags.target && typeof flags.target === "string") {
			return [flags.target];
		}

		// Fall back to config targets
		if (
			config &&
			"targets" in config &&
			Array.isArray(config.targets) &&
			config.targets.length > 0
		) {
			return config.targets as string[];
		}

		return "all";
	}

	private async getFilesForTargets(
		targets: string[] | "all",
		ignorePatterns: string[],
	): Promise<string[]> {
		if (targets === "all") {
			const paths = await glob("**/*", {
				ignore: ignorePatterns,
			});
			return paths;
		}

		const allFiles: string[] = [];

		for (const target of targets) {
			const targetPath = path.join(process.cwd(), target);

			try {
				await fs.promises.access(targetPath);
			} catch {
				throw new Error(
					`Target directory "${target}" does not exist in ${process.cwd()}`,
				);
			}

			const targetFiles = await glob("**/*", {
				cwd: targetPath,
				ignore: ignorePatterns,
			});

			allFiles.push(
				...targetFiles.map((file) => path.join(target, file)),
			);
		}

		return allFiles;
	}

	public async run(): Promise<void> {
		const { flags } = await this.parse(Deploy);

		// Handle batch deployments (only if not already running from batch)
		if (flags.batch) {
			try {
				const { batchNames, batchConfig } = await getBatchConfig({
					configPath: flags.config || "smss.json",
					batchInput: flags.batch || "all",
				});

				this.log(
					`\n🔄 Running batch deployment for: ${batchNames.join(", ")}\n`,
				);

				const successful: { name: string; duration: number }[] = [];
				const failed: { name: string; error: string }[] = [];

				for (const batchName of batchNames) {
					const batchStartTime = Date.now();
					const batchSettings = batchConfig[batchName];
					this.log(
						`\n📦 Deploying to batch instance: "${batchName}" [${new Date(batchStartTime).toISOString()}]`,
					);
					this.log(
						`   Endpoint: ${batchSettings.endpoint || "from .env"}`,
					);
					this.log(
						`   Module: ${batchSettings.module || "from .env"}`,
					);

					try {
						await this.deployToInstance(
							{
								endpoint: batchSettings.endpoint as
									| string
									| undefined,
								module: batchSettings.module as
									| string
									| undefined,
								accessKey: batchSettings.accessKey as
									| string
									| undefined,
								secretKey: batchSettings.secretKey as
									| string
									| undefined,
								app: batchSettings.app as string | undefined,
							},
							flags,
						);
						const batchEndTime = Date.now();
						const duration = batchEndTime - batchStartTime;
						this.log(
							`   ✅ Successfully deployed to "${batchName}" [completed in ${duration}ms]`,
						);
						successful.push({ name: batchName, duration });
					} catch (deployError) {
						const batchEndTime = Date.now();
						const duration = batchEndTime - batchStartTime;
						const errorMsg =
							deployError instanceof Error
								? deployError.message
								: String(deployError);
						this.log(
							`   ❌ Deployment failed for "${batchName}" [completed in ${duration}ms]: ${errorMsg}`,
						);
						failed.push({ name: batchName, error: errorMsg });
					}
				}

				this.log(`\n${"=".repeat(60)}`);
				this.log("📋 Batch Deploy Summary");
				this.log("=".repeat(60));
				this.log(
					`✅ Successful: ${successful.length}/${batchNames.length}`,
				);
				if (successful.length > 0) {
					for (const { name, duration } of successful) {
						this.log(`   • "${name}" (${duration}ms)`);
					}
				}
				if (failed.length > 0) {
					this.log(
						`❌ Failed: ${failed.length}/${batchNames.length}`,
					);
					for (const { name, error } of failed) {
						this.log(`   • "${name}": ${error}`);
					}
				}
				this.log(`${"=".repeat(60)}\n`);

				if (failed.length > 0) {
					throw new Error(
						`${failed.length} deploy instance(s) failed`,
					);
				}
				return;
			} catch (err) {
				this.error(err instanceof Error ? err.message : String(err));
			}
		}

		// Load environment variables from .env and .env.local
		// If --env is provided, use only that file
		// Otherwise, load .env first, then .env.local (which overrides .env values)
		const envPath = path.resolve(process.cwd(), ".env");
		const envLocalPath = path.resolve(process.cwd(), ".env.local");
		if (flags.env) {
			config({ path: flags.env });
		} else {
			config({ path: envPath });
			if (fs.existsSync(envLocalPath)) {
				config({ path: envLocalPath, override: true });
			}
		}

		await this.deployToInstance(
			{
				endpoint: process.env.ENDPOINT,
				module: process.env.MODULE,
				accessKey: process.env.ACCESS_KEY,
				secretKey: process.env.SECRET_KEY,
				app: process.env.APP || process.env.VITE_APP,
			},
			flags,
		);
	}

	private async deployToInstance(
		opts: {
			endpoint?: string;
			module?: string;
			accessKey?: string;
			secretKey?: string;
			app?: string;
		},
		// biome-ignore lint/suspicious/noExplicitAny: oclif flags type is dynamic
		flags: { [key: string]: any },
	): Promise<void> {
		// Handle rollback - store backup path but continue to setup
		let rollbackBackupDir: string | undefined;
		if (flags.rollback) {
			try {
				this.log("🔄 Rolling back to previous deployment...");
				rollbackBackupDir = await this.rollbackToPrevious();
				this.log(`📦 Using backup from: ${rollbackBackupDir}`);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : String(error);
				this.error(message);
			}
		}

		// Enable debug logging if logLevel is debug
		if (shouldLog(flags.logLevel, "debug")) {
			process.env.DEBUG = "oclif*,@semoss/cli*";
		}

		if (shouldLog(flags.logLevel, "debug")) {
			this.log("\n🔬 Debug Mode Enabled:");
			this.log("   • All debug information will be shown");
			this.log("   • Raw data from all operations will be displayed");
			this.log("   • Timing information will be included");
		}

		if (flags.breakpoint) {
			this.log(
				"🛑 Debugger breakpoint enabled - attach your debugger now",
			);
		}

		try {
			// validate and construct the full module URL
			if (!opts.endpoint) {
				this.error(
					"ENDPOINT is required. Define one in your environment variables (.env) or use --endpoint flag",
				);
			}

			if (!opts.module) {
				this.error(
					"MODULE is required. Define one in your environment variables (.env) or use --module flag",
				);
			}

			// Construct the full module URL
			// If modulePath is already a full URL (starts with http), use it as-is
			// This handles the batch mode case where we pre-construct fullModuleUrl
			let fullModule: string;
			if (opts.module.toString().startsWith("http")) {
				fullModule = opts.module.toString();
			} else {
				let endpoint = opts.endpoint;
				if (typeof endpoint === "string" && endpoint.endsWith("/")) {
					endpoint = endpoint.slice(0, -1);
				}
				fullModule = `${endpoint}${opts.module}`;
			}

			// update the environment
			Env.update({
				APP: opts.app,
				ACCESS_KEY: opts.accessKey,
				MODULE: fullModule,
				SECRET_KEY: opts.secretKey,
			});
		} catch (error) {
			this.error(error as Error);
		}

		// check the environment
		if (!Env.MODULE) {
			this.error(
				"MODULE is required. Define one in your environment variables (.env)",
			);
		}

		if (!Env.ACCESS_KEY) {
			this.error(
				"ACCESS_KEY is required. Define one in your environment variables (.env)",
			);
		}

		if (!Env.SECRET_KEY) {
			this.error(
				"SECRET_KEY is required. Define one in your environment variables (.env)",
			);
		}

		if (!Env.APP) {
			this.error(
				"APP is required. Define one in your environment variables (.env)",
			);
		}
		// create a new insight
		const insight = new Insight();

		if (shouldLog(flags.logLevel, "debug")) {
			this.log("\n🌍 Environment Variables:");
			this.log(`   • MODULE: ${Env.MODULE || "Not set"}`);
			this.log(`   • APP: ${Env.APP || "Not set"}`);
			this.log(
				`   • ACCESS_KEY: ${Env.ACCESS_KEY ? `***${Env.ACCESS_KEY.slice(-4)}` : "Not set"}`,
			);
			this.log(
				`   • SECRET_KEY: ${Env.SECRET_KEY ? `***${Env.SECRET_KEY.slice(-4)}` : "Not set"}`,
			);
		}

		// Load config file for ignore patterns and targets
		let mergedIgnorePatterns = [...DEFAULT_IGNORE];
		let loadedConfig: Record<string, unknown> | undefined;
		try {
			const config = await this.loadConfig(flags.config || "smss.json");
			if (config && typeof config === "object") {
				loadedConfig = config;

				if (
					"deploy" in config &&
					typeof config.deploy === "object" &&
					config.deploy !== null &&
					"ignore" in config.deploy &&
					Array.isArray(config.deploy.ignore)
				) {
					mergedIgnorePatterns = [
						...DEFAULT_IGNORE,
						...(config.deploy.ignore as string[]),
					];
					if (shouldLog(flags.logLevel, "debug")) {
						this.log(`📋 Merged ignore patterns from smss.json`);
					}
				}

				if ("targets" in config && Array.isArray(config.targets)) {
					if (shouldLog(flags.logLevel, "debug") && !flags.target) {
						this.log(
							`📋 Using deployment targets from config: ${(config.targets as string[]).join(", ")}`,
						);
					}
				}
			}
		} catch (error) {
			if (shouldLog(flags.logLevel, "verbose")) {
				this.log(`⚠️  Could not load config: ${error}`);
			}
		}

		// Determine deployment targets
		const deployTargets = this.getDeployTargets(flags, loadedConfig);
		const isFullDeploy = deployTargets === "all";

		if (shouldLog(flags.logLevel, "debug")) {
			if (!isFullDeploy) {
				this.log(
					`🎯 Deployment targets: ${(deployTargets as string[]).join(", ")}`,
				);
			} else {
				this.log("🎯 Deployment mode: Full deployment");
			}
		}

		// Validate target directories exist before doing any work (e.g., backup)
		if (!isFullDeploy && !flags.rollback) {
			for (const target of deployTargets as string[]) {
				const targetPath = path.join(process.cwd(), target);
				try {
					await fs.promises.access(targetPath);
				} catch {
					this.error(
						`Target directory "${target}" does not exist in ${process.cwd()}. Aborting before backup.`,
					);
				}
			}
		}

		// Handle dry-run mode
		if (flags.dryRun) {
			this.log("🔍 DRY-RUN MODE: No actual deployment will occur");
		}

		// get the tasks
		const tasks = new Listr<{
			zipBuffer?: Buffer;
			deleteResult?: unknown;
			uploadResult?: unknown;
			url?: string;
			backupDir?: string;
		}>([
			{
				title: "Initializing",
				enabled: () => !flags.dryRun,
				task: async () => {
					// Use shared helper for initialization and error handling
					await initializeAndTestInsight(
						insight,
						this.log.bind(this),
						shouldLog(flags.logLevel, "normal"),
					);
					return true;
				},
			},
			{
				title: "Creating Backup from server",
				enabled: () => !flags.dryRun && !flags.rollback && flags.backup,
				task: async (context) => {
					const startTime = Date.now();

					if (shouldLog(flags.logLevel, "verbose")) {
						logWithTiming(
							this.log.bind(this),
							"💾 Creating backup",
							startTime,
						);
					}

					try {
						const backup = await this.createBackup(
							deployTargets,
							insight,
							shouldLog(flags.logLevel, "debug"),
							opts,
						);
						context.backupDir = backup.backupDir;

						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`✅ Backup created: ${backup.backupDir}`,
								startTime,
							);
						}

						// Prune old backups if retention is configured
						if (flags.backupRetention > 0) {
							try {
								await this.pruneBackups(
									flags.backupRetention,
									shouldLog(flags.logLevel, "verbose"),
								);
							} catch {
								// Don't fail deploy if pruning fails
							}
						}
					} catch (error) {
						// Always log backup failures to warn users
						this.log(`⚠️  Backup creation failed: ${error}`);
						this.log(
							`📝 Note: Deployment will continue without backup. Backups help with recovery.`,
						);
					}

					return true;
				},
			},
			{
				title: "Building Portals",
				enabled: () =>
					!flags.dryRun &&
					!flags.rollback &&
					(isFullDeploy ||
						(Array.isArray(deployTargets) &&
							deployTargets.includes("portals"))),
				task: async () => {
					// Pre-deploy hook: build portals if needed
					this.log(
						"🔨 Running pre-deploy build for portals (pnpm build)...",
					);
					await new Promise((resolve, reject) => {
						const build = spawn("pnpm", ["build"], {
							cwd: process.cwd(),
							stdio: "inherit",
							shell: true,
						});
						build.on("close", (code) => {
							if (code === 0) {
								this.log(
									"✅ Portals build completed successfully.",
								);
								resolve(true);
							} else {
								reject(
									new Error(
										"pnpm build failed. Aborting deploy.",
									),
								);
							}
						});
					});
				},
			},
			{
				title: rollbackBackupDir
					? "Loading Backup File"
					: isFullDeploy
						? "Zipping Current Directory"
						: "Zipping Target Directories",
				task: async (context) => {
					const startTime = Date.now();

					// If rollback, load backup.zip instead of zipping
					if (rollbackBackupDir) {
						const backupZipPath = path.join(
							rollbackBackupDir,
							"backup.zip",
						);

						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`📦 Loading backup file: ${backupZipPath}`,
								startTime,
							);
						}

						try {
							const zipBuffer =
								await fs.promises.readFile(backupZipPath);
							context.zipBuffer = zipBuffer;

							if (shouldLog(flags.logLevel, "verbose")) {
								logWithTiming(
									this.log.bind(this),
									`✅ Backup loaded (${zipBuffer.length} bytes)`,
									startTime,
								);
							}
						} catch (error) {
							if (shouldLog(flags.logLevel, "verbose")) {
								logWithTiming(
									this.log.bind(this),
									`❌ Failed to load backup: ${error}`,
									startTime,
								);
							}
							throw error;
						}

						return true;
					}

					// Normal zipping logic for deploy
					if (shouldLog(flags.logLevel, "verbose")) {
						logWithTiming(
							this.log.bind(this),
							`📦 Zipping ${isFullDeploy ? "current directory" : "target directories"}`,
							startTime,
						);
					}

					if (shouldLog(flags.logLevel, "verbose")) {
						this.log(`🔍 Zip Details:`);
						this.log(`   • Current Directory: ${process.cwd()}`);
						if (!isFullDeploy) {
							this.log(
								`   • Targets: ${(deployTargets as string[]).join(", ")}`,
							);
						}
					}

					try {
						// Get files based on deployment targets
						const paths = await this.getFilesForTargets(
							deployTargets,
							mergedIgnorePatterns,
						);

						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`📁 Found ${paths.length} files to zip`,
								startTime,
							);
						}

						if (shouldLog(flags.logLevel, "debug")) {
							this.log(`📋 Files to include:`);
							paths.slice(0, 10).forEach((p) => {
								this.log(`   • ${p}`);
							});
							if (paths.length > 10) {
								this.log(
									`   • ... and ${paths.length - 10} more files`,
								);
							}
						}

						// Create a new zip
						const zip = new AdmZip();

						// Copy the contents
						await Promise.all(
							paths.map((p) => {
								return new Promise((resolve) => {
									fs.stat(p, (_err, stats) => {
										// add the non directory
										try {
											if (!stats.isDirectory()) {
												// get the directory name
												const dirname = path.dirname(p);

												// add it
												zip.addLocalFile(
													p,
													dirname === "."
														? ""
														: dirname,
												);
											}
										} catch (e) {
											if (
												shouldLog(
													flags.logLevel,
													"verbose",
												)
											) {
												this.warn(`⚠️ Warning: ${e}`);
											}
										} finally {
											resolve(null);
										}
									});
								});
							}),
						);

						// Convert to a buffer
						const zipResult = await zip.toBufferPromise();
						if (!zipResult || zipResult.length === 0) {
							throw new Error(
								"Failed to create zip buffer — zip was empty.",
							);
						}
						context.zipBuffer = zipResult;

						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`✅ Zip created successfully (${context.zipBuffer.length} bytes)`,
								startTime,
							);
						}

						if (shouldLog(flags.logLevel, "debug")) {
							this.log(`🔍 Zip Analysis:`);
							this.log(`   • Files included: ${paths.length}`);
							this.log(
								`   • Zip size: ${context.zipBuffer.length} bytes`,
							);
							this.log(
								`   • Execution Time: ${Date.now() - startTime}ms`,
							);
						}
					} catch (error) {
						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`❌ Zip creation failed: ${error}`,
								startTime,
							);
						}
						throw error;
					}

					return true;
				},
			},
			// Commenting out for now. Unzipping should replace the old files will fully remove once tested.
			// {
			// 	title:
			// 		rollbackBackupDir || isFullDeploy
			// 			? "Deleting All Assets"
			// 			: "Cleaning Target Assets",
			// 	enabled: () => !flags.dryRun,
			// 	task: async (context) => {
			// 		const startTime = Date.now();

			// 		if (rollbackBackupDir || isFullDeploy) {
			// 			const deleteCommand = `DeleteAppAssets(project="${opts.app}")`;

			// 			if (shouldLog(flags.logLevel, "verbose")) {
			// 				logWithTiming(
			// 					this.log.bind(this),
			// 					`🗑️ Executing: ${deleteCommand}`,
			// 					startTime,
			// 				);
			// 			}

			// 			if (shouldLog(flags.logLevel, "debug")) {
			// 				this.log(`🔍 Delete Details:`);
			// 				this.log(`   • Command: ${deleteCommand}`);
			// 				this.log(`   • Target Path: version/assets/`);
			// 				this.log(`   • Target App: ${opts.app}`);
			// 			}

			// 			try {
			// 				const { pixelReturn } =
			// 					await insight.actions.run(deleteCommand);

			// 				context.deleteResult = pixelReturn[0].output;

			// 				if (shouldLog(flags.logLevel, "verbose")) {
			// 					logWithTiming(
			// 						this.log.bind(this),
			// 						`✅ DeleteAsset Result: ${context.deleteResult}`,
			// 						startTime,
			// 					);
			// 				}

			// 				if (shouldLog(flags.logLevel, "debug")) {
			// 					this.log(`🔍 Delete Analysis:`);
			// 					this.log(
			// 						`   • Result: ${context.deleteResult}`,
			// 					);
			// 					this.log(
			// 						`   • Result Type: ${typeof context.deleteResult}`,
			// 					);
			// 					this.log(
			// 						`   • Execution Time: ${Date.now() - startTime}ms`,
			// 					);
			// 				}
			// 			} catch (error) {
			// 				const errorMsg =
			// 					(error as Error).message || String(error);
			// 				if (
			// 					errorMsg.includes(
			// 						"Could not find any of the files",
			// 					)
			// 				) {
			// 					// No assets to delete - this is fine (first deployment or already clean)
			// 					if (shouldLog(flags.logLevel, "verbose")) {
			// 						logWithTiming(
			// 							this.log.bind(this),
			// 							`ℹ️ No assets to delete (environment may be fresh)`,
			// 							startTime,
			// 						);
			// 					}
			// 					context.deleteResult = "no-assets-to-delete";
			// 				} else {
			// 					// Log the error but proceed — upload can still succeed
			// 					this.log(
			// 						`⚠️  DeleteAppAssets failed: ${errorMsg}`,
			// 					);
			// 					this.log(
			// 						`📝 Continuing with upload — assets may need manual cleanup.`,
			// 					);
			// 					context.deleteResult =
			// 						"delete-failed-continuing";
			// 				}
			// 			}
			// 		} else {
			// 			if (shouldLog(flags.logLevel, "verbose")) {
			// 				logWithTiming(
			// 					this.log.bind(this),
			// 					`🗑️ Deleting target-specific assets...`,
			// 					startTime,
			// 				);
			// 			}

			// 			for (const target of deployTargets as string[]) {
			// 				const remotePath = `${target}`;

			// 				if (shouldLog(flags.logLevel, "verbose")) {
			// 					this.log(`   🗑️ Deleting: ${remotePath}`);
			// 				}

			// 				const deleteCommand = `DeleteAppAssets(project="${opts.app}", filePath="${remotePath}");`;

			// 				try {
			// 					const { pixelReturn } =
			// 						await insight.actions.run(deleteCommand);

			// 					if (shouldLog(flags.logLevel, "debug")) {
			// 						this.log(
			// 							`📊 DeleteAppAssets Response for ${target}: ${JSON.stringify(pixelReturn, null, 2)}`,
			// 						);
			// 					}
			// 				} catch (error) {
			// 					if (shouldLog(flags.logLevel, "verbose")) {
			// 						this.warn(
			// 							`⚠️ Warning deleting ${remotePath}: ${error}`,
			// 						);
			// 					}
			// 				}
			// 			}

			// 			if (shouldLog(flags.logLevel, "verbose")) {
			// 				logWithTiming(
			// 					this.log.bind(this),
			// 					`✅ Target assets deleted`,
			// 					startTime,
			// 				);
			// 			}

			// 			context.deleteResult = "target-assets-deleted";
			// 		}

			// 		return true;
			// 	},
			// },
			{
				title: "Uploading Zipped Directory",
				enabled: () => !flags.dryRun,
				task: async (context) => {
					const startTime = Date.now();

					if (!context.zipBuffer) {
						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`⏭️ No zip buffer to upload, skipping upload step`,
								startTime,
							);
						}
						return true;
					}

					if (shouldLog(flags.logLevel, "verbose")) {
						logWithTiming(
							this.log.bind(this),
							`📤 Uploading zipped directory to the server`,
							startTime,
						);
					}

					if (shouldLog(flags.logLevel, "debug")) {
						this.log(`🔍 Upload Details:`);
						this.log(
							`   • Zip Buffer Size: ${context.zipBuffer.length} bytes`,
						);
						this.log(`   • Target App: ${opts.app}`);
						this.log(`   • Target Path: version/assets/`);
						this.log(
							`🔍 [DEBUG] Before upload - insight.insightId: ${insight.insightId}`,
						);
					}

					try {
						// Create a file from the zip buffer
						const fileName = isFullDeploy
							? "current-directory.zip"
							: `deploy-${(deployTargets as string[]).join("-")}.zip`;
						// Copy buffer to new ArrayBuffer to avoid SharedArrayBuffer type issues
						const arrayBuffer = new ArrayBuffer(
							context.zipBuffer.length,
						);
						const view = new Uint8Array(arrayBuffer);
						view.set(context.zipBuffer);
						const file = new File([view], fileName, {
							type: "application/zip",
						});

						if (shouldLog(flags.logLevel, "debug")) {
							this.log(`🔍 File Details:`);
							this.log(`   • File Name: ${fileName}`);
							this.log(
								`   • File Size: ${context.zipBuffer.length} bytes`,
							);
							this.log(`   • File Type: ${typeof file}`);
							this.log(
								`🔍 [DEBUG] Before upload - insight.insightId: ${insight.insightId}`,
							);
						}

						this.log(`🔄 Starting upload of ${fileName}...`);
						if (shouldLog(flags.logLevel, "debug")) {
							this.log(
								`🔍 [DEBUG] Before upload - insight.insightId: ${insight.insightId}`,
							);
						}

						// Upload the file
						const uploaded = await upload(
							file as unknown as File | File[],
							insight.insightId,
							opts.app as string,
							"version/assets",
						);

						this.log(
							`✅ Upload of ${fileName} completed., ${JSON.stringify(uploaded)}`,
						);

						if (shouldLog(flags.logLevel, "debug")) {
							logWithTiming(
								this.log.bind(this),
								`📊 Upload result: ${JSON.stringify(uploaded, null, 2)}`,
								startTime,
							);
						}

						// Unzip the uploaded file
						await insight.actions.run(
							`UnzipFile(filePath=["/${uploaded[0].fileName}"], space=["${opts.app}"])`,
						);

						// Clean up the zip file
						await insight.actions.run(
							`DeleteAppAssets(filePath=["/${uploaded[0].fileName}"], project=["${opts.app}"])`,
						);

						context.uploadResult = uploaded[0];

						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`✅ Upload completed: ${uploaded[0].fileName}`,
								startTime,
							);
						}

						if (shouldLog(flags.logLevel, "debug")) {
							this.log(`🔍 Upload Analysis:`);
							this.log(`   • File Name: ${uploaded[0].fileName}`);
							this.log(
								`   • File Location: ${uploaded[0].fileLocation}`,
							);
							this.log(
								`   • Execution Time: ${Date.now() - startTime}ms`,
							);
						}
					} catch (error) {
						if (shouldLog(flags.logLevel, "verbose")) {
							logWithTiming(
								this.log.bind(this),
								`❌ Upload failed: ${error}`,
								startTime,
							);
						}
						throw error;
					}

					return true;
				},
			},
			{
				title: "Loading App Reactors",
				enabled: () => !flags.dryRun,
				task: async () => {
					// Load the insight classes
					await insight.actions.run(
						`ReloadInsightClasses(project='${opts.app}', release=true);`,
					);

					return true;
				},
			},
			{
				title: "Publishing App",
				enabled: () => !flags.dryRun,
				task: async (context) => {
					// Publish the app
					const { pixelReturn } = await insight.actions.run<[string]>(
						`PublishProject(project='${opts.app}', release=true);`,
					);

					// save the url
					context.url = pixelReturn[0].output;

					return true;
				},
			},
		]);

		// Track deployment start time
		const deploymentStartTime = Date.now();

		// Return the promise chain so batch deployments can properly await completion
		return tasks
			.run()
			.then((context) => {
				const deploymentDuration = Date.now() - deploymentStartTime;

				if (flags.dryRun) {
					this.log("✅ Dry-run completed successfully!");
					this.log("Files would have been deployed:");
					if (context.zipBuffer) {
						this.log(
							`   • Zip size: ${context.zipBuffer.length} bytes`,
						);
					}
					return;
				}

				this.log("🎉 Success!");

				if (context.deleteResult !== undefined) {
					this.log(`🗑️ DeleteAsset Result: ${context.deleteResult}`);
				}

				if (context.uploadResult !== undefined) {
					const fileName =
						typeof context.uploadResult === "object" &&
						context.uploadResult !== null &&
						"fileName" in context.uploadResult
							? (context.uploadResult.fileName as string)
							: "unknown";
					this.log(`📤 Upload Result: ${fileName}`);
				}

				if (shouldLog(flags.logLevel, "verbose")) {
					this.log("\n📋 Summary:");
					this.log(
						`   • Zip operation: ${context.zipBuffer ? "Completed" : "Failed"}`,
					);
					this.log(
						`   • DeleteAsset operation: ${context.deleteResult !== undefined ? "Completed" : "Skipped"}`,
					);
					this.log(
						`   • Upload operation: ${context.uploadResult !== undefined ? "Completed" : "Skipped"}`,
					);
					if (context.zipBuffer) {
						this.log(
							`   • Zip size: ${context.zipBuffer.length} bytes`,
						);
					}
					if (context.deleteResult !== undefined) {
						this.log(
							`   • DeleteAsset result: ${context.deleteResult}`,
						);
					}
					if (context.uploadResult !== undefined) {
						const fileName =
							typeof context.uploadResult === "object" &&
							context.uploadResult !== null &&
							"fileName" in context.uploadResult
								? (context.uploadResult.fileName as string)
								: "unknown";
						this.log(`   • Upload result: ${fileName}`);
					}

					if (!isFullDeploy) {
						this.log(
							`   • Deployment type: Targeted (${(deployTargets as string[]).join(", ")})`,
						);
					}

					this.log(`   • Duration: ${deploymentDuration}ms`);
				}

				if (shouldLog(flags.logLevel, "debug")) {
					this.log("\n🔬 Super Verbose Summary:");
					this.log(`   • Total Operations: 5`);
					this.log(
						`   • Successful Operations: ${
							[
								context.zipBuffer !== undefined,
								context.deleteResult !== undefined,
								context.uploadResult !== undefined,
							].filter(Boolean).length + 1
						}/5`,
					);
					this.log(`   • Environment: ${Env.MODULE} (${Env.APP})`);
					this.log(
						`   • Deployment Type: ${isFullDeploy ? "Full" : "Targeted"}`,
					);
					if (!isFullDeploy) {
						this.log(
							`   • Targets: ${(deployTargets as string[]).join(", ")}`,
						);
					}
					this.log(
						`   • Debug Mode: ${flags.logLevel === "debug" ? "Enabled" : "Disabled"}`,
					);
					this.log(
						`   • Verbose Mode: ${flags.logLevel === "verbose" ? "Enabled" : "Disabled"}`,
					);
					this.log(
						`   • Dry-run: ${flags.dryRun ? "Enabled" : "Disabled"}`,
					);
				}

				// Log deployment to history
				void this.logDeploymentHistory({
					timestamp: new Date().toISOString(),
					targets: flags.rollback ? "all" : deployTargets,
					status: "success",
					zipSize: context.zipBuffer?.length,
					duration: deploymentDuration,
					backupDir: flags.rollback ? undefined : context.backupDir,
					rollback: flags.rollback,
					app: opts.app,
					module: opts.module,
				});
			})
			.catch((err) => {
				const deploymentDuration = Date.now() - deploymentStartTime;

				// Log deployment failure to history
				void this.logDeploymentHistory({
					timestamp: new Date().toISOString(),
					targets: flags.rollback ? "all" : deployTargets,
					status: "failure",
					duration: deploymentDuration,
					backupDir: undefined,
					rollback: flags.rollback,
					app: opts.app,
					module: opts.module,
				});

				// log the error
				this.error(err);
			});
	}
}
