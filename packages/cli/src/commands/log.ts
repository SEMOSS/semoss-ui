import { Command, Flags } from "@oclif/core";
import * as fs from "node:fs";
import * as path from "node:path";
import {
	type DeployRecord,
	formatBytes,
	HISTORY_FILE,
	loadDeployHistory,
} from "../utils/deploy.js";
import { Logger } from "../utils/logger.js";

export default class Log extends Command {
	static description =
		"Show deployment history and CLI log files from ~/.config/semoss/logs/";

	static examples = [
		`<%= config.bin %> <%= command.id %>
Show recent deployments
`,
		`<%= config.bin %> <%= command.id %> --limit=5
Show last 5 deployments
`,
		`<%= config.bin %> <%= command.id %> --verbose
Show detailed deployment info
`,
		`<%= config.bin %> <%= command.id %> --json
Output as JSON
`,
		`<%= config.bin %> <%= command.id %> --files
List available CLI log files
`,
		`<%= config.bin %> <%= command.id %> --files --tail=50
Show last 50 lines of today's log file
`,
		`<%= config.bin %> <%= command.id %> --dir
Print the log directory path
`,
	];

	static flags = {
		limit: Flags.integer({
			char: "l",
			description: "Number of deployments to show (default: 10)",
			default: 10,
		}),
		verbose: Flags.boolean({
			char: "v",
			description: "Show detailed deployment information",
			default: false,
		}),
		json: Flags.boolean({
			description: "Output as JSON",
			default: false,
		}),
		status: Flags.string({
			char: "s",
			description: "Filter by status: success, failure, dry-run",
			options: ["success", "failure", "dry-run"],
		}),
		files: Flags.boolean({
			char: "f",
			description:
				"List or display CLI log files from ~/.config/semoss/logs/",
			default: false,
		}),
		tail: Flags.integer({
			char: "t",
			description:
				"Show the last N lines of the most recent log file (use with --files)",
		}),
		dir: Flags.boolean({
			description: "Print the log directory path and exit",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Log);

		// --dir: just print the log directory path
		if (flags.dir) {
			const logger = new Logger();
			this.log(logger.getLogDir());
			return;
		}

		// --files: show CLI log files
		if (flags.files) {
			await this.showLogFiles(flags.tail);
			return;
		}

		const history = loadDeployHistory();

		if (history.length === 0) {
			if (flags.json) {
				this.log("[]");
			} else {
				this.log("No deployment history found.");
				this.log(`History file: ${HISTORY_FILE}`);
			}
			return;
		}

		// Filter by status if specified
		let filtered = history;
		if (flags.status) {
			filtered = history.filter((r) => r.status === flags.status);
		}

		// Apply limit (show most recent first)
		const limited = filtered.slice(-flags.limit).reverse();

		if (flags.json) {
			this.log(JSON.stringify(limited, null, 2));
			return;
		}

		this.log(
			`\n📋 Deployment History (${limited.length} of ${history.length} total)\n`,
		);
		this.log("─".repeat(60));

		for (const record of limited) {
			this.printRecord(record, flags.verbose);
		}

		// Summary
		const successCount = history.filter(
			(r) => r.status === "success",
		).length;
		const failureCount = history.filter(
			(r) => r.status === "failure",
		).length;
		const dryRunCount = history.filter(
			(r) => r.status === "dry-run",
		).length;

		this.log("\n📊 Summary");
		this.log("─".repeat(60));
		this.log(`   ✅ Successful: ${successCount}`);
		this.log(`   ❌ Failed: ${failureCount}`);
		this.log(`   🔍 Dry-run: ${dryRunCount}`);
		this.log("");
	}

	private async showLogFiles(tail?: number): Promise<void> {
		const logger = new Logger();
		const logDir = logger.getLogDir();

		try {
			const entries = fs.readdirSync(logDir);
			const logFiles = entries
				.filter((f) => /^semoss-\d{4}-\d{2}-\d{2}\.log$/.test(f))
				.sort();

			if (logFiles.length === 0) {
				this.log("No log files found.");
				this.log(`Log directory: ${logDir}`);
				return;
			}

			// If --tail is provided, show the last N lines of the most recent file
			if (tail !== undefined) {
				const latest = logFiles[logFiles.length - 1];
				const filePath = path.join(logDir, latest);
				const content = fs.readFileSync(filePath, "utf-8");
				const lines = content.split("\n").filter(Boolean);
				const sliced = lines.slice(-tail);
				this.log(`\n📄 ${latest} (last ${sliced.length} lines)\n`);
				this.log("─".repeat(60));
				for (const line of sliced) {
					this.log(line);
				}
				this.log("");
				return;
			}

			// Otherwise list all available log files
			this.log(`\n📁 Log Files (${logDir})\n`);
			this.log("─".repeat(60));

			for (const file of logFiles) {
				const filePath = path.join(logDir, file);
				const stats = fs.statSync(filePath);
				const sizeKb = (stats.size / 1024).toFixed(1);
				this.log(`   ${file}  (${sizeKb} KB)`);
			}

			this.log("─".repeat(60));
			this.log(
				`\nTip: Use --tail=50 to see the last 50 lines of the latest log.`,
			);
			this.log("");
		} catch {
			this.log("No log files found.");
			this.log(`Log directory: ${logDir}`);
		}
	}

	private printRecord(record: DeployRecord, verbose: boolean): void {
		const statusIcon = this.getStatusIcon(record.status);
		const timestamp = this.formatTimestamp(record.timestamp);
		const targets =
			record.targets === "all"
				? "all"
				: Array.isArray(record.targets)
					? record.targets.join(", ")
					: "unknown";

		this.log(`\n${statusIcon} ${timestamp}`);
		this.log(
			`   Status:  ${record.status}${record.rollback ? " (rollback)" : ""}`,
		);
		this.log(`   Targets: ${targets}`);

		if (verbose) {
			if (record.duration) {
				this.log(
					`   Duration: ${this.formatDuration(record.duration)}`,
				);
			}
			if (record.zipSize) {
				this.log(`   Zip size: ${formatBytes(record.zipSize)}`);
			}
			if (record.backupDir) {
				this.log(`   Backup:   ${record.backupDir}`);
			}
			if (record.app) {
				this.log(`   App ID:   ${record.app}`);
			}
			if (record.module) {
				this.log(`   Module:   ${record.module}`);
			}
		}
	}

	private getStatusIcon(status: string): string {
		switch (status) {
			case "success":
				return "✅";
			case "failure":
				return "❌";
			case "dry-run":
				return "🔍";
			default:
				return "❓";
		}
	}

	private formatTimestamp(timestamp: string): string {
		try {
			const date = new Date(timestamp);
			return date.toLocaleString();
		} catch {
			return timestamp;
		}
	}

	private formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		const seconds = Math.floor(ms / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}
}
