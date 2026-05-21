//  Format a selected fragment + user question as one line for the main input: "<selection>" - <question>
export function formatInlineAskPair(
	selection: string,
	question: string,
): string {
	const flat = selection.replace(/\s+/g, " ").trim();
	return `"${flat}" - ${question.trim()}`;
}

type HighlightCtor = new (range: Range) => unknown;
type HighlightRegistry = {
	set(key: string, value: unknown): void;
	delete(key: string): void;
};

/**
 * Paint a CSS Custom Highlight over the given Range under `name`. Returns a
 * cleanup function that removes the highlight.
 */
export function paintHighlight(name: string, range: Range): () => void {
	if (typeof window === "undefined") return () => {};
	const Ctor = (window as unknown as { Highlight?: HighlightCtor }).Highlight;
	const reg = (window.CSS as unknown as { highlights?: HighlightRegistry })
		.highlights;
	if (!Ctor || !reg) return () => {};
	reg.set(name, new Ctor(range));
	return () => reg.delete(name);
}

export interface ActiveSelectionInfo {
	/** Plain-text content of the selection. */
	text: string;
	/** Cloned Range — survives later collapses; used to re-apply / anchor. */
	range: Range;
}

/**
 * Read the current window selection and return its text + a cloned Range when
 * the selection is fully contained inside an element matching the given
 * `[data-attr]` (e.g. `data-inline-ask`). Returns `null` if there's no
 * selection, the selection is collapsed, the selection is whitespace-only, or
 * the selection isn't inside the scoped attribute.
 *
 * The Range is cloned so subsequent user clicks (which may collapse the live
 * selection) don't mutate the value we hold and so we can re-apply it.
 */
export function getActiveSelectionWithinAttr(
	attr: string,
): ActiveSelectionInfo | null {
	if (typeof window === "undefined") return null;
	const sel = window.getSelection();
	if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
	const range = sel.getRangeAt(0);
	const node =
		range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
			? (range.commonAncestorContainer as Element)
			: range.commonAncestorContainer.parentElement;
	if (!node?.closest(`[${attr}="true"]`)) return null;
	const text = sel.toString();
	if (!text.trim()) return null;
	return { text, range: range.cloneRange() };
}
