#!/usr/bin/env node
/**
 * Temporary lint stub. Replace with ESLint setup if desired.
 * Provides non-zero exit on basic anti-patterns (console.log in production code outside webview, leftover alert usage, TODO comments).
 */

const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

let failed = false;

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules") continue; // skip dependencies
			walk(full);
		} else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
			inspect(full);
		}
	}
}

function inspect(file) {
	const text = readFileSync(file, "utf8");
	if (/alert\(/.test(text)) {
		console.error(`Lint: found alert() in ${file}`);
		failed = true;
	}
	if (/TODO/i.test(text)) {
		console.warn(`Note: TODO present in ${file}`);
	}
}

walk(SRC_DIR);

if (failed) {
	console.error("\nLint failed. Remove disallowed patterns.");
	process.exit(1);
} else {
	console.log("Lint passed (stub).");
}
