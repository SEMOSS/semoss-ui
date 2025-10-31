import {
	DeleteOutline,
	DescriptionOutlined,
	EditOutlined,
	MoreVert,
	SmartToyOutlined,
	TopicOutlined,
} from "@mui/icons-material";
import DoneIcon from "@mui/icons-material/Done";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import {
	Button,
	Checkbox,
	Box,
	CircularProgress,
	Icon,
	IconButton,
	Menu,
	styled,
	TreeView,
	Typography,
} from "@semoss/ui";
import { usePixel } from "@/hooks";
import DuplicateIcon from "../../../assets/img/Duplicate.svg";
import {
	MCP_JSON_FILE_NAME,
	MCP_PY_FILE_NAME,
} from "@/pages/app/app.constants";

const StyledNode = styled(TreeView.Item)(({ theme }) => ({
	".MuiCollapse-wrapperInner": {
		height: "auto",
		overflow: "none",
	},
}));

const StyledLabel = styled("div", {
	shouldForwardProp: (prop) => prop !== "isDragging",
})<{
	isDragging: boolean;
}>(({ theme, isDragging }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	height: theme.spacing(3),
	width: "100%",
	gap: theme.spacing(1),
	opacity: isDragging ? 0.5 : 1,
}));

const StyledTypography = styled(Typography)(() => ({
	overflow: "hidden",
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",
	flex: "1",
}));

interface FileExplorerItemProps {
	/** Type of file opened */
	type: "app" | "insight";

	/** Space where the file is located */
	space: string;

	/** file details */
	name: string;
	path: string;
	isDirectory: boolean;
	lastModified: string;

	/** node details */
	expanded: string[];
	selected: string[];

	/** Triggered when the Label starts dragging */
	onDragStart?: (
		event: React.DragEvent<HTMLDivElement>,
		path: string,
	) => void;

	/** Triggered when the item ends dragging */
	onDragEnd?: (event: React.DragEvent<HTMLDivElement>, path: string) => void;

	/** Triggered when the Track Icon is clicked */
	onTrashClick?: (
		event: React.MouseEvent<HTMLButtonElement>,
		paths: string[],
	) => void;

	onRenameSave?: (
		oldPath: string,
		newName: string,
		isDirectory: boolean,
	) => void;
	deleteMode?: boolean;
	checkedPaths?: Set<string>;
	onToggleChecked?: (path: string) => void;
	onDeleteRequest?: (
		path: string,
		isDirectory: boolean,
		childrenPaths?: string[],
	) => void;
	onCancelDeleteMode?: () => void;
	deleteRootPath?: string | null;
	deletablePaths?: Set<string>;

	/** Additional props for duplicate mode */
	duplicateMode?: boolean;
	onDuplicateRequest?: (
		path: string,
		isDirectory: boolean,
		childrenPaths?: string[],
	) => void;
	onCancelDuplicateMode?: () => void;
	duplicateRootPath?: string | null;
	duplicatablePaths?: Set<string>;
	/** Additional props for duplicating files */
	onDuplicateClickFunc?: (
		checkedPaths: Set<string>,
		duplicateRootPath: string | null,
	) => void;

	/** Additional props for duplicating files */
	onFilesLoaded?: (path: string, filePaths: string[]) => void;

	/** Additional props for auto-expand + wait for load children */
	onExpand?: (path: string, childrenPaths?: string[]) => void;
	ref?: React.Ref<HTMLDivElement>;
	endIcon?: React.ReactNode;
	expandIcon?: React.ReactNode;
	collapseIcon?: React.ReactNode;
}

interface FolderContextMenuProps {
	anchorEl: null | HTMLElement;
	open: boolean;
	onClose: () => void;
	onRename: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
}

const FolderContextMenu = ({
	anchorEl,
	open,
	onClose,
	onRename,
	onDuplicate,
	onDelete,
}: FolderContextMenuProps) => (
	<Menu
		anchorEl={anchorEl}
		open={open}
		onClose={onClose}
		disableAutoFocusItem
		sx={{
			"& .MuiMenu-list": {
				display: "inline-flex",
				flexDirection: "column",
				alignItems: "flex-start",
				borderRadius: "4px",
				backgroundColor: "#fff",
				color: "#000",
				boxShadow: "0px 5px 24px 0px rgba(3, 0, 0, 0.32)",
				padding: "8px 0px",
			},
		}}
	>
		<Menu.Item
			value="rename"
			onClick={() => {
				onRename();
				onClose();
			}}
			sx={{
				display: "flex",
				height: "36px",
				padding: "6px 16px",
				alignItems: "center",
				alignSelf: "stretch",
			}}
		>
			<EditOutlined
				fontSize="medium"
				style={{
					minWidth: 28,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					paddingRight: 8,
					opacity: 0.8,
				}}
			/>
			Rename
		</Menu.Item>
		<Menu.Item
			value="duplicate"
			onClick={() => {
				onDuplicate();
				onClose();
			}}
			sx={{
				display: "flex",
				height: "36px",
				padding: "6px 16px",
				alignItems: "center",
				alignSelf: "stretch",
			}}
		>
			<img
				src={DuplicateIcon}
				alt="Duplicate Icon"
				style={{
					minWidth: 28,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					paddingRight: 8,
					opacity: 0.8,
					width: "20px",
					height: "20px",
				}}
			/>
			Duplicate
		</Menu.Item>
		<Menu.Item
			value="delete"
			onClick={() => {
				onDelete();
				onClose();
			}}
			sx={{
				display: "flex",
				height: "36px",
				padding: "6px 16px",
				alignItems: "center",
				alignSelf: "stretch",
			}}
		>
			<DeleteOutline
				fontSize="small"
				style={{
					minWidth: 28,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					paddingRight: 8,
					opacity: 0.8,
				}}
			/>
			Delete
		</Menu.Item>
	</Menu>
);

export interface FileExplorerItemHandle {
	expandAndLoad: () => Promise<void>;

	/** Triggered when the Make MCP Icon is clicked */
	onMakeMCPClick?: (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => boolean | void;

	/** Triggered when the Edit MCP Icon is clicked */
	onMCPEditClick?: (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => boolean | void;
}

export const FileExplorerItem = forwardRef<
	FileExplorerItemHandle,
	FileExplorerItemProps
>((props, ref) => {
	const {
		type,
		space,
		path,
		name,
		isDirectory,
		expanded,
		selected,
		onDragStart = () => null,
		onDragEnd = () => null,
		onTrashClick = () => null,
		onRenameSave = () => null,
		deleteMode = false,
		checkedPaths = new Set<string>(),
		onToggleChecked = () => null,
		onDeleteRequest = () => null,
		onCancelDeleteMode = () => null,
		deleteRootPath = null,
		deletablePaths = new Set<string>(),
		duplicateMode = false,
		onDuplicateRequest = () => null,
		onCancelDuplicateMode = () => null,
		duplicateRootPath = null,
		duplicatablePaths = new Set<string>(),
		onDuplicateClickFunc = () => null,
		onFilesLoaded = () => null,
		onExpand = () => null,
		endIcon,
		expandIcon,
		collapseIcon,
		onMakeMCPClick = () => null,
		onMCPEditClick = () => null,
	} = props;

	const [isHovered, setIsHovered] = useState(false);
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(name);

	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		setMenuAnchorEl(event.currentTarget);
	};
	const handleMenuClose = () => {
		setMenuAnchorEl(null);
	};

	const handleRenameSelected = () => {
		setIsEditing(true);
		setEditValue(name);
		handleMenuClose();
	};

	const handleRenameSave = () => {
		if (editValue && editValue !== name) {
			onRenameSave(path, editValue, isDirectory);
		}
		setIsEditing(false);
	};

	// running the useEffect here to close the menu when clicking outside or when the window loses focus
	useEffect(() => {
		const handleWindowBlur = () => {
			handleMenuClose();
		};
		
		const handleVisibilityChange = () => {
			if (document.hidden) {
				handleMenuClose();
			}
		};

		const handleBeforeUnload = () => {
			handleMenuClose();
		};

		window.addEventListener("blur", handleWindowBlur);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("beforeunload", handleBeforeUnload);
		
		return () => {
			window.removeEventListener("blur", handleWindowBlur);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	const isOpen = expanded.indexOf(path) > -1;
	const [forceOpen, setForceOpen] = useState(false);

	const getAssets = usePixel<
		{
			lastModified: string;
			name: string;
			path: string;
			type: "directory" | "file";
		}[]
	>(
		(isDirectory && isOpen && !forceOpen) || forceOpen
			? type === "app"
				? `BrowseAsset(filePath=["${path}"], space=["${space}"]);`
				: ""
			: "",
	);

	// Expose method for parent: expand + wait for load children
	useImperativeHandle(ref, () => ({
		expandAndLoad: async () => {
			if (!isDirectory) {
				return;
			}
			setForceOpen(true);
		},
	}));

	const [pendingAction, setPendingAction] = useState<
		null | "delete" | "duplicate"
	>(null);

	// creating the helper function to handle delete/duplicate, when you auto-expand a directory, we need to wait for the children to load before deleting/duplicating
	useEffect(() => {
		if (
			pendingAction &&
			getAssets.status === "SUCCESS" &&
			Array.isArray(getAssets.data)
		) {
			const childrenPaths = getAssets.data.map((n) => n.path);

			if (pendingAction === "delete") {
				onDeleteRequest(path, isDirectory, childrenPaths);
			} else if (pendingAction === "duplicate") {
				onDuplicateRequest(path, isDirectory, childrenPaths);
			}

			setPendingAction(null); // reset
		}
	}, [pendingAction, getAssets.status, getAssets.data, path, isDirectory]);

	// If the assets/files are loaded, we can trigger the onFilesLoaded callback
	useEffect(() => {
		if (getAssets.status === "SUCCESS" && Array.isArray(getAssets.data)) {
			const filePaths = getAssets.data
				.filter((item) => item.type !== "directory")
				.map((item) => item.path);
			onFilesLoaded(path, filePaths);
		}
	}, [getAssets.status, getAssets.data, path, onFilesLoaded]);

	const nodeRef = useCallback((ele) => {
		ele?.addEventListener("focusin", (e) => {
			e.stopImmediatePropagation();
		});
	}, []);

	const makeMCPCandidate =
		path === `version/assets/py/${MCP_PY_FILE_NAME}` && !isDirectory;
	const editMCPCandidate =
		path === `version/assets/mcp/${MCP_JSON_FILE_NAME}` && !isDirectory;

	return (
		<StyledNode
			ref={nodeRef}
			key={path}
			nodeId={path}
			title={name}
			expandIcon={
				isDirectory ? (
					expandIcon
				) : (
					<span style={{ width: 0, height: 0 }} />
				)
			}
			collapseIcon={
				isDirectory ? (
					collapseIcon
				) : (
					<span style={{ width: 0, height: 0 }} />
				)
			}
			endIcon={!isDirectory ? endIcon : null}
			label={
				<StyledLabel
					draggable={true}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
					isDragging={isDragging}
					onDragStart={(e) => {
						setIsDragging(true);

						// trigger the callback
						onDragStart(e, path);
					}}
					onDragEnd={(e) => {
						setIsDragging(false);

						// trigger the callback
						onDragEnd(e, path);
					}}
				>
					{deleteMode && deletablePaths.has(path) && (
						<Checkbox
							data-testid="delete-checkbox"
							checked={checkedPaths.has(path)}
							onChange={() => onToggleChecked(path)}
							checkboxProps={{
								size: "small",
								sx: {
									padding: "2px",
									marginRight: "-8px",
								},
							}}
						/>
					)}
					{duplicateMode && duplicatablePaths.has(path) && (
						<Checkbox
							data-testid="duplicate-checkbox"
							checked={checkedPaths.has(path)}
							onChange={() => onToggleChecked(path)}
							checkboxProps={{
								size: "small",
								sx: {
									padding: "2px",
									marginRight: "-8px",
								},
							}}
						/>
					)}
					<Icon color={"disabled"} fontSize="small">
						{isDirectory ? (
							<TopicOutlined fontSize="inherit" />
						) : (
							<DescriptionOutlined fontSize="inherit" />
						)}
					</Icon>
					{isEditing ? (
						<>
							<input
								type="text"
								value={editValue}
								data-testid="rename-input"
								style={{
									flex: 1,
									padding: "4px",
									borderRadius: "4px",
									border: "1px solid #ccc",
									width: "100%",
									minWidth: "12vw",
								}}
								autoFocus
								onChange={(e) => setEditValue(e.target.value)}
								onBlur={(e) => {
									setIsEditing(false);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleRenameSave();
										setIsEditing(false);
									} else if (e.key === "Escape") {
										setIsEditing(false);
									}
								}}
							/>
							<IconButton
								size="small"
								onMouseDown={(e) => {
									e.preventDefault();
									handleRenameSave();
									setIsEditing(false);
								}}
								sx={{ ml: 0.5 }}
								data-testid="done-icon"
							>
								<DoneIcon fontSize="small" color="primary" />
							</IconButton>
						</>
					) : (
						<>
							<StyledTypography variant="body2">
								{name}
							</StyledTypography>
							{!deleteMode && !duplicateMode && isHovered && (
								<>
									<IconButton
										title={`More actions for ${name}`}
										onClick={handleMenuOpen}
										size="small"
										color="default"
										data-testid="more-icon"
									>
										<MoreVert fontSize="inherit" />
									</IconButton>
									<FolderContextMenu
										anchorEl={menuAnchorEl}
										open={Boolean(menuAnchorEl)}
										onClose={handleMenuClose}
										onRename={handleRenameSelected}
										onDuplicate={() => {
											if (isDirectory) {
												const childrenPaths =
													isDirectory &&
													getAssets.status === "SUCCESS"
														? getAssets.data.map((n) => n.path)
														: [];
												onExpand(path, childrenPaths); // trigger expand
												setPendingAction("duplicate"); // wait for children
											} else {
												onDuplicateRequest(
													path,
													false,
													[],
												);
											}
										}}
										onDelete={() => {
											if (isDirectory) {
												const childrenPaths =
													isDirectory &&
													getAssets.status === "SUCCESS"
														? getAssets.data.map((n) => n.path)
														: [];
												onExpand(path, childrenPaths);
												setPendingAction("delete");
											} else {
												onDeleteRequest(
													path,
													false,
													[],
												);
											}
										}}
									/>
								</>
							)}
						</>
					)}
					<StyledTypography variant="body2">{name}</StyledTypography>
					{isHovered ? (
						<Box>
							{makeMCPCandidate && (
								<IconButton
									title={`Make ${name} MCP`}
									size="small"
									color={"default"}
									onClick={(e) => {
										// don't allow it to propagate
										e.stopPropagation();
										// trigger
										onMakeMCPClick(e, path);
									}}
								>
									<SmartToyOutlined fontSize="inherit" />
								</IconButton>
							)}
							{editMCPCandidate && (
								<IconButton
									title={`Edit ${name}`}
									size="small"
									color={"default"}
									onClick={(e) => {
										// don't allow it to propagate
										e.stopPropagation();
										// trigger
										onMCPEditClick(e, path);
									}}
								>
									<EditOutlined fontSize="inherit" />
								</IconButton>
							)}
							<IconButton
								title={`Delete ${name}`}
								onClick={(e) => {
									// don't allow it to propagate
									e.stopPropagation();

									// trigger
									onTrashClick(e, path);
								}}
								size="small"
								color={"default"}
							>
								<DeleteOutline fontSize="inherit" />
							</IconButton>
						</Box>
					) : null}
				</StyledLabel>
			}
		>
			{isDirectory && isOpen ? (
				<>
					{getAssets.status === "INITIAL" ||
					getAssets.status === "LOADING" ? (
						<Icon color="disabled">
							<CircularProgress color="inherit" size={"small"} />
						</Icon>
					) : null}
					{getAssets.status === "SUCCESS"
						? getAssets.data.map((n) => {
								return (
									<FileExplorerItem
										//   ref={ref}
										key={n.path}
										type={type}
										space={space}
										isDirectory={n.type === "directory"}
										name={n.name}
										path={n.path}
										lastModified={n.lastModified}
										expanded={expanded}
										selected={selected}
										onTrashClick={(e, paths) => {
											onTrashClick(e, paths);
										}}
										onDragStart={(e, path) => {
											onDragStart(e, path);
										}}
										onRenameSave={(
											oldPath,
											newName,
											isDirectory,
										) => {
											onRenameSave(
												oldPath,
												newName,
												isDirectory,
											);
										}}
										// Pass these props recursively here as well to get the updated values in the child component
										deleteMode={deleteMode}
										checkedPaths={checkedPaths}
										onToggleChecked={onToggleChecked}
										onDeleteRequest={onDeleteRequest}
										onCancelDeleteMode={onCancelDeleteMode}
										deleteRootPath={deleteRootPath}
										deletablePaths={deletablePaths}
										// Duplicate props recursively
										duplicateMode={duplicateMode}
										onDuplicateRequest={onDuplicateRequest}
										onCancelDuplicateMode={
											onCancelDuplicateMode
										}
										duplicateRootPath={duplicateRootPath}
										duplicatablePaths={duplicatablePaths}
										onDuplicateClickFunc={
											onDuplicateClickFunc
										}
										onMakeMCPClick={(e, path) => {
											onMakeMCPClick(e, path);
										}}
										onMCPEditClick={(e, path) => {
											onMCPEditClick(e, path);
										}}
									/>
								);
							})
						: null}
				</>
			) : null}

			{/* Directory delete/duplicate buttons - only for directories */}
			{deleteMode &&
				checkedPaths.size > 0 &&
				((deleteRootPath === path && isDirectory) ||
					(checkedPaths.has(path) &&
						!isDirectory &&
						!deleteRootPath)) && (
					<>
						<hr style={{ margin: 0, padding: 0 }} />
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								alignItems: "center",
								alignSelf: "stretch",
								gap: "16px",
								padding: "8px 16px",
							}}
						>
							<Button
								onClick={onCancelDeleteMode}
								variant="text"
								title="Cancel"
								data-testid="cancel-delete-button"
							>
								Cancel
							</Button>
							<Button
								onClick={(e) =>
									onTrashClick(e, Array.from(checkedPaths))
								}
								variant="contained"
								color={"error"}
								title="Delete"
								data-testid="delete-button"
							>
								Delete
							</Button>
						</div>
					</>
				)}

			{duplicateMode &&
				checkedPaths.size > 0 &&
				((duplicateRootPath === path && isDirectory) ||
					(checkedPaths.has(path) &&
						!isDirectory &&
						!duplicateRootPath)) && (
					<>
						<hr style={{ margin: 0, padding: 0 }} />
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								alignItems: "center",
								alignSelf: "stretch",
								gap: "16px",
								padding: "8px 16px",
							}}
						>
							<Button
								onClick={onCancelDuplicateMode}
								variant="text"
								title="Cancel"
								data-testid="cancel-duplicate-button"
							>
								Cancel
							</Button>
							<Button
								onClick={() =>
									onDuplicateClickFunc(
										checkedPaths,
										duplicateRootPath,
									)
								}
								variant="contained"
								title="Duplicate"
								data-testid="duplicate-button"
							>
								Duplicate
							</Button>
						</div>
					</>
				)}
		</StyledNode>
	);
});
