/** Return the caret's painted rectangle without changing the DOM selection. */
function getCaretRect(range: Range): DOMRect | undefined {
	const painted = Array.from(range.getClientRects()).find(
		(rect) => rect.height > 0,
	);
	if (painted) return painted;

	const node = range.startContainer;
	const offset = range.startOffset;
	if (node.nodeType === Node.TEXT_NODE && node.textContent?.length) {
		const adjacent = range.cloneRange();
		const start = Math.min(offset, node.textContent.length - 1);
		adjacent.setStart(node, start);
		adjacent.setEnd(node, start + 1);
		return Array.from(adjacent.getClientRects()).find(
			(rect) => rect.height > 0,
		);
	}
	if (node instanceof HTMLElement) {
		// Lexical places the caret before a trailing <br> on an empty final
		// line. Collapsed element ranges do not paint a caret rectangle.
		const next = node.childNodes.item(offset);
		const previous = node.childNodes.item(offset - 1);
		const neighbor = next ?? previous;
		if (neighbor) {
			const adjacent = range.cloneRange();
			adjacent.selectNode(neighbor);
			const rects = Array.from(adjacent.getClientRects()).filter(
				(rect) => rect.height > 0,
			);
			const rect = next ? rects[0] : rects.at(-1);
			if (rect) return rect;
		}
		if (!node.textContent) {
			const rect = node.getBoundingClientRect();
			if (rect.height > 0) return rect;
		}
	}
	return undefined;
}

/**
 * Check the first/last rendered line, including soft wraps and empty paragraphs.
 * Missing layout information leaves native arrow behavior intact.
 */
export function isAtEditorLineBoundary(
	root: HTMLElement,
	direction: "up" | "down",
): boolean {
	const selection = root.ownerDocument.getSelection();
	if (
		!selection?.isCollapsed ||
		!selection.rangeCount ||
		!selection.anchorNode ||
		!root.contains(selection.anchorNode)
	) {
		return false;
	}
	const caret = getCaretRect(selection.getRangeAt(0));
	if (!caret) return false;
	const style = root.ownerDocument.defaultView?.getComputedStyle(root);
	const lineHeight =
		Number.parseFloat(style?.lineHeight ?? "") ||
		Number.parseFloat(style?.fontSize ?? "") * 1.5;
	if (!lineHeight) return false;

	const contents = root.ownerDocument.createRange();
	contents.selectNodeContents(root);
	// Ranges include enclosing block rectangles as well as individual text lines.
	// Ignore tall blocks: their edges are not caret positions in multiline text.
	const lines = Array.from(contents.getClientRects()).filter(
		(rect) => rect.height > 0 && rect.height <= lineHeight * 1.5,
	);
	if (!lines.length) return false;
	const center = (caret.top + caret.bottom) / 2;
	return direction === "up"
		? center < Math.min(...lines.map((rect) => rect.top)) + lineHeight
		: center > Math.max(...lines.map((rect) => rect.bottom)) - lineHeight;
}
