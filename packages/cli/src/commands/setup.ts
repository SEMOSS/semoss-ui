import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import inquirer from "inquirer";
import { Env, Insight } from "@semoss/sdk";
import {
	getConfigDir,
	loadCredentials,
	saveCredentials,
} from "../utils/config.js";
import { formatConnectionError } from "../utils/errors.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Setup extends Command {
	static description =
		"Interactive setup wizard for first-time SEMOSS CLI configuration";

	static examples = ["<%= config.bin %> <%= command.id %>"];

	static flags = {
		force: Flags.boolean({
			char: "f",
			description: "Force setup even if already configured",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Setup);

		const logger = new Logger({
			command: "setup",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			logger.debug(`Setup wizard started (force: ${flags.force})`);

			// Check if already set up
			let credentials = loadCredentials();
			if (Object.keys(credentials.instances).length > 0 && !flags.force) {
				logger.debug("Already configured, skipping setup");
				this.log(chalk.yellow("\n⚠️  CLI is already configured.\n"));
				this.log(
					chalk.dim(
						`Use ${chalk.cyan("semoss instances")} to see your instances.`,
					),
				);
				this.log(
					chalk.dim(
						`Use ${chalk.cyan("semoss setup --force")} to run setup again.\n`,
					),
				);
				return;
			}

			// Welcome message
			this.log(
				chalk.bold.cyan(
					"\n╔═══════════════════════════════════════════════╗",
				),
			);
			this.log(
				chalk.bold.cyan(
					"║                                               ║",
				),
			);
			this.log(
				chalk.bold.cyan(
					"║       Welcome to SEMOSS CLI Setup! 🚀        ║",
				),
			);
			this.log(
				chalk.bold.cyan(
					"║                                               ║",
				),
			);
			this.log(
				chalk.bold.cyan(
					"╚═══════════════════════════════════════════════╝",
				),
			);
			this.log();
			this.log(
				chalk.white(
					"This wizard will help you connect to your SEMOSS instance.",
				),
			);
			this.log(
				chalk.dim(
					"Configuration will be stored in: " +
						chalk.cyan(getConfigDir()),
				),
			);
			this.log();

			// Ask if they want to proceed
			const { proceed } = await inquirer.prompt([
				{
					type: "confirm",
					name: "proceed",
					message: "Ready to get started?",
					default: true,
				},
			]);

			if (!proceed) {
				this.log(
					chalk.dim(
						"\nSetup cancelled. Run setup anytime with: semoss setup\n",
					),
				);
				return;
			}

			this.log();
			this.log(chalk.bold("Step 1 of 3: Instance Configuration"));
			this.log(chalk.dim("─".repeat(50)));
			this.log();

			// Gather instance details
			const answers = await inquirer.prompt([
				{
					type: "input",
					name: "name",
					message: "What would you like to name this instance?",
					default: "production",
					validate: (input: string) =>
						input.trim() ? true : "Instance name is required",
				},
				{
					type: "input",
					name: "module",
					message: "Module URL (SEMOSS server):",
					validate: (input: string) => {
						if (!input) return "Module URL is required";
						if (!input.startsWith("http")) {
							return "URL must start with http:// or https://";
						}
						return true;
					},
				},
				{
					type: "input",
					name: "accessKey",
					message: "Access Key:",
					validate: (input: string) =>
						input ? true : "Access Key is required",
				},
				{
					type: "password",
					name: "secretKey",
					message: "Secret Key:",
					mask: "*",
					validate: (input: string) =>
						input ? true : "Secret Key is required",
				},
			]);

			this.log();
			this.log(chalk.bold("Step 2 of 3: Connection Test"));
			this.log(chalk.dim("─".repeat(50)));
			this.log();

			// Test connection with retry
			let connectionSuccessful = false;
			let shouldRetry = true;
			let attemptCount = 0;

			while (shouldRetry && !connectionSuccessful) {
				attemptCount++;

				this.log(
					chalk.cyan(
						`🔌 Testing Connection (Attempt ${attemptCount})`,
					),
				);
				this.log(chalk.dim("─".repeat(50)));
				this.log(chalk.dim(`Server:     ${answers.module}`));
				this.log(
					chalk.dim(
						`Access Key: ${answers.accessKey.substring(0, 8)}...`,
					),
				);
				this.log(chalk.dim(`Secret Key: ${"*".repeat(8)}...`));
				this.log(chalk.dim("─".repeat(50)));
				this.log(chalk.dim("\n⏳ Connecting to SEMOSS server...\n"));

				try {
					Env.update({
						MODULE: answers.module,
						ACCESS_KEY: answers.accessKey,
						SECRET_KEY: answers.secretKey,
					});

					const insight = new Insight();
					await insight.initialize({ python: false });

					if (insight.error) {
						throw insight.error;
					} else if (!insight.isAuthorized) {
						throw new Error(
							"Authentication failed. Check your credentials.",
						);
					} else if (!insight.isReady) {
						throw new Error(
							"Connection failed. Server may be unavailable.",
						);
					}

					this.log(chalk.green.bold("✓ Connection successful!\n"));
					logger.debug("Connection test passed");
					connectionSuccessful = true;
					shouldRetry = false;
				} catch (error) {
					const { message, suggestions } =
						formatConnectionError(error);

					logger.error(
						`Connection test failed (attempt ${attemptCount}): ${message}`,
					);

					this.log(chalk.red.bold(`✗ ${message}\n`));

					if (suggestions.length > 0) {
						this.log(chalk.yellow("💡 Suggestions:"));
						for (const suggestion of suggestions) {
							this.log(chalk.dim(`   • ${suggestion}`));
						}
						this.log();
					}

					const { retry } = await inquirer.prompt([
						{
							type: "confirm",
							name: "retry",
							message: "Would you like to retry the connection?",
							default: true,
						},
					]);

					if (!retry) {
						shouldRetry = false;
						const { continueAnyway } = await inquirer.prompt([
							{
								type: "confirm",
								name: "continueAnyway",
								message:
									"Save instance anyway without verification?",
								default: false,
							},
						]);

						if (!continueAnyway) {
							this.log(chalk.yellow("\n⚠️  Setup cancelled.\n"));
							return;
						}
					}
				}
			}

			this.log();
			this.log(chalk.bold("Step 3 of 3: Save Configuration"));
			this.log(chalk.dim("─".repeat(50)));
			this.log();

			// Save the instance
			credentials = loadCredentials();
			credentials.instances[answers.name] = {
				name: answers.name,
				endpoint: answers.module,
				module: answers.module,
				accessKey: answers.accessKey,
				secretKey: answers.secretKey,
				apps: {},
			};
			credentials.currentInstance = answers.name;

			saveCredentials(credentials);

			logger.debug(
				`Setup complete — instance "${answers.name}" saved as active`,
			);

			this.log(chalk.green.bold("✓ Configuration saved!\n"));
			this.log(
				chalk.bold.cyan(
					"╔═══════════════════════════════════════════════╗",
				),
			);
			this.log(
				chalk.bold.cyan(
					"║                                               ║",
				),
			);
			this.log(
				chalk.bold.cyan(
					"║          Setup Complete! 🎉                   ║",
				),
			);
			this.log(
				chalk.bold.cyan(
					"║                                               ║",
				),
			);
			this.log(
				chalk.bold.cyan(
					"╚═══════════════════════════════════════════════╝",
				),
			);
			this.log();
			this.log(chalk.white("You're all set to start using SEMOSS CLI!"));
			this.log();
			this.log(chalk.bold("Next Steps:"));
			this.log(
				chalk.dim("  1.") +
					" Check your status: " +
					chalk.cyan("semoss status"),
			);
			this.log(
				chalk.dim("  2.") +
					" List available apps: " +
					chalk.cyan("semoss apps"),
			);
			this.log(
				chalk.dim("  3.") +
					" Initialize a new app: " +
					chalk.cyan("semoss init --name my-app"),
			);
			this.log(
				chalk.dim("  4.") +
					" Or link existing app: " +
					chalk.cyan("semoss link <app-id>"),
			);
			this.log();
			this.log(
				chalk.dim(`Need help? Run: ${chalk.cyan("semoss --help")}`),
			);
			this.log();
		} finally {
			await logger.close();
		}
	}
}
