import { DownloadIcon, FileIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, CodeEditor, Muted } from "@semoss/ui/next";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../../utility/file-editor.utility";

/** The view switch this view offers. Module scope — the chrome reads it. */
const DOWNLOAD_VIEW_MODES = [
	{ value: "download", label: "Download" },
	{ value: "raw", label: "Raw" },
];

/** Offer a download for a file the browser cannot render, with a raw escape hatch. */
export const FileDownloadView = ({ config, onControls }: FileViewProps) => {
	const [viewMode, setViewMode] = useState<"download" | "raw">("download");
	// nothing to read unless the user asks for the raw view — this view's
	// formats are download-first
	const panel = useFilePanel(config, { enabled: viewMode === "raw" });

	// the union is known here, not in the shared chrome
	const selectViewMode = useCallback(
		(mode: string) => setViewMode(mode as "download" | "raw"),
		[],
	);

	useFileViewControls(onControls, {
		canSave: false,
		// the read is off in download mode, so there is nothing to re-run
		canRefresh: viewMode === "raw",
		isBusy: panel.isBusy,
		refresh: panel.read.refresh,
		viewModes: DOWNLOAD_VIEW_MODES,
		viewMode: viewMode,
		setViewMode: selectViewMode,
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
