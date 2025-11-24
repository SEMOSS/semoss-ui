/**
 * Enhanced DOM actions using Chrome Debugger API
 */

import { callRPC } from "../content/rpc";

// Delay constants
const DELAY_BETWEEN_CLICKS = 500; // ms
const DELAY_BETWEEN_KEYSTROKES = 50; // ms
const DELAY_AFTER_SCROLL = 1000; // ms

/**
 * Send command to Chrome Debugger
 */
async function sendCommand(
	tabId: number,
	method: string,
	params?: Record<string, unknown>,
) {
	return chrome.debugger.sendCommand({ tabId }, method, params);
}

/**
 * Get Chrome Debugger object ID for an element
 * Uses persistent data-workshop-node-id to handle DOM re-renders
 */
async function getObjectId(tabId: number, elementId: number): Promise<string> {
	// Get the unique ID from the mapping (stored globally during DOM extraction)
	const elementMapping =
		(
			globalThis as Record<string, unknown> & {
				__elementMapping?: Record<string, string>;
			}
		).__elementMapping || {};
	const uniqueId = elementMapping[elementId.toString()];

	if (!uniqueId) {
		console.warn(
			`No unique ID found for element ${elementId}. Mapping:`,
			elementMapping,
		);
		const availableIds = Object.keys(elementMapping).join(", ");
		throw new Error(
			`Could not find unique ID for element ${elementId}. The DOM may have changed since extraction. Available element IDs: ${availableIds}`,
		);
	}

	// Get document root
	const document = (await sendCommand(tabId, "DOM.getDocument")) as {
		root: { nodeId: number };
	};

	// Find element by persistent unique ID
	const selector = `[data-workshop-node-id="${uniqueId}"]`;
	const queryResult = (await sendCommand(tabId, "DOM.querySelector", {
		nodeId: document.root.nodeId,
		selector,
	})) as { nodeId: number };

	const nodeId = queryResult.nodeId;

	if (!nodeId) {
		throw new Error(
			`Could not find element with unique ID "${uniqueId}". The element may have been removed from the page.`,
		);
	}

	// Get object ID from node ID
	const result = (await sendCommand(tabId, "DOM.resolveNode", {
		nodeId,
	})) as { object: { objectId: string } };
	const objectId = result.object.objectId;

	if (!objectId) {
		throw new Error(`Could not resolve object for element ${elementId}`);
	}

	return objectId;
}

/**
 * Scroll element into view (center of viewport)
 */
async function scrollIntoView(tabId: number, objectId: string): Promise<void> {
	const scrollScript = `
    function() {
      this.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth'
      });
    }
  `;

	await sendCommand(tabId, "Runtime.callFunctionOn", {
		objectId,
		functionDeclaration: scrollScript,
	});

	// Wait for scroll animation to complete
	await sleep(DELAY_AFTER_SCROLL);
}

/**
 * Get center coordinates of an element
 */
async function getCenterCoordinates(
	tabId: number,
	objectId: string,
	retries = 3,
): Promise<{ x: number; y: number }> {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			const { model } = (await sendCommand(tabId, "DOM.getBoxModel", {
				objectId,
			})) as { model: { border: number[] } };

			if (!model || !model.border) {
				throw new Error(
					"Element has no box model (may be hidden or not rendered)",
				);
			}

			const [x1, y1, _x2, _y2, x3, y3, _x4, _y4] = model.border;
			const centerX = (x1 + x3) / 2;
			const centerY = (y1 + y3) / 2;

			return { x: centerX, y: centerY };
		} catch (error) {
			if (attempt < retries - 1) {
				console.warn(
					`Failed to get box model (attempt ${attempt + 1}/${retries}), retrying in 500ms...`,
					error instanceof Error ? error.message : String(error),
				);
				await sleep(500);
			} else {
				throw new Error(
					`Could not compute box model after ${retries} attempts. Element may be hidden, removed, or still loading. Original error: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
	}

	throw new Error("Could not get element coordinates");
}

/**
 * Dispatch mouse click at specific coordinates with visual feedback
 */
async function clickAtPosition(
	tabId: number,
	x: number,
	y: number,
	clickCount = 1,
): Promise<void> {
	// Show ripple effect for visual feedback
	try {
		await callRPC("ripple", [x, y], 1);
	} catch (err) {
		console.warn("Could not show ripple effect:", err);
	}

	// Mouse down
	await sendCommand(tabId, "Input.dispatchMouseEvent", {
		type: "mousePressed",
		x,
		y,
		button: "left",
		clickCount,
	});

	// Mouse up
	await sendCommand(tabId, "Input.dispatchMouseEvent", {
		type: "mouseReleased",
		x,
		y,
		button: "left",
		clickCount,
	});

	await sleep(DELAY_BETWEEN_CLICKS);
}

/**
 * Select all text in an input (triple-click)
 */
async function selectAllText(
	tabId: number,
	x: number,
	y: number,
): Promise<void> {
	await clickAtPosition(tabId, x, y, 3);
}

/**
 * Type text character by character (triggers proper events)
 */
async function typeText(tabId: number, text: string): Promise<void> {
	for (const char of text) {
		// Key down
		await sendCommand(tabId, "Input.dispatchKeyEvent", {
			type: "keyDown",
			text: char,
		});

		await sleep(DELAY_BETWEEN_KEYSTROKES / 2);

		// Key up
		await sendCommand(tabId, "Input.dispatchKeyEvent", {
			type: "keyUp",
			text: char,
		});

		await sleep(DELAY_BETWEEN_KEYSTROKES / 2);
	}
}

/**
 * Blur the currently focused element
 */
async function blurFocusedElement(tabId: number): Promise<void> {
	const blurScript = `
    if (document.activeElement) {
      document.activeElement.blur();
    }
  `;

	await sendCommand(tabId, "Runtime.evaluate", {
		expression: blurScript,
	});
}

/**
 * Helper function for delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Click on an element
 */
export async function enhancedClick(
	tabId: number,
	elementId: number,
): Promise<void> {
	console.log(`Enhanced click on element ${elementId}`);

	const objectId = await getObjectId(tabId, elementId);
	await scrollIntoView(tabId, objectId);
	const { x, y } = await getCenterCoordinates(tabId, objectId);
	await clickAtPosition(tabId, x, y);

	console.log(`✓ Clicked element ${elementId} at (${x}, ${y})`);
}

/**
 * Set value of an input element
 */
export async function enhancedSetValue(
	tabId: number,
	elementId: number,
	value: string,
): Promise<void> {
	console.log(`Enhanced setValue on element ${elementId}: "${value}"`);

	const objectId = await getObjectId(tabId, elementId);
	await scrollIntoView(tabId, objectId);
	const { x, y } = await getCenterCoordinates(tabId, objectId);

	// Clear existing text by selecting all
	await selectAllText(tabId, x, y);
	await sleep(100);

	// Type the new value character by character
	await typeText(tabId, value);
	await sleep(100);

	// Blur to trigger onChange events
	await blurFocusedElement(tabId);

	console.log(`✓ Set value for element ${elementId}`);
}
