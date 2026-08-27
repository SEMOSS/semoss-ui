import type { DragEvent, MouseEvent, ReactNode } from "react";
import type { FileItem, FileMode } from "./file.types";
import type {
	FileExplorerAdapter,
	FileExplorerCapabilities,
} from "./file-explorer.adapters";

/** What the new-file overlay is being asked to do. */
export type NewFileAction = "upload" | "add_file" | "add_directory";

/** Load state of the explorer's current listing. */
export type FileExplorerStatus = "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";

/** One item that changed path, reported after a move or rename. */
export interface FileExplorerMovedItem {
	item: FileItem;
	oldPath: string;
	newPath: string;
}

/** A glyph button rendered in a row's action column. */
export interface FileExplorerPrimaryAction {
	name: string;
	icon: ReactNode;
	tooltip: ReactNode;
	action: (item: FileItem) => Promise<void>;
}

/** An extra entry appended to a row's context menu. */
export interface FileExplorerSecondaryAction {
	name: string;
	action: (item: FileItem) => Promise<void>;
}

/**
 * Per-row actions a consumer injects. Returned from `itemActions`, which is
 * called once per rendered row.
 */
export interface FileExplorerItemActions {
	actions?: (FileExplorerPrimaryAction | null)[];
	secondaryActions?: (FileExplorerSecondaryAction | null)[];
}

/** Items held for a paste, and how they got there. */
export interface FileExplorerClipboard {
	items: FileItem[];
	action: "copy" | "cut";
}

/** An open context menu: where it is, and what it is over. */
export interface FileExplorerContextMenuState {
	x: number;
	y: number;
	/** Null when the menu was opened over empty space. */
	item: FileItem | null;
	/** The directory the menu's create/paste entries act on. */
	targetPath: string;
	secondaryActions?: FileExplorerSecondaryAction[];
}

/**
 * The explorer's behaviour, callable from anywhere that holds the api object.
 *
 * This object keeps **one identity for the hook's whole lifetime**, so it is
 * safe to hand to a surface that lives outside the explorer's React subtree —
 * a workbench chrome control, a command palette entry, a domain store. Its
 * methods always run the latest closures.
 */
export interface FileExplorerCommands {
	/**
	 * Reload listings. Passing directory paths refreshes only those (falling
	 * back to a full reload while a search is active); passing nothing
	 * reloads the current directory.
	 */
	refresh(directoryPaths?: string[]): void;
	/** Navigate the tree root to a directory. */
	navigateTo(path: string): void;
	/**
	 * Open the new-file overlay. Omitting `action` leaves the choice to the
	 * overlay, which then opens on its action picker.
	 */
	openNewFile(path?: string, action?: NewFileAction): void;
	/** Put a row into inline rename mode. */
	rename(item: FileItem): void;
	/** Commit a rename. `newName` replaces the item's last path segment. */
	renameTo(item: FileItem, newName: string): Promise<void>;
	remove(items: FileItem[]): Promise<void>;
	download(items: FileItem[]): Promise<void>;
	copy(items: FileItem[]): void;
	cut(items: FileItem[]): void;
	paste(targetDirectory: string): Promise<void>;
	/** Move items into a directory. Resolves false if the move failed. */
	move(items: FileItem[], targetDirectory: string): Promise<boolean>;
	upload(files: File[], path?: string): Promise<void>;
	copyPath(item: FileItem): Promise<void>;
	unzip(item: FileItem): Promise<void>;
	expand(path: string): void;
	collapse(path: string): void;
	selectAllVisible(): void;
	clearSelection(): void;
}

/** What `FileExplorerHeader` reads. */
export interface FileExplorerHeaderState {
	/** The directory the tree is rooted at. */
	path: string;
	/**
	 * The path split into segments, innermost first, with `"/"` appended —
	 * `crumbs[0]` is the current folder's label.
	 */
	crumbs: string[];
	search: string;
	setSearch(value: string): void;
	/** `"all"` searches the whole tree, `"current"` only under `path`. */
	searchType: string;
	setSearchType(value: string): void;
	isSearchActive: boolean;
	setIsSearchActive(value: boolean): void;
	/** Whether the search field should be expanded. */
	showSearch: boolean;
}

/** What `FileExplorer` and `FileExplorerItem` read to draw the tree. */
export interface FileExplorerTreeState {
	/** The current directory's children, already normalized and filtered. */
	items: FileItem[];
	status: FileExplorerStatus;
	error?: Error;
	isUploading: boolean;
	expandedPaths: string[];
	setExpandedPaths(
		value: string[] | ((previous: string[]) => string[]),
	): void;
	/** The row currently in inline rename mode, if any. */
	renamingPath: string | null;
	cancelRename(): void;
	dateColWidth: number;
	setDateColWidth(value: number | ((previous: number) => number)): void;
	onDividerMouseDown(e: MouseEvent<HTMLDivElement>): void;
	contextMenu: FileExplorerContextMenuState | null;
	clipboard: FileExplorerClipboard | null;
	closeContextMenu(): void;
	openContextMenu(
		e: MouseEvent,
		item: FileItem | null,
		targetPath: string,
		secondaryActions?: FileExplorerSecondaryAction[],
	): void;
	isContextActive(path: string): boolean;
	isBulkSelected(path: string): boolean;
	/** The current bulk selection, in render order. */
	selectedItems: FileItem[];
	toggleBulkSelection(item: FileItem): void;
	/** A row reports itself mounted/unmounted so bulk select-all can see it. */
	registerItem(item: FileItem, isVisible: boolean): void;
	/** An expanded directory registers its own reloader for targeted refresh. */
	registerDirectoryRefresh(
		directoryPath: string,
		refresh: () => void,
		isRegistered: boolean,
	): void;
	/** Single-click / Enter on a row. */
	selectItem(item: FileItem): void;
	/** Double-click on a directory row — descends into it. */
	enterDirectory(item: FileItem): void;
}

/** What the drag-and-drop surfaces read. */
export interface FileExplorerDndState {
	/** False when the mode or `readOnly` forbids moves. */
	enabled: boolean;
	/**
	 * Whether rows are draggable at all. True when moves are enabled, or when
	 * a host supplied `onItemDragStart` — a read-only explorer can still be a
	 * drag source for something outside itself.
	 */
	canDrag: boolean;
	/** Items in flight inside this explorer. */
	activeDragItems: FileItem[];
	/** The one folder row currently highlighted as the drop target. */
	activeDropTargetPath: string | null;
	/** Non-zero while a move drag is over the explorer but not over a row. */
	moveDropCount: number;
	/** True while OS files are hovering the explorer. */
	isDraggingExternal: boolean;
	/** The items a drag from `item` should carry — the selection, or just it. */
	getDragItems(item: FileItem): FileItem[];
	setActiveDropTargetPath(path: string | null): void;
	setDragState(itemCount: number, items?: FileItem[]): void;
	/** Writes this explorer's payload, then defers to `onItemDragStart`. */
	onItemDragStart(e: DragEvent, items: FileItem[]): void;
	onRootDragOver(e: DragEvent<HTMLElement>): void;
	onRootDragLeave(e: DragEvent<HTMLElement>): void;
	onRootDrop(e: DragEvent<HTMLElement>): void;
}

/** The injected new-file overlay's open state. */
export interface FileExplorerNewFileState {
	isOpen: boolean;
	path: string;
	/** Undefined means the overlay should ask which action to take. */
	action?: NewFileAction;
	/**
	 * Bumped on every open so the host can key the overlay and reset its
	 * form.
	 */
	instance: number;
	/**
	 * @param success - Whether the overlay created anything.
	 * @param createdIn - Where it created, if the overlay retargeted `path`.
	 */
	close(success: boolean, createdIn?: string): void;
}

/**
 * Everything the explorer components need, produced by `useFileExplorer`.
 *
 * Pass the whole object down — the components read the slice they need. The
 * `commands` slice is additionally safe to pass outside the subtree.
 */
export interface FileExplorerApi {
	/** Unique per hook instance; scopes rename and drag payloads. */
	instanceId: string;
	mode: FileMode;
	adapter: FileExplorerAdapter;
	/** The adapter's capabilities after `readOnly` is applied. */
	capabilities: FileExplorerCapabilities;
	header: FileExplorerHeaderState;
	tree: FileExplorerTreeState;
	dnd: FileExplorerDndState;
	newFile: FileExplorerNewFileState;
	commands: FileExplorerCommands;
}

/**
 * Props shared by the explorer's standalone action buttons
 * (`FileExplorerRefreshAction`, `FileExplorerNewAction`). They render the same
 * whether they sit in a header or in a host's own chrome, so the host only
 * passes sizing.
 */
export interface FileExplorerActionProps {
	/** The explorer the button acts on. */
	explorer: FileExplorerApi;
	/** Extra classes for the button, e.g. a host's chrome sizing. */
	className?: string;
	/** Icon classes, so a chrome control can match its neighbours. */
	iconClassName?: string;
}

/** Options for `useFileExplorer`. */
export interface FileExplorerOptions {
	/** Which asset tree to browse. */
	mode: FileMode;
	/** Directory to open at. Defaults to `"/"`. */
	initialPath?: string;
	/**
	 * Browse-only: hides create/upload, disables drag-to-move, and drops the
	 * mutating context-menu entries. Browsing, search, and download remain.
	 */
	readOnly?: boolean;
	/** A file row was activated (directories are handled internally). */
	onItemSelect?: (item: FileItem) => void;
	/** Fired after a successful move or rename, with old and new paths. */
	onItemsMoved?: (items: FileExplorerMovedItem[]) => void;
	/** Fired after a successful delete. */
	onItemsDeleted?: (items: FileItem[]) => void;
	/** Fired whenever the set of rendered rows changes. */
	onVisibleItemsChange?: (payload: {
		path: string;
		items: FileItem[];
	}) => void;
	/**
	 * Called on row dragstart after the explorer has written its own payload,
	 * so a host can attach a second `dataTransfer` type (e.g. a workbench
	 * panel spec) to the same drag.
	 */
	onItemDragStart?: (e: DragEvent, items: FileItem[]) => void;
}

/**
 * Props of the overlay passed to `FileExplorer` as `newFileOverlay`. The
 * explorer owns when it opens; the overlay owns what it can create.
 */
export interface FileExplorerNewFileOverlayProps {
	mode: FileMode;
	/**
	 * The directory to create in, trailing-slashed. This is the *initial*
	 * destination only — the overlay may let the user retarget it, and reports
	 * where it actually created through `onClose`.
	 */
	path: string;
	open: boolean;
	/** Undefined means the overlay should open on its action picker. */
	action?: NewFileAction;
	/**
	 * `success` true means something was created, so callers refresh.
	 *
	 * @param success - Whether anything was created.
	 * @param createdIn - The directory it landed in, when that is not `path`.
	 */
	onClose: (success: boolean, createdIn?: string) => void;
}
