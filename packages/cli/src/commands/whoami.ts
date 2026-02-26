import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import ora from "ora";
import { Env, Insight } from "@semoss/sdk";
import { getCurrentInstanceName, resolveCredentials } from "../utils/config.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Whoami extends Command {
	static description = "Show current user information from SEMOSS server";

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
		const { flags } = await this.parse(Whoami);

		const logger = new Logger({
			command: "whoami",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			const resolved = resolveCredentials();
			const instanceName = getCurrentInstanceName();
			logger.debug(
				`Querying user info (instance: ${instanceName ?? "none"}, source: ${resolved.source})`,
			);

			if (
				!resolved.module ||
				!resolved.accessKey ||
				!resolved.secretKey
			) {
				logger.error("No credentials found");
				this.error(
					chalk.red("\n✗ No credentials found.\n") +
						chalk.dim(
							`Use ${chalk.cyan("@semoss/cli connect")} to add an instance.`,
						),
				);
			}

			const spinner = flags.json
				? null
				: ora("Connecting to SEMOSS...").start();

			try {
				// Update environment
				logger.debug("Initializing Insight for MyInfo() reactor");
				Env.update({
					MODULE: resolved.module,
					ACCESS_KEY: resolved.accessKey,
					SECRET_KEY: resolved.secretKey,
				});

				// Initialize insight
				const insight = new Insight();
				await insight.initialize({ python: false });

				if (insight.error) {
					throw insight.error;
				} else if (!insight.isAuthorized) {
					throw new Error("Authentication failed");
				} else if (!insight.isReady) {
					throw new Error("Server connection failed");
				}

				if (spinner) spinner.succeed("Connected");

				// Get user info using MyInfo reactor
				const { pixelReturn } =
					await insight.actions.run<
						[
							{
								id: string;
								name: string;
								email: string;
								admin: boolean;
							},
						]
					>("MyInfo()");

				const userInfo = pixelReturn[0].output;

				logger.debug(
					`User info retrieved: ${userInfo.id} (admin: ${userInfo.admin})`,
				);

				if (flags.json) {
					this.log(
						JSON.stringify(
							{
								user: userInfo,
								instance: instanceName,
								server: resolved.module,
								source: resolved.source,
							},
							null,
							2,
						),
					);
					return;
				}

				// Visual output
				this.log(chalk.bold.cyan("\n👤 User Information\n"));
				this.log(chalk.bold("User ID:"), userInfo.id);
				if (userInfo.name) {
					this.log(chalk.bold("Name:"), userInfo.name);
				}
				if (userInfo.email) {
					this.log(chalk.bold("Email:"), userInfo.email);
				}
				this.log(
					chalk.bold("Admin:"),
					userInfo.admin ? chalk.green("Yes") : chalk.dim("No"),
				);

				this.log(chalk.bold("\nConnection:"));
				if (instanceName) {
					this.log(chalk.dim(`Instance: ${instanceName}`));
				}
				this.log(chalk.dim(`Server: ${resolved.module}`));
				this.log(
					chalk.dim(
						`Source: ${resolved.source === "env" ? "Environment variables" : "Global config"}`,
					),
				);
				this.log("");
			} catch (error) {
				if (spinner) spinner.fail("Connection failed");
				logger.error(
					`Whoami failed: ${error instanceof Error ? error.message : String(error)}`,
				);
				this.error(
					chalk.red(
						`\n✗ ${error instanceof Error ? error.message : String(error)}`,
					),
				);
			}
		} finally {
			await logger.close();
		}
	}
}
