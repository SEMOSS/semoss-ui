import { config as dotenvConfig } from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import type { AppConfig, Config, InstanceConfig } from "../types.js";
import {
	getCurrentContext,
	getCurrentInstance,
	loadCredentials,
} from "./config.js";

/**
 * Configuration source types in priority order
 */
export type ConfigSource =
	| "env.local" // Local .env.local file (highest priority for secrets)
	| "env" // Local .env file (backward compatibility)
	| "smss.json" // Project-level smss.json (batch deployments)
	| "global" // Global ~/.config/semoss/ (default for CLI commands)
	| "none"; // No configuration found

/**
 * Resolved configuration object
 */
export interface ResolvedConfig {
	/** SEMOSS module/endpoint URL */
	module: string | null;

	/** Access key for authentication */
	accessKey: string | null;

	/** Secret key for authentication */
	secretKey: string | null;

	/** App ID */
	appId: string | null;

	/** App name */
	appName: string | null;

	/** Target directories for deployment */
	targets: string[];

	/** Ignore patterns */
	ignore: string[];

	/** Instance name (if from global config) */
	instanceName: string | null;

	/** Full instance config (if from global config) */
	instance: InstanceConfig | null;

	/** Full app config (if from global config) */
	app: AppConfig | null;

	/** Source of the configuration */
	source: ConfigSource;

	/** Whether configuration is valid for deployment */
	isValid: boolean;

	/** Validation errors if any */
	errors: string[];

	/** Raw smss.json config (if loaded from smss.json or env file) */
	rawConfig: Config | null;
}

/**
 * Options for getConfiguration
 */
export interface GetConfigurationOptions {
	/** Specific instance name to use (overrides current instance) */
	instanceName?: string;

	/** Path to smss.json config file */
	configPath?: string;

	/** Working directory to search for config files (defaults to cwd) */
	cwd?: string;

	/**
	 * Path to a custom .env file or directory containing .env files.
	 * - If a file path: loads that file as highest priority
	 * - If a directory: looks for .env and .env.local in that directory
	 */
	envPath?: string;

	/** Skip loading .env files */
	skipEnv?: boolean;

	/** Skip loading smss.json */
	skipSmss?: boolean;

	/** Skip loading global config */
	skipGlobal?: boolean;
}

/**
 * Load and parse .env file if it exists
 */
function loadEnvFile(
	envPath: string,
): Record<string, string | undefined> | null {
	try {
		if (fs.existsSync(envPath)) {
			const result = dotenvConfig({ path: envPath });
			if (result.parsed) {
				return result.parsed;
			}
		}
	} catch {
		// Ignore errors
	}
	return null;
}

/**
 * Combine endpoint and module, handling trailing/leading slashes
 */
function combineEndpointAndModule(endpoint: string, module: string): string {
	let cleanEndpoint = endpoint;
	const cleanModule = module;

	// Remove trailing slash from endpoint if module starts with slash
	if (cleanEndpoint.endsWith("/") && cleanModule.startsWith("/")) {
		cleanEndpoint = cleanEndpoint.slice(0, -1);
	}

	return `${cleanEndpoint}${cleanModule}`;
}

/**
 * Load and parse smss.json file if it exists
 */
function loadSmssConfig(configPath: string): Config | null {
	try {
		if (fs.existsSync(configPath)) {
			const content = fs.readFileSync(configPath, "utf-8");
			return JSON.parse(content) as Config;
		}
	} catch {
		// Ignore errors
	}
	return null;
}

/**
 * Get unified configuration from multiple sources.
 *
 * Priority order (highest to lowest):
 * 1. `.env.local` - Local environment overrides (not committed to git)
 * 2. `.env` - Local environment file (backward compatibility)
 * 3. `smss.json` - Project-level config (batch deployments, targets, ignore)
 * 4. Global config - ~/.config/semoss/ (instances, credentials)
 *
 * This function merges configuration from all available sources,
 * with higher priority sources overriding lower priority ones.
 *
 * @example
 * ```typescript
 * // Basic usage - auto-detect configuration
 * const config = getConfiguration();
 * if (config.isValid) {
 *   console.log(`Using ${config.source} config for ${config.module}`);
 * }
 *
 * // Specify instance explicitly
 * const config = getConfiguration({ instanceName: "production" });
 *
 * // Use custom config file path
 * const config = getConfiguration({ configPath: "./custom-config.json" });
 * ```
 */
export function getConfiguration(
	options: GetConfigurationOptions = {},
): ResolvedConfig {
	const {
		instanceName,
		configPath,
		cwd = process.cwd(),
		envPath,
		skipEnv = false,
		skipSmss = false,
		skipGlobal = false,
	} = options;

	// Determine env file search directory
	let envDir = cwd;
	let customEnvFile: string | null = null;

	if (envPath) {
		try {
			const stat = fs.statSync(envPath);
			if (stat.isDirectory()) {
				envDir = envPath;
			} else if (stat.isFile()) {
				customEnvFile = envPath;
			}
		} catch {
			// Path doesn't exist, treat as file path anyway
			customEnvFile = envPath;
		}
	}

	const errors: string[] = [];
	let source: ConfigSource = "none";

	// Initialize with nulls
	let module: string | null = null;
	let accessKey: string | null = null;
	let secretKey: string | null = null;
	let appId: string | null = null;
	let appName: string | null = null;
	let targets: string[] = [];
	let ignore: string[] = [];
	let instance: InstanceConfig | null = null;
	let resolvedInstanceName: string | null = null;
	let app: AppConfig | null = null;
	let rawConfig: Config | null = null;

	// =========================================================================
	// Priority 4: Global config (lowest priority, loaded first)
	// =========================================================================
	if (!skipGlobal) {
		try {
			const globalContext = getCurrentContext();
			const credentials = loadCredentials();

			if (instanceName) {
				// Use specific instance if requested
				instance = credentials.instances[instanceName] || null;
				resolvedInstanceName = instanceName;
			} else if (globalContext.instance) {
				instance = globalContext.instance;
				resolvedInstanceName = globalContext.instanceName;
			}

			if (instance) {
				module = instance.module;
				accessKey = instance.accessKey;
				secretKey = instance.secretKey;
				source = "global";

				// Get app from the resolved instance's apps using currentApp from credentials
				const currentAppId = credentials.currentApp;
				if (
					currentAppId &&
					instance.apps &&
					instance.apps[currentAppId]
				) {
					app = instance.apps[currentAppId];
					appId = app.appId;
					appName = app.name;
					// Fall back to global settings if app doesn't have targets/ignore
					targets =
						app.targets ||
						credentials.settings?.defaultTargets ||
						[];
					ignore =
						app.ignore || credentials.settings?.globalIgnore || [];
				} else {
					// No specific app, use global settings as defaults
					targets = credentials.settings?.defaultTargets || [];
					ignore = credentials.settings?.globalIgnore || [];
				}
			}
		} catch {
			// Global config not available
		}
	}

	// =========================================================================
	// Priority 3: smss.json (project-level config)
	// =========================================================================
	if (!skipSmss) {
		const smssPath = configPath || path.join(cwd, "smss.json");
		const smssConfig = loadSmssConfig(smssPath);

		if (smssConfig) {
			// Store the raw config for consumers that need it
			rawConfig = smssConfig;

			// smss.json provides app info and deployment settings
			if (smssConfig.app) {
				appId = smssConfig.app;
			}
			if (smssConfig.name) {
				appName = smssConfig.name;
			}
			if (smssConfig.targets && smssConfig.targets.length > 0) {
				targets = smssConfig.targets;
			}
			if (smssConfig.ignore && smssConfig.ignore.length > 0) {
				ignore = smssConfig.ignore;
			}

			// Only update source if we got meaningful data from smss.json
			// Note: env files are loaded after this, so they will override if present
			if (smssConfig.app) {
				source = "smss.json";
			}
		}
	}

	// =========================================================================
	// Priority 2: .env file (backward compatibility)
	// =========================================================================
	if (!skipEnv) {
		const defaultEnvPath = path.join(envDir, ".env");
		const envVars = loadEnvFile(defaultEnvPath);

		if (envVars) {
			if (envVars.MODULE) {
				// If MODULE doesn't start with http and ENDPOINT exists, combine them
				if (!envVars.MODULE.startsWith("http") && envVars.ENDPOINT) {
					module = combineEndpointAndModule(
						envVars.ENDPOINT,
						envVars.MODULE,
					);
				} else {
					module = envVars.MODULE;
				}
				source = "env";
			}
			if (envVars.ACCESS_KEY) {
				accessKey = envVars.ACCESS_KEY;
				source = "env";
			}
			if (envVars.SECRET_KEY) {
				secretKey = envVars.SECRET_KEY;
				source = "env";
			}
			if (envVars.APP) {
				appId = envVars.APP;
				source = "env";
			}
			if (envVars.VITE_APP) {
				appId = envVars.VITE_APP;
				source = "env";
			}
		}
	}

	// =========================================================================
	// Priority 1: .env.local file or custom env file (highest priority)
	// =========================================================================
	if (!skipEnv) {
		// If a custom env file was specified, use it as highest priority
		// Otherwise, look for .env.local in the env directory
		const envLocalPath = customEnvFile || path.join(envDir, ".env.local");
		const envLocalVars = loadEnvFile(envLocalPath);
		const sourceName = customEnvFile ? "env" : "env.local";

		if (envLocalVars) {
			if (envLocalVars.MODULE) {
				// If MODULE doesn't start with http and ENDPOINT exists, combine them
				if (
					!envLocalVars.MODULE.startsWith("http") &&
					envLocalVars.ENDPOINT
				) {
					module = combineEndpointAndModule(
						envLocalVars.ENDPOINT,
						envLocalVars.MODULE,
					);
				} else {
					module = envLocalVars.MODULE;
				}
				source = sourceName;
			}
			if (envLocalVars.ACCESS_KEY) {
				accessKey = envLocalVars.ACCESS_KEY;
				source = sourceName;
			}
			if (envLocalVars.SECRET_KEY) {
				secretKey = envLocalVars.SECRET_KEY;
				source = sourceName;
			}
			if (envLocalVars.APP) {
				appId = envLocalVars.APP;
				source = sourceName;
			}
			if (envLocalVars.VITE_APP) {
				appId = envLocalVars.VITE_APP;
				source = sourceName;
			}
		}
	}

	// =========================================================================
	// Validation
	// =========================================================================
	if (!module) {
		errors.push(
			"No MODULE configured. Set MODULE in .env, .env.local, or run 'semoss onboard'.",
		);
	} else if (!module.startsWith("http")) {
		errors.push(
			"MODULE must start with http:// or https://. Check your ENDPOINT and MODULE configuration.",
		);
	}
	if (!accessKey) {
		errors.push(
			"No ACCESS_KEY configured. Set ACCESS_KEY in .env, .env.local, or run 'semoss onboard'.",
		);
	}
	if (!secretKey) {
		errors.push(
			"No SECRET_KEY configured. Set SECRET_KEY in .env, .env.local, or run 'semoss onboard'.",
		);
	}

	const isValid = errors.length === 0;

	return {
		module,
		accessKey,
		secretKey,
		appId,
		appName,
		targets,
		ignore,
		instanceName: resolvedInstanceName,
		instance,
		app,
		source,
		isValid,
		errors,
		rawConfig,
	};
}

/**
 * Get configuration or throw an error if invalid.
 * Useful for commands that require valid configuration to proceed.
 *
 * @throws Error if configuration is invalid
 */
export function getConfigurationOrThrow(
	options: GetConfigurationOptions = {},
): ResolvedConfig {
	const config = getConfiguration(options);

	if (!config.isValid) {
		throw new Error(
			`Invalid configuration:\n${config.errors.map((e) => `  - ${e}`).join("\n")}`,
		);
	}

	return config;
}

/**
 * Get all available instances from global config
 */
export function getAllInstances(): Record<string, InstanceConfig> {
	const credentials = loadCredentials();
	return credentials.instances;
}

/**
 * Get batch configuration from smss.json
 * @deprecated Use getBatchConfig from batchHelpers.js instead
 */
export function getSmssJsonBatchConfig(
	configPath?: string,
): Record<string, unknown> | null {
	const smssPath = configPath || path.join(process.cwd(), "smss.json");
	const smssConfig = loadSmssConfig(smssPath);

	if (smssConfig?.deploy?.batch) {
		return smssConfig.deploy.batch;
	}

	return null;
}

/**
 * Check if a specific configuration source exists
 */
export function hasConfigSource(
	source: ConfigSource,
	cwd: string = process.cwd(),
): boolean {
	switch (source) {
		case "env.local":
			return fs.existsSync(path.join(cwd, ".env.local"));
		case "env":
			return fs.existsSync(path.join(cwd, ".env"));
		case "smss.json":
			return fs.existsSync(path.join(cwd, "smss.json"));
		case "global": {
			const instance = getCurrentInstance();
			return instance !== null;
		}
		default:
			return false;
	}
}

/**
 * Get a summary of available configuration sources for debugging
 */
export function getConfigSources(cwd: string = process.cwd()): {
	available: ConfigSource[];
	active: ConfigSource;
	details: Record<ConfigSource, { exists: boolean; path?: string }>;
} {
	const config = getConfiguration({ cwd });

	const globalConfigPath = "~/.config/semoss/credentials.json";

	const details: Record<ConfigSource, { exists: boolean; path?: string }> = {
		"env.local": {
			exists: hasConfigSource("env.local", cwd),
			path: path.join(cwd, ".env.local"),
		},
		env: {
			exists: hasConfigSource("env", cwd),
			path: path.join(cwd, ".env"),
		},
		"smss.json": {
			exists: hasConfigSource("smss.json", cwd),
			path: path.join(cwd, "smss.json"),
		},
		global: {
			exists: hasConfigSource("global", cwd),
			path: globalConfigPath,
		},
		none: {
			exists: false,
		},
	};

	const available = (
		["env.local", "env", "smss.json", "global"] as ConfigSource[]
	).filter((s) => details[s].exists);

	return {
		available,
		active: config.source,
		details,
	};
}
