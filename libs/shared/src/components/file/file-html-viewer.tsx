import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Muted, Spinner } from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";

interface FileHtmlViewerProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;
}

export const FileHtmlViewer: React.FC<FileHtmlViewerProps> = ({
	mode,
	path,
	onChange = () => null,
}) => {
	const insight = useInsight();
	const [view, setView] = useState<"preview" | "source">("preview");

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT") {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	}

	// Always fetch so content is ready when switching to preview
	const getFile = usePixel<string>(getFilePixel, {}, insight.insightId);

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Toggle toolbar */}
			<div className="flex shrink-0 items-center gap-1 border-b px-3 py-1.5">
				<button
					type="button"
					className={`rounded px-2.5 py-1 font-medium text-sm transition-colors ${
						view === "preview"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => setView("preview")}
				>
					Preview
				</button>
				<button
					type="button"
					className={`rounded px-2.5 py-1 font-medium text-sm transition-colors ${
						view === "source"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => setView("source")}
				>
					Source
				</button>
			</div>

			{/* Content area */}
			<div className="relative flex flex-1 overflow-hidden">
				{view === "preview" && (
					<>
						{getFile.status === "LOADING" && (
							<div className="flex flex-1 items-center justify-center">
								<Spinner />
							</div>
						)}
						{getFile.status === "ERROR" && (
							<div className="flex flex-1 items-center justify-center">
								<Muted className="text-destructive">
									{getFile.error?.message ||
										"Failed to load file"}
								</Muted>
							</div>
						)}
						{getFile.status === "SUCCESS" && (
							<iframe
								className="h-full w-full border-0"
								srcDoc={getFile.data}
								title={`Preview of ${path}`}
								sandbox="allow-scripts"
							/>
						)}
					</>
				)}
				{view === "source" && (
					<FileCodeEditor
						mode={mode}
						path={path}
						onChange={onChange}
					/>
				)}
			</div>
		</div>
	);
};
