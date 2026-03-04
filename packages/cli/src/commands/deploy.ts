import { Command, Flags } from "@oclif/core";
import AdmZip from "adm-zip";
import { config } from "dotenv";
import { glob } from "glob";
import Listr from "listr";
import { File } from "node:buffer";
import * as fs from "node:fs";
import * as path from "node:path";
import { Env, Insight, upload } from "@semoss/sdk";

export default class Deploy extends Command {
	static args = {};

	static description = "Deploy an existing app";

	static examples = [
		`<%= config.bin %> <%= command.id %>
deploy (./src/commands/deploy.ts)
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
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Deploy);

		// Enable debug logging if flag is set
		if (flags.debug) {
			process.env.DEBUG = "oclif*,@semoss/cli*";
		}

		// path to the environment variables
		const envPath = flags.env ?? ".env";

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
			this.log(`   • APP: ${Env.APP || "Not set"}`);
			this.log(
				`   • ACCESS_KEY: ${Env.ACCESS_KEY ? "***" + Env.ACCESS_KEY.slice(-4) : "Not set"}`,
			);
			this.log(
				`   • SECRET_KEY: ${Env.SECRET_KEY ? "***" + Env.SECRET_KEY.slice(-4) : "Not set"}`,
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
			// load the env
			config({ path: envPath });

			// update the environment
			Env.update({
				APP: process.env.APP,
				ACCESS_KEY: process.env.ACCESS_KEY,
				MODULE: process.env.MODULE,
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
				title: "Zipping Current Directory",
				task: async (context) => {
					const startTime = Date.now();

					if (flags.verbose || flags.superVerbose) {
						logWithTiming(
							`📦 Zipping current directory`,
							startTime,
						);
					}

					if (flags.superVerbose) {
						this.log(`🔍 Zip Details:`);
						this.log(`   • Current Directory: ${process.cwd()}`);
						this.log(`   • Working Directory: ${__dirname}`);
					}

					try {
						// Get all files in current directory (similar to deploy.ts)
						const paths = await glob("**/*", {
							ignore: ["node_modules/**"],
						});

						if (flags.verbose || flags.superVerbose) {
							logWithTiming(
								`📁 Found ${paths.length} files to zip`,
								startTime,
							);
						}

						if (flags.superVerbose) {
							this.log(`📋 Files to include:`);
							paths
								.slice(0, 10)
								.forEach((p) => this.log(`   • ${p}`));
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
				title: "Running DeleteAsset Reactor",
				task: async (context) => {
					const startTime = Date.now();

					// Deletes all assets in version/assets/
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

					// Run the DeleteAsset reactor
					const { pixelReturn } =
						await insight.actions.run(deleteCommand);

					// save the delete result
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
						const fileName = "current-directory.zip";
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
							`UnzipFile(filePath=["version/assets/${uploaded[0].fileName}"], space=["${Env.APP}"])`,
						);

						// Clean up the zip file
						await insight.actions.run(
							`DeleteAsset(filePath=["version/assets/${uploaded[0].fileName}"], space=["${Env.APP}"])`,
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
