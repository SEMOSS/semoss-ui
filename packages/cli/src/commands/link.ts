import { Args, Command, Flags } from "@oclif/core";
import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { Env, Insight } from "@semoss/sdk";
import {
	getCurrentInstance,
	getCurrentInstanceName,
	loadCredentials,
	saveCredentials,
} from "../utils/config.js";
import { withSuppressedErrors } from "../utils/errors.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

/**
 * Load APP from .env.local or .env file
 */
function getAppFromEnv(): string | undefined {
	const cwd = process.cwd();

	// Check .env.local first (higher priority)
	const envLocalPath = path.join(cwd, ".env.local");
	if (fs.existsSync(envLocalPath)) {
		const result = dotenvConfig({ path: envLocalPath });
		if (result.parsed?.APP) return result.parsed.APP;
		if (result.parsed?.VITE_APP) return result.parsed.VITE_APP;
	}

	// Fall back to .env
	const envPath = path.join(cwd, ".env");
	if (fs.existsSync(envPath)) {
		const result = dotenvConfig({ path: envPath });
		if (result.parsed?.APP) return result.parsed.APP;
		if (result.parsed?.VITE_APP) return result.parsed.VITE_APP;
	}

	return undefined;
}

export default class Link extends Command {
	static description = "Link the current directory to a SEMOSS app";

	static examples = [
		"<%= config.bin %> <%= command.id %> APP123",
		"<%= config.bin %> <%= command.id %> APP123 --name my-dashboard",
		"<%= config.bin %> <%= command.id %>  # Uses APP from .env file",
	];

	static args = {
		appId: Args.string({
			description: "App ID to link to (defaults to APP from .env file)",
			required: false,
		}),
	};

	static flags = {
		name: Flags.string({
			char: "n",
			description: "Display name for the app",
		}),
		force: Flags.boolean({
			char: "f",
			description: "Overwrite existing smss.json if it exists",
			default: false,
		}),
		targets: Flags.string({
			char: "t",
			description:
				"Deployment targets (comma-separated, e.g., 'java,python')",
		}),
		ignore: Flags.string({
			char: "i",
			description: "Additional ignore patterns (comma-separated)",
		}),
		"pre-deploy": Flags.string({
			description: "Pre-deploy hook commands (comma-separated)",
		}),
		"post-deploy": Flags.string({
			description: "Post-deploy hook commands (comma-separated)",
		}),
	};

	public async run(): Promise<void> {
		const { args, flags } = await this.parse(Link);

		const logger = new Logger({
			command: "link",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			// Resolve appId from args or .env file
			const appId = args.appId || getAppFromEnv();

			if (!appId) {
				this.error(
					chalk.red("\n✗ No App ID provided.\n") +
						chalk.dim(
							"Provide an App ID as an argument or set APP in your .env file.",
						),
				);
			}

			logger.debug(`Linking app "${appId}" in ${process.cwd()}`);

			const instanceName = getCurrentInstanceName();
			const instance = getCurrentInstance();

			if (!instanceName || !instance) {
				logger.error("No active instance found");
				this.error(
					chalk.red("\n✗ No active instance found.\n") +
						chalk.dim(
							`Use ${chalk.cyan("semoss connect")} to add an instance first.`,
						),
				);
			}

			// Check if smss.json already exists
			const smssPath = path.join(process.cwd(), "smss.json");
			if (fs.existsSync(smssPath) && !flags.force) {
				this.error(
					chalk.red("\n✗ This directory is already linked.\n") +
						chalk.dim(
							`Use ${chalk.cyan("--force")} flag to overwrite.`,
						),
				);
			}

			// Validate app ID on server and look up app name
			let serverAppName: string | null = null;
			try {
				Env.update({
					MODULE: instance.module,
					ACCESS_KEY: instance.accessKey,
					SECRET_KEY: instance.secretKey,
				});

				const insight = new Insight();
				await withSuppressedErrors(() =>
					insight.initialize({ python: false }),
				);

				if (insight.isReady && insight.isAuthorized) {
					const { pixelReturn } =
						await insight.actions.run<
							[
								Array<{
									project_id: string;
									project_name: string;
								}>,
							]
						>("MyProjects()");
					const apps = pixelReturn[0].output;
					const matched = apps.find((a) => a.project_id === appId);
					if (matched) {
						serverAppName = matched.project_name;
					} else {
						this.log(
							chalk.yellow(
								`\n⚠️  App ID "${appId}" was not found on the server.`,
							),
						);
						this.log(
							chalk.dim(
								"   The ID may be incorrect, or you may not have access.\n",
							),
						);
					}
				}
			} catch {
				logger.debug(
					"Could not validate app ID on server — continuing with local-only link",
				);
			}

			// Use provided name, server name, or fall back to app ID
			const appName = flags.name || serverAppName || appId;

			// Parse deployment settings
			const targets = flags.targets
				? flags.targets.split(",").map((t) => t.trim())
				: undefined;
			const ignore = flags.ignore
				? flags.ignore.split(",").map((p) => p.trim())
				: undefined;
			const preDeploy = flags["pre-deploy"]
				? flags["pre-deploy"].split(",").map((c) => c.trim())
				: undefined;
			const postDeploy = flags["post-deploy"]
				? flags["post-deploy"].split(",").map((c) => c.trim())
				: undefined;

			// App config is persisted to the credential store below.
			// smss.json is no longer written; settings live in the per-instance
			// app registry inside the credential store.

			// Update instance's app registry with deployment settings
			const credentials = loadCredentials();
			if (!credentials.instances[instanceName].apps) {
				credentials.instances[instanceName].apps = {};
			}

			// biome-ignore lint/style/noNonNullAssertion: Apps object is initialized above
			credentials.instances[instanceName].apps![appId] = {
				appId: appId,
				name: appName,
				path: process.cwd(),
				...(targets && { targets }),
				...(ignore && { ignore }),
				...((preDeploy || postDeploy) && {
					hooks: {
						...(preDeploy && { preDeploy }),
						...(postDeploy && { postDeploy }),
					},
				}),
			};

			// Set as current app
			credentials.currentApp = appId;
			saveCredentials(credentials);

			logger.debug(
				`Linked app "${appName}" (${appId}) to instance "${instanceName}"`,
			);

			this.log(chalk.green.bold("\n✓ Directory linked successfully!\n"));
			this.log(chalk.dim(`App ID: ${appId}`));
			this.log(chalk.dim(`App Name: ${appName}`));
			this.log(chalk.dim(`Instance: ${instanceName}`));
			this.log(chalk.dim(`Directory: ${process.cwd()}`));
			if (targets) {
				this.log(chalk.dim(`Targets: ${targets.join(", ")}`));
			}
			if (ignore) {
				this.log(chalk.dim(`Ignore: ${ignore.join(", ")}`));
			}
			if (preDeploy || postDeploy) {
				this.log(chalk.dim("Hooks configured"));
			}
			this.log(
				chalk.dim(
					`\n💡 Use ${chalk.cyan("semoss deploy")} to deploy this app`,
				),
			);
		} finally {
			await logger.close();
		}
	}
}
