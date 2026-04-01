import { CodeIcon, DownloadIcon, FileIcon } from "lucide-react";
import { useState } from "react";
import { download, runPixel, useInsight } from "@semoss/sdk/react";
import { Button, Muted, toast } from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";

interface FileDownloadViewProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed (passed through to raw view) */
	onChange?: (content: string, isModified: boolean) => void;
}

export const FileDownloadView: React.FC<FileDownloadViewProps> = ({
	mode,
	path,
	onChange = () => null,
}) => {
	const insight = useInsight();
	const [isLoading, setIsLoading] = useState(false);
	const [showRaw, setShowRaw] = useState(false);

	const targetInsightId =
		mode.type === "INSIGHT"
			? mode.insightId || insight.insightId
			: insight.insightId;

	const filename = path.split("/").filter(Boolean).pop() ?? path;

	const downloadFile = async () => {
		try {
			setIsLoading(true);

			let pixel = "";
			if (mode.type === "APP") {
				pixel = `DownloadAppAsset(project=["${mode.app}"], filePath=["${path}"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `DownloadEngineAsset(engine=["${mode.engine}"], filePath=["${path}"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `DownloadInsightAsset(filePath=["${path}"]);`;
			}

			if (!pixel) {
				throw new Error("Missing pixel to download file");
			}

			let pixelReturn: { output: string }[] = [];
			if (mode.type === "INSIGHT" && targetInsightId) {
				const response = await runPixel<[string]>(
					pixel,
					targetInsightId,
				);
				pixelReturn = response.pixelReturn;
			} else {
				const response = await insight.actions.run<[string]>(pixel);
				pixelReturn = response.pixelReturn;
			}

			const fileKey = pixelReturn[0].output;
			await download(targetInsightId, fileKey);
		} catch (e) {
			toast.error("Error downloading file");
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	if (showRaw) {
		return (
			<div className="flex h-full w-full flex-col">
				<div className="flex shrink-0 items-center justify-between border-border border-b px-3 py-1.5">
					<Muted className="text-xs">{filename}</Muted>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setShowRaw(false)}
					>
						<DownloadIcon className="mr-1.5 size-3" />
						Back to download
					</Button>
				</div>
				<div className="min-h-0 flex-1">
					<FileCodeEditor
						mode={mode}
						path={path}
						onChange={onChange}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-4">
			<FileIcon className="size-12 text-muted-foreground" />
			<Muted className="max-w-xs truncate text-center font-medium text-foreground text-sm">
				{filename}
			</Muted>
			<Button
				type="button"
				variant="default"
				onClick={downloadFile}
				disabled={isLoading}
			>
				<DownloadIcon className="mr-1.5 size-4" />
				{isLoading ? "Downloading..." : "Download"}
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => setShowRaw(true)}
			>
				<CodeIcon className="mr-1.5 size-3" />
				View raw content
			</Button>
		</div>
	);
};
