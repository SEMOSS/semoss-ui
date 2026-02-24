import { Command, Flags, ux } from "@oclif/core";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export default class Create extends Command {
	static args = {};

	static description = "Create a new SEMOSS app from template";

	static examples = [
		`<%= config.bin %> <%= command.id %> --name="My App"
create a new SEMOSS app named "My App" in current directory
`,
		`<%= config.bin %> <%= command.id %> -n="My App" -d="./my-app"
create in specific directory
`,
	];

	static flags = {
		name: Flags.string({
			char: "n",
			description: "Application name",
			required: false,
		}),
		directory: Flags.string({
			char: "d",
			description: "Target directory (defaults to current directory)",
			required: false,
		}),
		force: Flags.boolean({
			char: "f",
			description: "Overwrite if directory exists",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const { flags } = await this.parse(Create);

		// Prompt for app name if not provided
		let appName = flags.name;
		if (!appName) {
			appName = await ux.prompt("What is the name of your app?", {
				required: true,
			});
		}

		const targetDir =
			flags.directory || appName.toLowerCase().replace(/\s+/g, "-");
		const forceOverwrite = flags.force;

		// Resolve target directory path
		const absolutePath = path.resolve(targetDir);

		// Check if directory exists
		if (fs.existsSync(absolutePath) && !forceOverwrite) {
			this.error(
				`Directory "${targetDir}" already exists. Use --force to overwrite.`,
			);
		}

		// Get template path from CLI module location
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const templatePath = path.join(
			__dirname,
			"..",
			"..",
			"templates",
			"base-app",
		);

		if (!fs.existsSync(templatePath)) {
			this.error(
				"Template not found. Make sure the CLI is correctly installed.",
			);
		}

		try {
			// Create target directory
			if (!fs.existsSync(absolutePath)) {
				fs.mkdirSync(absolutePath, { recursive: true });
			}

			this.log(`📦 Creating new SEMOSS app: ${appName}`);
			this.log(`📁 Location: ${absolutePath}`);

			// Copy template files recursively
			this.copyTemplate(templatePath, absolutePath);

			// Update package.json with app name
			const packageJsonPath = path.join(absolutePath, "package.json");
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf-8"),
				);
				packageJson.name = appName.toLowerCase().replace(/\s+/g, "-");
				packageJson.description = `A SEMOSS application - ${appName}`;
				fs.writeFileSync(
					packageJsonPath,
					JSON.stringify(packageJson, null, 2),
				);
			}

			this.log(`\n✅ App created successfully!\n`);
			this.log(`🚀 Next steps:\n`);
			this.log(`   cd ${targetDir}`);
			this.log(`   pnpm install`);
			this.log(`   cp .env.example .env`);
			this.log(`   # Edit .env with your SEMOSS server details`);
			this.log(`   semoss init --name="${appName}"`);
			this.log(`   pnpm dev    # (optional) Start dev server`);
			this.log(`   semoss deploy\n`);
			this.log(
				`📖 See README.md in the app directory for more information.`,
			);
		} catch (error) {
			this.error(`Failed to create app: ${error}`);
		}
	}

	private copyTemplate(source: string, destination: string): void {
		const items = fs.readdirSync(source, { withFileTypes: true });

		// Directories and files to skip when copying template
		const skipItems = new Set([
			"node_modules",
			"dist",
			".turbo",
			".next",
			"build",
			".env",
			".env.local",
		]);

		for (const item of items) {
			if (skipItems.has(item.name)) {
				continue;
			}

			const sourcePath = path.join(source, item.name);
			const destPath = path.join(destination, item.name);

			if (item.isDirectory()) {
				fs.mkdirSync(destPath, { recursive: true });
				this.copyTemplate(sourcePath, destPath);
			} else {
				fs.copyFileSync(sourcePath, destPath);
			}
		}
	}
}
