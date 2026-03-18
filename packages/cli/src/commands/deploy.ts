import { Command, Flags } from "@oclif/core";
import AdmZip from "adm-zip";
import chalk from "chalk";
import { glob } from "glob";
import inquirer from "inquirer";
import Listr from "listr";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { Env, Insight, upload } from "@semoss/sdk";
import { DEFAULT_CONFIG } from "../constants.js";
import {
	getBatchConfig,
	getConfiguration,
	initializeAndTestInsight,
} from "../utils/index.js";
import {
	getDefaultLogger,
	Logger,
	setDefaultLogger,
	toLogLevel,
} from "../utils/logger.js";

const DEFAULT_IGNORE = DEFAULT_CONFIG.ignore;

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
		// yes flag
		yes: Flags.boolean({
			char: "y",
			description: "Skip confirmation prompt",
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
		useGlobal: Flags.boolean({
			char: "g",
			description:
				"Use only global config (~/.config/semoss), skip local .env and smss.json",
			default: false,
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
	): Promise<ArrayBuffer> {
		const logger = getDefaultLogger();
		return new Promise((resolve, reject) => {
			logger.debug(`📡 Downloading via HTTP(S): ${downloadUrl}`);

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
					logger.debug(
						`📡 HTTP Response received - Status: ${response.statusCode}, Headers: ${JSON.stringify(response.headers)}`,
					);

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
							logger.debug(
								`📋 ERROR RESPONSE (${responseBody.length} bytes):\n${"=".repeat(80)}\n${responseBody}\n${"=".repeat(80)}`,
							);
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
						logger.debug(`📦 Downloaded ${buffer.length} bytes`);
						const firstBytes = buffer.slice(0, 4).toString("hex");
						logger.debug(
							`📥 First 4 bytes (hex): ${firstBytes} (should start with "504b" for zip)`,
						);

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
					logger.debug(`❌ HTTP Request Error: ${err.message}`);
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
		opts: {
			app?: string;
			module?: string;
			accessKey?: string;
			secretKey?: string;
			endpoint?: string;
		},
	): Promise<{ backupDir: string; backupZipPath: string }> {
		const logger = getDefaultLogger();
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
			logger.debug(
				`🔍 Before ExportProjectApp - insight.insightId: ${insight.insightId}`,
			);

			const { pixelReturn } = await insight.actions.run<[string]>(
				`ExportProjectApp(project=['${opts.app}']);`,
			);

			logger.debug(
				`📦 ExportProjectApp response: ${JSON.stringify(pixelReturn[0])}`,
			);

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

				logger.debug(`📥 Download result is ArrayBuffer: true`);
				logger.debug(
					`📥 Download result length: ${downloadResult.byteLength}`,
				);

				// Convert to Buffer for AdmZip
				const zipBuffer = Buffer.from(downloadResult);

				logger.debug(
					`📥 Converted to Buffer, size: ${zipBuffer.length} bytes`,
				);
				// Log first few bytes to verify it's a zip (should start with 504B)
				const firstFewBytes = zipBuffer.slice(0, 4).toString("hex");
				logger.debug(
					`📥 First 4 bytes (hex): ${firstFewBytes} (should start with "504b")`,
				);

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

					logger.debug(
						`✅ Successfully extracted zip to temp directory`,
					);
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

					const assetFiles = await fs.promises.readdir(assetsSource);
					logger.debug(
						`📦 Found assets folder with ${assetFiles.length} items`,
					);
					break;
				}
			}

			if (!assetsSource) {
				this.log(`❌ NO ASSETS FOLDER FOUND IN EXTRACTED ZIP`);
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
					logger.debug(
						`⚠️ Failed to add assets to backup.zip: ${error}`,
					);
				}
			} else {
				this.log(`❌ No assets folder found to backup`);
			}

			backupZip.writeZip(backupZipPath);

			const backupStats = await fs.promises.stat(backupZipPath);
			logger.debug(
				`✅ Backup created: ${backupZipPath} (${backupStats.size} bytes)`,
			);

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
	private async pruneBackups(retention: number): Promise<void> {
		const logger = getDefaultLogger();
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

				logger.info(`🗑️  Pruned old backup: ${backup.name}`);
			}

			if (toRemove.length > 0) {
				logger.info(
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
			getDefaultLogger().warn(
				`Failed to log deployment history: ${error}`,
			);
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
		config?: Record<string, unknown> | { targets?: string[] },
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

		// Fall back to config targets (unified config or smss.json)
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

		// ── Initialise the logger for this command session ──
		const logger = new Logger({
			level: toLogLevel(flags.logLevel),
			command: "deploy",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);
		logger.debug(`Deploy command started (logLevel=${flags.logLevel})`);

		// Get unified configuration from all sources (priority: .env.local > .env > smss.json > global)
		const configResult = getConfiguration({
			configPath: flags.config,
			skipSmss: flags.useGlobal,
			skipEnv: flags.useGlobal,
		});

		if (configResult.source !== "none") {
			logger.info(`✓ Using configuration from ${configResult.source}`);
		} else {
			logger.info("ℹ  No configuration found");
		}

		// Handle batch deployments (only if not already running from batch)
		if (flags.batch) {
			// getBatchConfig handles smss.json > global config priority
			const { batchNames, batchConfig, source } = await getBatchConfig({
				configPath: flags.config || "smss.json",
				batchInput: flags.batch || "all",
			});

			this.log(
				`\n🔄 Running batch deployment for: ${batchNames.join(", ")} (from ${source})\n`,
			);

			const successful: { name: string; duration: number }[] = [];
			const failed: { name: string; error: string }[] = [];

			for (const batchName of batchNames) {
				const batchStartTime = Date.now();
				const entry = batchConfig[batchName];

				this.log(
					`\n📦 Deploying to instance: "${batchName}" [${new Date(batchStartTime).toISOString()}]`,
				);
				this.log(`   Module: ${entry.module || "from .env"}`);

				try {
					await this.deployToInstance(
						{
							endpoint: entry.endpoint,
							module: entry.module,
							accessKey: entry.accessKey,
							secretKey: entry.secretKey,
							app: entry.app || configResult.appId || undefined,
						},
						flags,
						configResult.app || undefined,
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
				this.log(`❌ Failed: ${failed.length}/${batchNames.length}`);
				for (const { name, error } of failed) {
					this.log(`   • "${name}": ${error}`);
				}
			}
			this.log(`${"=".repeat(60)}\n`);

			if (failed.length > 0) {
				throw new Error(`${failed.length} deploy instance(s) failed`);
			}
			return;
		}

		// Use getConfiguration result directly (already handles all config sources)
		if (!configResult.isValid) {
			this.error(
				`Invalid configuration:\n${configResult.errors.map((e) => `  - ${e}`).join("\n")}`,
			);
		}

		// Show confirmation prompt (unless --yes flag or --dry-run or --rollback)
		if (!flags.yes && !flags.dryRun && !flags.rollback) {
			const appInfo =
				configResult.appName || configResult.appId
					? `app "${chalk.cyan(configResult.appName || configResult.appId)}"`
					: `app from ${chalk.cyan(process.cwd())}`;

			this.log("");
			this.log(chalk.yellow("⚠️  Deployment Confirmation"));
			this.log(chalk.dim("─".repeat(50)));
			this.log(`Source:   ${chalk.cyan(configResult.source)}`);
			if (configResult.instanceName) {
				this.log(`Instance: ${chalk.cyan(configResult.instanceName)}`);
			}
			this.log(`Module:   ${chalk.dim(configResult.module)}`);
			this.log(`App:      ${appInfo}`);
			this.log(`Deploy from: ${chalk.cyan(process.cwd())}`);
			this.log(chalk.dim("─".repeat(50)));
			this.log(
				chalk.yellow(
					"⚠️  Deploy uses your current directory. Make sure your terminal is in the correct project folder.",
				),
			);
			this.log(
				chalk.red(
					"This action will replace the current deployment. Use --rollback to revert if needed.",
				),
			);
			this.log("");

			const { confirm } = await inquirer.prompt([
				{
					type: "confirm",
					name: "confirm",
					message: "Do you want to proceed with deployment?",
					default: false,
				},
			]);

			if (!confirm) {
				this.log(chalk.yellow("\n✗ Deployment cancelled"));
				return;
			}
			this.log("");
		}

		// Extract endpoint and module for deployToInstance
		// If module is a full URL, endpoint can be derived or left undefined
		let endpoint: string | undefined;
		let modulePath: string | undefined = configResult.module || undefined;

		// If module is a full URL, use the same value for endpoint/module
		// deployToInstance will handle it properly
		if (configResult.module?.startsWith("http")) {
			endpoint = configResult.module;
			modulePath = configResult.module;
		}

		await this.deployToInstance(
			{
				endpoint,
				module: modulePath,
				accessKey: configResult.accessKey || undefined,
				secretKey: configResult.secretKey || undefined,
				app: configResult.appId || undefined,
			},
			flags,
			configResult.app || undefined,
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
		appConfig?: {
			appId?: string;
			name?: string;
			path?: string;
			targets?: string[];
			ignore?: string[];
			hooks?: {
				preDeploy?: string[];
				postDeploy?: string[];
			};
		},
	): Promise<void> {
		// Get or create logger for this deploy instance invocation
		const logger = new Logger({
			level: toLogLevel(flags.logLevel),
			command: "deploy",
			console: this.log.bind(this),
		});

		logger.fileOnly(
			"info",
			`deployToInstance called – app=${opts.app} module=${opts.module} endpoint=${opts.endpoint}`,
		);

		// Handle rollback - store backup path but continue to setup
		let rollbackBackupDir: string | undefined;
		if (flags.rollback) {
			try {
				logger.info("🔄 Rolling back to previous deployment...");
				rollbackBackupDir = await this.rollbackToPrevious();
				logger.info(`📦 Using backup from: ${rollbackBackupDir}`);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : String(error);
				logger.error(`Rollback failed: ${message}`);
				this.error(message);
			}
		}

		// Enable debug logging if logLevel is debug
		if (flags.logLevel === "debug") {
			process.env.DEBUG = "oclif*,@semoss/cli*";
		}

		logger.debug("🔬 Debug Mode Enabled:");
		logger.debug("   • All debug information will be shown");
		logger.debug("   • Raw data from all operations will be displayed");
		logger.debug("   • Timing information will be included");

		if (flags.breakpoint) {
			logger.info(
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

		logger.debug("🌍 Environment Variables:");
		logger.debug(`   • MODULE: ${Env.MODULE || "Not set"}`);
		logger.debug(`   • APP: ${Env.APP || "Not set"}`);
		// Always capture credentials to file (masked), but only show on console in debug
		logger.fileOnly(
			"debug",
			`ACCESS_KEY: ${Env.ACCESS_KEY ? `***${Env.ACCESS_KEY.slice(-4)}` : "Not set"}`,
		);
		logger.fileOnly(
			"debug",
			`SECRET_KEY: ${Env.SECRET_KEY ? `***${Env.SECRET_KEY.slice(-4)}` : "Not set"}`,
		);

		// Load config file for ignore patterns and targets
		let mergedIgnorePatterns = [...DEFAULT_IGNORE];
		let loadedConfig: Record<string, unknown> | undefined;

		// Use app config from unified config if available
		if (appConfig) {
			if (appConfig.ignore && Array.isArray(appConfig.ignore)) {
				mergedIgnorePatterns = [...DEFAULT_IGNORE, ...appConfig.ignore];
				logger.debug(
					`📋 Using ignore patterns from unified config (${appConfig.ignore.length} custom)`,
				);
			}
		} else {
			// LEGACY: smss.json config (kept for backward compatibility)
			try {
				const config = await this.loadConfig(
					flags.config || "smss.json",
				);
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
						logger.debug(
							`📋 Merged ignore patterns from smss.json`,
						);
					}

					if ("targets" in config && Array.isArray(config.targets)) {
						if (!flags.target) {
							logger.debug(
								`📋 Using deployment targets from config: ${(config.targets as string[]).join(", ")}`,
							);
						}
					}
				}
			} catch (error) {
				logger.info(`⚠️  Could not load config: ${error}`);
			}
		}

		// Determine deployment targets
		const deployTargets = this.getDeployTargets(
			flags,
			appConfig || loadedConfig,
		);
		const isFullDeploy = deployTargets === "all";

		if (!isFullDeploy) {
			logger.debug(
				`🎯 Deployment targets: ${(deployTargets as string[]).join(", ")}`,
			);
		} else {
			logger.debug("🎯 Deployment mode: Full deployment");
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
					await initializeAndTestInsight(insight);
					return true;
				},
			},
			{
				title: "Creating Backup from server",
				enabled: () => !flags.dryRun && !flags.rollback && flags.backup,
				task: async (context) => {
					const startTime = Date.now();

					logger.info(
						`⏱️ [${Date.now() - startTime}ms] 💾 Creating backup`,
					);

					try {
						const backup = await this.createBackup(
							deployTargets,
							insight,
							opts,
						);
						context.backupDir = backup.backupDir;

						logger.info(
							`⏱️ [${Date.now() - startTime}ms] ✅ Backup created: ${backup.backupDir}`,
						);

						// Prune old backups if retention is configured
						if (flags.backupRetention > 0) {
							try {
								await this.pruneBackups(flags.backupRetention);
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

						logger.info(
							`⏱️ [${Date.now() - startTime}ms] 📦 Loading backup file: ${backupZipPath}`,
						);

						try {
							const zipBuffer =
								await fs.promises.readFile(backupZipPath);
							context.zipBuffer = zipBuffer;

							logger.info(
								`⏱️ [${Date.now() - startTime}ms] ✅ Backup loaded (${zipBuffer.length} bytes)`,
							);
						} catch (error) {
							logger.info(
								`⏱️ [${Date.now() - startTime}ms] ❌ Failed to load backup: ${error}`,
							);
							throw error;
						}

						return true;
					}

					// Normal zipping logic for deploy
					logger.info(
						`⏱️ [${Date.now() - startTime}ms] 📦 Zipping ${isFullDeploy ? "current directory" : "target directories"}`,
					);

					logger.info(`🔍 Zip Details:`);
					logger.info(`   • Current Directory: ${process.cwd()}`);
					if (!isFullDeploy) {
						logger.info(
							`   • Targets: ${(deployTargets as string[]).join(", ")}`,
						);
					}

					try {
						// Get files based on deployment targets
						const paths = await this.getFilesForTargets(
							deployTargets,
							mergedIgnorePatterns,
						);

						logger.info(
							`⏱️ [${Date.now() - startTime}ms] 📁 Found ${paths.length} files to zip`,
						);

						logger.debug(`📋 Files to include:`);
						paths.slice(0, 10).forEach((p) => {
							logger.debug(`   • ${p}`);
						});
						if (paths.length > 10) {
							logger.debug(
								`   • ... and ${paths.length - 10} more files`,
							);
						}

						// Create a new zip
						const zip = new AdmZip();

						// Copy the contents
						await Promise.all(
							paths.map((p) => {
								return new Promise((resolve) => {
									fs.stat(p, (err, stats) => {
										try {
											if (err || !stats) {
												logger.debug(
													`⚠️ Skipping ${p}: ${err?.message ?? "stat returned no data"}`,
												);
											} else if (!stats.isDirectory()) {
												const dirname = path.dirname(p);
												zip.addLocalFile(
													p,
													dirname === "."
														? ""
														: dirname,
												);
											}
										} catch (e) {
											logger.debug(`⚠️ Warning: ${e}`);
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

						logger.info(
							`⏱️ [${Date.now() - startTime}ms] ✅ Zip created successfully (${context.zipBuffer.length} bytes)`,
						);

						logger.debug(`🔍 Zip Analysis:`);
						logger.debug(`   • Files included: ${paths.length}`);
						logger.debug(
							`   • Zip size: ${context.zipBuffer.length} bytes`,
						);
						logger.debug(
							`   • Execution Time: ${Date.now() - startTime}ms`,
						);
					} catch (error) {
						logger.info(
							`⏱️ [${Date.now() - startTime}ms] ❌ Zip creation failed: ${error}`,
						);
						throw error;
					}

					return true;
				},
			},
			{
				title: "Uploading Zipped Directory",
				enabled: () => !flags.dryRun,
				task: async (context) => {
					const startTime = Date.now();

					if (!context.zipBuffer) {
						logger.info(
							`⏱️ [${Date.now() - startTime}ms] ⏭️ No zip buffer to upload, skipping upload step`,
						);
						return true;
					}

					logger.info(
						`⏱️ [${Date.now() - startTime}ms] 📤 Uploading zipped directory to the server`,
					);

					logger.debug(`🔍 Upload Details:`);
					logger.debug(
						`   • Zip Buffer Size: ${context.zipBuffer.length} bytes`,
					);
					logger.debug(`   • Target App: ${opts.app}`);
					logger.debug(`   • Target Path: version/assets/`);
					logger.debug(
						`🔍 Before upload - insight.insightId: ${insight.insightId}`,
					);

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

						logger.debug(`🔍 File Details:`);
						logger.debug(`   • File Name: ${fileName}`);
						logger.debug(
							`   • File Size: ${context.zipBuffer.length} bytes`,
						);
						logger.debug(`   • File Type: ${typeof file}`);
						logger.debug(
							`🔍 Before upload - insight.insightId: ${insight.insightId}`,
						);

						this.log(`🔄 Starting upload of ${fileName}...`);

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

						logger.debug(
							`⏱️ [${Date.now() - startTime}ms] 📊 Upload result: ${JSON.stringify(uploaded, null, 2)}`,
						);

						// Unzip the uploaded file
						await insight.actions.run(
							`UnzipFile(filePath=["/${uploaded[0].fileName}"], space=["${opts.app}"])`,
						);

						// Clean up the zip file
						await insight.actions.run(
							`DeleteAppAssets(filePath=["/${uploaded[0].fileName}"], project=["${opts.app}"])`,
						);

						context.uploadResult = uploaded[0];

						logger.info(
							`⏱️ [${Date.now() - startTime}ms] ✅ Upload completed: ${uploaded[0].fileName}`,
						);

						logger.debug(`🔍 Upload Analysis:`);
						logger.debug(`   • File Name: ${uploaded[0].fileName}`);
						logger.debug(
							`   • File Location: ${uploaded[0].fileLocation}`,
						);
						logger.debug(
							`   • Execution Time: ${Date.now() - startTime}ms`,
						);
					} catch (error) {
						logger.info(
							`⏱️ [${Date.now() - startTime}ms] ❌ Upload failed: ${error}`,
						);
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

				logger.info("\n📋 Summary:");
				logger.info(
					`   • Zip operation: ${context.zipBuffer ? "Completed" : "Failed"}`,
				);
				logger.info(
					`   • DeleteAsset operation: ${context.deleteResult !== undefined ? "Completed" : "Skipped"}`,
				);
				logger.info(
					`   • Upload operation: ${context.uploadResult !== undefined ? "Completed" : "Skipped"}`,
				);
				if (context.zipBuffer) {
					logger.info(
						`   • Zip size: ${context.zipBuffer.length} bytes`,
					);
				}
				if (context.deleteResult !== undefined) {
					logger.info(
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
					logger.info(`   • Upload result: ${fileName}`);
				}

				if (!isFullDeploy) {
					logger.info(
						`   • Deployment type: Targeted (${(deployTargets as string[]).join(", ")})`,
					);
				}

				logger.info(`   • Duration: ${deploymentDuration}ms`);

				logger.debug("\n🔬 Super Verbose Summary:");
				logger.debug(`   • Total Operations: 5`);
				logger.debug(
					`   • Successful Operations: ${
						[
							context.zipBuffer !== undefined,
							context.deleteResult !== undefined,
							context.uploadResult !== undefined,
						].filter(Boolean).length + 1
					}/5`,
				);
				logger.debug(`   • Environment: ${Env.MODULE} (${Env.APP})`);
				logger.debug(
					`   • Deployment Type: ${isFullDeploy ? "Full" : "Targeted"}`,
				);
				if (!isFullDeploy) {
					logger.debug(
						`   • Targets: ${(deployTargets as string[]).join(", ")}`,
					);
				}
				logger.debug(
					`   • Debug Mode: ${flags.logLevel === "debug" ? "Enabled" : "Disabled"}`,
				);
				logger.debug(
					`   • Verbose Mode: ${flags.logLevel === "verbose" ? "Enabled" : "Disabled"}`,
				);
				logger.debug(
					`   • Dry-run: ${flags.dryRun ? "Enabled" : "Disabled"}`,
				);

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

				// Capture summary to log file
				logger.fileOnly(
					"info",
					`Deploy SUCCESS – app=${opts.app} duration=${deploymentDuration}ms zip=${context.zipBuffer?.length ?? 0}bytes`,
				);
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

				// Capture failure to log file
				logger.fileOnly(
					"error",
					`Deploy FAILURE – app=${opts.app} duration=${deploymentDuration}ms error=${err instanceof Error ? err.message : String(err)}`,
				);

				// log the error
				this.error(err);
			})
			.finally(async () => {
				await logger.close();
			});
	}
}
