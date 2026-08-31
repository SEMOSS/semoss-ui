import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerHeader,
	type FileExplorerMovedItem,
	FileExplorerNewAction,
	FileExplorerRefreshAction,
	type FileItem,
	type FileMode,
	FlexLayout,
	getFileEditorPathScope,
	getParentPath,
	NewFileOverlay,
	notifyFileEditorPathMoved,
	resolveMovedPath,
	useFileExplorer,
} from "@semoss/shared";
import type { RoomStore } from "@/stores";

interface RoomFileExplorerProps {
	/** Layout */
	layout: FlexLayout.Layout | null;

	/** Room */
	room: RoomStore;

	/** FlexLayout node — used to read config (e.g. initialPath) */
	node: FlexLayout.TabNode;
}

/** Module scope: the insight scope carries no parameters of its own. */
const INSIGHT_MODE: FileMode = { type: "INSIGHT" };

/**
 * An in-place rename, as opposed to a move to another directory.
 *
 * @param moved - One entry from an `onItemsMoved` batch.
 * @return True when the item stayed in its directory.
 */
const isRename = (moved: FileExplorerMovedItem) =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

/**
 * The room sidebar's file explorer over the room insight's workspace.
 *
 * Sidebar tabs are FlexLayout nodes owned by the room store, so the tab sync is
 * local; only the path arithmetic (`resolveMovedPath`) is shared with the other
 * explorers.
 */
export const RoomFileExplorer: React.FC<RoomFileExplorerProps> = observer(
	({ layout, room, node }) => {
		const insight = useInsight();

		const config: { initialPath?: string } = node.getConfig() ?? {};
		const scope = useMemo(
			() => getFileEditorPathScope(INSIGHT_MODE, insight.insightId),
			[insight.insightId],
		);

		/**
		 * Repoint one sidebar tab at a new path, keeping its unsaved-work `*`
		 * marker.
		 *
		 * @param tabNode - The tab to repoint.
		 * @param newPath - Where its file moved to.
		 */
		const updateTabPath = (
			tabNode: FlexLayout.TabNode,
			newPath: string,
		) => {
			const tabConfig = tabNode.getConfig() as
				| { name?: string; path?: string }
				| undefined;
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = tabConfig?.path;
			const tabName = tabNode.getName();
			const displayName = tabName.endsWith("*") ? `${newName}*` : newName;

			room.sidebar.model.doAction(
				FlexLayout.Actions.updateNodeAttributes(tabNode.getId(), {
					config: {
						...tabConfig,
						name: newName,
						path: newPath,
					},
				}),
			);
			room.sidebar.model.doAction(
				FlexLayout.Actions.renameTab(tabNode.getId(), displayName),
			);

			if (oldPath) {
				notifyFileEditorPathMoved(oldPath, newPath, scope);
			}
		};

		/**
		 * Repoint every open sidebar tab affected by a batch of moves.
		 *
		 * @param movedItems - The moves that happened.
		 * @return True if at least one tab moved with them.
		 */
		const migrateMovedTabs = (movedItems: FileExplorerMovedItem[]) => {
			let migrated = false;

			room.sidebar.model.visitNodes((n) => {
				if (!(n instanceof FlexLayout.TabNode)) return;

				const path = (n.getConfig() as { path?: string } | undefined)
					?.path;
				if (!path) return;

				const movedPath = movedItems.reduce(
					(currentPath, movedItem) =>
						resolveMovedPath(currentPath, movedItem) ?? currentPath,
					path,
				);

				if (movedPath !== path) {
					updateTabPath(n, movedPath);
					migrated = true;
				}
			});

			return migrated;
		};

		/**
		 * Reveal a file's sidebar editor, opening it if it is not there.
		 *
		 * @param item - The file to open.
		 */
		const openFileTab = (item: { name: string; path: string }) => {
			room.openFileEditorSidebarNode(item.path, {
				name: item.name,
			});
		};

		/**
		 * Close every sidebar tab open for a deleted file, or — for a deleted
		 * directory — for anything that was inside it.
		 *
		 * @param items - The items that were deleted.
		 */
		const removeTabsForPath = (items: FileItem[]) => {
			const model = room.sidebar.model;
			const tabsToRemove: string[] = [];

			model.visitNodes((n) => {
				if (!(n instanceof FlexLayout.TabNode)) return;
				const path = (n.getConfig() as { path?: string } | undefined)
					?.path;
				if (!path) return;

				const isDoomed = items.some((item) => {
					const directoryPath = item.path.endsWith("/")
						? item.path
						: `${item.path}/`;
					return (
						path === item.path ||
						(item.type === "directory" &&
							path.startsWith(directoryPath))
					);
				});

				if (isDoomed) {
					tabsToRemove.push(n.getId());
				}
			});

			for (const id of tabsToRemove) {
				model.doAction(FlexLayout.Actions.deleteTab(id));
			}
		};

		const explorer = useFileExplorer({
			mode: INSIGHT_MODE,
			initialPath: config.initialPath,
			onItemSelect: openFileTab,
			onItemsMoved: (movedItems) => {
				const migrated = migrateMovedTabs(movedItems);

				// renaming a file that had no tab open reveals it
				if (
					!migrated &&
					movedItems.length === 1 &&
					isRename(movedItems[0])
				) {
					const newPath = movedItems[0].newPath;
					openFileTab({
						name:
							newPath.split("/").filter(Boolean).pop() ?? newPath,
						path: newPath,
					});
				}
			},
			onItemsDeleted: removeTabsForPath,
			onItemDragStart: (e, items) => {
				// one file at a time: a directory and a multi-item drag have no
				// single tab to become
				if (
					!layout ||
					items.length !== 1 ||
					items[0].type === "directory"
				) {
					return;
				}

				layout.addTabWithDragAndDrop(e as unknown as DragEvent, {
					type: "tab",
					name: items[0].name,
					component: "room-file-editor",
					config: {
						name: items[0].name,
						path: items[0].path,
					},
					enableClose: true,
				});
			},
		});

		return (
			<div className="h-full w-full text-foreground">
				<FileExplorer
					explorer={explorer}
					header={
						<FileExplorerHeader
							explorer={explorer}
							actions={
								<>
									<FileExplorerRefreshAction
										explorer={explorer}
									/>
									<FileExplorerNewAction
										explorer={explorer}
									/>
								</>
							}
						/>
					}
					newFileOverlay={NewFileOverlay}
				/>
			</div>
		);
	},
);
