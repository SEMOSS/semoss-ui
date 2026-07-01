import { initializeRPC } from "./rpc";
import { getDOMStats, getSimplifiedDOM } from "./simplifyDOM";

// Initialize RPC system for communication
initializeRPC();

const FLOATING_PANEL_WRAPPER_ID = "semoss-browser-automation-frame";
const FLOATING_PANEL_COLLAPSED_SIZE = 64;
const FLOATING_PANEL_EXPANDED_WIDTH = 340;
const FLOATING_PANEL_EXPANDED_HEIGHT = 560;
const FLOATING_PANEL_MARGIN = 16;
const FLOATING_PANEL_POSITION_STORAGE_KEY =
	"semoss-browser-automation-panel-position";

type FloatingPanelPosition = {
	left: number;
	top: number;
};

let annotatedElements: HTMLElement[] = [];
const elementIdToUniqueId: Map<number, string> = new Map();

// Field monitoring state
let monitoredField: HTMLInputElement | HTMLTextAreaElement | null = null;
let fieldMonitoringListeners: {
	blur: () => void;
	keydown: (e: KeyboardEvent) => void;
} | null = null;

// Listen for playground chat events
let isPlaygroundPage = false;
let playgroundListenersSetup = false; // Track if listeners have been setup
let floatingPanelFrame: HTMLIFrameElement | null = null;
let floatingPanelPosition: FloatingPanelPosition | null = null;
let floatingPanelHidden = false;

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

function getFloatingPanelSize() {
	if (!floatingPanelFrame) {
		return {
			width: FLOATING_PANEL_COLLAPSED_SIZE,
			height: FLOATING_PANEL_COLLAPSED_SIZE,
		};
	}

	return {
		width: floatingPanelFrame.offsetWidth || FLOATING_PANEL_COLLAPSED_SIZE,
		height:
			floatingPanelFrame.offsetHeight || FLOATING_PANEL_COLLAPSED_SIZE,
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
	const maxLeft = Math.max(
		FLOATING_PANEL_MARGIN,
		window.innerWidth - width - 8,
	);
	const maxTop = Math.max(
		FLOATING_PANEL_MARGIN,
		window.innerHeight - height - 8,
	);

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
		// Keep the default bottom-right position if storage is unavailable.
	}
}

async function ensureFloatingPanel() {
	if (floatingPanelFrame) {
		showFloatingPanel();
		return;
	}
	if (!isExtensionContextValid()) return;
	if (!document.documentElement || !document.body) return;

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
		const deltaX = Number(event.data.deltaX) || 0;
		const deltaY = Number(event.data.deltaY) || 0;
		const nextPosition =
			floatingPanelPosition ?? getDefaultFloatingPanelPosition();
		applyFloatingPanelPosition({
			left: nextPosition.left + deltaX,
			top: nextPosition.top + deltaY,
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

const handleAutomationBridgeMessage = (event: MessageEvent) => {
	// Only accept messages from this page or same-origin embedded tool UIs.
	if (event.origin !== window.location.origin) {
		return;
	}

	if (event.data?.type === "SMSS_EXTENSION_PING") {
		if (!isExtensionContextValid()) {
			return;
		}

		window.postMessage(
			{
				type: "SMSS_EXTENSION_PONG",
				timestamp: Date.now(),
			},
			window.location.origin,
		);

		return;
	}

	if (event.data?.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
		if (!isExtensionContextValid()) {
			console.warn("[CONTENT SCRIPT] Extension context invalidated!");
			alert(
				"Chrome Extension was reloaded. Please refresh this page to execute Playwright scripts.",
			);
			return;
		}

		void ensureFloatingPanel().then(() => {
			chrome.runtime
				.sendMessage({
					type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
					script: event.data.script,
				})
				.catch(() => {
					console.warn(
						"[CONTENT] Failed to send Playwright script to extension runtime",
					);
				});
		});
	}
};

window.addEventListener("message", handleAutomationBridgeMessage);

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
	switch (message.type) {
		case "TOGGLE_FLOATING_PANEL": {
			const wasFloatingPanelHidden = floatingPanelHidden;
			void ensureFloatingPanel().then(() => {
				if (wasFloatingPanelHidden) {
					showFloatingPanel();
					sendResponse({ success: true });
					return;
				}

				floatingPanelFrame?.contentWindow?.postMessage(
					{ type: "SMSS_FLOATING_PANEL_TOGGLE" },
					"*",
				);
				sendResponse({ success: true });
			});
			break;
		}

		case "UPDATE_FLOATING_PANEL_STATUS":
			void (
				floatingPanelFrame ? Promise.resolve() : ensureFloatingPanel()
			).then(() => {
				floatingPanelFrame?.contentWindow?.postMessage(
					{
						type: "SMSS_FLOATING_PANEL_EXTERNAL_STATUS",
						status: message.status,
					},
					"*",
				);
			});
			sendResponse({ success: true });
			break;

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
			// Post message to window so playground can receive it
			window.postMessage(
				{
					type: "SMSS_SCRIPT_EXECUTION_COMPLETE",
					success: message.success,
					message: message.message,
				},
				window.location.origin,
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PANEL_OPENED":
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
			window.postMessage(
				{
					type: "SMSS_EXTENSION_CLOSED",
					timestamp: Date.now(),
				},
				window.location.origin,
			);

			sendResponse({ success: true });
			break;

		case "SMSS_EXTENSION_PONG":
			// Forward pong response from panel to playground window
			window.postMessage(
				{
					type: "SMSS_EXTENSION_PONG",
					timestamp: message.timestamp || Date.now(),
				},
				window.location.origin,
			);

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
