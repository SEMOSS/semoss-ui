import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { download, useInsight } from "@semoss/sdk/react";
import { FileExplorer, FileExplorerItem, FlexLayout } from "@semoss/shared";
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
			<FileExplorer
				mode={{
					type: "INSIGHT",
				}}
				initialPath={config.initialPath}
				enableMultiSelect={true}
				onItemSelect={(item) => {
					// don't open directories
					if (item.type === "directory") {
						return;
					}

					// this will select if there or open if not
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
								const newName =
									newPath.split("/").filter(Boolean).pop() ??
									newPath;
								removeTabsForPath(oldPath, false);
								room.addSidebarNode(`FILE--${newPath}`, {
									type: "tab",
									name: newName,
									component: "room-file-editor",
									config: { name: newName, path: newPath },
									enableClose: true,
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
												t("fileExplorer.copyFailed"),
											);
										}
									},
								},
								{
									name: t("fileExplorer.download"),
									action: async (item) => {
										// save it
										const { pixelReturn } =
											await insight.actions.run<[string]>(
												`DownloadInsightAsset(filePath=["${item.path}"]);`,
											);

										// get the file key
										const fileKey = pixelReturn[0].output;

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
		);
	},
);
