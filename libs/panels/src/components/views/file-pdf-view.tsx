import { DownloadIcon } from "lucide-react";
import { Button, Muted } from "@semoss/ui/next";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";

/** Preview a PDF from a project, engine, or insight resource. */
export const FilePdfView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });

	useFileViewControls(onControls, {
		canSave: false,
		isBusy: panel.isBusy,
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
