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
import { cn } from "@semoss/ui/next";

type BadgeOptions = {
	className?: string;
	style?: React.CSSProperties;
	content: string;
	value: string;
};

export type SerializedBadgeNode = Spread<
	{
		badgeOptions: BadgeOptions;
	},
	SerializedLexicalNode
>;

export function $createBadgeNode(badgeOptions: BadgeOptions): BadgeNode {
	return $applyNodeReplacement(new BadgeNode(badgeOptions));
}

export function $isBadgeNode(
	node: LexicalNode | null | undefined,
): node is BadgeNode {
	return node instanceof BadgeNode;
}

export class BadgeNode extends DecoratorNode<JSX.Element> {
	__badgeOptions: BadgeOptions;

	static getType(): string {
		return "badge";
	}

	static clone(node: BadgeNode): BadgeNode {
		return new BadgeNode(node.__badgeOptions, node.__key);
	}

	constructor(badgeOptions: BadgeOptions, key?: NodeKey) {
		super(key);
		this.__badgeOptions = badgeOptions;
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
		element.setAttribute("data-lexical-badge", "true");
		element.setAttribute(
			"data-lexical-options",
			JSON.stringify(this.__badgeOptions),
		);
		element.textContent = this.__badgeOptions.content;
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			span: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute("data-lexical-badge")) {
					return null;
				}

				return {
					conversion: (element) => {
						let badgeOptions: BadgeOptions = {
							content: "",
							value: "",
						};
						try {
							badgeOptions = JSON.parse(
								element.getAttribute("data-lexical-options"),
							);
						} catch (_e) {}

						return {
							node: $createBadgeNode(badgeOptions),
						};
					},
					priority: 1,
				};
			},
		};
	}

	static importJSON(serializedNode: SerializedBadgeNode): BadgeNode {
		return $createBadgeNode(serializedNode.badgeOptions);
	}

	exportJSON(): SerializedBadgeNode {
		return {
			type: "badge",
			version: 1,
			badgeOptions: this.__badgeOptions,
		};
	}

	getTextContent(): string {
		return this.__badgeOptions.value;
	}

	decorate(): JSX.Element {
		return (
			<span
				title={this.__badgeOptions.value}
				className={cn(
					"inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs",
					this.__badgeOptions.className,
				)}
				style={this.__badgeOptions.style}
			>
				{this.__badgeOptions.content}
			</span>
		);
	}
}
