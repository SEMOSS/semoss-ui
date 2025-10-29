import {
	CoffeeOutlined,
	CreateNewFolderOutlined,
	FileUpload,
	NoteAddOutlined,
	PublishedWithChangesOutlined,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { FlexLayout } from "@semoss/shared";
import {
	IconButton,
	Stack,
	styled,
	Tooltip,
	useNotification,
} from "@semoss/ui";
import {
	AddFileOverlay,
	CreateFileOverlay,
	DeleteFileOverlay,
	FileExplorer,
} from "@/components/common";
import { MakeMCPOverlay } from "@/components/common/File/MakeMCPOverlay";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./Panel";

const EXPLORER_TYPE = "app";

interface FileExplorerPanelProps {
	title: string;
	/** Current layoutobject */
	layout: FlexLayout.Layout;
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

const StyledFileSpan = styled("span")(({ theme }) => ({
	color: "var(--Text-Primary, #212121)",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "150%", // or '24px' if you prefer fixed px value
	letterSpacing: "0.15px",
}));

const StyledTitleSpan = styled("span")(({ theme }) => ({
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

export const FileExplorerPanel = (props: FileExplorerPanelProps) => {
	const { title, layout } = props;

	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();

	const notification = useNotification();

	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	// files to add
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [fileUploadPath, setFileUploadPath] = useState<string>("");

	// temporary fix for dead refresh button should be removed
	const [counter, setCounter] = useState(0);

	const [mcpOverlayOpen, setMCPOverlayOpen] = useState(false);
	const [mcpTools, setMCPTools] = useState<Record<string, unknown>>({
		tools: [],
		_meta: {},
	});
	const [currentFilePath, setCurrentFilePath] = useState("");

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

	const handleMakeMCPClick = async (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => {
		workspace.setLoading(true);
		try {
			// Make pixel call to generate MCP tool
			const { errors, pixelReturn } = await runPixel(
				`MakePythonMCP(project="${workspace.appId}")`,
			);
			workspace.setLoading(false);
			// Handle pixel call errors
			if (errors?.length) {
				notification.add({
					message: errors[0],
					color: "error",
				});
				return;
			}
			if (workspace.model) {
				const tabset = workspace.model
					.getActiveTabset()
					.getChildren()
					.find((tabset) => tabset.getAttr("name") === "py_mcp.json");
				if (tabset) {
					await workspace.model.doAction(
						FlexLayout.Actions.deleteTab(tabset.getId()),
					);
				}
			}
			// refresh the content
			refreshFiles();
			// Handle pixel call response
			if (pixelReturn[0].output) {
				notification.add({
					message: "Successfully generated MCP tools",
					color: "success",
				});
			}
			// Validate pixel return
			if (!pixelReturn?.[0]?.output) {
				throw new Error("Invalid response from pixel call");
			}
		} catch (e) {
			workspace.setLoading(false);
			notification.add({
				message: e.message,
				color: "error",
			});
		}
	};

	const handleMCPEditClick = async (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => {
		workspace.setLoading(true);
		try {
			// Make pixel call to generate MCP tool
			const { errors, pixelReturn } = await runPixel(
				`GetAsset(filePath=["${path}"], space=["${workspace.appId}"]);`,
			);
			workspace.setLoading(false);
			// Handle pixel call errors
			if (errors?.length) {
				throw new Error(errors[0]);
			}
			const output = JSON.parse(pixelReturn[0]?.output as string);
			setMCPTools(output);
			setCurrentFilePath(path);
			setMCPOverlayOpen(true);
		} catch (e) {
			workspace.setLoading(false);
			notification.add({
				message: e.message,
				color: "error",
			});
		}
	};

	const handleMCPEditSave = async (finalTools: Record<string, unknown>[]) => {
		try {
			workspace.setLoading(true);
			let pixel = "";
			const tools = { ...mcpTools, tools: finalTools };
			if (mcpTools) {
				pixel = `SaveAsset(fileName=["${currentFilePath}"], content=["<encode>${JSON.stringify(tools, null, 2)}</encode>"], space=["${workspace.appId}"]);CommitAsset(filePath=["${currentFilePath}"], comment=["Save from editor"], space=["${workspace.appId}"])`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to get file");
			}

			const { errors, pixelReturn } = await runPixel(
				pixel,
				workspace.insightId,
			);

			if (pixelReturn[0].output) {
				if (workspace.model) {
					const tabset = workspace.model
						.getActiveTabset()
						.getChildren()
						.find(
							(tabset) =>
								tabset.getAttr("name") === "py_mcp.json",
						);
					if (tabset) {
						await workspace.model.doAction(
							FlexLayout.Actions.deleteTab(tabset.getId()),
						);
					}
				}
				notification.add({
					message: "Successfully saved MCP tools",
					color: "success",
				});
			}

			// bubble up the errors
			for (const e of errors) {
				throw new Error(e);
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			workspace.setLoading(false);
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
				FlexLayout.Actions.addNode(
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
					FlexLayout.DockLocation.CENTER,
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

			let selectedNode: FlexLayout.TabNode | null = null;

			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// visit the notes, and see if it exists
			model.visitNodes((node) => {
				// check if it is a tabNode
				if (node instanceof FlexLayout.TabNode) {
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
			model.doAction(FlexLayout.Actions.selectTab(selectedNodeId));
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

			const nodesToBeRemoved: FlexLayout.TabNode[] = [];

			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// visit the notes, and see if it exists
			model.visitNodes((node) => {
				// check if it is a tabNode
				if (node instanceof FlexLayout.TabNode) {
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
				model.doAction(FlexLayout.Actions.deleteTab(id));
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});
		}
	};

	return (
		<>
			<Panel
				actions={
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
					onTrashClick={(_e, path) => {
						handleOnTrashClick(path);
					}}
					onDragStart={(e, path) => {
						handleOnItemDragStart(e, path);
					}}
					onMakeMCPClick={(e, path) => {
						handleMakeMCPClick(e, path);
					}}
					onMCPEditClick={(e, path) => {
						handleMCPEditClick(e, path);
					}}
					expandedPaths={expandedPaths}
					onToggleExpand={handleToggleExpand}
				/>
			</Panel>
			{mcpOverlayOpen && (
				<MakeMCPOverlay
					tools={mcpTools.tools as Record<string, unknown>[]}
					onClose={() => setMCPOverlayOpen(false)}
					handleToolsUpdate={(tools) =>
						setMCPTools({ ...mcpTools, tools })
					}
					handleMCPEditSave={handleMCPEditSave}
				/>
			)}
		</>
	);
};
