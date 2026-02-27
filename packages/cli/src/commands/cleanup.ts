import { Command, Flags, ux } from "@oclif/core";
import * as fs from "node:fs";
import * as path from "node:path";
import { formatBytes, getDirSize } from "../utils/deploy.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Cleanup extends Command {
	static args = {};

	static description = "Clean up backup and deployment history files";

	static examples = [
		`<%= config.bin %> <%= command.id %>
Delete all backups interactively
`,
		`<%= config.bin %> <%= command.id %> --force
Force delete all backups without confirmation
`,
		`<%= config.bin %> <%= command.id %> --list
List all backups without deleting
`,
	];

	static flags = {
		// force flag
		force: Flags.boolean({
			char: "f",
			description: "Force delete without confirmation",
		}),
		// list flag
		list: Flags.boolean({
			char: "l",
			description: "List all backups without deleting",
		}),
		// verbose flag
		verbose: Flags.boolean({
			char: "v",
			description: "Enable verbose output",
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Cleanup);

		const logger = new Logger({
			command: "cleanup",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			const backupDir = path.join(process.cwd(), ".semoss-backups");
			const historyFile = path.join(process.cwd(), ".semoss-deployments");

			logger.debug(`Cleanup started in ${process.cwd()}`);

			// Check if backups directory exists
			if (!fs.existsSync(backupDir)) {
				this.log("✅ No backups found. Nothing to clean up.");
				return;
			}

			try {
				// List backups
				const backups = fs.readdirSync(backupDir);

				if (backups.length === 0) {
					this.log("✅ No backups found. Nothing to clean up.");
					return;
				}

				if (flags.verbose) {
					this.log(`📂 Backup directory: ${backupDir}`);
				}

				// Display backups
				this.log("📋 Found the following backups:");
				let totalSize = 0;
				const backupDirs: {
					name: string;
					path: string;
					size: number;
				}[] = [];

				for (const backup of backups) {
					const backupPath = path.join(backupDir, backup);
					const stat = fs.statSync(backupPath);

					if (stat.isDirectory()) {
						const size = getDirSize(backupPath);
						totalSize += size;
						backupDirs.push({
							name: backup,
							path: backupPath,
							size,
						});

						const sizeStr = formatBytes(size);
						this.log(`  • ${backup} (${sizeStr})`);
					}
				}

				this.log(`\n💾 Total backup size: ${formatBytes(totalSize)}`);

				// If list flag, stop here
				if (flags.list) {
					return;
				}

				// Ask for confirmation if not force
				if (!flags.force) {
					const shouldDelete = await this.confirm(
						"Are you sure you want to delete all backups? (yes/no)",
					);
					if (!shouldDelete) {
						this.log("❌ Cleanup cancelled.");
						return;
					}
				}

				// Delete backups
				this.log("\n🗑️  Deleting backups...");
				logger.debug(
					`Deleting ${backupDirs.length} backup directories`,
				);
				for (const backup of backupDirs) {
					fs.rmSync(backup.path, { recursive: true, force: true });
					this.log(`  ✅ Deleted: ${backup.name}`);
				}

				// Clean up empty backup directory
				try {
					const remaining = fs.readdirSync(backupDir);
					if (remaining.length === 0) {
						fs.rmSync(backupDir, { recursive: true, force: true });
						this.log("  ✅ Deleted empty backup directory");
					}
				} catch (error) {
					if (flags.verbose) {
						this.log(
							`  ℹ️  Could not remove backup directory: ${error}`,
						);
					}
				}

				// Always clean history to avoid stale backup references and broken rollback chains
				if (fs.existsSync(historyFile)) {
					fs.rmSync(historyFile, { force: true });
					this.log("  ✅ Deleted deployment history");
				}

				this.log(
					`\n🎉 Cleanup complete! Freed up ${formatBytes(totalSize)}`,
				);
				logger.debug(
					`Cleanup complete — freed ${formatBytes(totalSize)}`,
				);
			} catch (error) {
				logger.error(`Cleanup failed: ${error}`);
				this.error(`❌ Cleanup failed: ${error}`);
			}
		} finally {
			await logger.close();
		}
	}

	private async confirm(message: string): Promise<boolean> {
		const answer = await ux.prompt(message);
		const normalized = answer.toLowerCase().trim();
		return normalized === "yes" || normalized === "y";
	}
}
