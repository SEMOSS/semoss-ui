export interface MessageSegment {
	/** "Forwarded from ...:" or "On ... wrote:" for quoted history; absent for the sender's own words. */
	label?: string;
	text: string;
}

export type TextPart =
	| { kind: "text"; text: string }
	| { kind: "link"; href: string };

// the server writes these label lines where a forward's or earlier message's header block was
const HISTORY_LABEL =
	/^(Forwarded from .+:|Earlier message from .+:|On .{5,250} wrote:)\s*$/i;
const URL = /https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/g;

/** Splits kept history into its own segments; text without history stays one segment. */
export function messageSegments(
	text: string,
	history?: boolean,
): MessageSegment[] {
	if (!history) return [{ text }];
	const segments: MessageSegment[] = [{ text: "" }];
	for (const line of text.split("\n")) {
		if (HISTORY_LABEL.test(line.trim()))
			segments.push({ label: line.trim(), text: "" });
		else {
			const current = segments[segments.length - 1];
			current.text = current.text ? `${current.text}\n${line}` : line;
		}
	}
	return segments
		.map((segment) => ({ ...segment, text: segment.text.trim() }))
		.filter((segment, index) => index > 0 || segment.text);
}

/** Plain text with http(s) links cut out, so links render as anchors and nothing else as markup. */
export function textParts(text: string): TextPart[] {
	const parts: TextPart[] = [];
	let last = 0;
	for (const match of text.matchAll(URL)) {
		const at = match.index ?? 0;
		if (at > last) parts.push({ kind: "text", text: text.slice(last, at) });
		parts.push({ kind: "link", href: match[0] });
		last = at + match[0].length;
	}
	if (last < text.length)
		parts.push({ kind: "text", text: text.slice(last) });
	return parts;
}

/** Long enough that it opens clamped. */
export function isLongText(text: string): boolean {
	return text.length > 1200 || text.split("\n").length > 18;
}

/** Which messages to show when a long thread is folded: the first, and the newest few. */
export function foldedRange(
	count: number,
	newest = 3,
): { head: number; tail: number } | null {
	return count > newest + 2 ? { head: 1, tail: newest } : null;
}
