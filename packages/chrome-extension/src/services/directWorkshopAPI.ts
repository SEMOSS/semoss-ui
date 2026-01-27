/**
 * Direct Workshop API Service
 * Makes HTTP calls directly to Workshop server
 */

export interface WorkshopConfig {
	endpoint: string;
	module: string;
	modelId?: string; // LLM Model/Engine ID (e.g., "GPT4", "Claude", etc.)
	accessKey: string;
	secretKey: string;
}

export interface LLMAction {
	type:
		| "click"
		| "setValue"
		| "scroll"
		| "wait"
		| "done"
		| "error"
		| "askUser"
		| "navigate";
	elementId?: number;
	value?: string;
	reason?: string;
	message?: string;
	question?: string; // For askUser action
	fieldName?: string; // For askUser action - what field needs input
	url?: string; // For navigate action
}

export interface ScriptFile {
	path: string;
	name: string;
	lastModified: string;
	type: string;
}

export class DirectWorkshopService {
	private config: WorkshopConfig;

	constructor(config: WorkshopConfig) {
		this.config = config;
	}

	/**
	 * Call LLM via direct HTTP request to Workshop
	 */
	async callLLM(prompt: string): Promise<string> {
		try {
			const url = `${this.config.endpoint}${this.config.module}/api/engine/runPixel`;

			console.log("Calling Workshop API:", url);

			// Build the LLM pixel command
			const modelId = this.config.modelId || "";

			// Escape prompt properly for JSON string inside pixel command
			// Remove percent signs to prevent URL decoder errors in Workshop backend
			const escapedPrompt = prompt
				.replace(/%/g, " percent ") // Replace % with word "percent" to avoid URL decoder errors
				.replace(/\\/g, "\\\\") // Escape backslashes first (double escape)
				.replace(/"/g, '\\"') // Escape double quotes
				.replace(/\n/g, "\\n") // Escape newlines
				.replace(/\r/g, "\\r") // Escape carriage returns
				.replace(/\t/g, "\\t"); // Escape tabs

			let pixelString: string;

			if (modelId) {
				// With model ID specified - using maxTokens (Workshop pixel syntax)
				pixelString = `LLM(engine=["${modelId}"], command=["${escapedPrompt}"], temperature=0.2, maxTokens=500);`;
			} else {
				// Default LLM - no engine specified
				pixelString = `LLM(command=["${escapedPrompt}"], temperature=0.2, maxTokens=500);`;
			}

			const payload = {
				expression: pixelString,
			};

			console.log("Request payload:", JSON.stringify(payload, null, 2));

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${btoa(`${this.config.accessKey}:${this.config.secretKey}`)}`,
				},
				body: JSON.stringify(payload),
			});

			console.log("Response status:", response.status);
			const responseText = await response.text();
			console.log("Response text:", responseText);

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}. Response: ${responseText}`,
				);
			}

			const data = JSON.parse(responseText);
			console.log("API Response:", data);

			// Check for error in response
			if (data.pixelReturn?.[0]) {
				const result = data.pixelReturn[0];

				// Check if it's an error response
				if (result.operationType?.includes("ERROR")) {
					const errorMsg =
						result.output || "Unknown error from Workshop API";

					// Provide helpful error messages
					if (errorMsg.includes("Model null does not exist")) {
						throw new Error(
							'Model ID is required. Please go to Options and enter a valid Workshop LLM Engine ID (UUID format, e.g., "12345678-1234-1234-1234-123456789abc"). Contact your Workshop admin for the correct Engine ID.',
						);
					}

					throw new Error(`Workshop API Error: ${errorMsg}`);
				}

				// Extract successful output - it's in the "response" field for CHAT type
				if (result.output?.response) {
					console.log(
						"Extracted LLM response:",
						result.output.response,
					);
					return result.output.response;
				}

				// Fallback to output directly
				if (result.output) {
					return result.output;
				}
			}

			throw new Error("No output in API response");
		} catch (error) {
			console.error("Workshop API call failed:", error);
			throw error;
		}
	}

	/**
	 * List all saved scripts in a project
	 */
	async listScripts(projectId: string): Promise<ScriptFile[]> {
		try {
			const url = `${this.config.endpoint}${this.config.module}/api/engine/runPixel`;

			const pixelString = `BrowseAsset(filePath=["version/assets/recordings/"], space=["${projectId}"]);`;

			const payload = {
				expression: pixelString,
			};

			console.log("Fetching script list:", pixelString);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${btoa(`${this.config.accessKey}:${this.config.secretKey}`)}`,
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}

			const data = await response.json();
			console.log("Script list response:", data);

			if (data.pixelReturn?.[0]?.output) {
				const output = data.pixelReturn[0].output;

				// Validate that output is an array
				if (!Array.isArray(output)) {
					console.warn(
						"Expected array for script list, got:",
						typeof output,
						output,
					);
					return [];
				}

				const scripts = output as ScriptFile[];
				// Sort by last modified date (newest first)
				return scripts.sort((a, b) => {
					const dateA = new Date(a.lastModified).getTime();
					const dateB = new Date(b.lastModified).getTime();
					return dateB - dateA;
				});
			}

			return [];
		} catch (error) {
			console.error("Failed to list scripts:", error);
			throw error;
		}
	}

	/**
	 * Fetch script content by file path
	 */
	async fetchScript(projectId: string, filePath: string): Promise<string> {
		try {
			const url = `${this.config.endpoint}${this.config.module}/api/engine/runPixel`;

			const pixelString = `GetAsset(filePath=["${filePath}"], space=["${projectId}"]);`;

			const payload = {
				expression: pixelString,
			};

			console.log("Fetching script content:", pixelString);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${btoa(`${this.config.accessKey}:${this.config.secretKey}`)}`,
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}

			const data = await response.json();
			console.log("Script content response:", data);

			if (data.pixelReturn?.[0]?.output) {
				return data.pixelReturn[0].output;
			}

			throw new Error("No script content in response");
		} catch (error) {
			console.error("Failed to fetch script:", error);
			throw error;
		}
	}

	/**
	 * Get next action from LLM
	 */
	async getNextAction(
		userCommand: string,
		simplifiedHTML: string,
		currentUrl: string,
		actionHistory: string[] = [],
		playgroundContext?: string,
	): Promise<LLMAction> {
		try {
			// Log what we're sending to help debug
			console.log("Simplified HTML length:", simplifiedHTML.length);
			console.log("Current URL:", currentUrl);
			console.log("Action history being sent to LLM:", actionHistory);
			console.log(
				"First 2000 chars of HTML:",
				simplifiedHTML.substring(0, 2000),
			);

			// Count INPUT elements in the HTML
			const inputCount = (simplifiedHTML.match(/<input/gi) || []).length;
			const textareaCount = (simplifiedHTML.match(/<textarea/gi) || [])
				.length;
			console.log(
				`Found ${inputCount} INPUT elements and ${textareaCount} TEXTAREA elements in simplified HTML`,
			);

			// Check for search-related inputs
			const hasSearchInput = simplifiedHTML
				.toLowerCase()
				.includes("search");
			console.log("Has search-related elements:", hasSearchInput);

			const prompt = this.constructPrompt(
				userCommand,
				simplifiedHTML,
				currentUrl,
				actionHistory,
				playgroundContext,
			);
			const response = await this.callLLM(prompt);
			return this.parseResponse(response);
		} catch (error) {
			return {
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to get LLM response",
			};
		}
	}

	/**
	 * Construct prompt for LLM (clean, generic approach - inspired by browser-extension)
	 */
	private constructPrompt(
		userCommand: string,
		simplifiedHTML: string,
		currentUrl: string,
		actionHistory: string[],
		playgroundContext?: string,
	): string {
		// Format previous actions with structured tags
		let previousActionsString = "";
		if (actionHistory.length > 0) {
			previousActionsString = `You have already taken the following actions:\n${actionHistory.join("\n\n")}\n\n`;
		}

		// Include playground context if available
		let playgroundContextString = "";
		if (playgroundContext) {
			playgroundContextString = `\n\nContext from Playground AI Response:\n${playgroundContext}\n\nYou can use the information from this context to help complete the task.\n`;
		}

		// Build clean, generic system message (like browser-extension)
		const formattedActions = `1. click(elementId: number): Clicks on an element
2. setValue(elementId: number, value: string): Types text into an input field. The browser will automatically submit if it's a search box.
3. navigate(url: string): Opens a URL in a NEW tab and switches focus to it (use when user says "navigate to", "go to", or "open" a URL)
4. askUser(fieldName: string, question: string): Pause and ask the user for information (use this for sensitive fields like passwords or when you need specific user information)
5. done(): Indicates the task is finished`;

		const systemMessage = `You are a browser automation assistant.

You can use the following tools:

${formattedActions}

You will be given a task to perform and the current state of the DOM. You will also be given previous actions that you have taken.

CRITICAL RULES:
- NEVER repeat the same action on the same element. Each action should only be performed ONCE.
- When you see "navigate to [URL]" or "go to [URL]", use navigate(url) to open that URL.
- After using setValue() on a search box, do NOT click a search button or try to "press Enter" - the search will submit automatically.
- If you've already clicked or set a value on an element, move to the next step immediately.
- Do NOT retry actions. If unsure what to do next, call done().
- Videos on sites like YouTube auto-play when clicked, so do NOT look for a separate Play button.

IMPORTANT: When you encounter sensitive fields (like password, username, API keys) or fields that require specific user information that you cannot guess, use the askUser() action to request this information from the user instead of making up values.

When you see a previous askUser() action in the history, the user has already provided the value. You can use that value in subsequent setValue() actions. The value will be shown in the action history after the askUser action.

This is an example of an action:

<Thought>I should click the add to cart button</Thought>
<Action>click(223)</Action>

Example of asking user for input:

<Thought>I need the user's password to fill in this field</Thought>
<Action>askUser("password", "Please enter the password for this database")</Action>

You must always include the <Thought> and <Action> open/close tags or else your response will be marked as invalid.`;

		// Return the complete prompt
		return `${systemMessage}

The user requests the following task:

${userCommand}${playgroundContextString}

${previousActionsString}Current time: ${new Date().toLocaleString()}

Current URL: ${currentUrl}

Current page contents:
${simplifiedHTML}`;
	}

	/**
	 * Parse LLM response into structured action (supports <Thought><Action> format)
	 */
	private parseResponse(
		response: string | Record<string, unknown>,
	): LLMAction {
		try {
			// If response is already an object, use it directly
			if (typeof response === "object" && response !== null) {
				if ("type" in response && response.type) {
					return response as unknown as LLMAction;
				}
				// If it's wrapped in some structure, try to extract it
				if ("response" in response && response.response) {
					response = response.response as
						| string
						| Record<string, unknown>;
				}
			}

			// If it's a string, parse it
			if (typeof response !== "string") {
				response = JSON.stringify(response);
			}

			let cleanResponse = response.trim();

			// Try to parse structured format: <Thought>...</Thought><Action>...</Action>
			const thoughtMatch = cleanResponse.match(
				/<Thought>([\s\S]*?)<\/Thought>/i,
			);
			const actionMatch = cleanResponse.match(
				/<Action>([\s\S]*?)<\/Action>/i,
			);

			if (thoughtMatch && actionMatch) {
				const thought = thoughtMatch[1].trim();
				const actionStr = actionMatch[1].trim();

				console.log("Parsed Thought:", thought);
				console.log("Parsed Action:", actionStr);

				// Parse the action string (e.g., "click(123)" or "setValue(45, 'text')" or "done()")
				const action = this.parseActionString(actionStr, thought);
				return action;
			}

			// Fallback: Try JSON format
			// Remove markdown code blocks
			cleanResponse = cleanResponse.replace(/^```json\s*/i, "");
			cleanResponse = cleanResponse.replace(/^```\s*/i, "");
			cleanResponse = cleanResponse.replace(/\s*```$/i, "");
			cleanResponse = cleanResponse.trim();

			// Find JSON object
			const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error(
					"No valid action format found (expected <Thought><Action> or JSON)",
				);
			}

			const action = JSON.parse(jsonMatch[0]) as LLMAction;

			if (!action.type) {
				throw new Error("Action missing type field");
			}

			return action;
		} catch (error) {
			console.error("Failed to parse LLM response:", error);
			console.error("Raw response:", response);

			return {
				type: "error",
				message: `Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Parse action string like "click(123)" or "done()"
	 */
	private parseActionString(actionStr: string, thought: string): LLMAction {
		// Match function name and arguments
		const match = actionStr.match(/^(\w+)\((.*?)\)$/);

		if (!match) {
			throw new Error(`Invalid action format: ${actionStr}`);
		}

		const [, actionName, argsStr] = match;

		switch (actionName.toLowerCase()) {
			case "click": {
				const elementId = parseInt(argsStr.trim(), 10);
				if (Number.isNaN(elementId)) {
					throw new Error(`Invalid elementId in click: ${argsStr}`);
				}
				return {
					type: "click",
					elementId,
					reason: thought,
				};
			}

			case "setvalue": {
				// Parse setValue(elementId, "value") or setValue(elementId, 'value')
				const argsMatch = argsStr.match(
					/^\s*(\d+)\s*,\s*["'](.*)["']\s*$/,
				);
				if (!argsMatch) {
					throw new Error(`Invalid setValue format: ${argsStr}`);
				}
				const elementId = parseInt(argsMatch[1], 10);
				const value = argsMatch[2];
				return {
					type: "setValue",
					elementId,
					value,
					reason: thought,
				};
			}

			case "done": {
				return {
					type: "done",
					reason: thought,
				};
			}

			case "askuser": {
				// Parse askUser("fieldName", "question")
				const argsMatch = argsStr.match(
					/^\s*["']([^"']*)["']\s*,\s*["'](.*)["']\s*$/,
				);
				if (!argsMatch) {
					throw new Error(`Invalid askUser format: ${argsStr}`);
				}
				const fieldName = argsMatch[1];
				const question = argsMatch[2];
				return {
					type: "askUser",
					fieldName,
					question,
					reason: thought,
				};
			}

			case "navigate": {
				// Parse navigate("url") or navigate('url')
				const urlMatch = argsStr.match(/^\s*["'](.*)["']\s*$/);
				if (!urlMatch) {
					throw new Error(`Invalid navigate format: ${argsStr}`);
				}
				const url = urlMatch[1];
				return {
					type: "navigate",
					url,
					reason: thought,
				};
			}

			case "fail": {
				// Extract reason from fail("reason")
				const reasonMatch = argsStr.match(/["'](.*)["']/);
				const reason = reasonMatch ? reasonMatch[1] : argsStr;
				return {
					type: "error",
					message: reason,
					reason: thought,
				};
			}

			default:
				throw new Error(`Unknown action type: ${actionName}`);
		}
	}
}

/**
 * Create Direct Workshop service from settings
 */
export async function createDirectWorkshopService(): Promise<DirectWorkshopService | null> {
	try {
		const settings = await chrome.storage.local.get([
			"workshop_endpoint",
			"workshop_module",
			"workshop_model_id",
			"workshop_access_key",
			"workshop_secret_key",
		]);

		if (
			!settings.workshop_endpoint ||
			!settings.workshop_access_key ||
			!settings.workshop_secret_key
		) {
			console.error("Missing Workshop settings");
			return null;
		}

		const config: WorkshopConfig = {
			endpoint: settings.workshop_endpoint,
			module: settings.workshop_module || "/Monolith",
			modelId: settings.workshop_model_id,
			accessKey: settings.workshop_access_key,
			secretKey: settings.workshop_secret_key,
		};

		return new DirectWorkshopService(config);
	} catch (error) {
		console.error("Failed to create Workshop service:", error);
		return null;
	}
}
