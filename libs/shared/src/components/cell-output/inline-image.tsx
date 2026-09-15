import { useTranslation } from "@semoss/i18n";
import { type ImageSegment, splitInlineImages } from "../../utility/image";

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
			{segments.map((segment: ImageSegment, i) => {
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
