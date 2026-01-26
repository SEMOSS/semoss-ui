const vscode = require("vscode");
const path = require("node:path");
const fs = require("node:fs");
const yaml = require("js-yaml");

/**
 * ConfigManager class to handle Semoss configuration
 */
class ConfigManager {
	constructor() {
		this.config = null;
		this.configPath = null;
	}

	/**
	 * Ensure configPath is initialized. Handles publisher/name case differences
	 * and falls back to deriving the extension root from __dirname.
	 */
	ensureConfigPath() {
		if (this.configPath) return this.configPath;
		let extensionRoot = null;
		try {
			// Find matching extension ignoring case for publisher.name
			const all = vscode.extensions.all || [];
			const targetId = "semoss.semoss-vscode";
			const match = all.find(
				(ext) =>
					(ext.id || "").toLowerCase() === targetId.toLowerCase(),
			);
			if (match) {
				extensionRoot = match.extensionPath;
			}
		} catch (e) {
			console.warn(
				"Could not enumerate extensions for Semoss path resolution:",
				e.message,
			);
		}
		if (!extensionRoot) {
			// When built: __dirname -> <extRoot>/out => go up one level
			// When dev: __dirname -> <extRoot>/src/utils => go up two levels
			const isDevelopment = __dirname.includes("src");
			extensionRoot = isDevelopment
				? path.resolve(__dirname, "../..")
				: path.resolve(__dirname, "..");
		}
		this.configPath = path.join(
			extensionRoot,
			"config",
			"semoss-config.yaml",
		);
		return this.configPath;
	}

	/**
	 * Load configuration from semoss-config.yaml
	 */
	async loadConfig() {
		try {
			this.ensureConfigPath();

			// Auto-create from example template if missing but example exists
			if (!fs.existsSync(this.configPath)) {
				try {
					const examplePath = this.configPath.replace(
						/semoss-config\.yaml$/,
						"semoss-config.example.yaml",
					);
					if (fs.existsSync(examplePath)) {
						const exampleContent = fs.readFileSync(
							examplePath,
							"utf8",
						);
						const dir = path.dirname(this.configPath);
						if (!fs.existsSync(dir))
							fs.mkdirSync(dir, { recursive: true });
						fs.writeFileSync(
							this.configPath,
							exampleContent,
							"utf8",
						);
						console.log(
							"Semoss config created from example template.",
						);
					}
				} catch (e) {
					console.warn(
						"Unable to auto-create semoss-config.yaml:",
						e.message,
					);
				}
			}

			if (fs.existsSync(this.configPath)) {
				const configContent = fs.readFileSync(this.configPath, "utf8");
				this.config = yaml.load(configContent);
				// Normalize models: if enabled is missing, default true
				if (Array.isArray(this.config?.models)) {
					this.config.models = this.config.models.map((m) => ({
						...m,
						enabled: m.enabled === undefined ? true : m.enabled,
					}));
				}
				console.log("Semoss configuration loaded successfully");
				return this.config;
			} else {
				console.warn(
					"Semoss configuration file not found at:",
					this.configPath,
				);
				return this.getDefaultConfig();
			}
		} catch (error) {
			console.error("Error loading Semoss configuration:", error);
			// Try to read the file content to diagnose the issue
			if (fs.existsSync(this.configPath)) {
				try {
					const rawContent = fs.readFileSync(this.configPath, "utf8");
					console.error(
						"Raw config content (first 500 chars):",
						rawContent.substring(0, 500),
					);
				} catch (readError) {
					console.error(
						"Could not read config file:",
						readError.message,
					);
				}
			}

			// Don't lose user's configuration - return minimal working config instead of empty defaults
			console.warn(
				"Using minimal fallback config to preserve any existing setup",
			);
			return this.getDefaultConfig();
		}
	}

	/**
	 * Get default configuration if file doesn't exist
	 */
	getDefaultConfig() {
		return {
			name: "semoss-agent",
			version: "1.0.0",
			models: [],
			mcpServers: [],
			preferences: {
				chat: {
					defaultModel: "",
					autoSave: true,
					persistHistory: true,
					maxHistoryLength: 100,
					enableTypingIndicator: true,
				},
				ui: {
					theme: "auto",
					fontSize: 14,
					fontFamily:
						'"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
					showLineNumbers: true,
					wordWrap: true,
				},
				code: {
					autoComplete: true,
					syntaxHighlighting: true,
					enableInlineChat: true,
					defaultLanguage: "javascript",
				},
			},
			shortcuts: {
				openChat: "Ctrl+Shift+L",
				clearChat: "Ctrl+K",
				openSettings: "Ctrl+,",
				toggleModel: "Ctrl+M",
				executeCommand: "Enter",
				multilineInput: "Shift+Enter",
			},
			customCommands: [],
			integrations: {
				semoss: {
					enabled: true,
					endpoint: "",
					apiKey: "",
				},
				github: {
					enabled: false,
					token: "",
				},
				vscode: {
					enabled: true,
				},
			},
		};
	}

	/**
	 * Get all available models
	 */
	getModels() {
		if (!this.config) {
			return [];
		}
		return this.config.models || [];
	}

	/**
	 * Get a specific model by name
	 */
	getModel(modelName) {
		const models = this.getModels();
		return models.find((model) => model.name === modelName);
	}

	/**
	 * Get the default model
	 */
	getDefaultModel() {
		const models = this.getModels();
		const defaultModelName = this.config?.preferences?.chat?.defaultModel;

		if (defaultModelName) {
			const defaultModel = models.find(
				(model) => model.name === defaultModelName,
			);
			if (defaultModel) {
				return defaultModel;
			}
		}

		// Return first enabled model if no default is set
		return models.find((model) => model.enabled) || models[0];
	}

	/**
	 * Get enabled models
	 */
	getEnabledModels() {
		return this.getModels().filter((model) => model.enabled);
	}

	/**
	 * Save configuration to file
	 */
	async saveConfig(config) {
		try {
			this.ensureConfigPath();

			const yamlContent = yaml.dump(config);
			// Ensure directory exists
			const dir = path.dirname(this.configPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(this.configPath, yamlContent, "utf8");
			this.config = config;
			console.log("Configuration saved successfully");
			return true;
		} catch (error) {
			console.error("Error saving configuration:", error);
			return false;
		}
	}

	/**
	 * Update a specific setting
	 */
	async updateSetting(key, value) {
		if (!this.config) {
			await this.loadConfig();
		}

		if (!this.config.preferences) {
			this.config.preferences = this.getDefaultConfig().preferences;
		}

		// Support dot notation for nested settings
		const keys = key.split(".");
		let current = this.config.preferences;

		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}

		current[keys[keys.length - 1]] = value;
		return this.saveConfig(this.config);
	}

	/**
	 * Get a specific setting
	 */
	getSetting(key, defaultValue = null) {
		if (!this.config || !this.config.preferences) {
			return defaultValue;
		}

		// Support dot notation for nested settings
		const keys = key.split(".");
		let current = this.config.preferences;

		for (let i = 0; i < keys.length; i++) {
			if (!current || current[keys[i]] === undefined) {
				return defaultValue;
			}
			current = current[keys[i]];
		}

		return current;
	}

	/**
	 * Export current configuration as YAML string
	 */
	exportAsYaml() {
		if (!this.config) {
			// Return default configuration if none loaded
			return yaml.dump(this.getDefaultConfig(), { indent: 2 });
		}
		return yaml.dump(this.config, { indent: 2 });
	}

	/**
	 * Import configuration from YAML string
	 */
	async importFromYaml(yamlContent) {
		try {
			const newConfig = yaml.load(yamlContent);

			// Validate the configuration structure
			if (!newConfig || typeof newConfig !== "object") {
				throw new Error(
					"Invalid configuration format: Configuration must be an object",
				);
			}

			// Validate required fields
			if (!Array.isArray(newConfig.models)) {
				throw new Error(
					"Invalid configuration: models must be an array",
				);
			}

			// Ensure models have required fields and set defaults
			newConfig.models = newConfig.models.map((model) => {
				if (!model.name || !model.provider || !model.model) {
					throw new Error(
						"Invalid model: name, provider, and model are required fields",
					);
				}

				// Set enabled to true by default if not specified
				if (model.enabled === undefined) {
					model.enabled = true;
				}

				return model;
			});

			// Merge with default config to ensure all required fields are present
			const defaultConfig = this.getDefaultConfig();
			this.config = {
				...defaultConfig,
				...newConfig,
				preferences: {
					...defaultConfig.preferences,
					...newConfig.preferences,
				},
			};

			// Save to file
			const saved = await this.saveConfig(this.config);
			if (!saved) {
				throw new Error("Failed to save configuration to file");
			}

			return true;
		} catch (error) {
			console.error("Failed to import YAML configuration:", error);
			throw new Error(`Failed to import configuration: ${error.message}`);
		}
	}
}

// Create singleton instance
const configManager = new ConfigManager();

// Add static getInstance method for compatibility
ConfigManager.getInstance = () => configManager;

module.exports = configManager;
