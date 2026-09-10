import { SandpackHtmlPreview } from "@semoss/shared";

interface FileHtmlEditorContentProps {
	/** Markup to render, which is the editor buffer rather than the saved file
	 * once the user has typed. */
	html: string;
	/** File path, used to remount the preview when the panel switches files. */
	path: string;
}

/**
 * Thin wrapper around the sandboxed html renderer so the panel can lazy-load
 * it; the Sandpack bundle stays out of the main client chunk.
 *
 * The preview goes through the same renderer the chat uses for html it
 * generates, so a page opened from the file explorer cannot reach the app
 * around it.
 */
const FileHtmlEditorContent = ({ html, path }: FileHtmlEditorContentProps) => (
	<SandpackHtmlPreview
		key={path}
		html={html}
		forceFullHeight
		className="border-0"
	/>
);

export default FileHtmlEditorContent;
