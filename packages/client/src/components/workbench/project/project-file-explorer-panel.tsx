import { HammerIcon, PencilIcon } from "lucide-react";
import { useCallback } from "react";
import { download, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FileExplorerMovedItem,
	type FileItem,
	FlexLayout,
	getFileEditorPathScope,
	notifyFileEditorPathMoved,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { MCP } from "@/constants";
import { useProject, useWorkbench } from "@/hooks";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

interface ProjectFileExplorerPanelProps {
	/** Live FlexLayout instance used for drag-and-drop file tabs. */
	layout: FlexLayout.Layout;

	/** FlexLayout tab node backing the file explorer. */
	node: FlexLayout.TabNode;

	/** Directory the explorer opens to (defaults to the project root). */
	initialPath?: string;

	/**
	 * Forces browse-only behavior regardless of permission. Read-only is
	 * already derived from the project permission, so this is only needed by
	 * view-only workbenches that must stay read-only for an OWNER/EDIT user.
	 */
	readOnly?: boolean;
}

/**
 * Project-scoped file explorer panel. The engine workbenches use
 * `EngineFileExplorerPanel`; this is its `APP`-mode twin, opening project files
 * into `PROJECT_FILE_EDITOR` / `PROJECT_MCP_EDITOR` panels and keeping open tabs
 * in sync as files are renamed, moved, or deleted.
 */
export const ProjectFileExplorerPanel: React.FC<
	ProjectFileExplorerPanelProps
> = ({ layout, node, initialPath, readOnly = false }) => {
	const { project, permission } = useProject();
	// Only OWNER/EDIT users can mutate project assets; everyone else gets
	// browse/open/download behavior without create/delete actions.
	const isReadOnly =
		readOnly || !(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();

	const openPanel = useWorkbench((state) => state.openPanel);
	const closePanel = useWorkbench((state) => state.closePanel);
	const updatePanel = useWorkbench((state) => state.updatePanel);

	const getMovedPath = useCallback(
		(path: string, movedItem: FileExplorerMovedItem) => {
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
		},
		[],
	);

	const updateTabPath = useCallback(
		(tabNode: FlexLayout.TabNode, newPath: string) => {
			const config = tabNode.getConfig() as
				| {
						name?: string;
						path?: string;
				  }
				| undefined;
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = config?.path;
			const scope = getFileEditorPathScope({
				type: "APP",
				app: project.project_id,
			});
			const tabName = tabNode.getName();
			const displayName = tabName.endsWith("*") ? `${newName}*` : newName;

			updatePanel(tabNode.getId(), {
				name: displayName,
				config: {
					...config,
					name: newName,
					path: newPath,
				},
			});

			if (oldPath) {
				notifyFileEditorPathMoved(oldPath, newPath, scope);
			}
		},
		[updatePanel, project.project_id],
	);

	const migrateMovedTabs = useCallback(
		(movedItems: FileExplorerMovedItem[]) => {
			const model = node.getModel();
			let migrated = false;

			model.visitNodes((currentNode) => {
				if (!(currentNode instanceof FlexLayout.TabNode)) {
					return;
				}

				const config = currentNode.getConfig() as
					| { path?: string }
					| undefined;
				const path = config?.path;
				if (!path) {
					return;
				}

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
					updateTabPath(currentNode, movedPath);
					migrated = true;
				}
			});

			return migrated;
		},
		[node, getMovedPath, updateTabPath],
	);

	const removeDeletedTabs = useCallback(
		(path: string, isDirectory: boolean) => {
			const model = node.getModel();
			const directoryPath = path.endsWith("/") ? path : `${path}/`;

			model.visitNodes((currentNode) => {
				if (!(currentNode instanceof FlexLayout.TabNode)) {
					return;
				}

				const config = currentNode.getConfig() as
					| { path?: string }
					| undefined;
				const tabPath = config?.path;
				if (!tabPath) {
					return;
				}

				// Close if exact match or if it's in the deleted directory
				if (
					tabPath === path ||
					(isDirectory && tabPath.startsWith(directoryPath))
				) {
					closePanel(currentNode.getId());
				}
			});
		},
		[node, closePanel],
	);

	return (
		<FileExplorer
			readOnly={isReadOnly}
			initialPath={initialPath}
			mode={{
				type: "APP",
				app: project.project_id,
			}}
			onItemSelect={(item) => {
				// don't open directories
				if (item.type === "directory") {
					return;
				}

				// this will select if there or open if not
				openPanel(
					`${WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR}--${item.path}`,
					{
						type: "tab",
						name: item.name,
						component: WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
						config: {
							name: item.name,
							path: item.path,
						},
						enableClose: true,
					},
				);
			}}
			onItemsMoved={migrateMovedTabs}
			onItemsDeleted={(items) => {
				items.forEach((item) => {
					closePanel(
						`${WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR}--${item.path}`,
					);

					removeDeletedTabs(item.path, item.type === "directory");
				});
			}}
			ItemComponent={({ item, refresh, ...otherProps }) => {
				const isDriverFile =
					item.type !== "directory" &&
					MCP.DRIVER_PATHS.some((f) => item.path === f);
				const actions = [];

				if (isDriverFile && !isReadOnly) {
					actions.push({
						name: "Create",
						icon: <HammerIcon />,
						tooltip: "Create Toolbox",
						action: async () => {
							try {
								await insight.actions.run(
									`MakePythonMCP(project=["${project.project_id}"]);`,
								);

								// refresh the explorer
								refresh();
							} catch (e) {
								toast.error(`Error: ${e}`);
							}

							// open the editor for the created file (always, even if MakePythonMCP fails)
							openPanel(
								`${WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR}--/mcp/py_mcp.json`,
								{
									type: "tab",
									name: `Toolbox Editor - py_mcp.json`,
									component:
										WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR,
									config: {
										name: "py_mcp.json",
										path: "/mcp/py_mcp.json",
									},
									enableClose: true,
								},
							);
						},
					});
				}

				if (
					MCP.JSON_PATHS.some((f) => item.path.startsWith(f)) &&
					item.type !== "directory"
				) {
					actions.push({
						name: "Edit",
						icon: <PencilIcon />,
						tooltip: "Edit Toolbox",
						action: async (item: FileItem) => {
							// this will select if there or open if not
							openPanel(
								`${WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR}--${item.path}`,
								{
									type: "tab",
									name: `Toolbox Editor - ${item.name}`,
									component:
										WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR,
									config: {
										name: item.name,
										path: item.path,
									},
									enableClose: true,
								},
							);
						},
					});
				}

				const secondaryActions = [
					{
						name: "Copy Path",
						action: async (item: FileItem) => {
							try {
								await navigator.clipboard.writeText(item.path);
							} catch (_e) {
								throw new Error("Failed to copy to clipboard");
							}
						},
					},
				];

				if (item.type !== "directory") {
					secondaryActions.push({
						name: "Download",
						action: async (item: FileItem) => {
							// save it
							const { pixelReturn } = await insight.actions.run<
								[string]
							>(
								`DownloadAppAsset(project=["${project.project_id}"], filePath=["${item.path}"]);`,
							);

							// get the file key
							const fileKey = pixelReturn[0].output;

							// download the file
							await download(insight.insightId, fileKey);

							refresh();
						},
					});
				}

				if (!isReadOnly) {
					secondaryActions.push({
						name: "Delete",
						action: async (item: FileItem) => {
							await insight.actions.run(
								`DeleteAppAssets(project=["${project.project_id}"], filePath=["${item.path}"]);`,
							);
							removeDeletedTabs(
								item.path,
								item.type === "directory",
							);
							refresh();
						},
					});
				}

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
									component:
										WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
									config: {
										name: item.name,
										path: item.path,
									},
									enableClose: true,
								},
							);
						}}
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
								newPath.split("/").filter(Boolean).pop() ??
								newPath;
							openPanel(
								`${WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR}--${newPath}`,
								{
									type: "tab",
									name: newName,
									component:
										WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
									config: {
										name: newName,
										path: newPath,
									},
									enableClose: true,
								},
							);
						}}
						{...otherProps}
						actions={actions}
						secondaryActions={secondaryActions}
					/>
				);
			}}
		/>
	);
};
