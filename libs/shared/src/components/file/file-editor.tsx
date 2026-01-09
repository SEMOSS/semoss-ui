import { Muted } from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";
import { FileImageViewer } from "./file-image-viewer";
import { FilePdfViewer } from "./file-pdf-viewer";

interface FileEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;
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
	const isCode = [
		"json",
		"text",
		"txt",
		"jsx",
		"tsx",
		"javascript",
		"js",
		"typescript",
		"ts",
		"html",
		"css",
		"python",
		"py",
		"json",
		"java",
		"markdown",
		"md",
		"yaml",
		"yml",
		"xml",
		"sh",
		"bash",
		"csv",
		"tsv",
	].includes(ext);

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background py-1">
			{isImage && <FileImageViewer mode={mode} path={path} />}
			{isPdf && <FilePdfViewer mode={mode} path={path} />}
			{isCode && (
				<FileCodeEditor
					mode={mode}
					path={path}
					language={
						ext as React.ComponentProps<
							typeof FileCodeEditor
						>["language"]
					}
					onChange={onChange}
				/>
			)}
			{!isImage && !isPdf && !isCode && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Muted>
						Unable to preview files of type ".
						{path.split(".").pop() || "unknown"}". This file type is
						not supported.
					</Muted>
				</div>
			)}
		</div>
	);
};
