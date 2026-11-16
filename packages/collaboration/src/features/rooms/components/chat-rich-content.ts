import { $generateHtmlFromNodes } from "@lexical/html";
import { $isTableNode } from "@lexical/table";
import DOMPurify from "dompurify";
import {
	$getRoot,
	$isElementNode,
	type LexicalEditor,
	type LexicalNode,
} from "lexical";

export const CHAT_HTML_FORMAT = "html-v1" as const;
export const CHAT_HTML_MAX_BYTES = 262144;
export const CHAT_HTML_TAGS = [
	"p",
	"br",
	"strong",
	"em",
	"u",
	"s",
	"blockquote",
	"ul",
	"ol",
	"li",
	"pre",
	"code",
	"table",
	"caption",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"th",
	"td",
];

const CELL_BLOCK_TAGS = new Set([
	"P",
	"DIV",
	"BLOCKQUOTE",
	"UL",
	"OL",
	"LI",
	"PRE",
]);

/** Remove source-layout whitespace before pre-wrap can turn it into empty editor paragraphs. */
function normalizeClipboardCellWhitespace(cell: HTMLElement): void {
	function visit(
		element: HTMLElement,
		inheritedPreserve: boolean,
		inFlow: boolean,
	): void {
		const whiteSpace = element.style.whiteSpace;
		const preserve =
			whiteSpace === "normal" || whiteSpace === "nowrap"
				? false
				: ["pre", "pre-wrap", "pre-line", "break-spaces"].includes(
						whiteSpace,
					) ||
					element.tagName === "PRE" ||
					inheritedPreserve;
		const flow =
			inFlow ||
			CELL_BLOCK_TAGS.has(element.tagName) ||
			(element === cell && element.children.length > 0);
		const hasBlocks = [...element.children].some((child) =>
			CELL_BLOCK_TAGS.has(child.tagName),
		);
		for (const node of [...element.childNodes]) {
			if (node.nodeType === Node.TEXT_NODE && !preserve) {
				const text = node.textContent ?? "";
				const hasLineWhitespace = /[\t\r\n\f]/.test(text);
				if (
					/^[\t\r\n\f ]+$/.test(text) &&
					(hasBlocks ||
						(flow &&
							hasLineWhitespace &&
							(!node.previousSibling || !node.nextSibling)))
				) {
					node.remove();
				} else if (flow && hasLineWhitespace) {
					node.textContent = text.replace(/[\t\r\n\f ]+/g, " ");
				}
			} else if (node instanceof HTMLElement) {
				visit(node, preserve, flow);
			}
		}
	}
	visit(cell, false, false);
}

/** Sanitize restricted semantic message HTML before import, submission, or display. */
export function sanitizeChatHtml(
	source: string,
	input: "message" | "clipboard" = "message",
): string {
	if (new TextEncoder().encode(source).length > CHAT_HTML_MAX_BYTES)
		throw new Error(
			"This table is too large. Attach the source document instead.",
		);
	const safe = DOMPurify.sanitize(source, {
		ALLOWED_TAGS: [...CHAT_HTML_TAGS, "b", "i", "strike", "div", "span"],
		// Read only white-space semantics during clipboard normalization; all styles
		// are removed below before the fragment can enter the editor or renderer.
		ALLOWED_ATTR: [
			"rowspan",
			"colspan",
			"scope",
			...(input === "clipboard" ? ["style"] : []),
		],
		ALLOW_DATA_ATTR: false,
		ALLOW_ARIA_ATTR: false,
	});
	const doc = new DOMParser().parseFromString(safe, "text/html");
	if (doc.querySelector("table table"))
		throw new Error(
			"Nested tables cannot be pasted. Attach the source document instead.",
		);
	let count = 0;
	function visit(node: Node, depth: number): void {
		if (++count > 20000 || depth > 32)
			throw new Error(
				"This document is too complex to paste. Attach it instead.",
			);
		for (const child of node.childNodes) visit(child, depth + 1);
	}
	visit(doc.body, 0);
	if (input === "clipboard")
		for (const cell of doc.querySelectorAll<HTMLElement>("td,th"))
			normalizeClipboardCellWhitespace(cell);
	let cells = 0;
	for (const element of [...doc.body.querySelectorAll("*")]) {
		const tag = element.tagName.toLowerCase();
		if (tag === "td" || tag === "th") {
			cells +=
				Number(element.getAttribute("rowspan") ?? 1) *
				Number(element.getAttribute("colspan") ?? 1);
			for (const attr of ["colspan", "rowspan"]) {
				const value = element.getAttribute(attr);
				if (
					value &&
					(!/^\d+$/.test(value) ||
						Number(value) < 1 ||
						Number(value) > 100)
				)
					throw new Error(
						"This table has unsupported merged cells. Attach the source document instead.",
					);
				if (value && Number(value) === 1) element.removeAttribute(attr);
			}
		}
		for (const attribute of [...element.attributes]) {
			if (
				!(
					(tag === "td" || tag === "th") &&
					["colspan", "rowspan"].includes(attribute.name)
				) &&
				!(
					tag === "th" &&
					attribute.name === "scope" &&
					["row", "col", "rowgroup", "colgroup"].includes(
						attribute.value,
					)
				)
			)
				element.removeAttribute(attribute.name);
		}
		if (["b", "i", "strike", "div"].includes(tag)) {
			const replacement = doc.createElement(
				(
					{ b: "strong", i: "em", strike: "s", div: "p" } as Record<
						string,
						string
					>
				)[tag],
			);
			replacement.append(...element.childNodes);
			element.replaceWith(replacement);
		} else if (tag === "span") element.replaceWith(...element.childNodes);
	}
	if (cells > 5000)
		throw new Error(
			"This table has too many cells. Attach the source document instead.",
		);
	if ((doc.body.textContent?.length ?? 0) > 100000)
		throw new Error(
			"This document is too large to paste. Attach it instead.",
		);
	const result = doc.body.innerHTML;
	if (new TextEncoder().encode(result).length > CHAT_HTML_MAX_BYTES)
		throw new Error(
			"This table is too large. Attach the source document instead.",
		);
	return result;
}

/** Detect structural drafts using the current Lexical document, never stale paste metadata. */
export function $hasChatTable(): boolean {
	function hasTable(node: LexicalNode): boolean {
		return (
			$isTableNode(node) ||
			($isElementNode(node) && node.getChildren().some(hasTable))
		);
	}
	return hasTable($getRoot());
}

/** Export the edited document as the same restricted fragment used for model and display. */
export function exportChatHtml(editor: LexicalEditor): string | undefined {
	return editor
		.getEditorState()
		.read(() =>
			$hasChatTable()
				? sanitizeChatHtml($generateHtmlFromNodes(editor))
				: undefined,
		);
}

/** Preserve cell whitespace during import without accepting clipboard styling. */
export function chatImportDocument(html: string): Document {
	const doc = new DOMParser().parseFromString(
		sanitizeChatHtml(html, "clipboard"),
		"text/html",
	);
	if (doc.querySelector('th[scope="rowgroup"], th[scope="colgroup"]'))
		throw new Error(
			"Grouped headers cannot be pasted faithfully. Attach the source document instead.",
		);
	for (const cell of doc.querySelectorAll<HTMLElement>("td,th"))
		cell.style.whiteSpace = "pre-wrap";
	// Lexical tables contain rows only; keep captions as adjacent, editable prose.
	for (const caption of doc.querySelectorAll("caption")) {
		const paragraph = doc.createElement("p");
		paragraph.append(...caption.childNodes);
		caption.parentElement?.before(paragraph);
		caption.remove();
	}
	return doc;
}
