import { Command, Flags, ux } from "@oclif/core";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Env, Insight } from "@semoss/sdk";
import type { Config } from "../types.js";
import {
	ensureSemossGitignore,
	getCurrentContext,
	initializeAndTestInsight,
	loadCredentials,
	loadGlobalConfig,
	saveCredentials,
	saveGlobalConfig,
} from "../utils/index.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Create extends Command {
	static args = {};

	static description = "Create a new SEMOSS app from template";

	static examples = [
		`<%= config.bin %> <%= command.id %> --name="My App"
create a new SEMOSS app named "My App" in current directory
`,
		`<%= config.bin %> <%= command.id %> -n="My App" -d="./my-app"
create in specific directory
`,
	];

	static flags = {
		name: Flags.string({
			char: "n",
			description: "Application name",
			required: false,
		}),
		directory: Flags.string({
			char: "d",
			description: "Target directory (defaults to current directory)",
			required: false,
		}),
		force: Flags.boolean({
			char: "f",
			description: "Overwrite if directory exists",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Create);

		const logger = new Logger({
			command: "create",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			// Prompt for app name if not provided
			let appName = flags.name;
			if (!appName) {
				appName = await ux.prompt("What is the name of your app?", {
					required: true,
				});
			}

			const targetDir =
				flags.directory || appName.toLowerCase().replace(/\s+/g, "-");
			const forceOverwrite = flags.force;

			// Resolve target directory path
			const absolutePath = path.resolve(targetDir);

			logger.debug(`Creating app "${appName}" at ${absolutePath}`);

			// Check if directory exists
			if (fs.existsSync(absolutePath) && !forceOverwrite) {
				this.error(
					`Directory "${targetDir}" already exists. Use --force to overwrite.`,
				);
			}

			// Get template path from CLI module location
			const __filename = fileURLToPath(import.meta.url);
			const __dirname = path.dirname(__filename);
			const templatePath = path.join(
				__dirname,
				"..",
				"..",
				"templates",
				"base-app",
			);

			if (!fs.existsSync(templatePath)) {
				this.error(
					"Template not found. Make sure the CLI is correctly installed.",
				);
			}

			try {
				// Create target directory
				if (!fs.existsSync(absolutePath)) {
					fs.mkdirSync(absolutePath, { recursive: true });
				}

				this.log(`📦 Creating new SEMOSS app: ${appName}`);
				this.log(`📁 Location: ${absolutePath}`);

				// Copy template files recursively
				this.copyTemplate(templatePath, absolutePath);

				// Update package.json with app name
				const packageJsonPath = path.join(absolutePath, "package.json");
				if (fs.existsSync(packageJsonPath)) {
					const packageJson = JSON.parse(
						fs.readFileSync(packageJsonPath, "utf-8"),
					);
					packageJson.name = appName
						.toLowerCase()
						.replace(/\s+/g, "-");
					packageJson.description = `A SEMOSS application - ${appName}`;
					fs.writeFileSync(
						packageJsonPath,
						JSON.stringify(packageJson, null, 2),
					);
				}

				this.log(`\n✅ App created successfully!\n`);
				logger.debug(`App "${appName}" created at ${absolutePath}`);

				// Check if global config has an active instance
				let context: ReturnType<typeof getCurrentContext> | null = null;
				try {
					context = getCurrentContext();
				} catch {
					// No global config available
				}

				if (context?.instance && context.instanceName) {
					// Global config exists with an active instance — auto-init
					this.log(
						`🔗 Active instance found: ${context.instanceName}`,
					);
					this.log(
						`   Automatically initializing app on server...\n`,
					);

					try {
						await this.initializeOnServer({
							appName,
							absolutePath,
							targetDir,
							instanceName: context.instanceName,
							instance: context.instance,
							logger,
						});
					} catch (error) {
						// Auto-init failed, fall back to manual steps
						logger.error(`Auto-init failed: ${error}`);
						this.log(
							`\n⚠️  Auto-initialization failed: ${error instanceof Error ? error.message : String(error)}`,
						);
						this.log(
							`   You can initialize manually with these steps:\n`,
						);
						this.logManualNextSteps(targetDir, appName);
					}
				} else {
					// No active instance — show manual next steps
					this.log(`🚀 Next steps:\n`);
					this.logManualNextSteps(targetDir, appName);
				}

				this.log(
					`📖 See README.md in the app directory for more information.`,
				);
			} catch (error) {
				logger.error(`App creation failed: ${error}`);
				this.error(`Failed to create app: ${error}`);
			}
		} finally {
			await logger.close();
		}
	}

	private copyTemplate(source: string, destination: string): void {
		const items = fs.readdirSync(source, { withFileTypes: true });

		// Directories and files to skip when copying template
		const skipItems = new Set([
			"node_modules",
			"dist",
			".turbo",
			".next",
			"build",
			".env",
			".env.local",
		]);

		for (const item of items) {
			if (skipItems.has(item.name)) {
				continue;
			}

			const sourcePath = path.join(source, item.name);
			const destPath = path.join(destination, item.name);

			if (item.isDirectory()) {
				fs.mkdirSync(destPath, { recursive: true });
				this.copyTemplate(sourcePath, destPath);
			} else {
				fs.copyFileSync(sourcePath, destPath);
			}
		}
	}

	/**
	 * Log manual next steps when auto-init is not available
	 */
	private logManualNextSteps(targetDir: string, appName: string): void {
		this.log(`   cd ${targetDir}`);
		this.log(`   pnpm install`);
		this.log(`   cp .env.example .env`);
		this.log(`   # Edit .env with your SEMOSS server details`);
		this.log(`   semoss init --name="${appName}"`);
		this.log(`   pnpm dev    # (optional) Start dev server`);
		this.log(`   semoss deploy\n`);
	}

	/**
	 * Initialize the app on the SEMOSS server and register in global config.
	 * This replicates the core init logic so users don't have to run it separately.
	 */
	private async initializeOnServer(options: {
		appName: string;
		absolutePath: string;
		targetDir: string;
		instanceName: string;
		instance: import("../types.js").InstanceConfig;
		logger: Logger;
	}): Promise<void> {
		const {
			appName,
			absolutePath,
			targetDir,
			instanceName,
			instance,
			logger,
		} = options;

		// Ensure .gitignore in the new app directory
		ensureSemossGitignore(absolutePath);

		// Set up SDK environment with instance credentials
		Env.update({
			ACCESS_KEY: instance.accessKey,
			MODULE: instance.module,
			SECRET_KEY: instance.secretKey,
		});

		// Initialize and test the connection
		const insight = new Insight();
		await initializeAndTestInsight(insight);

		// Create the project on the server
		this.log(`   📦 Creating project "${appName}" on server...`);
		const { pixelReturn: createReturn } = await insight.actions.run<
			[{ project_id: string }]
		>(
			`CreateProject(project=["${appName}"], portal=[true], projectType=["CODE"])`,
		);
		const appId = createReturn[0].output.project_id;
		logger.debug(`Project created on server with ID: ${appId}`);

		// Create default index.html on the server
		const newIndexFilePath = "version/assets/portals/index.html";
		const newIndexFileContent = `<html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${appName}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html>`;

		const saveIndexFilePixel = `
			SaveAsset(fileName=["${newIndexFilePath}"], content=["<encode>${newIndexFileContent}</encode>"], space=["${appId}"]);
			CommitAsset(filePath=["${newIndexFilePath}"], comment=["Initial index.html from create"], space=["${appId}"])
		`;

		const { pixelReturn: saveReturn } =
			await insight.actions.run(saveIndexFilePixel);

		if (
			saveReturn[0]?.operationType &&
			String(saveReturn[0].operationType).includes("ERROR")
		) {
			logger.warn(
				`Warning: Could not create index.html: ${String(saveReturn[0].output)}`,
			);
		}

		if (
			saveReturn[1]?.operationType &&
			String(saveReturn[1].operationType).includes("ERROR")
		) {
			logger.warn(
				`Warning: Could not commit index.html: ${String(saveReturn[1].output)}`,
			);
		}

		// Save smss.json in the new app directory
		const localConfig: Config = {
			app: appId,
			name: appName,
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
		const configPath = path.join(absolutePath, "smss.json");
		fs.writeFileSync(configPath, JSON.stringify(localConfig, null, 4));

		// Save APP to .env in the new app directory
		const envPath = path.join(absolutePath, ".env");
		const envExamplePath = path.join(absolutePath, ".env.example");

		if (fs.existsSync(envExamplePath)) {
			// Copy .env.example to .env and replace placeholders with real values
			let envContent = fs.readFileSync(envExamplePath, "utf-8");

			// Extract endpoint (host) and module path from the full URL
			const endpointMatch = instance.module.match(/^(https?:\/\/[^/]+)/);
			const endpoint = endpointMatch ? endpointMatch[1] : instance.module;
			const modulePath =
				instance.module.replace(endpoint, "") || "/Monolith";

			envContent = envContent.replace(
				/^ENDPOINT=.*$/m,
				`ENDPOINT=${endpoint}`,
			);
			envContent = envContent.replace(
				/^MODULE=.*$/m,
				`MODULE=${modulePath}`,
			);
			envContent = envContent.replace(
				/^ACCESS_KEY=.*$/m,
				`ACCESS_KEY=${instance.accessKey}`,
			);
			envContent = envContent.replace(
				/^SECRET_KEY=.*$/m,
				`SECRET_KEY=${instance.secretKey}`,
			);
			envContent = envContent.replace(/^APP=.*$/m, `APP=${appId}`);
			fs.writeFileSync(envPath, envContent);
		} else {
			fs.writeFileSync(envPath, `APP=${appId}\n`);
		}

		// Register app in global config (credentials store)
		const credentials = loadCredentials();
		if (credentials.instances[instanceName]) {
			if (!credentials.instances[instanceName].apps) {
				credentials.instances[instanceName].apps = {};
			}

			credentials.instances[instanceName].apps[appId] = {
				appId,
				name: appName,
				path: absolutePath,
			};
			saveCredentials(credentials);
		}

		// Set as current app in global config
		const globalConfig = loadGlobalConfig();
		globalConfig.currentApp = appId;
		saveGlobalConfig(globalConfig);

		this.log(`   ✅ App initialized on server`);
		this.log(`   📋 App ID: ${appId}\n`);
		this.log(`🚀 Next steps:\n`);
		this.log(`   cd ${targetDir}`);
		this.log(`   pnpm install`);
		this.log(`   pnpm dev    # Start dev server`);
		this.log(`   semoss deploy\n`);
	}
}
