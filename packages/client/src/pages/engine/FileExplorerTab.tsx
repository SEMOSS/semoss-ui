import {
	CreateNewFolderOutlined,
	FileUpload,
	NoteAddOutlined,
	RefreshOutlined,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
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
import { Panel } from "@/components/workspace/panels";

const EXPLORER_TYPE = "engine";

interface FileExplorerPanelProps {
	title: string;
	appId: string;
	insightId: string;
	setLoading: (loading: boolean) => void;
	openOverlay: (component: () => JSX.Element) => void;
	closeOverlay: () => void;
	onFileSelect?: (path: string) => void;
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
	lineHeight: "150%",
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

export const FileExplorerTab = (props: FileExplorerPanelProps) => {
	const {
		title,
		appId,
		insightId,
		setLoading,
		openOverlay,
		closeOverlay,
		onFileSelect,
	} = props;

	const notification = useNotification();

	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [fileUploadPath, setFileUploadPath] = useState<string>("");
	const [counter, setCounter] = useState(0);
	const [deselectCounter, setDeselectCounter] = useState(0);
	const [mcpOverlayOpen, setMCPOverlayOpen] = useState(false);
	const [mcpTools, setMCPTools] = useState<Record<string, unknown>>({
		tools: [],
		_meta: {},
	});
	const [currentFilePath, setCurrentFilePath] = useState("");

	useEffect(() => {
		let path = "app_root/version/assets/";

		if (selectedPath) {
			if (selectedPath.slice(-1) === "/") {
				path = selectedPath;
			} else {
				const pathParts = selectedPath.split("/");
				pathParts.pop();
				path = pathParts.join("/");
				
				if (path && path.slice(-1) !== "/") {
					path = path + "/";
				}
				
				if (!path) {
					path = "app_root/version/assets/";
				}
			}
		}

		setFileUploadPath(path);
	}, [selectedPath]);

	const refreshFiles = () => {
		setCounter(counter + 1);
	};

	const handleToggleExpand = (path: string) => {
		setExpandedPaths((prev) =>
			prev.includes(path)
				? prev.filter((p) => p !== path)
				: [...prev, path],
		);
	};

	const handleOpenAddFile = () => {
		openOverlay(() => (
			<AddFileOverlay
				type={EXPLORER_TYPE}
				space={appId}
				onClose={(success, uploadPath) => {
					if (success) {
						refreshFiles();
					}
					closeOverlay();
				}}
				uploadPath={fileUploadPath}
			/>
		));
	};

	const handleOpenCreateFile = (mode: "directory" | "file") => {
		openOverlay(() => (
			<CreateFileOverlay
				type={EXPLORER_TYPE}
				space={appId}
				onClose={(success, uploadPath) => {
					if (success) {
						refreshFiles();
					}
					closeOverlay();
				}}
				uploadPath={fileUploadPath}
				mode={mode}
			/>
		));
	};

	const handleOnSelect = (path: string) => {
		if (!path || (selectedPath === path && path.slice(-1) === "/")) {
			setSelectedPath("");
			setDeselectCounter((prev) => prev + 1);
			onFileSelect?.("");
			return;
		}

		setSelectedPath(path);
		onFileSelect?.(path);
	};

	const handleOnTrashClick = (fileDeletePath: string) => {
		openOverlay(() => (
			<DeleteFileOverlay
				type={EXPLORER_TYPE}
				space={appId}
				onClose={(success) => {
					if (success) {
						refreshFiles();
					}
					closeOverlay();
				}}
				fileDeletePath={fileDeletePath}
			/>
		));
	};

	const handleMakeMCPClick = async (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => {
		setLoading(true);
		try {
			const { errors, pixelReturn } = await runPixel(
				`MakePythonMCP(project="${appId}")`,
			);
			setLoading(false);

			if (errors?.length) {
				notification.add({
					message: errors[0],
					color: "error",
				});
				return;
			}

			refreshFiles();

			if (pixelReturn[0].output) {
				notification.add({
					message: "Successfully generated MCP tools",
					color: "success",
				});
			}

			if (!pixelReturn?.[0]?.output) {
				throw new Error("Invalid response from pixel call");
			}
		} catch (e) {
			setLoading(false);
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
		setLoading(true);
		try {
			const { errors, pixelReturn } = await runPixel(
				`GetAsset(filePath=["${path}"], space=["${appId}"]);`,
			);
			setLoading(false);

			if (errors?.length) {
				throw new Error(errors[0]);
			}
			const output = JSON.parse(pixelReturn[0]?.output as string);
			setMCPTools(output);
			setCurrentFilePath(path);
			setMCPOverlayOpen(true);
		} catch (e) {
			setLoading(false);
			notification.add({
				message: e.message,
				color: "error",
			});
		}
	};

	const handleMCPEditSave = async (finalTools: Record<string, unknown>[]) => {
		try {
			setLoading(true);
			let pixel = "";
			const tools = { ...mcpTools, tools: finalTools };
			if (mcpTools) {
				pixel = `SaveAsset(fileName=["${currentFilePath}"], content=["<encode>${JSON.stringify(tools, null, 2)}</encode>"], space=["${appId}"]);CommitAsset(filePath=["${currentFilePath}"], comment=["Save from editor"], space=["${appId}"])`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to get file");
			}

			const { errors, pixelReturn } = await runPixel(pixel, insightId);

			if (pixelReturn[0].output) {
				notification.add({
					message: "Successfully saved MCP tools",
					color: "success",
				});
			}

			for (const e of errors) {
				throw new Error(e);
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			setLoading(false);
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
								<Tooltip title={`Refresh files`}>
									<IconButton
										size={"small"}
										color={"default"}
										onClick={(e) => {
											e.stopPropagation();
											refreshFiles();
										}}
									>
										<RefreshOutlined fontSize="inherit" />
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
					key={`${counter}-${deselectCounter}`}
					type={EXPLORER_TYPE}
					space={appId}
					insightId={insightId}
					onSelect={(path) => {
						handleOnSelect(path);
					}}
					onTrashClick={(_e, path) => {
						handleOnTrashClick(path);
					}}
					onDragStart={() => {}}
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
