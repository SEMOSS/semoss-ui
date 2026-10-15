import { countOccurrences as count } from "@semoss/utility/text";
/** One piece of a line: text, or a link. */
export type RichTextPiece =
	| { kind: "text"; text: string }
	| {
			kind: "link";
			href: string;
			/**
			 * What the link shows. Left out for a link Outlook wrote after its
			 * text, which then only needs a short link beside that text.
			 */
			label?: string;
	  };

/** A stretch of a body, between the dividers its sender drew. */
export type RichTextBlock =
	| {
			kind: "text";
			/** Its lines, each a run of pieces; a blank line has none. */
			lines: RichTextPiece[][];
	  }
	| { kind: "divider" };

/**
 * A line that only draws a rule, such as the underscores around a Teams
 * meeting's joining details.
 */
const DIVIDER = /^\s*[_\-=*~]{5,}\s*$/;

/**
 * A link in a body: in angle brackets, as Outlook writes one after its text,
 * or a bare address.
 */
const LINK = /<((?:https?|mailto):[^\s<>]+)>|(https?:\/\/[^\s<>]+)/gi;

/**
 * Where Outlook's text puts an inline image, which cannot be shown, with the
 * space before it.
 */
const INLINE_IMAGE = / ?\[cid:[^\]\s]+\]/gi;

/** What a bare address can end with that belongs to the sentence. */
const TRAILING_PUNCTUATION = ".,;:!?'\")]";

/** What opens a phrase, so a link right after it names nothing before it. */
const OPENING = /[\s([{"'<]/;

/** What an address can hold, so text ending in one runs into the address. */
const ADDRESS_CHARACTER = /[\w.@/-]/;

/**
 * How a link's address reads as text: an email without `mailto:` or a
 * subject, or a web address without its scheme or closing slash.
 *
 * @param href - The link.
 * @return Its address as text would show it.
 */
export const getLinkText = (href: string): string =>
	/^mailto:/i.test(href)
		? href.slice("mailto:".length).split("?")[0]
		: href.replace(/^https?:\/\//i, "").replace(/\/$/, "");

/**
 * The host a link goes to, to name a link that has no text of its own.
 *
 * @param href - The link.
 * @return The host, or the link itself when it has none.
 */
export const getLinkHost = (href: string): string => {
	try {
		return new URL(href).host || href;
	} catch {
		return href;
	}
};

/**
 * Split the punctuation of the sentence off a bare address. A closing
 * bracket stays when the address opened it, as a wiki page's name can.
 *
 * @param address - The address as matched.
 * @return The address and what follows it.
 */
const splitTrailing = (address: string): [string, string] => {
	let end = address.length;
	while (end > 0 && TRAILING_PUNCTUATION.includes(address[end - 1])) {
		const character = address[end - 1];
		const opening = character === ")" ? "(" : character === "]" ? "[" : "";
		const kept = address.slice(0, end);
		if (opening && count(kept, opening) >= count(kept, character)) {
			break;
		}
		end--;
	}
	return [address.slice(0, end), address.slice(end)];
};

/**
 * The pieces of one line. A link Outlook wrote after text that already shows
 * its address turns that text into the link; one written after other text
 * stays beside it, and an email written after a name follows it in
 * parentheses.
 *
 * @param line - The line.
 * @return Its pieces.
 */
const toPieces = (line: string): RichTextPiece[] => {
	const pieces: RichTextPiece[] = [];
	const pushText = (text: string) => {
		const last = pieces[pieces.length - 1];
		if (last?.kind === "text") {
			last.text += text;
		} else if (text) {
			pieces.push({ kind: "text", text: text });
		}
	};
	const pushLink = (href: string, label?: string) => {
		pieces.push(
			label === undefined
				? { kind: "link", href: href }
				: { kind: "link", href: href, label: label },
		);
	};

	let position = 0;
	for (const match of line.matchAll(LINK)) {
		const start = match.index ?? 0;
		const [whole, bracketed, bare] = match;
		const before = line.slice(position, start);
		position = start + whole.length;

		if (bare) {
			const [href, trailing] = splitTrailing(bare);
			pushText(before);
			pushLink(href, href);
			pushText(trailing);
			continue;
		}

		const text = getLinkText(bracketed);
		const last = pieces[pieces.length - 1];
		// the same address, just shown as a bare link
		if (
			!before &&
			last?.kind === "link" &&
			getLinkText(last.href).toLowerCase() === text.toLowerCase()
		) {
			continue;
		}
		pushText(before);

		// the address, already shown as text, becomes the link
		const shown = pieces[pieces.length - 1];
		if (shown?.kind === "text") {
			const trimmed = shown.text.trimEnd();
			const labelStart = trimmed.length - text.length;
			if (
				labelStart >= 0 &&
				trimmed.slice(labelStart).toLowerCase() ===
					text.toLowerCase() &&
				!ADDRESS_CHARACTER.test(trimmed[labelStart - 1] ?? " ")
			) {
				const spacing = shown.text.slice(trimmed.length);
				shown.text = trimmed.slice(0, labelStart);
				if (!shown.text) {
					pieces.pop();
				}
				pushLink(bracketed, trimmed.slice(labelStart));
				pushText(spacing);
				continue;
			}
		}

		const isNamed = start > 0 && !OPENING.test(line[start - 1]);
		if (!/^mailto:/i.test(bracketed)) {
			// after its text, a web link is only marked; alone, it is shown whole
			pushLink(bracketed, isNamed ? undefined : bracketed);
		} else if (isNamed) {
			pushText(" (");
			pushLink(bracketed, text);
			pushText(")");
		} else {
			pushLink(bracketed, text);
		}
	}
	pushText(line.slice(position));
	return pieces;
};

/**
 * A plain text body in the shape it reads best in: its paragraphs and line
 * breaks kept, runs of blank lines cut to one, the rules its sender drew as
 * dividers, its links as links, and the marks Outlook leaves for inline
 * images dropped.
 *
 * @param text - The body as the backend read it.
 * @return Its blocks, without empty ones or dividers at either end.
 */
export const parseRichText = (text: string): RichTextBlock[] => {
	const blocks: RichTextBlock[] = [];
	let lines: RichTextPiece[][] = [];
	let isAfterBlank = false;

	const flush = () => {
		while (lines.length > 0 && lines[0].length === 0) {
			lines.shift();
		}
		while (lines.length > 0 && lines[lines.length - 1].length === 0) {
			lines.pop();
		}
		if (lines.length > 0) {
			blocks.push({ kind: "text", lines: lines });
		}
		lines = [];
	};

	for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
		const line = rawLine.replace(INLINE_IMAGE, "");
		// a line that only held an image goes with it
		if (line !== rawLine && line.trim() === "") {
			continue;
		}
		if (DIVIDER.test(line)) {
			flush();
			if (
				blocks.length > 0 &&
				blocks[blocks.length - 1].kind !== "divider"
			) {
				blocks.push({ kind: "divider" });
			}
			isAfterBlank = false;
			continue;
		}
		const isLineBlank = line.trim() === "";
		if (isLineBlank && isAfterBlank) {
			continue;
		}
		isAfterBlank = isLineBlank;
		lines.push(isLineBlank ? [] : toPieces(line.trimEnd()));
	}
	flush();

	while (blocks[blocks.length - 1]?.kind === "divider") {
		blocks.pop();
	}
	return blocks;
};

/**
 * A bullet a mail client wrote as a character at the start of a line: the
 * bullet, black circle, and squares, or the middle dot Outlook turns its
 * editor's bullets into.
 */
const BULLET = /^[\u2022\u25CF\u25AA\u25A0\u00B7]\s+/;

/** A bullet of a list inside another: Outlook writes an `o` spaced out. */
const SUB_BULLET = /^(?:o\s{2,}|[\u25E6\u25CB]\s+)/;

/** A line Markdown reads as an item of a list: bulleted, or numbered. */
const LIST_ITEM = /^\s*(?:([-*+])|\d{1,9}[.)])\s/;

/**
 * What kind of list item a line is.
 *
 * @param line - The line, as Markdown.
 * @return `bullet` or `number`, or undefined when the line is no item.
 */
const getListKind = (line: string | undefined) => {
	const match = line ? LIST_ITEM.exec(line) : null;
	return match ? (match[1] ? "bullet" : "number") : undefined;
};

/**
 * The start of a line Markdown would read as markup its sender never wrote:
 * a heading, a rule or a heading's underline, a code fence, or a link
 * definition, which Markdown hides.
 */
const ACCIDENTAL_MARKUP =
	/^(?:#{1,6}(?:\s|$)|[-=_*]{1,4}$|`{3,}|~{3,}|\[[^\]]*\]:)/;

/** A link's address, in the angle brackets Markdown needs around some. */
const toDestination = (href: string): string =>
	/[()]/.test(href) ? `<${href}>` : href;

const escapeLabel = (label: string): string =>
	label.replace(/[\\[\]<]/g, "\\$&");

/**
 * A link named by its site, such as `[teams.microsoft.com](https://...)`,
 * for a link with no text of its own.
 *
 * @param href - The link.
 * @return The Markdown.
 */
export const toSiteLink = (href: string): string => {
	const host = getLinkHost(href);
	return host === href
		? `<${href}>`
		: `[${escapeLabel(host)}](${toDestination(href)})`;
};

/**
 * A link as Markdown. A link that shows its own address is left for
 * Markdown to link, and one without text of its own is named by its site.
 *
 * @param piece - The link.
 * @return The Markdown.
 */
const linkToMarkdown = (
	piece: Extract<RichTextPiece, { kind: "link" }>,
): string => {
	const isMail = /^mailto:/i.test(piece.href);
	if (piece.label === undefined) {
		return ` (${toSiteLink(piece.href)})`;
	}
	if (!isMail && piece.label === piece.href) {
		return `<${piece.href}>`;
	}
	if (isMail && piece.label === getLinkText(piece.href)) {
		return piece.label;
	}
	return `[${escapeLabel(piece.label)}](${toDestination(piece.href)})`;
};

/**
 * One line as Markdown: its text with any `<` kept a character, and without
 * the indent that would make Markdown read it as code.
 *
 * @param pieces - The line's pieces.
 * @return The line, or an empty string for a blank line.
 */
const lineToMarkdown = (pieces: RichTextPiece[]): string => {
	const line = pieces
		.map((piece) =>
			piece.kind === "text"
				? piece.text.replace(/</g, "\\<")
				: linkToMarkdown(piece),
		)
		.join("")
		.trim();
	if (SUB_BULLET.test(line)) {
		return `  - ${line.replace(SUB_BULLET, "")}`;
	}
	if (BULLET.test(line)) {
		return `- ${line.replace(BULLET, "")}`;
	}
	return ACCIDENTAL_MARKUP.test(line) ? `\\${line}` : line;
};

/**
 * One block's lines as Markdown paragraphs.
 *
 * @param lines - The block's lines.
 * @return The Markdown.
 */
const blockToMarkdown = (lines: RichTextPiece[][]): string => {
	const converted = lines.map(lineToMarkdown);
	// a list whose items are a paragraph apart still reads as one list
	const kept = converted.filter((line, index) => {
		const kind = getListKind(converted[index - 1]);
		return (
			line !== "" || !kind || kind !== getListKind(converted[index + 1])
		);
	});
	return kept
		.map((line, index) => {
			const next = kept[index + 1];
			// two spaces end a line inside a paragraph, which Markdown would
			// otherwise run into the next; an item of a list starts its own
			return line && next && !LIST_ITEM.test(next) ? `${line}  ` : line;
		})
		.join("\n");
};

/**
 * A plain text body as Markdown that reads the way it was sent: its lines
 * and paragraphs kept, the rules its sender drew as dividers, the bullets a
 * mail client wrote as characters as lists, and its links as links, with a
 * link written after its text named by its site beside that text. Nothing in
 * the text turns into markup it never had.
 *
 * @param text - The body as the backend read it.
 * @return The Markdown, empty when the body has no text.
 */
export const toMarkdownText = (text: string): string =>
	parseRichText(text)
		.map((block) =>
			block.kind === "divider" ? "---" : blockToMarkdown(block.lines),
		)
		.join("\n\n");
