import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { Marked } from "marked";

// Block math: $$...$$ on its own (possibly multi-line). Must be checked
// before the inline rule so "$$" isn't first consumed as two empty "$...$"
// matches.
const BLOCK_MATH_RULE = /^\$\$([^$]+?)\$\$/;
// Inline math: $...$, but not "$$" (block) and not preceded/followed by a
// digit run that's actually a price like "$5 and $10" - requiring the
// content to start/end on non-whitespace keeps that common false-positive
// out, matching how GitHub/Jupyter's inline-math heuristics behave.
const INLINE_MATH_RULE = /^\$(?!\$)((?:\\.|[^\\\n$])+?)(?!\s)\$(?!\$)/;

const renderKatex = (source: string, displayMode: boolean): string => {
	try {
		return katex.renderToString(source, {
			throwOnError: false,
			displayMode,
		});
	} catch {
		// Fall back to the raw source (escaped by the caller's sanitizer) so a
		// malformed expression doesn't take down the whole markdown render.
		return source;
	}
};

const katexExtensions: TokenizerAndRendererExtension[] = [
	{
		name: "blockKatex",
		level: "block",
		start(src) {
			return src.indexOf("$$");
		},
		tokenizer(src) {
			const match = BLOCK_MATH_RULE.exec(src);
			if (!match) return undefined;
			return {
				type: "blockKatex",
				raw: match[0],
				text: match[1].trim(),
			} satisfies Tokens.Generic;
		},
		renderer(token) {
			return renderKatex(String(token.text), true);
		},
	},
	{
		name: "inlineKatex",
		level: "inline",
		start(src) {
			return src.indexOf("$");
		},
		tokenizer(src) {
			const match = INLINE_MATH_RULE.exec(src);
			if (!match) return undefined;
			return {
				type: "inlineKatex",
				raw: match[0],
				text: match[1].trim(),
			} satisfies Tokens.Generic;
		},
		renderer(token) {
			return renderKatex(String(token.text), false);
		},
	},
];

// A dedicated Marked instance (not the package's shared default export) so
// registering the KaTeX extension here can't leak into unrelated markdown
// rendering elsewhere in the app that happens to import "marked" too.
const markdownRenderer = new Marked({ extensions: katexExtensions });

/**
 * Renders notebook markdown (cell source or a text/markdown MIME output) to
 * sanitized HTML, with $...$ / $$...$$ math rendered via KaTeX. Notebook
 * content can come from an untrusted/malformed .ipynb file, so the output is
 * always run through DOMPurify before use with dangerouslySetInnerHTML.
 */
export const renderMarkdownToHtml = (source: string): string => {
	const html = markdownRenderer.parse(source, { async: false }) as string;
	return DOMPurify.sanitize(html);
};

/**
 * Renders a text/latex MIME output via KaTeX. Separate from
 * renderMarkdownToHtml since text/latex is a raw math expression, not a
 * markdown document.
 */
export const renderLatexToHtml = (source: string): string => {
	return DOMPurify.sanitize(renderKatex(source, true));
};
