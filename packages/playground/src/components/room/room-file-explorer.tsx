import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { download, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FileExplorerMovedItem,
	FlexLayout,
	getFileEditorPathScope,
	notifyFileEditorPathMoved,
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

export const RoomFileExplorer: React.FC<RoomFileExplorerProps> = observer(
	({ layout, room, node }) => {
		const insight = useInsight();
		const { t } = useTranslation("room");

		const config: { initialPath?: string } = node.getConfig() ?? {};

		const getMovedPath = (
			path: string,
			movedItem: FileExplorerMovedItem,
		) => {
			const oldPathWithSlash = movedItem.oldPath.endsWith("/")
				? movedItem.oldPath
				: `${movedItem.oldPath}/`;
			const newPathWithSlash = movedItem.newPath.endsWith("/")
				? movedItem.newPath
				: `${movedItem.newPath}/`;

			if (path === movedItem.oldPath) {
				return movedItem.newPath;
			}

			if (
				movedItem.item.type === "directory" &&
				path.startsWith(oldPathWithSlash)
			) {
				return `${newPathWithSlash}${path.slice(oldPathWithSlash.length)}`;
			}

			return null;
		};

		const updateTabPath = (
			tabNode: FlexLayout.TabNode,
			newPath: string,
		) => {
			const config = tabNode.getConfig() as
				| { name?: string; path?: string }
				| undefined;
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = config?.path;
			const scope = getFileEditorPathScope(
				{ type: "INSIGHT" },
				insight.insightId,
			);
			const tabName = tabNode.getName();
			const displayName = tabName.endsWith("*") ? `${newName}*` : newName;

			room.sidebar.model.doAction(
				FlexLayout.Actions.updateNodeAttributes(tabNode.getId(), {
					config: {
						...config,
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

		const migrateMovedTabs = (movedItems: FileExplorerMovedItem[]) => {
			let migrated = false;

			room.sidebar.model.visitNodes((n) => {
				if (!(n instanceof FlexLayout.TabNode)) return;

				const cfg = n.getConfig() as { path?: string } | undefined;
				const path = cfg?.path;
				if (!path) return;

				const movedPath = movedItems.reduce<string | null>(
					(currentPath, movedItem) => {
						if (!currentPath) return currentPath;
						return (
							getMovedPath(currentPath, movedItem) ?? currentPath
						);
					},
					path,
				);

				if (movedPath && movedPath !== path) {
					updateTabPath(n, movedPath);
					migrated = true;
				}
			});

			return migrated;
		};

		const openFileTab = (item: { name: string; path: string }) => {
			let selectedNode: FlexLayout.TabNode | null = null;

			room.sidebar.model.visitNodes((n) => {
				if (selectedNode || !(n instanceof FlexLayout.TabNode)) {
					return;
				}

				const cfg = n.getConfig() as { path?: string } | undefined;
				if (
					n.getComponent() === "room-file-editor" &&
					cfg?.path === item.path
				) {
					selectedNode = n;
				}
			});

			if (selectedNode) {
				room.sidebar.model.doAction(
					FlexLayout.Actions.selectTab(selectedNode.getId()),
				);
				return;
			}

			room.addSidebarNode(`FILE--${item.path}`, {
				type: "tab",
				name: item.name,
				component: "room-file-editor",
				config: {
					name: item.name,
					path: item.path,
				},
				enableClose: true,
			});
		};

		const removeTabsForPath = (
			deletedPath: string,
			isDirectory: boolean,
		) => {
			const model = room.sidebar.model;
			const prefix =
				isDirectory && !deletedPath.endsWith("/")
					? `${deletedPath}/`
					: null;
			const tabsToRemove: string[] = [];
			model.visitNodes((n) => {
				if (!(n instanceof FlexLayout.TabNode)) return;
				const cfg = n.getConfig() as { path?: string } | undefined;
				const p = cfg?.path;
				if (!p) return;
				if (p === deletedPath || (prefix && p.startsWith(prefix))) {
					tabsToRemove.push(n.getId());
				}
			});
			for (const id of tabsToRemove) {
				model.doAction(FlexLayout.Actions.deleteTab(id));
			}
		};

		return (
			<div className="h-full w-full text-foreground">
				<FileExplorer
					mode={{
						type: "INSIGHT",
					}}
					initialPath={config.initialPath}
					onItemSelect={(item) => {
						// don't open directories
						if (item.type === "directory") {
							return;
						}

						openFileTab(item);
					}}
					onItemsMoved={migrateMovedTabs}
					onItemsDeleted={(items) => {
						items.forEach((item) => {
							removeTabsForPath(
								item.path,
								item.type === "directory",
							);
						});
					}}
					ItemComponent={({ item, refresh, ...otherProps }) => {
						return (
							<FileExplorerItem
								draggable={item.type !== "directory"}
								item={item}
								refresh={refresh}
								onDragStart={(e) => {
									// cannot drag directories
									if (item.type === "directory") {
										return;
									}

									// add to layout
									layout.addTabWithDragAndDrop(
										e as unknown as DragEvent,
										{
											type: "tab",
											name: item.name,
											component: "room-file-editor",
											config: {
												name: item.name,
												path: item.path,
											},
											enableClose: true,
										},
									);
								}}
								{...otherProps}
								onAfterRename={(oldPath, newPath) => {
									const migrated = migrateMovedTabs([
										{
											item,
											oldPath,
											newPath,
										},
									]);
									if (migrated) {
										return;
									}

									const newName =
										newPath
											.split("/")
											.filter(Boolean)
											.pop() ?? newPath;
									openFileTab({
										name: newName,
										path: newPath,
									});
								}}
								secondaryActions={[
									{
										name: t("fileExplorer.copyPath"),
										action: async (item) => {
											try {
												await navigator.clipboard.writeText(
													item.path,
												);
											} catch (_e) {
												throw new Error(
													t(
														"fileExplorer.copyFailed",
													),
												);
											}
										},
									},
									{
										name: t("fileExplorer.download"),
										action: async (item) => {
											// save it
											const { pixelReturn } =
												await insight.actions.run<
													[string]
												>(
													`DownloadInsightAsset(filePath=["${item.path}"]);`,
												);

											// get the file key
											const fileKey =
												pixelReturn[0].output;

											// download the file
											await download(
												insight.insightId,
												fileKey,
											);

											refresh();
										},
									},
									{
										name: t("fileExplorer.delete"),
										action: async (item) => {
											await insight.actions.run(
												`DeleteInsightAssets(filePath=["${item.path}"]);`,
											);

											removeTabsForPath(
												item.path,
												item.type === "directory",
											);
											refresh();
										},
									},
								]}
							/>
						);
					}}
				/>
			</div>
		);
	},
);
