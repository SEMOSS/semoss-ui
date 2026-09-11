import { useEffect } from "react";
import { getFileIconComponent } from "@semoss/shared";
import { useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { getImageMimeType } from "./file-editor.utility";
import {
	FileImageViewerControl,
	type FileImageViewerControlValue,
} from "./file-image-viewer-control";
import { matchesFilePanel } from "./file-panel.mode";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

export type FileImageViewerParams = FilePanelParams;

/** Preview an image file from a project, engine, or insight resource. */
const FileImageViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FileImageViewerParams, FileImageViewerControlValue>) => {
	const panel = useFilePanel(config, { base64: true });

	useEffect(() => {
		setValue({ refresh: panel.read.refresh });
	}, [panel.read.refresh, setValue]);
	useWorkbenchControl(id, FileImageViewerControl);

	if (panel.gate) return panel.gate;
	if (panel.readGate) return panel.readGate;

	return (
		<div className="relative size-full items-center justify-center overflow-hidden bg-background p-4">
			<div className="flex size-full items-center justify-center">
				<img
					className="max-h-full max-w-full object-contain"
					src={`data:${getImageMimeType(config.path)};base64,${panel.read.data}`}
					alt={`Preview of ${config.name}`}
				/>
			</div>
			{panel.overlay}
		</div>
	);
};

/** Scope-aware image viewer blueprint shared by all workbenches. */
export const FILE_IMAGE_VIEWER_PANEL: WorkbenchPanelConfig<
	FileImageViewerParams,
	FileImageViewerControlValue
> = {
	name: "Image",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileImageViewerPanel,
};
