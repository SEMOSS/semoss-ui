/**
 * Content Script - Injected into web pages
 *
 * Manages the floating automation panel, captures user interactions during recording,
 * and routes messages between the page, background script, and extension panel.
 *
 * Key responsibilities:
 * - Floating panel lifecycle management (positioning, resizing, dragging)
 * - Event recording via EventRecorder
 * - Message routing between extension contexts
 * - Bridge script injection for MAIN world access
 * - Field monitoring during script execution
 */

import React from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { EventRecorder } from "../recorder/EventRecorder";
import { createEventRecorder } from "../recorder/EventRecorder";

// ============================================================================
// Floating Panel Configuration
// ============================================================================

/**  DOM element ID for the floating panel iframe */
const FLOATING_PANEL_WRAPPER_ID = "semoss-browser-automation-frame";

/** Collapsed panel size (circular button) */
const FLOATING_PANEL_COLLAPSED_SIZE = 72;

/** Expanded panel width */
const FLOATING_PANEL_EXPANDED_WIDTH = 380;

/** Expanded panel height */
const FLOATING_PANEL_EXPANDED_HEIGHT = 620;

/** Minimum distance from viewport edges */
const FLOATING_PANEL_MARGIN = 16;

/** Storage key for persisting panel position */
const FLOATING_PANEL_POSITION_STORAGE_KEY =
	"semoss-browser-automation-panel-position";

type FloatingPanelPosition = {
	left: number;
	top: number;
};

// ============================================================================
// State Management
// ============================================================================

// Track panel state to only respond to PING when panel is actually open
let _isPanelOpen = false;

// Track portal iframe for sending completion messages back
let portalIframeSource: Window | null = null;

// Store current tab ID for message routing
let currentTabId: number | undefined;

// Recording state
let eventRecorder: EventRecorder | null = null;
let _isRecording = false;
let overlayRoot: Root | null = null;
let overlayContainer: HTMLDivElement | null = null;
let floatingPanelFrame: HTMLIFrameElement | null = null;
let floatingPanelPosition: FloatingPanelPosition | null = null;
let floatingPanelHidden = false;

// ============================================================================
// Panel Management Functions
// ============================================================================

/**
 * Get the current tab ID from the background script
 * @returns Tab ID or undefined if not available
 */
async function getHostTabId(): Promise<number | undefined> {
	try {
		const response = await chrome.runtime.sendMessage({
			type: "GET_HOST_TAB_ID",
		});
		return response?.tabId;
	} catch {
		return undefined;
	}
}

// Initialize tab ID on content script load
getHostTabId().then((tabId) => {
	currentTabId = tabId;
	if (tabId) {
	}
});

function getFloatingPanelSize() {
	return {
		width: floatingPanelFrame?.offsetWidth || FLOATING_PANEL_COLLAPSED_SIZE,
		height:
			floatingPanelFrame?.offsetHeight || FLOATING_PANEL_COLLAPSED_SIZE,
	};
}

function getDefaultFloatingPanelPosition(): FloatingPanelPosition {
	const { width, height } = getFloatingPanelSize();

	return {
		left: window.innerWidth - width - FLOATING_PANEL_MARGIN,
		top: window.innerHeight - height - FLOATING_PANEL_MARGIN,
	};
}

function clampFloatingPanelPosition(
	position: FloatingPanelPosition,
): FloatingPanelPosition {
	const { width, height } = getFloatingPanelSize();
	const maxLeft = Math.max(8, window.innerWidth - width - 8);
	const maxTop = Math.max(8, window.innerHeight - height - 8);

	return {
		left: Math.min(Math.max(8, position.left), maxLeft),
		top: Math.min(Math.max(8, position.top), maxTop),
	};
}

function applyFloatingPanelPosition(position: FloatingPanelPosition | null) {
	if (!floatingPanelFrame) return;

	floatingPanelPosition = clampFloatingPanelPosition(
		position ?? getDefaultFloatingPanelPosition(),
	);
	floatingPanelFrame.style.left = `${floatingPanelPosition.left}px`;
	floatingPanelFrame.style.top = `${floatingPanelPosition.top}px`;
	floatingPanelFrame.style.right = "auto";
	floatingPanelFrame.style.bottom = "auto";
}

function sizeFloatingPanel(expanded: boolean) {
	if (!floatingPanelFrame) return;

	const width = expanded
		? Math.min(FLOATING_PANEL_EXPANDED_WIDTH, window.innerWidth - 24)
		: FLOATING_PANEL_COLLAPSED_SIZE;
	const height = expanded
		? Math.min(FLOATING_PANEL_EXPANDED_HEIGHT, window.innerHeight - 24)
		: FLOATING_PANEL_COLLAPSED_SIZE;

	floatingPanelFrame.style.width = `${Math.max(width, FLOATING_PANEL_COLLAPSED_SIZE)}px`;
	floatingPanelFrame.style.height = `${Math.max(height, FLOATING_PANEL_COLLAPSED_SIZE)}px`;
	applyFloatingPanelPosition(floatingPanelPosition);
}

function showFloatingPanel() {
	if (!floatingPanelFrame) return;

	floatingPanelHidden = false;
	floatingPanelFrame.style.display = "block";
	floatingPanelFrame.contentWindow?.postMessage(
		{ type: "SMSS_FLOATING_PANEL_REQUEST_STATE" },
		"*",
	);
}

function hideFloatingPanel() {
	if (!floatingPanelFrame) return;

	floatingPanelHidden = true;
	floatingPanelFrame.style.display = "none";
}

function saveFloatingPanelPosition() {
	if (!floatingPanelPosition || !isExtensionContextValid()) return;

	chrome.storage.local
		.set({
			[FLOATING_PANEL_POSITION_STORAGE_KEY]: floatingPanelPosition,
		})
		.catch(() => {
			// Persisting the position is best effort only.
		});
}

async function loadFloatingPanelPosition() {
	if (!isExtensionContextValid()) return;

	try {
		const stored = await chrome.storage.local.get(
			FLOATING_PANEL_POSITION_STORAGE_KEY,
		);
		const value = stored[FLOATING_PANEL_POSITION_STORAGE_KEY];

		if (
			value &&
			typeof value.left === "number" &&
			typeof value.top === "number"
		) {
			applyFloatingPanelPosition(value);
		}
	} catch {
		// Keep the default position if storage is unavailable.
	}
}

async function ensureFloatingPanel() {
	if (floatingPanelFrame) {
		showFloatingPanel();
		return;
	}
	if (!isExtensionContextValid() || !document.documentElement) return;

	const hostTabId = await getHostTabId();
	const panelUrl = new URL(chrome.runtime.getURL("src/panel/index.html"));
	panelUrl.searchParams.set("floating", "1");
	if (typeof hostTabId === "number") {
		panelUrl.searchParams.set("tabId", String(hostTabId));
	}

	const frame = document.createElement("iframe");
	frame.id = FLOATING_PANEL_WRAPPER_ID;
	frame.title = "SEMOSS Browser Automation";
	frame.src = panelUrl.toString();
	frame.setAttribute("allow", "clipboard-read; clipboard-write");
	frame.style.position = "fixed";
	frame.style.width = `${FLOATING_PANEL_COLLAPSED_SIZE}px`;
	frame.style.height = `${FLOATING_PANEL_COLLAPSED_SIZE}px`;
	frame.style.border = "0";
	frame.style.borderRadius = `${FLOATING_PANEL_COLLAPSED_SIZE / 2}px`;
	frame.style.background = "transparent";
	frame.style.boxShadow = "0 12px 36px rgba(15, 23, 42, 0.24)";
	frame.style.zIndex = "2147483647";
	frame.style.overflow = "hidden";
	frame.style.transition =
		"width 180ms ease, height 180ms ease, border-radius 180ms ease, box-shadow 180ms ease";

	document.documentElement.appendChild(frame);
	floatingPanelFrame = frame;
	floatingPanelHidden = false;
	applyFloatingPanelPosition(null);
	void loadFloatingPanelPosition();
}

window.addEventListener("resize", () => {
	if (!floatingPanelFrame) return;
	applyFloatingPanelPosition(floatingPanelPosition);
	floatingPanelFrame.contentWindow?.postMessage(
		{ type: "SMSS_FLOATING_PANEL_REQUEST_STATE" },
		"*",
	);
});

window.addEventListener("message", (event) => {
	if (
		!floatingPanelFrame ||
		event.source !== floatingPanelFrame.contentWindow
	) {
		return;
	}

	if (event.data?.type === "SMSS_FLOATING_PANEL_RESIZE") {
		const expanded = event.data.expanded === true;
		sizeFloatingPanel(expanded);
		floatingPanelFrame.style.borderRadius = expanded ? "14px" : "36px";
		floatingPanelFrame.style.boxShadow = expanded
			? "0 18px 54px rgba(15, 23, 42, 0.28)"
			: "0 12px 36px rgba(15, 23, 42, 0.24)";
	}

	if (event.data?.type === "SMSS_FLOATING_PANEL_DRAG") {
		const nextPosition =
			floatingPanelPosition ?? getDefaultFloatingPanelPosition();
		applyFloatingPanelPosition({
			left: nextPosition.left + (Number(event.data.deltaX) || 0),
			top: nextPosition.top + (Number(event.data.deltaY) || 0),
		});
	}

	if (event.data?.type === "SMSS_FLOATING_PANEL_DRAG_END") {
		saveFloatingPanelPosition();
	}

	if (event.data?.type === "SMSS_FLOATING_PANEL_CLOSE") {
		hideFloatingPanel();
	}
});

void ensureFloatingPanel();

// Inject MAIN world bridge script
const script = document.createElement("script");
script.src = chrome.runtime.getURL("main-bridge.js");
script.onload = () => {
	script.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from MAIN bridge
window.addEventListener("message", (event) => {
	// Accept messages from same origin (allows iframe messages from portal)
	// Check origin instead of window source to support iframe communication
	if (event.origin !== window.location.origin) {
		// Silently ignore messages from other origins
		return;
	}

	// Debug logging for key messages
	if (event.data?.type === "EXECUTE_PLAYWRIGHT_SCRIPT") {
	}

	// Handle PING from portal iframe - respond with PONG back to iframe
	if (event.data?.type === "SMSS_EXTENSION_PING") {
		// Always verify with background script for real-time state (don't trust cache)

		chrome.runtime.sendMessage(
			{ type: "CHECK_PANEL_STATE" },
			(response) => {
				const actualPanelState = response?.isPanelOpen || false;

				// Update cached state
				_isPanelOpen = actualPanelState;

				if (actualPanelState) {
					// Send PONG since panel is actually open

					if (event.source && event.source !== window) {
						(event.source as Window).postMessage(
							{
								type: "SMSS_EXTENSION_PONG",
								timestamp: Date.now(),
							},
							event.origin,
						);
					}
				} else {
				}
			},
		);
	}

	// Bridge relays PING from portal

	if (event.data?.type === "EXTENSION_PING_BRIDGE") {
		window.postMessage({ type: "EXTENSION_READY_BRIDGE" }, "*");
	}

	// Bridge relays EXECUTE from portal
	if (event.data?.type === "EXECUTE_SCRIPT_BRIDGE") {
		if (!isExtensionContextValid()) {
			alert("Chrome Extension was reloaded. Please refresh this page.");
			return;
		}

		const payload = event.data.payload;
		chrome.runtime
			.sendMessage({
				type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
				script: {
					projectId: payload.projectID,
					name: payload.fileName,
					fileName: payload.fileName,
					title: payload.title,
					autoExecute: true,
				},
			})
			.catch((error) => {
				console.error("[CONTENT] ❌ Failed to forward:", error);
			});
	}

	// Direct portal message (new format)
	if (event.data?.type === "EXECUTE_PLAYWRIGHT_SCRIPT") {
		if (!isExtensionContextValid()) {
			alert("Chrome Extension was reloaded. Please refresh this page.");
			return;
		}

		// Store the iframe source to send completion back later
		if (event.source && event.source !== window) {
			portalIframeSource = event.source as Window;
		}

		const payload = event.data.payload;
		chrome.runtime
			.sendMessage({
				type: "EXECUTE_PLAYWRIGHT_SCRIPT",
				sourceTabId: currentTabId, // Explicitly include tab ID for reliable routing
				payload: {
					fileName: payload.fileName,
					projectID: payload.projectID,
					title: payload.title,
					scriptContent: payload.scriptContent, // Forward scriptContent if present
				},
			})
			.catch((error) => {
				console.error(
					"[CONTENT] ❌ Failed to forward portal message:",
					error,
				);
			});
	}
});

// Field monitoring state
let monitoredField: HTMLInputElement | HTMLTextAreaElement | null = null;
let fieldMonitoringListeners: {
	blur: () => void;
	keydown: (e: KeyboardEvent) => void;
} | null = null;

// Listen for playground chat events
let isPlaygroundPage = false;
let playgroundListenersSetup = false; // Track if listeners have been setup

// Check if current page is playground
function checkIfPlayground() {
	// Check if URL contains playground patterns
	const url = window.location.href;
	isPlaygroundPage = url.includes("/room/") || url.includes("playground");

	if (isPlaygroundPage && !playgroundListenersSetup) {
		setupPlaygroundListeners();
		playgroundListenersSetup = true;
	}
}

// Check if extension context is still valid
function isExtensionContextValid(): boolean {
	try {
		// Try to access extension API - will throw if context is invalidated
		const isValid = !!chrome.runtime?.id;
		return isValid;
	} catch (e) {
		console.error("[CONTENT SCRIPT] ❌ Extension context check failed:", e);
		return false;
	}
}

// Setup listeners for playground chat events
function setupPlaygroundListeners() {
	// Listen for response messages (AI output)
	window.addEventListener("playground-chat-response", ((
		event: CustomEvent,
	) => {
		// Forward to extension background/panel
		chrome.runtime
			.sendMessage({
				type: "PLAYGROUND_CHAT_RESPONSE",
				data: event.detail,
			})
			.catch(() => {
				// Could not send to extension
			});
	}) as EventListener);

	// Listen for message submissions (for mode switching and command automation)
	window.addEventListener("playground-chat-submit", ((event: CustomEvent) => {
		// Forward to extension background/panel
		chrome.runtime.sendMessage({
			type: "PLAYGROUND_CHAT_SUBMIT",
			data: event.detail,
		});
	}) as EventListener);
}

checkIfPlayground();

// Monitor for SPA navigation changes using MutationObserver
let lastUrl = window.location.href;
new MutationObserver(() => {
	const currentUrl = window.location.href;
	if (currentUrl !== lastUrl) {
		lastUrl = currentUrl;
		setTimeout(checkIfPlayground, 500);
	}
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "TOGGLE_FLOATING_PANEL") {
		const wasFloatingPanelHidden = floatingPanelHidden;
		void ensureFloatingPanel().then(() => {
			if (wasFloatingPanelHidden) {
				showFloatingPanel();
			} else {
				floatingPanelFrame?.contentWindow?.postMessage(
					{ type: "SMSS_FLOATING_PANEL_TOGGLE" },
					"*",
				);
			}
			sendResponse({ success: true });
		});
		return true;
	}

	// Forward completion messages back to portal via bridge
	if (message.type === "SCRIPT_EXECUTION_COMPLETE") {
		// Create appropriate completion message based on success/failure
		const completionMessage = message.success
			? {
					type: "PLAYWRIGHT_SCRIPT_COMPLETED",
					message: message.message || "Script executed successfully",
					fileName: message.fileName,
				}
			: {
					type: "PLAYWRIGHT_SCRIPT_ERROR",
					error: message.message || "Script execution failed",
					fileName: message.fileName,
				};

		// Send to portal iframe if available, otherwise to window
		if (portalIframeSource) {
			portalIframeSource.postMessage(
				completionMessage,
				window.location.origin,
			);
			portalIframeSource = null; // Clear after use
		} else {
			console.log(
				"[CONTENT] 📤 Sending completion to window (no iframe stored)",
			);
			window.postMessage(completionMessage, "*");
		}

		sendResponse({ success: true });
		return true;
	}

	// Forward error messages back to portal via bridge
	if (message.type === "SCRIPT_EXECUTION_ERROR") {
		window.postMessage(
			{
				type: "PLAYWRIGHT_SCRIPT_ERROR",
				error: message.error,
			},
			"*",
		);
		sendResponse({ success: true });
		return true;
	}

	switch (message.type) {
		case "GET_ELEMENT_BY_UNIQUE_ID":
			try {
				const element = document.querySelector(
					`[data-workshop-node-id="${message.uniqueId}"]`,
				) as HTMLElement;
				if (!element) {
					throw new Error(
						`Could not find element with unique ID: ${message.uniqueId}`,
					);
				}
				sendResponse({ success: true, element });
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "SCRIPT_EXECUTION_COMPLETE":
			// Post message to page via bridge
			document.dispatchEvent(
				new CustomEvent("__semoss_extension_response", {
					detail: {
						type: "SMSS_SCRIPT_EXECUTION_COMPLETE",
						success: message.success,
						message: message.message,
					},
				}),
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_OPENED":
			_isPanelOpen = true;
			window.postMessage(
				{
					type: "SMSS_EXTENSION_OPENED",
					timestamp: Date.now(),
				},
				"*",
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_CLOSED":
			_isPanelOpen = false;
			window.postMessage(
				{
					type: "SMSS_EXTENSION_CLOSED",
					timestamp: Date.now(),
				},
				"*",
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PONG":
			// Forward pong response from background to page via bridge

			document.dispatchEvent(
				new CustomEvent("__semoss_extension_response", {
					detail: {
						type: "SMSS_EXTENSION_PONG",
						timestamp: message.timestamp || Date.now(),
					},
				}),
			);

			sendResponse({ success: true });
			break;

		case "CLEAR_FIELD_VALUE":
			// SECURITY FIX: Clear autofilled values to prevent cached credential bypass
			try {
				const field = document.querySelector(message.selector) as
					| HTMLInputElement
					| HTMLTextAreaElement
					| null;

				if (!field) {
					sendResponse({
						success: false,
						error: "Field not found",
					});
					break;
				}

				// Focus the field
				field.focus();

				// Clear the value
				field.value = "";

				// Trigger native setter for React/Vue compatibility
				const descriptor = Object.getOwnPropertyDescriptor(
					window.HTMLInputElement.prototype,
					"value",
				);
				if (descriptor && descriptor.set) {
					descriptor.set.call(field, "");
				}

				// Dispatch events to notify framework
				field.dispatchEvent(
					new Event("input", { bubbles: true, cancelable: true }),
				);
				field.dispatchEvent(
					new Event("change", { bubbles: true, cancelable: true }),
				);

				sendResponse({ success: true });
			} catch (error) {
				console.error(
					"[CONTENT SCRIPT] ❌ Error clearing field:",
					error,
				);
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "START_FIELD_MONITORING":
			// Handle field monitoring asynchronously
			(async () => {
				try {
					// Try to find the field with retry logic (wait for dynamic content)
					let field: HTMLInputElement | HTMLTextAreaElement | null =
						null;
					let retries = 3;

					while (retries > 0 && !field) {
						field = document.querySelector(message.selector) as
							| HTMLInputElement
							| HTMLTextAreaElement;

						if (!field && retries > 1) {
							// Wait a bit before retrying
							await new Promise((resolve) =>
								setTimeout(resolve, 500),
							);
						}
						retries--;
					}

					if (!field) {
						// Return success but indicate field wasn't found (non-critical)
						sendResponse({
							success: true,
							fieldFound: false,
							error: "Field not found",
						});
						return;
					}

					// Stop any existing monitoring
					stopFieldMonitoring();

					monitoredField = field;

					// Create event handlers
					const checkFieldAndNotify = () => {
						if (!monitoredField) return;

						const value = monitoredField.value.trim();

						// Check if field has content
						if (value.length > 0) {
							// Send message to background (which will forward to panel)
							chrome.runtime
								.sendMessage({
									type: "FIELD_INPUT_DETECTED",
									selector: message.selector,
									value: message.isPassword ? "" : value, // Don't send password values
									isPassword: message.isPassword,
								})
								.catch((err) => {
									console.warn(
										"[CONTENT SCRIPT] Failed to send field input notification:",
										err,
									);
								});

							// Clean up monitoring
							stopFieldMonitoring();
						}
					};

					// Blur event - when user tabs out or clicks elsewhere
					const blurHandler = () => {
						checkFieldAndNotify();
					};

					// Keydown event - when user presses Enter
					const keydownHandler = (e: KeyboardEvent) => {
						if (e.key === "Enter") {
							checkFieldAndNotify();
						}
					};

					fieldMonitoringListeners = {
						blur: blurHandler,
						keydown: keydownHandler,
					};

					// Attach listeners
					field.addEventListener("blur", blurHandler);
					field.addEventListener("keydown", keydownHandler);
					sendResponse({ success: true, fieldFound: true });
				} catch (error) {
					console.error(
						"[CONTENT SCRIPT] ❌ Error starting field monitoring:",
						error,
					);
					sendResponse({
						success: false,
						error:
							error instanceof Error
								? error.message
								: String(error),
					});
				}
			})();
			return true; // Keep channel open for async response

		case "STOP_FIELD_MONITORING":
			try {
				stopFieldMonitoring();
				sendResponse({ success: true });
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "START_RECORDING":
			try {
				if (!eventRecorder) {
					eventRecorder = createEventRecorder();
				}
				eventRecorder.onInit();
				_isRecording = true;

				// Mount overlay toolbar
				mountOverlay();

				sendResponse({ success: true });
			} catch (error) {
				console.error("[CONTENT] ❌ Failed to start recording:", error);
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "STOP_RECORDING":
			try {
				if (eventRecorder) {
					eventRecorder.cleanup();
				}
				_isRecording = false;

				// Unmount overlay toolbar
				unmountOverlay();

				sendResponse({ success: true });
			} catch (error) {
				console.error("[CONTENT] ❌ Failed to stop recording:", error);
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "PAUSE_RECORDING":
			try {
				// Pause is handled by background script (filters events)
				sendResponse({ success: true });
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "RESUME_RECORDING":
			try {
				// Resume is handled by background script (accepts events again)
				sendResponse({ success: true });
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "UPDATE_FIELD_VALUE":
			// Handle real-time field value update from panel
			(async () => {
				try {
					// Try to find the field with retry logic
					let field: HTMLInputElement | HTMLTextAreaElement | null =
						null;
					let retries = 3;

					while (retries > 0 && !field) {
						field = document.querySelector(message.selector) as
							| HTMLInputElement
							| HTMLTextAreaElement;

						if (!field && retries > 1) {
							await new Promise((resolve) =>
								setTimeout(resolve, 300),
							);
						}
						retries--;
					}

					if (!field) {
						sendResponse({
							success: false,
							error: "Field not found",
						});
						return;
					}

					// Update the field value
					field.value = message.value || "";

					// Dispatch input event to trigger React onChange and form validation
					const inputEvent = new Event("input", { bubbles: true });
					field.dispatchEvent(inputEvent);

					// Also dispatch change event for additional compatibility
					const changeEvent = new Event("change", { bubbles: true });
					field.dispatchEvent(changeEvent);
					sendResponse({ success: true });
				} catch (error) {
					console.error(
						"[CONTENT SCRIPT] ❌ Error updating field value:",
						error,
					);
					sendResponse({
						success: false,
						error:
							error instanceof Error
								? error.message
								: String(error),
					});
				}
			})();
			return true; // Keep channel open for async response

		default:
			console.warn("Unknown message type:", message.type);
	}

	return true; // Keep channel open for async response
});

/**
 * Stop monitoring a field for user input
 */
function stopFieldMonitoring() {
	if (monitoredField && fieldMonitoringListeners) {
		monitoredField.removeEventListener(
			"blur",
			fieldMonitoringListeners.blur,
		);
		monitoredField.removeEventListener(
			"keydown",
			fieldMonitoringListeners.keydown,
		);
	}
	monitoredField = null;
	fieldMonitoringListeners = null;
}

/**
 * Mount overlay toolbar for recording
 */
async function mountOverlay(): Promise<void> {
	try {
		// Prevent duplicate mounting
		if (overlayContainer) {
			return;
		}

		// Create container
		overlayContainer = document.createElement("div");
		overlayContainer.id = "semoss-recorder-overlay";
		overlayContainer.setAttribute("data-extension-id", chrome.runtime.id);
		document.body.appendChild(overlayContainer);

		// Dynamically import React component
		const { RecorderToolbar } = await import("./overlay/RecorderToolbar");

		// Create React root and render (component manages its own state now)
		overlayRoot = createRoot(overlayContainer);
		overlayRoot.render(React.createElement(RecorderToolbar));
	} catch (error) {
		console.error("[CONTENT] ❌ Failed to mount overlay:", error);
	}
}

/**
 * Unmount overlay toolbar
 */
function unmountOverlay(): void {
	try {
		if (overlayRoot) {
			overlayRoot.unmount();
			overlayRoot = null;
		}

		if (overlayContainer) {
			overlayContainer.remove();
			overlayContainer = null;
		}
	} catch (error) {
		console.error("[CONTENT] ❌ Failed to unmount overlay:", error);
	}
}
