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
		this.configManager = configManager; // Store reference for use in async contexts
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
		
		// Check if using uvx and fallback to python if not available
		let finalCommand = command;
		let finalArgs = [...args];
		
		if (command === 'uvx' || command.includes('uvx')) {
			const { execSync } = require('child_process');
			const isWindows = process.platform === "win32";
			try {
				// Try to find uvx
				execSync(isWindows ? 'where uvx' : 'which uvx', { stdio: 'ignore' });
				console.log('uvx found, using it');
			} catch (e) {
				console.warn('uvx not found, falling back to python');
				// Fallback to python -m <package>
				finalCommand = 'python';
				// Convert mcp-server-git to mcp_server_git for Python module
				const pythonPackage = finalArgs[0]?.replace('mcp-server-', 'mcp_server_');
				finalArgs = ['-m', pythonPackage, ...finalArgs.slice(1)];
				console.log('Using fallback command:', finalCommand, finalArgs);
			}
		}

		// On Windows, if command has spaces, use shell mode
		const isWindows = process.platform === "win32";
		const hasSpaces = finalCommand && finalCommand.includes(" ");
		
		let spawnOptions = {
			cwd: workingDirectory || process.cwd(),
			env: { ...process.env, ...env },
			stdio: ["pipe", "pipe", "pipe"],
		};
		
		// If Windows and path has spaces, use shell mode
		if (isWindows && hasSpaces) {
			spawnOptions.shell = true;
		}

		// Spawn the server process
		const serverProcess = spawn(finalCommand, finalArgs, spawnOptions);
		
		// Store server info first (before any error handlers run)
		const serverInfo = {
			process: serverProcess,
			config: serverConfig,
			tools: [],
			resources: [],
			started: Date.now(),
			initialized: false,
		};

		this.servers.set(name, serverInfo);

		// Handle server lifecycle
		serverProcess.on("error", (error) => {
			console.error(`MCP server ${name} error:`, error);
			// Don't delete if we have configured tools (HTTP-based tools can still work)
			if (!serverConfig.tools || serverConfig.tools.length === 0) {
				this.servers.delete(name);
			}
		});

		serverProcess.on("exit", (code, signal) => {
			this.servers.delete(name);
		});

			// Send MCP initialize handshake
			const initRequest = {
				jsonrpc: "2.0",
				id: Date.now(),
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: {
						name: "vscode-semoss-extension",
						version: "1.0.0",
					},
				},
			};
			
			console.log(`Initializing MCP server ${name}`);
			serverProcess.stdin.write(JSON.stringify(initRequest) + "\n");
			
			// Wait a moment for initialization to complete
			await new Promise(resolve => setTimeout(resolve, 1000));
			serverInfo.initialized = true;

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
			
			// If no tools configured, try to discover them automatically
			if (tools.length === 0) {
				console.log(`No tools in config for ${name}, attempting automatic discovery...`);
				try {
					const discoveredTools = await this.discoverServerTools(serverInfo.config);
					if (discoveredTools && discoveredTools.length > 0) {
						console.log(`Discovered ${discoveredTools.length} tools for ${name}:`, discoveredTools.map(t => t.name));
						serverInfo.tools = discoveredTools.map(tool => ({
							...tool,
							server: name,
						}));
				
			// Update configuration with discovered tools
			await this.configManager.loadConfig();
			const config = this.configManager.config;
			const serverIndex = config.mcpServers?.findIndex(s => s.name === name);
				if (serverIndex !== -1) {
					config.mcpServers[serverIndex].tools = discoveredTools;
					await this.configManager.saveConfig(config);
							console.log(`Updated config with discovered tools for ${name}`);
						}
						return;
					}
				} catch (discoveryError) {
					console.error(`Tool discovery failed for ${name}:`, discoveryError.message);
				}
			}
			
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

			// If no command field, this is an MCP protocol tool - use the running server's stdin/stdout
			if (!toolConfig.command) {
				const serverInfo = this.servers.get(serverName);
				if (!serverInfo || !serverInfo.process) {
					return {
						success: false,
						error: `MCP server ${serverName} is not running`,
					};
				}

				// Automatically inject repository path from server config if present
				const serverConfig = serverInfo.config;
				if (parameters && 'repo_path' in parameters && serverConfig.args) {
					// Extract repository path from server args (e.g., ['--repository', 'path/to/repo'])
					const repoArgIndex = serverConfig.args.indexOf('--repository');
					if (repoArgIndex !== -1 && repoArgIndex + 1 < serverConfig.args.length) {
						const configuredRepoPath = serverConfig.args[repoArgIndex + 1];
						// If user passed '.' or a relative path, use the configured absolute path
						if (parameters.repo_path === '.' || !parameters.repo_path.includes(':')) {
							parameters.repo_path = configuredRepoPath;
							console.log(`Auto-injected repo_path from --repository arg: ${configuredRepoPath}`);
						}
					}
				}

				// Send JSON-RPC tools/call request to the running server
				const requestId = Date.now();
				const request = {
					jsonrpc: "2.0",
					id: requestId,
					method: "tools/call",
					params: {
						name: toolName,
						arguments: parameters || {},
					},
				};

				console.log(`Calling MCP tool ${toolName} on server ${serverName}`, JSON.stringify(request));
				serverInfo.process.stdin.write(JSON.stringify(request) + "\n");

				// Wait for response
				return new Promise((resolve, reject) => {
					let responseData = "";
					const timeout = setTimeout(() => {
						console.error(`MCP tool ${toolName} timeout. Accumulated response:`, responseData);
						cleanup();
						reject(new Error(`Tool execution timeout for ${toolName}`));
					}, toolConfig.timeout || 30000);

					const onData = (data) => {
						responseData += data.toString();
						console.log(`MCP ${toolName} stdout chunk:`, data.toString());
						const lines = responseData.split('\n');
						
						for (const line of lines) {
							if (!line.trim()) continue;
							try {
								const response = JSON.parse(line);
								console.log(`MCP ${toolName} parsed response:`, JSON.stringify(response));
								if (response.id === requestId) {
									cleanup();
									if (response.error) {
										console.error(`MCP ${toolName} error response:`, response.error);
										resolve({
											success: false,
											error: response.error.message || JSON.stringify(response.error),
											server: serverName,
											tool: toolName,
										});
									} else if (response.result) {
										console.log(`MCP ${toolName} result:`, JSON.stringify(response.result));
										// MCP protocol: result.content is an array of content items
										let textContent = '';
										if (response.result.content && Array.isArray(response.result.content)) {
											textContent = response.result.content
												.map(item => {
													if (item.type === 'text' && item.text) {
														return item.text;
													}
													return item.text || JSON.stringify(item);
												})
												.join('\n');
										} else if (typeof response.result === 'string') {
											textContent = response.result;
										} else {
											textContent = JSON.stringify(response.result, null, 2);
										}
										
										console.log(`MCP ${toolName} extracted text:`, textContent);
										resolve({
											success: true,
											result: textContent,
											server: serverName,
											tool: toolName,
										});
									}
									return;
								}
							} catch (e) {
								// Not valid JSON yet, keep accumulating
							}
						}
					};

					const onError = (error) => {
						console.error(`MCP ${toolName} stderr:`, error.toString());
						cleanup();
						reject(error);
					};

					const cleanup = () => {
						clearTimeout(timeout);
						serverInfo.process.stdout.removeListener('data', onData);
						serverInfo.process.stderr.removeListener('data', onError);
					};

					serverInfo.process.stdout.on('data', onData);
					serverInfo.process.stderr.on('data', onError);
				});
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

	/**
	 * Discover available tools from an MCP server using JSON-RPC protocol
	 * This actually queries the server to get its full list of tools
	 */
	async discoverServerTools(serverConfig) {
		console.log('Starting tool discovery for server:', serverConfig.name);
		return new Promise((resolve, reject) => {
			const { command, args = [], env = {}, workingDirectory } = serverConfig;
			
			console.log('Discovery spawn config:', { command, args, workingDirectory });
			
			// Determine if this is a Python or Node.js MCP server
			const isPythonServer = command.includes('uvx') || command.includes('python') || 
							   args.some(arg => arg.includes('mcp-server-') || arg.includes('mcp_server_'));
			const isNodeServer = command.includes('npx') || command.includes('node') ||
							 args.some(arg => arg.includes('@modelcontextprotocol/'));
			
			console.log('Server type:', { isPythonServer, isNodeServer });
			
			// Spawn the server temporarily
			const spawnOptions = {
				cwd: workingDirectory || process.cwd(),
				env: { ...process.env, ...env },
				stdio: ["pipe", "pipe", "pipe"],
			};

			// On Windows, if command path has spaces, use shell and quote the command
			const isWindows = process.platform === "win32";
			const hasSpaces = command && command.includes(" ");
			let spawnCommand = command;
			
			if (isWindows && hasSpaces) {
				spawnOptions.shell = true;
				// Quote the command for Windows shell
				spawnCommand = `"${command}"`;
				console.log('Using shell for spawn (Windows path with spaces), quoted command:', spawnCommand);
			}
			
			// For Python servers, check if uvx/python is available
			if (isPythonServer && !isNodeServer) {
				// Try to find uvx or python on the system
				const { execSync } = require('child_process');
				try {
					if (command.includes('uvx')) {
						// Check if uvx is available
						try {
							execSync(isWindows ? 'where uvx' : 'which uvx');
							console.log('uvx found on system');
						} catch (e) {
							console.warn('uvx not found, trying python fallback');
							// Fallback to python if uvx not available
							spawnCommand = 'python';
							args.unshift('-m', 'mcp_server_' + serverConfig.name);
						}
					}
				} catch (error) {
					console.error('Error checking Python runtime:', error);
				}
			}

			const serverProcess = spawn(spawnCommand, args, spawnOptions);

			let stdout = "";
			let stderr = "";
			const timeout = setTimeout(() => {
				console.error('Tool discovery timeout for', serverConfig.name);
				serverProcess.kill();
				reject(new Error("Tool discovery timed out after 10 seconds"));
			}, 10000);

			serverProcess.stdout.on("data", (data) => {
				stdout += data.toString();
				console.log('Discovery stdout chunk:', data.toString());
			});

			serverProcess.stderr.on("data", (data) => {
				stderr += data.toString();
				console.error('Discovery stderr chunk:', data.toString());
			});

			serverProcess.on("error", (error) => {
				console.error('Discovery spawn error:', error);
				clearTimeout(timeout);
				reject(error);
			});

			serverProcess.on("exit", (code) => {
				console.log('Discovery process exited with code:', code);
				clearTimeout(timeout);
				if (code !== 0 && code !== null) {
					reject(new Error(`Server exited with code ${code}: ${stderr}`));
				}
			});

			// Send initialize request
			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: {
						name: "vscode-semoss-extension",
						version: "1.0.0",
					},
				},
			};

			serverProcess.stdin.write(JSON.stringify(initRequest) + "\n");

			// Send tools/list request after a short delay
			setTimeout(() => {
				const toolsRequest = {
					jsonrpc: "2.0",
					id: 2,
					method: "tools/list",
					params: {},
				};
				console.log('Sending tools/list request:', JSON.stringify(toolsRequest));
				serverProcess.stdin.write(JSON.stringify(toolsRequest) + "\n");

				// Wait for responses to accumulate in stdout buffer
				setTimeout(() => {
					console.log('Parsing discovery results. Total stdout length:', stdout.length);
					
					// Kill process after we've waited for data
					serverProcess.kill();
					
					try {
						// Parse JSON-RPC responses from stdout
						const lines = stdout.split("\n").filter(l => l.trim());
						console.log('Number of stdout lines:', lines.length);
						let tools = [];
					
					for (const line of lines) {
						try {
							const response = JSON.parse(line);
							console.log('Parsed JSON response:', response);
							if (response.id === 2 && response.result && response.result.tools) {
								console.log('Found tools in response:', response.result.tools);
							
							// Check if server has --repository argument
							const repoArgIndex = serverConfig.args?.indexOf('--repository');
							const hasRepositoryArg = repoArgIndex !== -1 && repoArgIndex + 1 < serverConfig.args.length;
							const configuredRepoPath = hasRepositoryArg ? serverConfig.args[repoArgIndex + 1] : null;
							
							tools = response.result.tools.map(tool => {
								const params = tool.inputSchema || { type: "object", properties: {}, required: [] };
								
								// If tool has repo_path parameter and server has --repository arg, add helpful description
								if (hasRepositoryArg && params.properties && params.properties.repo_path) {
									params.properties.repo_path.description = `Repository path. Use "." to refer to the configured repository at ${configuredRepoPath}`;
								}
								
								return {
									name: tool.name,
									description: tool.description || `Execute ${tool.name}`,
									// Note: No 'command' field - these are MCP protocol tools, not shell commands
									timeout: 10000,
									parameters: params,
								};
							});
							break;
				}
			} catch (e) {
				// Skip invalid JSON lines
				console.log('Skipping non-JSON line:', line);
			}
		}
		
		console.log('Discovery completed. Found', tools.length, 'tools:', tools.map(t => t.name));
		resolve(tools);
	} catch (error) {
		console.error('Failed to parse tool list:', error);
		reject(new Error(`Failed to parse tool list: ${error.message}`));
	}
				}, 3000); // Wait 3s for all stdout to accumulate
			}, 500); // Wait 500ms before sending tools/list
		});
	}
}module.exports = new MCPService();
