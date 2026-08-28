import {
	type DragEvent,
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { Env } from "@semoss/sdk";
import { download, useInsight, usePixel } from "@semoss/sdk/react";
import { toast, useDebouncedValue } from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import { getFileExplorerAdapter } from "./file-explorer.adapters";
import type {
	FileExplorerApi,
	FileExplorerClipboard,
	FileExplorerCommands,
	FileExplorerContextMenuState,
	FileExplorerMovedItem,
	FileExplorerOptions,
	FileExplorerSecondaryAction,
	FileExplorerStatus,
	NewFileAction,
} from "./file-explorer.types";
import {
	canMoveItemToDirectory,
	ensureDirectoryPath,
	FILE_EXPLORER_DRAG_DATA_TYPE,
	getFileOperationErrorMessage,
	getItemName,
	getParentPath,
	isExplorerDrag,
	isPointerOutsideElement,
	normalizeAssetPath,
	parseExplorerDragItems,
	serializeExplorerDragPayload,
} from "./file-explorer.utils";

/** Bounds of the resizable date column, in px. */
const DATE_COL_MIN = 100;
const DATE_COL_MAX = 280;

/**
 * Read the effective writing direction from an element's own ancestor chain,
 * so the column-resize math flips automatically when the page (or a parent
 * pane) is RTL.
 */
const isRightToLeft = (element: HTMLElement) =>
	element.closest("[dir]")?.getAttribute("dir") === "rtl" ||
	getComputedStyle(element).direction === "rtl";

/**
 * Owns a file explorer's state and behaviour for one asset tree.
 *
 * The returned object is what `FileExplorer`, `FileExplorerHeader`, and
 * `FileExplorerItem` render from — pass it down as `explorer`. Its `commands`
 * slice keeps a single identity for the hook's lifetime, so it can also be
 * handed to a surface that lives outside the explorer's React subtree.
 *
 * @param options - Which tree to browse, and the callbacks to report through.
 * @return The explorer api.
 */
export const useFileExplorer = (
	options: FileExplorerOptions,
): FileExplorerApi => {
	const {
		mode,
		initialPath,
		readOnly = false,
		onItemSelect,
		onItemsMoved,
		onItemsDeleted,
		onVisibleItemsChange,
		onItemDragStart,
	} = options;

	const insight = useInsight();
	// `common` is preloaded by every app's I18nBuilder (it's in each app's
	// initial `ns`), so this is safe to use from libs/shared.
	const { t } = useTranslation("common");
	const instanceId = useId();

	const adapter = useMemo(() => getFileExplorerAdapter(mode), [mode]);
	const capabilities = useMemo(
		() => ({
			search: adapter.capabilities.search,
			download: adapter.capabilities.download,
			mutate: adapter.capabilities.mutate && !readOnly,
			upload: adapter.capabilities.upload && !readOnly,
		}),
		[adapter, readOnly],
	);
	const canMutate = capabilities.mutate;

	const [path, setPath] = useState<string>(
		initialPath ? initialPath.replace(/\/$/, "") || "/" : "/",
	);
	const [search, setSearchValue] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchType, setSearchType] = useState<string>("all");
	const debouncedSearch = useDebouncedValue(search);

	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [selectedItems, setSelectedItems] = useState<Map<string, FileItem>>(
		() => new Map(),
	);
	const [clipboard, setClipboard] = useState<FileExplorerClipboard | null>(
		null,
	);
	const [contextMenu, setContextMenu] =
		useState<FileExplorerContextMenuState | null>(null);
	const [contextTargetPath, setContextTargetPath] = useState<string | null>(
		null,
	);

	const [isUploading, setIsUploading] = useState(false);
	const [isDraggingExternal, setIsDraggingExternal] = useState(false);
	const [moveDropCount, setMoveDropCount] = useState(0);
	const [activeDragItems, setActiveDragItems] = useState<FileItem[]>([]);
	const [activeDropTargetPath, setActiveDropTargetPath] = useState<
		string | null
	>(null);

	const [dateColWidth, setDateColWidth] = useState(DATE_COL_MIN);

	const [newFileState, setNewFileState] = useState<{
		isOpen: boolean;
		path: string;
		action?: NewFileAction;
		instance: number;
	}>(() => ({ isOpen: false, path: path, instance: 0 }));

	const visibleItemsRef = useRef<Map<string, FileItem>>(new Map());
	const directoryRefreshRef = useRef<Map<string, () => void>>(new Map());

	// ── Listing ─────────────────────────────────────────────────────────────

	// an empty pixel keeps usePixel at INITIAL, which is how the INSIGHT mode
	// waits for its insight to exist before asking for anything
	const listPixel = useMemo(() => {
		if (mode.type === "INSIGHT" && !insight.insightId) {
			return "";
		}

		if (debouncedSearch && capabilities.search) {
			return adapter.search(
				searchType === "all" ? "" : path,
				debouncedSearch,
			);
		}

		return adapter.browse(path);
	}, [
		adapter,
		capabilities.search,
		debouncedSearch,
		insight.insightId,
		mode.type,
		path,
		searchType,
	]);

	const getFiles = usePixel<unknown[]>(
		listPixel,
		{ data: [] },
		insight.insightId,
	);

	const items = useMemo(() => {
		const mapped = adapter.mapEntries(getFiles.data);

		// modes without server-side search still filter what they have, so a
		// programmatic search term is never silently ignored
		if (capabilities.search || !debouncedSearch) {
			return mapped;
		}

		const needle = debouncedSearch.toLowerCase();
		return mapped.filter((item) =>
			item.name.toLowerCase().includes(needle),
		);
	}, [adapter, capabilities.search, debouncedSearch, getFiles.data]);

	/**
	 * The last settled listing for the current directory.
	 *
	 * `usePixel` resets its data to the initial value the moment a new Pixel
	 * starts, so every search keystroke and every refresh would otherwise empty
	 * the tree mid-flight and pop it back. Holding the previous result keeps the
	 * list stable — but only while the directory is unchanged, so navigating
	 * still clears rather than briefly showing the folder you just left.
	 */
	const settledItemsRef = useRef<{ path: string; items: FileItem[] }>({
		path: path,
		items: [],
	});

	const visibleItems =
		getFiles.status === "LOADING" && settledItemsRef.current.path === path
			? settledItemsRef.current.items
			: items;

	useEffect(() => {
		if (getFiles.status === "LOADING") {
			return;
		}

		settledItemsRef.current = { path: path, items: items };
	}, [getFiles.status, items, path]);

	// ── Selection / context state ───────────────────────────────────────────

	/** Drop the bulk selection. */
	const clearSelection = useCallback(() => {
		setSelectedItems(new Map());
	}, []);

	/** Dismiss the context menu and clear its highlighted row. */
	const closeContextMenu = useCallback(() => {
		setContextMenu(null);
		setContextTargetPath(null);
	}, []);

	/**
	 * Open the context menu at a pointer position.
	 *
	 * Right-clicking a row outside the current selection drops the selection,
	 * so the menu always acts on what the user just pointed at.
	 *
	 * @param e - The originating mouse event; its client coords place the menu.
	 * @param item - The row under the pointer, or null for empty space.
	 * @param targetPath - The directory the create/paste entries act on.
	 * @param secondaryActions - Consumer entries to append to the menu.
	 */
	const openContextMenu = useCallback(
		(
			e: ReactMouseEvent,
			item: FileItem | null,
			targetPath: string,
			secondaryActions: FileExplorerSecondaryAction[] = [],
		) => {
			e.preventDefault();
			e.stopPropagation();
			setSelectedItems((previous) =>
				item && !previous.has(item.path) ? new Map() : previous,
			);
			setContextTargetPath(item?.path ?? null);
			setContextMenu({
				x: e.clientX,
				y: e.clientY,
				item: item,
				targetPath: targetPath,
				secondaryActions: secondaryActions,
			});
		},
		[],
	);

	/**
	 * Add or remove a row from the bulk selection.
	 *
	 * @param item - The row to toggle.
	 */
	const toggleBulkSelection = useCallback(
		(item: FileItem) => {
			setSelectedItems((previous) => {
				const next = new Map(previous);
				if (next.has(item.path)) {
					next.delete(item.path);
				} else {
					next.set(item.path, item);
				}
				return next;
			});
			closeContextMenu();
		},
		[closeContextMenu],
	);

	/** Select every rendered row, expanded children included. */
	const selectAllVisible = useCallback(() => {
		setSelectedItems(new Map(visibleItemsRef.current));
		closeContextMenu();
	}, [closeContextMenu]);

	// ── Visible-item and refresh registries ─────────────────────────────────

	// read from an effect and from a memoized callback, so it lives in a ref —
	// an inline arrow from a consumer must not re-fire either of them
	const onVisibleItemsChangeRef = useRef(onVisibleItemsChange);
	onVisibleItemsChangeRef.current = onVisibleItemsChange;

	/**
	 * Track a row as rendered or gone, so select-all and
	 * `onVisibleItemsChange` can see it.
	 *
	 * @param item - The row reporting in.
	 * @param isVisible - True on mount, false on unmount.
	 */
	const registerItem = useCallback(
		(item: FileItem, isVisible: boolean) => {
			if (isVisible) {
				visibleItemsRef.current.set(item.path, item);
			} else {
				visibleItemsRef.current.delete(item.path);
			}

			onVisibleItemsChangeRef.current?.({
				path: path,
				items: Array.from(visibleItemsRef.current.values()).sort(
					(a, b) => a.path.localeCompare(b.path),
				),
			});
		},
		[path],
	);

	useEffect(() => {
		visibleItemsRef.current = new Map();
		onVisibleItemsChangeRef.current?.({ path: path, items: [] });
	}, [path]);

	/**
	 * Register an expanded directory's own reloader, so a mutation inside it
	 * can refresh just that subtree instead of the whole listing.
	 *
	 * @param directoryPath - The directory being registered.
	 * @param refresh - Its reloader.
	 * @param isRegistered - True to register, false to remove.
	 */
	const registerDirectoryRefresh = useCallback(
		(directoryPath: string, refresh: () => void, isRegistered: boolean) => {
			const normalized = normalizeAssetPath(directoryPath);
			if (isRegistered) {
				directoryRefreshRef.current.set(normalized, refresh);
			} else {
				directoryRefreshRef.current.delete(normalized);
			}
		},
		[],
	);

	/**
	 * Reload the given directories. A search result is a flat list with no
	 * per-directory reloaders, so it always falls back to a full reload.
	 */
	const refresh = (directoryPaths?: string[]) => {
		if (debouncedSearch || !directoryPaths?.length) {
			getFiles.refresh();
			return;
		}

		const currentPath = normalizeAssetPath(path);
		const targets = new Set(directoryPaths.map(normalizeAssetPath));

		targets.forEach((directoryPath) => {
			if (directoryPath === currentPath) {
				getFiles.refresh();
				return;
			}

			const reload = directoryRefreshRef.current.get(directoryPath);
			if (reload) {
				reload();
				return;
			}

			// a directory nobody has expanded has no reloader of its own — fall
			// back to the root rather than silently doing nothing
			getFiles.refresh();
		});
	};

	// ── Navigation ──────────────────────────────────────────────────────────

	/**
	 * Set the search term. Collapses the tree, because the result set is a
	 * different shape from the directory the expansions belong to.
	 *
	 * @param value - The new search term.
	 */
	const setSearch = (value: string) => {
		setSearchValue(value);
		setExpandedPaths([]);
	};

	/**
	 * Re-root the tree at a directory, clearing search and expansions.
	 *
	 * @param nextPath - The directory to open.
	 */
	const navigateTo = (nextPath: string) => {
		setExpandedPaths([]);
		setPath(normalizeAssetPath(nextPath));
		setSearchValue("");
	};

	/**
	 * Descend into a directory, keeping only its descendants expanded.
	 * Non-directories are ignored.
	 *
	 * @param item - The row that was activated.
	 */
	const enterDirectory = (item: FileItem) => {
		if (item.type !== "directory") {
			return;
		}

		// keep only the entered directory's descendants expanded — its own
		// path stops being a rendered node, so holding on to it would leave the
		// folder stuck open when navigation returns to the parent
		const pathPrefix = ensureDirectoryPath(item.path);
		setExpandedPaths((previous) =>
			previous.filter(
				(candidate) =>
					candidate !== item.path &&
					candidate !== pathPrefix &&
					candidate.startsWith(pathPrefix),
			),
		);
		setPath(normalizeAssetPath(item.path));
		setSearchValue("");
	};

	/**
	 * Handle a row activation: a directory toggles open, a file is reported to
	 * the host through `onItemSelect`.
	 *
	 * @param item - The activated row.
	 */
	const selectItem = (item: FileItem) => {
		clearSelection();

		if (item.type === "directory") {
			setExpandedPaths((previous) =>
				previous.includes(item.path)
					? previous.filter((candidate) => candidate !== item.path)
					: [...previous, item.path],
			);
			return;
		}

		onItemSelect?.(item);
	};

	/**
	 * Expand a directory.
	 *
	 * @param targetPath - The directory to expand.
	 */
	const expand = (targetPath: string) => {
		setExpandedPaths((previous) =>
			previous.includes(targetPath)
				? previous
				: [...previous, targetPath],
		);
	};

	/**
	 * Collapse a directory.
	 *
	 * @param targetPath - The directory to collapse.
	 */
	const collapse = (targetPath: string) => {
		setExpandedPaths((previous) =>
			previous.filter((candidate) => candidate !== targetPath),
		);
	};

	// ── Column resize ───────────────────────────────────────────────────────

	const dividerDragRef = useRef<{
		startX: number;
		startWidth: number;
	} | null>(null);

	/**
	 * Begin a date-column resize, tracking the pointer on `document` until it
	 * is released.
	 *
	 * @param e - The mousedown on the resizer.
	 */
	const onDividerMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		const rtl = isRightToLeft(e.currentTarget);
		dividerDragRef.current = {
			startX: e.clientX,
			startWidth: dateColWidth,
		};
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";

		const onMouseMove = (ev: globalThis.MouseEvent) => {
			const currentDrag = dividerDragRef.current;
			if (!currentDrag) return;
			// In LTR the date column is on the trailing (right) side, so
			// dragging the divider right (positive delta) narrows it. In RTL
			// the date column sits on the leading (left) side instead, and the
			// math inverts.
			const delta = (ev.clientX - currentDrag.startX) * (rtl ? -1 : 1);
			setDateColWidth(
				Math.max(
					DATE_COL_MIN,
					Math.min(DATE_COL_MAX, currentDrag.startWidth - delta),
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

	// ── New file overlay ────────────────────────────────────────────────────

	/**
	 * Open the new-file overlay.
	 *
	 * @param targetPath - Directory to create in; defaults to the current one.
	 * @param action - Preselected action; omit to let the overlay ask.
	 */
	const openNewFile = (targetPath?: string, action?: NewFileAction) => {
		setNewFileState((previous) => ({
			isOpen: true,
			path: ensureDirectoryPath(targetPath ?? path),
			action: action,
			instance: previous.instance + 1,
		}));
	};

	/**
	 * Close the new-file overlay, refreshing the destination if it created
	 * something.
	 *
	 * @param success - Whether anything was created.
	 */
	const closeNewFile = (success: boolean, createdIn?: string) => {
		if (success) {
			// the overlay may have retargeted the destination, so refresh where
			// it actually created rather than where it was opened
			refresh([createdIn ?? newFileState.path]);
		}

		setNewFileState((previous) => ({ ...previous, isOpen: false }));
	};

	// ── Mutations ───────────────────────────────────────────────────────────

	/**
	 * Upload files into a directory.
	 *
	 * @param files - The files to upload.
	 * @param targetPath - Destination; defaults to the current directory.
	 */
	const upload = async (files: File[], targetPath?: string) => {
		if (!capabilities.upload || files.length === 0) {
			return;
		}

		const destination = targetPath ?? path;

		try {
			setIsUploading(true);
			await adapter.upload(insight.actions, destination, files);
			refresh([destination]);
			toast.success(
				t("fileExplorer.toasts.uploadSuccess", {
					count: files.length,
				}),
			);
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.uploadFailed"),
					e,
				),
			);
			console.error(e);
		} finally {
			setIsUploading(false);
		}
	};

	/**
	 * Move items into a directory. Illegal moves (onto itself, into its own
	 * descendant, or a same-parent no-op) are skipped rather than failed.
	 *
	 * @param movingItems - The items to move.
	 * @param targetDirectory - Where they land.
	 * @return True unless the batch threw.
	 */
	const move = async (
		movingItems: FileItem[],
		targetDirectory: string,
	): Promise<boolean> => {
		if (!canMutate) {
			return false;
		}

		try {
			const normalizedTarget = ensureDirectoryPath(targetDirectory);
			const affected = new Set<string>([normalizedTarget]);
			const movedItems: FileExplorerMovedItem[] = [];

			for (const item of movingItems) {
				const newPath = `${normalizedTarget}${getItemName(item)}`;
				affected.add(getParentPath(item.path));

				if (!canMoveItemToDirectory(item, normalizedTarget)) {
					continue;
				}

				await insight.actions.run(adapter.rename(item.path, newPath));
				movedItems.push({
					item: item,
					oldPath: item.path,
					newPath: newPath,
				});
			}

			clearSelection();
			closeContextMenu();

			if (movedItems.length > 0) {
				onItemsMoved?.(movedItems);
				toast.success(
					t("fileExplorer.toasts.moveSuccess", {
						count: movedItems.length,
					}),
				);
			}

			refresh(Array.from(affected));
			return true;
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.moveFailed"),
					e,
				),
			);
			console.error(e);
			return false;
		}
	};

	/**
	 * Copy items into a directory, reporting per-item failures rather than
	 * abandoning the batch.
	 *
	 * @param copyingItems - The items to copy.
	 * @param targetDirectory - Where the copies land.
	 * @return True if at least one copy succeeded.
	 */
	const copyInto = async (
		copyingItems: FileItem[],
		targetDirectory: string,
	): Promise<boolean> => {
		if (!canMutate) {
			return false;
		}

		try {
			const normalizedTarget = ensureDirectoryPath(targetDirectory);
			const affected = new Set<string>([normalizedTarget]);
			const failed: string[] = [];
			let copiedCount = 0;

			for (const item of copyingItems) {
				try {
					const newPath = `${normalizedTarget}${getItemName(item)}`;
					await insight.actions.run(adapter.copy(item.path, newPath));
					copiedCount += 1;
				} catch (e) {
					failed.push(getFileOperationErrorMessage(item.name, e));
					console.error(e);
				}
			}

			clearSelection();
			closeContextMenu();
			refresh(Array.from(affected));

			if (copiedCount > 0) {
				toast.success(
					t("fileExplorer.toasts.copySuccess", {
						count: copiedCount,
					}),
				);
			}

			if (failed.length > 0) {
				toast.error(
					t("fileExplorer.toasts.copyFailedItems", {
						items: failed.join(", "),
					}),
				);
			}

			return copiedCount > 0;
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.copyFailed"),
					e,
				),
			);
			console.error(e);
			return false;
		}
	};

	/**
	 * Apply the clipboard to a directory — a copy, or a move for a cut — and
	 * clear it on success.
	 *
	 * @param targetDirectory - Where the clipboard's items land.
	 */
	const paste = async (targetDirectory: string) => {
		if (!clipboard) return;

		const success =
			clipboard.action === "copy"
				? await copyInto(clipboard.items, targetDirectory)
				: await move(clipboard.items, targetDirectory);

		if (success) {
			setClipboard(null);
		}
	};

	/**
	 * Delete items, reporting per-item failures rather than abandoning the
	 * batch.
	 *
	 * @param removingItems - The items to delete; duplicates are collapsed.
	 */
	const remove = async (removingItems: FileItem[]) => {
		if (!canMutate) {
			return;
		}

		try {
			const affected = new Set<string>();
			const deletedItems: FileItem[] = [];
			const failed: string[] = [];

			// delete files before their directories, and deeper paths first,
			// so a parent is never removed out from under a pending child
			const ordered = removingItems
				.filter(
					(item, index, all) =>
						all.findIndex(
							(candidate) => candidate.path === item.path,
						) === index,
				)
				.sort((a, b) => {
					if (a.type === "directory" && b.type !== "directory") {
						return 1;
					}
					if (a.type !== "directory" && b.type === "directory") {
						return -1;
					}
					return b.path.length - a.path.length;
				});

			for (const item of ordered) {
				try {
					await insight.actions.run(adapter.remove(item.path));
					affected.add(getParentPath(item.path));
					deletedItems.push(item);
				} catch (e) {
					failed.push(getFileOperationErrorMessage(item.name, e));
					console.error(e);
				}
			}

			clearSelection();
			closeContextMenu();

			if (deletedItems.length > 0) {
				onItemsDeleted?.(deletedItems);
				toast.success(
					t("fileExplorer.toasts.deleteSuccess", {
						count: deletedItems.length,
					}),
				);
			}

			refresh(Array.from(affected));

			if (failed.length > 0) {
				toast.error(
					t("fileExplorer.toasts.deleteFailedItems", {
						items: failed.join(", "),
					}),
				);
			}
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.deleteFailed"),
					e,
				),
			);
			console.error(e);
		}
	};

	/**
	 * Commit an inline rename. A no-op name (blank, or unchanged) just leaves
	 * rename mode.
	 *
	 * @param item - The row being renamed.
	 * @param newName - Its new last path segment.
	 */
	const renameTo = async (item: FileItem, newName: string) => {
		const trimmed = newName.trim();
		setRenamingPath(null);

		if (!canMutate || !trimmed || trimmed === item.name) {
			return;
		}

		try {
			const newPath = `${getParentPath(item.path)}${trimmed}`;
			await insight.actions.run(adapter.rename(item.path, newPath));
			onItemsMoved?.([
				{ item: item, oldPath: item.path, newPath: newPath },
			]);
			refresh([getParentPath(item.path)]);
			toast.success(t("fileExplorer.toasts.renameSuccess"));
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.renameFailed"),
					e,
				),
			);
			console.error(e);
		}
	};

	/**
	 * Extract a zip in place.
	 *
	 * @param item - The archive to extract.
	 */
	const unzip = async (item: FileItem) => {
		if (!canMutate) {
			return;
		}

		try {
			await insight.actions.run(adapter.unzip(item.path));
			refresh([getParentPath(item.path)]);
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.unzipFailed"),
					e,
				),
			);
			console.error(e);
		}
	};

	/**
	 * Copy a path to the clipboard, falling back to a hidden textarea where the
	 * async clipboard API is unavailable. Takes a bare path rather than a
	 * `FileItem` so the header can copy the current directory's path too, not
	 * just a row's.
	 *
	 * @param path - The path to copy.
	 */
	const copyPath = async (path: string) => {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(path);
			} else {
				const textArea = document.createElement("textarea");
				textArea.value = path;
				textArea.style.position = "fixed";
				textArea.style.opacity = "0";
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
			}
			toast.success(t("fileExplorer.toasts.copyPathSuccess"));
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.copyPathFailed"),
					e,
				),
			);
			console.error(e);
		}
	};

	// ── Download ────────────────────────────────────────────────────────────

	/**
	 * Resolve an item to a server-side file key.
	 *
	 * @param item - The item to download.
	 * @return The file key, or an empty string if none came back.
	 */
	const getDownloadFileKey = async (item: FileItem) => {
		const { pixelReturn } = await insight.actions.run<[string]>(
			adapter.download(item.path),
		);
		return pixelReturn?.[0]?.output || "";
	};

	/** A directory downloads as `<name>.zip`. */
	const getDownloadFileName = (item: FileItem) => {
		if (item.type !== "directory") {
			return item.name;
		}

		return `${getItemName(item).replace(/\.zip$/i, "")}.zip`;
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

	/**
	 * Download items, reporting per-item failures rather than abandoning the
	 * batch.
	 *
	 * @param downloadingItems - The items to download.
	 */
	const downloadItems = async (downloadingItems: FileItem[]) => {
		if (!capabilities.download || downloadingItems.length === 0) {
			return;
		}

		const failed: string[] = [];
		let downloadedCount = 0;

		for (const item of downloadingItems) {
			try {
				const fileKey = await getDownloadFileKey(item);
				if (!fileKey) {
					continue;
				}

				// a single file goes through the SDK helper, which streams it;
				// everything else (and every directory) comes back as a blob
				if (
					downloadingItems.length === 1 &&
					item.type !== "directory"
				) {
					await download(insight.insightId, fileKey);
				} else {
					await downloadFileKeyAsBlob(
						fileKey,
						getDownloadFileName(item),
					);
				}
				downloadedCount += 1;
			} catch (e) {
				failed.push(getFileOperationErrorMessage(item.name, e));
				console.error(e);
			}
		}

		if (downloadedCount > 0) {
			toast.success(
				t("fileExplorer.toasts.downloadSuccess", {
					count: downloadedCount,
				}),
			);
		}

		if (failed.length > 0) {
			toast.error(
				t("fileExplorer.toasts.downloadFailedItems", {
					items: failed.join(", "),
				}),
			);
		}
	};

	// ── Drag and drop ───────────────────────────────────────────────────────

	/**
	 * What a drag starting on a row should carry: the whole selection when the
	 * row is part of it, otherwise just the row.
	 *
	 * @param item - The row the drag started on.
	 * @return The items to drag.
	 */
	const getDragItems = (item: FileItem) =>
		selectedItems.has(item.path)
			? Array.from(selectedItems.values())
			: [item];

	/**
	 * Record an in-flight move drag.
	 *
	 * @param itemCount - Items hovering the root; 0 while over a row.
	 * @param dragItems - The items in flight; defaults to the current ones.
	 */
	const setDragState = (
		itemCount: number,
		dragItems: FileItem[] = activeDragItems,
	) => {
		setMoveDropCount(itemCount);
		setActiveDragItems(dragItems);
	};

	/** Tear down all drag state, whatever kind of drag it was. */
	const resetDragState = () => {
		setIsDraggingExternal(false);
		setMoveDropCount(0);
		setActiveDragItems([]);
		setActiveDropTargetPath(null);
	};

	// A drag can end without the row that started it ever hearing about it —
	// the tree refreshes mid-drag and unmounts the row, or a host outside the
	// explorer handles the drop and stops the event. Left set, `activeDragItems`
	// makes the *next* drag inherit stale items and the root drop hint never
	// goes away, so the teardown is also pinned to the window.
	useEffect(() => {
		const reset = () => {
			setIsDraggingExternal(false);
			setMoveDropCount(0);
			setActiveDragItems([]);
			setActiveDropTargetPath(null);
		};

		window.addEventListener("dragend", reset);
		window.addEventListener("drop", reset);
		return () => {
			window.removeEventListener("dragend", reset);
			window.removeEventListener("drop", reset);
		};
	}, []);

	/**
	 * Replace the browser's default row snapshot with a small labelled chip,
	 * so a multi-item drag reads as one thing.
	 */
	const setDragPreview = (
		dataTransfer: DataTransfer,
		dragItems: FileItem[],
	) => {
		const preview = document.createElement("div");
		preview.textContent =
			dragItems.length > 1
				? t("fileExplorer.itemCount", { count: dragItems.length })
				: (dragItems[0]?.name ?? "");
		preview.className =
			"fixed -top-96 start-0 rounded border border-border bg-card px-2 py-1 text-xs text-foreground shadow-lg";
		document.body.appendChild(preview);
		dataTransfer.setDragImage(preview, 12, 12);
		window.setTimeout(() => preview.remove(), 0);
	};

	/**
	 * Write this explorer's drag payload, then let the host add its own.
	 *
	 * The host runs last on purpose: a host that hands the drag to another
	 * system (a dock, a FlexLayout tab) needs the final say on `text/plain`
	 * and the drag image.
	 */
	const handleItemDragStart = (e: DragEvent, dragItems: FileItem[]) => {
		// `copyMove`, not `move`: a drop target's `dropEffect` has to be one of
		// the operations named here or the browser resolves the whole drag to
		// "none" and never fires `drop`. Dropping on a folder row is a move;
		// a host that opens the file somewhere else (a dock, a tab strip) is a
		// copy, since the file itself stays put.
		e.dataTransfer.effectAllowed = "copyMove";
		e.dataTransfer.setData(
			"text/plain",
			dragItems.map((item) => item.path).join("\n"),
		);

		// a read-only explorer is still allowed to be a drag source for
		// something outside itself, but it must not offer a move payload
		if (canMutate) {
			e.dataTransfer.setData(
				FILE_EXPLORER_DRAG_DATA_TYPE,
				serializeExplorerDragPayload(instanceId, dragItems),
			);
			setDragPreview(e.dataTransfer, dragItems);
		}

		onItemDragStart?.(e, dragItems);
	};

	/**
	 * The items a drag is carrying: the ones this explorer recorded on
	 * dragstart, or — for a drag that began before this render — the payload.
	 *
	 * @param dataTransfer - The in-flight drag's data transfer.
	 * @return The dragged items, or `[]` for a foreign drag.
	 */
	const currentDragItems = (dataTransfer: DataTransfer) =>
		activeDragItems.length > 0
			? activeDragItems
			: parseExplorerDragItems(dataTransfer, instanceId);

	/**
	 * Handle a drop on the explorer's own surface: an internal drag moves to
	 * the current directory, OS files upload into it.
	 *
	 * @param e - The drop event.
	 */
	const onRootDrop = (e: DragEvent<HTMLElement>) => {
		if (isExplorerDrag(e.dataTransfer)) {
			e.preventDefault();
			e.stopPropagation();
			const dragItems = currentDragItems(e.dataTransfer);
			resetDragState();
			if (canMutate && dragItems.length > 0) {
				move(dragItems, ensureDirectoryPath(path));
			}
			return;
		}

		e.preventDefault();
		if (!capabilities.upload) {
			return;
		}

		upload(Array.from(e.dataTransfer.files));
		setIsDraggingExternal(false);
	};

	/**
	 * Track a drag over the explorer's surface, distinguishing an internal
	 * move from an OS file drop.
	 *
	 * @param e - The dragover event.
	 */
	const onRootDragOver = (e: DragEvent<HTMLElement>) => {
		if (isExplorerDrag(e.dataTransfer)) {
			e.preventDefault();
			e.stopPropagation();
			setActiveDropTargetPath(null);
			const dragItems = currentDragItems(e.dataTransfer);
			if (canMutate && dragItems.length > 0) {
				e.dataTransfer.dropEffect = "move";
				setMoveDropCount(dragItems.length);
			}
			setIsDraggingExternal(false);
			return;
		}

		e.preventDefault();
		if (!capabilities.upload) {
			return;
		}

		setIsDraggingExternal(true);
	};

	/**
	 * Tear the drag state down, but only once the pointer has genuinely left
	 * the surface — a dragleave also fires for every child crossing.
	 *
	 * @param e - The dragleave event.
	 */
	const onRootDragLeave = (e: DragEvent<HTMLElement>) => {
		if (!isPointerOutsideElement(e.currentTarget, e.clientX, e.clientY)) {
			return;
		}

		if (isExplorerDrag(e.dataTransfer)) {
			e.preventDefault();
			e.stopPropagation();
			resetDragState();
			return;
		}

		e.preventDefault();
		setIsDraggingExternal(false);
	};

	// ── Commands facade ─────────────────────────────────────────────────────

	// Rebuilt every render so the methods always close over live state...
	const liveCommands: FileExplorerCommands = {
		refresh: refresh,
		navigateTo: navigateTo,
		openNewFile: openNewFile,
		rename: (item) => setRenamingPath(item.path),
		renameTo: renameTo,
		remove: remove,
		download: downloadItems,
		copy: (copyItems) => setClipboard({ items: copyItems, action: "copy" }),
		cut: (cutItems) => setClipboard({ items: cutItems, action: "cut" }),
		paste: paste,
		move: move,
		upload: upload,
		copyPath: copyPath,
		unzip: unzip,
		expand: expand,
		collapse: collapse,
		selectAllVisible: selectAllVisible,
		clearSelection: clearSelection,
	};
	const liveRef = useRef(liveCommands);
	liveRef.current = liveCommands;

	// ...while the exposed facade keeps one identity for the hook's lifetime,
	// so a workbench control (or anything else outside this subtree) can hold
	// on to it without re-registering. See `hooks/use-workbench-control.tsx`
	// in the client for the same pattern.
	const [commands] = useState<FileExplorerCommands>(() => ({
		refresh: (directoryPaths) => liveRef.current.refresh(directoryPaths),
		navigateTo: (nextPath) => liveRef.current.navigateTo(nextPath),
		openNewFile: (targetPath, action) =>
			liveRef.current.openNewFile(targetPath, action),
		rename: (item) => liveRef.current.rename(item),
		renameTo: (item, newName) => liveRef.current.renameTo(item, newName),
		remove: (removingItems) => liveRef.current.remove(removingItems),
		download: (downloadingItems) =>
			liveRef.current.download(downloadingItems),
		copy: (copyItems) => liveRef.current.copy(copyItems),
		cut: (cutItems) => liveRef.current.cut(cutItems),
		paste: (targetDirectory) => liveRef.current.paste(targetDirectory),
		move: (movingItems, targetDirectory) =>
			liveRef.current.move(movingItems, targetDirectory),
		upload: (files, targetPath) =>
			liveRef.current.upload(files, targetPath),
		copyPath: (path) => liveRef.current.copyPath(path),
		unzip: (item) => liveRef.current.unzip(item),
		expand: (targetPath) => liveRef.current.expand(targetPath),
		collapse: (targetPath) => liveRef.current.collapse(targetPath),
		selectAllVisible: () => liveRef.current.selectAllVisible(),
		clearSelection: () => liveRef.current.clearSelection(),
	}));

	// ── Api ─────────────────────────────────────────────────────────────────

	// this converts the path into crumbs based on the folder. The top level is
	// always '/'.
	const crumbs = path.split("/").filter(Boolean).reverse().concat("/");

	const liveApi: FileExplorerApi = {
		instanceId: instanceId,
		mode: mode,
		adapter: adapter,
		capabilities: capabilities,
		header: {
			path: path,
			crumbs: crumbs,
			search: search,
			setSearch: setSearch,
			searchType: searchType,
			setSearchType: setSearchType,
			isSearchOpen: isSearchOpen,
			setIsSearchOpen: setIsSearchOpen,
			// `search`, not `debouncedSearch`: closing after a clear should be
			// immediate rather than trailing the 300ms debounce
			showSearch: isSearchOpen || Boolean(search),
		},
		tree: {
			items: visibleItems,
			status: getFiles.status as FileExplorerStatus,
			error: getFiles.error,
			isUploading: isUploading,
			expandedPaths: expandedPaths,
			setExpandedPaths: setExpandedPaths,
			renamingPath: renamingPath,
			cancelRename: () => setRenamingPath(null),
			dateColWidth: dateColWidth,
			setDateColWidth: setDateColWidth,
			onDividerMouseDown: onDividerMouseDown,
			contextMenu: contextMenu,
			clipboard: clipboard,
			closeContextMenu: closeContextMenu,
			openContextMenu: openContextMenu,
			isContextActive: (itemPath) => contextTargetPath === itemPath,
			isBulkSelected: (itemPath) => selectedItems.has(itemPath),
			selectedItems: Array.from(selectedItems.values()),
			toggleBulkSelection: toggleBulkSelection,
			registerItem: registerItem,
			registerDirectoryRefresh: registerDirectoryRefresh,
			selectItem: selectItem,
			enterDirectory: enterDirectory,
		},
		dnd: {
			enabled: canMutate,
			canDrag: canMutate || Boolean(onItemDragStart),
			activeDragItems: activeDragItems,
			activeDropTargetPath: activeDropTargetPath,
			moveDropCount: moveDropCount,
			isDraggingExternal: isDraggingExternal,
			getDragItems: getDragItems,
			setActiveDropTargetPath: setActiveDropTargetPath,
			setDragState: setDragState,
			onItemDragStart: handleItemDragStart,
			onRootDragOver: onRootDragOver,
			onRootDragLeave: onRootDragLeave,
			onRootDrop: onRootDrop,
		},
		newFile: {
			isOpen: newFileState.isOpen,
			path: newFileState.path,
			action: newFileState.action,
			instance: newFileState.instance,
			close: closeNewFile,
		},
		commands: commands,
	};

	const liveApiRef = useRef(liveApi);
	liveApiRef.current = liveApi;

	// The api object keeps ONE identity for the hook's lifetime: its slices are
	// getters onto the live object above. Rendering is unaffected — a component
	// reads the getters fresh on every render — but it means the whole api can
	// be handed to a surface that has to hold on to it, the way a workbench
	// panel publishes it on its scratch `value` for its chrome control. Such a
	// holder sees live *behaviour* but not live *state*: it does not re-render
	// when the explorer does, so it must not draw anything that changes.
	const [api] = useState<FileExplorerApi>(() => ({
		get instanceId() {
			return liveApiRef.current.instanceId;
		},
		get mode() {
			return liveApiRef.current.mode;
		},
		get adapter() {
			return liveApiRef.current.adapter;
		},
		get capabilities() {
			return liveApiRef.current.capabilities;
		},
		get header() {
			return liveApiRef.current.header;
		},
		get tree() {
			return liveApiRef.current.tree;
		},
		get dnd() {
			return liveApiRef.current.dnd;
		},
		get newFile() {
			return liveApiRef.current.newFile;
		},
		get commands() {
			return liveApiRef.current.commands;
		},
	}));

	return api;
};
