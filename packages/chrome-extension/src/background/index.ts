// Background service worker for the extension
import { enhancedClick, enhancedSetValue } from "./enhancedActions";

console.log("Workshop Automation - Background script loaded");

// Track which tabs have debuggers attached
const attachedDebuggers = new Set<number>();

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
	if (tab.id) {
		chrome.sidePanel.open({ tabId: tab.id }).catch((error) => {
			console.error("Error opening side panel:", error);
		});
	}
});

// Clean up when debugger is detached (user closes tab, etc.)
chrome.debugger.onDetach.addListener((source, reason) => {
	if (source.tabId) {
		attachedDebuggers.delete(source.tabId);
		console.log(
			`Debugger detached from tab ${source.tabId}, reason: ${reason}`,
		);
	}
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log(
		"[BACKGROUND] 📨 Received message:",
		message.type,
		"from:",
		sender.tab ? `tab ${sender.tab.id}` : "extension",
		"data:",
		message.script ? { scriptName: message.script.name, hasContent: !!message.script.scriptContent } : "N/A"
	);

	// Forward playground messages from content scripts to all extension pages (panel, popup, etc.)
	// Only forward if message came from a tab (content script), not from extension itself
	if (
		sender.tab &&
		(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" ||
			message.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT" ||
			message.type === "PLAYGROUND_CHAT_RESPONSE" ||
			message.type === "PLAYGROUND_CHAT_SUBMIT")
	) {
		console.log(
			`[BACKGROUND] 🔄 Forwarding ${message.type} from tab ${sender.tab.id} to all extension contexts`,
		);
		// Broadcast to all extension contexts (this won't trigger this listener again since sender.tab will be undefined)
		chrome.runtime
			.sendMessage(message)
			.then(() => {
				console.log(
					`[BACKGROUND] ✅ Successfully broadcasted ${message.type}`,
				);
			})
			.catch((err) => {
				console.error(
					`[BACKGROUND] ❌ Failed to broadcast ${message.type}:`,
					err,
				);
			});
		sendResponse({ success: true });
		return true;
	}

	switch (message.type) {
		case "GET_CURRENT_TAB":
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				sendResponse({ tabId: tabs[0]?.id });
			});
			return true; // Keep channel open for async response

		case "ATTACH_DEBUGGER":
			attachDebugger(message.tabId)
				.then(() => sendResponse({ success: true }))
				.catch((error) =>
					sendResponse({ success: false, error: error.message }),
				);
			return true;

		case "DETACH_DEBUGGER":
			detachDebugger(message.tabId)
				.then(() => sendResponse({ success: true }))
				.catch((error) =>
					sendResponse({ success: false, error: error.message }),
				);
			return true;

		case "EXECUTE_ACTION":
			// Store element mapping if provided
			if (message.elementMapping) {
				(
					globalThis as Record<string, unknown> & {
						__elementMapping?: Record<string, string>;
					}
				).__elementMapping = message.elementMapping;
			}
			executeAction(message.tabId, message.action, message.payload)
				.then((result) => sendResponse({ success: true, result }))
				.catch((error) =>
					sendResponse({ success: false, error: error.message }),
				);
			return true;

		case "EXECUTE_SCRIPT_ACTION":
			// Execute script-based actions (from JSON)
			executeScriptAction(message.tabId, message.action, message.payload)
				.then((result) => sendResponse({ success: true, result }))
				.catch((error) =>
					sendResponse({ success: false, error: error.message }),
				);
			return true;

		default:
			console.warn("Unknown message type:", message.type);
	}
});

// Attach Chrome debugger to a tab
async function attachDebugger(tabId: number): Promise<void> {
	// Skip if already attached
	if (attachedDebuggers.has(tabId)) {
		return;
	}

	return new Promise((resolve, reject) => {
		chrome.debugger.attach({ tabId }, "1.3", () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				console.log(`Debugger attached to tab ${tabId}`);
				attachedDebuggers.add(tabId);
				resolve();
			}
		});
	});
}

// Detach Chrome debugger from a tab
async function detachDebugger(tabId: number): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.debugger.detach({ tabId }, () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				console.log(`Debugger detached from tab ${tabId}`);
				attachedDebuggers.delete(tabId);
				resolve();
			}
		});
	});
}

// Execute an action using Chrome debugger
async function executeAction(
	tabId: number,
	action: string,
	payload: Record<string, unknown>,
): Promise<unknown> {
	console.log(`Executing action: ${action}`, payload);

	// Enable DOM and Runtime for enhanced actions
	try {
		await sendDebuggerCommand(tabId, "DOM.enable");
		await sendDebuggerCommand(tabId, "Runtime.enable");
	} catch (err) {
		console.warn("DOM/Runtime already enabled:", err);
	}

	switch (action) {
		case "click":
			if (typeof payload.elementId !== "number") {
				throw new Error("elementId must be a number");
			}
			return await enhancedClick(tabId, payload.elementId);
		case "setValue":
			if (typeof payload.elementId !== "number") {
				throw new Error("elementId must be a number");
			}
			if (typeof payload.value !== "string") {
				throw new Error("value must be a string");
			}
			return await enhancedSetValue(
				tabId,
				payload.elementId,
				payload.value,
			);
		case "wait":
			if (typeof payload.ms !== "number") {
				throw new Error("ms must be a number");
			}
			return await wait(payload.ms);
		default:
			throw new Error(`Unknown action: ${action}`);
	}
}

// Send command to Chrome debugger
async function sendDebuggerCommand(
	tabId: number,
	method: string,
	params?: Record<string, unknown>,
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve(result);
			}
		});
	});
}

// Wait helper function
function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Execute script-based actions (from Playwright JSON)
async function executeScriptAction(
	tabId: number,
	action: string,
	payload: Record<string, unknown>,
): Promise<unknown> {
	console.log(`Executing script action: ${action}`, payload);

	// Attach debugger if needed (will skip if already attached)
	await attachDebugger(tabId);

	// Enable DOM
	try {
		await sendDebuggerCommand(tabId, "DOM.enable");
		await sendDebuggerCommand(tabId, "Runtime.enable");
	} catch (err) {
		console.warn("DOM/Runtime already enabled:", err);
	}

	switch (action) {
		case "clickBySelector":
			return await clickBySelector(tabId, payload.selector as string);
		case "clickByCoords":
			return await clickByCoords(
				tabId,
				payload.x as number,
				payload.y as number,
			);
		case "typeBySelector":
			return await typeBySelector(
				tabId,
				payload.selector as string,
				payload.value as string,
			);
		case "typeByCoords":
			return await typeByCoords(
				tabId,
				payload.x as number,
				payload.y as number,
				payload.value as string,
			);
		default:
			throw new Error(`Unknown script action: ${action}`);
	}
}

// Click element by CSS selector
async function clickBySelector(tabId: number, selector: string): Promise<void> {
	// Retry logic: wait for element to appear (max 5 seconds)
	const maxRetries = 10;
	const retryDelay = 500; // ms
	let node: { nodeId?: number } | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		const doc = await sendDebuggerCommand(tabId, "DOM.getDocument");
		node = (await sendDebuggerCommand(tabId, "DOM.querySelector", {
			nodeId: (doc as { root: { nodeId: number } }).root.nodeId,
			selector: selector,
		})) as { nodeId?: number };

		if (node?.nodeId) {
			break; // Element found!
		}

		// Wait before retrying
		if (attempt < maxRetries - 1) {
			await wait(retryDelay);
		}
	}

	if (!node?.nodeId) {
		throw new Error(`Element not found with selector: ${selector}`);
	}

	const boxModel = await sendDebuggerCommand(tabId, "DOM.getBoxModel", {
		nodeId: node.nodeId,
	});

	const content = (boxModel as { model: { content: number[] } }).model
		.content;
	const x = (content[0] + content[2]) / 2;
	const y = (content[1] + content[5]) / 2;

	await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
		type: "mousePressed",
		x: x,
		y: y,
		button: "left",
		clickCount: 1,
	});

	await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
		type: "mouseReleased",
		x: x,
		y: y,
		button: "left",
		clickCount: 1,
	});
}

// Click at specific coordinates
async function clickByCoords(
	tabId: number,
	x: number,
	y: number,
): Promise<void> {
	await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
		type: "mousePressed",
		x: x,
		y: y,
		button: "left",
		clickCount: 1,
	});

	await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
		type: "mouseReleased",
		x: x,
		y: y,
		button: "left",
		clickCount: 1,
	});
}

// Type text into element by selector
async function typeBySelector(
	tabId: number,
	selector: string,
	value: string,
): Promise<void> {
	// First click the element to focus
	await clickBySelector(tabId, selector);

	// Wait a bit for focus
	await wait(200);

	// Type each character
	for (const char of value) {
		await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
			type: "keyDown",
			text: char,
		});
		await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
			type: "keyUp",
			text: char,
		});
		await wait(50); // Small delay between keystrokes
	}
}

// Type text at coordinates
async function typeByCoords(
	tabId: number,
	x: number,
	y: number,
	value: string,
): Promise<void> {
	// First click to focus
	await clickByCoords(tabId, x, y);

	// Wait a bit for focus
	await wait(200);

	// Type each character
	for (const char of value) {
		await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
			type: "keyDown",
			text: char,
		});
		await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
			type: "keyUp",
			text: char,
		});
		await wait(50); // Small delay between keystrokes
	}
}
