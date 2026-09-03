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
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../file-editor.utility";
import {
	ProjectFileDownloadViewerControl,
	type ProjectFileDownloadViewerControlValue,
	type ProjectFileDownloadViewMode,
} from "./project-file-download-viewer-control";

export interface ProjectFileDownloadViewerConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileDownloadViewerPanel: WorkbenchComponent<
	ProjectFileDownloadViewerConfig,
	ProjectFileDownloadViewerControlValue
> = ({ config, id, setValue }) => {
	const { project } = useProject();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const [viewMode, setViewMode] =
		useState<ProjectFileDownloadViewMode>("download");
	const [isDownloading, setIsDownloading] = useState(false);
	const rawFile = usePixel<string>(
		viewMode === "raw"
			? `GetAppAssets(filePath=[${JSON.stringify(config.path)}], project=[${JSON.stringify(project.project_id)}]);`
			: "",
		{ data: "" },
	);
	useEffect(() => setValue({ setViewMode, viewMode }), [setValue, viewMode]);
	useWorkbenchControl(id, ProjectFileDownloadViewerControl);

	/** Download the current project file. */
	const download = async () => {
		if (isDownloading) return;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				`DownloadAppAsset(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(config.path)}]);`,
				insight.insightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			const fileKey = response.pixelReturn[0]?.output;
			if (!fileKey || !insight.insightId) {
				throw new Error("No file download is available");
			}

			await downloadFile(insight.insightId, fileKey);
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

export const PROJECT_FILE_DOWNLOAD_VIEWER_PANEL: WorkbenchPanelConfig<
	ProjectFileDownloadViewerConfig,
	ProjectFileDownloadViewerControlValue
> = {
	name: "Download",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: ProjectFileDownloadViewerPanel,
};
