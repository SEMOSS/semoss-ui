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
		message.script
			? {
					scriptName: message.script.name,
					hasContent: !!message.script.scriptContent,
				}
			: "N/A",
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

	// Forward script execution completion from extension (panel) back to all tabs (content scripts)
	// This allows the playground to receive execution status
	if (
		!sender.tab &&
		message.type === "SCRIPT_EXECUTION_COMPLETE"
	) {
		console.log(
			`[BACKGROUND] 🔄 Forwarding SCRIPT_EXECUTION_COMPLETE to all tabs`,
			{ success: message.success, message: message.message }
		);
		
		// Send to all tabs
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					chrome.tabs
						.sendMessage(tab.id, message)
						.then(() => {
							console.log(
								`[BACKGROUND] ✅ Sent completion to tab ${tab.id}`,
							);
						})
						.catch((err) => {
							// Ignore errors (tab might not have content script)
							console.log(
								`[BACKGROUND] ⚠️ Could not send to tab ${tab.id}:`,
								err.message,
							);
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
		console.log(`[BACKGROUND] 🔄 Forwarding ${message.type} to all tabs`);

		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab.id) {
					chrome.tabs
						.sendMessage(tab.id, message)
						.then(() => {
							console.log(`[BACKGROUND] ✅ Sent to tab ${tab.id}`);
						})
						.catch(() => {
							console.log(`[BACKGROUND] ⚠️ Could not send to tab ${tab.id}`);
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
		(message.type === "START_FIELD_MONITORING" || message.type === "STOP_FIELD_MONITORING")
	) {
		console.log(
			`[BACKGROUND] 🔄 Forwarding ${message.type} to tab ${message.tabId}`,
			{ selector: message.selector }
		);
		
		if (message.tabId) {
			chrome.tabs
				.sendMessage(message.tabId, message)
				.then((response) => {
					console.log(`[BACKGROUND] ✅ Field monitoring message forwarded:`, response);
					sendResponse(response);
				})
				.catch((err) => {
					// Check if this is a bfcache error (tab moved to back/forward cache)
					const isBfcacheError = err.message && (
						err.message.includes("back/forward cache") ||
						err.message.includes("message channel is closed")
					);
					
					if (isBfcacheError) {
						// This is expected when tab is in bfcache - not a critical error
						console.log(`[BACKGROUND] ⚠️ Tab ${message.tabId} in bfcache, field monitoring unavailable`);
						sendResponse({ success: false, error: "Tab in back/forward cache" });
					} else {
						console.error(`[BACKGROUND] ❌ Failed to forward field monitoring:`, err);
						sendResponse({ success: false, error: err.message });
					}
				});
		} else {
			sendResponse({ success: false, error: "No tabId provided" });
		}
		
		return true; // Keep channel open for async response
	}

	// Forward field input detected from content script to panel
	if (
		sender.tab &&
		message.type === "FIELD_INPUT_DETECTED"
	) {
		console.log(
			`[BACKGROUND] 🔄 Forwarding FIELD_INPUT_DETECTED from tab ${sender.tab.id} to panel`,
			{ selector: message.selector, isPassword: message.isPassword }
		);
		
		// Broadcast to all extension contexts (panel, popup, etc.)
		chrome.runtime
			.sendMessage(message)
			.then(() => {
				console.log(`[BACKGROUND] ✅ Field input notification sent to panel`);
			})
			.catch((err) => {
				console.error(`[BACKGROUND] ❌ Failed to notify panel:`, err);
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

// Highlight an element on the page
async function highlightElement(
	tabId: number,
	selector: string,
): Promise<void> {
	const maxRetries = 5;
	let lastError: string | undefined;

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
						element.dataset.originalOutline = element.style.outline || '';
						element.dataset.originalBackgroundColor = element.style.backgroundColor || '';
					}
					
					// Apply highlight styles
					element.style.border = '3px solid #007bff';
					element.style.boxShadow = '0 0 10px 2px rgba(0, 123, 255, 0.6)';
					element.style.outline = '2px solid #0056b3';
					element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
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

			lastError = result?.result?.value?.error || "Unknown error";
			console.log(
				`Highlight attempt ${attempt}/${maxRetries} failed: ${lastError}`,
			);
		} catch (error) {
			lastError =
				error instanceof Error ? error.message : "Unknown error";
			console.log(
				`Highlight attempt ${attempt}/${maxRetries} failed: ${lastError}`,
			);
		}

		// Wait before retry (longer delay for first few attempts)
		if (attempt < maxRetries) {
			const delay = attempt <= 2 ? 800 : 500; // Longer initial delays
			await wait(delay);
		}
	}

	// All retries failed - log but don't throw
	console.warn(
		`Failed to highlight element with selector "${selector}" after ${maxRetries} attempts. Last error: ${lastError}`,
	);
}

// Remove highlight from an element
async function removeHighlight(
	tabId: number,
	selector: string,
): Promise<void> {
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
						element.style.outline = element.dataset.originalOutline;
						element.style.backgroundColor = element.dataset.originalBackgroundColor;
						
						// Clean up data attributes
						delete element.dataset.originalBorder;
						delete element.dataset.originalBoxShadow;
						delete element.dataset.originalOutline;
						delete element.dataset.originalBackgroundColor;
					}
					
					return { success: true };
				})()
			`,
			returnByValue: true,
		});
	} catch (error) {
		console.warn("Failed to remove highlight:", error);
		// Don't throw - cleanup is not critical
	}
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
				console.log(
					`Click attempt ${attempt}/${maxRetries} failed: ${lastError}`,
				);
			} catch (error) {
				lastError =
					error instanceof Error ? error.message : "Unknown error";
				console.log(
					`Click attempt ${attempt}/${maxRetries} failed: ${lastError}`,
				);
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
				console.log(
					`Type attempt ${attempt}/${maxRetries} failed: ${lastError}`,
				);
			} catch (error) {
				lastError =
					error instanceof Error ? error.message : "Unknown error";
				console.log(
					`Type attempt ${attempt}/${maxRetries} failed: ${lastError}`,
				);
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
