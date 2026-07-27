import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";
import { FileDownloadView } from "./file-download-view";
import { FileImageViewer } from "./file-image-viewer";
import { FileMarkdownEditor } from "./file-markdown-editor";
import { FilePdfViewer } from "./file-pdf-viewer";
import { Notebook } from "./notebook";

// Extensions that cannot be rendered in the editor — show a download-first view instead
const NON_RENDERED_EXTENSIONS = new Set([
	"doc",
	"docx",
	"ppt",
	"pptx",
	"xls",
	"xlsx",
]);

interface FileEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;

	/** Optional handler invoked when the user runs the file via Ctrl/Cmd+Enter.
	 * Only applies to the code editor (non-rendered file types aren't runnable). */
	onRun?: () => void;

	/** Optional content rendered at the start of the code editor's toolbar row.
	 * Only applies to the code editor (other file viewers have no toolbar). */
	leadingToolbar?: React.ReactNode;
}

export const FileEditor: React.FC<FileEditorProps> = ({
	mode,
	path,
	onChange = () => null,
	onRun,
	leadingToolbar,
}) => {
	const ext = path.split(".").pop()?.toLowerCase() || "";

	const isImage = [
		"png",
		"jpg",
		"jpeg",
		"gif",
		"webp",
		"svg",
		"bmp",
	].includes(ext);
	const isPdf = ext === "pdf";
	const isNotRendered = NON_RENDERED_EXTENSIONS.has(ext);
	const isMarkdown = ext === "md" || ext === "markdown";
	const isNotebook = ext === "ipynb";

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background py-1">
			{isImage && <FileImageViewer key={path} mode={mode} path={path} />}
			{isPdf && <FilePdfViewer key={path} mode={mode} path={path} />}
			{isNotRendered && (
				<FileDownloadView
					key={path}
					mode={mode}
					path={path}
					onChange={onChange}
				/>
			)}
			{isMarkdown && (
				<FileMarkdownEditor
					key={path}
					mode={mode}
					path={path}
					onChange={onChange}
				/>
			)}
			{/* .ipynb → interactive notebook renderer/runner */}
			{isNotebook && (
				<Notebook
					key={path}
					mode={mode}
					path={path}
					onChange={onChange}
				/>
			)}
			{!isImage &&
				!isPdf &&
				!isNotRendered &&
				!isMarkdown &&
				!isNotebook && (
					<FileCodeEditor
						key={path}
						mode={mode}
						path={path}
						onChange={onChange}
						onRun={onRun}
						leadingToolbar={leadingToolbar}
					/>
				)}
		</div>
	);
};
