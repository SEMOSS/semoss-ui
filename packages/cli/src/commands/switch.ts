import { Args, Command } from "@oclif/core";
import chalk from "chalk";
import { loadCredentials, saveCredentials } from "../utils/config.js";

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

		const credentials = loadCredentials();

		// Check if instance exists
		if (!credentials.instances[args.instance]) {
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

		this.log(chalk.green.bold("\n✓ Switched instance!\n"));
		if (previousInstance) {
			this.log(chalk.dim(`From: ${previousInstance}`));
		}
		this.log(chalk.cyan(`To:   ${args.instance}`));
		this.log(
			chalk.dim(
				`\n💡 Use ${chalk.cyan("@semoss/cli status")} to view current configuration`,
			),
		);
	}
}
