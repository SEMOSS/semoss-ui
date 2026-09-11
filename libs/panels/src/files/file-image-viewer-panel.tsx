import { useEffect } from "react";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl } from "@semoss/workbench";
import { getImageMimeType } from "./file-editor.utility";
import { matchesFilePanel } from "./file-panel.mode";
import { FileRefreshControl } from "./file-panel-control";
import { FilePanelIcon } from "./file-panel-icon";
import {
	type FilePanelParams,
	type FilePanelValue,
	useFilePanel,
} from "./use-file-panel";

/** Preview an image file from a project, engine, or insight resource. */
const FileImageViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FilePanelParams, FilePanelValue>) => {
	const panel = useFilePanel(config, { base64: true });

	useEffect(() => {
		setValue({ refresh: panel.read.refresh });
	}, [panel.read.refresh, setValue]);
	useWorkbenchControl(id, FileRefreshControl);

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
	FilePanelParams,
	FilePanelValue
> = {
	name: "Image",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: FilePanelIcon,
	content: FileImageViewerPanel,
};
