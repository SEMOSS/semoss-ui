import {
	ChevronDownIcon,
	CircleHelpIcon,
	FilePlus2Icon,
	RefreshCwIcon,
	SearchIcon,
} from "lucide-react";
import {
	type CSSProperties,
	type KeyboardEvent as ReactKeyboardEvent,
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import { Env } from "@semoss/sdk";
import { download, useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	ScrollBar,
	Separator,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeView,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import type { FileItem, FileMode } from "./file.types";
import {
	canMoveItemToDirectory,
	ensureDirectoryPath,
	getFileExplorerTestIdSegment,
	getFileOperationErrorMessage,
	getItemName,
	getParentPath,
	isExplorerDrag,
	isPointerOutsideElement,
	mapStorageEntriesToFileItems,
	normalizeAssetPath,
	parseExplorerDragItems,
} from "./file-explorer.utils";
import { FileExplorerContextMenu } from "./file-explorer-context-menu";
import { FileExplorerItem } from "./file-explorer-item";
import { type NewFileAction, NewFileOverlay } from "./new-file-overlay";

interface ClipboardState {
	items: FileItem[];
	action: "copy" | "cut";
}

export interface FileExplorerMovedItem {
	item: FileItem;
	oldPath: string;
	newPath: string;
}

interface ContextMenuState {
	x: number;
	y: number;
	item: FileItem | null;
	targetPath: string;
	secondaryActions?: FileExplorerSecondaryAction[];
}

type FileExplorerSecondaryAction = {
	name: string;
	action: (item: FileItem) => Promise<void>;
};

interface FileExplorerProps {
	/** Mode of file editor */
	mode: FileMode;

	/**
	 * Actions at the end of the header
	 */
	headerActions?: React.ReactNode;

	/**
	 * Callback when an item is selected
	 */
	onItemSelect?: (item: FileItem) => void;

	/**
	 * Override for the file item component
	 */
	ItemComponent?: typeof FileExplorerItem;

	/**
	 * Initial directory path to open to (defaults to "/")
	 */
	initialPath?: string;

	/**
	 * Callback after items are moved so consumers can update open path refs
	 */
	onItemsMoved?: (items: FileExplorerMovedItem[]) => void;

	/**
	 * Callback after items are deleted so consumers can close stale path refs
	 */
	onItemsDeleted?: (items: FileItem[]) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
	mode,
	headerActions = null,
	onItemSelect = () => null,
	ItemComponent = FileExplorerItem,
	initialPath,
	onItemsMoved,
	onItemsDeleted,
}) => {
	const insight = useInsight();

	const [path, setPath] = useState<string>(
		initialPath ? initialPath.replace(/\/$/, "") || "/" : "/",
	);
	const [search, setSearch] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [searchType, setSearchType] = useState<string>("all");

	const [isDragging, setIsDragging] = useState(false);
	const [moveDropCount, setMoveDropCount] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [activeDragItems, setActiveDragItems] = useState<FileItem[]>([]);
	const [activeDropTargetPath, setActiveDropTargetPath] = useState<
		string | null
	>(null);

	const [dateColWidth, setDateColWidth] = useState(100);
	const dividerDragRef = useRef<{
		startX: number;
		startWidth: number;
	} | null>(null);

	const handleDividerMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		dividerDragRef.current = {
			startX: e.clientX,
			startWidth: dateColWidth,
		};
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";

		const onMouseMove = (ev: globalThis.MouseEvent) => {
			const currentDrag = dividerDragRef.current;
			if (!currentDrag) return;
			const delta = ev.clientX - currentDrag.startX;
			setDateColWidth((_) =>
				Math.max(100, Math.min(280, currentDrag.startWidth - delta)),
			);
		};

		const onMouseUp = () => {
			dividerDragRef.current = null;
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	const [isNewFile, setIsNewFile] = useState(false);
	const [newFilePath, setNewFilePath] = useState<string>(path);
	const [newFileAction, setNewFileAction] = useState<NewFileAction>("upload");
	const [newFileOverlayKey, setNewFileOverlayKey] = useState(0);
	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
		null,
	);
	const [contextTargetPath, setContextTargetPath] = useState<string | null>(
		null,
	);
	const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
	const [selectedItems, setSelectedItems] = useState<Map<string, FileItem>>(
		() => new Map(),
	);
	const visibleItemsRef = useRef<Map<string, FileItem>>(new Map());
	const directoryRefreshRef = useRef<Map<string, () => void>>(new Map());

	const debouncedSearch = useDebouncedValue(search);
	const canMutateFiles = mode.type !== "STORAGE";

	let getFilesPixel = "";
	if (mode.type === "APP") {
		if (debouncedSearch) {
			getFilesPixel = `SearchAppAssets(filePath=["${searchType === "all" ? "" : path}"], project=["${mode.app}"], search=["${debouncedSearch}"]);`;
		} else {
			getFilesPixel = `BrowseAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
		}
	} else if (mode.type === "ENGINE") {
		if (debouncedSearch) {
			getFilesPixel = `SearchEngineAssets(filePath=["${searchType === "all" ? "" : path}"], engine=["${mode.engine}"], search=["${debouncedSearch}"]);`;
		} else {
			getFilesPixel = `BrowseEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
		}
	} else if (mode.type === "STORAGE") {
		getFilesPixel = `ListStoragePathDetails(storage=["${mode.storage}"], storagePath=["${path}"]);`;
	} else if (mode.type === "INSIGHT" && insight.insightId) {
		if (debouncedSearch) {
			getFilesPixel = `SearchInsightAssets(filePath=["${searchType === "all" ? "" : path}"], search=["${debouncedSearch}"]);`;
		} else {
			getFilesPixel = `BrowseInsightAssets(filePath=["${path}"]);`;
		}
	}

	const getFiles = usePixel<unknown[]>(
		getFilesPixel,
		{
			data: [],
		},
		insight.insightId,
	);

	const files = useMemo(() => {
		const mappedFiles =
			mode.type === "STORAGE"
				? mapStorageEntriesToFileItems(getFiles.data)
				: (getFiles.data as FileItem[]);

		if (mode.type !== "STORAGE" || !debouncedSearch) {
			return mappedFiles;
		}

		const normalizedSearch = debouncedSearch.toLowerCase();
		return mappedFiles.filter((item) =>
			item.name.toLowerCase().includes(normalizedSearch),
		);
	}, [mode.type, getFiles.data, debouncedSearch]);

	/**
	 * Upload a file to the path
	 */
	const uploadFile = async (files: File[]) => {
		try {
			if (!canMutateFiles) {
				return;
			}

			setIsUploading(true);

			// upload the files
			if (mode.type === "APP") {
				await insight.actions.uploadApp(mode.app, path, files);
			} else if (mode.type === "ENGINE") {
				await insight.actions.uploadEngine(mode.engine, path, files);
			} else if (mode.type === "INSIGHT") {
				await insight.actions.uploadInsight(path, files);
			}

			// refresh the files
			getFiles.refresh();
			toast.success(
				files.length > 1
					? "Successfully uploaded files"
					: "Successfully uploaded file",
			);
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage("Failed to upload file", e),
			);
			console.error(e);
		} finally {
			setIsUploading(false);
		}
	};

	// this converts the path into crumbs based on the folder. The top level is always '/'.
	const crumbs = path
		.split("/")
		.filter((v) => v)
		.reverse()
		.concat("/");

	// track if we should show search
	const showSearch =
		mode.type !== "STORAGE" && (isSearchActive || Boolean(debouncedSearch));

	const clearContextState = () => {
		setContextMenu(null);
		setContextTargetPath(null);
	};

	const clearSelectedItems = () => {
		setSelectedItems(new Map());
	};

	const handleExplorerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
		if (e.key !== "Escape") return;
		clearContextState();
		clearSelectedItems();
	};

	const handleItemRegister = useCallback(
		(item: FileItem, isVisible: boolean) => {
			if (isVisible) {
				visibleItemsRef.current.set(item.path, item);
			} else {
				visibleItemsRef.current.delete(item.path);
			}
		},
		[],
	);

	const handleDirectoryRefreshRegister = useCallback(
		(directoryPath: string, refresh: () => void, isRegistered: boolean) => {
			const normalizedPath = normalizeAssetPath(directoryPath);
			if (isRegistered) {
				directoryRefreshRef.current.set(normalizedPath, refresh);
			} else {
				directoryRefreshRef.current.delete(normalizedPath);
			}
		},
		[],
	);

	const refreshDirectories = (directoryPaths: string[]) => {
		if (debouncedSearch) {
			getFiles.refresh();
			return;
		}

		const currentPath = normalizeAssetPath(path);
		const pathsToRefresh = new Set(
			directoryPaths.map((directoryPath) =>
				normalizeAssetPath(directoryPath),
			),
		);

		pathsToRefresh.forEach((directoryPath) => {
			if (directoryPath === currentPath) {
				getFiles.refresh();
				return;
			}

			directoryRefreshRef.current.get(directoryPath)?.();
		});
	};

	const handleBulkSelectionToggle = (item: FileItem) => {
		setSelectedItems((prev) => {
			const next = new Map(prev);
			if (next.has(item.path)) {
				next.delete(item.path);
			} else {
				next.set(item.path, item);
			}
			return next;
		});
		clearContextState();
	};

	const handleSelectAllVisible = () => {
		setSelectedItems(new Map(visibleItemsRef.current));
		clearContextState();
	};

	const handleExplorerDragStateChange = (
		itemCount: number,
		items: FileItem[] = activeDragItems,
	) => {
		setMoveDropCount(itemCount);
		setActiveDragItems(items);
	};

	const getDragItems = (item: FileItem) => {
		if (selectedItems.has(item.path)) {
			return Array.from(selectedItems.values());
		}

		return [item];
	};

	const buildRenamePixel = (oldPath: string, newPath: string): string => {
		if (mode.type === "APP") {
			return `RenameAppAsset(project=["${mode.app}"], filePath=["${oldPath}"], newValue=["${newPath}"]);`;
		}
		if (mode.type === "ENGINE") {
			return `RenameEngineAsset(engine=["${mode.engine}"], filePath=["${oldPath}"], newValue=["${newPath}"]);`;
		}
		if (mode.type === "INSIGHT") {
			return `RenameInsightAsset(filePath=["${oldPath}"], newValue=["${newPath}"]);`;
		}
		return "";
	};

	const buildCopyPixel = (oldPath: string, newPath: string): string => {
		if (mode.type === "APP") {
			return `CopyAppAsset(project="${mode.app}", filePath="${oldPath}", newValue="${newPath}");`;
		}
		if (mode.type === "ENGINE") {
			return `CopyEngineAsset(engine="${mode.engine}", filePath="${oldPath}", newValue="${newPath}");`;
		}
		if (mode.type === "INSIGHT") {
			return `CopyInsightAsset(filePath="${oldPath}", newValue="${newPath}");`;
		}
		return "";
	};

	const buildDeletePixel = (itemPath: string): string => {
		if (mode.type === "APP") {
			return `DeleteAppAssets(project=["${mode.app}"], filePath=["${itemPath}"]);`;
		}
		if (mode.type === "ENGINE") {
			return `DeleteEngineAssets(engine=["${mode.engine}"], filePath=["${itemPath}"]);`;
		}
		if (mode.type === "INSIGHT") {
			return `DeleteInsightAssets(filePath=["${itemPath}"]);`;
		}
		return "";
	};

	const handleContextMenuOpen = (
		e: React.MouseEvent,
		item: FileItem | null,
		targetPath: string,
		secondaryActions: FileExplorerSecondaryAction[] = [],
	) => {
		e.preventDefault();
		e.stopPropagation();
		if (item && !selectedItems.has(item.path)) {
			clearSelectedItems();
		}
		setContextTargetPath(item?.path ?? null);
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			item,
			targetPath,
			secondaryActions,
		});
	};

	const openNewFileOverlay = (
		targetPath: string,
		initialAction: NewFileAction = "upload",
	) => {
		setNewFilePath(ensureDirectoryPath(targetPath));
		setNewFileAction(initialAction);
		setNewFileOverlayKey((key) => key + 1);
		setIsNewFile(true);
	};

	const handleMoveItems = async (
		items: FileItem[],
		targetDirectory: string,
	): Promise<boolean> => {
		try {
			const normalizedTarget = ensureDirectoryPath(targetDirectory);
			const affectedDirectories = new Set<string>([normalizedTarget]);
			const movedItems: FileExplorerMovedItem[] = [];

			for (const item of items) {
				const name = getItemName(item);
				const newPath = `${normalizedTarget}${name}`;
				affectedDirectories.add(getParentPath(item.path));

				if (!canMoveItemToDirectory(item, normalizedTarget)) {
					continue;
				}

				const pixel = buildRenamePixel(item.path, newPath);

				if (pixel) {
					await insight.actions.run(pixel);
					movedItems.push({
						item,
						oldPath: item.path,
						newPath,
					});
				}
			}
			clearSelectedItems();
			clearContextState();
			if (movedItems.length > 0) {
				onItemsMoved?.(movedItems);
				toast.success(
					movedItems.length > 1
						? "Successfully moved items"
						: "Successfully moved item",
				);
			}
			refreshDirectories(Array.from(affectedDirectories));
			return true;
		} catch (e) {
			toast.error(getFileOperationErrorMessage("Failed to move item", e));
			console.error(e);
			return false;
		}
	};

	const handleCopyItems = async (
		items: FileItem[],
		targetDirectory: string,
	): Promise<boolean> => {
		try {
			const normalizedTarget = ensureDirectoryPath(targetDirectory);
			const affectedDirectories = new Set<string>([normalizedTarget]);
			const copiedItems: FileItem[] = [];
			const failedItems: string[] = [];

			for (const item of items) {
				try {
					const name = getItemName(item);
					const newPath = `${normalizedTarget}${name}`;
					const pixel = buildCopyPixel(item.path, newPath);
					if (!pixel) {
						continue;
					}

					await insight.actions.run(pixel);
					copiedItems.push(item);
				} catch (e) {
					failedItems.push(
						getFileOperationErrorMessage(item.name, e),
					);
					console.error(e);
				}
			}

			clearSelectedItems();
			clearContextState();
			refreshDirectories(Array.from(affectedDirectories));

			if (copiedItems.length > 0) {
				toast.success(
					copiedItems.length > 1
						? "Successfully copied items"
						: "Successfully copied item",
				);
			}

			if (failedItems.length > 0) {
				toast.error(`Failed to copy: ${failedItems.join(", ")}`);
			}

			return copiedItems.length > 0;
		} catch (e) {
			toast.error(getFileOperationErrorMessage("Failed to copy item", e));
			console.error(e);
			return false;
		}
	};

	const handlePaste = async (targetDirectory: string) => {
		if (!clipboard) return;

		if (clipboard.action === "copy") {
			const success = await handleCopyItems(
				clipboard.items,
				targetDirectory,
			);
			if (success) {
				setClipboard(null);
			}
			return;
		}

		const success = await handleMoveItems(clipboard.items, targetDirectory);
		if (success) {
			setClipboard(null);
		}
	};

	const handleDeleteItems = async (items: FileItem[]) => {
		try {
			const affectedDirectories = new Set<string>();
			const deletedItems: FileItem[] = [];
			const failedItems: string[] = [];
			const dedupedItems = items.filter(
				(item, index, allItems) =>
					allItems.findIndex(
						(candidate) => candidate.path === item.path,
					) === index,
			);
			const sortedItems = dedupedItems.sort((a, b) => {
				if (a.type === "directory" && b.type !== "directory") {
					return 1;
				}
				if (a.type !== "directory" && b.type === "directory") {
					return -1;
				}
				return b.path.length - a.path.length;
			});

			for (const item of sortedItems) {
				try {
					const pixel = buildDeletePixel(item.path);
					if (!pixel) {
						continue;
					}

					await insight.actions.run(pixel);
					affectedDirectories.add(getParentPath(item.path));
					deletedItems.push(item);
				} catch (e) {
					failedItems.push(
						getFileOperationErrorMessage(item.name, e),
					);
					console.error(e);
				}
			}
			clearSelectedItems();
			clearContextState();
			if (deletedItems.length > 0) {
				onItemsDeleted?.(deletedItems);
				toast.success(
					deletedItems.length > 1
						? "Successfully deleted items"
						: "Successfully deleted item",
				);
			}
			refreshDirectories(Array.from(affectedDirectories));

			if (failedItems.length > 0) {
				toast.error(`Failed to delete: ${failedItems.join(", ")}`);
			}
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage("Failed to delete item", e),
			);
			console.error(e);
		}
	};

	const handleDelete = async (item: FileItem) => {
		await handleDeleteItems([item]);
	};

	const copyTextToClipboard = async (value: string) => {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return;
		}

		const textArea = document.createElement("textarea");
		textArea.value = value;
		textArea.style.position = "fixed";
		textArea.style.opacity = "0";
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("copy");
		document.body.removeChild(textArea);
	};

	const handleCopyPath = async (item: FileItem) => {
		try {
			await copyTextToClipboard(item.path);
			toast.success("Copied path");
		} catch (e) {
			toast.error(getFileOperationErrorMessage("Failed to copy path", e));
			console.error(e);
		}
	};

	const buildDownloadPixel = (itemPath: string): string => {
		if (mode.type === "APP") {
			return `DownloadAppAsset(project=["${mode.app}"], filePath=["${itemPath}"]);`;
		}
		if (mode.type === "ENGINE") {
			return `DownloadEngineAsset(engine=["${mode.engine}"], filePath=["${itemPath}"]);`;
		}
		if (mode.type === "INSIGHT") {
			return `DownloadInsightAsset(filePath=["${itemPath}"]);`;
		}
		return "";
	};

	const getDownloadFileKey = async (item: FileItem) => {
		const pixel = buildDownloadPixel(item.path);
		if (!pixel) return "";

		const { pixelReturn } = await insight.actions.run<[string]>(pixel);
		return pixelReturn?.[0]?.output || "";
	};

	const getDownloadFileName = (item: FileItem) => {
		if (item.type !== "directory") {
			return item.name;
		}

		const directoryName = getItemName(item).replace(/\.zip$/i, "");
		return `${directoryName}.zip`;
	};

	const downloadFileKeyAsBlob = async (fileKey: string, fileName: string) => {
		const url = `${Env.MODULE}/api/engine/downloadFile?insightId=${insight.insightId}&fileKey=${encodeURIComponent(fileKey)}`;
		const response = await fetch(url, { credentials: "include" });
		if (!response.ok) {
			throw new Error(`Failed to download ${fileName}`);
		}

		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(objectUrl);
	};

	const handleDownload = async (item: FileItem) => {
		try {
			const fileKey = await getDownloadFileKey(item);
			if (!fileKey) {
				return;
			}

			if (item.type === "directory") {
				await downloadFileKeyAsBlob(fileKey, getDownloadFileName(item));
			} else {
				await download(insight.insightId, fileKey);
			}
			toast.success("Successfully downloaded item");
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage("Failed to download item", e),
			);
			console.error(e);
		}
	};

	const handleDownloadItems = async (items: FileItem[]) => {
		const failedItems: string[] = [];
		let downloadedCount = 0;
		for (const item of items) {
			try {
				const fileKey = await getDownloadFileKey(item);
				if (fileKey) {
					await downloadFileKeyAsBlob(
						fileKey,
						getDownloadFileName(item),
					);
					downloadedCount += 1;
				}
			} catch (e) {
				failedItems.push(getFileOperationErrorMessage(item.name, e));
				console.error(e);
			}
		}

		if (downloadedCount > 0) {
			toast.success(
				downloadedCount > 1
					? "Successfully downloaded items"
					: "Successfully downloaded item",
			);
		}

		if (failedItems.length > 0) {
			toast.error(`Failed to download: ${failedItems.join(", ")}`);
		}
	};

	const triggerRename = (item: FileItem) => {
		window.dispatchEvent(
			new CustomEvent("file-explorer:rename", {
				detail: { path: item.path },
			}),
		);
	};

	const moveDropLabel =
		moveDropCount > 1 ? `${moveDropCount} items` : "1 item";

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix accessibility issues
		<div
			data-testid="file-explorer"
			className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1"
			style={{ "--date-col-width": `${dateColWidth}px` } as CSSProperties}
			onDrop={(e) => {
				if (isExplorerDrag(e.dataTransfer)) {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(false);
					setMoveDropCount(0);
					setActiveDragItems([]);
					setActiveDropTargetPath(null);
					if (canMutateFiles) {
						handleMoveItems(
							activeDragItems.length > 0
								? activeDragItems
								: parseExplorerDragItems(e.dataTransfer),
							ensureDirectoryPath(path),
						);
					}
					return;
				}

				e.preventDefault();
				if (!canMutateFiles) {
					return;
				}

				// set the new files
				const files = Array.from(e.dataTransfer.files);
				uploadFile(files);

				// turn off dragging
				setIsDragging(false);
			}}
			onDragOver={(e) => {
				if (isExplorerDrag(e.dataTransfer)) {
					e.preventDefault();
					e.stopPropagation();
					setActiveDropTargetPath(null);
					const dragItems =
						activeDragItems.length > 0
							? activeDragItems
							: parseExplorerDragItems(e.dataTransfer);
					if (canMutateFiles) {
						e.dataTransfer.dropEffect = "move";
						setMoveDropCount(dragItems.length);
					}
					setIsDragging(false);
					return;
				}

				e.preventDefault();
				if (!canMutateFiles) {
					return;
				}

				// turn on dragging
				setIsDragging(true);
			}}
			onDragLeave={(e) => {
				if (
					!isPointerOutsideElement(
						e.currentTarget,
						e.clientX,
						e.clientY,
					)
				) {
					return;
				}

				if (isExplorerDrag(e.dataTransfer)) {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(false);
					setMoveDropCount(0);
					setActiveDragItems([]);
					setActiveDropTargetPath(null);
					return;
				}

				e.preventDefault();
				if (!canMutateFiles) {
					return;
				}

				// turn off dragging
				setIsDragging(false);
			}}
			onClick={() => {
				clearContextState();
				clearSelectedItems();
			}}
			onKeyDown={handleExplorerKeyDown}
			onContextMenu={(e) => {
				if (!canMutateFiles) return;
				handleContextMenuOpen(e, null, ensureDirectoryPath(path));
			}}
		>
			<div className="flex w-full flex-col gap-1.5 px-2">
				<div className="flex w-full flex-row items-center justify-between gap-1">
					<div
						className={`${showSearch ? "w-0" : "flex-1"} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									data-testid="file-explorer-refresh-button"
									variant="ghost"
									size="icon-sm"
									onClick={() => getFiles.refresh()}
								>
									<RefreshCwIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Refresh {path}</TooltipContent>
						</Tooltip>
						<DropdownMenu>
							<DropdownMenuTrigger
								data-testid="file-explorer-path-dropdown-trigger"
								className="flex flex-1 items-center gap-1.5"
								aria-label="Toggle menu"
								disabled={crumbs.length <= 1}
								title={path}
							>
								<div className="min-w-12 max-w-64 truncate text-left text-sm">
									{crumbs[0]}
								</div>
								{crumbs.length > 1 && (
									<ChevronDownIcon className="size-4 text-muted-foreground" />
								)}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								{crumbs.map((item, index) => {
									if (index === 0) {
										return null;
									}

									return (
										<DropdownMenuItem
											// biome-ignore lint/suspicious/noArrayIndexKey: Each item in a path may not be unique, only the last one
											key={index}
											data-testid={`file-explorer-path-dropdown-item-${index}`}
											onSelect={() => {
												// update the path
												const newPath = crumbs
													.slice(index)
													.reverse()
													.join("/");

												setExpandedPaths([]);
												setPath(newPath);
												setSearch("");
											}}
										>
											{item}
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{mode.type !== "STORAGE" && (
						<InputGroup
							className={`${showSearch ? "flex-1" : "w-32"} transition-all duration-300 ease-in-out`}
						>
							<InputGroupInput
								data-testid="file-explorer-search-input"
								type="search"
								placeholder="Search"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setExpandedPaths([]);
								}}
								onFocus={() => setIsSearchActive(true)}
								onBlur={() => setIsSearchActive(false)}
							/>
							<InputGroupAddon align="inline-end">
								<SearchIcon />
							</InputGroupAddon>
						</InputGroup>
					)}

					<div
						className={`${showSearch ? "w-0" : ""} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
					>
						{canMutateFiles && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										data-testid="file-explorer-new-button"
										variant="ghost"
										size="icon-sm"
										onClick={() =>
											openNewFileOverlay(
												path.endsWith("/")
													? path
													: `${path}/`,
											)
										}
									>
										<FilePlus2Icon className="size-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Create at {path}
								</TooltipContent>
							</Tooltip>
						)}
						{headerActions}
					</div>
				</div>
				{showSearch && (
					<div className="flex w-full flex-row items-center justify-between gap-1">
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							value={searchType}
							onValueChange={setSearchType}
						>
							<ToggleGroupItem
								data-testid="file-explorer-search-all-toggle"
								value="all"
								aria-label="Search all"
								title="Search all"
							>
								All
							</ToggleGroupItem>
							<ToggleGroupItem
								data-testid="file-explorer-search-current-toggle"
								value="current"
								aria-label="Search only current directory"
								title={`Search only in ${path}`}
							>
								Only &quot;{crumbs[0]}&quot;
							</ToggleGroupItem>
						</ToggleGroup>
					</div>
				)}
			</div>

			<Separator className="my-1" />

			<div className="relative flex min-h-0 flex-1 flex-col">
				{moveDropCount > 0 && (
					<div
						data-testid="file-explorer-root-drop-indicator"
						className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-md border border-primary/30 bg-background/95 px-3 py-2 text-foreground text-xs shadow-md"
					>
						Drop to move {moveDropLabel} into {path}
					</div>
				)}
				<div className="flex select-none items-center border-b px-2 pb-0.5 text-[11px] text-muted-foreground">
					<div className="flex min-w-[80px] flex-1 items-center gap-1 overflow-hidden">
						<span className="overflow-hidden truncate font-medium">
							Name
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									data-testid="file-explorer-bulk-shortcuts-button"
									variant="ghost"
									size="icon-sm"
									aria-label="Bulk selection shortcuts"
									className="shrink-0"
								>
									<CircleHelpIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								Ctrl/Cmd+click selects multiple items.
								Ctrl/Cmd+A selects all visible items.
							</TooltipContent>
						</Tooltip>
					</div>
					<div
						data-testid="file-explorer-date-column-resizer"
						role="slider"
						aria-orientation="vertical"
						aria-label="Resize date column"
						aria-valuemin={100}
						aria-valuemax={280}
						aria-valuenow={dateColWidth}
						tabIndex={0}
						className="group flex cursor-col-resize items-center self-stretch px-2 focus:outline-none"
						onMouseDown={handleDividerMouseDown}
						onKeyDown={(e) => {
							if (e.key === "ArrowLeft") {
								setDateColWidth((w) => Math.min(280, w + 8));
							} else if (e.key === "ArrowRight") {
								setDateColWidth((w) => Math.max(100, w - 8));
							}
						}}
					>
						<div className="h-full w-px bg-border transition-colors group-hover:bg-primary/70" />
					</div>
					<span
						style={{ width: dateColWidth }}
						className="overflow-hidden truncate px-2 text-right font-medium"
					>
						Date Modified
					</span>
				</div>

				<ScrollArea className="[&>div>div]:block! h-full min-h-0 w-full flex-1">
					{(getFiles.status === "LOADING" || isUploading) && (
						<div className="flex items-center justify-center py-16">
							<Spinner />
						</div>
					)}

					{getFiles.status === "ERROR" && (
						<div className="flex items-center justify-center py-4">
							<Muted className="text-destructive">
								{getFiles.error?.message ||
									"Failed to load files"}
							</Muted>
						</div>
					)}

					{getFiles.status === "SUCCESS" && !isUploading && (
						<TreeView<FileItem>
							data-testid="file-explorer-tree"
							className="w-full"
							expanded={expandedPaths}
							onExpandChange={(e) => setExpandedPaths(e)}
							onKeyDown={(e) => {
								if (
									(e.ctrlKey || e.metaKey) &&
									e.key.toLowerCase() === "a"
								) {
									e.preventDefault();
									handleSelectAllVisible();
								}
							}}
							onItemSelect={(item) => {
								clearSelectedItems();
								if (item.type === "directory") {
									setExpandedPaths((prev) =>
										prev.includes(item.path)
											? prev.filter(
													(p) => p !== item.path,
												)
											: [...prev, item.path],
									);
									return;
								}
								onItemSelect(item);
							}}
							onItemDoubleClick={(item) => {
								if (item.type === "directory") {
									setExpandedPaths((prev) => {
										const pathPrefix = `${item.path}/`;
										return prev.filter(
											(p) =>
												p === item.path ||
												p.startsWith(pathPrefix),
										);
									});
									setPath(item.path);
									setSearch("");
								}
							}}
						>
							{files.map((i) => (
								<ItemComponent
									key={i.path}
									data-testid={`file-explorer-item-${getFileExplorerTestIdSegment(i.path)}`}
									mode={mode}
									item={i}
									refresh={() => getFiles.refresh()}
									ItemComponent={ItemComponent}
									dateColWidth={dateColWidth}
									isBulkSelected={selectedItems.has(i.path)}
									isContextActive={
										contextTargetPath === i.path
									}
									isItemBulkSelected={(itemPath) =>
										selectedItems.has(itemPath)
									}
									isItemContextActive={(itemPath) =>
										contextTargetPath === itemPath
									}
									onItemRegister={handleItemRegister}
									onDirectoryRefreshRegister={
										handleDirectoryRefreshRegister
									}
									onBulkSelectionToggle={
										handleBulkSelectionToggle
									}
									onContextMenuOpen={(
										e,
										item,
										targetPath,
										secondaryActions,
									) =>
										handleContextMenuOpen(
											e,
											item,
											targetPath,
											secondaryActions,
										)
									}
									getDragItems={
										canMutateFiles
											? getDragItems
											: undefined
									}
									onMoveItems={
										canMutateFiles
											? handleMoveItems
											: undefined
									}
									activeDragItems={activeDragItems}
									activeDropTargetPath={activeDropTargetPath}
									onExplorerDragStateChange={
										canMutateFiles
											? handleExplorerDragStateChange
											: undefined
									}
									onExplorerDropTargetChange={
										canMutateFiles
											? setActiveDropTargetPath
											: undefined
									}
								/>
							))}
						</TreeView>
					)}
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>

			{canMutateFiles && isDragging && (
				<div
					data-testid="file-explorer-upload-drop-zone"
					className="absolute inset-0 flex items-center justify-center bg-accent/50 p-4 text-accent-foreground"
				>
					<Muted>Release to upload files to {path}</Muted>
				</div>
			)}

			{canMutateFiles && (
				<NewFileOverlay
					key={newFileOverlayKey}
					mode={mode}
					path={newFilePath}
					open={isNewFile}
					initialAction={newFileAction}
					onClose={(success) => {
						if (success) {
							refreshDirectories([newFilePath]);
						}

						setIsNewFile(false);
					}}
				/>
			)}

			{contextMenu && (
				<FileExplorerContextMenu
					state={contextMenu}
					clipboard={clipboard}
					selectedItems={Array.from(selectedItems.values())}
					canMutateFiles={canMutateFiles}
					onClose={clearContextState}
					onCopy={(item) =>
						setClipboard({ items: [item], action: "copy" })
					}
					onCut={(item) =>
						setClipboard({ items: [item], action: "cut" })
					}
					onCopyPath={handleCopyPath}
					onCopyItems={(items) =>
						setClipboard({ items, action: "copy" })
					}
					onCutItems={(items) =>
						setClipboard({ items, action: "cut" })
					}
					onPaste={handlePaste}
					onRename={triggerRename}
					onDelete={handleDelete}
					onDeleteItems={handleDeleteItems}
					onDownload={handleDownload}
					onDownloadItems={handleDownloadItems}
					onNew={openNewFileOverlay}
				/>
			)}
		</div>
	);
};
