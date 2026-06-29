// Background service worker for the extension
import { enhancedClick, enhancedSetValue } from "./enhancedActions";

// Track which tabs have debuggers attached
const attachedDebuggers = new Set<number>();

// Handle extension icon click to toggle the floating on-page panel
chrome.action.onClicked.addListener((tab) => {
	if (tab.id) {
		chrome.tabs
			.sendMessage(tab.id, { type: "TOGGLE_FLOATING_PANEL" })
			.catch(() => {
				// Content script may not be available on browser/internal pages.
			});
	}
});

// Clean up when debugger is detached (user closes tab, etc.)
chrome.debugger.onDetach.addListener((source, _reason) => {
	if (source.tabId) {
		attachedDebuggers.delete(source.tabId);
	}
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// Forward playground messages from content scripts to all extension pages (panel, popup, etc.)
	// Only forward if message came from a tab (content script), not from extension itself
	if (
		sender.tab &&
		(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" ||
			message.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT" ||
			message.type === "PLAYGROUND_CHAT_RESPONSE" ||
			message.type === "PLAYGROUND_CHAT_SUBMIT")
	) {
		const forwardedMessage = {
			...message,
			sourceTabId: sender.tab.id,
		};
		// Broadcast to all extension contexts (this won't trigger this listener again since sender.tab will be undefined)
		chrome.runtime
			.sendMessage(forwardedMessage)
			.then(() => {
				// Successfully broadcasted
			})
			.catch(() => {
				// Failed to broadcast
			});
		sendResponse({ success: true });
		return true;
	}

	// Forward script execution completion from extension (panel) back to all tabs (content scripts)
	// This allows the playground to receive execution status
	if (!sender.tab && message.type === "SCRIPT_EXECUTION_COMPLETE") {
		// Send to all tabs
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					chrome.tabs
						.sendMessage(tab.id, message)
						.then(() => {
							// Sent completion to tab
						})
						.catch(() => {
							// Ignore errors (tab might not have content script)
						});
				}
			});
		});

		sendResponse({ success: true });
		return true;
	}

	// Forward extension panel open/close signals to all tabs
	if (
		!sender.tab &&
		(message.type === "SMSS_EXTENSION_PANEL_OPENED" ||
			message.type === "SMSS_EXTENSION_PANEL_CLOSED")
	) {
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					chrome.tabs
						.sendMessage(tab.id, message)
						.then(() => {
							// Sent to tab
						})
						.catch(() => {
							// Could not send to tab
						});
				}
			});
		});

		sendResponse({ success: true });
		return true;
	}

	// Forward extension ping from content script to panel
	if (sender.tab && message.type === "SMSS_EXTENSION_PING") {
		// Broadcast to all extension contexts (panel)
		chrome.runtime
			.sendMessage(message)
			.then(() => {
				// Successfully broadcasted ping
			})
			.catch(() => {
				// Failed to broadcast (extension might be closed)
			});
		sendResponse({ success: true });
		return true;
	}

	// Forward extension pong from panel back to all tabs
	if (!sender.tab && message.type === "SMSS_EXTENSION_PONG") {
		// Send to all tabs
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					chrome.tabs
						.sendMessage(tab.id, message)
						.then(() => {
							// Sent pong to tab
						})
						.catch(() => {
							// Could not send to tab
						});
				}
			});
		});

		sendResponse({ success: true });
		return true;
	}

	// Forward field monitoring messages from panel to specific tab
	if (
		!sender.tab &&
		(message.type === "START_FIELD_MONITORING" ||
			message.type === "STOP_FIELD_MONITORING")
	) {
		if (message.tabId) {
			chrome.tabs
				.sendMessage(message.tabId, message)
				.then((response) => {
					sendResponse(response);
				})
				.catch((err) => {
					// Check if this is a bfcache error (tab moved to back/forward cache)
					const isBfcacheError =
						err.message &&
						(err.message.includes("back/forward cache") ||
							err.message.includes("message channel is closed"));

					if (isBfcacheError) {
						// This is expected when tab is in bfcache - not a critical error
						sendResponse({
							success: false,
							error: "Tab in back/forward cache",
						});
					} else {
						sendResponse({ success: false, error: err.message });
					}
				});
		} else {
			sendResponse({ success: false, error: "No tabId provided" });
		}

		return true; // Keep channel open for async response
	}

	// Forward field input detected from content script to panel
	if (sender.tab && message.type === "FIELD_INPUT_DETECTED") {
		// Broadcast to all extension contexts (panel, popup, etc.)
		chrome.runtime
			.sendMessage(message)
			.then(() => {
				// Field input notification sent to panel
			})
			.catch(() => {
				// Failed to notify panel
			});

		sendResponse({ success: true });
		return true;
	}

	if (!sender.tab && message.type === "UPDATE_FLOATING_PANEL_STATUS") {
		if (message.tabId) {
			chrome.tabs
				.sendMessage(message.tabId, message)
				.then(() => sendResponse({ success: true }))
				.catch((error) =>
					sendResponse({
						success: false,
						error: error.message,
					}),
				);
		} else {
			sendResponse({ success: false, error: "No tabId provided" });
		}
		return true;
	}

	switch (message.type) {
		case "GET_CURRENT_TAB":
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				sendResponse({ tabId: tabs[0]?.id });
			});
			return true; // Keep channel open for async response

		case "GET_HOST_TAB_ID":
			sendResponse({ tabId: sender.tab?.id });
			return true;

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

		case "HIGHLIGHT_FIELD":
			// Highlight a field on the webpage
			highlightElement(message.tabId, message.selector)
				.then(() => sendResponse({ success: true }))
				.catch((error) =>
					sendResponse({ success: false, error: error.message }),
				);
			return true;

		case "REMOVE_HIGHLIGHT":
			// Remove highlight from a field on the webpage
			removeHighlight(message.tabId, message.selector)
				.then(() => sendResponse({ success: true }))
				.catch((error) =>
					sendResponse({ success: false, error: error.message }),
				);
			return true;
		case "UPDATE_FIELD_VALUE":
			// Update field value on the webpage (real-time mirroring from panel)
			chrome.tabs
				.sendMessage(message.tabId, {
					type: "UPDATE_FIELD_VALUE",
					selector: message.selector,
					value: message.value,
				})
				.then((response) => sendResponse(response))
				.catch((error) =>
					sendResponse({
						success: false,
						error: error.message || "Failed to update field",
					}),
				);
			return true;
		default:
		// Unknown message type
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
	// Enable DOM and Runtime for enhanced actions
	try {
		await sendDebuggerCommand(tabId, "DOM.enable");
		await sendDebuggerCommand(tabId, "Runtime.enable");
	} catch {
		// DOM/Runtime already enabled
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

// Highlight an element on the page
async function highlightElement(
	tabId: number,
	selector: string,
): Promise<void> {
	const maxRetries = 5;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const result = (await sendDebuggerCommand(
				tabId,
				"Runtime.evaluate",
				{
					expression: `
				(function() {
					const element = document.querySelector(${JSON.stringify(selector)});
					if (!element) {
						return { success: false, error: 'Element not found' };
					}
					
					// Store original styles
					if (!element.dataset.originalBorder) {
						element.dataset.originalBorder = element.style.border || '';
						element.dataset.originalBoxShadow = element.style.boxShadow || '';
						element.dataset.originalBackgroundColor = element.style.backgroundColor || '';
					}
					
					// Apply highlight styles - subtle and professional
					element.style.border = '2px solid #667eea';
					element.style.boxShadow = '0 0 12px 0 rgba(102, 126, 234, 0.25), 0 4px 8px -2px rgba(102, 126, 234, 0.15)';
					element.style.backgroundColor = 'rgba(102, 126, 234, 0.03)';
					element.style.transition = 'all 0.2s ease-in-out';
					
					// Scroll into view
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
					
					return { success: true };
				})()
			`,
					returnByValue: true,
				},
			)) as { result?: { value?: { success: boolean; error?: string } } };

			if (result?.result?.value?.success) {
				// Wait a bit for the highlight to be visible
				await wait(300);
				return; // Success, exit function
			}
		} catch {
			// Retry below. Highlighting is helpful, but not critical to execution.
		}

		// Wait before retry (longer delay for first few attempts)
		if (attempt < maxRetries) {
			const delay = attempt <= 2 ? 800 : 500; // Longer initial delays
			await wait(delay);
		}
	}

	// All retries failed - don't throw
}

// Remove highlight from an element
async function removeHighlight(tabId: number, selector: string): Promise<void> {
	try {
		await sendDebuggerCommand(tabId, "Runtime.evaluate", {
			expression: `
				(function() {
					const element = document.querySelector(${JSON.stringify(selector)});
					if (!element) {
						return { success: false };
					}
					
					// Restore original styles
					if (element.dataset.originalBorder !== undefined) {
						element.style.border = element.dataset.originalBorder;
						element.style.boxShadow = element.dataset.originalBoxShadow;
						element.style.backgroundColor = element.dataset.originalBackgroundColor;
						
						// Clean up data attributes
						delete element.dataset.originalBorder;
						delete element.dataset.originalBoxShadow;
						delete element.dataset.originalBackgroundColor;
					}
					
					return { success: true };
				})()
			`,
			returnByValue: true,
		});
	} catch {
		// Don't throw - cleanup is not critical
	}
}

// Execute script-based actions (from Playwright JSON)
async function executeScriptAction(
	tabId: number,
	action: string,
	payload: Record<string, unknown>,
): Promise<unknown> {
	// Attach debugger if needed (will skip if already attached)
	await attachDebugger(tabId);

	// Enable DOM
	try {
		await sendDebuggerCommand(tabId, "DOM.enable");
		await sendDebuggerCommand(tabId, "Runtime.enable");
	} catch {
		// DOM/Runtime already enabled
	}

	switch (action) {
		case "checkElementReady":
			return await checkElementReady(tabId, payload.selector as string);
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

// Check if element is ready (exists in DOM)
async function checkElementReady(
	tabId: number,
	selector: string,
): Promise<{ isReady: boolean }> {
	try {
		const result = (await sendDebuggerCommand(tabId, "Runtime.evaluate", {
			expression: `
				(function() {
					const element = document.querySelector(${JSON.stringify(selector)});
					return { exists: !!element };
				})()
			`,
			returnByValue: true,
		})) as { result?: { value?: { exists: boolean } } };

		return { isReady: result?.result?.value?.exists || false };
	} catch (_error) {
		// Any error means element isn't ready
		return { isReady: false };
	}
}

// Click element by CSS selector
async function clickBySelector(tabId: number, selector: string): Promise<void> {
	const maxRetries = 3;
	let lastError: string | undefined;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// Use Runtime.evaluate to directly call .click() on the element
			const result = (await sendDebuggerCommand(
				tabId,
				"Runtime.evaluate",
				{
					expression: `
					(function() {
						const element = document.querySelector(${JSON.stringify(selector)});
						if (!element) {
							return { success: false, error: 'Element not found' };
						}
						
						// Scroll into view
						element.scrollIntoView({ behavior: 'auto', block: 'center' });
						
						// Click the element
						element.click();
						
						return { success: true };
					})()
				`,
					returnByValue: true,
					awaitPromise: false,
				},
			)) as {
				result?: { value?: { success: boolean; error?: string } };
			};

			if (result?.result?.value?.success) {
				// Wait for click to process
				await wait(150);
				return; // Success, exit function
			}

			lastError = result?.result?.value?.error || "Unknown error";
		} catch (error) {
			lastError =
				error instanceof Error ? error.message : "Unknown error";
		}

		// Wait before retry (but not after last attempt)
		if (attempt < maxRetries) {
			await wait(1500);
		}
	}

	// All retries failed
	throw new Error(
		`Failed to click element with selector "${selector}" after ${maxRetries} attempts. Last error: ${lastError}`,
	);
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
	const maxRetries = 3;
	let lastError: string | undefined;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// Use Runtime.evaluate to directly set value and trigger events
			const result = (await sendDebuggerCommand(
				tabId,
				"Runtime.evaluate",
				{
					expression: `
					(function() {
						const element = document.querySelector(${JSON.stringify(selector)});
						if (!element) {
							return { success: false, error: 'Element not found' };
						}
						
						// Scroll into view
						element.scrollIntoView({ behavior: 'auto', block: 'center' });
						
						// Focus the element
						element.focus();
						
						// Clear existing value
						element.value = '';
						
						// Set new value
						element.value = ${JSON.stringify(value)};
						
						// Create and dispatch native setter for React/Vue compatibility
						const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
						if (descriptor && descriptor.set) {
							descriptor.set.call(element, ${JSON.stringify(value)});
						}
						
						// Trigger all necessary events
						element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
						element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
						element.dispatchEvent(new Event('blur', { bubbles: true }));
						
						return { success: true };
					})()
				`,
					returnByValue: true,
				},
			)) as {
				result?: { value?: { success: boolean; error?: string } };
			};

			if (result?.result?.value?.success) {
				// Add small delay after typing to let the page react
				await wait(200);
				return; // Success, exit function
			}

			lastError = result?.result?.value?.error || "Unknown error";
		} catch (error) {
			lastError =
				error instanceof Error ? error.message : "Unknown error";
		}

		// Wait before retry (but not after last attempt)
		if (attempt < maxRetries) {
			await wait(1500);
		}
	}

	// All retries failed
	throw new Error(
		`Failed to type into element with selector "${selector}" after ${maxRetries} attempts. Last error: ${lastError}`,
	);
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
