import { useCallback } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	type FileExplorerHookOptions,
	type FileExplorerMovedItem,
	type FileItem,
	type FileMode,
	getParentPath,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
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

/** What {@link useDockFileOptions} wires an explorer to. */
type DockFileOptions = Pick<
	FileExplorerHookOptions,
	| "onItemSelect"
	| "onItemsMoved"
	| "onItemsDeleted"
	| "onItemsWritten"
	| "onItemDragStart"
>;

/**
 * Wire an explorer into the dock: a file opens in its panel, renames and
 * deletes follow the panels showing them, files written in place tell those
 * panels, and a file dragged out opens where it is dropped. Spread the result
 * into a per-mode explorer hook.
 *
 * A storage bucket has no reactor to read a file, so one of its files opens by
 * being pulled into a new insight, and its panel opens there.
 *
 * @param mode - The explorer's tree, which every panel it opens is opened
 * with.
 * @param toSourcePath - Where a path from the explorer is in its tree, for an
 * explorer kept to a folder.
 * @returns The explorer's callbacks.
 */
export const useDockFileOptions = (
	mode: FilePanelMode | Extract<FileMode, { type: "STORAGE" }>,
	toSourcePath: (path: string) => string = asIs,
): DockFileOptions => {
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const emit = useWorkbench((state) => state.events.actions.emit);
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	const openFile = useCallback(
		(item: FileItem) => {
			if (mode.type !== "STORAGE") {
				layoutActions.selectPanel(
					getFilePanelType(item.path),
					{ mode, name: item.name, path: toSourcePath(item.path) },
					{ name: item.name },
				);
				return;
			}

			const fileName =
				item.name.split("/").filter(Boolean).pop() || item.name;
			const insightPath = `/${fileName}`;
			runPixel<[string]>(
				`PullFromStorage(storage=[${JSON.stringify(mode.storage)}], storagePath=[${JSON.stringify(item.path)}], filePath="/");`,
				"new",
			)
				.then((response) => {
					if (response.errors.length > 0) {
						throw new Error(response.errors[0]);
					}
					layoutActions.selectPanel(
						getFilePanelType(insightPath),
						{
							mode: {
								type: "INSIGHT",
								insightId: response.insightId,
							},
							name: item.name,
							path: insightPath,
						},
						{ name: item.name },
					);
				})
				.catch((error: unknown) => {
					toast.error(
						error instanceof Error && error.message
							? error.message
							: "Failed to load storage file",
					);
				});
		},
		[mode, layoutActions, toSourcePath],
	);

	if (mode.type === "STORAGE") {
		// a bucket's files open as copies, so no tab follows its renames
		return { onItemSelect: openFile };
	}

	return {
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
	};
};
