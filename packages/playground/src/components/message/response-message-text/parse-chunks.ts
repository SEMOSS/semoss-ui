// ============================================================
// CHUNK TYPES
// ============================================================

export type ChunkType = "md" | "html";

export interface ContentChunk {
	/**
	 * Stable identity key: the character offset where this chunk begins in
	 * the original text string. Stable across re-parses as content grows,
	 * so React can key subcomponents by this value without remounting.
	 */
	key: number;

	type: ChunkType;

	/** The text content of this chunk (growing during streaming for the last chunk). */
	content: string;

	/**
	 * True when no more tokens will arrive for this chunk — either because a
	 * subsequent chunk exists, or because streaming has ended.
	 * Subcomponents should only fire `onComplete` when this is true.
	 */
	isFinalized: boolean;
}

// ============================================================
// PARSER
// ============================================================

/**
 * Parse `text` into an ordered array of markdown and HTML content chunks.
 *
 * Rules:
 * - Standalone `<!DOCTYPE html` responses (no code fence) → single html chunk.
 * - Performs a single forward scan, emitting chunks as boundaries are found.
 * - As soon as a ` ```html ` opening fence is detected, a new HTML chunk starts
 *   immediately — partial HTML streams into an HTML chunk, not an MD chunk.
 * - If no closing ` ``` ` exists yet, the HTML chunk grows with isFinalized: false.
 * - After a closing fence, scanning resumes — the next segment may be MD, HTML,
 *   or nothing. Two adjacent HTML blocks produce no MD chunk between them.
 * - Chunk `key` = start offset in original string — stable across re-parses.
 */
export function parseChunks(
	text: string,
	isStreaming: boolean,
): ContentChunk[] {
	// ── Standalone HTML detection ─────────────────────────────────────────────
	// If the response opens with <!DOCTYPE (no code fence), treat the whole
	// text as a single HTML chunk.
	const trimmed = text.trimStart();
	if (!trimmed.includes("```") && /^<!DOCTYPE\s/i.test(trimmed)) {
		return [
			{
				key: 0,
				type: "html",
				content: text,
				isFinalized: !isStreaming,
			},
		];
	}

	if (!text) return [];

	// ── Single forward scan ───────────────────────────────────────────────────
	const chunks: ContentChunk[] = [];
	let cursor = 0;

	while (cursor < text.length) {
		// Find the next ```html opening fence from the current cursor position
		const openIdx = findHtmlFenceOpen(text, cursor);

		if (openIdx === -1) {
			// No more HTML fences — everything remaining is markdown
			const tail = text.slice(cursor);
			if (tail.length > 0) {
				chunks.push({
					key: cursor,
					type: "md",
					content: tail,
					isFinalized: !isStreaming,
				});
			}
			break;
		}

		// Emit any markdown that precedes this opening fence
		if (openIdx > cursor) {
			chunks.push({
				key: cursor,
				type: "md",
				content: text.slice(cursor, openIdx),
				// More content follows — this MD chunk is done
				isFinalized: true,
			});
		}

		// Find the end of the opening fence line (required to locate content start)
		const newlineIdx = text.indexOf("\n", openIdx);
		if (newlineIdx === -1) {
			// Opening fence line hasn't finished streaming yet — nothing more to parse
			break;
		}
		const contentStart = newlineIdx + 1;

		// Look for the closing fence
		const closeIdx = text.indexOf("```", contentStart);

		if (closeIdx === -1) {
			// No closing fence yet — emit a live HTML chunk that will keep growing
			chunks.push({
				key: openIdx,
				type: "html",
				content: text.slice(contentStart),
				isFinalized: false,
			});
			// Can't know what follows until the fence closes — stop here
			break;
		}

		// Closing fence found — emit a finalized HTML chunk
		const closeEnd = closeIdx + 3;
		chunks.push({
			key: openIdx,
			type: "html",
			content: text.slice(contentStart, closeIdx),
			isFinalized: true,
		});

		// Advance past the closing fence and continue scanning
		// The next segment could be MD, another ```html, or nothing
		cursor = closeEnd;
	}

	console.log("[parseChunks]", chunks);
	return chunks;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Find the start index of the next ` ```html ` opening fence at or after `from`.
 * Returns -1 if not found.
 *
 * Matches: ` ```html ` optionally followed by spaces/tabs, then end of line.
 * Case-insensitive for the "html" part.
 */
function findHtmlFenceOpen(text: string, from: number): number {
	let i = from;
	while (i < text.length) {
		// Quick pre-check: backtick
		if (text[i] !== "`") {
			i++;
			continue;
		}

		// Need three backticks
		if (text[i + 1] !== "`" || text[i + 2] !== "`") {
			i++;
			continue;
		}

		// Check for "html" (case-insensitive) after the backticks
		const after = i + 3;
		if (
			text[after]?.toLowerCase() === "h" &&
			text[after + 1]?.toLowerCase() === "t" &&
			text[after + 2]?.toLowerCase() === "m" &&
			text[after + 3]?.toLowerCase() === "l"
		) {
			// Make sure "html" is followed only by optional spaces/tabs then
			// end of line (newline or end of string). This prevents matching
			// ` ```htmlspecial ` or ` ```htmlparser `.
			let j = after + 4;
			while (j < text.length && (text[j] === " " || text[j] === "\t")) {
				j++;
			}
			if (j >= text.length || text[j] === "\n" || text[j] === "\r") {
				return i;
			}
		}

		i++;
	}
	return -1;
}
