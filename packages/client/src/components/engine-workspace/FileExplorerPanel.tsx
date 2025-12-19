import { FilePlus, FolderPlus, RefreshCw, Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useNotification } from "@semoss/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import {
	AddFileOverlay,
	CreateFileOverlay,
	DeleteFileOverlay,
	FileExplorer,
} from "@/components/common";
import { MCP_JSON_FILE_NAMES } from "@/pages/app/app.constants";
import { Panel } from "./Panel";

const EXPLORER_TYPE = "engine";

interface FileExplorerPanelProps {
	title: string;
	engineId: string;
	insightId: string;
	setLoading: (loading: boolean) => void;
	openOverlay: (component: () => JSX.Element) => void;
	closeOverlay: () => void;
	onFileSelect?: (path: string) => void;
	onFileDelete?: (path: string) => void;
	onAddMCPEditorTab?: (json: unknown, path: string) => void;
}

const ASSETS_ROOT = "/app_root/version/assets/";

export const FileExplorerPanel: React.FC<FileExplorerPanelProps> = (props) => {
	const {
		title,
		engineId,
		insightId,
		openOverlay,
		closeOverlay,
		onFileSelect,
		onFileDelete = () => null,
		onAddMCPEditorTab,
		setLoading,
	} = props;
	const notification = useNotification();
	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [fileUploadPath, setFileUploadPath] = useState<string>("");
	const [counter, setCounter] = useState(0);
	const [deselectCounter, setDeselectCounter] = useState(0);

	useEffect(() => {
		let path = `${ASSETS_ROOT}`;

		if (selectedPath) {
			if (selectedPath.slice(-1) === "/") {
				path = selectedPath;
			} else {
				const parts = selectedPath.split("/");
				parts.pop();
				path = parts.join("/");
				if (path && !path.endsWith("/")) path = path + "/";
			}
		}

		setFileUploadPath(path);
	}, [selectedPath]);

	const refreshFiles = useCallback(() => setCounter((c) => c + 1), []);

	const handleToggleExpand = (path: string) =>
		setExpandedPaths((prev) =>
			prev.includes(path)
				? prev.filter((p) => p !== path)
				: [...prev, path],
		);

	const handleOpenAddFile = () => {
		openOverlay(() => (
			<AddFileOverlay
				type={EXPLORER_TYPE}
				space={engineId}
				onClose={(success, uploadPath) => {
					if (success) {
						refreshFiles();
						if (uploadPath) {
							setSelectedPath(uploadPath);
							onFileSelect?.(uploadPath);
						}
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
				space={engineId}
				onClose={(success, uploadPath) => {
					if (success) {
						refreshFiles();
						if (uploadPath && mode === "file") {
							setSelectedPath(uploadPath);
							onFileSelect?.(uploadPath);
						}
					}
					closeOverlay();
				}}
				uploadPath={fileUploadPath}
				mode={mode}
			/>
		));
	};

	const handleOnSelect = (path: string) => {
	if (!path) {
		setSelectedPath("");
		setDeselectCounter((prev) => prev + 1);
		return;
	}
	if (path.slice(-1) === "/") {
		if (selectedPath === path) {
			setSelectedPath("");
			setDeselectCounter((prev) => prev + 1);
			return;
		}

		setSelectedPath(path);
		return;
	}
	setSelectedPath(path);
	onFileSelect?.(path);
};

	const handleOnTrashClick = (fileDeletePath: string) => {
		openOverlay(() => (
			<DeleteFileOverlay
				type={EXPLORER_TYPE}
				space={engineId}
				fileDeletePath={fileDeletePath}
				onClose={(success) => {
					if (success) {
						onFileDelete?.(fileDeletePath);
						refreshFiles();

						const isFolder = fileDeletePath.endsWith("/");
						const folderPath = isFolder
							? fileDeletePath
							: `${fileDeletePath}/`;

						if (
							selectedPath.startsWith(folderPath) ||
							fileUploadPath.startsWith(folderPath)
						) {
							const parts = fileDeletePath
								.replace(/\/$/, "")
								.split("/");
							parts.pop();
							const parentPath =
								parts.length > 0
									? parts.join("/") + "/"
									: ASSETS_ROOT;
							setSelectedPath(parentPath);
						}
					}
					closeOverlay();
				}}
			/>
		));
	};

	const handleMakeMCPClick = async (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => {
		event?.stopPropagation?.();
		setLoading(true);

		try {
			const { errors: genErrors, pixelReturn } = await runPixel(
				`MakePythonMCP(project="${engineId}")`,
				insightId,
			);

			if (genErrors?.length) {
				notification.add({
					message: String(genErrors[0]),
					color: "error",
				});
				return;
			}

			if (!pixelReturn?.[0]?.output) {
				throw new Error("No output from MCP generation pixel");
			}
			const sourceFileExtension = path.split(".")[1];
			const targetFileName = MCP_JSON_FILE_NAMES.find((fileName) =>
				fileName.includes(sourceFileExtension),
			);
			if (!targetFileName) {
				throw new Error("Could not find target file");
			}

			refreshFiles?.();

			const targetFilePath = `mcp/${targetFileName}`;
			onAddMCPEditorTab?.(pixelReturn[0].output, targetFilePath);

			notification.add({
				message: "Successfully generated MCP tools",
				color: "success",
			});
		} catch (err) {
			notification.add({
				message: (err as Error)?.message ?? String(err),
				color: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleMCPEditClick = async (
		_e: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => {
		setLoading(true);
		try {
			const parts = path.split("assets/");
			const filePath = parts.length > 1 ? parts[1] : path;

			const { errors, pixelReturn } = await runPixel(
				`GetEngineAssets(filePath=["${filePath}"], engine=["${engineId}"]);`,
			);

			if (errors?.length) {
				throw new Error(errors[0]);
			}

			const output = pixelReturn?.[0]?.output;
			onAddMCPEditorTab?.(output, filePath);
		} catch (e) {
			notification.add({
				message: (e as Error)?.message ?? String(e),
				color: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Panel
			actions={
				<div className="notebook-variables-menu flex w-full flex-col gap-0">
					<div className="mt-1 mb-2 w-fit rounded-2xl bg-primary/10 px-4">
						<span className="my-2 block font-['Inter'] font-normal text-[13px] text-primary leading-[18px] tracking-[0.16px]">
							{title}
						</span>
					</div>
					<div className="flex flex-row items-center justify-between px-4 pt-4">
						<span className="font-['Inter'] font-normal text-base text-foreground leading-[150%] tracking-[0.15px]">
							Files
						</span>
						<div className="flex flex-row gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
										onClick={(e) => {
											e.stopPropagation();
											refreshFiles();
										}}
									>
										<RefreshCw className="h-4 w-4" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Refresh files</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
										onClick={(e) => {
											e.stopPropagation();
											handleOpenAddFile();
										}}
									>
										<Upload className="h-4 w-4" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Upload file(s)</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
										onClick={(e) => {
											e.stopPropagation();
											handleOpenCreateFile("file");
										}}
									>
										<FilePlus className="h-4 w-4" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Create new file</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
										onClick={(e) => {
											e.stopPropagation();
											handleOpenCreateFile("directory");
										}}
									>
										<FolderPlus className="h-4 w-4" />
									</button>
								</TooltipTrigger>
								<TooltipContent>
									Create new folder
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
			}
		>
			<FileExplorer
				key={`${counter}-${deselectCounter}`}
				type={EXPLORER_TYPE}
				space={engineId}
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
	);
};

export default FileExplorerPanel;
