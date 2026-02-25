import chalk from "chalk";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Config } from "../types.js";
import {
	getCurrentInstance,
	getCurrentInstanceName,
	resolveCredentials,
} from "./config.js";

/**
 * Display a context banner showing current instance and app information
 * This appears at the top of every command to help users know their context
 */
export function displayContextBanner(): void {
	const instanceName = getCurrentInstanceName();
	const instance = getCurrentInstance();
	const resolved = resolveCredentials();

	// Load project config if available
	let projectConfig: Config | null = null;
	const smssPath = path.join(process.cwd(), "smss.json");
	if (fs.existsSync(smssPath)) {
		try {
			projectConfig = JSON.parse(
				fs.readFileSync(smssPath, "utf8"),
			) as Config;
		} catch {
			// ignore parse errors
		}
	}

	// Build the banner parts
	const parts: string[] = [];

	// Instance info
	if (instanceName && instance) {
		parts.push(
			chalk.cyan.bold("Instance:") +
				" " +
				chalk.white(instanceName) +
				chalk.dim(` (${instance.module})`),
		);
	} else if (resolved.source === "env") {
		parts.push(
			chalk.yellow.bold("Instance:") +
				" " +
				chalk.white("Environment Variables") +
				chalk.dim(` (${resolved.module})`),
		);
	} else {
		parts.push(
			`${chalk.red.bold("Instance:")} ${chalk.white("Not Connected")}`,
		);
	}

	// App info
	if (projectConfig?.app) {
		parts.push(
			chalk.cyan.bold("App:") +
				" " +
				chalk.white(projectConfig.name) +
				chalk.dim(` (${projectConfig.app})`),
		);
	} else {
		parts.push(`${chalk.dim.bold("App:")} ${chalk.dim("Not Linked")}`);
	}

	// Create the banner
	const separator = chalk.dim("│");
	const banner = parts.join(` ${separator} `);

	// Top border
	console.log(chalk.dim("─".repeat(process.stdout.columns || 80)));
	console.log(banner);
	console.log(chalk.dim("─".repeat(process.stdout.columns || 80)));
	console.log();
}

/**
 * Display a simpler context line for commands that don't need the full banner
 */
export function displayContextLine(): string {
	const instanceName = getCurrentInstanceName();
	const resolved = resolveCredentials();

	// Load project config
	let projectConfig: Config | null = null;
	const smssPath = path.join(process.cwd(), "smss.json");
	if (fs.existsSync(smssPath)) {
		try {
			projectConfig = JSON.parse(
				fs.readFileSync(smssPath, "utf8"),
			) as Config;
		} catch {
			// ignore
		}
	}

	const parts: string[] = [];

	if (instanceName) {
		parts.push(chalk.cyan(instanceName));
	} else if (resolved.source === "env") {
		parts.push(chalk.yellow("env"));
	}

	if (projectConfig?.name) {
		parts.push(chalk.white(projectConfig.name));
	}

	if (parts.length > 0) {
		return chalk.dim("[") + parts.join(chalk.dim(" / ")) + chalk.dim("]");
	}

	return "";
}
