import { type SerializedTableCellNode, TableCellNode } from "@lexical/table";
import {
	$applyNodeReplacement,
	type DOMConversionMap,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalEditor,
	type NodeKey,
} from "lexical";

type ChatTableCellJson = SerializedTableCellNode & { scope?: string };

/** Persist clipboard header associations through edits, history, and draft navigation. */
export class ChatTableCellNode extends TableCellNode {
	__scope = "";
	static getType(): string {
		return "chat-table-cell";
	}
	static clone(node: ChatTableCellNode): ChatTableCellNode {
		return new ChatTableCellNode(
			node.__headerState,
			node.__colSpan,
			node.__width,
			node.__key,
		);
	}
	constructor(headerState = 0, colSpan = 1, width?: number, key?: NodeKey) {
		super(headerState, colSpan, width, key);
	}
	afterCloneFrom(node: this): void {
		super.afterCloneFrom(node);
		this.__scope = node.__scope;
	}
	setScope(scope: string): this {
		this.getWritable().__scope = scope;
		return this;
	}
	static importJSON(value: ChatTableCellJson): ChatTableCellNode {
		return new ChatTableCellNode()
			.updateFromJSON(value)
			.setScope(value.scope ?? "");
	}
	static importDOM(): DOMConversionMap {
		return Object.fromEntries(
			["td", "th"].map((tag) => [
				tag,
				(element: HTMLElement) => {
					const original =
						TableCellNode.importDOM()?.[tag]?.(element);
					if (!original) return null;
					return {
						...original,
						priority: 4 as const,
						conversion: (dom: HTMLElement) => {
							const converted = original.conversion(dom);
							if (converted?.node instanceof ChatTableCellNode)
								converted.node.setScope(
									dom.getAttribute("scope") ?? "",
								);
							return converted;
						},
					};
				},
			]),
		);
	}
	createDOM(config: EditorConfig): HTMLTableCellElement {
		const element = super.createDOM(config);
		if (this.getTag() === "th" && this.getLatest().__scope)
			element.setAttribute("scope", this.getLatest().__scope);
		return element;
	}

	exportJSON(): ChatTableCellJson {
		return { ...super.exportJSON(), scope: this.getLatest().__scope };
	}
	exportDOM(editor: LexicalEditor): DOMExportOutput {
		const output = super.exportDOM(editor);
		const scope = this.getLatest().__scope;
		if (
			scope &&
			output.element instanceof HTMLElement &&
			this.getTag() === "th"
		)
			output.element.setAttribute("scope", scope);
		return output;
	}
}

export const CHAT_TABLE_CELL_REPLACEMENT = {
	replace: TableCellNode,
	with: (node: TableCellNode): ChatTableCellNode =>
		$applyNodeReplacement(
			new ChatTableCellNode(
				node.getHeaderStyles(),
				node.getColSpan(),
				node.getWidth(),
			).setRowSpan(node.getRowSpan()),
		),
	withKlass: ChatTableCellNode,
};
