/**
 * DOM Simplification Module
 * Filters by visibility and interactivity during DOM traversal
 */

/**
 * Filter function for truthy values
 */
function truthyFilter<T>(x: T | null | undefined): x is T {
	return x !== null && x !== undefined;
}

/**
 * Check if element is interactive (from annotated DOM attributes)
 */
function isInteractive(element: HTMLElement): boolean {
	return (
		element.getAttribute("data-interactive") === "true" ||
		element.hasAttribute("role")
	);
}

/**
 * Check if element is visible (from annotated DOM attributes)
 */
function isVisible(element: HTMLElement): boolean {
	return element.getAttribute("data-visible") === "true";
}

/**
 * Generate simplified DOM by filtering visible and interactive elements
 */
function generateSimplifiedDOM(
	element: ChildNode,
	interactiveElements: HTMLElement[],
): ChildNode | null {
	// Handle text nodes
	if (element.nodeType === Node.TEXT_NODE && element.textContent?.trim()) {
		return document.createTextNode(`${element.textContent} `);
	}

	// Only process HTML elements
	if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
		return null;
	}

	// Check visibility - but always include INPUT/TEXTAREA/SELECT (they might be shown dynamically)
	const visible = isVisible(element as HTMLElement);
	const isImportantInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
		element.tagName,
	);

	if (!visible && !isImportantInput) return null;

	// Process children recursively
	let children = Array.from(element.childNodes)
		.map((c) => generateSimplifiedDOM(c, interactiveElements))
		.filter(truthyFilter);

	// Don't bother with text that is the direct child of the body
	if (element.tagName === "BODY") {
		children = children.filter((c) => c.nodeType !== Node.TEXT_NODE);
	}

	// Determine if we should include this node
	const interactive = isInteractive(element as HTMLElement);
	const hasLabel =
		element.hasAttribute("aria-label") || element.hasAttribute("name");
	const includeNode = interactive || hasLabel;

	// Skip non-interactive nodes with no children
	if (!includeNode && children.length === 0) return null;

	// Collapse non-interactive nodes with single child
	if (!includeNode && children.length === 1) {
		return children[0];
	}

	// Create container element
	const container = document.createElement(element.tagName);

	// Preserve important attributes including ORIGINAL data-id!
	const allowedAttributes = [
		"aria-label",
		"data-name",
		"name",
		"type",
		"placeholder",
		"value",
		"role",
		"title",
		"data-id", // CRITICAL: Preserve original element ID from annotated DOM!
		"data-interactive",
	];

	for (const attr of allowedAttributes) {
		if (element.hasAttribute(attr)) {
			container.setAttribute(attr, element.getAttribute(attr) as string);
		}
	}

	// Note: We don't modify interactiveElements here - it's managed by content script

	// Add children
	for (const child of children) {
		container.appendChild(child);
	}

	return container;
}

/**
 * Main entry point: Get simplified DOM from annotated HTML string
 */
export function getSimplifiedDOM(annotatedHTML: string): {
	html: string;
	elements: HTMLElement[];
	stats: { totalElements: number; interactiveElements: number };
} {
	// Parse the annotated HTML
	const parser = new DOMParser();
	const dom = parser.parseFromString(annotatedHTML, "text/html");

	const interactiveElements: HTMLElement[] = [];

	// Generate simplified DOM using optimized filtering approach
	const simplifiedDom = generateSimplifiedDOM(
		dom.documentElement,
		interactiveElements,
	) as HTMLElement;

	// Convert to HTML string
	let html = simplifiedDom ? simplifiedDom.outerHTML : "";

	// Apply character limit to avoid token overflow (15,000 chars ~= 4,000 tokens)
	const MAX_HTML_LENGTH = 15000;
	if (html.length > MAX_HTML_LENGTH) {
		console.warn(
			`HTML too long (${html.length} chars), truncating to ${MAX_HTML_LENGTH}`,
		);
		html =
			html.substring(0, MAX_HTML_LENGTH) +
			"\n<!-- ... DOM truncated for LLM token limits -->";
	}

	return {
		html,
		elements: interactiveElements,
		stats: {
			totalElements: interactiveElements.length,
			interactiveElements: interactiveElements.length,
		},
	};
}

/**
 * Get DOM statistics (legacy function)
 */
export function getDOMStats(html: string): {
	totalElements: number;
	interactiveElements: number;
	maxDepth: number;
} {
	const parser = new DOMParser();
	const dom = parser.parseFromString(html, "text/html");

	let totalElements = 0;
	let interactiveElements = 0;
	let maxDepth = 0;

	function traverse(element: Element, depth: number) {
		totalElements++;
		if (element.getAttribute("data-interactive") === "true") {
			interactiveElements++;
		}
		maxDepth = Math.max(maxDepth, depth);

		for (const child of Array.from(element.children)) {
			traverse(child, depth + 1);
		}
	}

	if (dom.documentElement) {
		traverse(dom.documentElement, 0);
	}

	return { totalElements, interactiveElements, maxDepth };
}
