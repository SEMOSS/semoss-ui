import { Args, Command } from "@oclif/core";
import chalk from "chalk";
import { Env, Insight } from "@semoss/sdk";
import { getCurrentContext } from "../utils/config.js";

export default class Pixel extends Command {
	static description = "Execute a Pixel command from the CLI";

	static examples = [
		'<%= config.bin %> <%= command.id %> "MyInfo()"',
		'<%= config.bin %> <%= command.id %> "MyEngines()"',
		'<%= config.bin %> <%= command.id %> "Database(\\"db\\").query(\\"SELECT 1\\")"',
	];

	static args = {
		command: Args.string({
			description: "Pixel command to execute",
			required: true,
		}),
	};

	async run(): Promise<void> {
		const { args } = await this.parse(Pixel);

		// Get current context
		const { instance, instanceName, app } = getCurrentContext();

		if (!instance) {
			this.error(
				chalk.red("✗ No instance connected") +
					"\n\n" +
					chalk.yellow("Run: ") +
					chalk.cyan("semoss connect") +
					chalk.yellow(" to add an instance"),
				{ exit: 1 },
			);
		}

		// Show context
		this.log(chalk.dim("Instance: ") + chalk.cyan(instanceName));
		if (app) {
			this.log(chalk.dim("App: ") + chalk.cyan(app.name));
		}
		this.log(chalk.dim("Command: ") + chalk.yellow(args.command));
		this.log("");

		try {
			// Update environment
			Env.update({
				MODULE: instance.module,
				ACCESS_KEY: instance.accessKey,
				SECRET_KEY: instance.secretKey,
			});

			// Initialize insight
			this.log(chalk.dim("Connecting..."));
			const insight = new Insight();
			await insight.initialize({ python: false });

			if (insight.error) {
				throw new Error(
					`Connection failed: ${insight.error.message || String(insight.error)}`,
				);
			}

			if (!insight.isAuthorized) {
				throw new Error(
					"Authentication failed. Check your credentials.",
				);
			}

			if (!insight.isReady) {
				throw new Error(
					"Server connection failed. Is the SEMOSS server running?",
				);
			}

			// Execute command
			this.log(chalk.dim("Executing..."));
			const { pixelReturn } = await insight.actions.run(args.command);

			this.log("");
			this.log(chalk.green("✓ Success"));
			this.log("");

			// Format output
			if (pixelReturn && pixelReturn.length > 0) {
				const output = pixelReturn[0].output;
				this.log(chalk.bold("Output:"));
				this.log(this.formatOutput(output));
			} else {
				this.log(chalk.yellow("No output returned"));
			}
		} catch (error) {
			this.log("");
			this.log(chalk.red("✗ Pixel command failed"));
			this.log("");
			this.log(this.formatErrorMessage(error));
			this.exit(1);
		}
	}

	/**
	 * Format error message
	 */
	private formatErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			return chalk.red(error.message);
		}
		return chalk.red(String(error));
	}

	/**
	 * Format output for display
	 * Handles JSON, arrays, primitives
	 */
	private formatOutput(output: unknown): string {
		if (output === null || output === undefined) {
			return chalk.dim("null");
		}

		if (typeof output === "string") {
			return output;
		}

		if (typeof output === "number" || typeof output === "boolean") {
			return String(output);
		}

		// Try to pretty-print JSON
		try {
			const json = JSON.stringify(output, null, 2);
			return this.colorizeJson(json);
		} catch {
			return String(output);
		}
	}

	/**
	 * Add syntax highlighting to JSON
	 */
	private colorizeJson(json: string): string {
		return json
			.replace(/"([^"]+)":/g, chalk.cyan('"$1":')) // Keys
			.replace(/: "([^"]*)"/g, `: ${chalk.green('"$1"')}`) // String values
			.replace(/: (\d+\.?\d*)/g, `: ${chalk.yellow("$1")}`) // Numbers
			.replace(/: (true|false)/g, `: ${chalk.magenta("$1")}`) // Booleans
			.replace(/: null/g, `: ${chalk.dim("null")}`); // null
	}
}
