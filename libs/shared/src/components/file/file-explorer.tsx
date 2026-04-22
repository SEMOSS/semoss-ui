import {
	ChevronDownIcon,
	CopyCheckIcon,
	FilePlus2Icon,
	MoveIcon,
	RefreshCwIcon,
	SearchIcon,
	TrashIcon,
} from "lucide-react";
import {
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import type { FileItem, FileMode, SelectionChangeCallback } from "./file.types";
import {
	isEditableElement,
	mapStorageEntriesToFileItems,
	normalizeFolderPath,
} from "./file-explorer.helpers";
import { FileExplorerItem } from "./file-explorer-item";
import { MoveFilesDialog } from "./move-files-dialog";
import { NewFileOverlay } from "./new-file-overlay";

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
	 * Enable multi-select with checkboxes
	 */
	enableMultiSelect?: boolean;

	/**
	 * Currently selected items (controlled)
	 */
	selectedItems?: FileItem[];

	/**
	 * Callback when selection changes
	 */
	onSelectionChange?: SelectionChangeCallback;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
	mode,
	headerActions = null,
	onItemSelect = () => null,
	ItemComponent = FileExplorerItem,
	initialPath,
	enableMultiSelect = false,
	selectedItems,
	onSelectionChange,
}) => {
	const insight = useInsight();

	const [path, setPath] = useState<string>(
		initialPath ? initialPath.replace(/\/$/, "") || "/" : "/",
	);
	const [search, setSearch] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [searchType, setSearchType] = useState<string>("all");

	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isSelectionMode, setIsSelectionMode] = useState(false);

	const [dateColWidth, setDateColWidth] = useState(100);
	const explorerRef = useRef<HTMLDivElement>(null);
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
			if (!dividerDragRef.current) return;
			const delta = ev.clientX - dividerDragRef.current.startX;
			setDateColWidth(
				Math.max(
					100,
					Math.min(280, dividerDragRef.current.startWidth - delta),
				),
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
	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	const debouncedSearch = useDebouncedValue(search);
	const canMutateFiles = mode.type !== "STORAGE";

	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
		null,
	);

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showMoveDialog, setShowMoveDialog] = useState(false);
	const showSelectionControls = enableMultiSelect && isSelectionMode;
	const [internalSelectedItems, setInternalSelectedItems] = useState<
		FileItem[]
	>([]);
	const closeDialogsIfSelectionEmpty = useCallback((nextCount: number) => {
		if (nextCount !== 0) {
			return;
		}
		setShowDeleteDialog(false);
		setShowMoveDialog(false);
	}, []);
	const isSelectionControlled = selectedItems !== undefined;
	const resolvedSelectedItems = isSelectionControlled
		? selectedItems
		: internalSelectedItems;
	const commitSelectionChange = useCallback(
		(nextSelectedItems: FileItem[]) => {
			closeDialogsIfSelectionEmpty(nextSelectedItems.length);
			if (!isSelectionControlled) {
				setInternalSelectedItems(nextSelectedItems);
			}
			onSelectionChange?.(nextSelectedItems);
		},
		[
			closeDialogsIfSelectionEmpty,
			isSelectionControlled,
			onSelectionChange,
		],
	);

	const selectedPaths = useMemo(
		() => new Set(resolvedSelectedItems.map((item) => item.path)),
		[resolvedSelectedItems],
	);

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
	const moveDestinationSuggestions = useMemo(() => {
		const folderPaths = files
			.filter((item) => item.type === "directory")
			.map((item) => item.path);
		return Array.from(new Set(["/", ...folderPaths])).sort((a, b) =>
			a.localeCompare(b),
		);
	}, [files]);
	const clearSelection = useCallback(() => {
		commitSelectionChange([]);
		setLastSelectedIndex(null);
	}, [commitSelectionChange]);
	const closeSelectionDialogs = useCallback(() => {
		setShowDeleteDialog(false);
		setShowMoveDialog(false);
	}, []);
	const toggleSelectionMode = useCallback(() => {
		setIsSelectionMode((prev) => {
			const next = !prev;
			if (!next) {
				clearSelection();
				closeSelectionDialogs();
			}
			return next;
		});
	}, [clearSelection, closeSelectionDialogs]);
	const openMoveDialog = useCallback(() => {
		setShowMoveDialog(true);
	}, []);
	const closeMoveDialog = useCallback(() => {
		setShowMoveDialog(false);
	}, []);

	const handleSelectionChange = (
		item: FileItem,
		selected: boolean,
		index?: number,
		shiftKey?: boolean,
	) => {
		let newSelected = [...resolvedSelectedItems];

		if (shiftKey && lastSelectedIndex !== null && index !== undefined) {
			// Range selection
			const start = Math.min(lastSelectedIndex, index);
			const end = Math.max(lastSelectedIndex, index);
			const allItems = files.slice(start, end + 1);
			if (selected) {
				// Add range
				const toAdd = allItems.filter(
					(i) => !selectedPaths.has(i.path),
				);
				newSelected = [...newSelected, ...toAdd];
			} else {
				// Remove range
				newSelected = newSelected.filter(
					(i) => !allItems.some((ai) => ai.path === i.path),
				);
			}
		} else {
			// Single toggle
			if (selected) {
				if (!selectedPaths.has(item.path)) {
					newSelected.push(item);
				}
			} else {
				newSelected = newSelected.filter((i) => i.path !== item.path);
			}
			setLastSelectedIndex(index ?? null);
		}

		commitSelectionChange(newSelected);
	};

	const buildRenamePixel = (item: FileItem, destination: string): string => {
		const newPath =
			destination === "/"
				? `/${item.name}`
				: `${destination}/${item.name}`;

		if (mode.type === "APP") {
			return `RenameAppAsset(project=["${mode.app}"], filePath=["${item.path}"], newValue=["${newPath}"]);`;
		}
		if (mode.type === "ENGINE") {
			return `RenameEngineAsset(engine=["${mode.engine}"], filePath=["${item.path}"], newValue=["${newPath}"]);`;
		}
		if (mode.type === "INSIGHT") {
			return `RenameInsightAsset(filePath=["${item.path}"], newValue=["${newPath}"]);`;
		}
		return "";
	};

	const buildDeletePixel = (item: FileItem): string => {
		if (mode.type === "APP") {
			return `DeleteAppAssets(project=["${mode.app}"], filePath=["${item.path}"]);`;
		}
		if (mode.type === "ENGINE") {
			return `DeleteEngineAssets(engine=["${mode.engine}"], filePath=["${item.path}"]);`;
		}
		if (mode.type === "INSIGHT") {
			return `DeleteInsightAssets(filePath=["${item.path}"]);`;
		}
		return "";
	};

	/**
	 * Move selected files to destination
	 */
	const moveSelectedFiles = async (destination: string) => {
		if (!canMutateFiles || resolvedSelectedItems.length === 0) {
			return;
		}
		const trimmedDestination = destination.trim();
		if (!trimmedDestination) {
			return;
		}

		try {
			const normalizedDestination =
				normalizeFolderPath(trimmedDestination);
			const count = resolvedSelectedItems.length;
			for (const item of resolvedSelectedItems) {
				const pixel = buildRenamePixel(item, normalizedDestination);
				if (!pixel) continue;
				await insight.actions.run(pixel);
			}

			// Clear selection
			clearSelection();
			closeSelectionDialogs();
			closeMoveDialog();

			// Refresh
			getFiles.refresh();

			toast.success(`Moved ${count} item(s)`);
		} catch (e) {
			toast.error("Failed to move files");
			console.error(e);
		}
	};
	const deleteSelectedFiles = async () => {
		if (!canMutateFiles || resolvedSelectedItems.length === 0) {
			return;
		}

		try {
			const count = resolvedSelectedItems.length;
			for (const item of resolvedSelectedItems) {
				const pixel = buildDeletePixel(item);
				if (!pixel) continue;
				await insight.actions.run(pixel);
			}

			// Clear selection
			clearSelection();
			closeSelectionDialogs();

			// Refresh
			getFiles.refresh();

			toast.success(`Deleted ${count} item(s)`);
		} catch (e) {
			toast.error("Failed to delete files");
			console.error(e);
		}
	};
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
		} catch (e) {
			toast.error("Failed to upload file");
			console.error(e);
		} finally {
			setIsUploading(false);
		}
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!enableMultiSelect) return;
			if (!isSelectionMode) return;
			const target = e.target;
			if (!(target instanceof HTMLElement)) return;
			if (!explorerRef.current?.contains(target)) return;
			if (isEditableElement(target)) {
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
				e.preventDefault();
				commitSelectionChange(files);
			} else if (
				e.key === "Delete" &&
				resolvedSelectedItems.length > 0 &&
				canMutateFiles
			) {
				e.preventDefault();
				setShowDeleteDialog(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		enableMultiSelect,
		isSelectionMode,
		resolvedSelectedItems.length,
		canMutateFiles,
		commitSelectionChange,
		files,
	]);
	// this converts the path into crumbs based on the folder. The top level is always '/'.
	const crumbs = path
		.split("/")
		.filter((v) => v)
		.reverse()
		.concat("/");

	// track if we should show search
	const showSearch =
		mode.type !== "STORAGE" && (isSearchActive || debouncedSearch);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix accessibility issues
		<div
			ref={explorerRef}
			className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1"
			style={{ "--date-col-width": `${dateColWidth}px` } as CSSProperties}
			onDrop={(e) => {
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
				e.preventDefault();
				if (!canMutateFiles) {
					return;
				}

				// turn on dragging
				setIsDragging(true);
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				if (!canMutateFiles) {
					return;
				}

				// turn off dragging
				setIsDragging(false);
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
										variant="ghost"
										size="icon-sm"
										disabled={showSelectionControls}
										onClick={() => {
											setIsNewFile(true);
										}}
									>
										<FilePlus2Icon className="size-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{showSelectionControls
										? "Exit selection mode to create files"
										: `Create at ${path}`}
								</TooltipContent>
							</Tooltip>
						)}
						{enableMultiSelect && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant={
											isSelectionMode
												? "secondary"
												: "ghost"
										}
										size="icon-sm"
										onClick={toggleSelectionMode}
										aria-label="Toggle selection mode"
									>
										<CopyCheckIcon className="size-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{isSelectionMode
										? "Exit selection mode"
										: "Enter selection mode"}
								</TooltipContent>
							</Tooltip>
						)}
						{showSelectionControls &&
							resolvedSelectedItems.length > 0 &&
							canMutateFiles && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={openMoveDialog}
										>
											<MoveIcon className="size-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Move {resolvedSelectedItems.length}{" "}
										selected item(s)
									</TooltipContent>
								</Tooltip>
							)}
						{showSelectionControls &&
							resolvedSelectedItems.length > 0 &&
							canMutateFiles && (
								<Tooltip>
									<Dialog
										open={showDeleteDialog}
										onOpenChange={setShowDeleteDialog}
									>
										<DialogTrigger asChild>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
												>
													<TrashIcon className="size-3" />
												</Button>
											</TooltipTrigger>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>
													Delete Files
												</DialogTitle>
												<DialogDescription>
													Are you sure you want to
													delete{" "}
													{
														resolvedSelectedItems.length
													}{" "}
													selected item(s)? This
													action cannot be undone.
												</DialogDescription>
											</DialogHeader>
											<DialogFooter>
												<Button
													variant="outline"
													onClick={() =>
														setShowDeleteDialog(
															false,
														)
													}
												>
													Cancel
												</Button>
												<Button
													onClick={
														deleteSelectedFiles
													}
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												>
													Delete
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
									<TooltipContent>
										Delete {resolvedSelectedItems.length}{" "}
										selected item(s)
									</TooltipContent>
								</Tooltip>
							)}
						{showSelectionControls &&
							resolvedSelectedItems.length > 0 &&
							canMutateFiles && (
								<MoveFilesDialog
									open={showMoveDialog}
									onOpenChange={setShowMoveDialog}
									selectedCount={resolvedSelectedItems.length}
									suggestions={moveDestinationSuggestions}
									onMove={moveSelectedFiles}
								/>
							)}
						<div
							className={
								showSelectionControls
									? "pointer-events-none opacity-50"
									: ""
							}
							aria-disabled={showSelectionControls}
						>
							{headerActions}
						</div>
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
								value="all"
								aria-label="Search all"
								title="Search all"
							>
								All
							</ToggleGroupItem>
							<ToggleGroupItem
								value="current"
								aria-label="Search only current directory"
								title={`Search only in ${path}`}
							>
								Only "{crumbs[0]}"
							</ToggleGroupItem>
						</ToggleGroup>
					</div>
				)}
			</div>

			<Separator className="my-1" />

			<div className="relative flex min-h-0 flex-1 flex-col">
				<div className="flex select-none items-center border-b px-2 pb-0.5 text-[11px] text-muted-foreground">
					<span className="min-w-[80px] flex-1 overflow-hidden truncate font-medium">
						Name
					</span>
					<div
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
						className="overflow-hidden truncate px-2 font-medium"
					>
						Date Modified
					</span>
					<div className="flex items-center self-stretch px-1">
						<div className="h-full w-px bg-border" />
					</div>
					<span style={{ width: 36 }} />
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
							className="w-full"
							expanded={expandedPaths}
							onExpandChange={(e) => {
								setExpandedPaths(e);
							}}
							onItemSelect={(item) => {
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
									return;
								}

								// select if an item
								onItemSelect(item);
							}}
						>
							{files.map((i, index) => {
								return (
									<ItemComponent
										key={i.path}
										mode={mode}
										item={i}
										refresh={() => getFiles.refresh()}
										ItemComponent={ItemComponent}
										dateColWidth={dateColWidth}
										multiSelect={showSelectionControls}
										isSelected={selectedPaths.has(i.path)}
										isPathSelected={(itemPath) =>
											selectedPaths.has(itemPath)
										}
										onSelectionChange={(
											item,
											selected,
											shiftKey,
										) =>
											handleSelectionChange(
												item,
												selected,
												index,
												shiftKey,
											)
										}
									/>
								);
							})}
						</TreeView>
					)}
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>

			{canMutateFiles && isDragging && (
				<div className="absolute inset-0 flex items-center justify-center bg-accent/50 p-4 text-accent-foreground">
					<Muted>Release to upload files to {path}</Muted>
				</div>
			)}

			{canMutateFiles && (
				<NewFileOverlay
					mode={mode}
					path={path}
					open={isNewFile}
					onClose={(success) => {
						if (success) {
							getFiles.refresh();
						}

						setIsNewFile(false);
					}}
				/>
			)}
		</div>
	);
};
