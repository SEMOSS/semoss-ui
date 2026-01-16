import * as yaml from "js-yaml";
// ConfigManager: load/validate/serialize Semoss Assistant YAML configuration,
// bridging webview <-> extension via postMessage. Exposes singleton instance.
import type {
	ConfigValidationError,
	ConfigValidationResult,
	SemossConfig,
} from "../types/config";
import { DEFAULT_MODELS, DEFAULT_PREFERENCES } from "../types/config";

// Declare vscode API interface for VS Code webview
interface VSCodeAPI {
	postMessage: (message: Record<string, unknown>) => void;
}

// Type for VS Code message events
interface VSCodeMessageEvent {
	data: {
		type: string;
		config?: string;
		[key: string]: unknown;
	};
}

// Helper to safely access window in webview environment
function getWebviewWindow() {
	try {
		// Access window through globalThis to avoid TypeScript issues
		const globalWin = (
			globalThis as typeof globalThis & {
				window?: typeof globalThis & {
					vscode?: VSCodeAPI;
					addEventListener: (
						type: string,
						listener: (event: VSCodeMessageEvent) => void,
					) => void;
					removeEventListener: (
						type: string,
						listener: (event: VSCodeMessageEvent) => void,
					) => void;
				};
			}
		).window;
		return globalWin || null;
	} catch {
		return null;
	}
}

/**
 * Configuration Manager for Semoss Assistant
 * Handles loading, saving, and validation of YAML configuration
 * Similar to Continue.dev's configuration management
 */
export class ConfigManager {
	private static instance: ConfigManager;
	private config: SemossConfig | null = null;
	private listeners: Array<(config: SemossConfig) => void> = [];

	private constructor() {}

	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	/**
	 * Load configuration from YAML file
	 */
	async loadConfig(): Promise<SemossConfig> {
		try {
			// In VS Code webview, we'll request the config from the extension
			const configData = await this.requestConfigFromExtension();

			if (configData) {
				// Parse YAML string or accept object
				const parsedConfig: SemossConfig =
					typeof configData === "string"
						? this.parseYaml(configData)
						: (configData as unknown as SemossConfig);
				const validationResult = this.validateConfig(parsedConfig);
				if (validationResult.valid) {
					this.config = parsedConfig;
					this.notifyListeners();
					return this.config as SemossConfig;
				} else {
					console.warn(
						"Configuration validation failed:",
						validationResult.errors,
					);
					this.config = this.mergeWithDefaults(parsedConfig);
					return this.config as SemossConfig;
				}
			}

			this.config = this.getDefaultConfig();
			return this.config as SemossConfig;
		} catch (error) {
			console.error("Error loading configuration:", error);
			this.config = this.getDefaultConfig();
			return this.config as SemossConfig;
		}
	}

	/**
	 * Save configuration to YAML file
	 */
	async saveConfig(config: SemossConfig): Promise<boolean> {
		try {
			const validation = this.validateConfig(config);
			if (!validation.valid) {
				console.error(
					"Configuration validation failed:",
					validation.errors,
				);
				return false;
			}

			this.config = config;

			// Send config to extension for saving and wait for response
			const success = await this.sendConfigToExtension(config);

			if (success) {
				this.notifyListeners();
			}

			return success;
		} catch (error) {
			console.error("Failed to save config:", error);
			return false;
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): SemossConfig {
		return this.config || this.getDefaultConfig();
	}

	/**
	 * Update specific configuration section
	 */
	async updateConfig<K extends keyof SemossConfig>(
		section: K,
		value: SemossConfig[K],
	): Promise<boolean> {
		const currentConfig = this.getConfig();
		const newConfig = {
			...currentConfig,
			[section]: value,
		};

		return await this.saveConfig(newConfig);
	}

	/**
	 * Add configuration change listener
	 */
	addListener(listener: (config: SemossConfig) => void): () => void {
		this.listeners.push(listener);

		// Return unsubscribe function
		return () => {
			const index = this.listeners.indexOf(listener);
			if (index > -1) {
				this.listeners.splice(index, 1);
			}
		};
	}

	/**
	 * Validate configuration structure and values
	 */
	validateConfig(config: SemossConfig): ConfigValidationResult {
		const errors: ConfigValidationError[] = [];
		const warnings: ConfigValidationError[] = [];

		// Validate models
		if (!config.models || config.models.length === 0) {
			errors.push({
				field: "models",
				message: "At least one model must be configured",
				type: "error",
			});
		}

		config.models?.forEach((model, index) => {
			if (!model.name) {
				errors.push({
					field: `models[${index}].name`,
					message: "Model name is required",
					type: "error",
				});
			}

			if (!model.provider) {
				errors.push({
					field: `models[${index}].provider`,
					message: "Model provider is required",
					type: "error",
				});
			}

			if (model.provider === "openai" && !model.apiKey) {
				warnings.push({
					field: `models[${index}].apiKey`,
					message: "API key is recommended for OpenAI models",
					type: "warning",
				});
			}

			if (
				model.temperature &&
				(model.temperature < 0 || model.temperature > 2)
			) {
				warnings.push({
					field: `models[${index}].temperature`,
					message: "Temperature should be between 0 and 2",
					type: "warning",
				});
			}
		});

		// Validate default model exists
		if (config.preferences?.chat?.defaultModel) {
			const defaultModelExists = config.models?.some(
				(model) => model.name === config.preferences.chat.defaultModel,
			);

			if (!defaultModelExists) {
				errors.push({
					field: "preferences.chat.defaultModel",
					message: "Default model must exist in models list",
					type: "error",
				});
			}
		}

		// Validate MCP servers
		config.mcpServers?.forEach((server, index) => {
			if (!server.name) {
				errors.push({
					field: `mcpServers[${index}].name`,
					message: "MCP server name is required",
					type: "error",
				});
			}

			if (!server.command) {
				errors.push({
					field: `mcpServers[${index}].command`,
					message: "MCP server command is required",
					type: "error",
				});
			}
		});

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Reset configuration to defaults
	 */
	async resetToDefaults(): Promise<boolean> {
		const defaultConfig = this.getDefaultConfig();
		return await this.saveConfig(defaultConfig);
	}

	/**
	 * Export configuration as YAML string
	 */
	exportAsYaml(): string {
		const config = this.getConfig();
		return this.stringifyYaml(config);
	}

	/**
	 * Import configuration from YAML string
	 */
	async importFromYaml(yamlString: string): Promise<boolean> {
		try {
			const config = this.parseYaml(yamlString);
			return await this.saveConfig(config);
		} catch (error) {
			console.error("Failed to import YAML:", error);
			return false;
		}
	}

	// Private methods

	private getDefaultConfig(): SemossConfig {
		return {
			models: DEFAULT_MODELS,
			mcpServers: [],
			preferences: DEFAULT_PREFERENCES,
			shortcuts: {
				openChat: "Ctrl+Shift+L",
				clearChat: "Ctrl+K",
				openSettings: "Ctrl+,",
				toggleModel: "Ctrl+M",
				executeCommand: "Enter",
				multilineInput: "Shift+Enter",
			},
			customCommands: [
				{
					name: "analyze-code",
					description: "Analyze selected code for improvements",
					prompt: "Please analyze this code and suggest improvements:\n\n```\n{selection}\n```",
				},
			],
			integrations: {
				semoss: {
					enableAutoDeployment: true,
					defaultInstance: "production",
					zipExclusions: ["node_modules", ".git", "*.log"],
				},
				github: {
					enablePullRequests: false,
					defaultBranch: "main",
					autoCommit: false,
				},
				vscode: {
					enableInlineCompletions: true,
					enableHover: true,
					enableCodeLens: true,
				},
			},
		};
	}

	private async requestConfigFromExtension(): Promise<string | null> {
		return new Promise((resolve) => {
			// Send message to VS Code extension to get config
			const webviewWindow = getWebviewWindow();
			if (webviewWindow?.vscode) {
				const messageHandler = (event: VSCodeMessageEvent) => {
					if (event.data.type === "configData") {
						webviewWindow?.removeEventListener(
							"message",
							messageHandler,
						);
						resolve(event.data.config || null);
					}
				};

				webviewWindow.addEventListener("message", messageHandler);
				webviewWindow.vscode.postMessage({ type: "getConfig" });

				// Timeout after 5 seconds
				setTimeout(() => {
					webviewWindow?.removeEventListener(
						"message",
						messageHandler,
					);
					resolve(null);
				}, 5000);
			} else {
				resolve(null);
			}
		});
	}

	private async sendConfigToExtension(
		config: SemossConfig,
	): Promise<boolean> {
		return new Promise((resolve) => {
			const webviewWindow = getWebviewWindow();
			if (webviewWindow?.vscode) {
				const messageHandler = (event: VSCodeMessageEvent) => {
					if (event.data.type === "configSaved") {
						webviewWindow?.removeEventListener(
							"message",
							messageHandler,
						);
						resolve(event.data.success === true);
					} else if (event.data.type === "configError") {
						webviewWindow?.removeEventListener(
							"message",
							messageHandler,
						);
						console.error("Config save error:", event.data.error);
						resolve(false);
					}
				};

				webviewWindow.addEventListener("message", messageHandler);

				const yamlString = this.stringifyYaml(config);
				webviewWindow.vscode.postMessage({
					type: "saveConfig",
					config: yamlString,
				});

				// Timeout after 5 seconds
				setTimeout(() => {
					webviewWindow?.removeEventListener(
						"message",
						messageHandler,
					);
					resolve(false);
				}, 5000);
			} else {
				resolve(false);
			}
		});
	}

	private parseYaml(yamlString: string): SemossConfig {
		try {
			const parsed = yaml.load(yamlString);
			if (!parsed || typeof parsed !== "object") {
				throw new Error("Invalid YAML: must be an object");
			}
			return parsed as SemossConfig;
		} catch (error) {
			console.error("YAML parsing error:", error);
			throw new Error(
				`Failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	private stringifyYaml(config: SemossConfig): string {
		try {
			return yaml.dump(config, {
				indent: 2,
				lineWidth: -1,
				noRefs: true,
				sortKeys: false,
			});
		} catch (error) {
			console.error("YAML stringify error:", error);
			// Fallback to JSON if YAML fails
			return JSON.stringify(config, null, 2);
		}
	}

	private mergeWithDefaults(config: Partial<SemossConfig>): SemossConfig {
		const defaults = this.getDefaultConfig();

		return {
			models: config.models || defaults.models,
			mcpServers: config.mcpServers || defaults.mcpServers,
			preferences: {
				...defaults.preferences,
				...config.preferences,
				chat: {
					...defaults.preferences.chat,
					...config.preferences?.chat,
				},
				ui: {
					...defaults.preferences.ui,
					...config.preferences?.ui,
				},
				code: {
					...defaults.preferences.code,
					...config.preferences?.code,
				},
				security: {
					...defaults.preferences.security,
					...config.preferences?.security,
				},
			},
			shortcuts: {
				...defaults.shortcuts,
				...config.shortcuts,
			},
			customCommands: config.customCommands || defaults.customCommands,
			integrations: {
				...defaults.integrations,
				...config.integrations,
				semoss: {
					...defaults.integrations.semoss,
					...config.integrations?.semoss,
				},
				github: {
					...defaults.integrations.github,
					...config.integrations?.github,
				},
				vscode: {
					...defaults.integrations.vscode,
					...config.integrations?.vscode,
				},
			},
		};
	}

	private notifyListeners(): void {
		if (this.config) {
			this.listeners.forEach((listener) => {
				listener(this.config as SemossConfig);
			});
		}
	}
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
