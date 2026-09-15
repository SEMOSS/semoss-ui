/**
 * One run of plain text, or one inline image, in the order it appeared in the
 * source string.
 */
export type ImageSegment =
	| { kind: "text"; value: string }
	| { kind: "image"; mime: string; data: string };

/**
 * Matches the inline image format the Python worker emits.
 *
 * `smss_inline_display.py` renders every figure - matplotlib, opencv, PIL,
 * plotly - as a single HTML img element carrying a base64 data URI, which is
 * also what `PyPlotReactor` and `CollectSeabornReactor` have always returned.
 * Single or double quotes and an optional self-closing slash are both accepted
 * so the same detection works for all of them.
 *
 * Built fresh on each call rather than kept at module scope: a global regex
 * carries `lastIndex` between calls, which would make alternating
 * `hasInlineImage` / `splitInlineImages` calls skip matches.
 */
const inlineImagePattern = () =>
	/<img\s+src=(['"])data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]*?)\1\s*\/?>/gi;

/** True when `text` contains at least one inline image. */
export const hasInlineImage = (text: string | undefined): boolean => {
	if (!text) return false;
	return inlineImagePattern().test(text);
};

/** How many inline images `text` contains. */
export const countInlineImages = (text: string | undefined): number => {
	if (!text) return 0;
	return text.match(inlineImagePattern())?.length ?? 0;
};

/**
 * Split a string into alternating text and image segments.
 *
 * Returns a single text segment when there is nothing to extract, so callers
 * can render the result unconditionally.
 */
export const splitInlineImages = (text: string): ImageSegment[] => {
	const segments: ImageSegment[] = [];
	const pattern = inlineImagePattern();
	let cursor = 0;

	let match = pattern.exec(text);
	while (match !== null) {
		if (match.index > cursor) {
			segments.push({
				kind: "text",
				value: text.slice(cursor, match.index),
			});
		}
		segments.push({
			kind: "image",
			mime: match[2],
			// base64 can wrap across lines in hand-written html; strip any
			// whitespace so the data URI is valid.
			data: match[3].replace(/\s+/g, ""),
		});
		cursor = match.index + match[0].length;
		match = pattern.exec(text);
	}

	if (cursor < text.length) {
		segments.push({ kind: "text", value: text.slice(cursor) });
	}
	return segments;
};

/** Map a file extension to its image MIME type, defaulting to `image/png`. */
export const getImageMimeType = (extension: string): string => {
	const mimeTypes: Record<string, string> = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
		bmp: "image/bmp",
	};
	return mimeTypes[extension.toLowerCase()] ?? "image/png";
};

/** Ordered image MIME types a rich output may carry, most preferred first. */
export const IMAGE_MIME_TYPES = [
	"image/png",
	"image/jpeg",
	"image/gif",
] as const;
