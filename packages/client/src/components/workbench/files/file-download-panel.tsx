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
import { useAccess, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
import {
	FileDownloadControl,
	type FileDownloadControlValue,
	type FileDownloadViewMode,
} from "./file-download-control";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import { getFileDownloadPixel, getFileReadPixel } from "./file-panel.utility";

export interface FileDownloadParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	name: string;
	path: string;
}

const FileDownloadPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FileDownloadParams, FileDownloadControlValue>) => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const access = useAccess(config.type, config.id);
	const [viewMode, setViewMode] = useState<FileDownloadViewMode>("download");
	const [isDownloading, setIsDownloading] = useState(false);
	const targetInsightId =
		config.type === "INSIGHT" ? config.id : insight.insightId;
	const rawFile = usePixel<string>(
		access.status === "ready" && viewMode === "raw"
			? getFileReadPixel(config)
			: "",
		{ data: "" },
		targetInsightId,
	);

	useEffect(() => setValue({ setViewMode, viewMode }), [setValue, viewMode]);
	useWorkbenchControl(id, FileDownloadControl);

	if (access.status === "loading") {
		return (
			<WorkbenchAccessLoading
				className="size-full"
				label="Loading resource access"
			/>
		);
	}

	if (access.status === "error") {
		return (
			<WorkbenchAccessError
				className="size-full"
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	/** Download the current file from its owning resource. */
	const download = async () => {
		if (isDownloading) return;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				getFileDownloadPixel(config),
				targetInsightId,
			);
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
		<div className="relative size-full">
			<CodeEditor
				className="size-full"
				code={rawFile.data}
				disabled
				language={getCodeEditorLanguage(config.path)}
				menuItems={getFileCodeEditorMenuItems({
					canSave: false,
					isBusy: isDownloading,
					onDownload: () => void download(),
					onRefresh: rawFile.refresh,
				})}
			/>
			{access.refreshing ? (
				<WorkbenchAccessLoading
					className="absolute inset-0 bg-background/80"
					label="Refreshing resource access"
				/>
			) : null}
			{access.refreshError ? (
				<WorkbenchAccessError
					className="absolute inset-0 bg-background/90"
					message={access.refreshError}
					onRetry={() => void access.refresh()}
				/>
			) : null}
		</div>
	);
};

/** Scope-aware download viewer blueprint shared by all workbenches. */
export const FILE_DOWNLOAD_PANEL: WorkbenchPanelConfig<
	FileDownloadParams,
	FileDownloadControlValue
> = {
	name: "Download",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileDownloadPanel,
};
