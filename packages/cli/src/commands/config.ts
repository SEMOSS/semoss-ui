import { Command, Flags, ux } from "@oclif/core";
import * as fs from "node:fs";
import * as path from "node:path";
import { ensureSemossGitignore } from "../utils/index.js";

export default class Config extends Command {
	static args = {};

	static description = "Generate a skeleton smss.json config file";

	static examples = [
		`<%= config.bin %> <%= command.id %>
Generate skeleton config
`,
	];

	static flags = {
		force: Flags.boolean({
			char: "f",
			description: "Overwrite existing smss.json without prompting",
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Config);

		const configPath = path.join(process.cwd(), "smss.json");
		const skeletonConfig = {
			targets: [],
			ignore: [
				"node_modules/**",
				"**/.git/**",
				"**/*.local",
				"client/**",
				"**/package.json",
				"**/package-lock.json",
				"**/pnpm-lock.yaml",
				"**/vite.config.ts",
				"**/vite.config.js",
				"**/vitest.config.ts",
				"**/vitest.config.js",
				"**/tsconfig.json",
				"**/components.json",
				"target/**",
				"test_classes/**",
				"classes/**",
				".semoss-backups/**",
				".semoss-deployments",
				"smss.json",
			],
			deploy: {
				batch: {},
			},
		};

		let mergedConfig = skeletonConfig;
		let shouldPrompt = false;

		// Ensure .gitignore is updated before writing config
		ensureSemossGitignore(process.cwd());
		if (fs.existsSync(configPath)) {
			try {
				const existing = JSON.parse(
					fs.readFileSync(configPath, "utf-8"),
				);
				// Merge targets
				const targets = Array.isArray(existing.targets)
					? Array.from(
							new Set([
								...(existing.targets || []),
								...(skeletonConfig.targets || []),
							]),
						)
					: skeletonConfig.targets;
				// Merge ignore
				const ignore = Array.isArray(existing.ignore)
					? Array.from(
							new Set([
								...(existing.ignore || []),
								...(skeletonConfig.ignore || []),
							]),
						)
					: skeletonConfig.ignore;
				// Merge deploy.batch
				let batch = {};
				if (
					existing.deploy &&
					typeof existing.deploy === "object" &&
					existing.deploy.batch
				) {
					batch = {
						...existing.deploy.batch,
						...skeletonConfig.deploy.batch,
					};
				} else {
					batch = skeletonConfig.deploy.batch;
				}
				// If merging is possible, update mergedConfig
				mergedConfig = {
					...existing,
					targets,
					ignore,
					deploy: {
						...existing.deploy,
						batch,
					},
				};
				// If fields are present and merging is not possible (e.g. wrong type), prompt
				if (
					!Array.isArray(existing.targets) ||
					!Array.isArray(existing.ignore) ||
					typeof batch !== "object"
				) {
					shouldPrompt = true;
				}
			} catch {
				shouldPrompt = true;
			}
		}

		// If merging is not possible and --force is not present, prompt user interactively
		if (shouldPrompt && !flags.force) {
			const answer = await ux.prompt(
				"smss.json exists and cannot be safely merged. Overwrite? (y/n)",
			);
			if (answer.trim().toLowerCase() !== "y") {
				this.log("Aborted. smss.json was not overwritten.");
				return;
			}
		}

		try {
			fs.writeFileSync(
				configPath,
				JSON.stringify(
					flags.force ? skeletonConfig : mergedConfig,
					null,
					2,
				),
				"utf-8",
			);

			this.log("\n✅ Configuration file created/updated: smss.json\n");

			this.log("📋 Configuration sections:");
			this.log("   • targets: (Optional) Specific folders to deploy");
			this.log("   • ignore: Files/folders excluded from deployment");
			this.log(
				"   • deploy.batch: (Optional) Multi-instance deployment configs\n",
			);

			this.log("🔧 Next steps:");
			this.log("   1. Edit smss.json with your actual values");
			this.log("   2. Replace placeholder URLs, keys, and app IDs");
			this.log(
				"   3. (Optional) Add targets if you want specific folders only",
			);
			this.log(
				"   4. (Optional) Add batch instances for multi-environment deployments",
			);
			this.log("   5. Run: semoss deploy --batch <name>\n");

			this.log("📚 Configuration reference:");
			this.log("   targets[]:");
			this.log(
				"     • (Empty by default) Specific directories to include",
			);
			this.log('     • Example: ["java", "py", "portals"]');
			this.log("     • Used if no -t flag provided at deploy time");
			this.log("     • Priority: -t flag > targets array > deploy all\n");
			this.log("   targets usage:");
			this.log("     • Leave empty to deploy everything by default");
			this.log(
				'     • Set to ["java", "py"] to only deploy those folders',
			);
			this.log(
				"     • Always override with: semoss deploy -t java -t portals\n",
			);

			this.log("   ignore[]:");
			this.log("     • Patterns to exclude from every deployment");
			this.log("     • Supports glob patterns (**, *, ?, [abc])");
			this.log("     • Examples: node_modules/**, *.local, build/**\n");

			this.log("   deploy.batch:");
			this.log("     • (Empty by default) Multi-instance deployments");
			this.log("     • Example structure:");
			this.log(
				'     •   "prod": { "endpoint": "...", "module": "...", ...',
			);
			this.log(
				'     •   "dev": { "endpoint": "...", "module": "...", ...',
			);
			this.log("     • Usage: semoss deploy --batch prod");
			this.log("     • Required fields: endpoint, module, accessKey,");
			this.log("       secretKey, app\n");
		} catch (error) {
			this.error(`Failed to create config file: ${error}`);
		}
	}
}
