// Background service worker for the extension
import { enhancedClick, enhancedSetValue } from "./enhancedActions";

console.log("Workshop Automation - Background script loaded");

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	console.log("Background received message:", message);

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

		default:
			console.warn("Unknown message type:", message.type);
	}
});

// Attach Chrome debugger to a tab
async function attachDebugger(tabId: number): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.debugger.attach({ tabId }, "1.3", () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				console.log(`Debugger attached to tab ${tabId}`);
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
