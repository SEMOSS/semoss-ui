import { usePixel } from "@semoss/sdk/react";
import { Muted, Spinner } from "@semoss/ui/next";
import type { FileMode } from "./file.types";

const getMimeType = (extension: string): string => {
	const mimeTypes: Record<string, string> = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
		bmp: "image/bmp",
	};
	return mimeTypes[extension.toLowerCase()] || "image/png";
};

interface FileImageViewerProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;
}

export const FileImageViewer: React.FC<FileImageViewerProps> = ({
	mode,
	path,
}) => {
	const ext = path.split(".").pop()?.toLowerCase() || "";

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssetsBase64(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssetsBase64(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT") {
		getFilePixel = `GetInsightAssetsBase64(filePath=["${path}"]);`;
	}

	const getFile = usePixel<string>(getFilePixel, {});

	return (
		<div className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1">
			{getFile.status === "LOADING" && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Spinner />
				</div>
			)}
			{getFile.status === "ERROR" && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Muted className="text-destructive">
						{getFile.error?.message || "Failed to load files"}
					</Muted>
				</div>
			)}
			{getFile.status === "SUCCESS" && (
				<div className="flex flex-1 items-center justify-center overflow-hidden p-4">
					<img
						src={`data:${getMimeType(ext)};base64,${getFile.data}`}
						alt={`Preview of ${path}`}
					/>
				</div>
			)}
		</div>
	);
};
