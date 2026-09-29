import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isTextNode,
	CLEAR_HISTORY_COMMAND,
	type HTMLConfig,
	type LexicalEditor,
	ParagraphNode,
	TextNode,
} from "lexical";
import { sanitizeDraftHtml } from "./email-html";

export const EMAIL_NODES = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	LinkNode,
	AutoLinkNode,
	TableNode,
	TableRowNode,
	TableCellNode,
];
export const EMAIL_THEME = {
	paragraph: "my-1",
	heading: {
		h1: "font-bold text-2xl",
		h2: "font-bold text-xl",
		h3: "font-bold text-lg",
	},
	quote: "border-l-2 border-border pl-3",
	list: { ul: "list-disc pl-6", ol: "list-decimal pl-6", listitem: "my-1" },
	link: "text-primary underline",
	text: {
		bold: "font-bold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
	},
	table: "border-collapse my-2",
	tableScrollableWrapper: "max-w-full overflow-x-auto",
	tableCell: "border border-border min-w-20 p-2",
	tableCellHeader: "bg-muted font-bold",
	tableSelection: "bg-accent",
	tableCellSelected: "bg-accent",
};

/** Retain supported text colors and sizes when importing sanitized HTML. */
export const EMAIL_HTML_CONFIG: HTMLConfig = {
	import: Object.fromEntries(
		[
			"span",
			"b",
			"strong",
			"i",
			"em",
			"u",
			"p",
			"h1",
			"h2",
			"h3",
			"blockquote",
		].map((tag) => [
			tag,
			(element: HTMLElement) => {
				const nodeType =
					tag === "p"
						? ParagraphNode
						: tag === "blockquote"
							? QuoteNode
							: /^h[1-3]$/.test(tag)
								? HeadingNode
								: TextNode;
				const original = nodeType.importDOM()?.[tag]?.(element);
				if (!original) return null;
				return {
					...original,
					conversion: (node: HTMLElement) => {
						const result = original.conversion(node);
						if (!result) return result;
						return {
							...result,
							forChild: (child, parent) => {
								const converted =
									result.forChild?.(child, parent) ?? child;
								if ($isTextNode(converted)) {
									const styles = [
										"color",
										"background-color",
										"font-size",
									]
										.map((property) => {
											const value =
												node.style.getPropertyValue(
													property,
												);
											return value
												? `${property}: ${value}`
												: "";
										})
										.filter(Boolean)
										.join("; ");
									if (styles)
										converted.setStyle(
											[converted.getStyle(), styles]
												.filter(Boolean)
												.join("; "),
										);
								}
								return converted;
							},
						};
					},
				};
			},
		]),
	),
};

/** Initialize/reset from explicit HTML or escaped plain text; never guess the format. */
export function writeEmailEditor(
	editor: LexicalEditor,
	content: string,
	format: "text" | "html",
): void {
	editor.update(
		() => {
			const root = $getRoot();
			root.clear();
			if (format === "html") {
				const doc = new DOMParser().parseFromString(
					sanitizeDraftHtml(content),
					"text/html",
				);
				const nodes = $generateNodesFromDOM(editor, doc);
				root.select();
				for (const node of nodes) {
					if ($isTextNode(node))
						root.append($createParagraphNode().append(node));
					else root.append(node);
				}
			} else {
				for (const line of content.split("\n"))
					root.append(
						$createParagraphNode().append($createTextNode(line)),
					);
			}
			if (root.getChildrenSize() === 0)
				root.append($createParagraphNode());
		},
		{ tag: "email-reset", discrete: true },
	);
	editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
}

/** Export self-contained HTML, including table presentation outside the editor theme. */
export function exportEmailHtml(editor: LexicalEditor): string {
	return editor.getEditorState().read(() => {
		const html = $generateHtmlFromNodes(editor);
		const doc = new DOMParser().parseFromString(html, "text/html");
		for (const table of doc.querySelectorAll("table"))
			table.style.borderCollapse = "collapse";
		for (const cell of doc.querySelectorAll<HTMLTableCellElement>(
			"td,th",
		)) {
			cell.style.border = "1px solid currentColor";
			cell.style.padding = "8px";
		}
		return sanitizeDraftHtml(doc.body.innerHTML);
	});
}
