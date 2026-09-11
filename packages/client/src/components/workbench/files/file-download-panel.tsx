import { DownloadIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getFileIconComponent } from "@semoss/shared";
import { Button, CodeEditor, Muted } from "@semoss/ui/next";
import { useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import {
	FileDownloadControl,
	type FileDownloadControlValue,
	type FileDownloadViewMode,
} from "./file-download-control";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import { matchesFilePanel } from "./file-panel.mode";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

export type FileDownloadParams = FilePanelParams;

/** Offer a download for a file the browser cannot render, with a raw escape hatch. */
const FileDownloadPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FileDownloadParams, FileDownloadControlValue>) => {
	const [viewMode, setViewMode] = useState<FileDownloadViewMode>("download");
	// nothing to read unless the user asks for the raw view — this panel's
	// formats are download-first
	const panel = useFilePanel(config, { enabled: viewMode === "raw" });

	useEffect(() => setValue({ setViewMode, viewMode }), [setValue, viewMode]);
	useWorkbenchControl(id, FileDownloadControl);

	if (panel.gate) return panel.gate;

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
					onClick={() => void panel.download()}
					disabled={panel.isDownloading}
				>
					<DownloadIcon aria-hidden className="size-4" />
					{panel.isDownloading ? "Downloading" : "Download"}
				</Button>
			</div>
		);
	}

	if (panel.readGate) return panel.readGate;

	return (
		<div className="relative size-full">
			<CodeEditor
				className="size-full"
				code={panel.read.data}
				disabled
				language={getCodeEditorLanguage(config.path)}
				menuItems={getFileCodeEditorMenuItems({
					canSave: false,
					isBusy: panel.isDownloading,
					onDownload: () => void panel.download(),
					onRefresh: panel.read.refresh,
				})}
			/>
			{panel.overlay}
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
	matches: matchesFilePanel,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileDownloadPanel,
};
