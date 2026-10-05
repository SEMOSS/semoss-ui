import { DownloadIcon } from "lucide-react";
import { useEffect } from "react";
import { Button, Muted } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import {
	type FilePanelParams,
	type FilePanelValue,
	useFilePanel,
} from "../../hooks/use-file-panel";
import { useFilesChanged } from "../../hooks/use-files-changed";
import { matchesFilePanel } from "../../types/file-panel.types";
import { FileRefreshControl } from "../file-panel-control";
import { FilePanelIcon } from "../file-panel-icon";

/** Preview a PDF from a project, engine, or insight resource. */
const FilePdfViewerPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, setValue } = useWorkbenchPanel<
		FilePanelParams,
		FilePanelValue
	>(id);

	const panel = useFilePanel(config, { base64: true });

	useEffect(() => {
		setValue({ refresh: panel.read.refresh });
	}, [panel.read.refresh, setValue]);
	useWorkbenchControl(id, FileRefreshControl);
	// Nothing unsaved to protect in a viewer, so a change on the server is
	// always worth re-reading.
	useFilesChanged({
		mode: config.mode,
		path: config.path,
		refresh: panel.read.refresh,
	});

	if (panel.gate) return panel.gate;
	if (panel.readGate) return panel.readGate;

	return (
		<div className="relative size-full">
			<object
				className="size-full"
				aria-label={`Preview of ${config.name}`}
				data={`data:application/pdf;base64,${panel.read.data}`}
				type="application/pdf"
			>
				<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
					<Muted>This browser cannot display the PDF.</Muted>
					<Button
						type="button"
						onClick={() => void panel.download()}
						disabled={panel.isDownloading}
					>
						<DownloadIcon aria-hidden className="size-4" />
						{panel.isDownloading ? "Downloading" : "Download PDF"}
					</Button>
				</div>
			</object>
		</div>
	);
};

/** Scope-aware PDF viewer blueprint shared by all workbenches. */
export const FILE_PDF_VIEWER_PANEL: WorkbenchPanelConfig<
	FilePanelParams,
	FilePanelValue
> = {
	name: "PDF",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: FilePanelIcon,
	content: FilePdfViewerPanel,
};
