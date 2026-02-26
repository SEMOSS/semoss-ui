#!/usr/bin/env node

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Node.js version check
(function checkNodeVersion() {
	const min = [24, 0, 0];
	const current = process.versions.node.split(".").map(Number);
	function greaterOrEqual(a, b) {
		for (let i = 0; i < 3; i++)
			if (a[i] > b[i]) return true;
			else if (a[i] < b[i]) return false;
		return true;
	}
	if (!greaterOrEqual(current, min)) {
		// eslint-disable-next-line no-console
		console.error(
			`\n❌ Node.js version ${process.versions.node} is not supported. Required: >=24.0.0.\n`,
		);
		process.exit(1);
	}
})();

// Check if global config is set up (skip for certain commands)
(function checkGlobalConfig() {
	// Commands that don't require config
	const skipCommands = [
		"onboard",
		"help",
		"--help",
		"-h",
		"--version",
		"-v",
		"log",
		"create",
		"config",
	];
	const args = process.argv.slice(2);
	const command = args[0] || "";

	// Skip check if running a command that doesn't need config
	if (
		skipCommands.some(
			(skip) => command === skip || command.startsWith(skip),
		)
	) {
		return;
	}

	// Check if credentials.json exists
	const xdgConfigHome = process.env.XDG_CONFIG_HOME;
	const baseDir = xdgConfigHome || path.join(os.homedir(), ".config");
	const credentialsPath = path.join(baseDir, "semoss", "credentials.json");

	if (!fs.existsSync(credentialsPath)) {
		// eslint-disable-next-line no-console
		console.warn(
			`\n⚠️  No SEMOSS configuration found. Run 'semoss onboard' to set up your CLI.\n`,
		);
	}
})();

async function main() {
	const { execute } = await import("@oclif/core");
	await execute({ dir: import.meta.url });
}

await main();
