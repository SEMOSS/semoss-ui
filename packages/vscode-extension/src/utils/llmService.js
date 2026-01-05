const configManager = require("./configManager");
const mcpService = require("./mcpService");

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
			// Initialize MCP servers
			await mcpService.initialize();
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
	async callLLMAPI(model, userMessage) {
		const { default: fetch } = await import("node-fetch");

		// Ensure MCP service is initialized before getting tools
		await this.initialize();

		// Get available MCP tools
		let availableTools = mcpService.getAllTools();

		// If no tools found, try restarting MCP service (may have config changes)
		if (availableTools.length === 0) {
			try {
				await mcpService.restart();
				availableTools = mcpService.getAllTools();
			} catch (error) {
				console.error(
					"LLM Service: Failed to restart MCP service:",
					error,
				);
			}
		}

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

			// Prepare messages with system context about available tools
			const messages = [];

			// Add system message about available MCP tools
			if (availableTools.length > 0) {
				const toolsByServer = availableTools.reduce((acc, tool) => {
					if (!acc[tool.server]) acc[tool.server] = [];
					acc[tool.server].push(
						`  - ${tool.name}: ${tool.description}`,
					);
					return acc;
				}, {});

				const toolDescriptions = Object.entries(toolsByServer)
					.map(([server, tools]) => `${server}:\n${tools.join("\n")}`)
					.join("\n\n");

				messages.push({
					role: "system",
					content: `You are an AI assistant with access to MCP (Model Context Protocol) tools that can provide real-time information.

						Available tools grouped by server:
						${toolDescriptions}

						USAGE RULES:
						- ONLY use a tool if it EXACTLY matches what the user is asking for
						- If no tool exactly matches the user's request, provide a helpful generic response instead
						- Do NOT use tools as approximations - only use them when they directly fulfill the user's request
						- Be precise: if a user asks for "branches" but only "git_status" is available, don't use git_status

						Examples:
						- User asks "what's the git status" + git_status tool available → Use git_status tool
						- User asks "list branches" + git_branch tool available → Use git_branch tool  
						- User asks "list branches" but only git_status available → Give generic response about git branch commands
						- User asks general question + no relevant tools → Give helpful generic response`,
				});
			}

			messages.push({
				role: "user",
				content: userMessage,
			});

			const requestBody = {
				model: model.model,
				messages: messages,
				temperature: model.temperature || 0.7,
				max_tokens: model.maxTokens || 4096,
			};

			// Enable function calling to let LLM decide whether to use available tools
			if (availableTools.length > 0) {
				requestBody.tools = availableTools.map((tool) => ({
					type: "function",
					function: {
						name: tool.name,
						description: tool.description,
						parameters: tool.parameters || {
							type: "object",
							properties: {},
							required: [],
						},
					},
				}));
				requestBody.tool_choice = "auto"; // Let LLM decide when to use tools
			}

			body = JSON.stringify(requestBody);
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

			const choice = data.choices[0];
			const message = choice.message;

			// Check if LLM decided to use a tool (function calling)
			if (message.tool_calls && message.tool_calls.length > 0) {
				const toolCall = message.tool_calls[0];
				const toolName = toolCall.function.name;
				const toolArgs = JSON.parse(
					toolCall.function.arguments || "{}",
				);

				// Find the tool in available tools
				const selectedTool = availableTools.find(
					(tool) => tool.name === toolName,
				);
				if (selectedTool) {
					try {
						// Execute the tool that LLM selected
						const toolResult = await mcpService.executeTool(
							selectedTool.server,
							selectedTool.name,
							toolArgs,
						);

						if (toolResult.success) {
							// Make a follow-up call to LLM to process and format the tool result
							const followUpMessages = [
								{
									role: "system",
									content: `You are an AI assistant that helps users by executing tools and interpreting the results. When a tool returns data, provide a natural, helpful response based on that data. Always present tool results as clear, well-formatted answers to the user's question.`,
								},
								{
									role: "user",
									content: userMessage,
								},
								{
									role: "assistant",
									content: `I'll check that for you using the ${selectedTool.name} tool.`,
									tool_calls: [
										{
											id: "tool_call_1",
											type: "function",
											function: {
												name: selectedTool.name,
												arguments:
													JSON.stringify(toolArgs),
											},
										},
									],
								},
								{
									role: "tool",
									tool_call_id: "tool_call_1",
									content: toolResult.result,
								},
							];

							const followUpBody = {
								model: model.model,
								messages: followUpMessages,
								temperature: model.temperature || 0.7,
								max_tokens: model.maxTokens || 4096,
							};

							try {
								const followUpResponse = await fetch(url, {
									method: "POST",
									headers: headers,
									body: JSON.stringify(followUpBody),
									timeout: 30000,
								});

								if (followUpResponse.ok) {
									const followUpData =
										await followUpResponse.json();
									if (
										followUpData.choices &&
										followUpData.choices.length > 0
									) {
										return {
											content:
												followUpData.choices[0].message
													.content,
											usage: {
												prompt_tokens:
													(data.usage
														?.prompt_tokens || 0) +
													(followUpData.usage
														?.prompt_tokens || 0),
												completion_tokens:
													(data.usage
														?.completion_tokens ||
														0) +
													(followUpData.usage
														?.completion_tokens ||
														0),
												total_tokens:
													(data.usage?.total_tokens ||
														0) +
													(followUpData.usage
														?.total_tokens || 0),
											},
											toolUsed: selectedTool.name,
											server: selectedTool.server,
										};
									} else {
										console.error(
											"Follow-up LLM response missing choices:",
											followUpData,
										);
									}
								} else {
									const errorText = await followUpResponse.text();
									console.error(
										"Follow-up LLM request failed:",
										followUpResponse.status,
										followUpResponse.statusText,
										errorText,
									);
								}
							} catch (error) {
								console.error(
									"Follow-up LLM call failed:",
									error.message,
								);
							}

							// Fallback to formatted raw output if follow-up fails
							return {
								content: `I executed the ${selectedTool.name} tool. Here are the results:\n\n\`\`\`\n${toolResult.result}\n\`\`\``,
								usage: data.usage,
								toolUsed: selectedTool.name,
								server: selectedTool.server,
							};
						} else {
							return {
								content: `I tried to execute ${selectedTool.name} but encountered an error: ${toolResult.error}`,
								usage: data.usage,
								toolUsed: selectedTool.name,
								server: selectedTool.server,
								error: true,
							};
						}
					} catch (error) {
						console.error(
							"LLM-selected tool execution failed:",
							error,
						);
						return {
							content: `I tried to execute ${selectedTool.name} but encountered an error: ${error.message}`,
							usage: data.usage,
							error: true,
						};
					}
				}
			}

			// If no tool was called, return the regular LLM response
			const content = message.content || "";
			return {
				content: message.content,
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
