import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";
import { FileHtmlViewer } from "./file-html-viewer";
import { FileImageViewer } from "./file-image-viewer";
import { FilePdfViewer } from "./file-pdf-viewer";

interface FileEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;

	/** Callback when the file is saved */
	onSave?: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
	mode,
	path,
	onChange = () => null,
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
	const isHtml = ext === "html" || ext === "htm";

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background py-1">
			{isImage && <FileImageViewer mode={mode} path={path} />}
			{isPdf && <FilePdfViewer mode={mode} path={path} />}
			{isHtml && (
				<FileHtmlViewer mode={mode} path={path} onChange={onChange} />
			)}
			{!isImage && !isPdf && !isHtml && (
				<FileCodeEditor mode={mode} path={path} onChange={onChange} />
			)}
		</div>
	);
};
