export interface ScriptStep {
	id: number;
	type: "NAVIGATE" | "TYPE" | "CLICK" | "SCROLL" | "WAIT";
	url?: string;
	coords?: {
		x: number;
		y: number;
	};
	multiCoords?: Array<{ x: number; y: number }>;
	prompt?: string;
	text?: string;
	pressEnter?: boolean;
	deltaY?: number;
	waitUntil?: string;
	waitAfterMs?: number;
	viewport?: {
		width: number;
		height: number;
		deviceScaleFactor: number;
	};
	timestamp?: number;
	label?: string;
	description?: string;
	isPassword?: boolean;
	storeValue?: boolean;
	selector?: {
		strategy: "id" | "class" | "css" | "xpath" | "role";
		value: string;
	};
	isTriggerNewTab?: {
		isTrue: boolean;
		tabId: string;
	};
	shouldRun?: boolean;
	required?: boolean;
}

export interface ScriptMeta {
	id: string;
	title: string;
	description: string;
	createdAt: number;
	updatedAt: number;
}

export interface PlaywrightScript {
	version: string;
	meta: ScriptMeta;
	steps: {
		[tabId: string]: ScriptStep[][];
	};
}

// Google Recorder Types
export interface GoogleRecorderStep {
	type:
		| "setViewport"
		| "navigate"
		| "click"
		| "change"
		| "scroll"
		| "waitForElement";
	width?: number;
	height?: number;
	deviceScaleFactor?: number;
	isMobile?: boolean;
	hasTouch?: boolean;
	isLandscape?: boolean;
	url?: string;
	assertedEvents?: Array<{
		type: string;
		url?: string;
		title?: string;
	}>;
	target?: string;
	selectors?: string[][];
	offsetX?: number;
	offsetY?: number;
	value?: string;
	x?: number;
	y?: number;
}

export interface GoogleRecorderScript {
	title: string;
	steps: GoogleRecorderStep[];
}

export class ScriptExecutor {
	/**
	 * Parse Playwright recorder JSON
	 */
	static parseScript(json: string): PlaywrightScript {
		try {
			const script = JSON.parse(json) as PlaywrightScript;
			return script;
		} catch (error) {
			throw new Error(
				`Failed to parse script: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Convert script steps to executable actions for all tabs
	 */
	static async convertToActions(script: PlaywrightScript): Promise<
		Array<{
			type: string;
			url?: string;
			selector?: string;
			coords?: { x: number; y: number };
			text?: string;
			label?: string;
			isPassword?: boolean;
			waitAfterMs?: number;
			tabId?: string;
			isTriggerNewTab?: { isTrue: boolean; tabId: string };
		}>
	> {
		const actions: Array<{
			type: string;
			url?: string;
			selector?: string;
			coords?: { x: number; y: number };
			text?: string;
			label?: string;
			isPassword?: boolean;
			waitAfterMs?: number;
			tabId?: string;
			isTriggerNewTab?: { isTrue: boolean; tabId: string };
		}> = [];

		// Process all tabs in order (tab-1, tab-2, etc.)
		const tabKeys = Object.keys(script.steps).sort();

		for (const tabKey of tabKeys) {
			let stepGroups = script.steps[tabKey];

			// Handle both formats: array of arrays OR single array
			// If it's a single array of steps, wrap it in another array
			if (stepGroups.length > 0 && !Array.isArray(stepGroups[0])) {
				// Single array format - wrap it
				stepGroups = [stepGroups as any] as ScriptStep[][];
			}

			// Add a "switchTab" action before processing steps for new tabs
			if (tabKey !== "tab-1") {
				actions.push({
					type: "switchTab",
					tabId: tabKey,
					waitAfterMs: 500,
				});
			}

			// Process each step group
			for (const group of stepGroups) {
				for (const step of group) {
					// Skip steps that shouldn't run
					if (step.shouldRun === false) {
						continue;
					}

					const action: {
						type: string;
						url?: string;
						selector?: string;
						coords?: { x: number; y: number };
						text?: string;
						label?: string;
						isPassword?: boolean;
						waitAfterMs?: number;
						tabId?: string;
						isTriggerNewTab?: { isTrue: boolean; tabId: string };
					} = {
						type: step.type.toLowerCase(),
						waitAfterMs: step.waitAfterMs || 300,
						tabId: tabKey,
					};

					if (step.type === "NAVIGATE") {
						action.url = step.url;
					} else if (step.type === "TYPE") {
						action.text = step.text || "";
						action.label = step.label;
						action.isPassword = step.isPassword || false;
						action.coords = step.coords;
						// Add selector for TYPE actions too
						if (step.selector) {
							action.selector = ScriptExecutor.buildCssSelector(
								step.selector,
							);
						}
					} else if (step.type === "CLICK") {
						action.coords = step.coords;
						// Convert selector to CSS selector string
						if (step.selector) {
							action.selector = ScriptExecutor.buildCssSelector(
								step.selector,
							);
						}
						// Track if this click opens a new tab
						if (step.isTriggerNewTab) {
							action.isTriggerNewTab = step.isTriggerNewTab;
						}
					}

					actions.push(action);
				}
			}
		}

		return actions;
	}

	/**
	 * Build CSS selector from selector object
	 */
	private static buildCssSelector(selector: {
		strategy: "id" | "class" | "css" | "xpath" | "role";
		value: string;
	}): string {
		switch (selector.strategy) {
			case "id":
				return `#${selector.value}`;
			case "class":
				return `.${selector.value}`;
			case "css":
				return selector.value;
			case "xpath":
				// XPath not directly supported in CSS, return as-is for custom handling
				return selector.value;
			case "role":
				// Role selector: use attribute selector
				return `[role="${selector.value}"]`;
			default:
				return selector.value;
		}
	}

	/**
	 * Parse Google Recorder JSON
	 */
	static parseGoogleRecorderScript(json: string): GoogleRecorderScript {
		try {
			const script = JSON.parse(json) as GoogleRecorderScript;
			return script;
		} catch (error) {
			throw new Error(
				`Failed to parse Google Recorder script: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Convert Google Recorder steps to executable actions
	 */
	static async convertGoogleRecorderToActions(
		script: GoogleRecorderScript,
	): Promise<
		Array<{
			type: string;
			url?: string;
			selector?: string;
			coords?: { x: number; y: number };
			text?: string;
			label?: string;
			isPassword?: boolean;
			waitAfterMs?: number;
			tabId?: string;
			isTriggerNewTab?: { isTrue: boolean; tabId: string };
		}>
	> {
		const actions: Array<{
			type: string;
			url?: string;
			selector?: string;
			coords?: { x: number; y: number };
			text?: string;
			label?: string;
			isPassword?: boolean;
			waitAfterMs?: number;
			tabId?: string;
			isTriggerNewTab?: { isTrue: boolean; tabId: string };
		}> = [];

		let tabCounter = 1;
		let currentTabId = "tab-1";
		let previousTarget = "";

		for (const step of script.steps) {
			// Skip setViewport steps (not actionable)
			if (step.type === "setViewport") {
				continue;
			}

			// Detect new tab by checking if target URL changed significantly
			if (
				step.target &&
				step.target !== "main" &&
				step.target !== previousTarget &&
				previousTarget !== "" &&
				previousTarget !== "main"
			) {
				// Target changed - this means a new tab was opened
				tabCounter++;
				currentTabId = `tab-${tabCounter}`;

				// Add switchTab action
				actions.push({
					type: "switchTab",
					tabId: currentTabId,
					waitAfterMs: 1500,
				});
			}

			if (step.target) {
				previousTarget = step.target;
			}

			if (step.type === "navigate") {
				actions.push({
					type: "navigate",
					url: step.url || "",
					tabId: currentTabId,
					waitAfterMs: 2000,
				});
			} else if (step.type === "click") {
				const selector =
					ScriptExecutor.extractBestGoogleRecorderSelector(
						step.selectors,
					);

				const action: {
					type: string;
					selector?: string;
					coords?: { x: number; y: number };
					tabId?: string;
					waitAfterMs?: number;
					isTriggerNewTab?: { isTrue: boolean; tabId: string };
				} = {
					type: "click",
					selector: selector,
					tabId: currentTabId,
					waitAfterMs: step.assertedEvents?.some(
						(e) => e.type === "navigation",
					)
						? 2000
						: 500,
				};

				if (step.offsetX !== undefined && step.offsetY !== undefined) {
					action.coords = { x: step.offsetX, y: step.offsetY };
				}

				// Check if next step has different target (indicates new tab will open)
				const currentIndex = script.steps.indexOf(step);
				const nextStep = script.steps[currentIndex + 1];
				if (
					nextStep?.target &&
					nextStep.target !== "main" &&
					nextStep.target !== step.target &&
					step.target === "main"
				) {
					// This click will open a new tab
					tabCounter++;
					action.isTriggerNewTab = {
						isTrue: true,
						tabId: `tab-${tabCounter}`,
					};
				}

				actions.push(action);
			} else if (step.type === "change") {
				const selector =
					ScriptExecutor.extractBestGoogleRecorderSelector(
						step.selectors,
					);

				actions.push({
					type: "type",
					selector: selector,
					text: step.value || "",
					tabId: currentTabId,
					waitAfterMs: 1000, // Wait 1 second for autocomplete to update
				});
			}
		}

		return actions;
	}

	/**
	 * Extract the best selector from Google Recorder's selector array
	 * Priority: Stable CSS selector > ARIA > Dynamic ID selectors
	 */
	private static extractBestGoogleRecorderSelector(
		selectors?: string[][],
	): string {
		if (!selectors || selectors.length === 0) {
			return "";
		}

		// Try to find a CSS selector (doesn't start with aria/, xpath/, pierce/, or text/)
		// But skip selectors with dynamic IDs (starting with #\3 or similar)
		for (const selectorGroup of selectors) {
			for (const selector of selectorGroup) {
				if (
					!selector.startsWith("aria/") &&
					!selector.startsWith("xpath/") &&
					!selector.startsWith("pierce/") &&
					!selector.startsWith("text/") &&
					!selector.match(/^#\\3/)
				) {
					// Skip dynamic IDs like #\38 81ef649...

					// If selector contains dynamic ID in the middle, try to extract the stable part
					const dynamicIdMatch = selector.match(
						/#\\[0-9a-f]+ [0-9a-f-]+ (.+)/,
					);
					if (dynamicIdMatch) {
						// Return just the stable part after the dynamic ID
						return dynamicIdMatch[1];
					}

					return selector;
				}
			}
		}

		// Try selectors with dynamic IDs but extract the stable attribute part
		for (const selectorGroup of selectors) {
			for (const selector of selectorGroup) {
				if (selector.startsWith("#\\")) {
					// Extract data-cy or other stable attributes from dynamic ID selectors
					// e.g., "#\38 81ef649... [data-cy='title-recipe'] > a span" -> "[data-cy='title-recipe'] > a span"
					const stablePartMatch = selector.match(
						/\[data-cy=['"]([^'"]+)['"]\][^#]*/,
					);
					if (stablePartMatch) {
						return `[data-cy='${stablePartMatch[1]}'] a span`;
					}
				}
			}
		}

		// Fallback to ARIA selector (convert to CSS attribute selector)
		for (const selectorGroup of selectors) {
			for (const selector of selectorGroup) {
				if (selector.startsWith("aria/")) {
					// Parse ARIA selector like "aria/Search for Products[role="textbox"]"
					const ariaMatch = selector.match(
						/aria\/(.+?)\[role="(.+?)"\]/,
					);
					if (ariaMatch) {
						return `[role="${ariaMatch[2]}"]`;
					}
					// Simpler ARIA role
					const roleMatch = selector.match(/aria\/(.+)/);
					if (roleMatch) {
						// Try to extract role from the label
						return `[aria-label*="${roleMatch[1]}"]`;
					}
				}
			}
		}

		// Last resort: use first selector as-is
		return selectors[0][0];
	}

	/**
	 * Execute a single action
	 * IMPORTANT: This method NEVER creates new tabs - it only operates within the provided tabId
	 */
	static async executeAction(
		tabId: number,
		action: {
			type: string;
			url?: string;
			selector?: string;
			coords?: { x: number; y: number };
			text?: string;
			label?: string;
			isPassword?: boolean;
			waitAfterMs?: number;
		},
		onAskUser?: (label: string, isPassword: boolean) => Promise<string>,
	): Promise<void> {
		console.log("=".repeat(80));
		console.log(
			`[ScriptExecutor] Executing action:`,
			action.type.toUpperCase(),
		);
		console.log(`[ScriptExecutor] Tab ID:`, tabId);
		console.log(
			`[ScriptExecutor] Full action object:`,
			JSON.stringify(action, null, 2),
		);

		if (action.type === "navigate") {
			if (!action.url) {
				throw new Error("Navigate action requires URL");
			}
			console.log(`[ScriptExecutor] NAVIGATE - URL: ${action.url}`);
			// CRITICAL: Use chrome.tabs.update to navigate in the SAME tab
			// NEVER use chrome.tabs.create here - that would open a new tab
			await chrome.tabs.update(tabId, { url: action.url });

			// Wait for page to load in the same tab
			let loadTimeout = 15;
			while (loadTimeout > 0) {
				const tabs = await chrome.tabs.query({});
				const tab = tabs.find((t) => t.id === tabId);
				if (tab && tab.status === "complete") {
					console.log(
						`[ScriptExecutor] NAVIGATE - Page loaded successfully`,
					);
					await new Promise((resolve) => setTimeout(resolve, 500));
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 500));
				loadTimeout--;
			}
			if (loadTimeout === 0) {
				console.warn(
					`[ScriptExecutor] NAVIGATE - Load timeout reached`,
				);
			}
		} else if (action.type === "type") {
			// If text is empty or it's a password field, ask user
			let textToType = action.text || "";
			console.log(
				`[ScriptExecutor] TYPE - Initial text: "${textToType}"`,
			);
			console.log(`[ScriptExecutor] TYPE - Label: "${action.label}"`);
			console.log(
				`[ScriptExecutor] TYPE - Is password: ${action.isPassword}`,
			);

			if (
				(!textToType || action.isPassword) &&
				action.label &&
				onAskUser
			) {
				console.log(`[ScriptExecutor] TYPE - Asking user for input`);
				textToType = await onAskUser(
					action.label,
					action.isPassword || false,
				);
				console.log(
					`[ScriptExecutor] TYPE - User provided: "${textToType}"`,
				);
			}

			if (action.selector) {
				console.log(
					`[ScriptExecutor] TYPE - Using SELECTOR: "${action.selector}"`,
				);
				// typeBySelector handles retry logic internally
				const response = await chrome.runtime.sendMessage({
					type: "EXECUTE_SCRIPT_ACTION",
					tabId: tabId,
					action: "typeBySelector",
					payload: {
						selector: action.selector,
						value: textToType,
					},
				});
				console.log(`[ScriptExecutor] TYPE - Response:`, response);
				if (chrome.runtime.lastError) {
					console.warn(
						`[ScriptExecutor] TYPE - Chrome runtime error:`,
						chrome.runtime.lastError,
					);
				}
				if (!response.success) {
					console.error(
						`[ScriptExecutor] TYPE - Failed:`,
						response.error,
					);
					throw new Error(
						response.error || "Failed to type by selector",
					);
				}
				console.log(`[ScriptExecutor] TYPE - Succeeded! ✓`);
			} else {
				console.error(
					`[ScriptExecutor] TYPE - No selector provided! Selector is required.`,
				);
				throw new Error("TYPE action requires a selector");
			}
		} else if (action.type === "click") {
			if (action.selector) {
				console.log(
					`[ScriptExecutor] CLICK - Using SELECTOR: "${action.selector}"`,
				);
				// clickBySelector handles retry logic internally
				const response = await chrome.runtime.sendMessage({
					type: "EXECUTE_SCRIPT_ACTION",
					tabId: tabId,
					action: "clickBySelector",
					payload: {
						selector: action.selector,
					},
				});
				console.log(`[ScriptExecutor] CLICK - Response:`, response);
				if (chrome.runtime.lastError) {
					console.warn(
						`[ScriptExecutor] CLICK - Chrome runtime error:`,
						chrome.runtime.lastError,
					);
				}
				if (!response.success) {
					console.error(
						`[ScriptExecutor] CLICK - Failed:`,
						response.error,
					);
					throw new Error(
						response.error || "Failed to click by selector",
					);
				}
				console.log(`[ScriptExecutor] CLICK - Succeeded! ✓`);
			} else {
				console.error(
					`[ScriptExecutor] CLICK - No selector provided! Selector is required.`,
				);
				throw new Error("CLICK action requires a selector");
			}
		}

		// Wait after action
		if (action.waitAfterMs) {
			console.log(
				`[ScriptExecutor] Waiting ${action.waitAfterMs}ms after action...`,
			);
			await new Promise((resolve) =>
				setTimeout(resolve, action.waitAfterMs),
			);
		}

		// If this was a click with long wait (navigation), wait for page to fully load
		if (
			action.type === "click" &&
			action.waitAfterMs &&
			action.waitAfterMs >= 2000
		) {
			console.log(
				`[ScriptExecutor] CLICK - Long wait detected, waiting for page load...`,
			);
			// Wait for page to finish loading
			let loadTimeout = 20; // 20 * 500ms = 10 seconds max
			while (loadTimeout > 0) {
				const tabs = await chrome.tabs.query({});
				const tab = tabs.find((t) => t.id === tabId);
				if (tab && tab.status === "complete") {
					console.log(
						`[ScriptExecutor] CLICK - Page load complete after navigation`,
					);
					// Page loaded - wait for dynamic content
					await new Promise((resolve) => setTimeout(resolve, 2000));
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 500));
				loadTimeout--;
			}
			if (loadTimeout === 0) {
				console.warn(
					`[ScriptExecutor] CLICK - Page load timeout reached`,
				);
			}
		}

		console.log(
			`[ScriptExecutor] Action ${action.type.toUpperCase()} completed successfully ✓`,
		);
		console.log("=".repeat(80));
	}
}
