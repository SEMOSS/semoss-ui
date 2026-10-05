import type { Code, State, Tokenizer } from "micromark-util-types";
import type {} from "remark-math";
import type {} from "remark-parse";
import type { Plugin } from "unified";

declare module "micromark-util-types" {
	interface TokenTypeMap {
		latexMath: "latexMath";
		latexMathData: "latexMathData";
	}
}

const BACKSLASH = 92;
const OPEN_PAREN = 40;
const OPEN_BRACKET = 91;

/** Consume a complete LaTeX-delimited formula before Markdown escapes it. */
const tokenizeLatexMath: Tokenizer = (effects, ok, nok) => {
	let closingDelimiter: number;
	return start;

	function start(code: Code): State | undefined {
		effects.enter("latexMath");
		effects.enter("latexMathData");
		effects.consume(code);
		return opening;
	}

	function opening(code: Code): State | undefined {
		if (code !== OPEN_PAREN && code !== OPEN_BRACKET) return nok(code);
		closingDelimiter = code === OPEN_PAREN ? 41 : 93;
		effects.consume(code);
		return inside;
	}

	function inside(code: Code): State | undefined {
		if (code === null) return nok(code);
		consumeContent(code);
		return code === BACKSLASH ? afterBackslash : inside;
	}

	function afterBackslash(code: Code): State | undefined {
		if (code === null) return nok(code);
		consumeContent(code);
		if (code === closingDelimiter) {
			effects.exit("latexMathData");
			effects.exit("latexMath");
			return ok;
		}
		return inside;
	}

	function consumeContent(code: number): void {
		// Micromark uses -5/-4/-3 for CR, LF, and CRLF. Explicit line-ending
		// tokens let its subtokenizer reconnect multiline paragraph chunks.
		if (code >= -5 && code <= -3) {
			effects.exit("latexMathData");
			effects.enter("lineEnding");
			effects.consume(code);
			effects.exit("lineEnding");
			effects.enter("latexMathData");
		} else {
			effects.consume(code);
		}
	}
};

/**
 * Add \(...\) and \[...\] alongside remark-math's dollar delimiters.
 * Tokenizing at the text layer preserves TeX underscores, escapes, and brackets
 * while leaving Markdown code, link destinations, and HTML attributes alone.
 */
export const remarkLatexMath: Plugin = function () {
	const data = this.data();
	data.micromarkExtensions ??= [];
	data.fromMarkdownExtensions ??= [];
	data.micromarkExtensions.push({
		text: { [BACKSLASH]: { tokenize: tokenizeLatexMath } },
	});
	data.fromMarkdownExtensions.push({
		enter: {
			latexMath(token) {
				const source = this.sliceSerialize(token);
				const value = source.slice(2, -2);
				this.enter(
					{
						type: "inlineMath",
						value,
						data: {
							hName: "code",
							hProperties: {
								className: [
									"language-math",
									source.startsWith("\\[")
										? "math-display"
										: "math-inline",
								],
							},
							hChildren: [{ type: "text", value }],
						},
					},
					token,
				);
				this.buffer();
			},
		},
		exit: {
			latexMath(token) {
				this.resume();
				this.exit(token);
			},
		},
	});
};
