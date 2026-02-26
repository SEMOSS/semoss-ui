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

/**
 * Interactive onboarding command for new SEMOSS CLI users.
 *
 * Provides a guided setup experience that:
 * - Displays an overview of CLI features (TUI, Pixel execution, deployment, multi-instance management)
 * - Prompts the user to connect to a SEMOSS instance
 * - Collects server URL and authentication credentials (access key or OAuth token)
 * - Validates the connection by executing a test Pixel command
 * - Saves credentials to the local configuration directory for future use
 *
 * @example
 * ```bash
 * # Start interactive onboarding
 * semoss onboard
 *
 * # Force re-run setup even if already configured
 * semoss onboard --force
 * ```
 */
export default class Onboard extends Command {
	static description = "Interactive onboarding for new users";

	static examples = ["<%= config.bin %> <%= command.id %>"];

	static flags = {
		force: Flags.boolean({
			char: "f",
			description: "Force setup even if already configured",
			default: false,
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Onboard);
		this.log("");
		this.log(
			chalk.bold.cyan(
				"╔════════════════════════════════════════════════╗",
			),
		);
		this.log(
			chalk.bold.cyan(
				"║                                                ║",
			),
		);
		this.log(
			chalk.bold.cyan(
				"║         Welcome to SEMOSS CLI! 🎉             ║",
			),
		);
		this.log(
			chalk.bold.cyan(
				"║                                                ║",
			),
		);
		this.log(
			chalk.bold.cyan(
				"╚════════════════════════════════════════════════╝",
			),
		);
		this.log("");
		this.log(chalk.white("The modern command-line interface for SEMOSS"));
		this.log("");

		// Feature overview
		this.log(chalk.bold("What can you do with SEMOSS CLI?"));
		this.log("");

		this.log(chalk.cyan("1️⃣  Interactive Mode (TUI)"));
		this.log(
			chalk.dim(
				"   Full-screen terminal interface for running Pixel commands",
			),
		);
		this.log(chalk.dim("   • Run: ") + chalk.yellow("semoss interactive"));
		this.log("");

		this.log(chalk.cyan("2️⃣  CLI Pixel Execution"));
		this.log(
			chalk.dim("   Execute Pixel commands directly from your shell"),
		);
		this.log(
			chalk.dim("   • Run: ") + chalk.yellow('semoss pixel "MyInfo()"'),
		);
		this.log("");

		this.log(chalk.cyan("3️⃣  App Deployment"));
		this.log(
			chalk.dim(
				"   Deploy apps with rollback, batch, and target support",
			),
		);
		this.log(chalk.dim("   • Run: ") + chalk.yellow("semoss deploy"));
		this.log("");

		this.log(chalk.cyan("4️⃣  Multi-Instance Management"));
		this.log(chalk.dim("   Manage multiple SEMOSS servers easily"));
		this.log(chalk.dim("   • Run: ") + chalk.yellow("semoss instances"));
		this.log("");

		// Ask if they want to set up
		const { setupNow } = await inquirer.prompt([
			{
				type: "confirm",
				name: "setupNow",
				message: "Would you like to connect to a SEMOSS instance now?",
				default: true,
			},
		]);

		if (setupNow) {
			this.log("");
			this.log(chalk.dim("Great! Running onboarding wizard..."));
			this.log("");

			/* Starting Setup	*/

			// Check if already set up
			let credentials = loadCredentials();
			if (Object.keys(credentials.instances).length > 0 && !flags.force) {
				this.log(chalk.yellow("\n⚠️  CLI is already configured.\n"));
				this.log(
					chalk.dim(
						`Use ${chalk.cyan("semoss instances")} to see your instances.`,
					),
				);
				this.log(
					chalk.dim(
						`Use ${chalk.cyan("semoss onboard --force")} to run onboarding again.\n`,
					),
				);
				return;
			}

			// Setup Introduction
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

			// Step 1: Gather instance details
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

			// Step 2: Test connection
			this.log();
			this.log(chalk.bold("Step 2 of 3: Connection Test"));
			this.log(chalk.dim("─".repeat(50)));
			this.log();

			// Test connection with retry
			let connectionSuccessful = false;
			let shouldRetry = true;
			let attemptCount = 0;

			// loop to test connection and allow retry with updated credentials if it fails. This will help users who may have made a typo in their credentials or server URL to correct it without having to restart the entire onboarding process. The loop will continue until a successful connection is made or the user decides to cancel.
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
					connectionSuccessful = true;
					shouldRetry = false;
				} catch (error) {
					const { message, suggestions } =
						formatConnectionError(error);

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

					// If they don't want to retry, ask if they want to continue anyway (save the instance without verification). This will allow them to save the instance even if there are connection issues that they want to resolve later. It also prevents them from getting stuck in a retry loop if they're not sure how to fix the connection issue right now.
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
					} else {
						// Allow user to update credentials before retrying
						const { updateCredentials } = await inquirer.prompt([
							{
								type: "confirm",
								name: "updateCredentials",
								message:
									"Would you like to update any values before retrying?",
								default: true,
							},
						]);

						if (updateCredentials) {
							const updates = await inquirer.prompt([
								{
									type: "input",
									name: "module",
									message: "Module URL:",
									default: answers.module,
									validate: (input: string) => {
										if (!input)
											return "Module URL is required";
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
									default: answers.accessKey,
									validate: (input: string) =>
										input ? true : "Access Key is required",
								},
								{
									type: "password",
									name: "secretKey",
									message:
										"Secret Key (leave blank to keep current):",
									mask: "*",
								},
							]);

							answers.module = updates.module;
							answers.accessKey = updates.accessKey;
							if (updates.secretKey) {
								answers.secretKey = updates.secretKey;
							}
						}
					}
				}
			}

			// Step 3: Save configuration
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
					" Create a new app: " +
					chalk.cyan("semoss create --name my-app"),
			);

			this.log(
				chalk.bold(
					"    - If you already have an app you can link/upload it to your instance",
				),
			);
			this.log(
				"      - If existing app has an .env/.env.local file with APP var defined): " +
					chalk.cyan("semoss link <app-id>"),
			);
			this.log(
				"      - Or you can cd into app directory and run: " +
					chalk.cyan(
						"semoss init --name [name you want the app to have on the instance]",
					),
				"",
			);
			this.log();
		} else {
			this.log("");
			this.log(
				chalk.dim(
					"No problem! You can run " +
						chalk.cyan("semoss onboard") +
						" anytime to connect.",
				),
			);
			this.log("");
			this.log(chalk.bold("Quick Reference:"));
			this.log("");
			this.log(
				chalk.dim("  • Connect to instance:  ") +
					chalk.yellow("semoss connect"),
			);
			this.log(
				chalk.dim("  • Launch interactive:    ") +
					chalk.yellow("semoss interactive"),
			);
			this.log(
				chalk.dim("  • Run Pixel command:     ") +
					chalk.yellow('semoss pixel "MyInfo()"'),
			);
			this.log(
				chalk.dim("  • Deploy an app:         ") +
					chalk.yellow("semoss deploy"),
			);
			this.log(
				chalk.dim("  • Show all commands:     ") +
					chalk.yellow("semoss --help"),
			);
			this.log("");
			this.log(
				chalk.dim(
					`Configuration is stored in: ${chalk.cyan(getConfigDir())}`,
				),
			);
			this.log("");
		}

		// Show where to get help
		this.log(chalk.bold("Need Help?"));
		this.log("");
		this.log(
			chalk.dim("  • All commands:  ") + chalk.yellow("semoss --help"),
		);
		this.log(
			chalk.dim("  • Command help:  ") +
				chalk.yellow("semoss <command> --help"),
		);
		this.log("");
	}
}
