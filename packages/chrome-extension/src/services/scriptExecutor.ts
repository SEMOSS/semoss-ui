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
	// Track intended field values per tab to detect autofill
	private static intendedFieldValues = new Map<number, Map<string, string>>();

	private static rememberIntendedFieldValue(
		tabId: number,
		selector: string,
		value: string,
		isPassword: boolean = false,
	): void {
		if (!ScriptExecutor.intendedFieldValues.has(tabId)) {
			ScriptExecutor.intendedFieldValues.set(tabId, new Map());
		}
		ScriptExecutor.intendedFieldValues
			.get(tabId)!
			.set(selector, JSON.stringify({ value, isPassword }));
	}

	private static clearIntendedFieldValues(tabId: number): void {
		ScriptExecutor.intendedFieldValues.delete(tabId);
	}

	private static async verifyAndCorrectField(
		tabId: number,
		selector: string,
		expectedValue: string,
		fieldType: string,
		isPassword: boolean = false,
	): Promise<void> {
		// Skip password field verification since browsers block reading password values
		if (isPassword) {
			console.log(
				`[ScriptExecutor] Skipping verification for password field (browser security restriction)`,
			);
			return;
		}

		const verifyResponse = await chrome.runtime.sendMessage({
			type: "EXECUTE_SCRIPT_ACTION",
			tabId: tabId,
			action: "getFieldValue",
			payload: { selector },
		});

		const fieldResult = verifyResponse.result as
			| { success?: boolean; value?: string }
			| undefined;

		if (!verifyResponse.success || !fieldResult?.success) {
			console.error(
				`[ScriptExecutor] Failed to verify field: ${verifyResponse.error || "Unknown error"}`,
			);
			throw new Error(
				`Failed to verify ${fieldType}. Could not read field value.`,
			);
		}

		const actualValue = fieldResult.value || "";

		// Check if field is empty when it shouldn't be
		if (expectedValue && !actualValue) {
			throw new Error(
				`${fieldType} is empty! Expected "${expectedValue}" but field was not filled. This may indicate typing failed.`,
			);
		}

		// Check if autofill changed the value
		if (actualValue !== expectedValue) {
			throw new Error(
				`Browser autofill changed the ${fieldType}. Expected "${expectedValue}" but found "${actualValue}". Stopping execution to prevent using wrong credentials.`,
			);
		}
	}

	private static async verifyAllIntendedFields(tabId: number): Promise<void> {
		const tabFields = ScriptExecutor.intendedFieldValues.get(tabId);
		if (!tabFields || tabFields.size === 0) return;

		console.log(
			`[ScriptExecutor] Verifying ${tabFields.size} field(s) before form submission...`,
		);

		for (const [selector, fieldDataJson] of tabFields) {
			const fieldData = JSON.parse(fieldDataJson) as {
				value: string;
				isPassword: boolean;
			};
			const fieldType = fieldData.isPassword ? "password" : "field";

			await ScriptExecutor.verifyAndCorrectField(
				tabId,
				selector,
				fieldData.value,
				fieldType,
				fieldData.isPassword,
			);
		}
	}

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
				stepGroups = [
					stepGroups as unknown as ScriptStep[],
				] as ScriptStep[][];
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
			let previousStep: ScriptStep | null = null;
			for (const group of stepGroups) {
				for (const step of group) {
					// Skip steps that shouldn't run
					if (step.shouldRun === false) {
						continue;
					}

					// SECURITY FIX: Detect if this NAVIGATE follows a CLICK (likely form submission)
					const isNavigateAfterClick =
						step.type === "NAVIGATE" &&
						previousStep?.type === "CLICK";

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
						expectedUrl?: string; // For waitForNavigation
					} = {
						type: step.type.toLowerCase(),
						waitAfterMs: step.waitAfterMs || 300,
						tabId: tabKey,
					};

					if (step.type === "NAVIGATE") {
						if (isNavigateAfterClick) {
							// This is expected navigation (result of form submission)
							// Convert to waitForNavigation to prevent false positives
							action.type = "waitForNavigation";
							action.expectedUrl = step.url;
							action.waitAfterMs = 5000; // Give more time for server response
						} else {
							// This is intentional user navigation
							action.url = step.url;
						}
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

					// Track previous step for navigation context detection
					previousStep = step;
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
		onAskUser?: (
			label: string,
			isPassword: boolean,
			selector?: string,
			tabId?: number,
		) => Promise<string>,
	): Promise<void> {
		if (action.type === "navigate") {
			if (!action.url) {
				throw new Error("Navigate action requires URL");
			}
			// Clear intended field values when navigating to a new page
			ScriptExecutor.clearIntendedFieldValues(tabId);

			// CRITICAL: Use chrome.tabs.update to navigate in the SAME tab
			// NEVER use chrome.tabs.create here - that would open a new tab
			await chrome.tabs.update(tabId, { url: action.url });

			// Wait for page to load in the same tab
			let loadTimeout = 15;
			while (loadTimeout > 0) {
				const tabs = await chrome.tabs.query({});
				const tab = tabs.find((t) => t.id === tabId);
				if (tab && tab.status === "complete") {
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
		} else if (action.type === "waitForNavigation") {
			// SECURITY FIX: Wait for natural navigation instead of forcing it
			// This prevents false positives when form submission fails (auth, validation, etc.)
			const expectedUrl = (action as unknown as { expectedUrl?: string })
				.expectedUrl;
			if (!expectedUrl) {
				throw new Error("waitForNavigation requires expectedUrl");
			}

			// Wait for URL to change to expected URL (or timeout)
			const startTime = Date.now();
			const timeout = 10000; // 10 seconds max wait
			let navigationSucceeded = false;

			while (Date.now() - startTime < timeout) {
				const tabs = await chrome.tabs.query({});
				const tab = tabs.find((t) => t.id === tabId);

				// Check if we reached the expected URL
				if (
					tab?.url?.includes(
						expectedUrl.split("/").pop() || expectedUrl,
					)
				) {
					navigationSucceeded = true;
					// BUGFIX: Clear tracked field values from previous page
					ScriptExecutor.clearIntendedFieldValues(tabId);

					break;
				}

				// Wait before checking again
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			if (!navigationSucceeded) {
				// Check current URL to provide better error message
				const tabs = await chrome.tabs.query({});
				const currentTab = tabs.find((t) => t.id === tabId);
				const currentUrl = currentTab?.url || "unknown";

				// BUGFIX: Clear stale field tracking even on navigation failure
				ScriptExecutor.clearIntendedFieldValues(tabId);

				throw new Error(
					`❌ Navigation failed: Expected to reach "${expectedUrl}" but remained at "${currentUrl}". ` +
						`This indicates authentication failure, validation error, or server issue. Check credentials and page state.`,
				);
			}

			// Wait for page to fully load and settle
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} else if (action.type === "type") {
			// If text is empty or it's a password field, ask user
			let textToType = action.text || "";
			if (
				(!textToType || action.isPassword) &&
				action.label &&
				onAskUser
			) {
				textToType = await onAskUser(
					action.label,
					action.isPassword || false,
					action.selector,
					tabId,
				);
			}

			if (action.selector) {
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

				// Remember and verify the typed value to detect autofill
				if (textToType) {
					ScriptExecutor.rememberIntendedFieldValue(
						tabId,
						action.selector,
						textToType,
						action.isPassword || false,
					);

					// Wait for browser to potentially trigger autofill
					await new Promise((resolve) => setTimeout(resolve, 800));

					const fieldType = action.isPassword ? "password" : "field";
					await ScriptExecutor.verifyAndCorrectField(
						tabId,
						action.selector,
						textToType,
						fieldType,
						action.isPassword || false,
					);
				} else {
					console.warn(
						`[ScriptExecutor] Warning: No text to type for field with selector "${action.selector}"`,
					);
				}
			} else {
				console.error(
					`[ScriptExecutor] TYPE - No selector provided! Selector is required.`,
				);
				throw new Error("TYPE action requires a selector");
			}
		} else if (action.type === "click") {
			if (action.selector) {
				// Verify all intended field values before clicking (e.g., before form submission)
				await ScriptExecutor.verifyAllIntendedFields(tabId);

				// clickBySelector handles retry logic internally
				const response = await chrome.runtime.sendMessage({
					type: "EXECUTE_SCRIPT_ACTION",
					tabId: tabId,
					action: "clickBySelector",
					payload: {
						selector: action.selector,
					},
				});
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
			} else {
				console.error(
					`[ScriptExecutor] CLICK - No selector provided! Selector is required.`,
				);
				throw new Error("CLICK action requires a selector");
			}
		}

		// Wait after action
		if (action.waitAfterMs) {
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
			// Wait for page to finish loading
			let loadTimeout = 20; // 20 * 500ms = 10 seconds max
			while (loadTimeout > 0) {
				const tabs = await chrome.tabs.query({});
				const tab = tabs.find((t) => t.id === tabId);
				if (tab && tab.status === "complete") {
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
	}
}
