import { Command, Flags } from "@oclif/core";
import { config } from "dotenv";
import Listr from "listr";
import * as fs from "node:fs";
import path from "node:path";
import { Env, Insight } from "@semoss/sdk";
import { getBatchConfig, initializeAndTestInsight } from "../utils/index.js";

export default class Publish extends Command {
	static description =
		"Publish an app: initialize, run reactor, load reactors, publish app";

	static flags = {
		env: Flags.string({
			char: "e",
			description: "Path to the environment variables. Default is .env",
		}),
		config: Flags.string({
			char: "c",
			description: "Path to the configuration. Default is smss.json",
		}),
		batch: Flags.string({
			char: "B",
			description:
				"Publish to multiple instances via batch config in smss.json. Use 'all' or comma-separated names (e.g., 'dev,prod')",
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Publish);

		// Batch support
		if (flags.batch) {
			try {
				const { batchNames, batchConfig } = await getBatchConfig({
					configPath: flags.config || "smss.json",
					batchInput: flags.batch || "all",
				});

				this.log(
					`\n🔄 Running batch publish for: ${batchNames.join(", ")}\n`,
				);

				const successful: { name: string; duration: number }[] = [];
				const failed: { name: string; error: string }[] = [];

				for (const batchName of batchNames) {
					const batchStartTime = Date.now();
					const batchSettings = batchConfig[batchName];
					if (
						typeof batchSettings !== "object" ||
						batchSettings === null
					) {
						const errorMsg = `❌ Batch "${batchName}" must be an object with instance configuration`;
						this.log(errorMsg);
						failed.push({ name: batchName, error: errorMsg });
						continue;
					}
					this.log(
						`\n📦 Publishing to batch instance: "${batchName}" [${new Date(batchStartTime).toISOString()}]`,
					);
					this.log(
						`   Endpoint: ${batchSettings.endpoint || "from .env"}`,
					);
					this.log(
						`   Module: ${batchSettings.module || "from .env"}`,
					);

					try {
						await this.publishToInstance({
							endpoint: batchSettings.endpoint as
								| string
								| undefined,
							module: batchSettings.module as string | undefined,
							accessKey: batchSettings.accessKey as
								| string
								| undefined,
							secretKey: batchSettings.secretKey as
								| string
								| undefined,
							app: batchSettings.app as string | undefined,
						});
						const batchEndTime = Date.now();
						const duration = batchEndTime - batchStartTime;
						this.log(
							`   ✅ Successfully published to "${batchName}" [completed in ${duration}ms]`,
						);
						successful.push({ name: batchName, duration });
					} catch (publishError) {
						const batchEndTime = Date.now();
						const duration = batchEndTime - batchStartTime;
						const errorMsg =
							publishError instanceof Error
								? publishError.message
								: String(publishError);
						this.log(
							`   ❌ Publish failed for "${batchName}" [completed in ${duration}ms]: ${errorMsg}`,
						);
						failed.push({ name: batchName, error: errorMsg });
					}
				}

				this.log(`\n${"=".repeat(60)}`);
				this.log("📋 Batch Publish Summary");
				this.log("=".repeat(60));
				this.log(
					`✅ Successful: ${successful.length}/${batchNames.length}`,
				);
				if (successful.length > 0) {
					for (const { name, duration } of successful) {
						this.log(`   • "${name}" (${duration}ms)`);
					}
				}
				if (failed.length > 0) {
					this.log(
						`❌ Failed: ${failed.length}/${batchNames.length}`,
					);
					for (const { name, error } of failed) {
						this.log(`   • "${name}": ${error}`);
					}
				}
				this.log(`${"=".repeat(60)}\n`);

				if (failed.length > 0) {
					throw new Error(
						`${failed.length} publish instance(s) failed`,
					);
				}
				return;
			} catch (err) {
				this.error(err instanceof Error ? err.message : String(err));
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

		// Normal (non-batch) publish logic
		await this.publishToInstance({
			endpoint: process.env.ENDPOINT,
			module: process.env.MODULE,
			accessKey: process.env.ACCESS_KEY,
			secretKey: process.env.SECRET_KEY,
			app: process.env.APP,
		});
	}

	// Helper to publish to a single instance with explicit config values
	private async publishToInstance(opts: {
		endpoint?: string;
		module?: string;
		accessKey?: string;
		secretKey?: string;
		app?: string;
	}) {
		// Set process.env from batch config
		if (opts.endpoint && typeof opts.endpoint === "string") {
			process.env.ENDPOINT = opts.endpoint;
		}
		if (opts.module && typeof opts.module === "string") {
			process.env.MODULE = opts.module;
		}
		if (opts.accessKey && typeof opts.accessKey === "string") {
			process.env.ACCESS_KEY = opts.accessKey;
		}
		if (opts.secretKey && typeof opts.secretKey === "string") {
			process.env.SECRET_KEY = opts.secretKey;
		}
		if (opts.app && typeof opts.app === "string") {
			process.env.APP = opts.app;
			process.env.VITE_APP = opts.app;
		}

		// Construct full module URL from endpoint + module path
		let fullModuleUrl: string | undefined;
		if (
			opts.endpoint &&
			typeof opts.endpoint === "string" &&
			opts.module &&
			typeof opts.module === "string"
		) {
			fullModuleUrl = `${opts.endpoint}${opts.module}`;
			process.env.MODULE = fullModuleUrl;
		}

		// Update Env singleton immediately with batch config values
		const envUpdate: Record<string, string | undefined> = {
			ENDPOINT: process.env.ENDPOINT,
			MODULE: process.env.MODULE,
			ACCESS_KEY: process.env.ACCESS_KEY,
			SECRET_KEY: process.env.SECRET_KEY,
			APP: process.env.APP,
		};
		Env.update(envUpdate);

		const insight = new Insight();
		const tasks = new Listr([
			{
				title: "Initializing and Testing Insight",
				task: async (ctx) => {
					try {
						ctx.reactorResult = await initializeAndTestInsight(
							insight,
							this.log.bind(this),
							false, // verbose flags not supported in batch helper for now
						);
					} catch (err) {
						this.error(
							err instanceof Error ? err.message : String(err),
						);
					}
				},
			},
			{
				title: "Loading App Reactors",
				task: async (ctx) => {
					await insight.actions.run(
						`ReloadInsightClasses(project='${opts.app}', release=true);`,
					);
					ctx.reactorsLoaded = true;
				},
			},
			{
				title: "Publishing App",
				task: async (ctx) => {
					const { pixelReturn: publishReturn } =
						await insight.actions.run(
							`[string]` +
								`PublishProject(project='${opts.app}', release=true);`,
						);
					ctx.publishUrl = publishReturn[0].output;
				},
			},
		]);
		const context = await tasks.run();
		// Output summary after Listr clears
		this.log("\n==== Publish Summary ====");
		if (context.reactorResult !== undefined) {
			this.log(`Reactor 1+1 result: ${context.reactorResult}`);
		}
		if (context.reactorsLoaded) {
			this.log("App reactors loaded.");
		}
		if (context.publishUrl) {
			this.log(`App published: ${context.publishUrl}`);
		}
	}
}
