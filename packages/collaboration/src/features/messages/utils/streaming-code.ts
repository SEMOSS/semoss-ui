export interface StreamingCodeFence {
	before: string;
	code: string;
	language?: string;
}

interface OpenFence {
	character: "`" | "~";
	length: number;
	start: number;
	contentStart: number;
	language?: string;
}

/**
 * Find the final unfinished GFM fence so partial code can render before the
 * markdown parser receives its closing delimiter.
 */
export function findStreamingCodeFence(
	text: string,
): StreamingCodeFence | null {
	let open: OpenFence | null = null;
	let offset = 0;

	for (const lineWithBreak of text.match(/.*(?:\n|$)/g) ?? []) {
		if (!lineWithBreak) continue;
		const line = lineWithBreak.endsWith("\n")
			? lineWithBreak.slice(0, -1)
			: lineWithBreak;
		const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);

		if (match) {
			const marker = match[2];
			const character = marker[0] as "`" | "~";
			const suffix = match[3].trim();
			if (!open) {
				open = {
					character,
					length: marker.length,
					start: offset,
					contentStart: offset + lineWithBreak.length,
					language: suffix.split(/\s+/)[0] || undefined,
				};
			} else if (
				open.character === character &&
				marker.length >= open.length &&
				!suffix
			) {
				open = null;
			}
		}

		offset += lineWithBreak.length;
	}

	if (!open) return null;
	return {
		before: text.slice(0, open.start),
		code: text.slice(open.contentStart),
		language: open.language,
	};
}
