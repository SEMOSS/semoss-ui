import { DownloadIcon } from "lucide-react";
import { useEffect } from "react";
import { getFileIconComponent } from "@semoss/shared";
import { Button, Muted } from "@semoss/ui/next";
import { useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import {
	FilePdfViewerControl,
	type FilePdfViewerControlValue,
} from "./file-pdf-viewer-control";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

export type FilePdfViewerParams = FilePanelParams;

/** Preview a PDF from a project, engine, or insight resource. */
const FilePdfViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FilePdfViewerParams, FilePdfViewerControlValue>) => {
	const panel = useFilePanel(config, { base64: true });

	useEffect(() => {
		setValue({ refresh: panel.read.refresh });
	}, [panel.read.refresh, setValue]);
	useWorkbenchControl(id, FilePdfViewerControl);

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
			{panel.overlay}
		</div>
	);
};

/** Scope-aware PDF viewer blueprint shared by all workbenches. */
export const FILE_PDF_VIEWER_PANEL: WorkbenchPanelConfig<
	FilePdfViewerParams,
	FilePdfViewerControlValue
> = {
	name: "PDF",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FilePdfViewerPanel,
};
