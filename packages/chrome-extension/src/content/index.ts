import { initializeRPC } from "./rpc";
import { getDOMStats, getSimplifiedDOM } from "./simplifyDOM";

// Initialize RPC system for communication
initializeRPC();
let annotatedElements: HTMLElement[] = [];
const elementIdToUniqueId: Map<number, string> = new Map();

// Track panel state to only respond to PING when panel is actually open
let isPanelOpen = false;

// Track portal iframe for sending completion messages back
let portalIframeSource: Window | null = null;

// Inject MAIN world bridge script
const script = document.createElement("script");
script.src = chrome.runtime.getURL("main-bridge.js");
script.onload = () => {
	script.remove();
	console.log("[CONTENT] Bridge script injected into MAIN world");
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
		console.log("[CONTENT] 🔍 Received EXECUTE_PLAYWRIGHT_SCRIPT from:", event.origin);
		console.log("[CONTENT] 🔍 Has scriptContent:", !!event.data?.payload?.scriptContent);
	}

	// Handle PING from portal iframe - respond with PONG back to iframe
	if (event.data?.type === "SMSS_EXTENSION_PING") {
		console.log("[CONTENT] 🏓 Received PING from portal iframe");
		console.log("[CONTENT] Cached isPanelOpen:", isPanelOpen);

		// Always verify with background script for real-time state (don't trust cache)
		console.log("[CONTENT] 🔍 Querying background for real-time panel state...");
		chrome.runtime.sendMessage({ type: "CHECK_PANEL_STATE" }, (response) => {
			const actualPanelState = response?.isPanelOpen || false;
			console.log("[CONTENT] Background confirms panel state:", actualPanelState);

			// Update cached state
			isPanelOpen = actualPanelState;

			if (actualPanelState) {
				// Send PONG since panel is actually open
				console.log("[CONTENT] ✅ Sending PONG to portal");
				if (event.source && event.source !== window) {
					(event.source as Window).postMessage(
						{ type: "SMSS_EXTENSION_PONG", timestamp: Date.now() },
						event.origin
					);
				}
			} else {
				console.log("[CONTENT] ❌ Panel is closed, not sending PONG");
			}
		});
	}

	// Bridge relays PING from portal

	if (event.data?.type === "EXTENSION_PING_BRIDGE") {
		console.log("[CONTENT] 🏓 Received PING from bridge, responding");
		window.postMessage({ type: "EXTENSION_READY_BRIDGE" }, "*");
	}

	// Bridge relays EXECUTE from portal
	if (event.data?.type === "EXECUTE_SCRIPT_BRIDGE") {
		if (!isExtensionContextValid()) {
			alert("Chrome Extension was reloaded. Please refresh this page.");
			return;
		}

		console.log("[CONTENT] 📤 Received EXECUTE from bridge, forwarding to extension");

		const payload = event.data.payload;
		chrome.runtime.sendMessage({
			type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
			script: {
				projectId: payload.projectID,
				name: payload.fileName,
				fileName: payload.fileName,
				title: payload.title,
				autoExecute: true
			},
		}).catch((error) => {
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
			console.log("[CONTENT] 📍 Stored portal iframe for completion messages");
		}

		console.log("[CONTENT] 📤 Received EXECUTE_PLAYWRIGHT_SCRIPT from portal, forwarding to extension");

		const payload = event.data.payload;
		chrome.runtime.sendMessage({
			type: "EXECUTE_PLAYWRIGHT_SCRIPT",
			payload: {
				fileName: payload.fileName,
				projectID: payload.projectID,
				title: payload.title,
				scriptContent: payload.scriptContent // Forward scriptContent if present
			},
		}).catch((error) => {
			console.error("[CONTENT] ❌ Failed to forward portal message:", error);
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
	// Forward completion messages back to portal via bridge
	if (message.type === "SCRIPT_EXECUTION_COMPLETE") {
		console.log("[CONTENT] ✅ Execution complete, forwarding to portal");
		console.log("[CONTENT] Success:", message.success, "Message:", message.message);

		const completionMessage = message.success ? {
			type: "PLAYWRIGHT_SCRIPT_COMPLETED",
			success: true,
			message: message.message || "Script executed successfully",
			fileName: message.fileName,
		} : {
			type: "PLAYWRIGHT_SCRIPT_ERROR",
			error: message.message || "Script execution failed",
			fileName: message.fileName,
		};

		// Send to portal iframe if available, otherwise to window
		if (portalIframeSource) {
			console.log("[CONTENT] 📤 Sending completion to portal iframe");
			portalIframeSource.postMessage(completionMessage, window.location.origin);
			portalIframeSource = null; // Clear after use
		} else {
			console.log("[CONTENT] 📤 Sending completion to window (no iframe stored)");
			window.postMessage(completionMessage, "*");
		}

		sendResponse({ success: true });
		return true;
	}

	// Forward error messages back to portal via bridge
	if (message.type === "SCRIPT_EXECUTION_ERROR") {
		console.log("[CONTENT] ❌ Execution error, forwarding to portal");
		window.postMessage(
			{
				type: "PLAYWRIGHT_SCRIPT_ERROR",
				error: message.error,
			},
			"*"
		);
		sendResponse({ success: true });
		return true;
	}

	switch (message.type) {
		case "GET_ANNOTATED_DOM":
			try {
				const result = getSimplifiedDOMFromPage();
				// Also send the element ID mapping
				const mapping: Record<string, string> = {};
				elementIdToUniqueId.forEach((uniqueId, elementId) => {
					mapping[elementId.toString()] = uniqueId;
				});
				sendResponse({
					success: true,
					...result,
					elementMapping: mapping,
				});
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

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

		case "GET_ANNOTATED_DOM_LEGACY":
			try {
				const html = getAnnotatedDOM();
				sendResponse({ success: true, html });
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "GET_ELEMENT_COORDINATES":
			try {
				const coordinates = getElementCoordinates(message.elementId);
				sendResponse({ success: true, coordinates });
			} catch (error) {
				sendResponse({
					success: false,
					error:
						error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "HIGHLIGHT_ELEMENT":
			try {
				highlightElement(message.elementId);
				sendResponse({ success: true });
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
			document.dispatchEvent(new CustomEvent('__semoss_extension_response', {
				detail: {
					type: "SMSS_SCRIPT_EXECUTION_COMPLETE",
					success: message.success,
					message: message.message,
				}
			}));

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_OPENED":
			console.log("[CONTENT] 📢 Panel opened - notifying portal via window.postMessage");
			isPanelOpen = true;
			window.postMessage(
				{
					type: "SMSS_EXTENSION_OPENED",
					timestamp: Date.now(),
				},
				"*"
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_CLOSED":
			console.log("[CONTENT] 📢 Panel closed - notifying portal via window.postMessage");
			isPanelOpen = false;
			window.postMessage(
				{
					type: "SMSS_EXTENSION_CLOSED",
					timestamp: Date.now(),
				},
				"*"
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PONG":
			// Forward pong response from background to page via bridge
			console.log("[CONTENT] ✅ Received PONG from background - forwarding to page");
			document.dispatchEvent(new CustomEvent('__semoss_extension_response', {
				detail: {
					type: "SMSS_EXTENSION_PONG",
					timestamp: message.timestamp || Date.now(),
				}
			}));

			sendResponse({ success: true });
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
 * Get simplified DOM optimized for LLM consumption
 */
function getSimplifiedDOMFromPage() {
	const startTime = performance.now();

	// First, get annotated DOM with visibility and interactivity info
	// This populates annotatedElements array with ALL original page elements
	annotatedElements = [];
	const annotatedHTML = getAnnotatedDOM();

	// IMPORTANT: Save reference to ALL elements (don't overwrite!)
	const allPageElements = annotatedElements;

	// Then use filtering approach to get simplified HTML
	const result = getSimplifiedDOM(annotatedHTML);

	// Keep the FULL annotatedElements array (not the filtered one)
	// This ensures elementId references work correctly
	annotatedElements = allPageElements;

	// Get full stats from the HTML
	const stats = getDOMStats(result.html);

	return {
		html: result.html,
		stats,
		elementCount: allPageElements.length, // Total elements, not just interactive
	};
}

/**
 * Traverse the DOM and annotate interactive elements (Legacy)
 */
function getAnnotatedDOM(): string {
	annotatedElements = [];
	elementIdToUniqueId.clear(); // Reset mapping
	const clonedRoot = traverseDOM(document.documentElement, annotatedElements);
	return (clonedRoot as HTMLElement).outerHTML;
}

/**
 * Generate unique ID for element (persists across re-renders)
 */
function generateUniqueId(): string {
	return `workshop_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Recursively traverse and annotate DOM nodes
 */
function traverseDOM(
	node: Node,
	elements: HTMLElement[],
): HTMLElement | Text | DocumentFragment {
	const clonedNode = node.cloneNode(false);

	if (node.nodeType === Node.ELEMENT_NODE) {
		const element = node as HTMLElement;
		const style = window.getComputedStyle(element);
		const clonedElement = clonedNode as HTMLElement;

		// Store original element
		elements.push(element);
		const elementId = elements.length - 1;

		// Generate or retrieve persistent unique ID
		let uniqueId = element.getAttribute("data-workshop-node-id");
		if (!uniqueId) {
			uniqueId = generateUniqueId();
			// Store the unique ID on the REAL DOM element (persists across re-renders)
			element.setAttribute("data-workshop-node-id", uniqueId);
		}

		// Store mapping for quick lookup later
		elementIdToUniqueId.set(elementId, uniqueId);

		// Add metadata attributes to the CLONED element for LLM
		clonedElement.setAttribute("data-id", elementId.toString());
		clonedElement.setAttribute("data-unique-id", uniqueId);
		clonedElement.setAttribute(
			"data-interactive",
			isInteractive(element, style).toString(),
		);
		clonedElement.setAttribute(
			"data-visible",
			isVisible(element, style).toString(),
		);

		// Traverse children
		node.childNodes.forEach((child) => {
			const result = traverseDOM(child, elements);
			clonedElement.appendChild(result);
		});

		return clonedElement;
	}

	// Handle text nodes
	if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
		return document.createTextNode(node.textContent);
	}

	// For other nodes, just clone children
	node.childNodes.forEach((child) => {
		const result = traverseDOM(child, elements);
		clonedNode.appendChild(result);
	});

	return clonedNode as DocumentFragment;
}

/**
 * Check if element is interactive
 */
function isInteractive(
	element: HTMLElement,
	style: CSSStyleDeclaration,
): boolean {
	const interactiveTags = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];
	const interactiveAttributes = [
		"onclick",
		"onmousedown",
		"onmouseup",
		"onkeydown",
		"onkeyup",
	];

	return (
		interactiveTags.includes(element.tagName) ||
		interactiveAttributes.some((attr) => element.hasAttribute(attr)) ||
		style.cursor === "pointer" ||
		element.hasAttribute("role")
	);
}

/**
 * Check if element is visible
 */
function isVisible(element: HTMLElement, style: CSSStyleDeclaration): boolean {
	return (
		style.display !== "none" &&
		style.visibility !== "hidden" &&
		style.opacity !== "0" &&
		element.getAttribute("aria-hidden") !== "true"
	);
}

/**
 * Get coordinates of an element for clicking
 */
function getElementCoordinates(elementId: number): { x: number; y: number } {
	if (elementId >= annotatedElements.length) {
		throw new Error(`Element with id ${elementId} not found`);
	}

	const element = annotatedElements[elementId];
	const rect = element.getBoundingClientRect();

	// Return center coordinates
	return {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	};
}

/**
 * Highlight an element visually (for debugging)
 */
function highlightElement(elementId: number): void {
	if (elementId >= annotatedElements.length) {
		throw new Error(`Element with id ${elementId} not found`);
	}

	const element = annotatedElements[elementId];
	const originalBorder = element.style.border;

	element.style.border = "3px solid red";
	element.scrollIntoView({ behavior: "smooth", block: "center" });

	setTimeout(() => {
		element.style.border = originalBorder;
	}, 2000);
}
