import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import { loadCredentials } from "../utils/config.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Instances extends Command {
	static description = "List all configured SEMOSS instances";

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
		const { flags } = await this.parse(Instances);

		const logger = new Logger({
			command: "instances",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			const credentials = loadCredentials();
			const instanceCount = Object.keys(credentials.instances).length;
			logger.debug(
				`Listing instances (count: ${instanceCount}, active: ${credentials.currentInstance ?? "none"})`,
			);

			if (instanceCount === 0) {
				if (flags.json) {
					this.log(JSON.stringify({ instances: [] }, null, 2));
				} else {
					this.log(chalk.yellow("\n⚠️  No instances configured.\n"));
					this.log(
						chalk.dim(
							`Use ${chalk.cyan("semoss connect")} to add an instance.`,
						),
					);
				}
				return;
			}

			if (flags.json) {
				const output = Object.entries(credentials.instances).map(
					([name, config]) => ({
						name,
						endpoint: config.endpoint,
						module: config.module,
						current: credentials.currentInstance === name,
						appCount: Object.keys(config.apps || {}).length,
					}),
				);
				this.log(JSON.stringify({ instances: output }, null, 2));
				return;
			}

			// Table output
			this.log(chalk.bold.cyan("\n📋 Configured Instances\n"));

			const table = new Table({
				head: [
					chalk.cyan("Name"),
					chalk.cyan("Server"),
					chalk.cyan("Apps"),
					chalk.cyan("Status"),
				],
				style: {
					head: [],
					border: ["dim"],
				},
			});

			for (const [name, config] of Object.entries(
				credentials.instances,
			)) {
				const isCurrent = credentials.currentInstance === name;

				let status = "";
				if (isCurrent) {
					status += chalk.green("● Active");
				}

				const displayName = isCurrent ? chalk.bold.green(name) : name;
				const appCount = Object.keys(config.apps || {}).length;

				table.push([
					displayName,
					config.module,
					appCount.toString(),
					status || chalk.dim("—"),
				]);
			}

			this.log(table.toString());
			this.log(
				chalk.dim(
					`\n💡 Use ${chalk.cyan("semoss switch <name>")} to change active instance`,
				),
			);
		} finally {
			await logger.close();
		}
	}
}
