import { Command, Flags } from "@oclif/core";
import * as fs from "node:fs";
import * as path from "node:path";
import { Env, Insight } from "@semoss/sdk";
import type { Config } from "../types.js";
import {
	BACKUP_DIR_NAME,
	type DeployRecord,
	formatBytes,
	getConfigSources,
	getConfiguration,
	getDirSize,
	initializeAndTestInsight,
	loadDeployHistory,
} from "../utils/index.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

// ── Types ───────────────────────────────────────────────────────

interface ProjectInfo {
	name: string | null;
	appId: string | null;
	endpoint: string | null;
	module: string | null;
	accessKeySet: boolean;
	secretKeySet: boolean;
	configStatus: ConfigStatus;
	configPath: string;
	targets: string[];
	ignoreCount: number;
	batchInstances: string[];
	envSource: string;
}

interface DeploymentInfo {
	total: number;
	successCount: number;
	failureCount: number;
	dryRunCount: number;
	last: DeployRecord | null;
	rollbackAvailable: boolean;
}

interface BackupInfo {
	count: number;
	totalSize: number;
	totalSizeFormatted: string;
}

interface ServerInfo {
	reachable: boolean;
	authorized: boolean;
	error: string | null;
	warning: string | null;
}

type ConfigStatus = "found" | "not-found" | "invalid";

// ── Constants ───────────────────────────────────────────────────

const SEPARATOR = "─".repeat(48);
const SERVER_TIMEOUT_MS = 10_000;

// ── Command ─────────────────────────────────────────────────────

export default class Status extends Command {
	static description =
		"Show project status: config, credentials, deployment history, backups, and optionally verify server connectivity.";

	static examples = [
		`<%= config.bin %> <%= command.id %>
Show local project status
`,
		`<%= config.bin %> <%= command.id %> --check
Include server connectivity and auth check
`,
		`<%= config.bin %> <%= command.id %> --json
Output status as JSON for scripting
`,
	];

	static flags = {
		env: Flags.string({
			char: "e",
			description: "Path to the environment variables. Default is .env",
		}),
		config: Flags.string({
			char: "c",
			description: "Path to the configuration. Default is smss.json",
		}),
		check: Flags.boolean({
			description:
				"Verify server connectivity and authentication (requires network)",
			default: false,
		}),
		json: Flags.boolean({
			description: "Output status as JSON",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Status);

		const logger = new Logger({
			command: "status",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			logger.debug(
				`Status check (check: ${flags.check}, json: ${flags.json})`,
			);

			// Use getConfiguration to get unified config view
			const configResult = getConfiguration({
				configPath: flags.config,
				envPath: flags.env,
			});

			// Get available config sources for display
			const sourcesInfo = getConfigSources();
			const envSourceDisplay = this.formatEnvSource(
				sourcesInfo.available,
			);

			const configPath = flags.config ?? "smss.json";
			const { config: smssConfig, status: configStatus } =
				this.loadSmssConfig(configPath);

			const project = this.getProjectInfoFromConfig(
				configResult,
				smssConfig,
				configPath,
				configStatus,
				envSourceDisplay,
			);
			const deployment = this.getDeploymentInfo();
			const backups = this.getBackupInfo();
			const server = flags.check
				? await this.getServerInfo(configResult)
				: undefined;

			logger.debug(
				`Status gathered (config: ${configStatus}, deployments: ${deployment.total}, backups: ${backups.count}${server ? `, server: ${server.reachable ? "reachable" : "unreachable"}` : ""})`,
			);

			if (flags.json) {
				this.log(
					JSON.stringify(
						{ project, deployment, backups, server },
						null,
						2,
					),
				);
				return;
			}

			this.printProject(project);
			this.printDeployment(deployment);
			this.printBackups(backups);
			if (server) {
				this.printServer(server);
			}
		} finally {
			await logger.close();
		}
	}

	// ── Data Gathering ──────────────────────────────────────────────

	/**
	 * Format the env source display string based on available sources
	 */
	private formatEnvSource(sources: string[]): string {
		if (sources.includes("env.local") && sources.includes("env")) {
			return ".env.local (overrides .env)";
		}
		if (sources.includes("env.local")) {
			return ".env.local";
		}
		if (sources.includes("env")) {
			return ".env";
		}
		if (sources.includes("global")) {
			return "~/.config/semoss/ (global)";
		}
		return "no .env file found";
	}

	/** Resolve env var with VITE_ prefix fallback (newer apps use VITE_-prefixed vars). */
	private resolveEnv(name: string): string | undefined {
		return process.env[name] || process.env[`VITE_${name}`];
	}

	private loadSmssConfig(configPath: string): {
		config: Config | null;
		status: ConfigStatus;
	} {
		if (!fs.existsSync(configPath)) {
			return { config: null, status: "not-found" };
		}
		try {
			const parsed = JSON.parse(
				fs.readFileSync(configPath, "utf-8"),
			) as Config;
			return { config: parsed, status: "found" };
		} catch {
			return { config: null, status: "invalid" };
		}
	}

	/**
	 * Get project info using the unified getConfiguration result
	 */
	private getProjectInfoFromConfig(
		configResult: ReturnType<typeof getConfiguration>,
		smssConfig: Config | null,
		configPath: string,
		configStatus: ConfigStatus,
		envSource: string,
	): ProjectInfo {
		const batchInstances =
			smssConfig?.deploy?.batch &&
			typeof smssConfig.deploy.batch === "object"
				? Object.keys(smssConfig.deploy.batch)
				: [];

		return {
			name: configResult.appName || smssConfig?.name || null,
			appId: configResult.appId || smssConfig?.app || null,
			endpoint: configResult.module || null, // getConfiguration combines endpoint+module
			module: configResult.module || null,
			accessKeySet: !!configResult.accessKey,
			secretKeySet: !!configResult.secretKey,
			configStatus,
			configPath,
			targets:
				configResult.targets.length > 0
					? configResult.targets
					: (smssConfig?.targets ?? []),
			ignoreCount:
				configResult.ignore.length > 0
					? configResult.ignore.length
					: (smssConfig?.ignore?.length ?? 0),
			batchInstances,
			envSource,
		};
	}

	private getDeploymentInfo(): DeploymentInfo {
		const history = loadDeployHistory();

		const counts = { success: 0, failure: 0, "dry-run": 0 };
		let rollbackAvailable = false;

		for (const record of history) {
			counts[record.status]++;
			if (record.status === "success" && record.backupDir) {
				rollbackAvailable = true;
			}
		}

		return {
			total: history.length,
			successCount: counts.success,
			failureCount: counts.failure,
			dryRunCount: counts["dry-run"],
			last: history.at(-1) ?? null,
			rollbackAvailable,
		};
	}

	private getBackupInfo(): BackupInfo {
		const backupDir = path.join(process.cwd(), BACKUP_DIR_NAME);

		if (!fs.existsSync(backupDir)) {
			return { count: 0, totalSize: 0, totalSizeFormatted: "0 Bytes" };
		}

		let count = 0;
		let totalSize = 0;

		try {
			const entries = fs.readdirSync(backupDir, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory()) {
					count++;
					totalSize += getDirSize(path.join(backupDir, entry.name));
				}
			}
		} catch {
			// Can't read backup dir — report zero
		}

		return {
			count,
			totalSize,
			totalSizeFormatted: formatBytes(totalSize),
		};
	}

	private async getServerInfo(
		configResult: ReturnType<typeof getConfiguration>,
	): Promise<ServerInfo> {
		if (!configResult.module) {
			return {
				reachable: false,
				authorized: false,
				error: "MODULE not configured",
				warning: null,
			};
		}

		if (!configResult.accessKey || !configResult.secretKey) {
			return {
				reachable: false,
				authorized: false,
				error: "ACCESS_KEY or SECRET_KEY not set",
				warning: null,
			};
		}

		Env.update({
			ACCESS_KEY: configResult.accessKey,
			MODULE: configResult.module,
			SECRET_KEY: configResult.secretKey,
			APP: configResult.appId || undefined,
		});

		const insight = new Insight();

		// The SDK logs noisy fetch stack traces to stderr on connection
		// failures. Temporarily suppress them so CLI output stays clean.
		const origStderrWrite = process.stderr.write;
		process.stderr.write = (() => true) as typeof process.stderr.write;

		try {
			await Promise.race([
				initializeAndTestInsight(insight),
				new Promise<never>((_, reject) =>
					setTimeout(
						() =>
							reject(new Error("Connection timed out after 10s")),
						SERVER_TIMEOUT_MS,
					),
				),
			]);
			return {
				reachable: true,
				authorized: true,
				error: null,
				warning: null,
			};
		} catch (err) {
			return this.classifyServerError(err);
		} finally {
			process.stderr.write = origStderrWrite;
		}
	}

	/** Map a server connection/auth error into structured ServerInfo. */
	private classifyServerError(err: unknown): ServerInfo {
		const msg = err instanceof Error ? err.message : String(err);

		const isConnError =
			msg.includes("ECONNREFUSED") ||
			msg.includes("ENOTFOUND") ||
			msg.includes("fetch failed") ||
			msg.includes("Could not connect") ||
			msg.includes("Failed to parse URL") ||
			msg.includes("timed out");

		const isAuthError =
			msg.includes("not Authorized") ||
			msg.includes("Authentication failed");

		// "does not have access to set the context" means auth succeeded
		// but the APP ID doesn't exist on the server.
		if (msg.includes("does not have access to set the context")) {
			return {
				reachable: true,
				authorized: true,
				error: null,
				warning:
					"APP ID not found on server — verify the APP value in your .env",
			};
		}

		return {
			reachable: !isConnError,
			authorized: isConnError ? false : !isAuthError,
			error: msg,
			warning: null,
		};
	}

	// ── Printing ────────────────────────────────────────────────────

	/** Print a labelled section with separator lines. */
	private printSection(icon: string, title: string, lines: string[]): void {
		this.log("");
		this.log(`${icon} ${title}`);
		this.log(SEPARATOR);
		for (const line of lines) {
			this.log(line);
		}
		this.log(SEPARATOR);
	}

	private printProject(p: ProjectInfo): void {
		const configLabel =
			p.configStatus === "found"
				? "✓"
				: p.configStatus === "invalid"
					? "⚠️  invalid JSON"
					: "✗ not found";

		const lines = [
			`  Project:      ${p.name ?? "not set"}`,
			`  App ID:       ${p.appId ?? "not set"}`,
			`  Endpoint:     ${p.endpoint ?? "not set"}`,
			`  Module:       ${p.module ?? "not set"}`,
			"",
			"  Credentials:",
			`    ACCESS_KEY: ${p.accessKeySet ? "✓ set" : "✗ missing"}`,
			`    SECRET_KEY: ${p.secretKeySet ? "✓ set" : "✗ missing"}`,
			"",
			`  Env Source:   ${p.envSource}`,
			`  Config:       ${p.configPath} ${configLabel}`,
		];

		if (p.configStatus === "found") {
			const targetLabel =
				p.targets.length > 0
					? p.targets.join(", ")
					: "none (deploys all)";
			lines.push(`  Targets:      ${targetLabel}`);
			lines.push(`  Ignore:       ${p.ignoreCount} patterns`);
		}

		if (p.batchInstances.length > 0) {
			lines.push(
				`  Batch:        ${p.batchInstances.length} (${p.batchInstances.join(", ")})`,
			);
		}

		this.printSection("📋", "Project Status", lines);
	}

	private printDeployment(d: DeploymentInfo): void {
		if (d.total === 0) {
			this.printSection("📦", "Deployments", [
				"  No deployment history found.",
			]);
			return;
		}

		const statusIcon =
			d.last?.status === "success"
				? "✅"
				: d.last?.status === "dry-run"
					? "🔍"
					: "❌";

		const lines = [
			`  Status:       ${statusIcon} ${d.last?.status}`,
			`  When:         ${formatTimestamp(d.last?.timestamp)}`,
		];

		if (d.last?.targets) {
			const targets =
				d.last.targets === "all" ? "all" : d.last.targets.join(", ");
			lines.push(`  Targets:      ${targets}`);
		}

		if (d.last?.duration != null) {
			lines.push(
				`  Duration:     ${(d.last.duration / 1000).toFixed(1)}s`,
			);
		}

		if (d.last?.zipSize != null) {
			lines.push(`  Zip Size:     ${formatBytes(d.last.zipSize)}`);
		}

		if (d.last?.rollback) {
			lines.push("  Type:         rollback");
		}

		lines.push(
			"",
			`  History:      ${d.total} total (${d.successCount} success, ${d.failureCount} failed, ${d.dryRunCount} dry-run)`,
			`  Rollback:     ${d.rollbackAvailable ? "✓ available" : "✗ no backup found"}`,
		);

		this.printSection("📦", "Last Deployment", lines);
	}

	private printBackups(b: BackupInfo): void {
		const lines =
			b.count === 0
				? ["  No backups on disk."]
				: [
						`  Count:        ${b.count}`,
						`  Total Size:   ${b.totalSizeFormatted}`,
					];

		this.printSection("💾", "Backups", lines);
	}

	private printServer(s: ServerInfo): void {
		const lines = [
			`  Connection:   ${s.reachable ? "✅ reachable" : "❌ unreachable"}`,
		];

		if (s.reachable) {
			lines.push(
				`  Auth:         ${s.authorized ? "✅ authorized" : "❌ unauthorized"}`,
			);
		} else {
			lines.push("  Auth:         ⚠️  unknown (server unreachable)");
		}

		if (s.error) {
			lines.push(`  Error:        ${s.error}`);
		}
		if (s.warning) {
			lines.push(`  Warning:      ${s.warning}`);
		}

		this.printSection("🌐", "Server", lines);
		this.log("");
	}

	// ── Utilities ───────────────────────────────────────────────────
}

// ── Module-level Utilities ──────────────────────────────────────

/** Format an ISO timestamp with a human-readable relative suffix. */
function formatTimestamp(ts?: string): string {
	if (!ts) return "unknown";

	const date = new Date(ts);
	if (Number.isNaN(date.getTime())) return ts;

	const diffMs = Date.now() - date.getTime();
	if (diffMs < 0) return ts;

	const diffMins = Math.floor(diffMs / 60_000);

	let relative: string;
	if (diffMins < 1) {
		relative = "just now";
	} else if (diffMins < 60) {
		relative = `${diffMins}m ago`;
	} else if (diffMins < 1440) {
		relative = `${Math.floor(diffMins / 60)}h ago`;
	} else {
		relative = `${Math.floor(diffMins / 1440)}d ago`;
	}

	return `${ts} (${relative})`;
}
