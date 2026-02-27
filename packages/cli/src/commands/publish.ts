import { Command, Flags } from "@oclif/core";
import Listr from "listr";
import { Env, Insight } from "@semoss/sdk";
import {
	getBatchConfig,
	getConfiguration,
	initializeAndTestInsight,
} from "../utils/index.js";
import { Logger, setDefaultLogger } from "../utils/logger.js";

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

		const logger = new Logger({
			command: "publish",
			console: this.log.bind(this),
		});
		setDefaultLogger(logger);

		try {
			// Batch support - getBatchConfig handles smss.json > global config priority
			if (flags.batch) {
				const { batchNames, batchConfig, source } =
					await getBatchConfig({
						configPath: flags.config || "smss.json",
						batchInput: flags.batch || "all",
					});

				this.log(
					`\n🔄 Running batch publish for: ${batchNames.join(", ")} (from ${source})\n`,
				);
				logger.debug(
					`Batch publish started for: ${batchNames.join(", ")}`,
				);

				const successful: { name: string; duration: number }[] = [];
				const failed: { name: string; error: string }[] = [];

				for (const batchName of batchNames) {
					const batchStartTime = Date.now();
					const entry = batchConfig[batchName];

					this.log(
						`\n📦 Publishing to instance: "${batchName}" [${new Date(batchStartTime).toISOString()}]`,
					);
					this.log(`   Module: ${entry.module || "from .env"}`);

					try {
						await this.publishToInstance({
							module: entry.module,
							accessKey: entry.accessKey,
							secretKey: entry.secretKey,
							app: entry.app,
						});
						const batchEndTime = Date.now();
						const duration = batchEndTime - batchStartTime;
						logger.debug(
							`Instance "${batchName}" published in ${duration}ms`,
						);
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
						logger.error(
							`Instance "${batchName}" failed: ${errorMsg}`,
						);
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
			}

			// Use getConfiguration for non-batch publish
			const configResult = getConfiguration({
				configPath: flags.config,
				envPath: flags.env,
			});

			if (!configResult.isValid) {
				this.error(
					`Invalid configuration:\n${configResult.errors.map((e) => `  - ${e}`).join("\n")}`,
				);
			}

			// Normal (non-batch) publish logic
			logger.debug(`Publishing to ${configResult.module}`);
			logger.info(`✓ Using configuration from ${configResult.source}`);

			await this.publishToInstance({
				module: configResult.module || undefined,
				accessKey: configResult.accessKey || undefined,
				secretKey: configResult.secretKey || undefined,
				app: configResult.appId || undefined,
			});
		} finally {
			await logger.close();
		}
	}

	// Helper to publish to a single instance with explicit config values
	private async publishToInstance(opts: {
		module?: string;
		accessKey?: string;
		secretKey?: string;
		app?: string;
	}) {
		// Update Env singleton directly — do NOT mutate process.env to avoid
		// credential leakage between batch iterations.
		Env.update({
			MODULE: opts.module,
			ACCESS_KEY: opts.accessKey,
			SECRET_KEY: opts.secretKey,
			APP: opts.app,
		});

		const insight = new Insight();
		const tasks = new Listr([
			{
				title: "Initializing and Testing Insight",
				task: async (ctx) => {
					try {
						ctx.reactorResult =
							await initializeAndTestInsight(insight);
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
						await insight.actions.run<[string]>(
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
