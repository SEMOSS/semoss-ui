import { Command, Flags } from "@oclif/core";
import open, { type AppName } from "open";
import { getBatchConfig, getConfiguration } from "../utils/index.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

export default class Open extends Command {
	static description =
		"Open the configured endpoint in your default browser.";

	static flags = {
		endpoint: Flags.string({
			char: "e",
			description:
				"Endpoint URL to open. If not provided, uses ENV or .env config.",
		}),
		batch: Flags.string({
			char: "B",
			description:
				"Batch name or 'all' to open all endpoints from smss.json batch config.",
		}),
		env: Flags.string({
			description: "Path to the environment variables. Default is .env",
		}),
		browser: Flags.string({
			char: "b",
			description:
				"Browser to use for opening the URL (e.g., chrome, firefox, edge). Overrides system default.",
		}),
		useGlobal: Flags.boolean({
			char: "g",
			description:
				"Use only global config (~/.config/semoss), skip local .env and smss.json",
			default: false,
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Open);

		const logger = new Logger({
			command: "open",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			// Validate browser flag if provided
			if (flags.browser) {
				const allowed: Array<AppName> = [
					"chrome",
					"brave",
					"firefox",
					"edge",
					"browser",
					"browserPrivate",
				];
				if (!allowed.includes(flags.browser as AppName)) {
					this.error(
						`Invalid browser: '${flags.browser}'. Allowed values: ${allowed.join(", ")}`,
					);
				}
			}

			if (flags.batch) {
				const { batchNames, batchConfig, source } =
					await getBatchConfig({
						configPath: "smss.json",
						batchInput: flags.batch || "all",
					});

				this.log(
					`\n🔗 Opening ${batchNames.length} instance(s) from ${source}...\n`,
				);

				for (const name of batchNames) {
					const entry = batchConfig[name];
					if (!entry?.endpoint) {
						this.log(`Skipping '${name}': no endpoint defined.`);
						continue;
					}
					await this.openApp(
						entry.endpoint,
						entry.app,
						name,
						flags.browser,
					);
				}
				return;
			}

			// Use getConfiguration for non-batch mode
			const configResult = getConfiguration({
				envPath: flags.env,
				skipSmss: flags.useGlobal,
				skipEnv: flags.useGlobal,
			});

			// Extract endpoint from module or use flag
			const endpoint = flags.endpoint ?? configResult.module;

			this.log(
				`Using source: ${configResult.source}; Using app: ${configResult.appId}`,
			);

			if (!endpoint) {
				this.error(
					"No endpoint specified. Use --endpoint flag or set ENDPOINT in your environment.",
				);
			}

			// Single endpoint mode
			logger.debug(`Opening endpoint: ${endpoint}`);
			await this.openApp(
				endpoint,
				configResult.appId || undefined,
				undefined,
				flags.browser,
			);
		} finally {
			await logger.close();
		}
	}

	// Helper to open a browser for a given endpoint and optional app
	private async openApp(
		endpoint: string,
		app: string | undefined,
		label?: string,
		browser?: string,
	) {
		let url = endpoint;
		if (url.endsWith("/")) {
			url = url.slice(0, -1);
		}

		if (url.endsWith("/Monolith")) {
			url = url.slice(0, -"/Monolith".length);
		}

		url = `${url}/packages/client/dist/#`;
		if (typeof app === "string" && app.trim() !== "") {
			if (url.endsWith("/")) {
				url = url.slice(0, -1);
			}
			url = `${url}/app/${app}/view`;
		}
		if (label) {
			this.log(`Opening browser to [${label}]: ${url}`);
		} else {
			this.log(`Opening browser to: ${url}`);
		}

		const urlToOpen = url;
		const openOptions = browser
			? { app: { name: browser as AppName }, wait: false }
			: { wait: false };

		try {
			const childProcess = await open(urlToOpen, openOptions);

			// Wait a bit for the process to potentially fail
			await new Promise<void>((resolve, reject) => {
				let resolved = false;

				// Listen for error events (spawn failure)
				childProcess.on("error", (err) => {
					if (!resolved) {
						resolved = true;
						reject(err);
					}
				});

				// On Windows, check if process exited with error quickly
				childProcess.on("close", (code) => {
					if (!resolved && code !== 0 && code !== null) {
						resolved = true;
						reject(
							new Error(
								`Browser process exited with code ${code}`,
							),
						);
					}
				});

				// Give the browser process a moment to start or fail
				setTimeout(() => {
					if (!resolved) {
						resolved = true;
						resolve();
					}
				}, 1500);
			});

			this.log(`✓ Browser opened`);
		} catch (_error) {
			this.log(
				`\n⚠️  Unable to open the browser automatically. Please copy and paste this URL into your browser:\n${urlToOpen}\n`,
			);
		}
	}
}
