import { describe, expect, it } from "vitest";
import { formatInlineAskPair, paintHighlight } from "./selection-helpers";

describe("formatInlineAskPair", () => {
	it("formats a single-line selection with spaces around the dash", () => {
		expect(formatInlineAskPair("hello world", "what does this mean?")).toBe(
			`"hello world" - what does this mean?`,
		);
	});

	it("collapses internal whitespace in multi-line selections", () => {
		expect(
			formatInlineAskPair("line one\nline two\nline three", "why?"),
		).toBe(`"line one line two line three" - why?`);
	});

	it("normalizes CRLF and tabs to single spaces", () => {
		expect(formatInlineAskPair("a\r\n\tb", "?")).toBe(`"a b" - ?`);
	});

	it("trims surrounding whitespace from the selection and the question", () => {
		expect(formatInlineAskPair("  text  ", "   q?   ")).toBe(`"text" - q?`);
	});

	it("preserves quotes inside the selection (no escaping)", () => {
		expect(formatInlineAskPair(`he said "hi"`, "meaning?")).toBe(
			`"he said "hi"" - meaning?`,
		);
	});

	it("works for code-like selections after whitespace collapse", () => {
		expect(
			formatInlineAskPair(
				"function foo() {\n    return 1;\n}",
				"explain",
			),
		).toBe(`"function foo() { return 1; }" - explain`);
	});
});

describe("paintHighlight", () => {
	it("returns a callable cleanup when the CSS Custom Highlight API is unavailable", () => {
		// jsdom does not expose `window.Highlight` or `CSS.highlights`,
		// so the helper must fall back to a no-op cleanup.
		const range = document.createRange();
		const cleanup = paintHighlight("inline-ask-test", range);
		expect(typeof cleanup).toBe("function");
		expect(() => cleanup()).not.toThrow();
	});
});
