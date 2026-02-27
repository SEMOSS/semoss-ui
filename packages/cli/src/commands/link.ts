import { Args, Command, Flags } from "@oclif/core";
import chalk from "chalk";
import * as fs from "node:fs";
import * as path from "node:path";
import {
	getCurrentInstance,
	getCurrentInstanceName,
	loadCredentials,
	saveCredentials,
} from "../utils/config.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Link extends Command {
	static description = "Link the current directory to a SEMOSS app";

	static examples = [
		"<%= config.bin %> <%= command.id %> APP123",
		"<%= config.bin %> <%= command.id %> APP123 --name my-dashboard",
	];

	static args = {
		appId: Args.string({
			description: "App ID to link to",
			required: true,
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
			logger.debug(`Linking app "${args.appId}" in ${process.cwd()}`);

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

			// Use provided name or app ID
			const appName = flags.name || args.appId;

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
			credentials.instances[instanceName].apps![appName] = {
				appId: args.appId,
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

			saveCredentials(credentials);

			logger.debug(
				`Linked app "${appName}" (${args.appId}) to instance "${instanceName}"`,
			);

			this.log(chalk.green.bold("\n✓ Directory linked successfully!\n"));
			this.log(chalk.dim(`App ID: ${args.appId}`));
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
