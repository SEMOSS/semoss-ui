import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import inquirer from "inquirer";
import { Env, Insight } from "@semoss/sdk";
import { loadCredentials, saveCredentials } from "../utils/config.js";
import {
	formatConnectionError,
	withSuppressedErrors,
} from "../utils/errors.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Connect extends Command {
	static description = "Connect to a SEMOSS instance";

	static examples = [
		"<%= config.bin %> <%= command.id %>",
		"<%= config.bin %> <%= command.id %> --name production",
	];

	static flags = {
		name: Flags.string({
			char: "n",
			description: "Name for this instance (e.g., production, staging)",
		}),
		module: Flags.string({
			char: "m",
			description: "Module URL (SEMOSS server endpoint)",
		}),
		accessKey: Flags.string({
			char: "a",
			description: "Access key for authentication",
		}),
		secretKey: Flags.string({
			char: "s",
			description: "Secret key for authentication",
		}),
		default: Flags.boolean({
			char: "d",
			description: "Set as default instance",
			default: false,
		}),
		test: Flags.boolean({
			char: "t",
			description: "Test connection before saving",
			default: true,
			allowNo: true,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Connect);

		const logger = new Logger({
			command: "connect",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			this.log(chalk.bold.cyan("\n🔗 Connect to SEMOSS Instance\n"));

			// Prompt for missing information
			const answers = await inquirer.prompt([
				{
					type: "input",
					name: "name",
					message: "Instance name:",
					default: "production",
					when: !flags.name,
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
					when: !flags.module,
				},
				{
					type: "input",
					name: "accessKey",
					message: "Access Key:",
					validate: (input: string) =>
						input ? true : "Access Key is required",
					when: !flags.accessKey,
				},
				{
					type: "password",
					name: "secretKey",
					message: "Secret Key:",
					mask: "*",
					validate: (input: string) =>
						input ? true : "Secret Key is required",
					when: !flags.secretKey,
				},
				{
					type: "confirm",
					name: "default",
					message: "Set as default instance?",
					default: false,
					when: !flags.default,
				},
			]);

			const instanceName = flags.name || answers.name;
			let module = flags.module || answers.module;
			let accessKey = flags.accessKey || answers.accessKey;
			let secretKey = flags.secretKey || answers.secretKey;
			const isDefault = flags.default || answers.default;

			logger.debug(`Connecting instance "${instanceName}" to ${module}`);

			// Test connection if enabled with retry logic
			if (flags.test) {
				let connectionSuccessful = false;
				let shouldRetry = true;
				let attemptCount = 0;

				while (shouldRetry && !connectionSuccessful) {
					attemptCount++;

					this.log(
						chalk.cyan(
							`\n🔌 Testing Connection (Attempt ${attemptCount})`,
						),
					);
					this.log(chalk.dim("─".repeat(50)));
					this.log(chalk.dim(`Server:     ${module}`));
					this.log(
						chalk.dim(
							`Access Key: ${accessKey.substring(0, 8)}...`,
						),
					);
					this.log(chalk.dim(`Secret Key: ${"*".repeat(8)}...`));
					this.log(chalk.dim("─".repeat(50)));
					this.log(
						chalk.dim("\n⏳ Connecting to SEMOSS server...\n"),
					);

					try {
						Env.update({
							MODULE: module,
							ACCESS_KEY: accessKey,
							SECRET_KEY: secretKey,
						});

						const insight = new Insight();
						await withSuppressedErrors(() =>
							insight.initialize({ python: false }),
						);

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

						this.log(
							chalk.green.bold("✓ Connection successful!\n"),
						);
						logger.debug("Connection test passed");
						connectionSuccessful = true;
						shouldRetry = false;
					} catch (error) {
						const { message, suggestions } =
							formatConnectionError(error);

						logger.error(`Connection test failed: ${message}`);

						this.log(chalk.red.bold(`✗ ${message}\n`));

						if (suggestions.length > 0) {
							this.log(chalk.yellow("💡 Suggestions:"));
							for (const suggestion of suggestions) {
								this.log(chalk.dim(`   • ${suggestion}`));
							}
							this.log();
						}

						// Ask if they want to retry
						const { retry } = await inquirer.prompt([
							{
								type: "confirm",
								name: "retry",
								message:
									"Would you like to retry the connection?",
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
								this.log(
									chalk.yellow("\n⚠️  Setup cancelled.\n"),
								);
								return;
							}

							this.log(
								chalk.yellow(
									"\n⚠️  Saving instance without connection verification.",
								),
							);
							this.log(
								chalk.dim(
									"You can test the connection later with: semoss status\n",
								),
							);
						} else {
							const { updateCredentials } = await inquirer.prompt(
								[
									{
										type: "confirm",
										name: "updateCredentials",
										message:
											"Would you like to update any values before retrying?",
										default: true,
									},
								],
							);

							if (updateCredentials) {
								const updates = await inquirer.prompt([
									{
										type: "input",
										name: "module",
										message: "Module URL:",
										default: module,
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
										default: accessKey,
										validate: (input: string) =>
											input
												? true
												: "Access Key is required",
									},
									{
										type: "password",
										name: "secretKey",
										message:
											"Secret Key (leave blank to keep current):",
										mask: "*",
									},
								]);

								module = updates.module;
								accessKey = updates.accessKey;
								if (updates.secretKey) {
									secretKey = updates.secretKey;
								}
							}
						}
					}
				}
			}

			// Load existing credentials
			const credentials = loadCredentials();

			// Check if instance already exists
			if (credentials.instances[instanceName]) {
				const { confirm } = await inquirer.prompt([
					{
						type: "confirm",
						name: "confirm",
						message: chalk.yellow(
							`Instance "${instanceName}" already exists. Overwrite?`,
						),
						default: false,
					},
				]);

				if (!confirm) {
					this.log(chalk.dim("Operation cancelled."));
					return;
				}
			}

			// Save credentials
			credentials.instances[instanceName] = {
				name: instanceName,
				endpoint: module,
				module: module,
				accessKey: accessKey,
				secretKey: secretKey,
				apps: credentials.instances[instanceName]?.apps || {},
			};

			// Set as current instance if it's default or first instance
			if (isDefault || !credentials.currentInstance) {
				credentials.currentInstance = instanceName;
			}

			saveCredentials(credentials);

			logger.debug(
				`Instance "${instanceName}" saved (default: ${isDefault || credentials.currentInstance === instanceName})`,
			);

			this.log(chalk.green.bold("✓ Instance saved successfully!\n"));
			this.log(chalk.dim(`Instance: ${instanceName}`));
			this.log(chalk.dim(`Server: ${module}`));
			if (isDefault || credentials.currentInstance === instanceName) {
				this.log(chalk.dim.cyan("(Active instance)"));
			}

			this.log(
				chalk.dim(
					`\n💡 Use ${chalk.cyan("semoss status")} to view current configuration`,
				),
			);
		} finally {
			await logger.close();
		}
	}
}
