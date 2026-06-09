import type {
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import { DecoratorNode } from "lexical";

// ============================================================================
// Types
// ============================================================================

export type SerializedSlashCommandNode = Spread<
	{ commandId: string; label: string },
	SerializedLexicalNode
>;

// ============================================================================
// Node
// ============================================================================

/**
 * An inline decorator node that renders a styled chip for a selected slash
 * command. Behaves like a single character — cursor can pass through it and
 * it can be deleted with Backspace.
 */
export class SlashCommandNode extends DecoratorNode<JSX.Element> {
	__commandId: string;
	__label: string;

	static getType(): string {
		return "slash-command";
	}

	static clone(node: SlashCommandNode): SlashCommandNode {
		return new SlashCommandNode(node.__commandId, node.__label, node.__key);
	}

	static importJSON(data: SerializedSlashCommandNode): SlashCommandNode {
		return new SlashCommandNode(data.commandId, data.label);
	}

	constructor(commandId: string, label: string, key?: NodeKey) {
		super(key);
		this.__commandId = commandId;
		this.__label = label;
	}

	exportJSON(): SerializedSlashCommandNode {
		return {
			...super.exportJSON(),
			type: "slash-command",
			commandId: this.__commandId,
			label: this.__label,
		};
	}

	createDOM(): HTMLElement {
		const span = document.createElement("span");
		span.style.display = "inline";
		return span;
	}

	updateDOM(): false {
		return false;
	}

	getLabel(): string {
		return this.__label;
	}

	isInline(): boolean {
		return true;
	}

	isKeyboardSelectable(): boolean {
		return false;
	}

	decorate(): JSX.Element {
		return (
			<span className="mx-0.5 inline-flex select-none items-center rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary text-sm">
				{this.__label}
			</span>
		);
	}
}

// ============================================================================
// Helpers
// ============================================================================

export const $createSlashCommandNode = (
	commandId: string,
	label: string,
): SlashCommandNode => new SlashCommandNode(commandId, label);

export const $isSlashCommandNode = (
	node: LexicalNode | null | undefined,
): node is SlashCommandNode => node instanceof SlashCommandNode;
