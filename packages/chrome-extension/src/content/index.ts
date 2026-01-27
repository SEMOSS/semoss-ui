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

// Listen for playground chat events
let isPlaygroundPage = false;

// Check if current page is playground
function checkIfPlayground() {
	// Check if URL contains playground patterns
	const url = window.location.href;
	isPlaygroundPage = url.includes("/room/") || url.includes("playground");

	if (isPlaygroundPage) {
		console.log("Playground page detected, enabling chat monitoring");
		setupPlaygroundListeners();
	}
}

// Check if extension context is still valid
function isExtensionContextValid(): boolean {
	try {
		// Try to access extension API - will throw if context is invalidated
		return !!chrome.runtime?.id;
	} catch (e) {
		return false;
	}
}

// Setup listeners for playground chat events
function setupPlaygroundListeners() {
	// Listen for response messages (AI output)
	window.addEventListener("playground-chat-response", ((
		event: CustomEvent,
	) => {
		console.log("Playground chat response:", event.detail);

		// Forward to extension background/panel
		chrome.runtime
			.sendMessage({
				type: "PLAYGROUND_CHAT_RESPONSE",
				data: event.detail,
			})
			.catch((err) => {
				console.log("Could not send to extension:", err);
			});
	}) as EventListener);

	// Listen for message submissions (for mode switching and command automation)
	window.addEventListener("playground-chat-submit", ((event: CustomEvent) => {
		console.log("Playground chat submit:", event.detail);

		// Forward to extension background/panel
		chrome.runtime
			.sendMessage({
				type: "PLAYGROUND_CHAT_SUBMIT",
				data: event.detail,
			})
			.catch((err) => {
				console.log("Could not send to extension:", err);
			});
	}) as EventListener);

	// Listen for Playwright script execution requests from Playground
	window.addEventListener("message", (event: MessageEvent) => {
		// Only accept messages from same origin
		if (event.origin !== window.location.origin) {
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
	});

	console.log("Playground chat listeners setup complete");
}

// Check on initial load
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

		default:
			console.warn("Unknown message type:", message.type);
	}

	return true; // Keep channel open for async response
});

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
