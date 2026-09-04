import type { Parent, PhrasingContent, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const MARKDOWN_CALLOUT_TYPES = [
	"note",
	"tip",
	"info",
	"warning",
	"danger",
] as const;
export type MarkdownCalloutType = (typeof MARKDOWN_CALLOUT_TYPES)[number];

interface DirectiveNode extends Parent {
	type: "containerDirective" | "leafDirective" | "textDirective";
	name: string;
	data?: {
		hName?: string;
		hProperties?: Record<
			string,
			| string
			| number
			| boolean
			| Array<string | number>
			| null
			| undefined
		>;
	};
}

interface TextTarget {
	node: Text;
	parent: Parent;
	index: number;
}

const ABBREVIATION_DECLARATION = /^\*\[([^\]]+)\]:\s*(.+)$/;
const NON_PROSE_PARENTS = new Set([
	"link",
	"linkReference",
	"inlineCode",
	"code",
	"abbr",
]);

const escapeRegExp = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Modern remark transform for Markdown Extra abbreviation declarations.
 * The published remark-abbr package relies on the removed legacy Parser API.
 */
export const remarkAbbreviations: Plugin<[], Root> = () => (tree) => {
	const definitions = new Map<string, string>();

	tree.children = tree.children.filter((child) => {
		if (
			child.type !== "paragraph" ||
			!child.children.every((item) => item.type === "text")
		)
			return true;

		const lines = child.children
			.map((item) => (item as Text).value)
			.join("")
			.split(/\r?\n/)
			.filter((line) => line.trim());
		if (!lines.length) return true;

		const declarations = lines.map((line) =>
			ABBREVIATION_DECLARATION.exec(line),
		);
		if (declarations.some((match) => !match)) return true;

		for (const match of declarations) {
			if (match) definitions.set(match[1].trim(), match[2].trim());
		}
		return false;
	});

	if (!definitions.size) return;

	const terms = [...definitions.keys()]
		.filter(Boolean)
		.sort((left, right) => right.length - left.length);
	if (!terms.length) return;

	const matcher = new RegExp(
		`(?<![\\p{L}\\p{N}_])(${terms.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}_])`,
		"gu",
	);
	const targets: TextTarget[] = [];

	visit(tree, "text", (node, index, parent) => {
		if (
			index === undefined ||
			!parent ||
			NON_PROSE_PARENTS.has(parent.type) ||
			!matcher.test(node.value)
		)
			return;
		matcher.lastIndex = 0;
		targets.push({ node, parent, index });
	});

	for (const { node, parent, index } of targets.reverse()) {
		const parts = node.value.split(matcher).filter(Boolean);
		const replacements = parts.map((part): PhrasingContent => {
			const title = definitions.get(part);
			if (!title) return { type: "text", value: part };

			return {
				type: "abbr",
				children: [{ type: "text", value: part }],
				data: { hName: "abbr", hProperties: { title } },
			} as unknown as PhrasingContent;
		});
		parent.children.splice(index, 1, ...replacements);
	}
};

/** Map only approved directive names to callout elements and discard author-supplied attributes. */
export const remarkCallouts: Plugin<[], Root> = () => (tree) => {
	visit(tree, (node) => {
		if (
			!["containerDirective", "leafDirective", "textDirective"].includes(
				node.type,
			)
		)
			return;

		const directive = node as DirectiveNode;
		const callout = MARKDOWN_CALLOUT_TYPES.find(
			(type) => type === directive.name.toLowerCase(),
		);
		if (!directive.data) directive.data = {};
		const data = directive.data;

		data.hName =
			directive.type === "textDirective"
				? "span"
				: callout
					? "aside"
					: "div";
		data.hProperties = callout ? { dataCallout: callout } : {};
	});
};
