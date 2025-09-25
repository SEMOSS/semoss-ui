const configManager = require("./configManager");

/**
 * LLMService class to handle communication with configured LLM models
 */
class LLMService {
	constructor() {
		this.initialized = false;
	}

	mask(value) {
		if (!value || typeof value !== "string") return value;
		if (value.length <= 8) return "****";
		return `${value.slice(0, 2)}***${value.slice(-3)}`;
	}

	/**
	 * Initialize the service by loading configuration
	 */
	async initialize() {
		if (!this.initialized) {
			await configManager.loadConfig();
			this.initialized = true;
		}
	}

	/**
	 * Send a message to the LLM
	 */
	async sendMessage(message, modelName = null) {
		if (!message || typeof message !== "string") {
			throw new Error("Message must be a non-empty string");
		}
		await this.initialize();

		// Get the model to use
		const model = modelName
			? configManager.getModel(modelName)
			: configManager.getDefaultModel();

		if (!model) {
			throw new Error("No LLM model available");
		}

		if (model.enabled === false) {
			// Auto-enable if user explicitly selected (modelName provided) to reduce friction
			try {
				model.enabled = true;
				// Persist change back to config file
				const config = configManager.config;
				if (config && Array.isArray(config.models)) {
					config.models = config.models.map((m) =>
						m.name === model.name ? { ...m, enabled: true } : m,
					);
					await configManager.saveConfig(config);
					console.log(
						`Auto-enabled model '${model.name}' on first use.`,
					);
				}
			} catch (e) {
				console.warn(
					`Failed to auto-enable model ${model.name}:`,
					e.message,
				);
				throw new Error(`Model ${model.name} is not enabled`);
			}
		}

		try {
			const response = await this.callLLMAPI(model, message);
			return {
				success: true,
				response: response.content,
				model: model.name,
				usage: response.usage,
			};
		} catch (error) {
			// Do not log raw keys
			console.error("Error calling LLM:", error.message);
			return { success: false, error: error.message, model: model.name };
		}
	}

	/**
	 * Call the LLM API based on the model configuration
	 */
	async callLLMAPI(model, message) {
		const { default: fetch } = await import("node-fetch");

		// Prepare the request based on provider
		let url, headers, body;

		if (model.provider === "openai" || !model.provider) {
			// OpenAI-compatible API
			const effectiveBase = model.baseUrl || model.apiBase; // support apiBase alias
			url = effectiveBase
				? `${effectiveBase.replace(/\/$/, "")}/chat/completions`
				: "https://api.openai.com/v1/chat/completions";

			headers = {
				"Content-Type": "application/json",
				Authorization: `Bearer ${model.apiKey}`,
			};

			body = JSON.stringify({
				model: model.model,
				messages: [
					{
						role: "user",
						content: message,
					},
				],
				temperature: model.temperature || 0.7,
				max_tokens: model.maxTokens || 4096,
			});
		} else {
			throw new Error(`Unsupported provider: ${model.provider}`);
		}

		// Helper to perform request
		const doRequest = async (hdrs, attemptLabel) => {
			const res = await fetch(url, {
				method: "POST",
				headers: hdrs,
				body: body,
				timeout: 30000,
			});
			return { res, attemptLabel };
		};

		let { res: response, attemptLabel } = await doRequest(
			headers,
			"bearer",
		);

		// If unauthorized and apiKey looks like user:pass (contains :) try Basic auth fallback
		if (
			response.status === 401 &&
			model.apiKey &&
			model.apiKey.includes(":")
		) {
			try {
				const basic = Buffer.from(model.apiKey, "utf8").toString(
					"base64",
				);
				const basicHeaders = {
					...headers,
					Authorization: `Basic ${basic}`,
				};
				({ res: response, attemptLabel } = await doRequest(
					basicHeaders,
					"basic",
				));
			} catch {
				// continue with original error if fallback fails to even try
			}
		}

		if (!response.ok) {
			let errorText;
			try {
				errorText = await response.text();
			} catch {
				errorText = "<no body>";
			}
			if (errorText.length > 500)
				errorText = `${errorText.slice(0, 500)}...`;
			throw new Error(
				`LLM request failed (${attemptLabel}) HTTP ${response.status}: ${errorText}`,
			);
		}

		const data = await response.json();

		// Extract response based on provider
		if (model.provider === "openai" || !model.provider) {
			if (!data.choices || data.choices.length === 0) {
				throw new Error("No response from LLM");
			}

			return {
				content: data.choices[0].message.content,
				usage: data.usage,
			};
		}

		throw new Error(
			`Unknown response format for provider: ${model.provider}`,
		);
	}

	/**
	 * Get available models
	 */
	async getAvailableModels() {
		await this.initialize();
		return configManager.getEnabledModels();
	}

	/**
	 * Test connection to a specific model
	 */
	async testModel(modelName) {
		try {
			const response = await this.sendMessage(
				"Hello, this is a test message.",
				modelName,
			);
			return {
				success: response.success,
				model: modelName,
				error: response.error,
			};
		} catch (error) {
			return {
				success: false,
				model: modelName,
				error: error.message,
			};
		}
	}

	/**
	 * Stream response from LLM (for future implementation)
	 */
	async streamMessage(message, modelName = null) {
		// TODO: Implement streaming for real-time responses
		// For now, fall back to regular sendMessage
		return this.sendMessage(message, modelName);
	}
}

// Create singleton instance
const llmService = new LLMService();

module.exports = llmService;
