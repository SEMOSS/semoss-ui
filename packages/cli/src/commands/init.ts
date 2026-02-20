import { Command, Flags } from "@oclif/core";
import { config } from "dotenv";
import Listr from "listr";
import * as fs from "node:fs";
import { Env, Insight } from "@semoss/sdk";
import type { Config } from "../types.js";
import {
	ensureSemossGitignore,
	initializeAndTestInsight,
} from "../utils/index.js";

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

		// path to the environment variables
		const envPath = flags.env ?? ".env";
		const envLocalPath = ".env.local";

		// Ensure .gitignore is updated before writing config
		ensureSemossGitignore(process.cwd());
		// path to the config (optional)
		const configPath = flags.config ?? "smss.json";

		// define the config
		let configOptions: Config | null = null;

		try {
			// load the env files
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

			// try to load the configOptions (optional)
			try {
				// load it
				configOptions = JSON.parse(
					fs.readFileSync(configPath, "utf8"),
				) as Config;
			} catch (_e) {
				// noop
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
				ACCESS_KEY: process.env.ACCESS_KEY,
				MODULE: fullModule,
				SECRET_KEY: process.env.SECRET_KEY,
				APP: process.env.APP,
			});
		} catch (error) {
			this.error(error as Error);
		}

		// throw the error
		const name = configOptions?.name ? configOptions.name : flags.name;
		if (!name) {
			throw new Error("Name is required");
		}

		// check the remaining environment variables
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

						let output = pixelReturn[0].output;
						let operationType = pixelReturn[0].operationType;

						if (operationType.indexOf("ERROR") > -1) {
							this.error(
								`Error creating index.html file: ${String(output)}`,
							); // log the error but don't throw, we still want to save the app even if the index file creation fails
						}

						output = pixelReturn[1].output;
						operationType = pixelReturn[1].operationType;

						if (operationType.indexOf("ERROR") > -1) {
							this.error(
								`Error committing index.html file: ${String(output)}`,
							); // log the error but don't throw, we still want to save the app even if the index file commit fails
						}
					}

					// save the new app ID to .env file(s)
					const envContent = `\nAPP=${context.APP}\n`;

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

					if (configOptions) {
						content = {
							...content,
							...configOptions,
							// Merge deploy config if it exists
							deploy: {
								batch: {
									...(configOptions.deploy?.batch || {}),
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

						return true;
					}
				},
			},
		]);

		tasks
			.run()
			.then((context) => {
				if (!context.APP) {
					throw new Error("Id Missing");
				}

				this.log("Success");
				this.log(`ID: ${context.APP}`);
			})
			.catch((err) => {
				// log the error
				this.error(err);
			});
	}
}
