import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import type { FilePanelParams } from "../hooks/use-file-panel";
import { useFilesChanged } from "../hooks/use-files-changed";
import { matchesFilePanel } from "../types/file-panel.types";
import type { FileViewControls, FileViewProps } from "../types/file-view.types";
import { FilePanelIcon } from "./file-panel-icon";
import { FileViewControl } from "./file-view-control";

interface CreateFileViewPanelOptions {
	/** The tab's default label: "Editor", "PDF", "Notebook". */
	name: string;
	/** The file view this panel mounts. */
	view: ComponentType<FileViewProps>;
}

/**
 * A workbench blueprint around a shared file view.
 *
 * Every file panel is the same wrapper: mount the view, republish whatever it
 * says its chrome can do, register that chrome, and re-read when someone else
 * writes the file. Only the label and the view differ, so they are a table in
 * `file-panel.components.ts` rather than eight near-identical files.
 *
 * @param options - The tab label and the view to mount.
 * @return The blueprint to register under a `FILE_PANEL_TYPES` id.
 */
export const createFileViewPanel = ({
	name,
	view: View,
}: CreateFileViewPanelOptions): WorkbenchPanelConfig<
	FilePanelParams,
	FileViewControls
> => {
	const Panel = ({ id }: WorkbenchPanelProps) => {
		const { config, rename, setValue } = useWorkbenchPanel<
			FilePanelParams,
			FileViewControls
		>(id);
		// Held here as well as in the dock so this wrapper can read them: the
		// chrome renders from the dock's copy, `useFilesChanged` from this one.
		// Writing them re-renders this wrapper either way, so what the hook
		// below is handed is never a commit behind.
		const [controls, setControls] = useState<FileViewControls | null>(null);

		useEffect(() => {
			if (controls) {
				setValue(controls);
			}
		}, [controls, setValue]);
		useWorkbenchControl(id, FileViewControl);
		// Someone else changed this file: an agent, a branch switch, a commit
		// restore. Held back while the view is dirty: re-reading re-seeds its
		// buffer from the server, which would throw unsaved edits away.
		useFilesChanged({
			mode: config.mode,
			path: config.path,
			skip: controls?.isDirty,
			refresh: () => controls?.refresh(),
		});

		return (
			<View config={config} rename={rename} onControls={setControls} />
		);
	};

	return {
		name,
		canRename: false,
		mount: "keepAlive",
		matches: matchesFilePanel,
		icon: FilePanelIcon,
		content: Panel,
	};
};
