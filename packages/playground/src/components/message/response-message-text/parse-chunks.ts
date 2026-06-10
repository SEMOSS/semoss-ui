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
 * - ` ```html ` fences are scanned manually (no regex global state) to support
 *   multiple HTML blocks per response.
 * - An open fence mid-stream (no closing ` ``` ` yet) is treated as part of
 *   the preceding markdown chunk until it closes, preventing premature html
 *   chunk creation.
 * - Chunk `key` = start offset in original string — stable across re-parses.
 * - `isFinalized`: true for every chunk except the last one while streaming.
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

	// ── Fence scanner ─────────────────────────────────────────────────────────
	// Find all closed ```html … ``` fences using a manual scan.
	// An open fence (isStreaming && no closing ```) is intentionally ignored so
	// the preceding md chunk absorbs the partial fence text.

	interface FenceSpan {
		/** Index of the opening backtick of ` ```html ` */
		openStart: number;
		/** Index just after the opening fence line's newline */
		contentStart: number;
		/** Index of the closing ` ``` ` */
		closeStart: number;
		/** Index just after the closing ` ``` ` */
		closeEnd: number;
		/** Inner HTML text */
		content: string;
	}

	const fences: FenceSpan[] = [];
	let scanPos = 0;

	while (scanPos < text.length) {
		// Look for ```html (case-insensitive)
		const openIdx = findHtmlFenceOpen(text, scanPos);
		if (openIdx === -1) break;

		// The opening fence ends at the next newline
		const newlineIdx = text.indexOf("\n", openIdx);
		if (newlineIdx === -1) {
			// Opening fence has no newline yet — still streaming, stop here
			break;
		}
		const contentStart = newlineIdx + 1;

		// Look for closing ```
		const closeIdx = text.indexOf("```", contentStart);
		if (closeIdx === -1) {
			// No closing fence yet — if streaming, leave the rest as md
			break;
		}

		const closeEnd = closeIdx + 3;
		const htmlContent = text.slice(contentStart, closeIdx);

		fences.push({
			openStart: openIdx,
			contentStart,
			closeStart: closeIdx,
			closeEnd,
			content: htmlContent,
		});

		// Advance past this fence
		scanPos = closeEnd;
	}

	// ── Chunk assembly ────────────────────────────────────────────────────────
	if (fences.length === 0) {
		// Pure markdown (or still-streaming html that hasn't closed yet)
		if (!text) return [];
		return [
			{
				key: 0,
				type: "md",
				content: text,
				isFinalized: !isStreaming,
			},
		];
	}

	const chunks: ContentChunk[] = [];
	let cursor = 0;

	for (let i = 0; i < fences.length; i++) {
		const fence = fences[i];

		// Markdown chunk before this fence
		const preText = text.slice(cursor, fence.openStart);
		if (preText.length > 0) {
			chunks.push({
				key: cursor,
				type: "md",
				content: preText,
				// Finalized: more chunks follow
				isFinalized: true,
			});
		}

		// HTML chunk
		chunks.push({
			key: fence.openStart,
			type: "html",
			content: fence.content,
			// Finalized: more chunks follow, or streaming has ended
			isFinalized: true,
		});

		cursor = fence.closeEnd;
	}

	// Remaining text after the last fence
	const tail = text.slice(cursor);
	if (tail.length > 0) {
		chunks.push({
			key: cursor,
			type: "md",
			content: tail,
			// Last chunk — finalized only when not streaming
			isFinalized: !isStreaming,
		});
	}

	// If all chunks were finalized above (no tail), the last chunk in the array
	// is the last html chunk, which was already marked isFinalized: true because
	// it has a closed fence. That's correct — streaming may still be delivering
	// content after the fence, but that will produce new md tail chunks.

	// Handle the edge case where there is NO tail but streaming is still active:
	// the last html fence just closed, streaming hasn't ended yet. The last html
	// chunk should be finalized (its fence is closed). isFinalized: true is
	// already set above, so nothing to fix.

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
