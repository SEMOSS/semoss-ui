import { Command, Flags } from "@oclif/core";
import { config } from "dotenv";
import open, { type AppName } from "open";
import fs from "node:fs";
import path from "node:path";
import { getBatchConfig } from "../utils/index.js";
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
				try {
					const { batchNames, batchConfig } = await getBatchConfig({
						configPath: "smss.json",
						batchInput: flags.batch || "all",
					});
					for (const name of batchNames) {
						const entry = batchConfig[name];
						if (!entry || !entry.endpoint) {
							this.log(
								`Skipping batch '${name}': no endpoint defined.`,
							);
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
				} catch (err) {
					this.error(
						err instanceof Error ? err.message : String(err),
					);
				}
			}

			// Load environment variables from .env and .env.local
			// If --env is provided, use only that file
			// Otherwise, load .env first, then .env.local (which overrides .env values)
			const envPath = path.resolve(process.cwd(), ".env");
			const envLocalPath = path.resolve(process.cwd(), ".env.local");
			if (flags.env) {
				config({ path: flags.env });
			} else {
				config({ path: envPath });
				if (fs.existsSync(envLocalPath)) {
					config({ path: envLocalPath, override: true });
				}
			}

			const endpoint = flags.endpoint || process.env.ENDPOINT;

			if (!endpoint) {
				this.error(
					"No endpoint specified. Use --endpoint flag or set ENDPOINT in your environment.",
				);
			}

			// Single endpoint mode
			logger.debug(`Opening endpoint: ${endpoint}`);
			await this.openApp(
				endpoint,
				process.env.APP ?? process.env.VITE_APP,
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
		let browserOpened = false;
		const urlToOpen = url;
		const openOptions = browser ? { app: { name: browser } } : undefined;
		const openPromise = open(urlToOpen, openOptions)
			.then(() => {
				browserOpened = true;
			})
			.catch(() => {
				this.log(
					`\n⚠️  Unable to open the browser automatically. Please copy and paste this URL into your browser:\n${urlToOpen}\n`,
				);
			});
		setTimeout(() => {
			if (!browserOpened) {
				this.log(
					`\n⚠️  The CLI attempted to open your browser, but it may not have launched. Please copy and paste this URL into your browser:\n${urlToOpen}\n`,
				);
			}
		}, 3000);
		await openPromise;
	}
}
