import * as fs from "node:fs";

export interface BatchConfigResult {
	batchNames: string[];
	batchConfig: Record<string, any>;
}

/**
 * Loads and validates the batch config from smss.json, parses batch input, and returns batch names and config.
 * Throws on error.
 */
export async function getBatchConfig({
	configPath = "smss.json",
	batchInput = "all",
}: {
	configPath?: string;
	batchInput?: string;
}): Promise<BatchConfigResult> {
	let configData: any;
	try {
		const content = await fs.promises.readFile(configPath, "utf-8");
		configData = JSON.parse(content);
	} catch {
		throw new Error(
			`Batch config file not found or invalid: ${configPath}`,
		);
	}

	if (
		!configData ||
		typeof configData !== "object" ||
		!("deploy" in configData) ||
		typeof configData.deploy !== "object" ||
		configData.deploy === null ||
		!("batch" in configData.deploy) ||
		typeof configData.deploy.batch !== "object" ||
		configData.deploy.batch === null
	) {
		throw new Error(
			`❌ Batch configuration not found in smss.json.\n\nAdd batch configurations to your smss.json:\n\n{\n  "deploy": {\n    "batch": {\n      "dev": { "endpoint": "https://dev-server.com", "module": "/dev-insight", "accessKey": "key", "secretKey": "secret", "app": "dev-app" },\n      "staging": { "endpoint": "https://staging-server.com", "module": "/staging-insight", "accessKey": "key", "secretKey": "secret", "app": "staging-app" },\n      "prod": { "endpoint": "https://prod-server.com", "module": "/prod-insight", "accessKey": "key", "secretKey": "secret", "app": "prod-app" }\n    }\n  }\n}`,
		);
	}

	const batchConfig = configData.deploy.batch as Record<string, any>;
	let batchNames: string[];
	if (batchInput.toLowerCase() === "all") {
		batchNames = Object.keys(batchConfig);
	} else {
		batchNames = batchInput
			.split(",")
			.map((name) => name.trim())
			.filter((name) => name.length > 0);
	}

	// Validate all requested batches exist
	const invalidBatches = batchNames.filter((name) => !(name in batchConfig));
	if (invalidBatches.length > 0) {
		const availableBatches = Object.keys(batchConfig).join(", ");
		throw new Error(
			`❌ Batch(es) not found: ${invalidBatches.join(", ")}\nAvailable batches: ${availableBatches}`,
		);
	}

	return { batchNames, batchConfig };
}
