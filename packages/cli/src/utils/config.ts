import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type {
	CredentialsStore,
	GlobalConfig,
	InstanceConfig,
} from "../types.js";

/**
 * Get the config directory path following XDG Base Directory spec
 * Returns ~/.config/semoss on Unix-like systems
 */
export function getConfigDir(): string {
	const xdgConfigHome = process.env.XDG_CONFIG_HOME;
	const baseDir = xdgConfigHome || path.join(os.homedir(), ".config");
	return path.join(baseDir, "semoss");
}

/**
 * Get the credentials file path
 */
export function getCredentialsPath(): string {
	return path.join(getConfigDir(), "credentials.json");
}

/**
 * Get the global config file path
 */
export function getGlobalConfigPath(): string {
	return path.join(getConfigDir(), "config.json");
}

/**
 * Ensure the config directory exists
 */
export function ensureConfigDir(): void {
	const configDir = getConfigDir();
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
	}
}

/**
 * Read a JSON file safely, returning default value if it doesn't exist
 */
export function readJsonFile<T>(filePath: string, defaultValue: T): T {
	try {
		if (!fs.existsSync(filePath)) {
			return defaultValue;
		}
		const content = fs.readFileSync(filePath, "utf8");
		return JSON.parse(content) as T;
	} catch (error) {
		console.warn(`Warning: Could not read ${filePath}:`, error);
		return defaultValue;
	}
}

/**
 * Write a JSON file atomically
 * Writes to a temp file first, then renames to prevent corruption
 */
export function writeJsonFile<T>(filePath: string, data: T): void {
	ensureConfigDir();

	const tempPath = `${filePath}.tmp`;
	const content = JSON.stringify(data, null, 4);

	try {
		// Write to temp file
		fs.writeFileSync(tempPath, content, { mode: 0o600 });

		// Atomic rename
		fs.renameSync(tempPath, filePath);
	} catch (error) {
		// Clean up temp file if it exists
		if (fs.existsSync(tempPath)) {
			fs.unlinkSync(tempPath);
		}
		throw error;
	}
}

/**
 * Load the credentials store
 */
export function loadCredentials(): CredentialsStore {
	return readJsonFile<CredentialsStore>(getCredentialsPath(), {
		instances: {},
	});
}

/**
 * Save the credentials store
 */
export function saveCredentials(credentials: CredentialsStore): void {
	writeJsonFile(getCredentialsPath(), credentials);
}

/**
 * Load the global config
 */
export function loadGlobalConfig(): GlobalConfig {
	return readJsonFile<GlobalConfig>(getGlobalConfigPath(), {});
}

/**
 * Save the global config
 */
export function saveGlobalConfig(config: GlobalConfig): void {
	writeJsonFile(getGlobalConfigPath(), config);
}

/**
 * Get a specific instance configuration
 */
export function getInstance(instanceName: string): InstanceConfig | null {
	const credentials = loadCredentials();
	return credentials.instances[instanceName] || null;
}

/**
 * Get the current active instance name
 */
export function getCurrentInstanceName(): string | null {
	const credentials = loadCredentials();
	return credentials.currentInstance || null;
}

/**
 * Get the current active instance configuration
 */
export function getCurrentInstance(): InstanceConfig | null {
	const instanceName = getCurrentInstanceName();
	if (!instanceName) {
		return null;
	}
	return getInstance(instanceName);
}

/**
 * Resolve credentials from multiple sources in priority order:
 * 1. Explicit parameters
 * 2. Environment variables (.env)
 * 3. Global config (~/.config/semoss/)
 * 4. Project config (smss.json)
 */
export function resolveCredentials(options?: { instanceName?: string }): {
	module: string | null;
	accessKey: string | null;
	secretKey: string | null;
	app: string | null;
	source: "env" | "global" | "none";
} {
	// Priority 1: Environment variables (backward compatibility)
	if (
		process.env.MODULE &&
		process.env.ACCESS_KEY &&
		process.env.SECRET_KEY
	) {
		return {
			module: process.env.MODULE,
			accessKey: process.env.ACCESS_KEY,
			secretKey: process.env.SECRET_KEY,
			app: process.env.APP || null,
			source: "env",
		};
	}

	// Priority 2: Global config
	const instanceName = options?.instanceName || getCurrentInstanceName();
	if (instanceName) {
		const instance = getInstance(instanceName);
		if (instance) {
			return {
				module: instance.module,
				accessKey: instance.accessKey,
				secretKey: instance.secretKey,
				app: null,
				source: "global",
			};
		}
	}

	// No credentials found
	return {
		module: null,
		accessKey: null,
		secretKey: null,
		app: null,
		source: "none",
	};
}

/**
 * Get the current context (instance + app)
 * This is the central utility for unified config access
 */
export function getCurrentContext(): {
	instance: InstanceConfig | null;
	instanceName: string | null;
	app: import("../types.js").AppConfig | null;
	appId: string | null;
} {
	const credentials = loadCredentials();
	const globalConfig = loadGlobalConfig();

	// Get current instance
	const instanceName = credentials.currentInstance || null;
	const instance = instanceName ? credentials.instances[instanceName] : null;

	// Normalize instance data (handle old format)
	if (instance) {
		// Ensure endpoint field exists (derive from module if missing)
		if (!instance.endpoint && instance.module) {
			// Extract base URL from module
			const moduleUrl = new URL(instance.module);
			instance.endpoint = `${moduleUrl.protocol}//${moduleUrl.host}`;
		}

		// Ensure name field exists
		if (!instance.name) {
			instance.name = instanceName || "unknown";
		}

		// Ensure apps object exists
		if (!instance.apps) {
			instance.apps = {};
		}
	}

	// Get current app
	const appId = globalConfig.currentApp || null;
	let app: import("../types.js").AppConfig | null = null;

	if (appId && instance) {
		app = instance.apps[appId] || null;
	}

	return {
		instance,
		instanceName,
		app,
		appId,
	};
}
