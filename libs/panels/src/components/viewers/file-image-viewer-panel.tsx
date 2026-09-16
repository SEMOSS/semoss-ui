import { useEffect } from "react";
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
import { getImageMimeType } from "../../utility/file-editor.utility";
import { FileRefreshControl } from "../file-panel-control";
import { FilePanelIcon } from "../file-panel-icon";

/** Preview an image file from a project, engine, or insight resource. */
const FileImageViewerPanel = ({ id }: WorkbenchPanelProps) => {
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
		<div className="relative size-full items-center justify-center overflow-hidden bg-background p-4">
			<div className="flex size-full items-center justify-center">
				<img
					className="max-h-full max-w-full object-contain"
					src={`data:${getImageMimeType(config.path)};base64,${panel.read.data}`}
					alt={`Preview of ${config.name}`}
				/>
			</div>
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
