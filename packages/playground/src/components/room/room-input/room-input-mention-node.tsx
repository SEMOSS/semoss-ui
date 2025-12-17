import {
	$applyNodeReplacement,
	DecoratorNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread,
} from "lexical";

export type SerializedMentionNode = Spread<
	{
		mentionTrigger: string;
		mentionDisplay: string;
		mentionValue: string;
	},
	SerializedLexicalNode
>;

export function $createMentionNode(
	mentionTrigger: string,
	mentionDisplay: string,
	mentionValue: string,
): MentionNode {
	return $applyNodeReplacement(
		new MentionNode(mentionTrigger, mentionDisplay, mentionValue),
	);
}

export function $isMentionNode(
	node: LexicalNode | null | undefined,
): node is MentionNode {
	return node instanceof MentionNode;
}

export class MentionNode extends DecoratorNode<JSX.Element> {
	__mentionTrigger: string;
	__mentionDisplay: string;
	__mentionValue: string;

	static getType(): string {
		return "mention";
	}

	static clone(node: MentionNode): MentionNode {
		return new MentionNode(
			node.__mentionTrigger,
			node.__mentionDisplay,
			node.__mentionValue,
			node.__key,
		);
	}

	constructor(
		mentionTrigger: string,
		mentionDisplay: string,
		mentionValue: string,
		key?: NodeKey,
	) {
		super(key);
		this.__mentionTrigger = mentionTrigger;
		this.__mentionDisplay = mentionDisplay;
		this.__mentionValue = mentionValue;
	}

	createDOM(): HTMLElement {
		const element = document.createElement("span");
		return element;
	}

	updateDOM(): false {
		return false;
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement("span");
		element.setAttribute("data-lexical-mention", "true");
		element.setAttribute("data-lexical-trigger", this.__mentionTrigger);
		element.setAttribute("data-lexical-display", this.__mentionDisplay);
		element.setAttribute("data-lexical-value", this.__mentionValue);

		element.textContent = `${this.__mentionTrigger}${this.__mentionValue}`;
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			span: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute("data-lexical-mention")) {
					return null;
				}

				return {
					conversion: (element) => {
						const mentionTrigger = element.getAttribute(
							"data-lexical-trigger",
						);
						const mentionDisplay = element.getAttribute(
							"data-lexical-display",
						);
						const mentionValue =
							element.getAttribute("data-lexical-value");

						return {
							node: $createMentionNode(
								mentionTrigger,
								mentionDisplay,
								mentionValue,
							),
						};
					},
					priority: 1,
				};
			},
		};
	}

	static importJSON(serializedNode: SerializedMentionNode): MentionNode {
		return $createMentionNode(
			serializedNode.mentionTrigger,
			serializedNode.mentionDisplay,
			serializedNode.mentionValue,
		);
	}

	exportJSON(): SerializedMentionNode {
		return {
			type: "mention",
			version: 1,
			mentionTrigger: this.__mentionTrigger,
			mentionDisplay: this.__mentionDisplay,
			mentionValue: this.__mentionValue,
		};
	}

	getTextContent(): string {
		return `${this.__mentionTrigger}${this.__mentionDisplay}`;
	}

	decorate(): JSX.Element {
		return (
			<span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-sm">
				{this.__mentionTrigger}
				{this.__mentionDisplay}
			</span>
		);
	}

	getMentionTrigger(): string {
		return this.__mentionTrigger;
	}

	getMentionDisplay(): string {
		return this.__mentionDisplay;
	}

	getMentionValue(): string {
		return this.__mentionValue;
	}
}
