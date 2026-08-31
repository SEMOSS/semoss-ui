import { CloudUploadIcon, HammerIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerHeader,
	type FileExplorerItemActions,
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
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { MCP } from "@/constants";
import { readMCPFile, toFileText } from "../shared";

/** The config shape the file-backed FlexLayout tabs carry. */
interface FileTabConfig {
	name?: string;
	path?: string;
	data?: { name?: string; path?: string };
}

interface AppFileExplorerProps {
	/** Node */
	layout: FlexLayout.Layout | null;

	/** Node */
	node: FlexLayout.TabNode;

	/** App */
	app: string;

	/** Initial directory path to open to (defaults to "/") */
	initialPath?: string;

	/** Render the explorer in read-only, browse-only mode */
	readOnly?: boolean;
}

/**
 * The file a tab is open for. Some editors keep it at the top of their config,
 * others nest it under `data`.
 *
 * @param config - The tab's config, if it has one.
 * @return The path, or undefined for a tab that is not file-backed.
 */
const getTabPath = (config: FileTabConfig | undefined) =>
	config?.path || config?.data?.path;

/**
 * An in-place rename, as opposed to a move to another directory.
 *
 * @param moved - One entry from an `onItemsMoved` batch.
 * @return True when the item stayed in its directory.
 */
const isRename = (moved: FileExplorerMovedItem) =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

/**
 * The app editor's file explorer, for the legacy FlexLayout workspace shell.
 *
 * Functionally the twin of `ProjectFileExplorerPanel`, but the tabs it keeps in
 * sync are FlexLayout nodes rather than workbench panels, so the sync helpers
 * are local — only the path arithmetic (`resolveMovedPath`) is shared.
 */
export const AppFileExplorer: React.FC<AppFileExplorerProps> = observer(
	({ layout, node, app, initialPath, readOnly = false }) => {
		const insight = useInsight();

		const [isPublishing, setIsPublishing] = useState(false);

		const mode = useMemo<FileMode>(
			() => ({ type: "APP", app: app }),
			[app],
		);

		/**
		 * Repoint one tab at a new path, keeping its unsaved-work `*` marker.
		 *
		 * @param tabNode - The tab to repoint.
		 * @param newPath - Where its file moved to.
		 */
		const updateTabPath = (
			tabNode: FlexLayout.TabNode,
			newPath: string,
		) => {
			const config = tabNode.getConfig() as FileTabConfig | undefined;
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = getTabPath(config);
			const scope = getFileEditorPathScope(mode);
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

		/**
		 * Repoint every open tab affected by a batch of moves.
		 *
		 * @param movedItems - The moves that happened.
		 * @return True if at least one tab moved with them.
		 */
		const migrateMovedTabs = (movedItems: FileExplorerMovedItem[]) => {
			const model = node.getModel();
			let migrated = false;

			model.visitNodes((currentNode) => {
				if (!(currentNode instanceof FlexLayout.TabNode)) {
					return;
				}

				const path = getTabPath(
					currentNode.getConfig() as FileTabConfig | undefined,
				);
				if (!path) {
					return;
				}

				const movedPath = movedItems.reduce(
					(currentPath, movedItem) =>
						resolveMovedPath(currentPath, movedItem) ?? currentPath,
					path,
				);

				if (movedPath !== path) {
					updateTabPath(currentNode, movedPath);
					migrated = true;
				}
			});

			return migrated;
		};

		/**
		 * Close every tab open for a deleted file, or — for a deleted
		 * directory — for anything that was inside it.
		 *
		 * @param items - The items that were deleted.
		 */
		const removeDeletedTabs = (items: FileItem[]) => {
			const model = node.getModel();
			const tabsToRemove: string[] = [];

			model.visitNodes((currentNode) => {
				if (!(currentNode instanceof FlexLayout.TabNode)) {
					return;
				}

				const path = getTabPath(
					currentNode.getConfig() as FileTabConfig | undefined,
				);
				if (!path) {
					return;
				}

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
			const targetPath = getTabPath(
				options.config as FileTabConfig | undefined,
			);
			if (!selectedNode && targetPath) {
				model.visitNodes((currentNode) => {
					if (
						selectedNode ||
						!(currentNode instanceof FlexLayout.TabNode)
					) {
						return;
					}

					const config = currentNode.getConfig() as
						| FileTabConfig
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
		 * The FlexLayout tab spec for one app file. Shared by opening a file
		 * and by dragging one into the layout.
		 *
		 * @param item - The file the tab is for.
		 * @return The tab spec.
		 */
		const fileTab = (item: FileItem) => ({
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

		/**
		 * Reveal a file's editor tab, opening it if it is not already there.
		 *
		 * @param item - The file to open.
		 */
		const openFile = (item: FileItem) =>
			addNode(`ENGINE_FILE--${item.path}`, fileTab(item));

		/**
		 * Re-read an MCP file so the editor's refresh action can pick up edits
		 * made outside of it.
		 */
		const readMCPAsset = async (
			itemPath: string,
		): Promise<string | null> => {
			try {
				const { pixelReturn } = await insight.actions.run<[string]>(
					`GetAppAssets(filePath=["${itemPath}"], project=["${app}"]);`,
				);
				return toFileText(pixelReturn?.[0]?.output);
			} catch (e) {
				console.error(e);
				return null;
			}
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

			// A parse failure is handed to the editor rather than swallowed, so
			// a malformed file opens as raw text instead of an empty tool list
			// that the next save would write straight over it.
			const loaded = readMCPFile(pixelReturn?.[0]?.output);

			addNode(`APP_MCP_EDITOR--${itemPath}`, {
				type: "tab",
				name: name,
				component: "mcpJsonEditor",
				config: {
					path: itemPath,
					data: {
						initialData: loaded.initialData,
						rawContent: loaded.rawContent,
						loadError: loaded.loadError,
						onRefresh: () => readMCPAsset(itemPath),
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

		const explorer = useFileExplorer({
			mode: mode,
			readOnly: readOnly,
			initialPath: initialPath,
			onItemSelect: openFile,
			onItemsMoved: (movedItems) => {
				const migrated = migrateMovedTabs(movedItems);

				// renaming a file that had no tab open reveals it
				if (
					!migrated &&
					movedItems.length === 1 &&
					isRename(movedItems[0])
				) {
					const newPath = movedItems[0].newPath;
					openFile({
						name:
							newPath.split("/").filter(Boolean).pop() ?? newPath,
						path: newPath,
					});
				}
			},
			onItemsDeleted: removeDeletedTabs,
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

				layout.addTabWithDragAndDrop(
					e as unknown as DragEvent,
					fileTab(items[0]),
				);
			},
		});

		/**
		 * The MCP glyph buttons for one row. Not memoized: it closes over the
		 * FlexLayout model helpers above, which read live layout state, and the
		 * explorer calls it fresh for every row it renders anyway.
		 *
		 * @param item - The row being rendered.
		 * @return Its primary actions, if it has any.
		 */
		const itemActions = (item: FileItem): FileExplorerItemActions => {
			if (readOnly || item.type === "directory") {
				return {};
			}

			const actions = [];

			if (MCP.DRIVER_PATHS.some((f) => item.path === f)) {
				actions.push({
					name: "Create",
					icon: <HammerIcon />,
					tooltip: "Create Toolbox",
					action: async () => {
						try {
							await insight.actions.run(
								`MakePythonMCP(project=["${app}"]);`,
							);

							explorer.commands.refresh();

							// add it
							await addMCPEditorTab("/mcp/py_mcp.json");
						} catch (e) {
							toast.error(
								e instanceof Error ? e.message : `${e}`,
							);
							console.error(e);
						}
					},
				});
			}

			if (MCP.JSON_PATHS.some((f) => item.path.startsWith(f))) {
				actions.push({
					name: "Edit",
					icon: <PencilIcon />,
					tooltip: "Edit Toolbox",
					action: async (target: FileItem) => {
						addMCPEditorTab(target.path);
					},
				});
			}

			return { actions: actions };
		};

		return (
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
								<FileExplorerNewAction explorer={explorer} />
								{readOnly ? null : (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Compile and publish the app"
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
														toast.error(
															`Error: ${e}`,
														);
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
								)}
							</>
						}
					/>
				}
				newFileOverlay={NewFileOverlay}
				itemActions={itemActions}
			/>
		);
	},
);
