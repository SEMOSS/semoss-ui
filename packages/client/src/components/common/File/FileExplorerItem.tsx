import {
	DeleteOutline,
	DescriptionOutlined,
	EditOutlined,
	SmartToyOutlined,
	TopicOutlined,
} from "@mui/icons-material";
import { useCallback, useState } from "react";
import {
	Box,
	CircularProgress,
	Icon,
	IconButton,
	styled,
	TreeView,
	Typography,
} from "@semoss/ui";
import { usePixel } from "@/hooks";
import { MCP_FILE_NAMES, MCP_JSON_FILE_NAMES } from "@/pages/app/app.constants";

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
	type: "app" | "insight" | "engine";

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
		path: string,
	) => void;

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

export const FileExplorerItem = (props: FileExplorerItemProps) => {
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
		onMakeMCPClick = () => null,
		onMCPEditClick = () => null,
	} = props;
	const [isHovered, setIsHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const isOpen = expanded.indexOf(path) > -1;
	const getAssets = usePixel<
		{
			lastModified: string;
			name: string;
			path: string;
			type: "directory" | "file";
		}[]
	>(
		isDirectory && isOpen
			? type === "app"
				? `BrowseAsset(filePath=["${path}"], space=["${space}"]);`
				: `BrowseEngineAssets(filePath=["${path.split("assets/")[1]}"], engine=["${space}"]);`
			: "",
	);

	const nodeRef = useCallback((ele) => {
		ele?.addEventListener("focusin", (e) => {
			e.stopImmediatePropagation();
		});
	}, []);

	const makeMCPCandidate =
		MCP_FILE_NAMES.some(
			(f) => path.includes(f) && path.split("/").includes("py"),
		) && !isDirectory;
	const editMCPCandidate =
		MCP_JSON_FILE_NAMES.some(
			(f) => path.includes(f) && path.split("/").includes("mcp"),
		) && !isDirectory;

	return (
		<StyledNode
			ref={nodeRef}
			key={path}
			nodeId={path}
			title={name}
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
					<Icon color={"disabled"} fontSize="small">
						{isDirectory ? (
							<TopicOutlined fontSize="inherit" />
						) : (
							<DescriptionOutlined fontSize="inherit" />
						)}
					</Icon>
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
			{isDirectory ? (
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
										key={n.path}
										type={type}
										space={space}
										isDirectory={n.type === "directory"}
										name={n.name}
										path={n.path}
										lastModified={n.lastModified}
										expanded={expanded}
										selected={selected}
										onTrashClick={(e, path) => {
											onTrashClick(e, path);
										}}
										onDragStart={(e, path) => {
											onDragStart(e, path);
										}}
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
		</StyledNode>
	);
};
