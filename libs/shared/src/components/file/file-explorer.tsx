import {
	ChevronDownIcon,
	FilePlus2Icon,
	RefreshCwIcon,
	SearchIcon,
} from "lucide-react";
import {
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
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
import { FileExplorerItem } from "./file-explorer-item";
import { NewFileOverlay } from "./new-file-overlay";

interface StoragePathEntry {
	Name?: string;
	name?: string;
	Path?: string;
	path?: string;
	IsDir?: boolean;
	isDir?: boolean;
	ModTime?: string;
	lastModified?: string;
	last_modified?: string;
}

const mapStorageEntriesToFileItems = (entries: unknown): FileItem[] => {
	if (!Array.isArray(entries)) {
		return [];
	}

	return entries.reduce<FileItem[]>((acc, entry) => {
		if (typeof entry === "string") {
			if (!entry) {
				return acc;
			}

			const normalizedEntry = entry.replace(/\/+$/, "");
			const name =
				normalizedEntry.split("/").filter(Boolean).pop() ||
				normalizedEntry;
			const isDirectory = entry.endsWith("/");

			acc.push({
				name: name,
				path: entry,
				type: isDirectory ? "directory" : undefined,
			});

			return acc;
		}

		if (!entry || typeof entry !== "object") {
			return acc;
		}

		const details = entry as StoragePathEntry;
		const name = details.Name || details.name || "";
		const path = details.Path || details.path || "";
		if (!path) {
			return acc;
		}
		const fallbackName = path.split("/").filter(Boolean).pop() || "/";
		const isDirectory = details.IsDir || details.isDir;

		acc.push({
			name: name || fallbackName,
			path: path,
			type: isDirectory ? "directory" : undefined,
			lastModified:
				details.ModTime ||
				details.lastModified ||
				details.last_modified,
		});

		return acc;
	}, []);
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
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
	mode,
	headerActions = null,
	onItemSelect = () => null,
	ItemComponent = FileExplorerItem,
	initialPath,
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
		} catch (e) {
			toast.error("Failed to upload file");
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
		mode.type !== "STORAGE" && (isSearchActive || debouncedSearch);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix accessibility issues
		<div
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
										onClick={() => {
											setIsNewFile(true);
										}}
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
							{files.map((i) => {
								return (
									<ItemComponent
										key={i.path}
										mode={mode}
										item={i}
										refresh={() => getFiles.refresh()}
										ItemComponent={ItemComponent}
										dateColWidth={dateColWidth}
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
