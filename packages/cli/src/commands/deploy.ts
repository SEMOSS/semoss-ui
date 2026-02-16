import { Command, Flags } from "@oclif/core";
import AdmZip from "adm-zip";
import { config } from "dotenv";
import { glob } from "glob";
import Listr from "listr";
import { File } from "node:buffer";
import * as fs from "node:fs";
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
	};

	private async loadConfig(
		configPath?: string,
	): Promise<Record<string, any> | null> {
		const resolvedPath = configPath || "smss.json";

		try {
			const content = await fs.promises.readFile(resolvedPath, "utf-8");
			return JSON.parse(content);
		} catch {
			return null;
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
			if (config?.deploy?.ignore && Array.isArray(config.deploy.ignore)) {
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

		// create a new insight
		const insight = new Insight();

		// get the tasks
		const tasks = new Listr<{
			result?: number;
			zipBuffer?: Buffer;
			deleteResult?: any;
			uploadResult?: any;
			url?: string;
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
				title: isFullDeploy
					? "Zipping Current Directory"
					: "Zipping Target Directories",
				task: async (context) => {
					const startTime = Date.now();

					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							`📦 Zipping ${isFullDeploy ? "current directory" : "target directories"}`,
							startTime,
						);
					}

					if (flags.superVerbose) {
						this.log(`🔍 Zip Details:`);
						this.log(`   • Current Directory: ${process.cwd()}`);
						this.log(`   • Working Directory: ${__dirname}`);
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
				title: isFullDeploy
					? "Deleting All Assets"
					: "Cleaning Target Assets",
				task: async (context) => {
					const startTime = Date.now();

					if (isFullDeploy) {
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
							const remotePath = `version/assets/${target}`;

							if (flags.verbose || flags.superVerbose) {
								this.log(`   🗑️ Deleting: ${remotePath}`);
							}

							const deleteCommand = `DeleteAsset(project="${Env.APP}", filePath="${remotePath}");`;

							try {
								const { pixelReturn } =
									await insight.actions.run(deleteCommand);

								if (flags.showRaw || flags.superVerbose) {
									this.log(
										`📊 DeleteAsset Response for ${target}: ${JSON.stringify(pixelReturn, null, 2)}`,
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
					}

					try {
						// Create a file from the zip buffer
						const fileName = isFullDeploy
							? "current-directory.zip"
							: `deploy-${(deployTargets as string[]).join("-")}.zip`;
						const file = new File(
							[context.zipBuffer],
							fileName,
						) as any;

						if (flags.superVerbose) {
							this.log(`🔍 File Details:`);
							this.log(`   • File Name: ${fileName}`);
							this.log(
								`   • File Size: ${context.zipBuffer.length} bytes`,
							);
							this.log(`   • File Type: ${typeof file}`);
						}

						this.log(`🔄 Starting upload of ${fileName}...`);
						// Upload the file
						const uploaded = await upload(
							file,
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

		tasks
			.run()
			.then((context) => {
				if (context.result === undefined) {
					throw new Error("Result Missing");
				}

				this.log("🎉 Success!");
				this.log(`🧮 1+1 Result: ${context.result}`);

				if (context.deleteResult !== undefined) {
					this.log(`🗑️ DeleteAsset Result: ${context.deleteResult}`);
				}

				if (context.uploadResult !== undefined) {
					this.log(
						`📤 Upload Result: ${context.uploadResult.fileName}`,
					);
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
						this.log(
							`   • Upload result: ${context.uploadResult.fileName}`,
						);
					}

					if (!isFullDeploy) {
						this.log(
							`   • Deployment type: Targeted (${(deployTargets as string[]).join(", ")})`,
						);
					}
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
				}
			})
			.catch((err) => {
				// log the error
				this.error(err);
			});
	}
}
