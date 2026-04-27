import {
	FileArchiveIcon,
	FileAudioIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
	FolderIcon,
	FolderOpenIcon,
	ImageIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeViewItem,
	toast,
	useTreeView,
} from "@semoss/ui/next";
import type { FileItem, FileMode } from "./file.types";

const ACTIONS_COL_WIDTH = 36;
type FileExplorerSecondaryAction = {
	name: string;
	action: (item: FileItem) => Promise<void>;
};

/**
 * Worst-case string widths at text-11px (~7px/char + 16px column padding px-2):
 *   numeric          "1/23/26"           8  chars  72px   → threshold  80px
 *   numeric+time     "1/23/26, 10:55 PM" 18 chars 142px   → threshold 150px
 *   short+time       "Sep 30, 2026 at 10:55 PM" 24 chars 184px → threshold 195px
 *   long+time        "September 30, 2026 at 10:55 PM" 30 chars 226px → threshold 235px
 */
const formatMacDate = (raw: string | undefined, width = 170): string | null => {
	if (!raw) return null;
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) return null;

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const fileDay = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const diffDays = Math.round(
		(today.getTime() - fileDay.getTime()) / 86400000,
	);
	const time = date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	// Today: show relative elapsed time (2h ago, 5 min ago, Just now)
	if (diffDays === 0) {
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		if (diffMins < 1) return "Just now";
		if (diffMins < 60)
			return width < 150 ? `${diffMins}m ago` : `${diffMins} min ago`;
		return width < 150 ? `${diffHours}h ago` : `${diffHours} hr ago`;
	}
	if (diffDays === 1)
		return width < 150 ? "Yesterday" : `Yesterday at ${time}`;
	if (diffDays < 7) {
		const day = date.toLocaleDateString("en-US", { weekday: "short" });
		return width < 150 ? day : `${day} at ${time}`;
	}

	// Absolute thresholds — guarantee worst-case fits without truncation
	if (width < 150)
		return date.toLocaleDateString("en-US", {
			month: "numeric",
			day: "numeric",
			year: "2-digit",
		});
	if (width < 195) {
		const d = date.toLocaleDateString("en-US", {
			month: "numeric",
			day: "numeric",
			year: "2-digit",
		});
		return `${d}, ${time}`;
	}
	if (width < 235) {
		const d = date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
		return `${d} at ${time}`;
	}
	const d = date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
	return `${d} at ${time}`;
};

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

interface FileExplorerItemProps extends React.HTMLAttributes<HTMLLIElement> {
	/** Mode of file editor */
	mode: FileMode;

	/** Item */
	item: FileItem;

	/**
	 * Refresh callback to refresh the items
	 */
	refresh: () => void;

	/** Primary actions */
	actions?: ({
		name: string;
		icon: React.ReactNode;
		tooltip: React.ReactNode;
		action: (item: FileItem) => Promise<void>;
	} | null)[];

	/** Secondary Actions */
	secondaryActions?: (FileExplorerSecondaryAction | null)[];
	/** Override for the file item component */
	ItemComponent?: typeof FileExplorerItem;

	/** Width of the date column in px — drives adaptive date formatting */
	dateColWidth?: number;

	/**
	 * Called after a successful rename with the old and new paths
	 */
	onAfterRename?: (oldPath: string, newPath: string) => void;
	/** Whether this item is the active right-click context target */
	isContextActive?: boolean;
	/** Whether this item is currently part of a bulk selection */
	isBulkSelected?: boolean;
	/** Callback to open the context menu for this item */
	onContextMenuOpen?: (
		e: React.MouseEvent,
		item: FileItem,
		targetPath: string,
		secondaryActions?: FileExplorerSecondaryAction[],
	) => void;
	/** Propagated down to children: checks if a given path is the context target */
	isItemContextActive?: (path: string) => boolean;
	/** Propagated down to children: checks if a given path is bulk-selected */
	isItemBulkSelected?: (path: string) => boolean;
	/** Track visible rendered items so keyboard bulk select can include expanded rows */
	onItemRegister?: (item: FileItem, isVisible: boolean) => void;
	/** Toggle this item in the bulk selection */
	onBulkSelectionToggle?: (item: FileItem) => void;
}

export const FileExplorerItem: React.FC<FileExplorerItemProps> = ({
	mode,
	item,
	refresh,
	actions = [],
	secondaryActions = [],
	ItemComponent = FileExplorerItem,
	dateColWidth = 130,
	onAfterRename,
	isContextActive = false,
	isBulkSelected = false,
	onContextMenuOpen,
	isItemContextActive,
	isItemBulkSelected,
	onItemRegister,
	onBulkSelectionToggle,
	...otherProps
}) => {
	const treeView = useTreeView<FileItem>();
	const insight = useInsight();
	const isDirectory = item.type === "directory";
	const isExpanded = treeView.expanded.includes(item.path);

	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const canRename = mode.type !== "STORAGE";
	const visibleSecondaryActions = secondaryActions.filter(
		(action): action is FileExplorerSecondaryAction => action !== null,
	);

	useEffect(() => {
		if (!isRenaming) return;
		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	}, [isRenaming]);

	useEffect(() => {
		onItemRegister?.(item, true);
		return () => onItemRegister?.(item, false);
	}, [item, onItemRegister]);

	// Listen for the rename CustomEvent dispatched by the context menu
	useEffect(() => {
		const handleRenameEvent = (event: Event) => {
			const customEvent = event as CustomEvent<{ path: string }>;
			if (customEvent.detail?.path === item.path) {
				setRenameValue(item.name);
				setIsRenaming(true);
			}
		};

		window.addEventListener("file-explorer:rename", handleRenameEvent);
		return () => {
			window.removeEventListener(
				"file-explorer:rename",
				handleRenameEvent,
			);
		};
	}, [item.path, item.name]);

	const handleRename = async () => {
		const newName = renameValue.trim();
		if (!newName || newName === item.name) {
			setIsRenaming(false);
			return;
		}
		try {
			const dir = item.path.substring(0, item.path.lastIndexOf("/") + 1);
			const newPath = `${dir}${newName}`;
			let pixel = "";
			if (mode.type === "APP") {
				pixel = `RenameAppAsset(project=["${mode.app}"], filePath=["${item.path}"], newValue=["${newPath}"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `RenameEngineAsset(engine=["${mode.engine}"], filePath=["${item.path}"], newValue=["${newPath}"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `RenameInsightAsset(filePath=["${item.path}"], newValue=["${newPath}"]);`;
			}
			if (pixel) {
				await insight.actions.run(pixel);
				onAfterRename?.(item.path, newPath);
				refresh();
			}
		} catch (e) {
			toast.error("Failed to rename");
			console.error(e);
		} finally {
			setIsRenaming(false);
		}
	};

	// Only fetch children if expanded and is a directory
	let getChildrenPixel = "";
	if (isDirectory && isExpanded) {
		if (mode.type === "APP") {
			getChildrenPixel = `BrowseAppAssets(filePath=["${item.path}"], project=["${mode.app}"]);`;
		} else if (mode.type === "ENGINE") {
			getChildrenPixel = `BrowseEngineAssets(filePath=["${item.path}"], engine=["${mode.engine}"]);`;
		} else if (mode.type === "STORAGE") {
			getChildrenPixel = `ListStoragePathDetails(storage=["${mode.storage}"], storagePath=["${item.path}"]);`;
		} else if (mode.type === "INSIGHT") {
			getChildrenPixel = `BrowseInsightAssets(filePath=["${item.path}"]);`;
		}
	}

	const getChildren = usePixel<unknown[]>(
		getChildrenPixel,
		{
			data: [],
		},
		insight.insightId,
	);

	const children = useMemo(() => {
		if (mode.type === "STORAGE") {
			return mapStorageEntriesToFileItems(getChildren.data);
		}

		return getChildren.data as FileItem[];
	}, [mode.type, getChildren.data]);

	const macDate = formatMacDate(item.lastModified, dateColWidth);

	const renderIcon = () => {
		if (isDirectory) {
			return isExpanded ? (
				<FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
			) : (
				<FolderIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		}
		const ext = item.name.split(".").pop()?.toLowerCase() ?? "";
		if (
			["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "img"].includes(
				ext,
			)
		)
			return (
				<ImageIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (ext === "pdf")
			return (
				<FileBadgeIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["xls", "xlsx", "csv"].includes(ext))
			return (
				<FileSpreadsheetIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (
			[
				"py",
				"js",
				"ts",
				"tsx",
				"jsx",
				"java",
				"cpp",
				"c",
				"go",
				"rs",
			].includes(ext)
		)
			return (
				<FileCodeIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext))
			return (
				<FileTerminalIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (ext === "json")
			return (
				<FileJsonIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
			return (
				<FileArchiveIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["ppt", "pptx"].includes(ext))
			return (
				<FileChartPieIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
			return (
				<FileAudioIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
			return (
				<FileVideoIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["html", "xml", "md", "mdx", "rtf"].includes(ext))
			return (
				<FileTypeIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		if (["doc", "docx", "msg", "txt"].includes(ext))
			return (
				<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
			);
		return <FileIcon className="size-4 shrink-0 text-muted-foreground" />;
	};

	// Resolve context-active state: propagated checker takes priority over direct prop
	const effectiveIsContextActive = isItemContextActive
		? isItemContextActive(item.path)
		: isContextActive;
	const effectiveIsBulkSelected = isItemBulkSelected
		? isItemBulkSelected(item.path)
		: isBulkSelected;

	return (
		<TreeViewItem
			id={item.path}
			item={item}
			loading={getChildren.status === "LOADING"}
			onClickCapture={(e) => {
				if (!(e.ctrlKey || e.metaKey)) return;
				if (!(e.target instanceof Element)) return;
				const nearestTreeItem = e.target.closest('[role="treeitem"]');
				if (nearestTreeItem !== e.currentTarget) return;
				e.preventDefault();
				e.stopPropagation();
				onBulkSelectionToggle?.(item);
			}}
			onContextMenu={(e) => {
				if (!onContextMenuOpen) return;
				e.preventDefault();
				e.stopPropagation();
				const targetPath = isDirectory
					? item.path.endsWith("/")
						? item.path
						: `${item.path}/`
					: item.path.substring(0, item.path.lastIndexOf("/") + 1) ||
						"/";
				onContextMenuOpen(e, item, targetPath, visibleSecondaryActions);
			}}
			label={
				<div
					className={[
						"group flex min-h-7 min-w-full flex-row items-center rounded-md px-2 transition-colors",
						effectiveIsContextActive
							? "bg-accent text-accent-foreground ring-1 ring-primary/30 ring-inset"
							: "",
						effectiveIsBulkSelected
							? "bg-primary/10 text-accent-foreground ring-1 ring-primary/40 ring-inset"
							: "",
					]
						.filter(Boolean)
						.join(" ")}
					title={`Path: ${item.path}${item.lastModified ? `\nLast Modified: ${item.lastModified}` : ""}`}
				>
					{/* Column 1 — Name */}
					<div className="flex min-w-[80px] flex-1 items-center gap-2 overflow-hidden pr-2">
						{renderIcon()}
						{isRenaming ? (
							<input
								ref={inputRef}
								className="w-full rounded border border-primary bg-background px-1 text-sm outline-none"
								value={renameValue}
								onChange={(e) => setRenameValue(e.target.value)}
								onFocus={(e) => {
									const dot = e.target.value.lastIndexOf(".");
									e.target.setSelectionRange(
										0,
										dot > 0 ? dot : e.target.value.length,
									);
								}}
								onBlur={handleRename}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleRename();
									} else if (e.key === "Escape") {
										e.preventDefault();
										setIsRenaming(false);
									}
									e.stopPropagation();
								}}
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<button
								type="button"
								className="min-w-0 truncate bg-transparent p-0 text-left text-sm"
								onDoubleClick={(e) => {
									if (!canRename) return;
									e.stopPropagation();
									setRenameValue(item.name);
									setIsRenaming(true);
								}}
							>
								{item.name}
							</button>
						)}
						<div className="flex-1" />
					</div>

					{/* Column 2: Date */}
					<div
						className="shrink-0 overflow-hidden truncate px-2 text-right text-[11px] text-muted-foreground"
						style={{ width: "var(--date-col-width, 170px)" }}
					>
						{macDate ?? ""}
					</div>

					{/* Column 3: Actions */}
					{actions.some(Boolean) && (
						<div
							className="flex shrink-0 items-center justify-end"
							style={{ width: ACTIONS_COL_WIDTH }}
						>
							{actions.map((a) => {
								if (!a) return null;
								return (
									<Tooltip key={a.name}>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													a.action(item);
												}}
											>
												{a.icon}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{a.tooltip}
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>
					)}
				</div>
			}
			{...otherProps}
		>
			{isDirectory ? (
				<>
					{getChildren.status === "SUCCESS" &&
						children.map((child) => (
							<ItemComponent
								key={child.path}
								mode={mode}
								item={child}
								refresh={refresh}
								actions={actions}
								secondaryActions={secondaryActions}
								dateColWidth={dateColWidth}
								onAfterRename={onAfterRename}
								isItemBulkSelected={isItemBulkSelected}
								isItemContextActive={isItemContextActive}
								onItemRegister={onItemRegister}
								onBulkSelectionToggle={onBulkSelectionToggle}
								onContextMenuOpen={onContextMenuOpen}
							/>
						))}
					{getChildren.status === "SUCCESS" &&
						children.length === 0 && (
							<Muted className="flex items-center justify-center py-2 text-xs">
								Empty folder
							</Muted>
						)}
					{/* Placeholder to ensure chevron is always shown for directories */}
					{getChildren.status !== "LOADING" &&
						getChildren.status !== "SUCCESS" && (
							<span className="hidden" />
						)}
				</>
			) : null}
		</TreeViewItem>
	);
};
