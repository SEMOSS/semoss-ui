import { HammerIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { download, runPixel, useInsight } from "@semoss/sdk/react";
import { FileExplorer, FileExplorerItem, FlexLayout } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { MCP } from "@/constants";

interface EngineFileExplorerProps {
	/** Node */
	layout: FlexLayout.Layout | null;

	/** Node */
	node: FlexLayout.TabNode;

	/** Engine */
	engine: string;
}

export const EngineFileExplorer: React.FC<EngineFileExplorerProps> = observer(
	({ layout, node, engine }) => {
		const insight = useInsight();
		const [searchParams, setSearchParams] = useSearchParams();
		const [refreshKey, setRefreshKey] = useState(0);
		const config: {
			explorerMode?: "ENGINE" | "STORAGE";
		} = node.getConfig();
		const isStorageViewer = config.explorerMode === "STORAGE";

		/**
		 * Remove tabs that are open for a file that has been deleted. If it's a directory, remove all tabs that are open for files within that directory
		 * @param deletedPath the path of the deleted file or directory
		 * @param isDirectory whether the deleted path is a directory
		 */
		const removeDeletedTabs = useCallback(
			(deletedPath: string, isDirectory: boolean) => {
				const model = node.getModel();
				const deletedPathWithSlash =
					isDirectory && !deletedPath.endsWith("/")
						? `${deletedPath}/`
						: deletedPath;
				const tabsToRemove: string[] = [];

				model.visitNodes((currentNode) => {
					console.log(
						"VISITING NODE >>>",
						currentNode.getId(),
						" >> ",
						!(currentNode instanceof FlexLayout.TabNode),
					);
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
					console.log("TESTING >>>", deletedPath, path, isDirectory);
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
			},
			[node],
		);

		/**
		 * Add a node to the layout
		 * @param nodeId
		 * @param options
		 * @returns
		 */

		const addNode = useCallback(
			(
				nodeId: string,
				options: {
					[key: string]: unknown;
				},
			) => {
				const model = node.getModel();

				// select the node if there
				const selectedNode = model.getNodeById(nodeId);
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
			},
			[node],
		);

		useEffect(() => {
			const mcpParam = searchParams.get("mcp");
			if (mcpParam === "Generate") {
				const mcpFilePath = "/mcp/pixel_mcp.json";
				addNode(`ENGINE_MCP_EDITOR--${mcpFilePath}`, {
					type: "tab",
					name: `Toolbox Editor - pixel_mcp.json`,
					component: "engine-mcp-editor",
					config: {
						name: "pixel_mcp.json",
						path: mcpFilePath,
					},
					enableClose: true,
				});
				toast.success("MCP generated");
				setRefreshKey((prev) => prev + 1);
				searchParams.delete("mcp");
				setSearchParams(searchParams);
			}
		}, [searchParams, layout]);

		return (
			<FileExplorer
				key={refreshKey}
				mode={
					isStorageViewer
						? {
								type: "STORAGE",
								storage: engine,
							}
						: {
								type: "ENGINE",
								engine: engine,
							}
				}
				onItemSelect={(item) => {
					if (isStorageViewer) {
						if (item.type === "directory") {
							return;
						}

						const fileName =
							item.name.split("/").filter(Boolean).pop() ||
							item.name;
						const insightFilePath = `/${fileName}`;

						runPixel<[string]>(
							`PullFromStorage(storage=["${engine}"], storagePath=["${item.path}"], filePath="/");`,
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
										component: "engine-file-editor",
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

						return;
					}

					// don't open directories
					if (item.type === "directory") {
						return;
					}

					// this will select if there or open if not
					addNode(`ENGINE_FILE--${item.path}`, {
						type: "tab",
						name: item.name,
						component: "engine-file-editor",
						config: {
							name: item.name,
							path: item.path,
						},
						enableClose: true,
					});
				}}
				ItemComponent={({ item, refresh, ...otherProps }) => {
					const isDriverFile =
						item.type !== "directory" &&
						MCP.DRIVER_PATHS.some((f) => item.path === f);
					const actions = [];
					if (!isStorageViewer) {
						if (isDriverFile) {
							actions.push({
								name: "Create",
								icon: <HammerIcon />,
								tooltip: "Create Toolbox",
								action: async () => {
									try {
										await insight.actions.run(
											`MakePythonMCP(engine=["${engine}"]);`,
										);

										// refresh the explorer
										refresh();
									} catch (e) {
										toast.error(`Error: ${e}`);
									}

									// open the editor for the created file (always, even if MakePythonMCP fails)
									addNode(
										`ENGINE_MCP_EDITOR--/mcp/py_mcp.json`,
										{
											type: "tab",
											name: `Toolbox Editor - py_mcp.json`,
											component: "engine-mcp-editor",
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
							MCP.JSON_PATHS.some((f) =>
								item.path.startsWith(f),
							) &&
							item.type !== "directory"
						) {
							actions.push({
								name: "Edit",
								icon: <PencilIcon />,
								tooltip: "Edit Toolbox",
								action: async (item) => {
									// this will select if there or open if not
									addNode(`ENGINE_MCP_EDITOR--${item.path}`, {
										type: "tab",
										name: `Toolbox Editor - ${item.name}`,
										component: "engine-mcp-editor",
										config: {
											name: item.name,
											path: item.path,
										},
										enableClose: true,
									});
								},
							});
						}
					}

					const secondaryActions = [
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
					];

					if (!isStorageViewer && item.type !== "directory") {
						secondaryActions.push({
							name: "Download",
							action: async (item) => {
								// save it
								const { pixelReturn } =
									await insight.actions.run<[string]>(
										`DownloadEngineAsset(engine=["${engine}"], filePath=["${item.path}"]);`,
									);

								// get the file key
								const fileKey = pixelReturn[0].output;

								// download the file
								await download(insight.insightId, fileKey);

								refresh();
							},
						});
					}

					if (!isStorageViewer && item.path.endsWith(".zip")) {
						secondaryActions.push({
							name: "Unzip",
							action: async () => {
								const pixel = `UnzipFile(filePath=["${item.path}"], space=["${engine}"])`;

								await insight.actions.run(pixel);

								refresh();
							},
						});
					}

					if (!isStorageViewer) {
						secondaryActions.push({
							name: "Delete",
							action: async (item) => {
								await insight.actions.run(
									`DeleteEngineAssets(engine=["${engine}"], filePath=["${item.path}"]);`,
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
							draggable={
								!isStorageViewer && item.type !== "directory"
							}
							item={item}
							refresh={refresh}
							onDragStart={(e) => {
								if (isStorageViewer) {
									return;
								}

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
										component: "engine-file-editor",
										config: {
											name: item.name,
											path: item.path,
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
	},
);
