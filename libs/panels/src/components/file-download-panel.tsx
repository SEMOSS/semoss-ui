import { DownloadIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, CodeEditor, Muted } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import { type FilePanelParams, useFilePanel } from "../hooks/use-file-panel";
import { useFilesChanged } from "../hooks/use-files-changed";
import { matchesFilePanel } from "../types/file-panel.types";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../utility/file-editor.utility";
import {
	FileDownloadControl,
	type FileDownloadControlValue,
	type FileDownloadViewMode,
} from "./file-download-control";
import { FilePanelIcon } from "./file-panel-icon";

export type FileDownloadParams = FilePanelParams;

/** Offer a download for a file the browser cannot render, with a raw escape hatch. */
const FileDownloadPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, setValue } = useWorkbenchPanel<
		FileDownloadParams,
		FileDownloadControlValue
	>(id);

	const [viewMode, setViewMode] = useState<FileDownloadViewMode>("download");
	// nothing to read unless the user asks for the raw view — this panel's
	// formats are download-first
	const panel = useFilePanel(config, { enabled: viewMode === "raw" });

	useEffect(() => setValue({ setViewMode, viewMode }), [setValue, viewMode]);
	useWorkbenchControl(id, FileDownloadControl);
	// Nothing unsaved to protect in a viewer, so a change on the server is
	// always worth re-reading.
	useFilesChanged({
		mode: config.mode,
		path: config.path,
		refresh: panel.read.refresh,
	});

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
	icon: FilePanelIcon,
	content: FileDownloadPanel,
};
