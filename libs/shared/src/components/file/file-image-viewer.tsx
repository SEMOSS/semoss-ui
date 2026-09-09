import { forwardRef, useImperativeHandle } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Muted, Spinner } from "@semoss/ui/next";
import { getImageMimeType } from "../../utility/image";
import type { FileMode } from "./file.types";

interface FileImageViewerProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;
}

interface FileImageViewerRef {
	/** Refresh the image from its asset source. */
	refresh: () => void;
}

export const FileImageViewer = forwardRef<
	FileImageViewerRef,
	FileImageViewerProps
>(({ mode, path }, actionsRef) => {
	const insight = useInsight();
	const ext = path.split(".").pop()?.toLowerCase() || "";
	const targetInsightId =
		mode.type === "INSIGHT"
			? mode.insightId || insight.insightId
			: insight.insightId;

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssetsBase64(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssetsBase64(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT" && targetInsightId) {
		getFilePixel = `GetInsightAssetsBase64(filePath=["${path}"]);`;
	} else if (mode.type === "USER") {
		getFilePixel = `GetUserAssetsBase64(filePath=["${path}"]);`;
	}

	const getFile = usePixel<string>(getFilePixel, {}, targetInsightId);
	useImperativeHandle(actionsRef, () => ({
		refresh: getFile.refresh,
	}));

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
						src={`data:${getImageMimeType(ext)};base64,${getFile.data}`}
						alt={`Preview of ${path}`}
					/>
				</div>
			)}
		</div>
	);
});
