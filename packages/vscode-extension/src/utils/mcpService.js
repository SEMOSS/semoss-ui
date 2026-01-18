const { spawn } = require("child_process");
const configManager = require("./configManager");

/**
 * MCPService class to manage Model Context Protocol servers
 * Handles starting, stopping, and communicating with MCP servers
 */
class MCPService {
	constructor() {
		this.servers = new Map(); // serverName -> { process, client, tools, resources }
		this.initialized = false;
	}

	/**
	 * Initialize MCP service by starting configured servers
	 */
	async initialize() {
		// Force reinitialization if we're initialized but have no servers
		if (this.initialized && this.servers.size > 0) {
			return;
		}

		if (this.initialized && this.servers.size === 0) {
			this.initialized = false;
		}

		try {
			await configManager.loadConfig();
			const config = configManager.config;

			const mcpServers = config.mcpServers || [];

			// Start enabled servers
			for (const serverConfig of mcpServers) {
				if (serverConfig.enabled) {
					await this.startServer(serverConfig);
				}
			}

			this.initialized = true;
		} catch (error) {
			console.error("Failed to initialize MCP Service:", error);
		}
	}

	/**
	 * Start a single MCP server
	 */
	async startServer(serverConfig) {
		try {
			const {
				name,
				command,
				args = [],
				env = {},
				workingDirectory,
				timeout = 5000,
			} = serverConfig;

			// Skip if already running
			if (this.servers.has(name)) {
				return;
			}

			// Spawn the server process
			const serverProcess = spawn(command, args, {
				cwd: workingDirectory || process.cwd(),
				env: { ...process.env, ...env },
				stdio: ["pipe", "pipe", "pipe"],
			});

			// Handle server lifecycle
			serverProcess.on("error", (error) => {
				console.error(`MCP server ${name} error:`, error);
				this.servers.delete(name);
			});

			serverProcess.on("exit", (code, signal) => {
				this.servers.delete(name);
			});

			// Store server info
			const serverInfo = {
				process: serverProcess,
				config: serverConfig,
				tools: [],
				resources: [],
				started: Date.now(),
			};

			this.servers.set(name, serverInfo);

			// Initialize server connection (simplified)
			await this.initializeServerConnection(name, serverInfo);
		} catch (error) {
			console.error(
				`Failed to start MCP server ${serverConfig.name}:`,
				error,
			);
		}
	}

	/**
	 * Initialize connection with an MCP server
	 */
	async initializeServerConnection(name, serverInfo) {
		try {
			// Get tools from configuration
			const tools = this.getSimulatedTools(name, serverInfo.config);
			const resources = this.getSimulatedResources(
				name,
				serverInfo.config,
			);

			serverInfo.tools = tools;
			serverInfo.resources = resources;
		} catch (error) {
			console.error(
				`Failed to initialize MCP server connection ${name}:`,
				error,
			);
			// Fallback to empty tools list if discovery fails
			serverInfo.tools = [];
			serverInfo.resources = [];
		}
	}

	/**
	 * Get tools for a server from configuration (replace with actual MCP protocol communication)
	 */
	getSimulatedTools(serverName, config) {
		// Check if tools are defined in the configuration
		if (config && config.tools && Array.isArray(config.tools)) {
			const tools = config.tools.map((tool) => ({
				name: tool.name || tool.command,
				description:
					tool.description || `Execute ${tool.name || tool.command}`,
				server: serverName,
				command: tool.command,
				timeout: tool.timeout,
				parameters: tool.parameters, // Include parameter schema for function calling
			}));
			return tools;
		}

		// No fallback tools - only use what's explicitly configured
		console.warn(`No tools configured for MCP server: ${serverName}`);
		return [];
	}

	/**
	 * Get simulated resources for a server
	 */
	getSimulatedResources(serverName, config) {
		// Return simulated resources based on server type
		return [];
	}

	/**
	 * Execute a tool on an MCP server - Generic solution for all tools
	 */
	async executeTool(serverName, toolName, parameters) {
		// Get the tool configuration to determine execution method
		const config = configManager.config;
		const serverConfig = config?.mcpServers?.find(
			(s) => s.name === serverName,
		);
		const toolConfig = serverConfig?.tools?.find(
			(t) => t.name === toolName,
		);

		if (!toolConfig) {
			return {
				success: false,
				error: `Tool ${toolName} not found in server ${serverName} configuration`,
			};
		}

		// Always execute as local tool since all tools have commands
		return this.executeLocalTool(
			serverName,
			toolName,
			parameters,
			toolConfig,
		);
	}

	/**
	 * Execute a tool that has a command (local execution)
	 */
	async executeLocalTool(serverName, toolName, parameters, toolConfig) {
		const { exec } = require("child_process");
		const { promisify } = require("util");
		const vscode = require("vscode");
		const execAsync = promisify(exec);

		try {
			// Check if this is a semoss_npx command and use HTTP alternative instead
			if (toolConfig.command === "semoss_npx") {
				return await this.executeSemossNpx(
					serverName,
					toolName,
					parameters,
					toolConfig,
				);
			}

			// Get the current workspace directory
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			const workingDirectory = workspaceFolder
				? workspaceFolder.uri.fsPath
				: process.cwd();

			// Prepare the command to execute
			let command = toolConfig.command || toolConfig.name;

			// Replace placeholders in the command with parameters if any
			if (parameters && typeof parameters === "object") {
				for (const [key, value] of Object.entries(parameters)) {
					command = command.replace(
						new RegExp(`{{${key}}}`, "g"),
						value,
					);
					command = command.replace(
						new RegExp(`\\$${key}`, "g"),
						value,
					);
				}
			}

			// Execute the command
			const execOptions = {
				cwd: workingDirectory,
				timeout: toolConfig.timeout || 10000, // Default 10 second timeout
				...(toolConfig.env && {
					env: { ...process.env, ...toolConfig.env },
				}),
			};

			const { stdout, stderr } = await execAsync(command, execOptions);

			const output = stdout || stderr;

			return {
				success: true,
				result: output,
				command: command,
				server: serverName,
				tool: toolName,
			};
		} catch (error) {
			// Check if error contains JSON response (curl might fail but still return data)
			const errorOutput =
				error.stdout || error.stderr || error.message || "";

			try {
				// Try to parse JSON from error output
				const jsonResponse = JSON.parse(errorOutput);
				if (
					jsonResponse &&
					jsonResponse.result &&
					jsonResponse.result.content
				) {
					// Extract the actual content from MCP JSON response
					const content =
						jsonResponse.result.content[0]?.text ||
						jsonResponse.result.content;
					return {
						success: true,
						result: content,
						command: toolConfig.command || toolConfig.name,
						server: serverName,
						tool: toolName,
					};
				}
			} catch (parseError) {
				// If not JSON, check if error output contains useful data
				if (
					errorOutput &&
					errorOutput.trim() &&
					!errorOutput.includes("Command failed")
				) {
					return {
						success: true,
						result: errorOutput,
						command: toolConfig.command || toolConfig.name,
						server: serverName,
						tool: toolName,
					};
				}
			}

			return {
				success: false,
				error: `Command execution failed: ${error.message}`,
				server: serverName,
				tool: toolName,
				command: toolConfig.command || toolConfig.name,
			};
		}
	}

	/**
	 * Read Server-Sent Events stream from response (Node.js compatible)
	 */
	async readServerSentEvents(response) {
		return new Promise((resolve, reject) => {
			let buffer = "";
			let eventData = "";
			let streamFinished = false;

			const cleanup = (result) => {
				if (streamFinished) return;
				streamFinished = true;
				clearTimeout(timeout);
				return result;
			};

			const timeout = setTimeout(() => {
				response.body?.destroy?.();
				reject(new Error("SSE stream timeout after 10 seconds"));
			}, 10000);

			// Handle data chunks
			response.body.on("data", (chunk) => {
				if (streamFinished) return;

				buffer += chunk.toString();
				const lines = buffer.split("\n");
				buffer = lines.pop() || ""; // Keep incomplete line in buffer

				for (const line of lines) {
					const trimmedLine = line.trim();

					if (trimmedLine.startsWith("data: ")) {
						const data = trimmedLine.substring(6);

						// Check for stream completion marker
						if (data === "[DONE]") {
							return resolve(
								cleanup(eventData || "Stream completed"),
							);
						}

						// Try to parse as JSON and extract MCP result
						try {
							const jsonData = JSON.parse(data);

							if (jsonData.result?.content) {
								const content = Array.isArray(
									jsonData.result.content,
								)
									? jsonData.result.content
											.map(
												(c) =>
													c.text ||
													c.data ||
													JSON.stringify(c),
											)
											.join("\n")
									: jsonData.result.content.text ||
										jsonData.result.content.data ||
										JSON.stringify(jsonData.result.content);

								return resolve(cleanup(content));
							} else if (jsonData.result) {
								eventData = JSON.stringify(jsonData.result);
							}
						} catch (parseError) {
							// Non-JSON data, accumulate as text
							eventData += data + "\n";
						}
					} else if (trimmedLine === "" && eventData) {
						// Empty line indicates end of event
						return resolve(cleanup(eventData));
					}
				}
			});

			response.body.on("end", () => {
				if (!streamFinished) {
					resolve(
						cleanup(eventData || "Stream completed with no data"),
					);
				}
			});

			response.body.on("error", (error) => {
				if (!streamFinished) {
					cleanup();
					reject(error);
				}
			});
		});
	}

	/**
	 * Execute semoss_npx command using Node.js HTTP alternative with direct config parameters
	 */
	async executeSemossNpx(serverName, toolName, parameters, toolConfig) {
		const { default: fetch } = await import("node-fetch");

		try {
			// Get parameters directly from config
			const url =
				toolConfig.url || "http://localhost:9090/Monolith/api/ext/mcp";
			const method = toolConfig.method || "POST";
			const headers = toolConfig.headers || {
				"Content-Type": "application/json",
			};

			// Prepare MCP request body
			const requestBody = {
				jsonrpc: "2.0",
				id: Date.now(),
				method: "tools/call",
				params: {
					name: toolName,
					arguments: parameters || {},
				},
			};

			// Ensure Content-Type header
			if (!headers["Content-Type"]) {
				headers["Content-Type"] = "application/json";
			}

			// Add timeout to prevent hanging
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				toolConfig.timeout || 15000,
			);

			try {
				const response = await fetch(url, {
					method: method,
					headers: headers,
					body: JSON.stringify(requestBody),
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				let responseText = "";

				try {
					const contentType = response.headers.get("content-type");

					if (
						contentType &&
						contentType.includes("text/event-stream")
					) {
						responseText =
							await this.readServerSentEvents(response);
					} else {
						responseText = await Promise.race([
							response.text(),
							new Promise((_, reject) =>
								setTimeout(
									() =>
										reject(
											new Error(
												"Response timeout after 5 seconds",
											),
										),
									5000,
								),
							),
						]);
					}
				} catch (readError) {
					console.error(
						"Failed to read response:",
						readError.message,
					);
					return {
						success: false,
						error: "Failed to read response from MCP server",
						command: "semoss_npx HTTP request",
						server: serverName,
						tool: toolName,
					};
				}

				if (!response.ok) {
					throw new Error(
						`HTTP ${response.status}: ${response.statusText} - ${responseText}`,
					);
				}

				// Check for HTML redirect
				if (
					responseText.includes("<!DOCTYPE html>") ||
					responseText.includes("Redirecting")
				) {
					return {
						success: false,
						error: "MCP endpoint returned HTML redirect instead of JSON response. Check MCP service configuration.",
						command: "semoss_npx HTTP request",
						server: serverName,
						tool: toolName,
					};
				}

				// Return processed response (SSE already handles extraction)
				if (responseText && responseText.trim()) {
					return {
						success: true,
						result: responseText.trim(),
						command: "semoss_npx HTTP request",
						server: serverName,
						tool: toolName,
					};
				}

				return {
					success: false,
					error: "No response content received from MCP server",
					command: "semoss_npx HTTP request",
					server: serverName,
					tool: toolName,
				};
			} catch (fetchError) {
				clearTimeout(timeoutId);

				if (fetchError.name === "AbortError") {
					throw new Error(
						`HTTP request timed out after ${toolConfig.timeout || 15000}ms`,
					);
				}
				throw fetchError;
			}
		} catch (error) {
			console.error("semoss_npx HTTP request failed:", error.message);
			return {
				success: false,
				error: `semoss_npx HTTP request failed: ${error.message}`,
				command: "semoss_npx HTTP request",
				server: serverName,
				tool: toolName,
			};
		}
	}

	/**
	 * Get all available tools from all running servers
	 */
	getAllTools() {
		const allTools = [];
		for (const [serverName, serverInfo] of this.servers) {
			if (serverInfo.tools && Array.isArray(serverInfo.tools)) {
				for (const tool of serverInfo.tools) {
					allTools.push({
						...tool,
						server: serverName,
					});
				}
			}
		}
		return allTools;
	}

	/**
	 * Stop all servers
	 */
	async shutdown() {
		for (const [name, server] of this.servers) {
			try {
				server.process.kill();
			} catch (error) {
				console.error(`Error stopping MCP server ${name}:`, error);
			}
		}
		this.servers.clear();
		this.initialized = false;
	}

	/**
	 * Restart servers after configuration change
	 */
	async restart() {
		await this.shutdown();
		this.initialized = false;
		await this.initialize();
	}
}

module.exports = new MCPService();
