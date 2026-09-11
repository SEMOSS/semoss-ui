import { DownloadIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo } from "react";
import { decodeBase64Asset, getFileIconComponent } from "@semoss/shared";
import { Button, Muted, Spinner } from "@semoss/ui/next";
import { useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { matchesFilePanel } from "./file-panel.mode";
import {
	FilePptxViewerControl,
	type FilePptxViewerControlValue,
} from "./file-pptx-viewer-control";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

const FilePptxViewerContent = lazy(() => import("./file-pptx-viewer-content"));

export type FilePptxViewerParams = FilePanelParams;

/** Preview a PowerPoint file from a project, engine, or insight resource. */
const FilePptxViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FilePptxViewerParams, FilePptxViewerControlValue>) => {
	const panel = useFilePanel(config, { base64: true });
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);

	useEffect(() => {
		setValue({ refresh: panel.read.refresh });
	}, [panel.read.refresh, setValue]);
	useWorkbenchControl(id, FilePptxViewerControl);

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
	FilePptxViewerParams,
	FilePptxViewerControlValue
> = {
	name: "PowerPoint",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FilePptxViewerPanel,
};
