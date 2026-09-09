import { useCallback } from "react";
import {
	type FileExplorerMovedItem,
	type FileItem,
	type FileMode,
	getFileEditorPathScope,
	notifyFileEditorPathMoved,
	resolveMovedPath,
} from "@semoss/shared";
import { getFilePanelType } from "@/components/workbench/files/file-editor.utility";
import {
	WORKBENCH_COMPONENTS,
	type WorkbenchPanelRecord,
} from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/** The slice of a file-backed panel's config this hook cares about. */
interface FilePanelConfig {
	type?: "ENGINE" | "PROJECT" | "INSIGHT";
	id?: string;
	path?: string;
}

/**
 * The file a panel is open for, if it is a file-backed panel at all.
 *
 * @param record - Any open panel instance.
 * @return Its file path, or undefined.
 */
const filePathOf = (record: WorkbenchPanelRecord): string | undefined =>
	(record.config as FilePanelConfig | undefined)?.path;

/**
 * Whether a path move or delete could affect this panel.
 *
 * @param record - Any open panel instance.
 * @return True when it is file-backed.
 */
const hasFilePath = (record: WorkbenchPanelRecord): boolean =>
	Boolean(filePathOf(record));

/** Whether a panel belongs to the resource represented by a file mode. */
const isFilePanelInMode = (
	params: FilePanelConfig | undefined,
	mode: FileMode,
): boolean => {
	if (!params?.type || !params.id) return false;

	switch (mode.type) {
		case "APP":
			return params.type === "PROJECT" && params.id === mode.app;
		case "ENGINE":
			return params.type === "ENGINE" && params.id === mode.engine;
		case "INSIGHT":
			return params.type === "INSIGHT" && params.id === mode.insightId;
		default:
			return false;
	}
};

/**
 * Keep open file panels in step with the file tree.
 *
 * Every file-explorer panel needs the same two reactions — a moved or renamed
 * file has to drag its editor's path and tab title along, and a deleted one has
 * to close its editor — so they live here instead of in each explorer wrapper.
 *
 * @param fileMode - The asset scope the explorer browses. Only editors in the
 * same scope are notified of a path move.
 * @return `migrateMovedTabs` (true if anything moved) and `removeDeletedTabs`.
 */
export const useWorkbenchFilePanels = (fileMode: FileMode) => {
	const layoutActions = useWorkbench((s) => s.layout.actions);
	const scope = getFileEditorPathScope(fileMode);

	/**
	 * Repoint one panel at a new path and notify its editor.
	 *
	 * @param record - The panel to repoint.
	 * @param newPath - Where its file moved to.
	 */
	const updatePanelPath = useCallback(
		(record: WorkbenchPanelRecord, newPath: string) => {
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = filePathOf(record);
			// the editors mark unsaved work with a trailing `*` on the tab —
			// renaming must not silently clear it
			const displayName = record.name.endsWith("*")
				? `${newName}*`
				: newName;

			const isMcpEditor =
				record.type === WORKBENCH_COMPONENTS.FILE_MCP_EDITOR;
			let panelType = record.type;

			if (!isMcpEditor) {
				panelType = getFilePanelType(newPath);
			}

			layoutActions.updatePanel(record.id, {
				type: panelType,
				name: displayName,
				config: {
					...record.config,
					name: newName,
					path: newPath,
				},
			});

			if (oldPath) {
				notifyFileEditorPathMoved(oldPath, newPath, scope);
			}
		},
		[layoutActions, scope],
	);

	/**
	 * Repoint every open panel affected by a batch of moves.
	 *
	 * @param movedItems - The moves that happened.
	 * @return True if at least one panel moved with them.
	 */
	const migrateMovedTabs = useCallback(
		(movedItems: FileExplorerMovedItem[]) => {
			let migrated = false;

			for (const record of layoutActions.findPanels(
				(record) =>
					hasFilePath(record) &&
					isFilePanelInMode(
						record.config as FilePanelConfig | undefined,
						fileMode,
					),
			)) {
				const path = filePathOf(record);
				if (!path) {
					continue;
				}

				// fold every move over the path, so a file that moved twice in
				// one batch still lands in the right place
				const movedPath = movedItems.reduce(
					(currentPath, movedItem) =>
						resolveMovedPath(currentPath, movedItem) ?? currentPath,
					path,
				);

				if (movedPath !== path) {
					updatePanelPath(record, movedPath);
					migrated = true;
				}
			}

			return migrated;
		},
		[fileMode, layoutActions, updatePanelPath],
	);

	/**
	 * Close every file-backed panel at (or inside) a deleted path.
	 *
	 * @param items - The items that were deleted.
	 */
	const removeDeletedTabs = useCallback(
		(items: FileItem[]) => {
			for (const item of items) {
				const directoryPath = item.path.endsWith("/")
					? item.path
					: `${item.path}/`;
				const isDirectory = item.type === "directory";

				// the file itself, or anything under the deleted directory
				const doomed = layoutActions.findPanels((record) => {
					const recordPath = filePathOf(record);
					return (
						isFilePanelInMode(
							record.config as FilePanelConfig | undefined,
							fileMode,
						) &&
						(recordPath === item.path ||
							Boolean(
								isDirectory &&
									recordPath?.startsWith(directoryPath),
							))
					);
				});

				for (const record of doomed) {
					layoutActions.closePanel(record.id);
				}
			}
		},
		[fileMode, layoutActions],
	);

	return {
		migrateMovedTabs: migrateMovedTabs,
		removeDeletedTabs: removeDeletedTabs,
	};
};
