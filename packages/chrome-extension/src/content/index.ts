import { initializeRPC } from "./rpc";
import { getDOMStats, getSimplifiedDOM } from "./simplifyDOM";

// Initialize RPC system for communication
initializeRPC();

console.log("Workshop Automation - Content script loaded");
console.log("Extension ID:", chrome.runtime.id);
console.log("Document ready state:", document.readyState);
console.log("Document body exists:", !!document.body);

let annotatedElements: HTMLElement[] = [];
const elementIdToUniqueId: Map<number, string> = new Map();

// Field monitoring state
let monitoredField: HTMLInputElement | HTMLTextAreaElement | null = null;
let fieldMonitoringListeners: { blur: () => void; keydown: (e: KeyboardEvent) => void } | null = null;

// Listen for playground chat events
let isPlaygroundPage = false;
let playgroundListenersSetup = false; // Track if listeners have been setup

// Check if current page is playground
function checkIfPlayground() {
	// Check if URL contains playground patterns
	const url = window.location.href;
	const wasPlaygroundPage = isPlaygroundPage;
	isPlaygroundPage = url.includes("/room/") || url.includes("playground");

	console.log("[CONTENT SCRIPT] 🔍 checkIfPlayground():", {
		url,
		isPlaygroundPage,
		wasPlaygroundPage,
		listenersAlreadySetup: playgroundListenersSetup,
		timestamp: new Date().toISOString()
	});

	if (isPlaygroundPage && !playgroundListenersSetup) {
		console.log("[CONTENT SCRIPT] 🎯 Playground page detected, enabling chat monitoring");
		setupPlaygroundListeners();
		playgroundListenersSetup = true;
	} else if (isPlaygroundPage && playgroundListenersSetup) {
		console.log("[CONTENT SCRIPT] ✅ Playground listeners already set up - skipping");
	} else {
		console.log("[CONTENT SCRIPT] ℹ️ Not a playground page");
	}
}

// Check if extension context is still valid
function isExtensionContextValid(): boolean {
	try {
		// Try to access extension API - will throw if context is invalidated
		const isValid = !!chrome.runtime?.id;
		console.log("[CONTENT SCRIPT] 🔒 Extension context check:", {
			isValid,
			runtimeId: chrome.runtime?.id,
			timestamp: new Date().toISOString()
		});
		return isValid;
	} catch (e) {
		console.error("[CONTENT SCRIPT] ❌ Extension context check failed:", e);
		return false;
	}
}

// Setup listeners for playground chat events
function setupPlaygroundListeners() {
	console.log("[CONTENT SCRIPT] 🚀 setupPlaygroundListeners() called at", new Date().toISOString());
	console.log("[CONTENT SCRIPT] 📍 Current URL:", window.location.href);
	console.log("[CONTENT SCRIPT] 🔌 Extension ID:", chrome.runtime?.id);
	
	// Listen for response messages (AI output)
	window.addEventListener("playground-chat-response", ((
		event: CustomEvent,
	) => {
		console.log("[CONTENT SCRIPT] 💬 Playground chat response:", event.detail);

		// Forward to extension background/panel
		chrome.runtime
			.sendMessage({
				type: "PLAYGROUND_CHAT_RESPONSE",
				data: event.detail,
			})
			.catch((err) => {
				console.log("[CONTENT SCRIPT] ⚠️ Could not send to extension:", err);
			});
	}) as EventListener);

	// Listen for message submissions (for mode switching and command automation)
	window.addEventListener("playground-chat-submit", ((event: CustomEvent) => {
		console.log("[CONTENT SCRIPT] 📤 Playground chat submit:", event.detail);

		// Forward to extension background/panel
		chrome.runtime
			.sendMessage({
				type: "PLAYGROUND_CHAT_SUBMIT",
				data: event.detail,
			})
			.catch((err) => {
				console.log("[CONTENT SCRIPT] ⚠️ Could not send to extension:", err);
			});
	}) as EventListener);

	// Listen for Playwright script execution requests from Playground
	const messageHandler = (event: MessageEvent) => {
		// Log all messages for debugging
		if (event.origin === window.location.origin && event.data && event.data.type) {
			console.log("[CONTENT SCRIPT] 📨 Received message:", event.data.type, event.data);
		}

		// Only accept messages from same origin
		if (event.origin !== window.location.origin) {
			console.log("[CONTENT SCRIPT] 🚫 Ignoring message from different origin:", event.origin);
			return;
		}

		if (event.data && event.data.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
			console.log(
				"[CONTENT SCRIPT] Received Playwright script execution request:",
				event.data.script,
			);

			// Check if extension context is still valid
			console.log(
				"[CONTENT SCRIPT] Checking extension validity - chrome.runtime.id:",
				chrome.runtime?.id,
			);

			if (!isExtensionContextValid()) {
				console.warn("[CONTENT SCRIPT] Extension context invalidated!");
				alert(
					"Chrome Extension was reloaded. Please refresh this page to execute Playwright scripts.",
				);
				return;
			}

			console.log(
				"[CONTENT SCRIPT] Extension context valid, sending message to background...",
			);

			// Forward to extension panel
			chrome.runtime
				.sendMessage({
					type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
					script: event.data.script,
				})
				.then((response) => {
					console.log(
						"[CONTENT SCRIPT] Message sent successfully, response:",
						response,
					);
				})
				.catch((err) => {
					console.error(
						"[CONTENT SCRIPT] Failed to send message:",
						err,
					);
				});
		}

		// Listen for Google Recorder script execution requests from Playground
		if (event.data && event.data.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT") {
			console.log(
				"[CONTENT SCRIPT] 📥 Received Google Recorder script execution request:",
				{
					scriptName: event.data.script?.name,
					hasScriptContent: !!event.data.script?.scriptContent,
					autoExecute: event.data.script?.autoExecute
				}
			);

			// Check if extension context is still valid
			console.log(
				"[CONTENT SCRIPT] 🔍 Checking extension validity - chrome.runtime.id:",
				chrome.runtime?.id,
			);

			if (!isExtensionContextValid()) {
				console.warn("[CONTENT SCRIPT] ❌ Extension context invalidated!");
				alert(
					"Chrome Extension was reloaded. Please refresh this page to execute Google Recorder scripts.",
				);
				return;
			}

			console.log(
				"[CONTENT SCRIPT] ✅ Extension context valid, sending message to background...",
			);

			// Forward to extension panel
			chrome.runtime
				.sendMessage({
					type: "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT",
					script: event.data.script,
				})
				.then((response) => {
					console.log(
						"[CONTENT SCRIPT] ✅ Message sent successfully to background, response:",
						response,
					);
				})
				.catch((err) => {
					console.error(
						"[CONTENT SCRIPT] ❌ Failed to send message to background:",
						err,
					);
				});
		}
	};
	
	window.addEventListener("message", messageHandler);

	console.log("[CONTENT SCRIPT] 📋 Playground chat listeners setup complete");
	console.log("[CONTENT SCRIPT] 🎯 Listening for message types:", [
		"SMSS_EXEC_PLAYWRIGHT_SCRIPT", 
		"SMSS_EXEC_GOOGLE_RECORDER_SCRIPT"
	]);
	console.log("[CONTENT SCRIPT] 🌐 Origin:", window.location.origin);
}

// Check on initial load
console.log("[CONTENT SCRIPT] 🎬 Initial load check at", new Date().toISOString());
checkIfPlayground();

// Monitor for SPA navigation changes using MutationObserver
let lastUrl = window.location.href;
console.log("[CONTENT SCRIPT] 👀 Setting up URL change monitor, initial URL:", lastUrl);
new MutationObserver(() => {
	const currentUrl = window.location.href;
	if (currentUrl !== lastUrl) {
		console.log("[CONTENT SCRIPT] 🔄 URL changed:", { from: lastUrl, to: currentUrl });
		lastUrl = currentUrl;
		setTimeout(checkIfPlayground, 500);
	}
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	console.log("Content script received message:", message);

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
			// Forward script execution completion to playground page
			console.log(
				"[CONTENT SCRIPT] 📥 Received script execution completion from background:",
				{ success: message.success, message: message.message }
			);
			
			// Post message to window so playground can receive it
			window.postMessage(
				{
					type: "SMSS_SCRIPT_EXECUTION_COMPLETE",
					success: message.success,
					message: message.message,
				},
				window.location.origin,
			);
			
			console.log(
				"[CONTENT SCRIPT] ✅ Forwarded execution status to playground window"
			);
			
			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_OPENED":
			console.log("[CONTENT SCRIPT] 📥 Got PANEL_OPENED from background");
			console.log("[CONTENT SCRIPT] 📤 Posting SMSS_EXTENSION_OPENED to window");

			window.postMessage(
				{
					type: "SMSS_EXTENSION_OPENED",
					timestamp: Date.now(),
				},
				window.location.origin,
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_CLOSED":
			console.log("[CONTENT SCRIPT] 📥 Got PANEL_CLOSED from background");
			console.log("[CONTENT SCRIPT] 📤 Posting SMSS_EXTENSION_CLOSED to window");

			window.postMessage(
				{
					type: "SMSS_EXTENSION_CLOSED",
					timestamp: Date.now(),
				},
				window.location.origin,
			);

			console.log(
				"[CONTENT SCRIPT] ✅ Forwarded panel-close signal to playground window",
			);

			sendResponse({ success: true });
			break;

		case "START_FIELD_MONITORING":
			// Handle field monitoring asynchronously
			(async () => {
				try {
					console.log(
						"[CONTENT SCRIPT] 🔍 Starting field monitoring:",
						{ selector: message.selector, isPassword: message.isPassword }
					);
					
					// Try to find the field with retry logic (wait for dynamic content)
					let field: HTMLInputElement | HTMLTextAreaElement | null = null;
					let retries = 3;
					
					while (retries > 0 && !field) {
						field = document.querySelector(message.selector) as HTMLInputElement | HTMLTextAreaElement;
						
						if (!field && retries > 1) {
							// Wait a bit before retrying
							await new Promise(resolve => setTimeout(resolve, 500));
						}
						retries--;
					}
					
					if (!field) {
						console.log("[CONTENT SCRIPT] ℹ️ Field not found after retries:", message.selector);
						// Return success but indicate field wasn't found (non-critical)
						sendResponse({ success: true, fieldFound: false, error: "Field not found" });
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
							console.log(
								"[CONTENT SCRIPT] ✅ Field has input, notifying panel",
								{ hasValue: true, isPassword: message.isPassword }
							);
							
							// Send message to background (which will forward to panel)
							chrome.runtime.sendMessage({
								type: "FIELD_INPUT_DETECTED",
								selector: message.selector,
								value: message.isPassword ? "" : value, // Don't send password values
								isPassword: message.isPassword,
							}).catch(err => {
								console.warn("[CONTENT SCRIPT] Failed to send field input notification:", err);
							});
							
							// Clean up monitoring
							stopFieldMonitoring();
						}
					};
					
					// Blur event - when user tabs out or clicks elsewhere
					const blurHandler = () => {
						console.log("[CONTENT SCRIPT] 👋 Field blur detected");
						checkFieldAndNotify();
					};
					
					// Keydown event - when user presses Enter
					const keydownHandler = (e: KeyboardEvent) => {
						if (e.key === "Enter") {
							console.log("[CONTENT SCRIPT] ⏎ Enter key detected");
							checkFieldAndNotify();
						}
					};
					
					fieldMonitoringListeners = { blur: blurHandler, keydown: keydownHandler };
					
					// Attach listeners
					field.addEventListener("blur", blurHandler);
					field.addEventListener("keydown", keydownHandler);
					
					console.log("[CONTENT SCRIPT] ✅ Field monitoring started successfully");
					sendResponse({ success: true, fieldFound: true });
				} catch (error) {
					console.error("[CONTENT SCRIPT] ❌ Error starting field monitoring:", error);
					sendResponse({
						success: false,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			})();
			return true; // Keep channel open for async response

		case "STOP_FIELD_MONITORING":
			try {
				console.log("[CONTENT SCRIPT] 🛑 Stopping field monitoring");
				stopFieldMonitoring();
				sendResponse({ success: true });
			} catch (error) {
				sendResponse({
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
			break;

		case "UPDATE_FIELD_VALUE":
			// Handle real-time field value update from panel
			(async () => {
				try {
					console.log(
						"[CONTENT SCRIPT] 🔄 Updating field value:",
						{ selector: message.selector, valueLength: message.value?.length || 0 }
					);
					
					// Try to find the field with retry logic
					let field: HTMLInputElement | HTMLTextAreaElement | null = null;
					let retries = 3;
					
					while (retries > 0 && !field) {
						field = document.querySelector(message.selector) as HTMLInputElement | HTMLTextAreaElement;
						
						if (!field && retries > 1) {
							await new Promise(resolve => setTimeout(resolve, 300));
						}
						retries--;
					}
					
					if (!field) {
						console.log("[CONTENT SCRIPT] ⚠️ Field not found for update:", message.selector);
						sendResponse({ success: false, error: "Field not found" });
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
					
					console.log("[CONTENT SCRIPT] ✅ Field value updated successfully");
					sendResponse({ success: true });
				} catch (error) {
					console.error("[CONTENT SCRIPT] ❌ Error updating field value:", error);
					sendResponse({
						success: false,
						error: error instanceof Error ? error.message : String(error),
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
		monitoredField.removeEventListener("blur", fieldMonitoringListeners.blur);
		monitoredField.removeEventListener("keydown", fieldMonitoringListeners.keydown);
		console.log("[CONTENT SCRIPT] 🧹 Field monitoring listeners removed");
	}
	monitoredField = null;
	fieldMonitoringListeners = null;
}

/**
 * Get simplified DOM optimized for LLM consumption
 */
function getSimplifiedDOMFromPage() {
	console.log("Starting DOM simplification...");
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

	const endTime = performance.now();

	console.log("DOM Simplification complete:", {
		totalElements: allPageElements.length,
		interactiveElements: result.stats.interactiveElements,
		timeTaken: `${(endTime - startTime).toFixed(2)}ms`,
		htmlLength: result.html.length,
	});

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
