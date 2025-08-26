import {
	CoffeeOutlined,
	CreateNewFolderOutlined,
	FileUpload,
	NoteAddOutlined,
	PublishedWithChangesOutlined,
	Refresh,
} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import { Actions, DockLocation, Layout, TabNode } from "flexlayout-react";
import { useEffect, useRef, useState } from "react";
import { IconButton, Stack, Tooltip, useNotification } from "@semoss/ui";
import {
	AddFileOverlay,
	CreateFileOverlay,
	FileExplorer,
} from "@/components/common";
import { FileExplorerItemHandle } from "@/components/common/File/FileExplorerItem";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./Panel";

const EXPLORER_TYPE = "app";

interface FileExplorerPanelProps {
	/** Current layoutobject */
	layout: Layout;
}

export const FileExplorerPanel = (props: FileExplorerPanelProps) => {
	const { layout } = props;

	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();

	const notification = useNotification();

	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	// files to add
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [fileUploadPath, setFileUploadPath] = useState<string>("");

	// temporary fix for dead refresh button should be removed
	const [counter, setCounter] = useState(0);

	// State for Delete Mode
	const [deleteMode, setDeleteMode] = useState(false);
	const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());
	const [deleteRootPath, setDeleteRootPath] = useState<string | null>(null);
	const [deletablePaths, setDeletablePaths] = useState<Set<string>>(
		new Set(),
	);

	//state for duplicate Mode
	const [duplicateMode, setDuplicateMode] = useState(false);
	const [duplicateRootPath, setDuplicateRootPath] = useState<string | null>(
		null,
	);
	const [duplicatablePaths, setDuplicatablePaths] = useState<Set<string>>(
		new Set(),
	);

	const [allFolders, setAllFolders] = useState<string[]>([]);
	const [allFiles, setAllFiles] = useState<string[]>([]);

	// set the uploadPath based on the selected item
	useEffect(() => {
		let path = "version/assets/";

		// if selected, get the directory
		if (selectedPath) {
			if (selectedPath.slice(-1) === "/") {
				path = selectedPath;
			} else {
				// try to remove the file name and get the directory
				path = selectedPath.split("/").slice(0, -1).join("/");
			}
		}

		setFileUploadPath(path);
	}, [selectedPath]);

	/**
	 * Expand paths, here at the parent level we updating the state of expanded paths, whether it is expanded manually or auto load programatically.
	 */
	const handleExpandPath = (path: string, childrenPaths?: string[]) => {
		setExpandedPaths((prev) => {
			if (prev.includes(path)) return prev.filter((p) => p !== path); // If already expanded, do nothing
			// don't why it's expecting path param to be as a spread, which causing the infinite loop issue. that's why i'm spreading childrenPaths here to avoid the infinite loop issue
			return [...prev, ...childrenPaths]; // Add the new paths to the expanded paths
		});
	};

	/**
	 * Refresh the files
	 */
	const refreshFiles = () => {
		// increment the counter
		setCounter(counter + 1);
	};

	const handleToggleExpand = (path: string) => {
		// Prevent toggle during delete/duplicate mode to avoid infinite re-renders
		if (deleteMode || duplicateMode) {
			return;
		}

		setExpandedPaths((prev) =>
			prev.includes(path)
				? prev.filter((p) => p !== path)
				: [...prev, path],
		);
	};
	/**
	 * Publish the app
	 */
	const publishApp = async () => {
		try {
			// turn on loading
			workspace.setLoading(true);

			const response = await monolithStore.runQuery(
				`PublishProject(project='${workspace.appId}', release=true);`,
			);

			const output = response.pixelReturn[0].output,
				type = response.pixelReturn[0].operationType[0];

			if (type.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output,
				});

				throw new Error(output.join(""));
			}

			notification.add({
				color: "success",
				message: "Successfully published",
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			// turn off loading
			workspace.setLoading(false);
		}
	};

	/**
	 * Recompile the app
	 */
	const recompileApp = async () => {
		try {
			// turn on loading
			workspace.setLoading(true);

			const response = await monolithStore.runQuery(
				`ReloadInsightClasses(project='${workspace.appId}', release=false);`,
			);

			const output = response.pixelReturn[0].output,
				type = response.pixelReturn[0].operationType[0];

			if (type.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output,
				});

				throw new Error(output.join(""));
			}

			notification.add({
				color: "success",
				message:
					"Successfully recompiled reactors. Remember to publish changes.",
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			// turn off loading
			workspace.setLoading(false);
		}
	};

	/**
	 * Open the add modal
	 */
	const handleOpenAddFile = () => {
		workspace.openOverlay(() => (
			<AddFileOverlay
				type={EXPLORER_TYPE}
				space={workspace.appId}
				onClose={(success, uploadPath) => {
					if (success) {
						// create the panel
						createPanel(uploadPath);

						// refresh the content
						refreshFiles();
					}

					// close the overlay
					workspace.closeOverlay();
				}}
				uploadPath={fileUploadPath}
			/>
		));
	};

	/**
	 * Open the create file modal
	 */
	const handleOpenCreateFile = (
		/** Mode of add file */
		mode: "directory" | "file",
	) => {
		workspace.openOverlay(() => (
			<CreateFileOverlay
				type={EXPLORER_TYPE}
				space={workspace.appId}
				onClose={(success, uploadPath) => {
					if (success) {
						// create the panel
						createPanel(uploadPath);

						// refresh the content
						refreshFiles();
					}

					// close the overlay
					workspace.closeOverlay();
				}}
				uploadPath={fileUploadPath}
				mode={mode}
			/>
		));
	};

	/**
	 * Select a panel and create one if it doesn't exist
	 *
	 * path - path to file
	 */
	const handleOnSelect = (path: string) => {
		// try to select a panel, if it doesn't exist create it. Save the path
		const IsSelected = selectPanel(path);
		if (!IsSelected) {
			createPanel(path);
		}

		// set the path
		setSelectedPath(path);
	};

	/**
	 * Open the delete modal
	 */
	const handleOnTrashClick = async (fileDeletePaths: string[]) => {
		try {
			// setIsLoading(true);

			if (EXPLORER_TYPE === "app") {
				const response = await monolithStore.runQuery(
					// `DeleteAsset(filePath=["${fileDeletePath}"], space=["${space}"]);`,

					// note: fileDeletePaths can be an array of paths to delete multiple files or single directory
					// this is useful for deleting directory with multiple files inside
					`DeleteAsset(filePath=[${fileDeletePaths
						.map((p) => `"${p}"`)
						.join(",")}], space=["${workspace.appId}"]);`,
				);

				const pixelReturn = response.pixelReturn?.[0];
				const output = pixelReturn?.output;
				const type = pixelReturn?.operationType?.[0];

				if (output === "Success!") {
					// we need to remove all panels for the files to be deleted
					fileDeletePaths.forEach(removePanel);

					// refresh the content
					refreshFiles();
				}

				if (type.indexOf("ERROR") > -1) {
					notification.add({
						color: "error",
						message: output || "Delete failed",
					});
					return;
				}

				notification.add({
					color: "success",
					message: output || "Successfully deleted file",
				});
			} else if (EXPLORER_TYPE === "insight") {
				throw new Error("TODO");
			}

			// If delete mode is active, cancel it after deletion
			if (handleCancelDeleteMode) {
				handleCancelDeleteMode();
			}
			// onClose(true);
		} catch (e) {
			console.error(e);
			notification.add({
				color: "error",
				message: "Delete failed!",
			});
		} finally {
			// setIsLoading(false);
		}
	};

	const handleRename = async (
		oldPath: string,
		newName: string,
		isDirectory: boolean,
	) => {
		try {
			let newPath = "";
			if (isDirectory && oldPath.slice(-1) === "/") {
				const parts = oldPath.replace(/\/$/, "").split("/");
				parts[parts.length - 1] = newName;
				newPath = parts.join("/") + "/";
			} else {
				const parts = oldPath.split("/");
				parts[parts.length - 1] = newName;
				newPath = parts.join("/");
			}

			const response = await monolithStore.runQuery(
				`RenameAsset(filePath=["${oldPath}"], newValue=["${newPath}"], space=["${workspace.appId}"]);`,
			);

			const pixelReturn = response.pixelReturn?.[0];
			const output = pixelReturn?.output;
			const type = pixelReturn?.operationType?.[0];

			if (type.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output || "Rename failed",
				});
				return;
				// throw new Error(output.join(''));
			}

			notification.add({
				color: "success",
				message: "Successfully renamed file",
			});

			refreshFiles();
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message || "Rename failed",
			});
		}
	};

	// keep a map of refs per path
	const itemRefs = useRef<Record<string, FileExplorerItemHandle | null>>({});

	// here we are using the ref to expand the directory, instead of calling delete/duplicate   immediately, open + load children then continue
	// this is to ensure that the directory is expanded before deleting/duplicating
	const handleDuplicate = async (
		path: string,
		isDirectory: boolean,
		childrenPaths: string[] = [],
	) => {
		if (isDirectory) {
			await itemRefs.current[path]?.expandAndLoad();
		}
		handleDuplicateRequest(path, isDirectory, childrenPaths);
	};

	// same as handleDuplicate
	const handleDelete = async (
		path: string,
		isDirectory: boolean,
		childrenPaths: string[] = [],
	) => {
		if (isDirectory) {
			await itemRefs.current[path]?.expandAndLoad();
		}
		handleDeleteRequest(path, isDirectory, childrenPaths);
	};

	// call this functionality when user select "Delete" in the context menu
	const handleDeleteRequest = (
		path: string,
		isDirectory: boolean,
		childrenPaths: string[] = [],
	) => {
		setDeleteMode(true);
		setDeleteRootPath(isDirectory ? path : null);

		// if it is a directory, we need to checked all children paths
		const paths = isDirectory ? [path, ...childrenPaths] : [path];
		setCheckedPaths(new Set(paths));
		setDeletablePaths(new Set(paths));

		// For files, auto-expand them to show buttons
		if (!isDirectory) {
			setExpandedPaths((prev) => {
				if (prev.includes(path)) return prev.filter((p) => p !== path); // no change
				return [...prev, ...childrenPaths]; // Add the new paths to the expanded paths
			});
		}
	};

	// handle Toggle checkbox
	const handleToggleChecked = (path: string) => {
		setCheckedPaths((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(path)) {
				newSet.delete(path);
			} else {
				newSet.add(path);
			}
			return newSet;
		});
	};

	//  // call this functionality when user select "Duplicate" in the context menu
	const handleCancelDeleteMode = () => {
		// Store the current deleteRootPath before clearing it
		const currentDeleteRootPath = deleteRootPath;

		setDeleteMode(false);
		setCheckedPaths(new Set());
		if (currentDeleteRootPath) {
			setExpandedPaths([]); // reset expanded paths
		}
		setDeleteRootPath(null);
		setDeletablePaths(new Set());

		// Reset expanded paths that were auto-expanded for delete operation
	};

	// call this functionality when user select "Duplicate" in the context menu
	const handleDuplicateRequest = (
		path: string,
		isDirectory: boolean,
		childrenPaths: string[] = [],
	) => {
		setDuplicateMode(true);
		setDuplicateRootPath(isDirectory ? path : null);

		// if it is a directory, we need to checked all children paths
		const paths = isDirectory ? [path, ...childrenPaths] : [path];
		setCheckedPaths(new Set(paths));
		setDuplicatablePaths(new Set(paths));

		// For files, auto-expand them to show buttons
		if (!isDirectory) {
			setExpandedPaths((prev) => {
				if (prev.includes(path)) return prev.filter((p) => p !== path); // no change
				return [...prev, ...childrenPaths]; // Add the new paths to the expanded paths
			});
		}
	};

	// helper function to fetch file content when duplicating files within a folder or a directory
	const fetchFileContent = async (filePath: string) => {
		const pixel = `GetAsset(filePath=["${filePath}"], space=["${workspace.appId}"]);`;
		const response = await monolithStore.runQuery(
			pixel,
			workspace.insightId,
		);
		return response.pixelReturn[0].output ?? "";
	};

	// handle duplicating files or folder and saving them to the workspace
	const handleOnDuplicateClickFunc = async (
		checkedPaths: Set<string>,
		duplicateRootPath: string | null,
	) => {
		try {
			const checked = Array.from(checkedPaths);
			const folderChecked = !!(
				duplicateRootPath && checked.includes(duplicateRootPath)
			);
			const filesChecked = checked.filter((p) => p !== duplicateRootPath);

			// Helper
			const getNextFolderName = (
				originalPath: string,
				allFolders: string[],
			) => {
				// originalPath: e.g. version/assets/ask-model/
				const parts = originalPath.split("/");
				const folderName = parts[parts.length - 2]; // e.g. ask-model
				const parentPath = parts.slice(0, -2).join("/") + "/"; // e.g. version/assets/
				// Find all folders in the parent
				const siblings = allFolders
					.filter(
						(f) => f.startsWith(parentPath) && f !== originalPath,
					)
					.map((f) => f.replace(parentPath, "").replace(/\/$/, ""));
				// Find max (N)
				let maxN = 0;
				const regex = new RegExp(`^${folderName} \\((\\d+)\\)$`);
				siblings.forEach((name) => {
					const match = name.match(regex);
					if (match) {
						maxN = Math.max(maxN, parseInt(match[1], 10));
					}
				});
				const newName = `${folderName} (${maxN + 1})`;
				const newPath = parentPath + newName + "/";
				return { newName, newPath, parentPath, folderName };
			};

			let response = null;
			// Only folder checked (no files)
			if (folderChecked) {
				const { newPath } = getNextFolderName(
					duplicateRootPath,
					allFolders,
				);
				response = await monolithStore.runQuery(
					`MakeDirectory(filePath=["${newPath}"], space=["${workspace.appId}"]);`,
				);

				// If there are files checked, we need to duplicate them into the new folder
				if (filesChecked.length > 0) {
					const fileContents = await Promise.all(
						filesChecked.map((p) => fetchFileContent(p)),
					);
					const newFileNames = filesChecked.map((p) => {
						const fileName = p.split("/").pop();
						return newPath + fileName;
					});
					response = await monolithStore.runQuery(
						`SaveAsset(fileName=[${newFileNames
							.map((p) => `"${p}"`)
							.join(",")}], content=[${fileContents
							.map((c) => `"<encode>${c}</encode>"`)
							.join(",")}], space=["${workspace.appId}"]);
                        CommitAsset(filePath=[${newFileNames
							.map((p) => `"${p}"`)
							.join(
								",",
							)}], comment=["Duplicating files"], space=["${
							workspace.appId
						}"]);`,
					);
				}
			}
			// Only files checked (no folder checked)
			else if (!folderChecked && filesChecked.length > 0) {
				const fileContents = await Promise.all(
					filesChecked.map((p) => fetchFileContent(p)),
				);

				// Helper function to get all files in a folder when we checked files where the file name starts with the folder path
				// and does not end with a slash (to avoid folders)
				const getFilesInFolder = (folderPath: string) => {
					return allFiles.filter(
						(f) => f.startsWith(folderPath) && !f.endsWith("/"),
					);
				};

				// Generate new file names with counter at the end
				const newFileNames = filesChecked.map((p) => {
					const parts = p.split("/");
					const fileName = parts.pop();
					if (!fileName) return p;
					const dotIdx = fileName.lastIndexOf(".");
					const baseName =
						dotIdx === -1 ? fileName : fileName.slice(0, dotIdx);
					const ext = dotIdx === -1 ? "" : fileName.slice(dotIdx);

					const folderPath = parts.join("/") + "/";
					const filesInFolder = getFilesInFolder(folderPath);

					// Find all duplicates of this file
					const regex = new RegExp(
						`^${baseName.replace(
							/[.*+?^${}()|[\]\\]/g,
							"\\$&",
						)}( \\((\\d+)\\))?${ext.replace(".", "\\.")}$`,
					);
					let maxN = 0;
					filesInFolder.forEach((f) => {
						const fName = f.split("/").pop() || "";
						const match = fName.match(regex);
						if (match && match[2]) {
							maxN = Math.max(maxN, parseInt(match[2], 10));
						} else if (fName === fileName) {
							maxN = Math.max(maxN, 0);
						}
					});

					const newName =
						maxN === 0
							? `${baseName} (1)${ext}`
							: `${baseName} (${maxN + 1})${ext}`;
					return [...parts, newName].join("/");
				});

				response = await monolithStore.runQuery(
					`SaveAsset(fileName=[${newFileNames
						.map((p) => `"${p}"`)
						.join(",")}], content=[${fileContents
						.map((c) => `"<encode>${c}</encode>"`)
						.join(",")}], space=["${workspace.appId}"]);
                    CommitAsset(filePath=[${newFileNames
						.map((p) => `"${p}"`)
						.join(",")}], comment=["Duplicating files"], space=["${
						workspace.appId
					}"]);`,
				);
			}

			const pixelReturn = response.pixelReturn?.[0];
			const output = pixelReturn?.output;
			const type = pixelReturn?.operationType?.[0];

			if (type.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output || "Duplicate failed",
				});
				return;
				// throw new Error(output.join(''));
			}

			notification.add({
				color: "success",
				message: "Successfully duplicated",
			});

			// refresh the content
			refreshFiles();
			handleCancelDuplicateMode();
		} catch (error) {
			notification.add({
				color: "error",
				message: error.message || "Duplicate failed",
			});
		}
	};

	// handle Cancel duplicate mode
	const handleCancelDuplicateMode = () => {
		setDuplicateMode(false);
		setCheckedPaths(new Set());
		if (duplicateRootPath) {
			setExpandedPaths([]); // reset expanded paths
		}
		setDuplicateRootPath(null);
		setDuplicatablePaths(new Set());

		// Reset expanded paths that were auto-expanded for duplicate operation
	};

	/**
	 * Handle dragging of an item
	 *
	 * event - drag event
	 * path - path of the file
	 */
	const handleOnItemDragStart = (
		event: React.DragEvent<HTMLDivElement>,
		path: string,
	) => {
		try {
			// can can only drag in files into the workspace
			if (path.slice(-1) === "/") {
				return;
			}

			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// TODO: altKey key needs to be down for now. event.altKey=false is reserved for panel-to-panel interactions
			if (!event.altKey) {
				return;
			}

			// get the name
			const name = path.split("/").pop();

			// add to layout
			layout.addTabWithDragAndDrop(event as unknown as DragEvent, {
				type: "tab",
				name: name,
				component: "file-editor",
				config: {
					path: path,
				},
				enableClose: true,
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});
		}
	};

	/** Helpers */
	/**
	 * Create a new panel and highlight it
	 *
	 * path - path to file
	 */
	const createPanel = (path: string): boolean => {
		try {
			if (!path) {
				return false;
			}

			// can can only create panels for files
			if (path.slice(-1) === "/") {
				return false;
			}

			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// where to add the node
			const addId =
				model.getActiveTabset()?.getId() ||
				model.getRoot().getChildren()[0]?.getId() ||
				"";

			// get the name
			const name = path.split("/").pop();

			// create and select the panel
			model.doAction(
				Actions.addNode(
					{
						type: "tab",
						name: name,
						component: "file-editor",
						config: {
							path: path,
						},
						enableClose: true,
					},
					addId,
					DockLocation.CENTER,
					-1,
					true,
				),
			);
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});

			return false;
		}

		return true;
	};

	/**
	 * Select a panel if it is there. Return false if not selected.
	 *
	 * path - path to file
	 */
	const selectPanel = (path: string): boolean => {
		try {
			if (!path) {
				return false;
			}

			// can can only select files
			if (path.slice(-1) === "/") {
				return false;
			}

			let selectedNode: TabNode | null = null;

			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// visit the notes, and see if it exists
			model.visitNodes((node) => {
				// check if it is a tabNode
				if (node instanceof TabNode) {
					// it needs to be a file-editor
					const component = node.getComponent();
					if (component !== "file-editor") {
						return;
					}

					// path and space need to match
					const config = node.getConfig();
					if (path !== config.path) {
						return;
					}

					selectedNode = node;
				}
			});

			// create a new panel if there is no node
			if (!selectedNode) {
				return false;
			}

			const selectedNodeId = selectedNode.getId();
			model.doAction(Actions.selectTab(selectedNodeId));
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});

			return false;
		}

		return true;
	};

	/**
	 * Remove a panel
	 */
	const removePanel = (path: string) => {
		try {
			if (!path) {
				return;
			}

			const nodesToBeRemoved: TabNode[] = [];

			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// visit the notes, and see if it exists
			model.visitNodes((node) => {
				// check if it is a tabNode
				if (node instanceof TabNode) {
					// it needs to be a file-editor
					const component = node.getComponent();
					if (component !== "file-editor") {
						return;
					}

					// path and space need to match
					const config = node.getConfig();
					if (config.path.indexOf(path) !== 0) {
						return;
					}

					nodesToBeRemoved.push(node);
				}
			});

			// delete the tabs
			for (const n of nodesToBeRemoved) {
				const id = n.getId();
				model.doAction(Actions.deleteTab(id));
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});
		}
	};

	return (
		<Panel
			actions={
				<>
					<IconButton
						size={"small"}
						color={"default"}
						title={"Refresh"}
						onClick={() => {
							refreshFiles();
						}}
					>
						<Refresh fontSize="inherit" />
					</IconButton>
					<Stack flex={1}>&nbsp;</Stack>
					<Tooltip title={`Publish files`}>
						<IconButton
							size={"small"}
							color={"default"}
							onClick={(e) => {
								e.stopPropagation();
								publishApp();
							}}
						>
							<PublishedWithChangesOutlined fontSize="inherit" />
						</IconButton>
					</Tooltip>
					<Tooltip title={`Recompile reactors`}>
						<IconButton
							size={"small"}
							color={"default"}
							onClick={(e) => {
								e.stopPropagation();
								recompileApp();
							}}
						>
							<CoffeeOutlined fontSize="inherit" />
						</IconButton>
					</Tooltip>
					<Tooltip title={`Upload file(s) to ${fileUploadPath}`}>
						<IconButton
							size={"small"}
							color={"default"}
							onClick={(e) => {
								e.stopPropagation();
								handleOpenAddFile();
							}}
						>
							<FileUpload fontSize="inherit" />
						</IconButton>
					</Tooltip>
					<Tooltip title={`Create new file at ${fileUploadPath}`}>
						<IconButton
							title={`Create new file at ${fileUploadPath}`}
							size={"small"}
							color={"default"}
							onClick={(e) => {
								e.stopPropagation();
								handleOpenCreateFile("file");
							}}
						>
							<NoteAddOutlined fontSize="inherit" />
						</IconButton>
					</Tooltip>
					<Tooltip title={`Create new folder at ${fileUploadPath}`}>
						<IconButton
							size={"small"}
							color={"default"}
							onClick={(e) => {
								e.stopPropagation();
								handleOpenCreateFile("directory");
							}}
						>
							<CreateNewFolderOutlined fontSize="inherit" />
						</IconButton>
					</Tooltip>
				</>
			}
		>
			{deleteMode && (
				<Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
					Select files to delete
				</Typography>
			)}
			{duplicateMode && (
				<Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
					Select files to duplicate
				</Typography>
			)}
			<FileExplorer
				// ref={(el) => {
				//     if (el) itemRefs.current[path] = el;
				// }}
				itemRefs={itemRefs}
				key={counter}
				type={EXPLORER_TYPE}
				space={workspace.appId}
				insightId={workspace.insightId}
				onSelect={(path) => {
					handleOnSelect(path);
				}}
				onTrashClick={(e, paths) => {
					handleOnTrashClick(paths);
				}}
				onDragStart={(e, path) => {
					handleOnItemDragStart(e, path);
				}}
				onRenameSave={handleRename}
				deleteMode={deleteMode}
				checkedPaths={checkedPaths}
				onToggleChecked={handleToggleChecked}
				onDeleteRequest={handleDelete}
				onCancelDeleteMode={handleCancelDeleteMode}
				deleteRootPath={deleteRootPath}
				deletablePaths={deletablePaths}
				duplicateMode={duplicateMode}
				onDuplicateRequest={handleDuplicate}
				onCancelDuplicateMode={handleCancelDuplicateMode}
				duplicateRootPath={duplicateRootPath}
				duplicatablePaths={duplicatablePaths}
				onDuplicateClickFunc={handleOnDuplicateClickFunc}
				onAllFoldersLoaded={setAllFolders}
				onAllFilesLoaded={setAllFiles}
				expandedPaths={expandedPaths}
				onToggleExpand={handleToggleExpand}
				onExpand={(path, childrenPaths) => {
					handleExpandPath(path, childrenPaths);
				}}
			/>
		</Panel>
	);
};
