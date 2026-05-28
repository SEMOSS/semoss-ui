/**
 * Selector Service
 * Generates multiple diverse selectors ordered by stability for DOM resilience
 * Based on reference browser-extension-to-capture-flow-main implementation
 */

import { finder } from "@medv/finder";
import type { SelectorArray } from "../recorder/types";

/**
 * Test automation attribute priority chain
 * Higher priority = more stable selector
 */
const TEST_ATTRIBUTES = [
	"data-testid",
	"data-qa",
	"data-test",
	"data-cy",
	"data-automation-id",
	"data-test-id",
];

/**
 * Semantic attributes that provide stable selectors
 */
const SEMANTIC_ATTRIBUTES = [
	"name",
	"aria-label",
	"aria-labelledby",
	"placeholder",
	"title",
	"alt",
	"role",
];

/**
 * Generates multiple selectors ordered by stability (highest to lowest)
 *
 * Priority Order:
 * 1. Test automation attributes (data-testid, data-qa, etc.)
 * 2. Combined XPath with multiple attributes
 * 3. Semantic attributes (name, aria-label, placeholder)
 * 4. Stable ID selectors
 * 5. Text content matching (for buttons/links)
 * 6. Relative XPath (context-based)
 * 7. Class-based CSS (using @medv/finder)
 * 8. Absolute XPath (last resort)
 *
 * @param element - Target DOM element
 * @returns Array of selectors ordered by stability
 */
export function generateMultipleSelectors(element: Element): SelectorArray {
	const selectors: string[] = [];

	// 1. Test Automation Attributes (Highest Priority)
	const testAttrSelector = getTestAttributeSelector(element);
	if (testAttrSelector) {
		selectors.push(testAttrSelector);
	}

	// 2. Combined XPath (Multiple attributes)
	const combinedXPath = getCombinedXPath(element);
	if (combinedXPath) {
		selectors.push(combinedXPath);
	}

	// 3. Semantic Attributes
	const semanticSelectors = getSemanticSelectors(element);
	selectors.push(...semanticSelectors);

	// 4. ID-based Selectors
	const idSelector = getIdSelector(element);
	if (idSelector) {
		selectors.push(idSelector);
	}

	// 5. Text Content Matching
	const textSelector = getTextContentSelector(element);
	if (textSelector) {
		selectors.push(textSelector);
	}

	// 6. Relative XPath
	const relativeXPath = getRelativeXPath(element);
	if (relativeXPath) {
		selectors.push(relativeXPath);
	}

	// 7. Class-based CSS (using @medv/finder)
	try {
		const finderSelector = finder(element, {
			seedMinLength: 3,
			optimizedMinLength: 2,
		});
		if (finderSelector && !selectors.includes(finderSelector)) {
			selectors.push(finderSelector);
		}
	} catch (_e) {
		// Finder may fail on certain elements, continue without it
	}

	// 8. Absolute XPath (Fallback)
	const absoluteXPath = getAbsoluteXPath(element);
	if (absoluteXPath) {
		selectors.push(absoluteXPath);
	}

	// Deduplicate while preserving order
	return Array.from(new Set(selectors));
}

/**
 * Returns the single best selector for an element
 * @param element - Target DOM element
 * @returns Best selector string
 */
export function getSelector(element: Element): string {
	const selectors = generateMultipleSelectors(element);
	return selectors[0] || getAbsoluteXPath(element) || "body";
}

/**
 * Returns array of selectors for self-healing attempts
 * Alias for generateMultipleSelectors
 */
export function selectSelectorValue(element: Element): SelectorArray {
	return generateMultipleSelectors(element);
}

/**
 * Get selector based on test automation attributes
 */
function getTestAttributeSelector(element: Element): string | null {
	for (const attr of TEST_ATTRIBUTES) {
		const value = element.getAttribute(attr);
		if (value) {
			// Return as CSS attribute selector
			return `[${attr}="${escapeAttributeValue(value)}"]`;
		}
	}
	return null;
}

/**
 * Get combined XPath with multiple attributes for uniqueness
 */
function getCombinedXPath(element: Element): string | null {
	const tagName = element.tagName.toLowerCase();
	const attributes: string[] = [];

	// Collect meaningful attributes
	for (const attr of SEMANTIC_ATTRIBUTES) {
		const value = element.getAttribute(attr);
		if (value) {
			attributes.push(`@${attr}=${xpathEscape(value)}`);
		}
	}

	// Include type for inputs
	if (tagName === "input") {
		const type = element.getAttribute("type");
		if (type) {
			attributes.push(`@type=${xpathEscape(type)}`);
		}
	}

	// Need at least 2 attributes for combined XPath to be useful
	if (attributes.length >= 2) {
		return `//${tagName}[${attributes.join(" and ")}]`;
	}

	return null;
}

/**
 * Get selectors based on semantic attributes
 */
function getSemanticSelectors(element: Element): string[] {
	const selectors: string[] = [];

	for (const attr of SEMANTIC_ATTRIBUTES) {
		const value = element.getAttribute(attr);
		if (value) {
			// CSS attribute selector
			selectors.push(`[${attr}="${escapeAttributeValue(value)}"]`);

			// XPath version (more specific with tag)
			const tagName = element.tagName.toLowerCase();
			selectors.push(`//${tagName}[@${attr}=${xpathEscape(value)}]`);
		}
	}

	return selectors;
}

/**
 * Get ID-based selector
 */
function getIdSelector(element: Element): string | null {
	const id = element.getAttribute("id");
	if (id && /^[a-zA-Z][\w-]*$/.test(id)) {
		// Valid ID that can use # notation
		return `#${id}`;
	} else if (id) {
		// Invalid ID characters, use attribute selector
		return `[id="${escapeAttributeValue(id)}"]`;
	}
	return null;
}

/**
 * Get selector based on visible text content
 * Useful for buttons, links, labels
 */
function getTextContentSelector(element: Element): string | null {
	const tagName = element.tagName.toLowerCase();

	// Only use text selectors for specific elements
	if (!["button", "a", "label", "span", "div"].includes(tagName)) {
		return null;
	}

	const text = element.textContent?.trim();
	if (!text || text.length > 50) {
		// Skip empty or very long text
		return null;
	}

	// XPath with exact text match
	if (text.length < 30) {
		return `//${tagName}[text()=${xpathEscape(text)}]`;
	}

	// XPath with contains for longer text
	return `//${tagName}[contains(text(), ${xpathEscape(text.substring(0, 20))})]`;
}

/**
 * Get relative XPath using stable parent anchor
 */
function getRelativeXPath(element: Element): string | null {
	// Find nearest parent with stable ID or test attribute
	let parent = element.parentElement;
	let depth = 0;
	const maxDepth = 3;

	while (parent && depth < maxDepth) {
		// Check if parent has stable identifier
		const parentId = parent.getAttribute("id");
		const parentTestAttr = TEST_ATTRIBUTES.find((attr) =>
			parent.getAttribute(attr),
		);

		if (parentId || parentTestAttr) {
			// Build relative path from this anchor
			const anchorSelector = parentId
				? `[@id="${escapeAttributeValue(parentId)}"]`
				: `[@${parentTestAttr}="${escapeAttributeValue(parent.getAttribute(parentTestAttr) ?? "")}"]`;

			const relativePath = getPathFromAncestor(element, parent);
			return `//${parent.tagName.toLowerCase()}${anchorSelector}${relativePath}`;
		}

		parent = parent.parentElement;
		depth++;
	}

	return null;
}

/**
 * Get path from ancestor element to target
 */
function getPathFromAncestor(element: Element, ancestor: Element): string {
	const path: string[] = [];
	let current: Element | null = element;

	while (current && current !== ancestor) {
		const tagName = current.tagName.toLowerCase();
		const siblings = Array.from(
			current.parentElement?.children || [],
		).filter((el) => el.tagName === current?.tagName);

		if (siblings.length > 1) {
			const index = siblings.indexOf(current) + 1;
			path.unshift(`/${tagName}[${index}]`);
		} else {
			path.unshift(`/${tagName}`);
		}

		current = current.parentElement;
	}

	return path.join("");
}

/**
 * Get absolute XPath (least stable, last resort)
 */
function getAbsoluteXPath(element: Element): string {
	const segments: string[] = [];
	let current: Element | null = element;

	while (current && current.nodeType === Node.ELEMENT_NODE) {
		const tagName = current.tagName.toLowerCase();

		if (current.parentElement) {
			const siblings = Array.from(current.parentElement.children).filter(
				(el) => el.tagName === current?.tagName,
			);

			if (siblings.length > 1) {
				const index = siblings.indexOf(current) + 1;
				segments.unshift(`${tagName}[${index}]`);
			} else {
				segments.unshift(tagName);
			}
		} else {
			segments.unshift(tagName);
		}

		current = current.parentElement;
	}

	return `/${segments.join("/")}`;
}

/**
 * Check if element is inside Shadow DOM
 */
export function isInShadowDOM(element: Element): boolean {
	return element.getRootNode() !== document;
}

/**
 * Get shadow-piercing selector if element is in Shadow DOM
 */
export function getShadowDOMSelector(element: Element): string | null {
	if (!isInShadowDOM(element)) {
		return null;
	}

	const root = element.getRootNode() as ShadowRoot;
	const host = root.host;

	if (!host) {
		return null;
	}

	// Get selector for host
	const hostSelector = getSelector(host);

	// Get selector for element within shadow root
	const shadowSelector = getSelector(element);

	// Combine with shadow-piercing combinator
	return `${hostSelector}::shadow-piercing>>${shadowSelector}`;
}

/**
 * Escape attribute value for CSS selector
 */
function escapeAttributeValue(value: string): string {
	return value.replace(/"/g, '\\"');
}

/**
 * Escape value for XPath expression
 * Handles quotes and apostrophes properly
 */
function xpathEscape(value: string): string {
	if (!value.includes("'")) {
		return `'${value}'`;
	} else if (!value.includes('"')) {
		return `"${value}"`;
	} else {
		// Value contains both quotes, use concat
		const parts = value.split("'").map((part) => `'${part}'`);
		return `concat(${parts.join(', "\'", ')})`;
	}
}

/**
 * Clean selector for better readability
 * Converts [id="x"] to #x where possible
 */
export function cleanSelector(selector: string): string {
	// Convert [id="simple-id"] to #simple-id
	const idMatch = selector.match(/^\[id="([a-zA-Z][\w-]*)"\]$/);
	if (idMatch) {
		return `#${idMatch[1]}`;
	}

	return selector;
}
