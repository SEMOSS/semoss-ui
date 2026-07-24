import Anser from "anser";
import DOMPurify from "dompurify";

// Matches CSI-style ANSI escape sequences (colors, styles) commonly emitted
// by colorama/rich/pytest, etc. Used to skip the HTML conversion path
// entirely for the common case of plain, colorless output.
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally matching the ESC control character
const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*m/;

export const hasAnsiCodes = (text: string): boolean => {
	return ANSI_ESCAPE_RE.test(text);
};

/**
 * Converts ANSI color/style codes (stdout/stderr streams, tracebacks) into
 * HTML <span> elements so colored terminal output renders the same way it
 * does in a real Jupyter/terminal front-end. The input is HTML-escaped
 * before ansiToHtml runs (anser doesn't escape it itself) and the final
 * result is still sanitized, since the source text is arbitrary program
 * output, not trusted markup.
 */
export const ansiToSafeHtml = (text: string): string => {
	const html = Anser.ansiToHtml(Anser.escapeForHtml(text), {
		use_classes: false,
	});
	return DOMPurify.sanitize(html);
};
