import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import { Env, Insight } from "@semoss/sdk";
import { getCurrentInstanceName, resolveCredentials } from "../utils/config.js";
import {
	formatConnectionError,
	withSuppressedErrors,
} from "../utils/errors.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Apps extends Command {
	static description =
		"List all apps available on the current SEMOSS instance";

	static examples = [
		"<%= config.bin %> <%= command.id %>",
		"<%= config.bin %> <%= command.id %> --json",
	];

	static flags = {
		json: Flags.boolean({
			char: "j",
			description: "Output as JSON",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Apps);

		const logger = new Logger({
			command: "apps",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			const resolved = resolveCredentials();
			const instanceName = getCurrentInstanceName();
			logger.debug(
				`Listing apps (instance: ${instanceName ?? "none"}, source: ${resolved.source})`,
			);

			if (
				!resolved.module ||
				!resolved.accessKey ||
				!resolved.secretKey
			) {
				logger.error("No credentials found for apps listing");
				this.error(
					chalk.red("\n✗ No credentials found.\n") +
						chalk.dim(
							`Use ${chalk.cyan("semoss connect")} to add an instance.`,
						),
				);
			}

			const spinner = flags.json
				? null
				: ora("Fetching apps from server...").start();

			try {
				// Update environment
				logger.debug("Initializing Insight for MyProjects() reactor");
				Env.update({
					MODULE: resolved.module,
					ACCESS_KEY: resolved.accessKey,
					SECRET_KEY: resolved.secretKey,
				});

				// Initialize insight
				const insight = new Insight();
				await withSuppressedErrors(() =>
					insight.initialize({ python: false }),
				);

				if (insight.error) {
					throw insight.error;
				} else if (!insight.isAuthorized) {
					throw new Error("Authentication failed");
				} else if (!insight.isReady) {
					throw new Error("Server connection failed");
				}

				// Get list of apps using MyProjects reactor
				const { pixelReturn } =
					await insight.actions.run<
						[
							Array<{
								project_id: string;
								project_name: string;
								project_global: boolean;
								project_discoverable?: boolean;
							}>,
						]
					>("MyProjects()");

				const apps = pixelReturn[0].output;

				logger.debug(`MyProjects() returned ${apps.length} apps`);

				if (spinner) spinner.succeed(`Found ${apps.length} apps`);

				if (flags.json) {
					this.log(
						JSON.stringify(
							{
								instance: instanceName,
								server: resolved.module,
								apps: apps.map((app) => ({
									id: app.project_id,
									name: app.project_name,
									global: app.project_global,
									discoverable:
										app.project_discoverable || false,
								})),
							},
							null,
							2,
						),
					);
					return;
				}

				// Visual output
				if (apps.length === 0) {
					this.log(chalk.yellow("\n⚠️  No apps found.\n"));
					return;
				}

				this.log(
					chalk.bold.cyan(
						`\n📱 Apps on ${instanceName || "server"}\n`,
					),
				);

				const table = new Table({
					head: [
						chalk.cyan("Name"),
						chalk.cyan("App ID"),
						chalk.cyan("Scope"),
					],
					style: {
						head: [],
						border: ["dim"],
					},
					colWidths: [35, 40, 15],
				});

				for (const app of apps) {
					const scope = app.project_global
						? chalk.blue("Global")
						: chalk.dim("Private");

					table.push([app.project_name, app.project_id, scope]);
				}

				this.log(table.toString());
				this.log(
					chalk.dim(
						`\n💡 Use ${chalk.cyan("semoss link <app-id>")} to link an app to this directory`,
					),
				);
				this.log("");
			} catch (error) {
				const { message, suggestions } = formatConnectionError(error);
				if (spinner) spinner.fail("Failed to fetch apps");
				logger.error(`Apps listing failed: ${message}`);
				let errorMsg = `\n✗ ${message}\n`;
				if (suggestions.length > 0) {
					errorMsg += "\n💡 Suggestions:";
					for (const suggestion of suggestions) {
						errorMsg += `\n   • ${suggestion}`;
					}
					errorMsg += "\n";
				}
				this.error(errorMsg);
			}
		} finally {
			await logger.close();
		}
	}
}
