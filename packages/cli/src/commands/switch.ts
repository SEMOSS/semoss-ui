import { Args, Command } from "@oclif/core";
import chalk from "chalk";
import { loadCredentials, saveCredentials } from "../utils/config.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Switch extends Command {
	static description = "Switch the active SEMOSS instance";

	static examples = [
		"<%= config.bin %> <%= command.id %> production",
		"<%= config.bin %> <%= command.id %> staging",
	];

	static args = {
		instance: Args.string({
			description: "Name of the instance to switch to",
			required: true,
		}),
	};

	public async run(): Promise<void> {
		const { args } = await this.parse(Switch);

		const logger = new Logger({
			command: "switch",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			logger.debug(`Switching to instance "${args.instance}"`);

			const credentials = loadCredentials();

			// Check if instance exists
			if (!credentials.instances[args.instance]) {
				logger.error(`Instance "${args.instance}" not found`);
				this.error(
					chalk.red(`\n✗ Instance "${args.instance}" not found.\n`) +
						chalk.dim(
							`Available instances: ${Object.keys(credentials.instances).join(", ") || "none"}`,
						),
				);
			}

			// Switch to the instance
			const previousInstance = credentials.currentInstance;
			credentials.currentInstance = args.instance;
			saveCredentials(credentials);

			logger.debug(
				`Switched from "${previousInstance ?? "none"}" to "${args.instance}"`,
			);

			this.log(chalk.green.bold("\n✓ Switched instance!\n"));
			if (previousInstance) {
				this.log(chalk.dim(`From: ${previousInstance}`));
			}
			this.log(chalk.cyan(`To:   ${args.instance}`));
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
