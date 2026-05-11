import { CloudUploadIcon, HammerIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { download, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FileExplorerMovedItem,
	FlexLayout,
	getFileEditorPathScope,
	notifyFileEditorPathMoved,
} from "@semoss/shared";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { MCP } from "@/constants";

interface AppFileExplorerProps {
	/** Node */
	layout: FlexLayout.Layout | null;

	/** Node */
	node: FlexLayout.TabNode;

	/** App */
	app: string;

	/**
	 * Optional callback when visible asset paths change in the browser
	 */
	onVisibleAssetPathsChange?: (payload: {
		path: string;
		paths: string[];
	}) => void;

	/**
	 * Optional callback when the file explorer panel is mounted/unmounted
	 */
	onOpenStateChange?: (isOpen: boolean) => void;
}

export const AppFileExplorer: React.FC<AppFileExplorerProps> = observer(
	({ layout, node, app, onVisibleAssetPathsChange, onOpenStateChange }) => {
		const insight = useInsight();

		const [isPublishing, setIsPublishing] = useState(false);

		useEffect(() => {
			onOpenStateChange?.(true);
			return () => {
				onOpenStateChange?.(false);
			};
		}, [onOpenStateChange]);

		const getTabPath = (
			config: { path?: string; data?: { path?: string } } | undefined,
		) => config?.path || config?.data?.path;

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
				| {
						name?: string;
						path?: string;
						data?: { name?: string; path?: string };
				  }
				| undefined;
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = getTabPath(config);
			const scope = getFileEditorPathScope({ type: "APP", app });
			const tabName = tabNode.getName();
			const displayName = tabName.endsWith("*") ? `${newName}*` : newName;

			tabNode.getModel().doAction(
				FlexLayout.Actions.updateNodeAttributes(tabNode.getId(), {
					config: {
						...config,
						name: newName,
						path: newPath,
						data: config?.data
							? {
									...config.data,
									name: config.data.name
										? newName
										: undefined,
									path: newPath,
								}
							: config?.data,
					},
				}),
			);
			tabNode
				.getModel()
				.doAction(
					FlexLayout.Actions.renameTab(tabNode.getId(), displayName),
				);

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
					| { path?: string; data?: { path?: string } }
					| undefined;
				const path = getTabPath(config);
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
		};

		/**
		 * Remove tabs that are open for a file that has been deleted. If it's a directory, remove all tabs that are open for files within that directory
		 * @param deletedPath the path of the deleted file or directory
		 * @param isDirectory whether the deleted path is a directory
		 */
		const removeDeletedTabs = (
			deletedPath: string,
			isDirectory: boolean,
		) => {
			const model = node.getModel();
			const deletedPathWithSlash =
				isDirectory && !deletedPath.endsWith("/")
					? `${deletedPath}/`
					: deletedPath;
			const tabsToRemove: string[] = [];

			model.visitNodes((currentNode) => {
				if (!(currentNode instanceof FlexLayout.TabNode)) {
					return;
				}

				const config = currentNode.getConfig() as
					| { path?: string; data?: { path?: string } }
					| undefined;
				const path = getTabPath(config);
				if (!path) {
					return;
				}
				if (
					isDirectory
						? path === deletedPath ||
							path.startsWith(deletedPathWithSlash)
						: path === deletedPath
				) {
					tabsToRemove.push(currentNode.getId());
				}
			});

			tabsToRemove.forEach((tabId) => {
				model.doAction(FlexLayout.Actions.deleteTab(tabId));
			});
		};

		/**
		 * Add a node to the layout
		 * @param nodeId
		 * @param options
		 * @returns
		 */
		const addNode = (
			nodeId: string,
			options: {
				[key: string]: unknown;
			},
		) => {
			const model = node.getModel();

			// select the node if there
			let selectedNode = model.getNodeById(nodeId);
			const targetConfig = options.config as
				| { path?: string; data?: { path?: string } }
				| undefined;
			const targetPath = getTabPath(targetConfig);
			if (!selectedNode && targetPath) {
				model.visitNodes((currentNode) => {
					if (
						selectedNode ||
						!(currentNode instanceof FlexLayout.TabNode)
					) {
						return;
					}

					const config = currentNode.getConfig() as
						| { path?: string; data?: { path?: string } }
						| undefined;
					if (
						currentNode.getComponent() === options.component &&
						getTabPath(config) === targetPath
					) {
						selectedNode = currentNode;
					}
				});
			}
			if (selectedNode) {
				model.doAction(
					FlexLayout.Actions.selectTab(selectedNode.getId()),
				);
				return;
			}

			// create the node if it is not there
			// where to add the node
			const addId =
				model.getActiveTabset()?.getId() ||
				model.getRoot().getChildren()[0]?.getId() ||
				"";

			// create and select the panel
			model.doAction(
				FlexLayout.Actions.addNode(
					{
						...options,
						id: nodeId,
					},
					addId,
					FlexLayout.DockLocation.CENTER,
					-1,
					true,
				),
			);
		};

		/**
		 * Add the editor tab
		 */
		const addMCPEditorTab = async (itemPath: string) => {
			const name = `Tool Editor ${`- ${itemPath.split("/").pop()}` || ""}`;

			// add the editor
			const { pixelReturn } = await insight.actions.run<[string]>(
				`GetAppAssets(filePath=["${itemPath}"], project=["${app}"]);`,
			);

			let json: { _meta: Record<string, string>; tools: unknown[] } = {
				_meta: {},
				tools: [],
			};
			try {
				const output = pixelReturn[0].output;
				if (output && typeof output === "object") {
					const o = output as Record<string, unknown>;
					json = {
						_meta: (o._meta as Record<string, string>) ?? {},
						tools: (o.tools as unknown[]) ?? [],
					};
				} else if (typeof output === "string" && output.trim()) {
					const parsed = JSON.parse(output) as Record<
						string,
						unknown
					>;
					json = {
						_meta: (parsed._meta as Record<string, string>) ?? {},
						tools: (parsed.tools as unknown[]) ?? [],
					};
				}
			} catch (e) {
				console.error(`Failed to parse MCP JSON: ${e}`);
			}

			addNode(`APP_MCP_EDITOR--${itemPath}`, {
				type: "tab",
				name: name,
				component: "mcpJsonEditor",
				config: {
					path: itemPath,
					data: {
						initialData: json,
						onSave: async (data, path) => {
							try {
								await insight.actions.run(
									`SaveAppAssets(project=["${app}"], filePath=["${path}"], content=["<encode>${JSON.stringify(data, null, 2)}</encode>"]);`,
								);
								toast.success("Tool saved successfully");
							} catch (e) {
								toast.error(`Failed to save Tool: ${e}`);
								return;
							}
						},
						name: name,
						path: itemPath,
					},
				},
				enableClose: true,
			});
		};

		return (
			<FileExplorer
				mode={{
					type: "APP",
					app: app,
				}}
				onVisibleItemsChange={({ path, items }) => {
					onVisibleAssetPathsChange?.({
						path,
						paths: items.map((item) => item.path),
					});
				}}
				headerActions={
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={async () => {
									try {
										setIsPublishing(true);

										// Seperate calls so we reload successfully compiled classes before publishing
										await insight.actions.run(
											`ReloadInsightClasses(project='${app}', release=false);`,
										);

										await insight.actions.run(
											`PublishProject(project='${app}', release=true);`,
										);

										toast.success(
											"Successfully compiled and published",
										);
									} catch (e) {
										toast.error(`Error: ${e}`);
									} finally {
										setIsPublishing(false);
									}
								}}
							>
								{isPublishing ? (
									<Spinner className="size-3" />
								) : (
									<CloudUploadIcon className="size-3" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							Compile and publish the app
						</TooltipContent>
					</Tooltip>
				}
				onItemSelect={(item) => {
					// don't open directories
					if (item.type === "directory") {
						return;
					}

					// this will select if there or open if not
					addNode(`ENGINE_FILE--${item.path}`, {
						type: "tab",
						name: item.name,
						component: "app-file-editor",
						config: {
							name: item.name,
							path: item.path,
						},
						enableClose: true,
						enableRename: true,
					});
				}}
				onItemsMoved={migrateMovedTabs}
				onItemsDeleted={(items) => {
					items.forEach((item) => {
						removeDeletedTabs(item.path, item.type === "directory");
					});
				}}
				ItemComponent={({ item, refresh, ...otherProps }) => {
					const isDriverFile =
						item.type !== "directory" &&
						MCP.DRIVER_PATHS.some((f) => item.path === f);
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
										component: "app-file-editor",
										config: {
											name: item.name,
											path: item.path,
										},
										enableClose: true,
										enableRename: true,
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
								addNode(`ENGINE_FILE--${newPath}`, {
									type: "tab",
									name: newName,
									component: "app-file-editor",
									config: { name: newName, path: newPath },
									enableClose: true,
									enableRename: true,
								});
							}}
							{...otherProps}
							actions={[
								isDriverFile
									? {
											name: "Create",
											icon: <HammerIcon />,
											tooltip: "Create Toolbox",
											action: async () => {
												try {
													await insight.actions.run(
														`MakePythonMCP(project=["${app}"]);`,
													);

													// refresh the explorer
													refresh();

													// add it
													await addMCPEditorTab(
														"/mcp/py_mcp.json",
													);
												} catch (e) {
													toast.error(e.message);
													console.error(e);
												}
											},
										}
									: null,
								MCP.JSON_PATHS.some((f) =>
									item.path.startsWith(f),
								) && item.type !== "directory"
									? {
											name: "Edit",
											icon: <PencilIcon />,
											tooltip: "Edit Toolbox",
											action: async (item) => {
												addMCPEditorTab(item.path);
											},
										}
									: null,
							]}
							secondaryActions={[
								{
									name: "Copy Path",
									action: async (item) => {
										try {
											await navigator.clipboard.writeText(
												item.path,
											);
										} catch (_e) {
											throw new Error(
												"Failed to copy to clipboard",
											);
										}
									},
								},
								item.type !== "directory"
									? {
											name: "Download",
											action: async (item) => {
												// save it
												const { pixelReturn } =
													await insight.actions.run<
														[string]
													>(
														`DownloadAppAsset(project=["${app}"], filePath=["${item.path}"]);`,
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
										}
									: null,
								item.path.endsWith(".zip")
									? {
											name: "Unzip",
											action: async () => {
												const pixel = `UnzipFile(filePath=["${item.path}"], space=["${app}"])`;

												await insight.actions.run(
													pixel,
												);

												refresh();
											},
										}
									: null,
								{
									name: "Delete",
									action: async (item) => {
										await insight.actions.run(
											`DeleteAppAssets(project=["${app}"], filePath=["${item.path}"]);`,
										);

										removeDeletedTabs(
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
