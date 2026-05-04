/**
 * Playwright Exporter
 * Converts recorded actions to Playwright recorder extension format
 * Matches the exact format from the reference extension
 */

import type { RecordedAction, RecordedActionType } from "../types";

/**
 * Playwright recorder extension format structure
 * Matches the reference extension's format EXACTLY
 */
interface PlaywrightScriptExport {
	version: string;
	meta: {
		id: string;
		title: string;
		description: string;
		createdAt: number;
		updatedAt: number;
		intent: string;
	};
	steps: {
		[tabId: string]: Array<Array<PlaywrightAction>>;
	};
}

interface PlaywrightAction {
	id: number;
	type: string; // 'NAVIGATE' | 'CLICK' | 'TYPE' | 'SCROLL' etc. (uppercase)
	url: string | null;
	coords: { x: number; y: number } | null;
	multiCoords: Array<{ x: number; y: number }> | null;
	prompt: string | null;
	text: string | null;
	pressEnter: boolean | null;
	deltaY: number | null;
	waitUntil: string | null;
	waitAfterMs: number | null;
	viewport: {
		width: number;
		height: number;
		deviceScaleFactor: number;
	};
	timestamp: number;
	label: string | null;
	description: string | null;
	isPassword: boolean;
	storeValue: boolean;
	selector: {
		strategy: string;
		value: string;
		frameSelector: string | null;
	} | null;
	isTriggerNewTab: boolean | null;
	shouldRun: boolean;
	required: boolean;
	sendToPlayground: unknown;
	tag: string | null;
}

// Export as namespace with functions instead of static-only class
// This avoids Biome lint error: noStaticOnlyClass
export namespace PlaywrightExporter {
	/**
	 * Export recorded actions to Playwright recorder format
	 *
	 * @param actions - Array of recorded actions
	 * @param scriptName - Name for the script
	 * @returns Playwright JSON object matching reference extension format
	 */
	export function create(
		actions: RecordedAction[],
		scriptName: string,
	): PlaywrightScriptExport {
		const now = Date.now();
		const id = `${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 13)}`;

		// Group actions by tab ID
		const actionsByTab = groupActionsByTab(actions);

		// Convert to Playwright actions format - each action in its own nested array
		const steps: { [tabId: string]: Array<Array<PlaywrightAction>> } = {};

		// Create sequential tab numbering (tab-1, tab-2, etc.) instead of using actual tab IDs
		let tabCounter = 1;
		for (const [_tabId, tabActions] of Object.entries(actionsByTab)) {
			// Each action gets its own nested array: [[action1], [action2], ...]
			steps[`tab-${tabCounter}`] = tabActions.map((action, index) => [
				convertToPlaywrightAction(action, index + 1),
			]);
			tabCounter++;
		}

		return {
			version: "1.0",
			meta: {
				id,
				title: scriptName,
				description: scriptName,
				createdAt: now,
				updatedAt: now,
				intent: scriptName,
			},
			steps,
		};
	}

	/**
	 * Group actions by tab ID
	 */
	function groupActionsByTab(
		actions: RecordedAction[],
	): Record<string, RecordedAction[]> {
		const grouped: Record<string, RecordedAction[]> = {};

		for (const action of actions) {
			const tabId = action.tabId?.toString() || "default";
			if (!grouped[tabId]) {
				grouped[tabId] = [];
			}
			grouped[tabId].push(action);
		}

		return grouped;
	}

	/**
	 * Convert RecordedAction to PlaywrightAction (reference extension format)
	 */
	function convertToPlaywrightAction(
		action: RecordedAction,
		id: number,
	): PlaywrightAction {
		// Determine selector strategy and value
		let selector: {
			strategy: string;
			value: string;
			frameSelector: string | null;
		} | null = null;
		if (action.selector && action.selector.length > 0) {
			const primarySelector = action.selector[0];
			const { strategy, value } =
				extractSelectorStrategyAndValue(primarySelector);
			selector = {
				strategy,
				value,
				frameSelector: null,
			};
		}

		// Get actual element tag from eventData (captured from DOM)
		// Use lowercase to match reference format
		let tag: string | null = null;
		if (
			action.eventData?.tagName &&
			action.eventData.tagName !== "NAVIGATE"
		) {
			tag = action.eventData.tagName.toLowerCase();
		}

		// Determine if this is a password field - check eventTypeAttr for input type
		const isPassword =
			action.type === "TYPE" &&
			action.eventData?.eventTypeAttr === "password";

		// Build the action object matching reference format EXACTLY
		const playwrightAction: PlaywrightAction = {
			id,
			type: action.type,
			url: action.type === "NAVIGATE" ? action.url || null : null,
			coords: action.coords || null,
			multiCoords: null,
			prompt: null,
			text:
				action.type === "TYPE" || action.type === "SELECT" ? "" : null,
			pressEnter: null,
			deltaY: action.type === "SCROLL" ? action.deltaY || 400 : null,
			waitUntil: null,
			waitAfterMs: getDefaultWaitTime(action.type),
			viewport: {
				width: 1280,
				height: 800,
				deviceScaleFactor: 1.0,
			},
			// Ensure timestamp is an integer (Long in Java) by flooring fractional values
			timestamp: Math.floor(action.timestamp || Date.now()),
			label:
				action.type === "TYPE" || action.type === "SELECT"
					? action.text || null
					: null,
			description: null,
			isPassword,
			storeValue: false,
			selector,
			isTriggerNewTab: null,
			shouldRun: true,
			required: false,
			sendToPlayground: null,
			tag,
		};

		return playwrightAction;
	}

	/**
	 * Extract selector strategy and clean value
	 * Converts #user-name to { strategy: 'id', value: 'user-name' }
	 * Converts [id="user-name"] to { strategy: 'id', value: 'user-name' }
	 * Converts CSS to { strategy: 'css', value: '...' }
	 */
	function extractSelectorStrategyAndValue(selector: string): {
		strategy: string;
		value: string;
	} {
		// XPath starts with / or //
		if (selector.startsWith("/") || selector.startsWith("//")) {
			return { strategy: "xpath", value: selector };
		}

		// ID selector: #user-name -> strategy: id, value: user-name
		if (
			selector.startsWith("#") &&
			!selector.includes(" ") &&
			!selector.includes(">") &&
			!selector.includes(".", 1)
		) {
			return { strategy: "id", value: selector.substring(1) };
		}

		// Attribute selector: [id="user-name"] -> strategy: id, value: user-name
		const idAttrMatch = selector.match(/^\[id=["']([^"']+)["']\]$/);
		if (idAttrMatch) {
			return { strategy: "id", value: idAttrMatch[1] };
		}

		// data-test attribute: [data-test="..."] -> strategy: css, keep as is
		// All other CSS selectors
		return { strategy: "css", value: selector };
	}

	/**
	 * Get default wait time based on action type
	 */
	function getDefaultWaitTime(actionType: string): number | null {
		switch (actionType) {
			case "NAVIGATE":
				return 100;
			case "CLICK":
			case "DBLCLICK":
				return 300;
			case "SCROLL":
				return 300;
			case "TYPE":
			case "SELECT":
				return null;
			default:
				return null;
		}
	}

	/**
	 * Import Playwright JSON and convert to RecordedActions
	 * Useful for editing imported scripts
	 */
	export function importScript(
		playwrightJson: PlaywrightScriptExport,
	): RecordedAction[] {
		const actions: RecordedAction[] = [];

		for (const [tabId, tabSteps] of Object.entries(playwrightJson.steps)) {
			// Extract numeric tab ID from "tab-1" format
			const numericTabId = parseInt(tabId.replace("tab-", ""), 10);

			for (const stepGroup of tabSteps) {
				for (const step of stepGroup) {
					const action: RecordedAction = {
						type: step.type as RecordedActionType,
						timestamp: step.timestamp,
						tabId: numericTabId,
					};

					// Handle navigation
					if (step.type === "NAVIGATE" && step.url) {
						action.url = step.url;
					}

					// Handle selector
					if (step.selector) {
						action.selector = [step.selector.value];
					}

					// Handle text input (label field contains the value)
					if (step.label) {
						action.text = step.label;
					}

					// Handle coordinates
					if (step.coords) {
						action.coords = step.coords;
					}

					// Handle scroll
					if (step.deltaY !== null && step.deltaY !== undefined) {
						action.deltaY = step.deltaY;
					}

					actions.push(action);
				}
			}
		}

		return actions;
	}

	/**
	 * Validate Playwright JSON format
	 */
	export function validate(json: unknown): boolean {
		try {
			// Type guard to check if json is an object
			if (!json || typeof json !== "object") {
				return false;
			}

			const obj = json as Record<string, unknown>;

			if (!obj.version || !obj.meta || !obj.steps) {
				return false;
			}

			const meta = obj.meta as Record<string, unknown>;
			if (typeof meta.id !== "string" || typeof meta.title !== "string") {
				return false;
			}

			if (typeof obj.steps !== "object") {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}
}
