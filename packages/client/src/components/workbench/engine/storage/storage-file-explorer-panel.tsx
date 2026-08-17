import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { runPixel, useInsight } from "@semoss/sdk/react";
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
import { useEngine, useWorkbench } from "@/hooks";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";

interface StorageFileExplorerPanelProps {
	/** FlexLayout tab node backing the storage explorer. */
	node: FlexLayout.TabNode;
}

export const StorageFileExplorerPanel: React.FC<
	StorageFileExplorerPanelProps
> = ({ node }) => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();
	const [searchParams, setSearchParams] = useSearchParams();
	const openPanel = useWorkbench((state) => state.openPanel);
	const closePanel = useWorkbench((state) => state.closePanel);
	const updatePanel = useWorkbench((state) => state.updatePanel);

	const getMovedPath = (path: string, movedItem: FileExplorerMovedItem) => {
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

	const updateTabPath = (tabNode: FlexLayout.TabNode, newPath: string) => {
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
	};

	const migrateMovedTabs = (movedItems: FileExplorerMovedItem[]) => {
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
					return getMovedPath(currentPath, movedItem) ?? currentPath;
				},
				path,
			);

			if (movedPath && movedPath !== path) {
				updateTabPath(currentNode, movedPath);
				migrated = true;
			}
		});

		return migrated;
	};

	/**
	 * Remove tabs that are open for a file that has been deleted. If it's a directory, remove all tabs that are open for files within that directory
	 * @param deletedPath the path of the deleted file or directory
	 * @param isDirectory whether the deleted path is a directory
	 */
	const removeDeletedTabs = useCallback(
		(deletedPath: string, isDirectory: boolean) => {
			const model = node.getModel();
			const directoryPath = deletedPath.endsWith("/")
				? deletedPath
				: `${deletedPath}/`;

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

				if (
					tabPath === deletedPath ||
					(isDirectory && tabPath.startsWith(directoryPath))
				) {
					closePanel(currentNode.getId());
				}
			});
		},
		[node, closePanel],
	);

	/**
	 * Add a node to the layout
	 * @param nodeId
	 * @param options
	 * @returns
	 */

	const addNode = useCallback(
		(nodeId: string, options: FlexLayout.IJsonTabNode) => {
			openPanel(nodeId, options);
		},
		[openPanel],
	);

	useEffect(() => {
		const mcpParam = searchParams.get("mcp");
		if (mcpParam === "Generate") {
			const mcpFilePath = "/mcp/pixel_mcp.json";
			addNode(`${WORKBENCH_COMPONENTS.MCP_EDITOR}--${mcpFilePath}`, {
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
	}, [searchParams, addNode, setSearchParams]);

	return (
		<FileExplorer
			readOnly={readOnly}
			mode={{
				type: "STORAGE",
				storage: engine.engine_id,
			}}
			onItemSelect={(item) => {
				if (item.type === "directory") {
					return;
				}

				const fileName =
					item.name.split("/").filter(Boolean).pop() || item.name;
				const insightFilePath = `/${fileName}`;

				runPixel<[string]>(
					`PullFromStorage(storage=["${engine.engine_id}"], storagePath=["${item.path}"], filePath="/");`,
					"new",
				)
					.then((response) => {
						if (response.errors.length > 0) {
							throw new Error(response.errors[0]);
						}

						addNode(
							`STORAGE_FILE--${response.insightId}--${insightFilePath}`,
							{
								type: "tab",
								name: item.name,
								component: WORKBENCH_COMPONENTS.FILE_EDITOR,
								config: {
									name: item.name,
									path: insightFilePath,
									fileMode: "INSIGHT",
									insightId: response.insightId,
								},
								enableClose: true,
							},
						);
					})
					.catch((e) => {
						toast.error(
							e?.message || "Failed to load storage file",
						);
					});
			}}
			onItemsMoved={migrateMovedTabs}
			onItemsDeleted={(items) => {
				items.forEach((item) => {
					removeDeletedTabs(item.path, item.type === "directory");
				});
			}}
			ItemComponent={({ item, refresh, ...otherProps }) => {
				const secondaryActions: Array<{
					name: string;
					action: (item: FileItem) => Promise<void>;
				}> = [
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

				return (
					<FileExplorerItem
						draggable={false}
						item={item}
						refresh={refresh}
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
							addNode(
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
						actions={[]}
						secondaryActions={secondaryActions}
					/>
				);
			}}
		/>
	);
};
