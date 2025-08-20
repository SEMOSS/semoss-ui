import {
	CoffeeOutlined,
	CreateNewFolderOutlined,
	FileUpload,
	NoteAddOutlined,
	PublishedWithChangesOutlined,
	Refresh,
	Search,
} from "@mui/icons-material";
import { Actions, DockLocation, type Layout, TabNode } from "flexlayout-react";
import { useEffect, useState } from "react";
import {
	IconButton,
	InputAdornment,
	Stack,
	styled,
	TextField,
	Tooltip,
	useNotification,
} from "@semoss/ui";
import {
	AddFileOverlay,
	CreateFileOverlay,
	DeleteFileOverlay,
	FileExplorer,
} from "@/components/common";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./Panel";

const EXPLORER_TYPE = "app";

interface FileExplorerPanelProps {
	title: string;
	/** Current layoutobject */
	layout: Layout;
}

const StyledTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	background: " #EBF4FE",
	width: "fit-content",
	marginTop: "4px",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	marginBottom: "8px",

	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
}));

const StyledFileSpan = styled("span")(() => ({
	color: "var(--Text-Primary, #212121)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "150%", // or '24px' if you prefer fixed px value
	letterSpacing: "0.15px",
}));

const StyledTitleSpan = styled("span")(() => ({
	color: "var(--Primary-Dark, #1260DD)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontSize: "13px",
	fontFamily: "Inter",
	fontWeight: 400,
	fontStyle: "normal",
	letterSpacing: "0.16px",
	lineHeight: "18px",
	marginBottom: "8px",
	marginTop: "8px",
}));

const StyledTextField = styled(TextField)(() => ({
	paddingRight: "16px",
	paddingLeft: "16px",
	marginTop: "8px",
	width: "100%",
	borderRadius: "8px",
}));

export const FileExplorerPanel = (props: FileExplorerPanelProps) => {
	const { title, layout } = props;

	const { workspace } = useWorkspace();
	const { monolithStore, configStore } = useRootStore();

	const notification = useNotification();

	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	// files to add
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [fileUploadPath, setFileUploadPath] = useState<string>("");

	// temporary fix for dead refresh button should be removed
	const [counter, setCounter] = useState(0);
	const uploadedRefresh = configStore.store.reloadFiles;

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
	 * Refresh the files
	 */
	const refreshFiles = () => {
		// increment the counter
		setCounter(counter + 1);
	};

	useEffect(() => {
		if (uploadedRefresh !== "") {
			refreshFiles();
			configStore.setReloadFiles("");
		}
	}, [uploadedRefresh]);

	const handleToggleExpand = (path: string) => {
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
	const handleOnTrashClick = (fileDeletePath: string) => {
		workspace.openOverlay(() => (
			<DeleteFileOverlay
				type={EXPLORER_TYPE}
				space={workspace.appId}
				onClose={(success) => {
					if (success) {
						// trigger the delete file callback if successful
						removePanel(fileDeletePath);

						// refresh the content
						refreshFiles();
					}
					// close the overlay
					workspace.closeOverlay();
				}}
				fileDeletePath={fileDeletePath}
			/>
		));
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
					<Stack
						direction={"column"}
						spacing={0}
						className="notebook-variables-menu"
						width={"100%"}
					>
						<StyledTitle>
							<StyledTitleSpan>{title}</StyledTitleSpan>
						</StyledTitle>
						{/* TODO: Implement Search functionality and remove the comments */}
						{/* <StyledTextField
                            placeholder="Search"
                            size="small"
                            fullWidth
                            // value={search}
                            // onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                // endAdornment: (
                                //     <InputAdornment position="end">
                                //         <IconButton
                                //             size="small"
                                //             onClick={(e) =>
                                //                 setMenuAnchorEl(e.currentTarget)
                                //             }
                                //         >
                                //             <Badge
                                //                 variant="dot"
                                //                 invisible={!anyEnabledFilter}
                                //                 color="primary"
                                //             >
                                //                 <Tune />
                                //             </Badge>
                                //         </IconButton>
                                //     </InputAdornment>
                                // ),
                            }}
                        /> */}
						<Stack
							direction={"row"}
							alignItems={"center"}
							justifyContent={"space-between"}
							paddingLeft={"16px"}
							paddingRight={"16px"}
							paddingTop={"16px"}
						>
							<StyledFileSpan>Files</StyledFileSpan>
							<Stack direction={"row"} spacing={0.5}>
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
								<Tooltip
									title={`Upload file(s) to ${fileUploadPath}`}
								>
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
								<Tooltip
									title={`Create new file at ${fileUploadPath}`}
								>
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
								<Tooltip
									title={`Create new folder at ${fileUploadPath}`}
								>
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
							</Stack>
						</Stack>
					</Stack>
				</>
			}
		>
			<FileExplorer
				key={counter}
				type={EXPLORER_TYPE}
				space={workspace.appId}
				insightId={workspace.insightId}
				onSelect={(path) => {
					handleOnSelect(path);
				}}
				onTrashClick={(e, path) => {
					handleOnTrashClick(path);
				}}
				onDragStart={(e, path) => {
					handleOnItemDragStart(e, path);
				}}
				expandedPaths={expandedPaths}
				onToggleExpand={handleToggleExpand}
			/>
		</Panel>
	);
};
