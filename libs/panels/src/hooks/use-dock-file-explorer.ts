import { useCallback } from "react";
import {
	type FileExplorerAdapter,
	type FileExplorerApi,
	type FileExplorerMovedItem,
	type FileItem,
	type FileSource,
	getParentPath,
	useFileExplorer,
} from "@semoss/shared";
import { useWorkbench, writeSpawnDragSpec } from "@semoss/workbench";
import { FILE_PANEL_EVENTS } from "../constants/file-panel.constants";
import {
	type FilePanelMode,
	getFilePanelScope,
} from "../types/file-panel.types";
import { getFilePanelType } from "../utility/file-editor.utility";
import { useWorkbenchFilePanels } from "./use-workbench-file-panels";

/** Whether a moved item stayed in its original directory. */
const isRename = (moved: FileExplorerMovedItem): boolean =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

/** Keeps a path as it is, for an explorer that is not kept to a folder. */
const asIs = (path: string): string => path;

interface UseDockFileExplorerOptions {
	/** The explorer's scope, which every panel it opens is opened with. */
	mode: FilePanelMode;
	/** Pixels of the explorer's own, such as one kept to a folder. */
	adapter?: FileExplorerAdapter;
	/** A host's own tree, read without Pixels. */
	source?: FileSource;
	readOnly: boolean;
	initialPath?: string;
	/** Fired when a command or file operation explicitly reloads the listing. */
	onRefresh?: () => void;
	/**
	 * Where a path from the explorer is in its source, for an explorer kept to
	 * a folder. Open panels, events and drags all speak source paths.
	 */
	toSourcePath?: (path: string) => string;
}

/**
 * A file explorer wired into the dock: a file opens in its panel, renames and
 * deletes follow the panels showing them, files written in place tell those
 * panels, and a file dragged out opens where it is dropped.
 *
 * @param options - The explorer's scope and source.
 * @returns The explorer.
 */
export const useDockFileExplorer = ({
	mode,
	adapter,
	source,
	readOnly,
	initialPath,
	onRefresh,
	toSourcePath = asIs,
}: UseDockFileExplorerOptions): FileExplorerApi => {
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const emit = useWorkbench((state) => state.events.actions.emit);
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	const openFile = useCallback(
		(item: FileItem) =>
			layoutActions.selectPanel(
				getFilePanelType(item.path),
				{ mode, name: item.name, path: toSourcePath(item.path) },
				{ name: item.name },
			),
		[mode, layoutActions, toSourcePath],
	);

	return useFileExplorer({
		mode,
		adapter,
		source,
		readOnly,
		initialPath: initialPath,
		onRefresh,
		onItemSelect: openFile,
		onItemsMoved: (movedItems) => {
			const migrated = migrateMovedTabs(
				movedItems.map((moved) => ({
					item: {
						...moved.item,
						path: toSourcePath(moved.item.path),
					},
					oldPath: toSourcePath(moved.oldPath),
					newPath: toSourcePath(moved.newPath),
				})),
			);
			if (
				!migrated &&
				movedItems.length === 1 &&
				isRename(movedItems[0])
			) {
				const newPath = movedItems[0].newPath;
				openFile({
					name: newPath.split("/").filter(Boolean).pop() ?? newPath,
					path: newPath,
				});
			}
		},
		onItemsDeleted: (items) =>
			removeDeletedTabs(
				items.map((item) => ({
					...item,
					path: toSourcePath(item.path),
				})),
			),
		// An extract or a copy can land on a file an editor is showing. Nothing
		// about the panel changes, so without this it keeps displaying — and
		// would save back — the content that was just replaced.
		onItemsWritten: (paths) =>
			emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
				scope: getFilePanelScope(mode),
				paths: paths?.map(toSourcePath),
			}),
		onItemDragStart: (event, items) => {
			if (items.length !== 1 || items[0].type === "directory") {
				return;
			}

			writeSpawnDragSpec(event.dataTransfer, {
				type: getFilePanelType(items[0].path),
				config: {
					mode,
					name: items[0].name,
					path: toSourcePath(items[0].path),
				},
				name: items[0].name,
			});
		},
	});
};
