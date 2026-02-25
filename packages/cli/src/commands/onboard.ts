import { Command } from "@oclif/core";
import chalk from "chalk";
import inquirer from "inquirer";
import { getConfigDir } from "../utils/config.js";

export default class Onboard extends Command {
	static description = "Interactive onboarding for new users";

	static examples = ["<%= config.bin %> <%= command.id %>"];

	async run(): Promise<void> {
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
			this.log(chalk.dim("Great! Running setup wizard..."));
			this.log("");

			// Run setup command
			await this.config.runCommand("setup");
		} else {
			this.log("");
			this.log(
				chalk.dim(
					"No problem! You can run " +
						chalk.cyan("semoss setup") +
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
