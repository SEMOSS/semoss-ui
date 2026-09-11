import { DownloadIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo } from "react";
import { decodeBase64Asset } from "@semoss/shared";
import { Button, Muted, Spinner } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl } from "@semoss/workbench";
import { matchesFilePanel } from "./file-panel.mode";
import { FileRefreshControl } from "./file-panel-control";
import { FilePanelIcon } from "./file-panel-icon";
import {
	type FilePanelParams,
	type FilePanelValue,
	useFilePanel,
} from "./use-file-panel";

const FilePptxViewerContent = lazy(() => import("./file-pptx-viewer-content"));

/** Preview a PowerPoint file from a project, engine, or insight resource. */
const FilePptxViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FilePanelParams, FilePanelValue>) => {
	const panel = useFilePanel(config, { base64: true });
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);

	useEffect(() => {
		setValue({ refresh: panel.read.refresh });
	}, [panel.read.refresh, setValue]);
	useWorkbenchControl(id, FileRefreshControl);

	if (panel.gate) return panel.gate;

	// checked before the shared read gate: a decode failure is not a read
	// failure, and both offer the download as the way out
	if (panel.read.status === "ERROR" || (panel.read.data && !content)) {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
				<Muted className="text-destructive" role="alert">
					{panel.read.error?.message ||
						"Failed to load the presentation"}
				</Muted>
				<Button
					type="button"
					onClick={() => void panel.download()}
					disabled={panel.isDownloading}
				>
					<DownloadIcon aria-hidden className="size-4" />
					{panel.isDownloading ? "Downloading" : "Download file"}
				</Button>
			</div>
		);
	}

	if (panel.readGate) return panel.readGate;
	if (!content) return null;

	return (
		<div className="relative size-full">
			<Suspense
				fallback={
					<output
						className="flex size-full items-center justify-center"
						aria-label="Loading presentation viewer"
					>
						<Spinner />
					</output>
				}
			>
				<FilePptxViewerContent
					content={content}
					fileName={config.name}
				/>
			</Suspense>
			{panel.overlay}
		</div>
	);
};

/** Scope-aware PowerPoint viewer blueprint shared by all workbenches. */
export const FILE_PPTX_VIEWER_PANEL: WorkbenchPanelConfig<
	FilePanelParams,
	FilePanelValue
> = {
	name: "PowerPoint",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: FilePanelIcon,
	content: FilePptxViewerPanel,
};
