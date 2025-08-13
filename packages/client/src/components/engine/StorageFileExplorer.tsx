import {
	ChevronRight,
	CloudDownloadOutlined,
	CloudUploadOutlined,
	DeleteOutline,
	ExpandMore,
	Refresh,
} from "@mui/icons-material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Button,
	CircularProgress,
	FileDropzone,
	Icon,
	IconButton,
	LinearProgress,
	Modal,
	styled,
	TreeView,
	Typography,
	useNotification,
} from "@semoss/ui";
import { LoadingScreen } from "@/components/ui";
import { usePixel, useRootStore } from "@/hooks";
import { StorageExplorerItem } from "./StorageExplorerItem";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const StyledHeader = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: theme.spacing(1),
}));

const StyledFileExplorerContainer = styled("div")(({ theme }) => ({
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.spacing(1),
	padding: theme.spacing(1),
	minHeight: "400px",
	maxHeight: "600px",
	overflow: "auto",
}));

const StyledTreeView = styled(TreeView)(({ theme }) => ({
	width: "100%",
	maxHeight: "100%",
	gap: theme.spacing(3),
	".MuiTreeItem-content": {
		padding: theme.spacing(0.5),
	},
	overflow: "auto",
}));

const StyledTreeHeader = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: theme.spacing(1),
	borderBottom: `1px solid ${theme.palette.divider}`,
}));

interface StorageFileExplorerProps {
	id: string;
}

type FileUploadForm = {
	PROJECT_UPLOAD: File[];
};

export const StorageFileExplorer = (props: StorageFileExplorerProps) => {
	const { id } = props;
	const { monolithStore, configStore } = useRootStore();
	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [openPopUp, setOpenPopUp] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selected, setSelected] = useState<string[]>([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const notification = useNotification();

	const getStorageFiles = usePixel<string[]>(
		`Storage(storage = "${id}") | ListStoragePath(storagePath='/');`,
	);

	const initLoadComplete = getStorageFiles.status === "SUCCESS";

	const refreshFiles = () => {
		getStorageFiles.refresh();
	};

	const handleToggleExpand = (path: string) => {
		setExpandedPaths((prev) => {
			if (prev.includes(path)) {
				return prev.filter((p) => p !== path);
			} else {
				return [...prev, path];
			}
		});
	};

	const handleFileSelect = (path: string) => {
		setSelectedFile(path);
	};

	const handleOnNodeSelect = (selected: string[]) => {
		handleFileSelect(selected[0] || "");
		setSelected(selected);
	};

	const { control, setValue, handleSubmit } = useForm<{
		PROJECT_UPLOAD: File[];
	}>({
		defaultValues: {
			PROJECT_UPLOAD: [],
		},
	});

	const handleUpload = handleSubmit(async (data: FileUploadForm) => {
		setIsLoading(true);
		let fileLocations = "";

		try {
			const upload = await monolithStore.uploadFile(
				data.PROJECT_UPLOAD,
				configStore.store.insightID,
			);

			upload.map(async (file, index) => {
				const fileLocation = file.fileLocation.replace(/\\/g, "/");
				if (index + 1 === upload.length) {
					fileLocations = fileLocations += `"${fileLocation}"`;
				} else {
					fileLocations = fileLocations += `"${fileLocation}", `;
				}
			});

			const response = await monolithStore.runQuery(`
            Storage(storage = "${id}") | PushToStorage(storagePath='/', filePath=[${fileLocations}]);
            `);

			const { output } = response.pixelReturn[0];

			if (output.size() === -1) {
				notification.add({
					color: "success",
					message: `Successfully added document(s)`,
				});
			} else {
				notification.add({
					color: "error",
					message: `Failed to upload: ${output.join(", ")}`,
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			refreshFiles();
			setIsLoading(false);
			setValue("PROJECT_UPLOAD", []);
			setOpenPopUp(false);
		}
	});

	const sanitizeFilename = (filename: string): string => {
		return filename
			.replace(/[<>:"/\\|?*]/g, "_")
			.replace(/\s+/g, "_")
			.replace(/_{2,}/g, "_")
			.replace(/^_+|_+$/g, "");
	};

	const extractFilename = (filePath: string): string => {
		const filename = filePath.split("/").pop() || "downloaded_file";

		if (!filename || filename.trim() === "") {
			return "downloaded_file";
		}

		const sanitized = sanitizeFilename(filename);

		if (!sanitized) {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			return `downloaded_file_${timestamp}`;
		}

		return sanitized;
	};

	const handleDelete = async (filePath?: string) => {
		const pathsToDelete = filePath ? [filePath] : selected;

		if (pathsToDelete.length === 0) return;

		if (pathsToDelete.length === 1) {
			const deleteQuery = `Storage(storage = "${id}") |
            DeleteFromStorage(storagePath="${pathsToDelete[0]}", leaveFolderStructure=false);`;

			try {
				const response = await monolithStore.runQuery(deleteQuery);

				// Check if the response contains an error message
				if (response.errors.length > 0) {
					notification.add({
						color: "error",
						message: `Failed to delete file response: ${response.errors[0]}`,
					});
				} else {
					// Successful deletion
					notification.add({
						color: "success",
						message: `Successfully deleted document`,
					});

					setExpandedPaths((prev) =>
						prev.filter((p) => !p.startsWith(pathsToDelete[0])),
					);

					if (selectedFile === pathsToDelete[0]) {
						setSelectedFile("");
					}
					refreshFiles();
				}
			} catch (e) {
				notification.add({
					color: "error",
					message: `Failed to deleteeeeee file(s): ${e}`,
				});
			}
		} else {
			const pathsString = pathsToDelete
				.map((path) => `"${path}"`)
				.join(", ");
			const deleteQuery = `Storage(storage = "${id}") |
            DeleteFromStorage(storagePaths=[${pathsString}], leaveFolderStructure=false);`;

			try {
				const response = await monolithStore.runQuery(deleteQuery);

				if (response.errors && response.errors.length > 0) {
					notification.add({
						color: "error",
						message: `Failed to delete files: ${response.errors[0]}`,
					});
					return;
				}

				console.log("Multiple files deleted:", pathsToDelete);
				pathsToDelete.forEach((path) => {
					setExpandedPaths((prev) =>
						prev.filter((p) => !p.startsWith(path)),
					);
					if (selectedFile === path) {
						setSelectedFile("");
					}
				});
				setSelected([]);
				setShowDeleteDialog(false);
				refreshFiles();

				// Show success message only if we got here without errors
				notification.add({
					color: "success",
					message: `Successfully deleted ${pathsToDelete.length} file(s)`,
				});
			} catch (e) {
				console.error("Delete multiple error:", e);
				notification.add({
					color: "error",
					message: `Failed to delete file(s): ${e.message || e}`,
				});
			}
		}
	};
	/*
	 * @param path
	 * @returns
	 *
	 * GetEngineMetadata(engine=["8be5fb68-ffab-47bd-af2a-cd409b51e732"], metaKeys=["engine_name"]);
	 */
	const handleDownload = async (path?: string) => {
		const pathsToDownload = path ? [path] : selected;

		if (pathsToDownload.length === 0) return;

		if (pathsToDownload.length === 1) {
			try {
				const filename = extractFilename(pathsToDownload[0]);

				if (pathsToDownload[0].endsWith("/")) {
					notification.add({
						color: "error",
						message:
							"Cannot download a directory. Please select a file.",
					});
					return;
				}

				const downloadQuery = `Storage("${id}") | PullFromStorage(storagePath="${pathsToDownload[0]}", filePath="${filename}") | DownloadAsset(filePath=["${filename}"], space=["insight"]);`;

				const response = await monolithStore.runQuery(downloadQuery);

				const fileKey = response.pixelReturn[0]?.output;

				if (!fileKey) {
					throw new Error(
						"Failed to get file key for download. The file may not exist or there was a server error.",
					);
				}

				await monolithStore.download(
					configStore.store.insightID,
					fileKey,
				);

				notification.add({
					color: "success",
					message: `Successfully downloaded: ${filename}`,
				});
			} catch (e) {
				console.error("Download error:", e);

				let errorMessage = "Download failed: ";
				if (e instanceof Error) {
					if (e.message.includes("directory")) {
						errorMessage =
							"Cannot download directories. Please select a file.";
					} else if (e.message.includes("file key")) {
						errorMessage =
							"File not found or server error occurred.";
					} else if (
						e.message.includes("network") ||
						e.message.includes("fetch")
					) {
						errorMessage =
							"Network error. Please check your connection and try again.";
					} else {
						errorMessage += e.message;
					}
				} else {
					errorMessage += "An unexpected error occurred.";
				}

				notification.add({
					color: "error",
					message: errorMessage,
				});
			}
		} else {
			try {
				const downloadedFiles: string[] = [];

				for (const path of pathsToDownload) {
					if (path.endsWith("/")) {
						throw new Error(
							"Cannot download directories. Please select files only.",
						);
					}

					const filename = extractFilename(path);
					const downloadQuery = `Storage("${id}") | PullFromStorage(storagePath="${path}", filePath="${filename}");`;

					await monolithStore.runQuery(downloadQuery);
					downloadedFiles.push(filename);
				}
				if (downloadedFiles.length > 0) {
					const storageMetaData = await monolithStore.runQuery(
						`GetEngineMetadata(engine=["${id}"]);`,
					);
					const storageName =
						storageMetaData.pixelReturn[0].output.database_name;
					const userName = configStore.store.user.name;
					const now = new Date();
					const formattedDate = now
						.toISOString()
						.replace(/[:]/g, "-")
						.replace(/\..+/, "")
						.replace("T", "_");

					const filePathsString = downloadedFiles
						.map((file) => `"${file}"`)
						.join(", ");
					const zipQuery = `ZipFiles(filePaths=[${filePathsString}], filePath="${storageName}_${userName}_${formattedDate}.zip") 
                                    | DownloadAsset(filePath=["${storageName}_${userName}_${formattedDate}.zip"], space=["insight"]);`;

					const response = await monolithStore.runQuery(zipQuery);

					const fileKey = response.pixelReturn[0]?.output;

					if (!fileKey) {
						throw new Error(
							"Failed to get file key for download. The files may not exist or there was a server error.",
						);
					}

					await monolithStore.download(
						configStore.store.insightID,
						fileKey,
					);

					setSelected([]);
				}
			} catch (e) {
				console.error("Download multiple error:", e);

				let errorMessage = "ZIP download failed: ";
				if (e instanceof Error) {
					if (e.message.includes("directory")) {
						errorMessage +=
							"Cannot download directories. Please select files only.";
					} else if (e.message.includes("file key")) {
						errorMessage +=
							"Files not found or server error occurred.";
					} else if (
						e.message.includes("network") ||
						e.message.includes("fetch")
					) {
						errorMessage +=
							"Network error. Please check your connection and try again.";
					} else {
						errorMessage += e.message;
					}
				} else {
					errorMessage += "An unexpected error occurred.";
				}

				console.error(errorMessage);
			}
		}
	};

	if (!initLoadComplete) {
		return (
			<LoadingScreen.Trigger description="Retrieving files from storage..." />
		);
	}

	const files =
		getStorageFiles.status === "SUCCESS"
			? getStorageFiles.data.map((filePath) => {
					const pathParts = filePath.split("/").filter(Boolean);
					const name = pathParts[pathParts.length - 1] || filePath;
					const isDirectory = filePath.endsWith("/");

					return {
						name,
						path: filePath,
						type: isDirectory ? "directory" : "file",
						lastModified: "",
					};
				})
			: [];

	return (
		<StyledContainer>
			<StyledHeader>
				<Typography variant="h6">Storage File Explorer</Typography>
				<div style={{ display: "flex", gap: "8px" }}>
					<IconButton
						size="small"
						color="default"
						title="Refresh files"
						onClick={refreshFiles}
					>
						<Refresh fontSize="inherit" />
					</IconButton>
					<Button
						variant="outlined"
						startIcon={<CloudUploadOutlined />}
						onClick={() => setOpenPopUp(true)}
						size="small"
					>
						Upload Files
					</Button>
				</div>
			</StyledHeader>

			<StyledFileExplorerContainer>
				<StyledTreeHeader>
					<Typography variant="body2" color="textSecondary">
						{selected.length > 0
							? `${selected.length} item(s) selected`
							: "No items selected"}
					</Typography>
					{selected.length > 0 && (
						<>
							<Button
								variant="outlined"
								color="primary"
								startIcon={<CloudDownloadOutlined />}
								size="small"
								onClick={() => handleDownload()}
							>
								Download Selected
							</Button>
							<Button
								variant="outlined"
								color="error"
								startIcon={<DeleteOutline />}
								size="small"
								onClick={() => setShowDeleteDialog(true)}
							>
								Delete Selected
							</Button>
						</>
					)}
				</StyledTreeHeader>
				<StyledTreeView
					multiSelect
					expanded={expandedPaths}
					selected={selected}
					onNodeToggle={(_e, nodeIds) => {
						const lastToggled =
							nodeIds.find((id) => !expandedPaths.includes(id)) ||
							expandedPaths.find((id) => !nodeIds.includes(id));
						if (lastToggled) {
							handleToggleExpand(lastToggled);
						}
					}}
					onNodeSelect={(_e, v) => {
						handleOnNodeSelect(v);
					}}
					defaultCollapseIcon={
						<Icon color={"disabled"}>
							<ExpandMore />
						</Icon>
					}
					defaultExpandIcon={
						<Icon color={"disabled"}>
							<ChevronRight />
						</Icon>
					}
				>
					{getStorageFiles.status === "INITIAL" ||
					getStorageFiles.status === "LOADING" ? (
						<LoadingScreen>
							<LoadingScreen.Trigger />
						</LoadingScreen>
					) : getStorageFiles.status === "SUCCESS" ? (
						files.map((n) => {
							return (
								<StorageExplorerItem
									key={n.path}
									storageId={id}
									name={n.name}
									path={n.path}
									isDirectory={n.type === "directory"}
									lastModified={n.lastModified}
									expanded={expandedPaths}
									selected={selected}
									onTrashClick={(_e, path) => {
										handleDelete(path);
									}}
									onDownload={(path) => {
										handleDownload(path);
									}}
									onSelect={(path, isSelected) => {
										let newSelected = [...selected];
										if (isSelected) {
											if (!newSelected.includes(path)) {
												newSelected.push(path);
											}
										} else {
											newSelected = newSelected.filter(
												(p) => p !== path,
											);
										}
										handleOnNodeSelect(newSelected);
									}}
								/>
							);
						})
					) : null}
				</StyledTreeView>
			</StyledFileExplorerContainer>

			{selectedFile && (
				<Typography variant="body2" color="textSecondary">
					Selected: {selectedFile}
				</Typography>
			)}

			<Modal
				open={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
			>
				<Modal.Title>Confirm Delete</Modal.Title>
				<Modal.Content>
					<Typography variant="body1">
						Are you sure you want to delete {selected.length}{" "}
						selected item(s)? This action cannot be undone.
					</Typography>
				</Modal.Content>
				<Modal.Actions>
					<Button onClick={() => setShowDeleteDialog(false)}>
						Cancel
					</Button>
					<Button
						onClick={() => handleDelete()}
						color="error"
						variant="contained"
					>
						Delete
					</Button>
				</Modal.Actions>
			</Modal>

			<Modal
				open={openPopUp}
				onClose={() => setOpenPopUp(false)}
				fullWidth
			>
				<Modal.Title>Upload Files</Modal.Title>
				<form onSubmit={handleUpload}>
					<Modal.Content>
						<div style={{ maxHeight: 500, overflowY: "auto" }}>
							<Controller
								name={"PROJECT_UPLOAD"}
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<FileDropzone
											multiple={true}
											value={field.value}
											disabled={isLoading}
											onChange={(newValues) => {
												field.onChange(newValues);
											}}
										/>
									);
								}}
							/>
						</div>
					</Modal.Content>
					<Modal.Actions>
						<Button
							variant={"outlined"}
							disabled={isLoading}
							onClick={() => setOpenPopUp(false)}
						>
							Close
						</Button>
						<Button
							type="submit"
							variant={"contained"}
							disabled={isLoading}
							startIcon={
								isLoading ? (
									<CircularProgress size="1em" />
								) : null
							}
						>
							Upload
						</Button>
					</Modal.Actions>
				</form>
				{isLoading && <LinearProgress />}
			</Modal>
		</StyledContainer>
	);
};
