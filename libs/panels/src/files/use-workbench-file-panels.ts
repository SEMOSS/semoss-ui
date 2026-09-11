import { useCallback } from "react";
import {
	type FileExplorerMovedItem,
	type FileItem,
	type FileMode,
	notifyFileEditorPathMoved,
	resolveMovedPath,
} from "@semoss/shared";
import { useWorkbench, type WorkbenchPanelRecord } from "@semoss/workbench";
import { getFilePanelType } from "./file-editor.utility";
import { isFilePanelType } from "./file-panel.components";
import { FILE_PANEL_TYPES } from "./file-panel.constants";
import {
	type FilePanelMode,
	getFilePanelScope,
	sameFileMode,
} from "./file-panel.mode";

/** The slice of a file-backed panel's config this hook cares about. */
interface FilePanelConfig {
	mode?: FilePanelMode;
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
 * Gated on membership in `FILE_PANEL_COMPONENTS`, deliberately — not on "its
 * config carries a `path`". The Git panels carry the same `{ type, id, name,
 * path }` fields, so the structural test swept them up: renaming a file
 * repointed every open Git diff for that resource, and `updatePanelPath` then
 * retyped it into a code editor.
 *
 * @param record - Any open panel instance.
 * @return True when it is a file panel open on a path.
 */
const isFilePanel = (record: WorkbenchPanelRecord): boolean =>
	isFilePanelType(record.type) && Boolean(filePathOf(record));

/** Whether a panel is scoped to the resource the explorer is browsing. */
const isFilePanelInMode = (
	params: FilePanelConfig | undefined,
	mode: FileMode,
): boolean => Boolean(params?.mode) && sameFileMode(params.mode, mode);

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
	// one derivation, shared with the panels -- two independent ones would
	// drift and a rename would silently stop reaching an open editor
	const scope = getFilePanelScope(fileMode as FilePanelMode);

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
				record.type === FILE_PANEL_TYPES.FILE_MCP_EDITOR;
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
					isFilePanel(record) &&
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
						isFilePanel(record) &&
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
