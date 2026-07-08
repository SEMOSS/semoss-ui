import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";
import { FileDownloadView } from "./file-download-view";
import { FileImageViewer } from "./file-image-viewer";
import { FileMarkdownEditor } from "./file-markdown-editor";
import type { NotebookRowSelection } from "./file-notebook-editor";
import { FileNotebookEditor } from "./file-notebook-editor";
import { FilePdfViewer } from "./file-pdf-viewer";

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

	/** Base URL of the client SPA for notebook preview iframes.
	 * Pass VITE_PLATFORM_URL from the playground; omit in the client app. */
	platformUrl?: string;

	/** Which tab a notebook (.notebook.json) file should open on. */
	notebookInitialTab?: "edit" | "preview";

	/** Called when a row is selected in notebook preview. */
	onNotebookRowSelectionChange?: (
		selection: NotebookRowSelection | null,
	) => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
	mode,
	path,
	onChange = () => null,
	onRun,
	leadingToolbar,
	platformUrl,
	notebookInitialTab,
	onNotebookRowSelectionChange,
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
	const isNotebookJson = path.toLowerCase().endsWith(".notebook.json");

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
			{isNotebookJson && (
				<FileNotebookEditor
					key={path}
					mode={mode}
					path={path}
					onChange={onChange}
					platformUrl={platformUrl}
					initialTab={notebookInitialTab}
					onNotebookRowSelectionChange={onNotebookRowSelectionChange}
				/>
			)}
			{!isImage &&
				!isPdf &&
				!isNotRendered &&
				!isMarkdown &&
				!isNotebookJson && (
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
