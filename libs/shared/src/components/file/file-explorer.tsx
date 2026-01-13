import {
	ChevronDownIcon,
	FilePlus2Icon,
	RefreshCwIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";
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
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
	mode,
	headerActions = null,
	onItemSelect = () => null,
	ItemComponent = FileExplorerItem,
}) => {
	const insight = useInsight();

	const [path, setPath] = useState<string>("/");
	const [search, setSearch] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [searchType, setSearchType] = useState<string>("all");

	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const [isNewFile, setIsNewFile] = useState(false);
	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

	const debouncedSearch = useDebouncedValue(search);

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
	} else if (mode.type === "INSIGHT") {
		if (debouncedSearch) {
			getFilesPixel = `SearchInsightAssets(filePath=["${searchType === "all" ? "" : path}"], search=["${debouncedSearch}"]);`;
		} else {
			getFilesPixel = `BrowseInsightAssets(filePath=["${path}"]);`;
		}
	}

	const getFiles = usePixel<FileItem[]>(getFilesPixel, {}, insight.insightId);

	/**
	 * Upload a file to the path
	 */
	const uploadFile = async (files: File[]) => {
		try {
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
	const showSearch = isSearchActive || debouncedSearch;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix accessibility issues
		<div
			className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1"
			onDrop={(e) => {
				e.preventDefault();

				// set the new files
				const files = Array.from(e.dataTransfer.files);
				uploadFile(files);

				// turn off dragging
				setIsDragging(false);
			}}
			onDragOver={(e) => {
				e.preventDefault();

				// turn on dragging
				setIsDragging(true);
			}}
			onDragLeave={(e) => {
				e.preventDefault();

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

					<InputGroup
						className={`${showSearch ? "flex-1" : "w-24"} transition-all duration-300 ease-in-out`}
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

					<div
						className={`${showSearch ? "w-0" : ""} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
					>
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
							<TooltipContent>Create at {path}</TooltipContent>
						</Tooltip>
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

			<ScrollArea className="[&>div>div]:block! h-full min-h-0 w-full min-w-0 flex-1">
				{(getFiles.status === "LOADING" || isUploading) && (
					<div className="flex items-center justify-center py-16">
						<Spinner />
					</div>
				)}

				{getFiles.status === "ERROR" && (
					<div className="flex items-center justify-center py-4">
						<Muted className="text-destructive">
							{getFiles.error?.message || "Failed to load files"}
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
									return prev.filter((p) =>
										p.startsWith(item.path),
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
						{getFiles.data.map((i) => {
							return (
								<ItemComponent
									key={i.path}
									mode={mode}
									item={i}
									refresh={() => getFiles.refresh()}
									ItemComponent={ItemComponent}
								/>
							);
						})}
					</TreeView>
				)}
			</ScrollArea>

			{isDragging && (
				<div className="absolute inset-0 flex items-center justify-center bg-accent/50 p-4 text-accent-foreground">
					<Muted>Release to upload files to {path}</Muted>
				</div>
			)}

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
		</div>
	);
};
