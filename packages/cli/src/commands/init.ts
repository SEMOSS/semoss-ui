import { Command, Flags, ux } from "@oclif/core";
import Listr from "listr";
import * as fs from "node:fs";
import { Env, Insight } from "@semoss/sdk";
import type { AppConfig, Config } from "../types.js";
import {
	loadCredentials,
	loadGlobalConfig,
	saveCredentials,
	saveGlobalConfig,
} from "../utils/config.js";
import {
	ensureSemossGitignore,
	getConfiguration,
	initializeAndTestInsight,
} from "../utils/index.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Init extends Command {
	static description = "Initialize a new app";

	static examples = [
		`<%= config.bin %> <%= command.id %>
init (./src/commands/init.ts)
`,
	];

	static flags = {
		// environment variables
		env: Flags.string({
			char: "e",
			description: "Path to the environment variables. Default is .env",
		}),
		// name
		name: Flags.string({
			char: "n",
			description: "Name of the project",
		}),
		// config
		config: Flags.string({
			char: "c",
			description: "Path to the configuration. Default is smss.json",
		}),
		// project type
		type: Flags.string({
			char: "t",
			description: "Type of the project",
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Init);

		const logger = new Logger({
			command: "init",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			// Ensure .gitignore is updated before writing config
			ensureSemossGitignore(process.cwd());

			// path to the config (optional)
			const configPath = flags.config ?? "smss.json";

			// Get unified configuration from all sources
			const configResult = getConfiguration({
				configPath,
				envPath: flags.env,
			});

			if (configResult.source !== "none") {
				logger.debug(`Using config from ${configResult.source}`);
				this.log(`✓ Using configuration from ${configResult.source}`);
			}

			try {
				// Validate configuration
				if (!configResult.isValid) {
					this.error(
						`Invalid configuration:\n${configResult.errors.map((e) => `  - ${e}`).join("\n")}`,
					);
				}

				// Update Env with resolved configuration
				Env.update({
					ACCESS_KEY: configResult.accessKey || undefined,
					MODULE: configResult.module || undefined,
					SECRET_KEY: configResult.secretKey || undefined,
					APP: configResult.appId || undefined,
				});
			} catch (error) {
				this.error(error as Error);
			}

			// Get project name from config, flags, or prompt
			let name = configResult.appName ?? flags.name;
			if (!name) {
				name = await ux.prompt("What is the name of your app?", {
					required: true,
				});
			}

			logger.debug(
				`Initializing project "${name}" (type: ${flags.type ?? "CODE"})`,
			);

			// check the remaining environment variables
			if (!Env.ACCESS_KEY) {
				this.error(
					"ACCESS_KEY is required. Define one in your environment variables (.env) or connect to an instance first with 'semoss connect'",
				);
			}

			if (!Env.SECRET_KEY) {
				this.error(
					"SECRET_KEY is required. Define one in your environment variables (.env) or connect to an instance first with 'semoss connect'",
				);
			}

			if (Env.APP || process.env.VITE_APP) {
				this.error(
					"APP is already defined. Delete from your environment variables (.env) to create a new app",
				);
			}

			// create a new insight
			const insight = new Insight();

			// get the tasks
			const tasks = new Listr<{
				APP?: string;
			}>([
				{
					title: "Initializing",
					task: async () => {
						// Use shared helper for initialization and error handling
						await initializeAndTestInsight(insight);
						return true;
					},
				},
				{
					title: "Configuring App",
					task: async (context) => {
						// Load the insight classes
						const { pixelReturn } = await insight.actions.run<
							[{ project_id: string }]
						>(
							`CreateProject(project=["${name}"], portal=[true], projectType=["${flags.type ?? "CODE"}"])`,
						);
						// save the new app ID
						context.APP = pixelReturn[0].output.project_id;
						return true;
					},
				},
				{
					title: "Saving App",
					task: async (context) => {
						if (!context.APP) {
							throw new Error("No App");
						}

						// for code apps set a default index.html file with placeholder content
						if (flags.type === "CODE" || !flags.type) {
							// after the project is created run a pixel to create a new portals/index.html file
							// use the returned projectId

							const newIndexFilePath =
								"version/assets/portals/index.html";
							const newIndexFileContent = `<html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${name}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html>`;

							const saveIndexFilePixel = `
                    SaveAsset(fileName=["${newIndexFilePath}"], content=["<encode>${newIndexFileContent}</encode>"], space=["${context.APP}"]); 
                    CommitAsset(filePath=["${newIndexFilePath}"], comment=["Hardcoded comment from the App Page editor"], space=["${context.APP}"])
                `;

							const { pixelReturn } =
								await insight.actions.run(saveIndexFilePixel);

							const output0 = pixelReturn[0].output;
							const operationType0 = pixelReturn[0].operationType;

							if (operationType0.indexOf("ERROR") > -1) {
								// Log but don't throw — we still want to save the app
								this.log(
									`⚠️  Warning: Could not create index.html: ${String(output0)}`,
								);
							}

							const output1 = pixelReturn[1].output;
							const operationType1 = pixelReturn[1].operationType;

							if (operationType1.indexOf("ERROR") > -1) {
								// Log but don't throw — we still want to save the app
								this.log(
									`⚠️  Warning: Could not commit index.html: ${String(output1)}`,
								);
							}
						}

						// save the new app ID to .env file(s)
						const envContent = `\nAPP=${context.APP}\n`;

						// path to the environment variables
						const envPath = flags.env ?? ".env";
						const envLocalPath = ".env.local";

						// if custom env flag was provided, write only to that file
						if (flags.env) {
							fs.appendFileSync(envPath, envContent);
						} else {
							// otherwise, write to whichever file(s) exist
							const envExists = fs.existsSync(envPath);
							const envLocalExists = fs.existsSync(envLocalPath);

							if (envLocalExists) {
								// prefer .env.local if it exists (it overrides .env)
								fs.appendFileSync(envLocalPath, envContent);
							} else if (envExists) {
								// fallback to .env
								fs.appendFileSync(envPath, envContent);
							} else {
								// if neither exists, create .env.local (won't be committed)
								fs.appendFileSync(envLocalPath, envContent);
							}
						}

						// also save to config file
						let content: Config = {
							app: "",
							name: "",
							targets: [],
							ignore: [
								"node_modules/**",
								"**/.git/**",
								"**/*.local",
								"*.local",
								".semoss-backups/**",
								".semoss-deployments",
								"smss.json",
							],
							deploy: {
								batch: {},
							},
						};

						if (configResult.rawConfig) {
							content = {
								...content,
								...configResult.rawConfig,
								// Merge deploy config if it exists
								deploy: {
									batch: {
										...(configResult.rawConfig.deploy
											?.batch || {}),
										// Preserve any existing batch configs
										...(content.deploy.batch || {}),
									},
								},
							};

							// write it
							fs.writeFileSync(
								configPath,
								JSON.stringify(content, null, 4),
							);
						}

						// Also save to global config if connected to an instance
						if (configResult.instanceName) {
							const credentials = loadCredentials();
							const instance =
								credentials.instances[
									configResult.instanceName
								];

							if (instance) {
								// Ensure apps object exists
								if (!instance.apps) {
									instance.apps = {};
								}

								// Add or update the app
								const appConfig: AppConfig = {
									appId: context.APP,
									name: name,
									path: process.cwd(),
									targets: configResult.targets,
									ignore: configResult.ignore,
								};
								instance.apps[context.APP] = appConfig;

								// Save credentials
								saveCredentials(credentials);

								// Update current app in global config
								const globalConfig = loadGlobalConfig();
								globalConfig.currentApp = context.APP;
								saveGlobalConfig(globalConfig);
							}
						}

						return true;
					},
				},
			]);

			try {
				const context = await tasks.run();

				if (!context.APP) {
					throw new Error("Id Missing");
				}

				logger.debug(`Project created with ID: ${context.APP}`);
				this.log("Success");
				this.log(`ID: ${context.APP}`);
			} catch (err) {
				logger.error(
					`Init failed: ${err instanceof Error ? err.message : String(err)}`,
				);
				this.error(err as Error);
			}
		} finally {
			await logger.close();
		}
	}
}
