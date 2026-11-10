import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchPanel,
	WorkbenchPanelLoading,
} from "@semoss/workbench";
import { FILE_PANEL_EVENTS } from "../constants/file-panel.constants";
import type { FilePanelParams } from "../hooks/use-file-panel";
import { useFilesChanged } from "../hooks/use-files-changed";
import { matchesFilePanel } from "../types/file-panel.types";
import type {
	FileViewControls,
	PptxShapeSelectedPayload,
} from "../types/file-view.types";
import { FilePanelIcon } from "./file-panel-icon";
import { FileViewControl } from "./file-view-control";

const FilePptxView = lazy(() =>
	import("./views/file-pptx-view").then(({ FilePptxView }) => ({
		default: FilePptxView,
	})),
);

const Panel = ({ id }: WorkbenchPanelProps) => {
	const { config, rename, setValue } = useWorkbenchPanel<
		FilePanelParams,
		FileViewControls
	>(id);
	const [controls, setControls] = useState<FileViewControls | null>(null);
	const emit = useWorkbench((state) => state.events.actions.emit);

	useEffect(() => {
		if (controls) setValue(controls);
	}, [controls, setValue]);

	useWorkbenchControl(id, FileViewControl);
	useFilesChanged({
		mode: config.mode,
		path: config.path,
		skip: controls?.isDirty,
		refresh: () => controls?.refresh(),
	});

	const handleShapeSelected = useCallback(
		(payload: PptxShapeSelectedPayload) => {
			emit(FILE_PANEL_EVENTS.PPTX_SHAPE_SELECTED, payload);
		},
		[emit],
	);

	return (
		<Suspense
			fallback={<WorkbenchPanelLoading label="Loading PowerPoint" />}
		>
			<FilePptxView
				config={config}
				rename={rename}
				onControls={setControls}
				onShapeSelected={handleShapeSelected}
			/>
		</Suspense>
	);
};

export const FILE_PPTX_VIEWER_PANEL: WorkbenchPanelConfig<
	FilePanelParams,
	FileViewControls
> = {
	name: "PowerPoint",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: FilePanelIcon,
	content: Panel,
};
