import { Command, Flags } from "@oclif/core";
import AdmZip from "adm-zip";
import { config } from "dotenv";
import { glob } from "glob";
import Listr from "listr";
import * as fs from "node:fs";
import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import { Env, Insight, upload } from "@semoss/sdk";

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
		// debug flag
		debug: Flags.boolean({
			char: "d",
			description: "Enable debug logging",
		}),
		// verbose flag
		verbose: Flags.boolean({
			char: "v",
			description: "Enable verbose output",
		}),
		// breakpoint flag
		breakpoint: Flags.boolean({
			char: "b",
			description: "Add debugger breakpoint for debugging",
		}),
		// super verbose flag
		superVerbose: Flags.boolean({
			char: "s",
			description:
				"Enable super verbose output (includes all debug info)",
		}),
		// show environment flag
		showEnv: Flags.boolean({
			description: "Show environment variables (without sensitive data)",
		}),
		// show timing flag
		showTiming: Flags.boolean({
			description: "Show timing information for each step",
		}),
		// show raw data flag
		showRaw: Flags.boolean({
			description: "Show raw data from all operations",
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
				"Deploy to multiple modules/apps. Provide comma-separated list or 'all'",
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
							const responseBody =
								Buffer.concat(chunks).toString("utf-8");
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
						const buffer = Buffer.concat(chunks);

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
							buffer.buffer.slice(
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
				`ExportProjectApp(project=['${Env.APP}']);`,
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
					Env.MODULE
				}/api/engine/downloadFile?insightId=${insight.insightId}&fileKey=${encodeURIComponent(
					output,
				)}`;

				// Download using http/https (Node.js approach)
				let downloadResult: ArrayBuffer;
				try {
					downloadResult = await this.downloadWithHttp(
						downloadUrl,
						Env.ACCESS_KEY || "",
						Env.SECRET_KEY || "",
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

					if (debugMode) {
						this.log(`📦 Added assets to backup.zip at root level`);
					}
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
						app: Env.APP,
						module: Env.MODULE,
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

	private async logDeploymentHistory(deployRecord: {
		timestamp: string;
		targets: string[] | "all";
		status: "success" | "failure" | "dry-run";
		zipSize?: number;
		duration?: number;
		backupDir?: string;
		rollback?: boolean;
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
				timestamp: new Date().toISOString(),
				app: Env.APP,
				module: Env.MODULE,
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

		try {
			const content = await fs.promises.readFile(historyFile, "utf-8");
			const history = JSON.parse(content) as Array<{
				backupDir?: string;
				status: string;
				timestamp: string;
			}>;

			// Find the most recent successful deployment with a backup
			const backupRecord = history
				.reverse()
				.find(
					(record) =>
						record.status === "success" &&
						record.backupDir &&
						record.backupDir !== null,
				);

			if (!backupRecord || !backupRecord.backupDir) {
				throw new Error("No previous backup found for rollback");
			}

			return backupRecord.backupDir;
		} catch (error) {
			throw new Error(`Rollback failed: ${error}`);
		}
	}

	private getDeployTargets(flags: {
		target?: string | string[];
	}): string[] | "all" {
		if (
			!flags.target ||
			(Array.isArray(flags.target) && flags.target.length === 0)
		) {
			return "all";
		}

		return Array.isArray(flags.target) ? flags.target : [flags.target];
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

		// Handle rollback - store backup path but continue to setup
		let rollbackBackupDir: string | undefined;
		if (flags.rollback) {
			try {
				this.log("🔄 Rolling back to previous deployment...");
				rollbackBackupDir = await this.rollbackToPrevious();
				this.log(`📦 Using backup from: ${rollbackBackupDir}`);
			} catch (error) {
				this.error(`Rollback failed: ${error}`);
			}
		}

		// Enable debug logging if flag is set
		if (flags.debug) {
			process.env.DEBUG = "oclif*,@semoss/cli*";
		}

		// path to the environment variables
		const envPath = flags.env ?? ".env";
		const envLocalPath = ".env.local";

		// Helper function to log with timing
		const logWithTiming = (message: string, startTime?: number) => {
			if (flags.showTiming && startTime) {
				const elapsed = Date.now() - startTime;
				this.log(`⏱️ [${elapsed}ms] ${message}`);
			} else {
				this.log(message);
			}
		};

		if (flags.verbose || flags.superVerbose) {
			this.log("🔍 Debug mode enabled");
			this.log(`📁 Environment file: ${envPath}`);
		}

		if (flags.showEnv) {
			this.log("\n🌍 Environment Variables:");
			this.log(`   • MODULE: ${Env.MODULE || "Not set"}`);
			this.log(
				`   • APP: ${Env.APP || process.env.VITE_APP || "Not set"}`,
			);
			this.log(
				`   • ACCESS_KEY: ${Env.ACCESS_KEY ? `***${Env.ACCESS_KEY.slice(-4)}` : "Not set"}`,
			);
			this.log(
				`   • SECRET_KEY: ${Env.SECRET_KEY ? `***${Env.SECRET_KEY.slice(-4)}` : "Not set"}`,
			);
		}

		if (flags.superVerbose) {
			this.log("\n🔬 Super Verbose Mode Enabled:");
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
			// if custom env path is provided, use only that
			// otherwise, load .env first, then .env.local (which overrides .env values)
			if (flags.env) {
				config({ path: envPath });
			} else {
				config({ path: envPath }); // load .env
				if (fs.existsSync(envLocalPath)) {
					config({ path: envLocalPath, override: true }); // load .env.local with override
				}
			}

			// validate and construct the full module URL
			const endpoint = process.env.ENDPOINT;
			const modulePath = process.env.MODULE;

			if (!endpoint) {
				this.error(
					"ENDPOINT is required. Define one in your environment variables (.env)",
				);
			}

			if (!modulePath) {
				this.error(
					"MODULE is required. Define one in your environment variables (.env)",
				);
			}

			// construct the full module URL
			const fullModule = `${endpoint}${modulePath}`;

			// update the environment
			Env.update({
				APP: process.env.APP || process.env.VITE_APP,
				ACCESS_KEY: process.env.ACCESS_KEY,
				MODULE: fullModule,
				SECRET_KEY: process.env.SECRET_KEY,
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

		// Load config file for ignore patterns
		let mergedIgnorePatterns = [...DEFAULT_IGNORE];
		try {
			const config = await this.loadConfig(flags.config);
			if (
				config &&
				typeof config === "object" &&
				"deploy" in config &&
				typeof config.deploy === "object" &&
				config.deploy !== null &&
				"ignore" in config.deploy &&
				Array.isArray(config.deploy.ignore)
			) {
				mergedIgnorePatterns = [
					...DEFAULT_IGNORE,
					...config.deploy.ignore,
				];
				if (flags.debug) {
					this.log(`📋 Merged ignore patterns from smss.json`);
				}
			}
		} catch (error) {
			if (flags.verbose) {
				this.log(`⚠️  Could not load config: ${error}`);
			}
		}

		// Determine deployment targets
		const deployTargets = this.getDeployTargets(flags);
		const isFullDeploy = deployTargets === "all";

		if (flags.debug) {
			if (!isFullDeploy) {
				this.log(
					`🎯 Deployment targets: ${(deployTargets as string[]).join(", ")}`,
				);
			} else {
				this.log("🎯 Deployment mode: Full deployment");
			}
		}

		// Handle dry-run mode
		if (flags.dryRun) {
			this.log("🔍 DRY-RUN MODE: No actual deployment will occur");
		}

		// create a new insight
		const insight = new Insight();

		// get the tasks
		const tasks = new Listr<{
			result?: number;
			zipBuffer?: Buffer;
			deleteResult?: unknown;
			uploadResult?: unknown;
			url?: string;
			backupDir?: string;
		}>([
			{
				title: "Initializing",
				task: async () => {
					const startTime = Date.now();

					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							"🔧 Initializing Semoss Insight...",
							startTime,
						);
					}

					// initialize the insight
					await insight.initialize({
						python: false,
					});

					if (flags.superVerbose) {
						logWithTiming(`📊 Insight Status:`, startTime);
						this.log(`   • Error: ${insight.error || "None"}`);
						this.log(`   • Authorized: ${insight.isAuthorized}`);
						this.log(`   • Ready: ${insight.isReady}`);
						this.log(`   • Insight ID: Available`);
					}

					if (insight.error) {
						throw insight.error;
					} else if (!insight.isAuthorized) {
						throw new Error("User is not Authorized");
					} else if (!insight.isReady) {
						throw new Error("Error initializing model");
					}

					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							"✅ Insight initialized successfully",
							startTime,
						);
					}

					return true;
				},
			},
			{
				title: "Running Reactor 1+1",
				task: async (context) => {
					const startTime = Date.now();

					if (flags.verbose || flags.superVerbose) {
						logWithTiming("🧮 Executing: 1+1", startTime);
					}

					// Run the reactor 1+1
					const { pixelReturn } =
						await insight.actions.run<[number]>(`1+1`);

					if (flags.showRaw || flags.superVerbose) {
						logWithTiming(
							`📊 Raw pixelReturn: ${JSON.stringify(pixelReturn, null, 2)}`,
							startTime,
						);
					}

					// save the result
					context.result = pixelReturn[0].output;

					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							`✅ 1+1 Result: ${context.result}`,
							startTime,
						);
					}

					if (flags.superVerbose) {
						this.log(`🔍 Detailed Analysis:`);
						this.log(`   • Input: 1+1`);
						this.log(`   • Output Type: ${typeof context.result}`);
						this.log(`   • Output Value: ${context.result}`);
						this.log(
							`   • Execution Time: ${Date.now() - startTime}ms`,
						);
					}

					return true;
				},
			},
			{
				title: "Creating Backup from server",
				enabled: () => !flags.dryRun && !flags.rollback,
				task: async (context) => {
					const startTime = Date.now();

					if (flags.verbose || flags.superVerbose) {
						logWithTiming("💾 Creating backup", startTime);
					}

					try {
						const backup = await this.createBackup(
							deployTargets,
							insight,
							flags.debug,
						);
						context.backupDir = backup.backupDir;

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`✅ Backup created: ${backup.backupDir}`,
								startTime,
							);
						}
					} catch (error) {
						// Always log backup failures to warn users
						this.log(`⚠️  Backup creation failed: ${error}`);
						this.log(
							`📝 Note: Deployment will continue without backup. Backups help with recovery.`,
						);
						if (
							flags.debug ||
							flags.verbose ||
							flags.superVerbose
						) {
							this.log(
								`🔍 Debug info: Check that ExportProjectApp reactor returns a valid downloadable file.`,
							);
						}
					}

					return true;
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

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`📦 Loading backup file: ${backupZipPath}`,
								startTime,
							);
						}

						try {
							const zipBuffer =
								await fs.promises.readFile(backupZipPath);
							context.zipBuffer = zipBuffer;

							if (flags.verbose || flags.superVerbose) {
								logWithTiming(
									`✅ Backup loaded (${zipBuffer.length} bytes)`,
									startTime,
								);
							}
						} catch (error) {
							if (flags.verbose || flags.superVerbose) {
								logWithTiming(
									`❌ Failed to load backup: ${error}`,
									startTime,
								);
							}
							throw error;
						}

						return true;
					}

					// Normal zipping logic for deploy
					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							`📦 Zipping ${isFullDeploy ? "current directory" : "target directories"}`,
							startTime,
						);
					}

					if (flags.superVerbose) {
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

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`📁 Found ${paths.length} files to zip`,
								startTime,
							);
						}

						if (flags.superVerbose) {
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
												flags.verbose ||
												flags.superVerbose
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
						context.zipBuffer =
							(await zip.toBufferPromise()) || "NOT ANYTHING";

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`✅ Zip created successfully (${context.zipBuffer.length} bytes)`,
								startTime,
							);
						}

						if (flags.superVerbose) {
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
						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`❌ Zip creation failed: ${error}`,
								startTime,
							);
						}
						throw error;
					}

					return true;
				},
			},
			{
				title:
					rollbackBackupDir || isFullDeploy
						? "Deleting All Assets"
						: "Cleaning Target Assets",
				enabled: () => !flags.dryRun,
				task: async (context) => {
					const startTime = Date.now();

					if (rollbackBackupDir || isFullDeploy) {
						const deleteCommand = `DeleteAppAssets(project="${Env.APP}")`;

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`🗑️ Executing: ${deleteCommand}`,
								startTime,
							);
						}

						if (flags.superVerbose) {
							this.log(`🔍 Delete Details:`);
							this.log(`   • Command: ${deleteCommand}`);
							this.log(`   • Target Path: version/assets/`);
							this.log(`   • Target App: ${Env.APP}`);
						}

						const { pixelReturn } =
							await insight.actions.run(deleteCommand);

						context.deleteResult = pixelReturn[0].output;

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`✅ DeleteAsset Result: ${context.deleteResult}`,
								startTime,
							);
						}

						if (flags.superVerbose) {
							this.log(`🔍 Delete Analysis:`);
							this.log(`   • Result: ${context.deleteResult}`);
							this.log(
								`   • Result Type: ${typeof context.deleteResult}`,
							);
							this.log(
								`   • Execution Time: ${Date.now() - startTime}ms`,
							);
						}
					} else {
						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`🗑️ Deleting target-specific assets...`,
								startTime,
							);
						}

						for (const target of deployTargets as string[]) {
							const remotePath = `${target}`;

							if (flags.verbose || flags.superVerbose) {
								this.log(`   🗑️ Deleting: ${remotePath}`);
							}

							const deleteCommand = `DeleteAppAssets(project="${Env.APP}", filePath="${remotePath}");`;

							try {
								const { pixelReturn } =
									await insight.actions.run(deleteCommand);

								if (flags.showRaw || flags.superVerbose) {
									this.log(
										`📊 DeleteAppAssets Response for ${target}: ${JSON.stringify(pixelReturn, null, 2)}`,
									);
								}
							} catch (error) {
								if (flags.verbose || flags.superVerbose) {
									this.warn(
										`⚠️ Warning deleting ${remotePath}: ${error}`,
									);
								}
							}
						}

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`✅ Target assets deleted`,
								startTime,
							);
						}

						context.deleteResult = "target-assets-deleted";
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
						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								"⏭️ No zip buffer to upload, skipping upload step",
								startTime,
							);
						}
						return true;
					}

					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							"📤 Uploading zipped directory to the server",
							startTime,
						);
					}

					if (flags.superVerbose) {
						this.log(`🔍 Upload Details:`);
						this.log(
							`   • Zip Buffer Size: ${context.zipBuffer.length} bytes`,
						);
						this.log(`   • Target App: ${Env.APP}`);
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

						if (flags.superVerbose) {
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
						this.log(
							`🔍 [DEBUG] Before upload - insight.insightId: ${insight.insightId}`,
						);

						// Upload the file
						const uploaded = await upload(
							file as unknown as File | File[],
							insight.insightId,
							Env.APP,
							"version/assets",
						);

						this.log(
							`✅ Upload of ${fileName} completed., ${JSON.stringify(uploaded)}`,
						);

						if (flags.showRaw || flags.superVerbose) {
							logWithTiming(
								`📊 Upload result: ${JSON.stringify(uploaded, null, 2)}`,
								startTime,
							);
						}

						// Unzip the uploaded file
						await insight.actions.run(
							`UnzipFile(filePath=["/${uploaded[0].fileName}"], space=["${Env.APP}"])`,
						);

						// Clean up the zip file
						await insight.actions.run(
							`DeleteAppAssets(filePath=["/${uploaded[0].fileName}"], project=["${Env.APP}"])`,
						);

						context.uploadResult = uploaded[0];

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`✅ Upload completed: ${uploaded[0].fileName}`,
								startTime,
							);
						}

						if (flags.superVerbose) {
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
						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
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
				task: async () => {
					// Load the insight classes
					await insight.actions.run(
						`ReloadInsightClasses(project='${Env.APP}', release=true);`,
					);

					return true;
				},
			},
			{
				title: "Publishing App",
				task: async (context) => {
					// Publish the app
					const { pixelReturn } = await insight.actions.run<[string]>(
						`PublishProject(project='${Env.APP}', release=true);`,
					);

					// save the url
					context.url = pixelReturn[0].output;

					return true;
				},
			},
		]);

		// Track deployment start time
		const deploymentStartTime = Date.now();

		tasks
			.run()
			.then((context) => {
				const deploymentDuration = Date.now() - deploymentStartTime;

				if (context.result === undefined) {
					throw new Error("Result Missing");
				}

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
				this.log(`🧮 1+1 Result: ${context.result}`);

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

				if (flags.verbose || flags.superVerbose) {
					this.log("\n📋 Summary:");
					this.log(`   • 1+1 calculation: ${context.result}`);
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

				if (flags.superVerbose) {
					this.log("\n🔬 Super Verbose Summary:");
					this.log(`   • Total Operations: 5`);
					this.log(
						`   • Successful Operations: ${
							[
								context.result !== undefined,
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
						`   • Debug Mode: ${flags.debug ? "Enabled" : "Disabled"}`,
					);
					this.log(
						`   • Verbose Mode: ${flags.verbose ? "Enabled" : "Disabled"}`,
					);
					this.log(
						`   • Super Verbose: ${flags.superVerbose ? "Enabled" : "Disabled"}`,
					);
					this.log(
						`   • Show Raw Data: ${flags.showRaw ? "Enabled" : "Disabled"}`,
					);
					this.log(
						`   • Show Timing: ${flags.showTiming ? "Enabled" : "Disabled"}`,
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
				});

				// log the error
				this.error(err);
			});
	}
}
