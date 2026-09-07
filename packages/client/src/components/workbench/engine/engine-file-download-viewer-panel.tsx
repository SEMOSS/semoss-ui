import { DownloadIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	download as downloadFile,
	runPixel,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	getFileIconComponent,
	getFileOperationErrorMessage,
} from "@semoss/shared";
import { Button, CodeEditor, Muted, Spinner, toast } from "@semoss/ui/next";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../file-editor.utility";
import {
	EngineFileDownloadViewerControl,
	type EngineFileDownloadViewerControlValue,
	type EngineFileDownloadViewMode,
} from "./engine-file-download-viewer-control";

export interface EngineFileDownloadViewerConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileDownloadViewerPanel: WorkbenchComponent<
	EngineFileDownloadViewerConfig,
	EngineFileDownloadViewerControlValue
> = ({ config, id, setValue }) => {
	const { engine } = useEngine();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const [viewMode, setViewMode] =
		useState<EngineFileDownloadViewMode>("download");
	const [isDownloading, setIsDownloading] = useState(false);
	const targetInsightId =
		config.fileMode === "INSIGHT"
			? config.insightId || insight.insightId
			: insight.insightId;
	const rawFile = usePixel<string>(
		viewMode === "raw"
			? config.fileMode === "INSIGHT"
				? `GetInsightAssets(filePath=[${JSON.stringify(config.path)}]);`
				: `GetEngineAssets(filePath=[${JSON.stringify(config.path)}], engine=[${JSON.stringify(engine.engine_id)}]);`
			: "",
		{ data: "" },
		targetInsightId,
	);
	useEffect(() => setValue({ setViewMode, viewMode }), [setValue, viewMode]);
	useWorkbenchControl(id, EngineFileDownloadViewerControl);

	/** Download the current file from its owning engine or insight. */
	const download = async () => {
		if (isDownloading) return;

		const pixel =
			config.fileMode === "INSIGHT"
				? `DownloadInsightAsset(filePath=[${JSON.stringify(config.path)}]);`
				: `DownloadEngineAsset(engine=[${JSON.stringify(engine.engine_id)}], filePath=[${JSON.stringify(config.path)}]);`;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(pixel, targetInsightId);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			const fileKey = response.pixelReturn[0]?.output;
			if (!fileKey || !targetInsightId) {
				throw new Error("No file download is available");
			}

			await downloadFile(targetInsightId, fileKey);
			toast.success(t("fileExplorer.toasts.downloadFileSuccess"));
		} catch (error) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.downloadFileFailed"),
					error,
				),
			);
			console.error(error);
		} finally {
			setIsDownloading(false);
		}
	};

	if (viewMode === "download") {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
				<FileIcon
					aria-hidden
					className="size-12 text-muted-foreground"
				/>
				<Muted className="max-w-xs truncate text-center font-medium text-foreground text-sm">
					{config.name}
				</Muted>
				<Button
					type="button"
					onClick={() => void download()}
					disabled={isDownloading}
				>
					<DownloadIcon aria-hidden className="size-4" />
					{isDownloading ? "Downloading" : "Download"}
				</Button>
			</div>
		);
	}

	if (rawFile.status === "LOADING" || rawFile.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading raw file"
			>
				<Spinner />
			</output>
		);
	}

	if (rawFile.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{rawFile.error?.message || "Failed to load raw file"}
				</Muted>
			</div>
		);
	}

	return (
		<CodeEditor
			className="size-full"
			code={rawFile.data}
			disabled
			language={getCodeEditorLanguage(config.path)}
			menuItems={getFileCodeEditorMenuItems({
				canSave: false,
				isBusy: isDownloading || rawFile.status === "LOADING",
				onDownload: () => void download(),
				onRefresh: () => rawFile.refresh(),
			})}
		/>
	);
};

export const ENGINE_FILE_DOWNLOAD_VIEWER_PANEL: WorkbenchPanelConfig<
	EngineFileDownloadViewerConfig,
	EngineFileDownloadViewerControlValue
> = {
	name: "Download",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) =>
		a.path === b.path &&
		a.fileMode === b.fileMode &&
		a.insightId === b.insightId,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: EngineFileDownloadViewerPanel,
};
