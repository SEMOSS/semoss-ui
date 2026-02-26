import * as fs from "node:fs";
import { getCurrentContext } from "./config.js";
import { getAllInstances } from "./getConfiguration.js";

/**
 * Normalized batch instance configuration
 */
export interface BatchInstance {
	endpoint: string;
	module: string;
	accessKey?: string;
	secretKey?: string;
	app?: string;
}

export interface BatchConfigResult {
	batchNames: string[];
	batchConfig: Record<string, BatchInstance>;
	/** Source of the batch config: "smss.json" or "global" */
	source: "smss.json" | "global";
}

/**
 * Loads batch configuration with proper priority:
 * 1. smss.json batch config (higher priority - project-level)
 * 2. Global config instances (lower priority - user-level fallback)
 *
 * @param configPath - Path to smss.json (defaults to "smss.json" in cwd)
 * @param batchInput - Batch names to process ("all" or comma-separated names)
 * @returns Normalized batch configuration with source information
 * @throws Error if no batch configuration is found in either source
 */
export async function getBatchConfig({
	configPath = "smss.json",
	batchInput = "all",
}: {
	configPath?: string;
	batchInput?: string;
} = {}): Promise<BatchConfigResult> {
	// Try smss.json first (higher priority)
	const smssResult = await tryLoadSmssJsonBatch(configPath, batchInput);
	if (smssResult) {
		return smssResult;
	}

	// Fall back to global config instances (lower priority)
	const globalResult = tryLoadGlobalInstances(batchInput);
	if (globalResult) {
		return globalResult;
	}

	// Neither source has batch config
	throw new Error(
		`No batch configuration found.\n\nOptions:\n` +
			`1. Add batch config to smss.json:\n` +
			`   {\n` +
			`     "deploy": {\n` +
			`       "batch": {\n` +
			`         "dev": { "endpoint": "https://dev.example.com", "module": "/Monolith_Dev" },\n` +
			`         "prod": { "endpoint": "https://prod.example.com", "module": "/Monolith" }\n` +
			`       }\n` +
			`     }\n` +
			`   }\n\n` +
			`2. Or add instances to global config:\n` +
			`   smss config add <instance-name>`,
	);
}

/**
 * Try to load batch config from smss.json
 */
async function tryLoadSmssJsonBatch(
	configPath: string,
	batchInput: string,
): Promise<BatchConfigResult | null> {
	try {
		const content = await fs.promises.readFile(configPath, "utf-8");
		const configData = JSON.parse(content);

		if (
			!configData?.deploy?.batch ||
			typeof configData.deploy.batch !== "object"
		) {
			return null;
		}

		const rawBatch = configData.deploy.batch as Record<string, unknown>;
		const batchNames = resolveBatchNames(batchInput, Object.keys(rawBatch));

		// Validate all requested batches exist
		const invalidBatches = batchNames.filter((name) => !(name in rawBatch));
		if (invalidBatches.length > 0) {
			const availableBatches = Object.keys(rawBatch).join(", ");
			throw new Error(
				`Batch(es) not found in smss.json: ${invalidBatches.join(", ")}\nAvailable: ${availableBatches}`,
			);
		}

		// Normalize to BatchInstance format
		const batchConfig: Record<string, BatchInstance> = {};
		for (const name of batchNames) {
			const entry = rawBatch[name];
			if (typeof entry !== "object" || entry === null) {
				throw new Error(
					`Batch "${name}" must be an object with endpoint/module configuration`,
				);
			}
			const e = entry as Record<string, unknown>;
			batchConfig[name] = {
				endpoint: (e.endpoint as string) || "",
				module: (e.module as string) || (e.endpoint as string) || "",
				accessKey: e.accessKey as string | undefined,
				secretKey: e.secretKey as string | undefined,
				app: e.app as string | undefined,
			};
		}

		return { batchNames, batchConfig, source: "smss.json" };
	} catch (err) {
		// If file doesn't exist or is invalid JSON, return null to try next source
		if (
			err instanceof Error &&
			(err.message.includes("ENOENT") ||
				err.message.includes("Unexpected token"))
		) {
			return null;
		}
		// Re-throw validation errors
		throw err;
	}
}

/**
 * Try to load instances from global config
 */
function tryLoadGlobalInstances(batchInput: string): BatchConfigResult | null {
	const allInstances = getAllInstances();
	const instanceNames = Object.keys(allInstances);

	if (instanceNames.length === 0) {
		return null;
	}

	const batchNames = resolveBatchNames(batchInput, instanceNames);

	// Validate all requested instances exist
	const invalidInstances = batchNames.filter(
		(name) => !(name in allInstances),
	);
	if (invalidInstances.length > 0) {
		const available = instanceNames.join(", ");
		throw new Error(
			`Instance(s) not found in global config: ${invalidInstances.join(", ")}\nAvailable: ${available}`,
		);
	}

	// Get current context to find the current app
	const context = getCurrentContext();
	const currentAppName = context?.app?.name;

	// Convert to BatchInstance format
	const batchConfig: Record<string, BatchInstance> = {};
	for (const name of batchNames) {
		const instance = allInstances[name];

		// Check if the current app exists in this instance's apps
		let appId: string | undefined;
		if (currentAppName && instance.apps && instance.apps[currentAppName]) {
			appId = instance.apps[currentAppName].appId;
		}

		batchConfig[name] = {
			endpoint: instance.endpoint,
			module: instance.module,
			accessKey: instance.accessKey,
			secretKey: instance.secretKey,
			app: appId,
		};
	}

	return { batchNames, batchConfig, source: "global" };
}

/**
 * Resolve batch names from input string
 */
function resolveBatchNames(
	batchInput: string,
	availableNames: string[],
): string[] {
	if (batchInput.toLowerCase() === "all") {
		return availableNames;
	}
	return batchInput
		.split(",")
		.map((name) => name.trim())
		.filter((name) => name.length > 0);
}
