/**
 * Command line entry: `pnpm generate --openapi FILE` and `pnpm generate:check --openapi FILE`.
 */
import { join, resolve } from "node:path";
import { createBiomeFormatter, findRepoRoot, generate } from "./generate.ts";
import { SpecError } from "./spec.ts";

const sdkDir = resolve(import.meta.dirname, "..", "..");
const outDir = join(sdkDir, "src", "generated");

function parseArgs(argv: string[]): { openapi: string; check: boolean } {
	let openapi: string | undefined;
	let check = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--check") {
			check = true;
		} else if (arg === "--openapi") {
			openapi = argv[++i];
			if (!openapi) {
				throw new SpecError("--openapi needs a file");
			}
		} else if (arg.startsWith("--openapi=")) {
			openapi = arg.slice("--openapi=".length);
		} else {
			throw new SpecError(`Unknown argument "${arg}"`);
		}
	}
	if (!openapi) {
		throw new SpecError(
			"--openapi FILE is required: the backend's OpenAPI document, such as Monolith/target/generator/openapi.json",
		);
	}
	return { openapi: resolve(process.cwd(), openapi), check };
}

try {
	const args = parseArgs(process.argv.slice(2));
	const result = generate({
		outDir,
		openapi: args.openapi,
		check: args.check,
		format: createBiomeFormatter(findRepoRoot(sdkDir)),
	});

	for (const path of result.kept) {
		console.warn(
			`Left ${path} in place: it is in the last manifest but has no generated header.`,
		);
	}

	if (args.check) {
		const drift = [...result.changed, ...result.removed];
		if (drift.length > 0) {
			console.error(
				`Generated SDK code is out of date:\n${drift.map((p) => `  ${p}`).join("\n")}\nRun "pnpm --filter @semoss/sdk generate --openapi FILE".`,
			);
			process.exit(1);
		}
		console.log("Generated SDK code is up to date.");
	} else if (result.changed.length + result.removed.length === 0) {
		console.log("Generated SDK code is already up to date.");
	} else {
		for (const path of result.changed) {
			console.log(`wrote   src/generated/${path}`);
		}
		for (const path of result.removed) {
			console.log(`removed src/generated/${path}`);
		}
	}
} catch (error) {
	if (error instanceof SpecError) {
		console.error(`sdk-generator: ${error.message}`);
		process.exit(1);
	}
	throw error;
}
