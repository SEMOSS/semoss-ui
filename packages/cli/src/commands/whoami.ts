/**
 * @module commands/whoami
 *
 * Display the authenticated user's identity from a SEMOSS server.
 *
 * ## Data flow
 *
 * 1. Resolve credentials — env vars (`MODULE`, `ACCESS_KEY`, `SECRET_KEY`)
 *    take priority, then the active instance from `~/.config/semoss/`.
 * 2. Open an `Insight` session via `@semoss/sdk` and run the
 *    `GetUserInfo()` reactor, which returns a provider-keyed object:
 *    ```json
 *    { "NATIVE": { "id": "jdoe", "name": "Jane Doe", … } }
 *    ```
 * 3. Flatten the first provider entry into a summary and display it.
 *
 * ## Error handling
 *
 * Errors are classified with {@link formatConnectionError} so the user
 * sees an actionable message + suggestions rather than a raw stack trace.
 * The SDK writes noisy `console.warn` output to stderr on connection
 * failures, so stderr is temporarily suppressed during `initialize()`.
 * The spinner is routed to stdout to stay visible during that window.
 */
import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import ora from "ora";
import { Env, Insight } from "@semoss/sdk";
import { getCurrentInstanceName, resolveCredentials } from "../utils/config.js";
import { formatConnectionError } from "../utils/errors.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

// ── Types ───────────────────────────────────────────────────────

/**
 * Shape of a single provider entry inside the `GetUserInfo()` response.
 *
 * The reactor returns `Record<providerName, ProviderUserInfo>` — e.g.
 * `{ "NATIVE": { id: "jdoe", … }, "LDAP": { … } }`.
 */
interface ProviderUserInfo {
	id?: string;
	username?: string;
	name?: string;
	email?: string;
	admin?: boolean;
	lastLogin?: string;
	[key: string]: unknown;
}

/** Normalised user record surfaced to the caller. */
interface NormalisedUser {
	id: string;
	name: string;
	email: string;
	admin: boolean;
	provider: string;
}

// ── Constants ───────────────────────────────────────────────────

/**
 * Maximum time (ms) to wait for the SDK to finish `initialize()`.
 * Prevents the CLI from hanging when the server is unreachable — the
 * OS-level TCP timeout can be 30–120 s otherwise.
 */
const CONNECTION_TIMEOUT_MS = 15_000;

// ── Command ─────────────────────────────────────────────────────

export default class Whoami extends Command {
	static description = "Show current user information from SEMOSS server";

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

	// ── Main entry point ────────────────────────────────────────

	public async run(): Promise<void> {
		const { flags } = await this.parse(Whoami);

		const logger = new Logger({
			command: "whoami",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			// ── 1. Resolve credentials ──────────────────────────
			const resolved = resolveCredentials();
			const instanceName = getCurrentInstanceName();
			logger.debug(
				`Querying user info (instance: ${instanceName ?? "none"}, source: ${resolved.source})`,
			);

			if (
				!resolved.module ||
				!resolved.accessKey ||
				!resolved.secretKey
			) {
				logger.error("No credentials found");
				this.error(
					chalk.red("\n✗ No credentials found.\n") +
						chalk.dim(
							`Use ${chalk.cyan("semoss connect")} to add an instance.`,
						),
				);
				return; // `this.error()` throws, but explicit return aids readability
			}

			// Narrow to non-null after the guard above so downstream
			// helpers receive the concrete types they expect.
			const credentials = {
				module: resolved.module,
				accessKey: resolved.accessKey,
				secretKey: resolved.secretKey,
			};

			// ── 2. Connect to server ────────────────────────────

			// Use stdout for the spinner — stderr gets briefly suppressed
			// below to silence noisy SDK stack-traces.
			const spinner = flags.json
				? null
				: ora({
						text: "Connecting to SEMOSS...",
						stream: process.stdout,
					}).start();

			const insight = await this.connectToServer(
				credentials,
				spinner,
				logger,
			);

			// ── 3. Fetch user info ──────────────────────────────
			try {
				const userInfo = await this.fetchUserInfo(insight, logger);

				if (flags.json) {
					this.log(
						JSON.stringify(
							{
								user: userInfo,
								instance: instanceName,
								server: credentials.module,
								source: resolved.source,
							},
							null,
							2,
						),
					);
				} else {
					this.printUserInfo(userInfo, {
						instanceName,
						server: credentials.module,
						source: resolved.source,
					});
				}
			} finally {
				// Clean up the server-side insight so resources aren't leaked.
				await this.destroyInsight(insight);
			}
		} finally {
			await logger.close();
		}
	}

	// ── Private helpers ─────────────────────────────────────────

	/**
	 * Open an authenticated {@link Insight} session against the SEMOSS
	 * server.  Handles:
	 *
	 * - Timeout guard (15 s) to avoid long hangs on unreachable servers.
	 * - stderr suppression around `insight.initialize()` to silence the
	 *   SDK's `console.warn` stack dumps on fetch failures.
	 * - Post-init state validation (`error`, `isAuthorized`, `isReady`).
	 *
	 * On failure the spinner is stopped, an actionable error is printed,
	 * and the process exits via `this.error()`.
	 */
	private async connectToServer(
		resolved: {
			module: string;
			accessKey: string;
			secretKey: string;
		},
		spinner: ReturnType<typeof ora> | null,
		logger: Logger,
	): Promise<Insight> {
		logger.debug(
			`Initializing Insight for GetUserInfo() (server: ${resolved.module})`,
		);

		Env.update({
			MODULE: resolved.module,
			ACCESS_KEY: resolved.accessKey,
			SECRET_KEY: resolved.secretKey,
		});

		const insight = new Insight();

		// Suppress stderr only for the duration of the SDK call so
		// that the spinner and any subsequent error output remain visible.
		const origStderrWrite = process.stderr.write;
		let timer: ReturnType<typeof setTimeout> | undefined;

		try {
			process.stderr.write = (() => true) as typeof process.stderr.write;

			await Promise.race([
				insight.initialize({ python: false }),
				new Promise<never>((_, reject) => {
					timer = setTimeout(
						() =>
							reject(
								new Error(
									"Connection timed out — server did not respond within 15 s",
								),
							),
						CONNECTION_TIMEOUT_MS,
					);
				}),
			]);
		} catch (error) {
			// Restore stderr first so error output is visible.
			process.stderr.write = origStderrWrite;
			this.failConnection(spinner, error, logger);
			return insight; // unreachable — `failConnection` throws
		} finally {
			process.stderr.write = origStderrWrite;
			clearTimeout(timer);
		}

		// Validate post-init state
		if (insight.error) {
			this.failConnection(spinner, insight.error, logger);
		} else if (!insight.isAuthorized) {
			this.failConnection(
				spinner,
				new Error("Authentication failed"),
				logger,
			);
		} else if (!insight.isReady) {
			this.failConnection(
				spinner,
				new Error(
					"Server accepted credentials but the session is not ready",
				),
				logger,
			);
		}

		if (spinner) spinner.succeed("Connected");
		return insight;
	}

	/**
	 * Run the `GetUserInfo()` reactor and normalise the response into a
	 * flat {@link NormalisedUser} record.
	 *
	 * The reactor returns a provider-keyed object.  We take the first
	 * provider's entry and merge its fields into a simple summary.
	 */
	private async fetchUserInfo(
		insight: Insight,
		logger: Logger,
	): Promise<NormalisedUser> {
		const { pixelReturn } =
			await insight.actions.run<[Record<string, ProviderUserInfo>]>(
				"GetUserInfo()",
			);

		const entry = pixelReturn[0];

		// Guard against reactor-level errors
		if (entry.operationType?.includes("ERROR")) {
			throw new Error(
				`GetUserInfo() failed: ${typeof entry.output === "string" ? entry.output : "unknown error"}`,
			);
		}

		// Validate shape — should be { "NATIVE": { … }, … }
		const providers = entry.output;
		if (
			!providers ||
			typeof providers !== "object" ||
			Object.keys(providers).length === 0
		) {
			throw new Error(
				"Unexpected response — GetUserInfo() returned no provider data",
			);
		}

		const providerNames = Object.keys(providers);
		const primary = providers[providerNames[0]];

		const userInfo: NormalisedUser = {
			id: primary.id ?? primary.username ?? "unknown",
			name: primary.name ?? "",
			email: primary.email ?? "",
			admin: primary.admin ?? false,
			provider: providerNames[0],
		};

		logger.debug(
			`User info retrieved: ${userInfo.id} (provider: ${userInfo.provider}, admin: ${userInfo.admin})`,
		);

		return userInfo;
	}

	/**
	 * Render a human-friendly summary of the authenticated user.
	 */
	private printUserInfo(
		user: NormalisedUser,
		connection: {
			instanceName: string | null;
			server: string;
			source: string;
		},
	): void {
		this.log(chalk.bold.cyan("\n👤 User Information\n"));
		this.log(chalk.bold("User ID:"), user.id);
		if (user.name) this.log(chalk.bold("Name:"), user.name);
		if (user.email) this.log(chalk.bold("Email:"), user.email);
		this.log(
			chalk.bold("Admin:"),
			user.admin ? chalk.green("Yes") : chalk.dim("No"),
		);
		this.log(chalk.bold("Provider:"), chalk.dim(user.provider));

		this.log(chalk.bold("\nConnection:"));
		if (connection.instanceName) {
			this.log(chalk.dim(`Instance: ${connection.instanceName}`));
		}
		this.log(chalk.dim(`Server: ${connection.server}`));
		this.log(
			chalk.dim(
				`Source: ${connection.source === "env" ? "Environment variables" : "Global config"}`,
			),
		);
		this.log("");
	}

	/**
	 * Stop the spinner, log the error, print a user-facing message with
	 * suggestions, and exit.
	 *
	 * `this.error()` throws an `ExitError` (oclif convention), so control
	 * never returns to the caller.
	 */
	private failConnection(
		spinner: ReturnType<typeof ora> | null,
		error: unknown,
		logger: Logger,
	): never {
		if (spinner) spinner.fail("Connection failed");

		const { message, suggestions } = formatConnectionError(error);
		logger.error(`Whoami failed: ${message}`);

		let output = chalk.red(`\n✗ ${message}\n`);
		if (suggestions.length > 0) {
			output += chalk.yellow("\n💡 Suggestions:\n");
			for (const s of suggestions) {
				output += chalk.dim(`   • ${s}\n`);
			}
		}

		this.error(output);
	}

	/**
	 * Best-effort cleanup of the Insight session.
	 *
	 * Tells the server to drop the temporary insight so it doesn't linger.
	 * Swallows errors — cleanup failure should never mask the real result.
	 */
	private async destroyInsight(insight: Insight): Promise<void> {
		if (!insight.isReady) return;
		try {
			await insight.destroy();
		} catch {
			// best-effort
		}
	}
}
