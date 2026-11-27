/** The parts of a paste's clipboard {@link filterPastedFiles} reads. */
type PastedData = Pick<DataTransfer, "files" | "getData">;

/**
 * Whether a paste's HTML holds text of its own, beyond images. Parsed with
 * `DOMParser` into an inert, disconnected document (no browsing context), so
 * its `<img>` tags never load and their attribute handlers never run.
 *
 * @param html - The paste's `text/html`.
 * @returns True when text is left once the images are removed.
 */
const hasHtmlText = (html: string): boolean => {
	if (!html) return false;
	const parsed = new DOMParser().parseFromString(html, "text/html");
	for (const image of parsed.body.querySelectorAll("img")) image.remove();
	return (parsed.body.textContent?.trim().length ?? 0) > 0;
};

/**
 * The files a paste attaches. Microsoft apps (Word, Outlook, ...) put an image
 * of copied text beside the text itself, so a paste with text attaches none of
 * its images and the text is pasted instead. Teams wraps a copied image in a
 * bare `<img>` with no text, which keeps the image.
 *
 * @param clipboardData - The paste's clipboard.
 * @returns The files to attach; empty when the paste is only text.
 */
export const filterPastedFiles = (clipboardData: PastedData): File[] => {
	const files = Array.from(clipboardData.files);
	const hasText =
		clipboardData.getData("text/plain").trim().length > 0 ||
		hasHtmlText(clipboardData.getData("text/html"));
	return hasText
		? files.filter((file) => !file.type.startsWith("image/"))
		: files;
};
