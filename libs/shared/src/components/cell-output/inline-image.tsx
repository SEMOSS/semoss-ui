import { useTranslation } from "@semoss/i18n";

/**
 * One run of plain text, or one inline image, in the order it appeared in the
 * source string.
 */
export type OutputSegment =
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
export const splitInlineImages = (text: string): OutputSegment[] => {
	const segments: OutputSegment[] = [];
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

export interface InlineImageSegmentsProps {
	/** The raw output or log text, which may contain inline image elements. */
	text: string;
	/** Applied to each plain-text run between images. */
	textClassName?: string;
	/**
	 * Applied to each rendered image. Defaults to a height-capped preview so a
	 * tall figure does not swamp the transcript - the Popout view passes a
	 * looser cap to show it at full size.
	 */
	imageClassName?: string;
}

/**
 * Renders text with any embedded base64 images shown as actual images.
 *
 * This is the "preview" half of the Formatted / Raw toggle on the Logs and
 * Result panels. Raw mode bypasses it and shows the underlying html, which is
 * what you want when copying the value out or debugging what the worker sent.
 */
export const InlineImageSegments = ({
	text,
	textClassName = "whitespace-pre-wrap break-all",
	imageClassName = "max-h-96",
}: InlineImageSegmentsProps) => {
	const { t } = useTranslation("common");
	const segments = splitInlineImages(text);
	let imageIndex = 0;

	return (
		<div className="flex flex-col gap-1.5">
			{segments.map((segment, i) => {
				if (segment.kind === "image") {
					imageIndex += 1;
					return (
						<img
							// Segment order is stable for a given string, and the
							// data itself is too long to key on.
							key={`img-${i}-${segment.data.length}`}
							src={`data:${segment.mime};base64,${segment.data}`}
							alt={t("cellOutput.image.alt", {
								index: imageIndex,
							})}
							// bg-white keeps a transparent PNG legible in dark mode;
							// matplotlib already saves on white so it is a no-op for
							// the common case.
							className={`w-auto max-w-full self-start rounded border border-border bg-white object-contain ${imageClassName}`}
						/>
					);
				}
				// Whitespace-only gaps between images would render as empty rows.
				if (!segment.value.trim()) return null;
				return (
					<div
						key={`txt-${i}-${segment.value.length}`}
						className={textClassName}
					>
						{segment.value}
					</div>
				);
			})}
		</div>
	);
};
