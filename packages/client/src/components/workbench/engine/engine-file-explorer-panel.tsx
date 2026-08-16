import { HammerIcon, PencilIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useEngine } from "@/hooks";
import { useWorkbench } from "@/hooks/use-workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

interface EngineFileExplorerPanelProps {
	/** Live FlexLayout instance used for drag-and-drop file tabs. */
	layout: FlexLayout.Layout;

	/** FlexLayout tab node backing the file explorer. */
	node: FlexLayout.TabNode;
}

export const EngineFileExplorerPanel: React.FC<
	EngineFileExplorerPanelProps
> = ({ layout, node }) => {
	const { engine, permission } = useEngine();
	// Only OWNER/EDIT users can mutate engine assets; READ_ONLY users get
	// browse/open/download behavior without create/delete actions.
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();
	const [searchParams, setSearchParams] = useSearchParams();

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
						fileMode?: "ENGINE" | "INSIGHT";
						insightId?: string;
						name?: string;
						path?: string;
				  }
				| undefined;
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = config?.path;
			const scope =
				config?.fileMode === "INSIGHT"
					? getFileEditorPathScope(
							{
								type: "INSIGHT",
								insightId: config.insightId,
							},
							insight.insightId,
						)
					: getFileEditorPathScope({
							type: "ENGINE",
							engine: engine.engine_id,
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
		[updatePanel, insight, engine.engine_id],
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

	useEffect(() => {
		const mcpParam = searchParams.get("mcp");
		if (mcpParam === "Generate") {
			const mcpFilePath = "/mcp/pixel_mcp.json";
			openPanel(`${WORKBENCH_COMPONENTS.MCP_EDITOR}--${mcpFilePath}`, {
				type: "tab",
				name: `Toolbox Editor - pixel_mcp.json`,
				component: WORKBENCH_COMPONENTS.MCP_EDITOR,
				config: {
					name: "pixel_mcp.json",
					path: mcpFilePath,
				},
				enableClose: true,
			});
			toast.success("MCP generated");
			searchParams.delete("mcp");
			setSearchParams(searchParams);
		}
	}, [searchParams, openPanel, setSearchParams]);

	return (
		<FileExplorer
			readOnly={readOnly}
			mode={{
				type: "ENGINE",
				engine: engine.engine_id,
			}}
			onItemSelect={(item) => {
				// don't open directories
				if (item.type === "directory") {
					return;
				}

				// this will select if there or open if not
				openPanel(`${WORKBENCH_COMPONENTS.FILE_EDITOR}--${item.path}`, {
					type: "tab",
					name: item.name,
					component: WORKBENCH_COMPONENTS.FILE_EDITOR,
					config: {
						name: item.name,
						path: item.path,
					},
					enableClose: true,
				});
			}}
			onItemsMoved={migrateMovedTabs}
			onItemsDeleted={(items) => {
				items.forEach((item) => {
					closePanel(
						`${WORKBENCH_COMPONENTS.FILE_EDITOR}--${item.path}`,
					);

					removeDeletedTabs(item.path, item.type === "directory");
				});
			}}
			ItemComponent={({ item, refresh, ...otherProps }) => {
				const isDriverFile =
					item.type !== "directory" &&
					MCP.DRIVER_PATHS.some((f) => item.path === f);
				const actions = [];

				if (isDriverFile && !readOnly) {
					actions.push({
						name: "Create",
						icon: <HammerIcon />,
						tooltip: "Create Toolbox",
						action: async () => {
							try {
								await insight.actions.run(
									`MakePythonMCP(engine=["${engine.engine_id}"]);`,
								);

								// refresh the explorer
								refresh();
							} catch (e) {
								toast.error(`Error: ${e}`);
							}

							// open the editor for the created file (always, even if MakePythonMCP fails)
							openPanel(
								`${WORKBENCH_COMPONENTS.MCP_EDITOR}--/mcp/py_mcp.json`,
								{
									type: "tab",
									name: `Toolbox Editor - py_mcp.json`,
									component: WORKBENCH_COMPONENTS.MCP_EDITOR,
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
								`${WORKBENCH_COMPONENTS.MCP_EDITOR}--${item.path}`,
								{
									type: "tab",
									name: `Toolbox Editor - ${item.name}`,
									component: WORKBENCH_COMPONENTS.MCP_EDITOR,
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
								`DownloadEngineAsset(engine=["${engine.engine_id}"], filePath=["${item.path}"]);`,
							);

							// get the file key
							const fileKey = pixelReturn[0].output;

							// download the file
							await download(insight.insightId, fileKey);

							refresh();
						},
					});
				}

				if (!readOnly) {
					secondaryActions.push({
						name: "Delete",
						action: async (item: FileItem) => {
							await insight.actions.run(
								`DeleteEngineAssets(engine=["${engine.engine_id}"], filePath=["${item.path}"]);`,
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
									component: WORKBENCH_COMPONENTS.FILE_EDITOR,
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
								`${WORKBENCH_COMPONENTS.FILE_EDITOR}--${newPath}`,
								{
									type: "tab",
									name: newName,
									component: WORKBENCH_COMPONENTS.FILE_EDITOR,
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
