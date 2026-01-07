import {
	ChevronDownIcon,
	RefreshCwIcon,
	SearchIcon,
	UploadIcon,
} from "lucide-react";
import { useRef, useState } from "react";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import { FileExplorerItem } from "./file-explorer-item";

type FileItem = React.ComponentProps<typeof FileExplorerItem>["item"];

interface FileExplorerProps {
	/** Type of file explorer */
	options:
		| {
				type: "APP";
				app: string;
		  }
		| {
				type: "ENGINE";
				engine: string;
		  };

	/** Callback when a file is selected */
	onItemSelect?: (item: FileItem) => void;

	/**
	 * Override for the file item component
	 */
	ItemComponent?: React.ComponentType<
		React.ComponentProps<typeof FileExplorerItem>
	>;
}

export const FileExplorer = (props: FileExplorerProps) => {
	const {
		options,
		onItemSelect = () => null,
		ItemComponent = FileExplorerItem,
	} = props;
	const { actions } = useInsight();

	const fileRef = useRef<HTMLInputElement>(null);
	const [path, setPath] = useState<string>("");
	const [search, setSearch] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const debouncedSearch = useDebouncedValue(search);

	let getFilePixel = "";
	if (options.type === "APP") {
		if (debouncedSearch) {
			getFilePixel = `SearchAppAssets(filePath=[""], project=["${options.app}"], search=["${debouncedSearch}"]);`;
		} else {
			getFilePixel = `BrowseAppAssets(filePath=["${path}"], project=["${options.app}"]);`;
		}
	} else if (options.type === "ENGINE") {
		if (debouncedSearch) {
			getFilePixel = `SearchEngineAssets(filePath=[""], engine=["${options.engine}"], search=["${debouncedSearch}"]);`;
		} else {
			getFilePixel = `BrowseEngineAssets(filePath=["${path}"], engine=["${options.engine}"]);`;
		}
	}

	const getFiles = usePixel<FileItem[]>(getFilePixel, {});

	/**
	 * Upload a file to the path
	 */
	const uploadFile = async (files: File[]) => {
		try {
			setIsUploading(true);

			// upload the files
			console.error("Not implemented for every time");

			await actions.upload(files, path);

			// refresh the files
			getFiles.refresh();
		} catch (e) {
			toast.error("Failed to upload file");
			console.error(e);
		} finally {
			setIsUploading(false);
		}
	};

	// get the crumbs
	const crumbs = path.split("/").reverse();

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
			<div className="flex w-full flex-row items-center justify-between gap-1 px-2">
				<div
					className={`${isSearchActive || debouncedSearch ? "w-0" : "flex-1"} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
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
						<TooltipContent>Refresh {path || "/"}</TooltipContent>
					</Tooltip>

					<DropdownMenu>
						<DropdownMenuTrigger
							className="flex flex-1 items-center gap-1.5"
							aria-label="Toggle menu"
							disabled={crumbs.length <= 1}
						>
							<div className="min-w-12 max-w-64 truncate text-left text-sm">
								{crumbs[0] || "/"}
							</div>
							{crumbs.length > 1 && (
								<ChevronDownIcon className="size-4 text-muted-foreground" />
							)}
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{crumbs.slice(1).map((item, index) => (
								<DropdownMenuItem
									// biome-ignore lint/suspicious/noArrayIndexKey: Each item in a path may not be unique, only the last one
									key={index}
									onSelect={() => {
										// refresh if the current path
										if (index === 0) {
											getFiles.refresh();
											return;
										}

										// update the path
										const newPath = crumbs
											.slice(index)
											.reverse()
											.join("/");

										setPath(newPath);
										setSearch("");
									}}
								>
									{item || "/"}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<InputGroup
					className={`${isSearchActive || debouncedSearch ? "flex-1" : "w-24"} transition-all duration-300 ease-in-out`}
				>
					<InputGroupInput
						type="search"
						placeholder="Search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onFocus={() => setIsSearchActive(true)}
						onBlur={() => setIsSearchActive(false)}
					/>
					<InputGroupAddon align="inline-end">
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>

				<div
					className={`${isSearchActive || debouncedSearch ? "w-0" : ""} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => {
									fileRef.current?.click();
								}}
							>
								<UploadIcon className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Upload to {path || "/"}</TooltipContent>
					</Tooltip>

					<input
						ref={fileRef}
						type="file"
						multiple={true}
						hidden
						onChange={(e) => {
							// // set the new files
							// const updated = Array.from(e.target.files);
							// setFiles((prev) => [...prev, ...updated]);
							const files = Array.from(e.target.files);
							if (files.length > 0) {
								uploadFile(files);
							}
						}}
					/>
				</div>
			</div>

			<Separator />

			<ScrollArea className="[&>div>div]:!block h-full min-h-0 w-full min-w-0 flex-1">
				{(getFiles.status === "LOADING" || isUploading) && (
					<div className="flex items-center justify-center py-4">
						<Spinner />
					</div>
				)}
				{getFiles.status === "SUCCESS" &&
					!isUploading &&
					getFiles.data.length === 0 && (
						<div className="flex items-center justify-center py-4">
							<Muted>Not found</Muted>
						</div>
					)}

				{getFiles.status === "SUCCESS" &&
					getFiles.data.length > 0 &&
					!isUploading &&
					getFiles.data.map((f) => {
						return (
							<ItemComponent
								key={f.path}
								item={f}
								refresh={() => getFiles.refresh()}
								onSelect={(f) => {
									if (f.type === "directory") {
										// set the new path
										setPath(f.path);

										// clear the search
										setSearch("");
										return;
									}

									onItemSelect(f);
								}}
							/>
						);
					})}
			</ScrollArea>

			{isDragging && (
				<div className="absolute inset-0 flex items-center justify-center bg-accent/50 p-4 text-accent-foreground">
					<Muted>Release to upload files to {path || "/"}</Muted>
				</div>
			)}
		</div>
	);
};
