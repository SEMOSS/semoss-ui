/**
 * EventRecorder Class
 * Captures DOM events and converts them to RecordedActions
 * Based on reference browser-extension-to-capture-flow-main implementation
 */

import {
	getShadowDOMSelector,
	isInShadowDOM,
	selectSelectorValue,
} from "../services/selectorService";
import type { DOMEventType, EventMessage } from "./types";

/**
 * EventRecorder captures user interactions on the page
 * Registers event listeners and sends formatted messages to background script
 */
export class EventRecorder {
	private previousEventItem: { timeStamp: number } | null = null;
	private isInitialized = false;

	/**
	 * Initialize event listeners
	 * Only called once per recording session to prevent duplicate listeners
	 */
	onInit(): void {
		// Prevent duplicate initialization
		if (
			this.isInitialized ||
			(window as Window & { __semossRecorderInitialized?: boolean })
				.__semossRecorderInitialized
		) {
			console.log("[EventRecorder] Already initialized, skipping");
			return;
		}

		console.log("[EventRecorder] Initializing event listeners");

		// Register all event listeners with capture phase (third parameter = true)
		// Capture phase ensures extension captures events before page handlers
		const events: DOMEventType[] = [
			"click",
			"dblclick",
			"change",
			"blur", // Captures when user leaves input field (better than keyup for text input)
			"select",
			"submit",
			"load",
			"unload",
		];

		events.forEach((eventType) => {
			document.addEventListener(
				eventType,
				this.handleEvent.bind(this),
				true, // Use capture phase
			);
		});

		// Mark as initialized
		this.isInitialized = true;
		(
			window as Window & { __semossRecorderInitialized?: boolean }
		).__semossRecorderInitialized = true;
	}

	/**
	 * Cleanup event listeners when recording stops
	 */
	cleanup(): void {
		console.log("[EventRecorder] Cleaning up event listeners");

		const events: DOMEventType[] = [
			"click",
			"dblclick",
			"change",
			"blur",
			"select",
			"submit",
			"load",
			"unload",
		];

		events.forEach((eventType) => {
			document.removeEventListener(
				eventType,
				this.handleEvent.bind(this),
				true,
			);
		});

		this.isInitialized = false;
		(
			window as Window & { __semossRecorderInitialized?: boolean }
		).__semossRecorderInitialized = false;
		this.previousEventItem = null;
	}

	/**
	 * Handle captured events
	 */
	private handleEvent(event: Event): void {
		try {
			this.handleEventResponse(event);
		} catch (error) {
			console.error("[EventRecorder] Error handling event:", error);
		}
	}

	/**
	 * Process event and send to background if valid
	 */
	private handleEventResponse(event: Event): void {
		// Deduplication: Skip if same event timestamp as previous
		if (
			this.previousEventItem &&
			this.previousEventItem.timeStamp === event.timeStamp
		) {
			return;
		}

		const target = event.target as HTMLElement;
		if (!target || !target.tagName) {
			return;
		}

		// Filter out extension's own UI elements
		if (this.isExtensionElement(target)) {
			return;
		}

		// Handle page navigation events
		if (event.type === "load" || event.type === "unload") {
			this.handleNavigationEvent(event);
			return;
		}

		// Generate selectors for the element
		const selectors = selectSelectorValue(target);
		if (!selectors || selectors.length === 0) {
			return;
		}

		// Handle Shadow DOM elements
		if (isInShadowDOM(target)) {
			const shadowSelector = getShadowDOMSelector(target);
			if (shadowSelector) {
				selectors.unshift(shadowSelector);
			}
		}

		// Extract value from element based on type
		const value = this.extractActualValue(target, event);

		// Build event message
		const eventMessage: EventMessage = {
			selector: selectors,
			value: value,
			tagName: target.tagName,
			action: event.type as DOMEventType,
			timeStamp: event.timeStamp,
		};

		// Add event-specific data
		if (event instanceof MouseEvent) {
			eventMessage.clientX = event.clientX;
			eventMessage.clientY = event.clientY;
		}

		if (event instanceof KeyboardEvent) {
			eventMessage.keyCode = event.keyCode;
		}

		// Add element type information
		eventMessage.eventTypeAttr = this.getElementType(target);

		// Add href for links
		if (target.tagName === "A") {
			eventMessage.href = (target as HTMLAnchorElement).href;
		}

		// Add checked state for checkboxes/radios
		if (target.tagName === "INPUT") {
			const input = target as HTMLInputElement;
			if (input.type === "checkbox" || input.type === "radio") {
				eventMessage.checked = input.checked;
			}
		}

		// Add current URL
		eventMessage.url = window.location.href;

		// Send to background script
		this.sendEventToBackground(eventMessage);

		// Update previous event for deduplication
		this.previousEventItem = { timeStamp: event.timeStamp };
	}

	/**
	 * Check if element belongs to extension UI
	 */
	private isExtensionElement(element: HTMLElement): boolean {
		// Check if element or any parent has extension marker
		let current: HTMLElement | null = element;
		while (current) {
			// Check for extension-specific attributes
			if (
				current.id?.includes("semoss-recorder") ||
				current.id?.includes("testbot-") ||
				current.className?.includes("semoss-recorder") ||
				current.getAttribute("data-extension-id")
			) {
				return true;
			}
			current = current.parentElement;
		}
		return false;
	}

	/**
	 * Extract value from element based on its type
	 * Handles inputs, selects, checkboxes, radio buttons, rich text editors, etc.
	 */
	private extractActualValue(
		element: HTMLElement,
		event: Event,
	): string | boolean | string[] {
		const tagName = element.tagName;

		// Rich text editors (contentEditable)
		if (element.isContentEditable) {
			return element.innerHTML || element.textContent;
		}

		// Handle SELECT elements
		if (tagName === "SELECT") {
			const select = element as HTMLSelectElement;

			// Multi-select: return array of values
			if (select.multiple) {
				return Array.from(select.selectedOptions).map(
					(opt) => opt.value || opt.text,
				);
			}

			// Single select: return selected value
			const selectedOption = select.selectedOptions[0];
			return selectedOption
				? selectedOption.value || selectedOption.text
				: "";
		}

		// Handle INPUT elements
		if (tagName === "INPUT") {
			const input = element as HTMLInputElement;
			const type = input.type?.toLowerCase();

			// Checkbox/Radio: return checked state
			if (type === "checkbox" || type === "radio") {
				return input.checked;
			}

			// Date/Time inputs: add delay to ensure value is captured
			if (
				type === "date" ||
				type === "time" ||
				type === "datetime-local"
			) {
				setTimeout(() => {
					// Re-send event with updated value after 500ms
					this.sendEventToBackground({
						selector: selectSelectorValue(element),
						value: input.value,
						tagName: tagName,
						action: event.type as DOMEventType,
						timeStamp: event.timeStamp + 500,
						eventTypeAttr: type,
						url: window.location.href,
					});
				}, 500);
				return input.value;
			}

			// Standard input: return value
			return input.value;
		}

		// Handle TEXTAREA
		if (tagName === "TEXTAREA") {
			return (element as HTMLTextAreaElement).value;
		}

		// Clickable elements: return text content
		if (
			tagName === "BUTTON" ||
			tagName === "A" ||
			tagName === "LABEL" ||
			event.type === "click" ||
			event.type === "dblclick"
		) {
			return (
				element.textContent?.trim() || element.innerText?.trim() || ""
			);
		}

		// Check for data attributes as fallback
		const dataValue =
			element.getAttribute("data-value") ||
			element.getAttribute("data-text") ||
			element.getAttribute("value");

		if (dataValue) {
			return dataValue;
		}

		// Default: return text content
		return element.textContent?.trim() || "";
	}

	/**
	 * Determine element type for better action classification
	 */
	private getElementType(element: HTMLElement): string {
		const tagName = element.tagName;

		if (tagName === "INPUT") {
			return (element as HTMLInputElement).type || "text";
		}

		if (tagName === "BUTTON") {
			return "button";
		}

		if (tagName === "A") {
			return "link";
		}

		if (tagName === "SELECT") {
			return "select";
		}

		if (tagName === "TEXTAREA") {
			return "textarea";
		}

		// Check role attribute
		const role = element.getAttribute("role");
		if (role) {
			return role;
		}

		return tagName.toLowerCase();
	}

	/**
	 * Handle navigation events (page load/unload)
	 */
	private handleNavigationEvent(event: Event): void {
		if (event.type === "load") {
			// Page finished loading
			this.sendNavigationEvent(window.location.href);
		} else if (event.type === "unload") {
			// Page is being unloaded (navigation away)
			// Note: This might not always fire reliably
			console.log("[EventRecorder] Page unload detected");
		}
	}

	/**
	 * Send navigation event to background
	 */
	private sendNavigationEvent(url: string): void {
		const message: EventMessage = {
			selector: [],
			value: url,
			tagName: "NAVIGATE",
			action: "load",
			timeStamp: Date.now(),
			url: url,
		};

		this.sendEventToBackground(message);
	}

	/**
	 * Send event message to background script
	 */
	private sendEventToBackground(message: EventMessage): void {
		try {
			chrome.runtime.sendMessage({
				type: "EVENT",
				data: message,
				tabId: chrome.devtools?.inspectedWindow?.tabId,
				timestamp: Date.now(),
			});
		} catch (error) {
			console.error(
				"[EventRecorder] Failed to send message to background:",
				error,
			);
		}
	}
}

/**
 * Create and initialize EventRecorder instance
 */
export function createEventRecorder(): EventRecorder {
	return new EventRecorder();
}
