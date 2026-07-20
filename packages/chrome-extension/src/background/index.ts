// Background service worker for the extension

import type {
	EventMessage,
	RecordedAction,
	RecordedActionType,
	RecorderState,
} from "../recorder/types";
import { escapePixelString, SemossClient } from "../services/semossClient";
import { enhancedClick, enhancedSetValue } from "./enhancedActions";

const AUTOMATION_RUN_STATE_STORAGE_KEY = "semoss-automation-run-state";

type AutomationInputRequest = {
	id: string;
	prompt: string;
	isPassword: boolean;
	selector?: string;
	targetTabId: number;
};

type AutomationRunState = {
	active: boolean;
	status: "idle" | "running" | "needs-input" | "complete" | "failed";
	message?: string;
	history: string[];
	pendingInput?: AutomationInputRequest;
	updatedAt: number;
};

// Track which tabs have debuggers attached
const attachedDebuggers = new Set<number>();
let automationRunState: AutomationRunState = {
	active: false,
	status: "idle",
	history: [],
	updatedAt: Date.now(),
};

chrome.storage.local
	.get(AUTOMATION_RUN_STATE_STORAGE_KEY)
	.then((stored) => {
		const value = stored[AUTOMATION_RUN_STATE_STORAGE_KEY];
		if (value?.updatedAt) automationRunState = value;
	})
	.catch(() => {
		// Shared run state can start fresh if storage is unavailable.
	});

function persistAndBroadcastAutomationRunState() {
	chrome.storage.local
		.set({ [AUTOMATION_RUN_STATE_STORAGE_KEY]: automationRunState })
		.catch(() => {
			// Runtime broadcasts still work if persistence is unavailable.
		});
	chrome.runtime
		.sendMessage({
			type: "AUTOMATION_RUN_STATE_UPDATED",
			state: automationRunState,
		})
		.catch(() => {
			// There may be no visible panel listening yet.
		});
}

function updateAutomationRunState(state: Partial<AutomationRunState>) {
	automationRunState = {
		...automationRunState,
		...state,
		history: state.history ?? automationRunState.history,
		updatedAt: Date.now(),
	};
	persistAndBroadcastAutomationRunState();
}

function resetAutomationRunState() {
	automationRunState = {
		active: false,
		status: "idle",
		history: [],
		updatedAt: Date.now(),
	};
	persistAndBroadcastAutomationRunState();
}

function clearPendingAutomationInput(requestId: string): boolean {
	if (automationRunState.pendingInput?.id !== requestId) return false;

	const { pendingInput: _pendingInput, ...runState } = automationRunState;
	automationRunState = {
		...runState,
		active: true,
		status: "running",
		message: "Resuming automation",
		updatedAt: Date.now(),
	};
	persistAndBroadcastAutomationRunState();
	return true;
}

// Track the tab that initiated script execution (to send completion back to it)
let executionSourceTabId: number | null = null;

// Track panel state for content script queries
let _isPanelOpen = false;

// Recording state
let recordingState: RecorderState = {
	isRecording: false,
	isPaused: false,
	isStopped: false,
	actionsList: [],
	actionCounter: 0,
};

// Track initial URLs of ALL tabs when recording starts (to filter out initial navigation events)
const initialRecordingUrls = new Set<string>();

// Track last recorded navigation URL (to prevent duplicates)
let lastRecordedNavigationUrl: string | null = null;

// Track last recorded TYPE action per selector (to prevent duplicates)
const lastTypeActions = new Map<string, string>(); // selector -> value

// Track last click coordinates on input fields (to merge with TYPE actions)
const lastInputClickCoords = new Map<string, { x: number; y: number }>(); // selector -> coords

// Track last submit button click timestamp (to filter out redundant form submit events)
let lastSubmitButtonClickTime = 0;

// Pending blur events queue (to ensure proper ordering with clicks)
// Blur events are delayed slightly to allow them to be processed before clicks that caused them
let pendingBlurEvent: {
	event: EventMessage;
	tabId?: number;
	timeout: number;
} | null = null;

// Handle extension icon click to toggle the floating on-page panel.
chrome.action.onClicked.addListener((tab) => {
	if (tab.id) {
		chrome.tabs
			.sendMessage(tab.id, { type: "TOGGLE_FLOATING_PANEL" })
			.catch(() => {
				// Content scripts are unavailable on browser/internal pages.
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
	// Debug: Log all messages to see sender info
	console.log(
		"[BACKGROUND] 📨 Received:",
		message.type,
		"hasTab:",
		!!sender.tab,
	);

	// Store source tab for execution messages (needed for completion routing)
	// Content script's sendMessage already broadcasts to all extension contexts, no need to re-broadcast
	if (
		sender.tab?.id &&
		(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" ||
			message.type === "EXECUTE_PLAYWRIGHT_SCRIPT")
	) {
		executionSourceTabId = sender.tab.id;
		console.log(
			"[BACKGROUND] 📍 Stored execution source tab:",
			executionSourceTabId,
		);
		sendResponse({ success: true });
		return true;
	}

	// Forward other playground messages if needed (these may require broadcasting)
	if (
		sender.tab &&
		(message.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT" ||
			message.type === "PLAYGROUND_CHAT_RESPONSE" ||
			message.type === "PLAYGROUND_CHAT_SUBMIT")
	) {
		// Broadcast to all extension contexts
		chrome.runtime
			.sendMessage(message)
			.then(() => {
				// Successfully broadcasted
			})
			.catch(() => {
				// Failed to broadcast
			});
		sendResponse({ success: true });
		return true;
	}

	// Forward script execution completion from extension (panel) back to the originating tab ONLY
	// This prevents infinite loops caused by sending to all tabs (including newly opened ones)
	if (!sender.tab && message.type === "SCRIPT_EXECUTION_COMPLETE") {
		// Send ONLY to the tab that initiated execution, not all tabs
		if (executionSourceTabId) {
			console.log(
				"[BACKGROUND] 📤 Sending completion to source tab:",
				executionSourceTabId,
			);
			chrome.tabs
				.sendMessage(executionSourceTabId, message)
				.then(() => {
					console.log(
						"[BACKGROUND] ✅ Sent completion to source tab:",
						executionSourceTabId,
					);
					executionSourceTabId = null; // Clear after sending
				})
				.catch((error) => {
					console.error(
						"[BACKGROUND] ❌ Failed to send completion:",
						error,
					);
					executionSourceTabId = null;
				});
		} else {
			console.warn(
				"[BACKGROUND] ⚠️ No source tab stored, cannot send completion",
			);
		}

		sendResponse({ success: true });
		return true;
	}

	// Forward extension panel open/close signals to all tabs
	if (
		!sender.tab &&
		(message.type === "SMSS_EXTENSION_PANEL_OPENED" ||
			message.type === "SMSS_EXTENSION_PANEL_CLOSED")
	) {
		// Track panel state
		if (message.type === "SMSS_EXTENSION_PANEL_OPENED") {
			_isPanelOpen = true;
			console.log("[BACKGROUND] 📢 Panel opened, state updated");
		} else {
			_isPanelOpen = false;
			console.log("[BACKGROUND] 📢 Panel closed, state updated");
		}

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

	// Handle panel state check from content script
	// Ping the panel directly to verify it's actually alive
	if (message.type === "CHECK_PANEL_STATE") {
		console.log(
			"[BACKGROUND] 🔍 Panel state check requested, pinging panel...",
		);

		// Try to send a message to the panel to see if it responds
		chrome.runtime.sendMessage({ type: "PANEL_PING_CHECK" }, (response) => {
			const actuallyOpen = !!response && response.alive === true;
			console.log(
				"[BACKGROUND] Panel ping response:",
				actuallyOpen ? "Panel is alive" : "Panel not responding",
			);

			// Update cached state based on actual response
			_isPanelOpen = actuallyOpen;

			sendResponse({ isPanelOpen: actuallyOpen });
		});

		return true; // Async response
	}

	// Handle save recording to project - Direct HTTP call to Semoss backend
	if (message.type === "SAVE_RECORDING_TO_PROJECT") {
		console.log("[BACKGROUND] 💾 ========== SAVE DEBUG START ==========");
		console.log("[BACKGROUND] Payload:", message.payload);

		interface SaveRecordingResponse {
			success?: boolean;
			fileName?: string;
			error?: string;
			message?: string;
		}

		const { projectId, name, jsonPayload, title, description, intent } =
			message.payload;

		console.log("[BACKGROUND] Project ID:", projectId);
		console.log("[BACKGROUND] Name:", name);
		console.log("[BACKGROUND] JSON length:", jsonPayload?.length || 0);

		// Build the pixel command
		const pixelCommand = `SaveRecordingFromExtension(project=["${escapePixelString(projectId)}"], name=["${escapePixelString(name)}"], jsonPayload=["${escapePixelString(jsonPayload)}"]${title ? `, title=["${escapePixelString(title)}"]` : ""}${description ? `, description=["${escapePixelString(description)}"]` : ""}${intent ? `, intent=["${escapePixelString(intent)}"]` : ""});`;

		console.log("[BACKGROUND] Pixel command length:", pixelCommand.length);
		console.log(
			"[BACKGROUND] Pixel preview:",
			`${pixelCommand.substring(0, 200)}...`,
		);

		(async () => {
			try {
				const data =
					await SemossClient.runPixel<SaveRecordingResponse>(
						pixelCommand,
					);
				console.log("[BACKGROUND] ✅ SUCCESS! Data:", data);

				const success = data?.success || false;
				const fileName = data?.fileName;
				const error = data?.error || data?.message;

				console.log("[BACKGROUND] Parsed:", {
					success,
					fileName,
					error,
				});

				if (success) {
					console.log("[BACKGROUND] ✅ Sending success");
					sendResponse({ success: true, fileName: fileName });
				} else {
					console.error("[BACKGROUND] ❌ Sending failure:", error);
					sendResponse({
						success: false,
						error: error || "Failed to save recording",
					});
				}

				console.log(
					"[BACKGROUND] ========== SAVE DEBUG END (SUCCESS) ==========",
				);
			} catch (error: unknown) {
				const err =
					error instanceof Error ? error : new Error(String(error));
				console.error("[BACKGROUND] ❌ Save failed");
				console.error(
					"[BACKGROUND] Error type:",
					err?.constructor?.name,
				);
				console.error("[BACKGROUND] Error message:", err?.message);
				console.error("[BACKGROUND] Full error:", error);
				sendResponse({
					success: false,
					error: err.message || "Failed to save recording",
				});
				console.log(
					"[BACKGROUND] ========== SAVE DEBUG END (FAILURE) ==========",
				);
			}
		})();

		return true; // Async response
	}

	// Handle recording-related messages
	if (message.type === "EVENT") {
		_handleRecordingEvent(message.data as EventMessage, sender.tab?.id);
		sendResponse({ success: true });
		return true;
	}

	if (message.type === "START_RECORDING") {
		_handleStartRecording(message.tabId || sender.tab?.id);
		sendResponse({ success: true });
		return true;
	}

	if (message.type === "STOP_RECORDING") {
		_handleStopRecording();
		sendResponse({ success: true });
		return true;
	}

	if (message.type === "PAUSE_RECORDING") {
		_handlePauseRecording();
		sendResponse({ success: true });
		return true;
	}

	if (message.type === "RESUME_RECORDING") {
		_handleResumeRecording();
		sendResponse({ success: true });
		return true;
	}

	if (message.type === "GET_RECORDING_STATE") {
		sendResponse({ success: true, state: recordingState });
		return true;
	}

	if (message.type === "DOWNLOAD_SCRIPT") {
		// This will be handled by the panel UI
		sendResponse({ success: true, actions: recordingState.actionsList });
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

	switch (message.type) {
		case "GET_AUTOMATION_RUN_STATE":
			sendResponse({ state: automationRunState });
			return true;

		case "UPDATE_AUTOMATION_RUN_STATE":
			updateAutomationRunState(message.state || {});
			sendResponse({ success: true, state: automationRunState });
			return true;

		case "RESET_AUTOMATION_RUN_STATE":
			resetAutomationRunState();
			sendResponse({ success: true, state: automationRunState });
			return true;

		case "REGISTER_AUTOMATION_INPUT_REQUEST": {
			const request = message.request as
				| AutomationInputRequest
				| undefined;
			if (
				!request?.id ||
				!request.prompt ||
				typeof request.targetTabId !== "number"
			) {
				sendResponse({
					success: false,
					error: "Invalid automation input request",
				});
				return true;
			}

			updateAutomationRunState({
				active: true,
				status: "needs-input",
				message: request.prompt,
				pendingInput: request,
			});
			sendResponse({ success: true });
			return true;
		}

		case "SUBMIT_AUTOMATION_INPUT": {
			if (
				typeof message.requestId !== "string" ||
				typeof message.value !== "string" ||
				!clearPendingAutomationInput(message.requestId)
			) {
				sendResponse({
					success: false,
					error: "Automation input request is no longer active",
				});
				return true;
			}

			// Credential values stay transient: they are never written to storage.
			chrome.runtime
				.sendMessage({
					type: "AUTOMATION_INPUT_SUBMITTED",
					requestId: message.requestId,
					value: message.value,
				})
				.catch(() => {
					// The owning panel may have closed before input was submitted.
				});
			sendResponse({ success: true });
			return true;
		}

		case "RESOLVE_AUTOMATION_INPUT_REQUEST":
			if (typeof message.requestId === "string") {
				clearPendingAutomationInput(message.requestId);
			}
			sendResponse({ success: true });
			return true;

		case "GET_HOST_TAB_ID":
			sendResponse({ tabId: sender.tab?.id });
			return true;

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
			_executeScriptAction(message.tabId, message.action, message.payload)
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
			_removeHighlight(message.tabId, message.selector)
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
	let _lastError: string | undefined;

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

			_lastError = result?.result?.value?.error || "Unknown error";
		} catch (error) {
			_lastError =
				error instanceof Error ? error.message : "Unknown error";
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
async function _removeHighlight(
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
async function _executeScriptAction(
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

// ============================================================================
// Recording Functions
// ============================================================================

/**
 * Handle incoming recording event from content script
 */
function _handleRecordingEvent(
	eventMessage: EventMessage,
	tabId?: number,
): void {
	// Skip if not recording or paused
	if (!recordingState.isRecording || recordingState.isPaused) {
		return;
	}

	console.log(
		"[BACKGROUND] 📹 Recording event:",
		eventMessage.action,
		eventMessage.tagName,
	);

	// ORDERING FIX: Process any pending blur event before handling non-blur events
	// This ensures blur events (text input completion) are recorded before the events that caused them (like button clicks)
	if (eventMessage.action !== "blur" && pendingBlurEvent) {
		console.log(
			"[BACKGROUND] ⏩ Flushing pending blur event before processing",
			eventMessage.action,
		);
		const pending = pendingBlurEvent;
		pendingBlurEvent = null;
		clearTimeout(pending.timeout);
		processBlurEvent(pending.event, pending.tabId);
	}

	// ISSUE 1 FIX: Filter out initial navigation events AND deduplicate navigations
	if (eventMessage.tagName === "NAVIGATE" || eventMessage.action === "load") {
		const currentUrl =
			eventMessage.url ||
			(typeof eventMessage.value === "string" ? eventMessage.value : "");

		// Skip if this URL was already loaded when recording started
		if (initialRecordingUrls.has(currentUrl)) {
			console.log(
				"[BACKGROUND] ⏭️ Skipping initial navigation event (tab was already open):",
				currentUrl,
			);
			return;
		}

		// Skip duplicate navigation URLs
		if (currentUrl === lastRecordedNavigationUrl) {
			console.log(
				"[BACKGROUND] ⏭️ Skipping duplicate navigation event:",
				currentUrl,
			);
			return;
		}

		// Record the navigation and update last URL
		const action = convertEventToAction(eventMessage, tabId);
		recordingState.actionsList.push(action);
		recordingState.actionCounter++;
		lastRecordedNavigationUrl = currentUrl;
		saveRecordingState();
		broadcastStateUpdate();
		console.log("[BACKGROUND] 🌐 Recorded NAVIGATE:", currentUrl);
		return;
	}

	// ISSUE 2 FIX: Handle blur events for text input (captures final value when user leaves field)
	// Queue blur events with a small delay to ensure proper ordering with subsequent events
	if (eventMessage.action === "blur") {
		// Only record blur for TEXT-BASED input fields (not buttons, checkboxes, etc.)
		if (eventMessage.tagName === "INPUT") {
			const inputType =
				eventMessage.eventTypeAttr?.toLowerCase() || "text";

			// Only process text-based input types
			const textInputTypes = [
				"text",
				"password",
				"email",
				"tel",
				"url",
				"search",
				"number",
			];
			if (!textInputTypes.includes(inputType)) {
				console.log(
					"[BACKGROUND] ⏭️ Skipping blur for non-text input type:",
					inputType,
				);
				return;
			}
		} else if (eventMessage.tagName !== "TEXTAREA") {
			// Only INPUT (text-based) and TEXTAREA are valid for TYPE recording
			console.log(
				"[BACKGROUND] ⏭️ Skipping blur for non-input element:",
				eventMessage.tagName,
			);
			return;
		}

		const value =
			typeof eventMessage.value === "string" ? eventMessage.value : "";

		// Skip if empty value
		if (!value || value.trim() === "") {
			console.log("[BACKGROUND] ⏭️ Skipping blur event with empty value");
			return;
		}

		// Clear any existing pending blur and queue this one
		if (pendingBlurEvent) {
			clearTimeout(pendingBlurEvent.timeout);
		}

		// Queue blur event with 50ms delay to allow reordering before clicks
		console.log(
			"[BACKGROUND] ⏸️ Queueing blur event (50ms delay for ordering)",
		);
		const timeout = setTimeout(() => {
			if (pendingBlurEvent) {
				console.log(
					"[BACKGROUND] ⏰ Processing queued blur event (timeout)",
				);
				processBlurEvent(
					pendingBlurEvent.event,
					pendingBlurEvent.tabId,
				);
				pendingBlurEvent = null;
			}
		}, 50) as unknown as number;

		pendingBlurEvent = { event: eventMessage, tabId, timeout };
		return;
	}

	// Skip keyup and change events - we use blur instead
	if (eventMessage.action === "keyup" || eventMessage.action === "change") {
		console.log(
			"[BACKGROUND] ⏭️ Skipping keyup/change event (using blur instead)",
		);
		return;
	}

	// FORM SUBMIT FIX: Skip form submit events that occur right after submit button clicks
	// Forms can't be "clicked" - they're submitted via buttons. Recording both causes execution errors.
	if (eventMessage.action === "submit" && eventMessage.tagName === "FORM") {
		const timeSinceLastSubmitClick = Date.now() - lastSubmitButtonClickTime;
		if (timeSinceLastSubmitClick < 100) {
			console.log(
				"[BACKGROUND] ⏭️ Skipping redundant form submit event (submit button just clicked)",
			);
			return;
		}
	}

	// Track submit button clicks (to filter out subsequent form submit events)
	if (
		(eventMessage.action === "click" ||
			eventMessage.action === "dblclick") &&
		eventMessage.tagName === "INPUT"
	) {
		const inputType = eventMessage.eventTypeAttr?.toLowerCase() || "";
		if (inputType === "submit" || inputType === "button") {
			lastSubmitButtonClickTime = Date.now();
			console.log(
				"[BACKGROUND] 📝 Recorded submit button click time for form submit filtering",
			);
		}
	}

	// Store coords from CLICK events on input fields for merging with TYPE action
	// But still record the CLICK event
	if (
		(eventMessage.action === "click" ||
			eventMessage.action === "dblclick") &&
		eventMessage.tagName === "INPUT"
	) {
		const inputType = eventMessage.eventTypeAttr?.toLowerCase() || "text";
		const textInputTypes = [
			"text",
			"password",
			"email",
			"tel",
			"url",
			"search",
			"number",
		];

		if (textInputTypes.includes(inputType)) {
			// Store coords for later merging with TYPE action
			if (
				eventMessage.clientX !== undefined &&
				eventMessage.clientY !== undefined
			) {
				const selector = eventMessage.selector?.join("|") || "";
				lastInputClickCoords.set(selector, {
					x: eventMessage.clientX,
					y: eventMessage.clientY,
				});
				console.log(
					"[BACKGROUND] 📍 Stored click coords for input field, will also merge with TYPE",
				);
			}
			// Continue to record the CLICK action below (don't return)
		}
	}

	// For all other events (click, dblclick, submit, etc.), record immediately
	const action = convertEventToAction(eventMessage, tabId);
	recordingState.actionsList.push(action);
	recordingState.actionCounter++;
	saveRecordingState();
	broadcastStateUpdate();
}

/**
 * Process a blur event and record TYPE action
 */
function processBlurEvent(eventMessage: EventMessage, tabId?: number): void {
	const value =
		typeof eventMessage.value === "string" ? eventMessage.value : "";
	const selector = eventMessage.selector?.join("|") || "";

	// Skip if this exact value was already recorded for this selector (deduplication)
	const lastRecorded = lastTypeActions.get(selector);
	if (lastRecorded === value) {
		console.log("[BACKGROUND] ⏭️ Skipping duplicate TYPE:", value);
		return;
	}

	// Record the TYPE action
	const action = convertEventToAction(eventMessage, tabId);
	action.type = "TYPE"; // Ensure it's marked as TYPE
	action.text = value;

	// Merge click coordinates if available (from earlier click on input field)
	const storedCoords = lastInputClickCoords.get(selector);
	if (storedCoords) {
		action.coords = storedCoords;
		lastInputClickCoords.delete(selector); // Clean up after use
		console.log("[BACKGROUND] 📍 Merged click coords with TYPE action");
	}

	recordingState.actionsList.push(action);
	recordingState.actionCounter++;

	// Remember this action to prevent duplicates
	lastTypeActions.set(selector, value);

	saveRecordingState();
	broadcastStateUpdate();
	console.log("[BACKGROUND] ⌨️ Recorded TYPE action (on blur):", value);
}

/**
 * Convert EventMessage from content script to RecordedAction
 */
function convertEventToAction(
	event: EventMessage,
	tabId?: number,
): RecordedAction {
	const action: RecordedAction = {
		type: mapEventTypeToActionType(event),
		selector: event.selector,
		timestamp: event.timeStamp,
		tabId: tabId,
		eventData: {
			tagName: event.tagName,
			eventType: event.action,
			eventTypeAttr: event.eventTypeAttr, // Input type or element type
			keyCode: event.keyCode,
			href: event.href,
			checked: event.checked,
		},
	};

	// Handle navigation
	if (event.tagName === "NAVIGATE" || event.action === "load") {
		action.type = "NAVIGATE";
		action.url =
			event.url || (typeof event.value === "string" ? event.value : "");
		action.waitAfterMs = 1000; // Default wait after navigation
	}

	// Handle clicks
	if (event.action === "click" || event.action === "dblclick") {
		if (event.clientX !== undefined && event.clientY !== undefined) {
			action.coords = {
				x: event.clientX,
				y: event.clientY,
			};
		}
		action.waitAfterMs = 200; // Small wait after click
	}

	// Handle text input
	if (event.action === "change" || event.action === "keyup") {
		if (event.value && typeof event.value === "string") {
			action.text = event.value;
			action.type = "TYPE";
		}
	}

	// Handle select/checkbox/radio
	if (event.tagName === "SELECT" || event.eventTypeAttr === "select") {
		action.type = "SELECT";
		action.text =
			typeof event.value === "string"
				? event.value
				: JSON.stringify(event.value);
	}

	if (event.eventTypeAttr === "checkbox") {
		action.type = event.checked ? "CHECK" : "UNCHECK";
	}

	// Handle submit - convert to CLICK (backend doesn't support SUBMIT type)
	if (event.action === "submit") {
		action.type = "CLICK";
		action.waitAfterMs = 1000;
	}

	// Build parameters for Playwright format compatibility
	action.parameters = [];

	if (action.selector && action.selector.length > 0) {
		action.parameters.push({
			name: "selector",
			value: action.selector,
			type: "selector",
		});
	}

	if (action.text) {
		action.parameters.push({
			name: "value",
			value: action.text,
			type: "string",
		});
	}

	if (action.coords) {
		action.parameters.push({
			name: "coords",
			value: action.coords,
			type: "object",
		});
	}

	return action;
}

/**
 * Map DOM event type to RecordedActionType
 */
function mapEventTypeToActionType(event: EventMessage): RecordedActionType {
	switch (event.action) {
		case "click":
			return "CLICK";
		case "dblclick":
			return "DBLCLICK";
		case "change":
		case "keyup":
			return "TYPE";
		case "select":
			return "SELECT";
		case "submit":
			return "CLICK";
		case "load":
			return "NAVIGATE";
		default:
			return "CLICK";
	}
}

/**
 * Start recording
 */
async function _handleStartRecording(tabId?: number): Promise<void> {
	console.log("[BACKGROUND] 🎬 Starting recording on tab:", tabId);

	// Clear previous recording tabs and tracking maps
	recordingTabs.clear();
	lastTypeActions.clear();
	lastRecordedNavigationUrl = null;
	lastSubmitButtonClickTime = 0;
	initialRecordingUrls.clear();

	// Collect URLs of ALL currently open tabs to filter out initial navigations
	try {
		const allTabs = await chrome.tabs.query({});
		for (const tab of allTabs) {
			if (
				tab.url &&
				!tab.url.startsWith("chrome://") &&
				!tab.url.startsWith("chrome-extension://")
			) {
				initialRecordingUrls.add(tab.url);
			}
		}
		console.log(
			"[BACKGROUND] 🏷️ Stored initial URLs for",
			initialRecordingUrls.size,
			"tabs to filter out initial navigations",
		);
	} catch (error) {
		console.error("[BACKGROUND] Failed to collect initial URLs:", error);
	}

	recordingState = {
		isRecording: true,
		isPaused: false,
		isStopped: false,
		actionsList: [],
		actionCounter: 0,
		startedAt: Date.now(),
		currentTabId: tabId,
	};

	await saveRecordingState();

	// Track the starting tab
	if (tabId) {
		recordingTabs.add(tabId);
	}

	// Inject content script and notify ALL tabs to start recording
	chrome.tabs.query({}).then(async (tabs) => {
		console.log(
			`[BACKGROUND] Injecting content script and notifying ${tabs.length} tabs`,
		);

		for (const tab of tabs) {
			if (
				tab.id &&
				tab.url &&
				!tab.url.startsWith("chrome://") &&
				!tab.url.startsWith("chrome-extension://")
			) {
				recordingTabs.add(tab.id);

				try {
					// Try to inject content script (will fail if already injected, that's ok)
					await chrome.scripting
						.executeScript({
							target: { tabId: tab.id },
							files: ["src/content/index.ts"],
						})
						.catch(() => {
							// Already injected or not allowed, that's fine
						});

					// Small delay to ensure content script is ready
					await new Promise((resolve) => setTimeout(resolve, 100));

					// Now send START_RECORDING message
					await chrome.tabs
						.sendMessage(tab.id, {
							type: "START_RECORDING",
							timestamp: Date.now(),
						})
						.catch((_err) => {
							console.log(
								`[BACKGROUND] Tab ${tab.id} (${tab.url}) not ready for recording`,
							);
						});
				} catch (error) {
					console.log(
						`[BACKGROUND] Could not inject into tab ${tab.id}:`,
						error,
					);
				}
			}
		}
	});

	broadcastStateUpdate();
}

/**
 * Stop recording
 */
async function _handleStopRecording(): Promise<void> {
	console.log("[BACKGROUND] ⏹️ Stopping recording");

	// Flush any pending blur event before stopping
	if (pendingBlurEvent) {
		console.log("[BACKGROUND] ⏩ Flushing pending blur event on stop");
		const pending = pendingBlurEvent;
		pendingBlurEvent = null;
		clearTimeout(pending.timeout);
		processBlurEvent(pending.event, pending.tabId);
	}

	// Clear tracking maps
	lastTypeActions.clear();
	lastInputClickCoords.clear();

	recordingState.isRecording = false;
	recordingState.isPaused = false;
	recordingState.isStopped = true;
	initialRecordingUrls.clear(); // Clear initial URLs
	lastRecordedNavigationUrl = null; // Clear last navigation URL

	await saveRecordingState();

	// Notify all tabs that were part of recording to cleanup EventRecorder
	if (recordingTabs.size > 0) {
		recordingTabs.forEach((tabId) => {
			chrome.tabs
				.sendMessage(tabId, { type: "STOP_RECORDING" })
				.catch((err) => {
					console.error(
						"[BACKGROUND] Failed to notify tab:",
						tabId,
						err,
					);
				});
		});
		// Clear tracking set
		recordingTabs.clear();
	} else if (recordingState.currentTabId) {
		// Fallback: notify the current tab
		chrome.tabs
			.sendMessage(recordingState.currentTabId, {
				type: "STOP_RECORDING",
			})
			.catch((err) => {
				console.error(
					"[BACKGROUND] Failed to notify content script:",
					err,
				);
			});
	}

	broadcastStateUpdate();
}

/**
 * Pause recording
 */
async function _handlePauseRecording(): Promise<void> {
	console.log("[BACKGROUND] ⏸️ Pausing recording");

	recordingState.isPaused = true;
	await saveRecordingState();

	if (recordingState.currentTabId) {
		chrome.tabs
			.sendMessage(recordingState.currentTabId, {
				type: "PAUSE_RECORDING",
			})
			.catch(() => {});
	}

	broadcastStateUpdate();
}

/**
 * Resume recording
 */
async function _handleResumeRecording(): Promise<void> {
	console.log("[BACKGROUND] ▶️ Resuming recording");

	recordingState.isPaused = false;
	await saveRecordingState();

	if (recordingState.currentTabId) {
		chrome.tabs
			.sendMessage(recordingState.currentTabId, {
				type: "RESUME_RECORDING",
			})
			.catch(() => {});
	}

	broadcastStateUpdate();
}

/**
 * Save recording state to Chrome storage
 */
async function saveRecordingState(): Promise<void> {
	try {
		await chrome.storage.local.set({
			isRecording: recordingState.isRecording,
			isPaused: recordingState.isPaused,
			isStopped: recordingState.isStopped,
			actionsList: recordingState.actionsList,
			actionCounter: recordingState.actionCounter,
			startedAt: recordingState.startedAt,
			currentTabId: recordingState.currentTabId,
		});
	} catch (error) {
		console.error("[BACKGROUND] Failed to save recording state:", error);
	}
}

/**
 * Load recording state from Chrome storage
 */
async function loadRecordingState(): Promise<void> {
	try {
		const data = await chrome.storage.local.get([
			"isRecording",
			"isPaused",
			"isStopped",
			"actionsList",
			"actionCounter",
			"startedAt",
			"currentTabId",
		]);

		if (data) {
			recordingState = {
				isRecording: data.isRecording || false,
				isPaused: data.isPaused || false,
				isStopped: data.isStopped || false,
				actionsList: data.actionsList || [],
				actionCounter: data.actionCounter || 0,
				startedAt: data.startedAt,
				currentTabId: data.currentTabId,
			};
		}
	} catch (error) {
		console.error("[BACKGROUND] Failed to load recording state:", error);
	}
}

/**
 * Broadcast state update to panel/popup and ALL tabs
 */
function broadcastStateUpdate(): void {
	const message = {
		type: "STATE_UPDATE",
		state: recordingState,
	};

	// Send to extension context (panel, popup, etc.)
	chrome.runtime.sendMessage(message).catch(() => {
		// No listeners, that's okay
	});

	// Send to ALL tabs (for toolbar sync across all tabs)
	chrome.tabs.query({}).then((tabs) => {
		tabs.forEach((tab) => {
			if (tab.id) {
				chrome.tabs.sendMessage(tab.id, message).catch(() => {
					// Tab might not have content script, that's okay
				});
			}
		});
	});
}

/**
 * Track tabs involved in recording
 */
const recordingTabs = new Set<number>();

/**
 * Listen for new tabs being created during recording
 */
chrome.tabs.onCreated.addListener((tab) => {
	// If recording is active, track this new tab
	if (recordingState.isRecording && !recordingState.isPaused && tab.id) {
		console.log(
			"[BACKGROUND] 📑 New tab created during recording:",
			tab.id,
		);
		recordingTabs.add(tab.id);
	}
});

/**
 * Listen for tabs being updated (loading, complete, etc.)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	// Check if recording is active and this tab is part of the recording
	if (recordingState.isRecording && !recordingState.isPaused) {
		// When a page finishes loading during recording, inject recorder
		if (changeInfo.status === "complete") {
			// Add to recording tabs if not already tracked
			recordingTabs.add(tabId);

			console.log(
				"[BACKGROUND] 📄 Tab finished loading during recording:",
				tabId,
				tab.url,
			);

			// Send START_RECORDING message to activate the recorder in this tab
			// Add a small delay to ensure content script is fully loaded
			setTimeout(() => {
				chrome.tabs
					.sendMessage(tabId, {
						type: "START_RECORDING",
						timestamp: Date.now(),
					})
					.then(() => {
						console.log(
							"[BACKGROUND] ✅ Recorder activated in tab:",
							tabId,
						);
					})
					.catch((err) => {
						console.error(
							"[BACKGROUND] ❌ Failed to activate recorder in tab:",
							tabId,
							err,
						);
					});
			}, 100);
		}
	}
});

/**
 * Listen for tabs being removed to clean up tracking
 */
chrome.tabs.onRemoved.addListener((tabId) => {
	recordingTabs.delete(tabId);
	attachedDebuggers.delete(tabId);
});

// Load recording state on startup
loadRecordingState();
