import {
	type ComponentType,
	type CSSProperties,
	type DragEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, ScrollArea } from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import { decorateExplorer } from "./file-explorer.decorate";
import type {
	FileExplorerApi,
	FileExplorerHeaderState,
	FileExplorerItemActions,
	FileExplorerNewFileOverlayProps,
} from "./file-explorer.types";
import type {
	FileExplorerPlace,
	FileExplorerRoot,
	FileExplorerRootsLayout,
} from "./file-explorer-root.types";
import {
	FileExplorerRootSection,
	type FileExplorerRootSectionProps,
} from "./file-explorer-root-section";
import { useFileExplorerRootsLayout } from "./use-file-explorer-roots-layout";

export interface FileExplorerProps {
	/**
	 * The trees to show, one or more, each an explorer from a per-mode hook
	 * such as `useInsightFileExplorer` or `useSourceFileExplorer`, or from
	 * `useFileExplorer`. With one, it is a plain tree. With more, the top
	 * level lists each root as a folder that opens in place, and a double-click
	 * goes into one, which then fills the explorer until the user goes back up.
	 */
	explorers: readonly FileExplorerRoot[];

	/**
	 * The header row, drawn once, for the active root's explorer. Required,
	 * with no default: return `<FileExplorerHeader explorer={active}
	 * place={place} … />` with the actions you choose, or `null` for no header
	 * at all — which is what a host that hoists those controls into its own
	 * chrome does. `place` says where it is drawn once there are several roots;
	 * at the top level, `active`'s search is the one every root shares.
	 */
	header: (active: FileExplorerApi, place?: FileExplorerPlace) => ReactNode;

	/**
	 * The overlay the new-file affordances open. Required so every consumer
	 * makes the choice explicitly; pass `null` for a browse-only explorer with
	 * no creation flow.
	 */
	newFileOverlay: ComponentType<FileExplorerNewFileOverlayProps> | null;

	/**
	 * Resolve the per-row actions for an item — glyph buttons in the row's
	 * action column, and extra context-menu entries.
	 */
	itemActions?: (
		item: FileItem,
		root: FileExplorerRoot,
	) => FileExplorerItemActions;

	/**
	 * Draw a failed listing the host's own way, such as a sign in prompt for a
	 * signed out account. Return undefined to fall back to the error message.
	 */
	renderError?: (
		error: Error | undefined,
		retry: () => void,
		root: FileExplorerRoot,
	) => ReactNode;

	/**
	 * A line to show under a listing, such as that its source stopped at a
	 * limit and holds more. Called with the items of the current directory and
	 * of each expanded one, and the directory they were listed in; return
	 * undefined for a listing with nothing to say.
	 */
	listingNote?: (
		items: FileItem[],
		path: string,
		root: FileExplorerRoot,
	) => string | undefined;

	/**
	 * How the user arranged the roots, for a host that keeps it; left out,
	 * the explorer keeps it while mounted.
	 */
	layout?: FileExplorerRootsLayout;
	/** Keep a new arrangement. */
	onLayoutChange?: (layout: FileExplorerRootsLayout) => void;

	/**
	 * The root the header and a host's own controls act on: the one the user
	 * last worked in, the first at the start. Called once it is known and
	 * whenever it changes.
	 */
	onActiveRootChange?: (
		root: FileExplorerRoot,
		explorer: FileExplorerApi,
	) => void;

	/**
	 * Each root's explorer as it mounts, and null as it unmounts, such as to
	 * refresh one root when its files change elsewhere.
	 */
	onRootExplorer?: (rootId: string, explorer: FileExplorerApi | null) => void;
}

/** What a root row's drag carries: the root's id. */
const ROOT_DRAG_DATA_TYPE = "application/x-semoss-file-explorer-root";

/** Where a dragged root row would land. */
interface RootDropTarget {
	id: string;
	side: "before" | "after";
}

/**
 * A file tree over one or more roots — asset scopes, storage, or a host's own
 * sources: browse, search, open, and (when a root allows it) create, rename,
 * move, copy, delete, upload, and download. Rows dragged from one root to
 * another are copied.
 *
 * Presentational over the explorers it is handed: a caller that needs to
 * drive a tree from outside (a toolbar, a panel chrome control, a command)
 * holds its api and calls `explorer.commands`; `onActiveRootChange` says which
 * one the user is working in.
 *
 * Not deprecated: this is the shell the workbench's `FILE_EXPLORER_PANEL`
 * renders, through `@semoss/panels`' `FileExplorerPane`. What is on its way
 * out is mounting it *directly as a page-level surface* — new code should open
 * the panel and get tabs, split, persistence, and the chrome controls with it.
 */
export const FileExplorer = ({
	explorers,
	header,
	newFileOverlay,
	itemActions,
	renderError,
	listingNote,
	layout,
	onLayoutChange,
	onActiveRootChange,
	onRootExplorer,
}: FileExplorerProps) => {
	const { t } = useTranslation("common");
	const rootsLabel = t("fileExplorer.roots");
	const rootsLayout = useFileExplorerRootsLayout({
		ids: explorers.map((root) => root.id),
		layout: layout,
		onLayoutChange: onLayoutChange,
	});
	const [apis, setApis] = useState<Readonly<Record<string, FileExplorerApi>>>(
		{},
	);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [sharedDateColWidth, setSharedDateColWidth] = useState<
		number | undefined
	>(undefined);
	const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
	const rootElements = useRef(new Map<string, HTMLDivElement>());
	const [draggingRoot, setDraggingRoot] = useState<string | null>(null);
	const [dropTarget, setDropTarget] = useState<RootDropTarget | null>(null);
	// the root the user went into, which then fills the explorer
	const [enteredId, setEnteredId] = useState<string | null>(null);
	// the top level's one search, which every root runs its own way
	const [rootsSearch, setRootsSearch] = useState("");
	const [isRootsSearchOpen, setIsRootsSearchOpen] = useState(false);

	const ordered = rootsLayout.order.flatMap(
		(id) => explorers.find((root) => root.id === id) ?? [],
	);
	const entered =
		ordered.length > 1
			? ordered.find((root) => root.id === enteredId)
			: undefined;
	const active =
		entered ?? ordered.find((root) => root.id === activeId) ?? ordered[0];
	const activeApi = active ? apis[active.id] : undefined;

	/**
	 * Run the top level's search in every root, or clear it.
	 *
	 * @param term - What to look for; empty clears it.
	 */
	const searchRoots = (term: string) => {
		setRootsSearch(term);
		for (const api of Object.values(apis)) {
			api.header.setSearchType("all");
			api.header.setSearch(term);
		}
	};

	// the top level's header, read live by the explorer it is drawn with
	const rootsHeader = useRef<FileExplorerHeaderState | null>(null);
	rootsHeader.current = {
		path: "/",
		crumbs: [rootsLabel],
		search: rootsSearch,
		setSearch: searchRoots,
		searchType: "all",
		setSearchType: () => undefined,
		isSearchOpen: isRootsSearchOpen,
		setIsSearchOpen: setIsRootsSearchOpen,
		showSearch: isRootsSearchOpen || Boolean(rootsSearch),
	};
	const rootsExplorer = useMemo(
		() =>
			activeApi
				? decorateExplorer(activeApi, {}, (live) =>
						rootsHeader.current ? rootsHeader.current : live.header,
					)
				: undefined,
		[activeApi],
	);

	// the host's callbacks, read when they fire, so a new function each
	// render does not re-register every root
	const latest = useRef({ explorers, onActiveRootChange, onRootExplorer });
	latest.current = { explorers, onActiveRootChange, onRootExplorer };

	const handleExplorer = useCallback(
		(id: string, explorer: FileExplorerApi | null) => {
			setApis((previous) => {
				if (explorer) {
					return previous[id] === explorer
						? previous
						: { ...previous, [id]: explorer };
				}
				const { [id]: _removed, ...rest } = previous;
				return rest;
			});
			latest.current.onRootExplorer?.(id, explorer);
		},
		[],
	);

	const activeRootId = active?.id;
	useEffect(() => {
		const root = latest.current.explorers.find(
			(candidate) => candidate.id === activeRootId,
		);
		if (root && activeApi) {
			latest.current.onActiveRootChange?.(root, activeApi);
		}
	}, [activeRootId, activeApi]);

	const handleActivate = useCallback(
		(id: string) => {
			if (id === activeRootId) {
				return;
			}
			// a root becoming active takes the width the others show, so the
			// column does not jump
			if (sharedDateColWidth !== undefined) {
				apis[id]?.tree.setDateColWidth(sharedDateColWidth);
			}
			setActiveId(id);
		},
		[activeRootId, apis, sharedDateColWidth],
	);

	if (ordered.length === 0) {
		return null;
	}

	/**
	 * Go into a root, so it fills the explorer. The top level's search ends,
	 * as a file manager's does on opening a folder.
	 *
	 * @param id - The root.
	 */
	const enterRoot = (id: string) => {
		if (rootsSearch) {
			searchRoots("");
		}
		setIsRootsSearchOpen(false);
		setActiveId(id);
		setEnteredId(id);
	};

	/** Go back up to the top level, where the root shows from its own top. */
	const exitRoot = () => {
		const api = enteredId ? apis[enteredId] : undefined;
		if (api) {
			api.header.setSearch("");
			api.header.setIsSearchOpen(false);
			api.commands.navigateTo("/");
		}
		setEnteredId(null);
	};

	/** What every root is handed, whatever built its explorer. */
	const sectionProps = (
		root: FileExplorerRoot,
		isOnly: boolean,
	): Omit<FileExplorerRootSectionProps, "root" | "row"> => ({
		isOnly: isOnly,
		isActive: root.id === active?.id,
		headerSlot: headerSlot,
		header: header,
		place:
			ordered.length === 1
				? undefined
				: isOnly
					? {
							level: "root",
							rootName: root.name,
							label: rootsLabel,
							onExit: exitRoot,
						}
					: { level: "roots", label: rootsLabel },
		headerExplorer: isOnly ? undefined : rootsExplorer,
		dateColWidth: sharedDateColWidth,
		onDateColWidthChange: setSharedDateColWidth,
		onExplorer: handleExplorer,
		onActivate: handleActivate,
		newFileOverlay: newFileOverlay,
		itemActions: itemActions,
		renderError: renderError,
		listingNote: listingNote,
	});

	/**
	 * Move a root one place, keeping focus on its row as it goes.
	 *
	 * @param id - The root.
	 * @param offset - -1 for up, 1 for down.
	 */
	const moveRootBy = (id: string, offset: -1 | 1) => {
		rootsLayout.move(id, rootsLayout.order.indexOf(id) + offset);
		requestAnimationFrame(() =>
			rootElements.current
				.get(id)
				?.querySelector<HTMLButtonElement>("[data-root-toggle]")
				?.focus(),
		);
	};

	/**
	 * Where a dragged row would land over a root: before it in its upper half,
	 * after it in its lower half.
	 *
	 * @param e - The drag over the root.
	 * @param id - The root.
	 * @returns Where it lands, or null for a drag that is not a root row's.
	 */
	const getDropTarget = (
		e: DragEvent<HTMLDivElement>,
		id: string,
	): RootDropTarget | null => {
		if (
			!draggingRoot ||
			draggingRoot === id ||
			!e.dataTransfer.types.includes(ROOT_DRAG_DATA_TYPE)
		) {
			return null;
		}

		const rect = e.currentTarget.getBoundingClientRect();
		return {
			id: id,
			side: e.clientY < rect.top + rect.height / 2 ? "before" : "after",
		};
	};

	const endRootDrag = () => {
		setDraggingRoot(null);
		setDropTarget(null);
	};

	const renderRoot = (root: FileExplorerRoot, isOnly: boolean) => {
		const row = {
			// a search opens every root, to show what it found there
			isExpanded: Boolean(rootsSearch) || rootsLayout.isExpanded(root.id),
			onToggle: () => rootsLayout.toggle(root.id),
			onEnter: () => enterRoot(root.id),
			onDragStart: (e: DragEvent<HTMLDivElement>) => {
				// a host's dock never sees it, and the trees leave its type
				// alone
				e.stopPropagation();
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData(ROOT_DRAG_DATA_TYPE, root.id);
				setDraggingRoot(root.id);
			},
			onDragEnd: endRootDrag,
			onMove: (offset: -1 | 1) => moveRootBy(root.id, offset),
		};

		return (
			<FileExplorerRootSection
				{...sectionProps(root, isOnly)}
				root={root}
				row={row}
			/>
		);
	};

	if (ordered.length === 1) {
		return renderRoot(ordered[0], true);
	}

	if (entered) {
		return renderRoot(entered, true);
	}

	return (
		<div
			data-testid="file-explorer-roots"
			className="relative flex size-full flex-col overflow-hidden bg-background py-1"
			// every root's rows and the one column header read this width
			style={
				sharedDateColWidth === undefined
					? undefined
					: ({
							"--date-col-width": `${sharedDateColWidth}px`,
						} as CSSProperties)
			}
		>
			<div ref={setHeaderSlot} className="flex shrink-0 flex-col" />
			{/* the roots take the height their rows need, one after another,
			    and scroll together, as in a file manager */}
			<ScrollArea className="min-h-0 flex-1">
				{ordered.map((root) => {
					const dropSide =
						dropTarget?.id === root.id ? dropTarget.side : null;

					return (
						// biome-ignore lint/a11y/noStaticElementInteractions: a drop zone for a root row's drag; Alt+Up and Alt+Down on the row move it from the keyboard
						<div
							key={root.id}
							ref={(element) => {
								if (element) {
									rootElements.current.set(root.id, element);
								} else {
									rootElements.current.delete(root.id);
								}
							}}
							data-testid={`file-explorer-root-${root.id}`}
							className={cn(
								"relative flex flex-col",
								draggingRoot === root.id && "opacity-60",
							)}
							onDragOver={(e) => {
								const target = getDropTarget(e, root.id);
								if (!target) {
									return;
								}

								e.preventDefault();
								e.dataTransfer.dropEffect = "move";
								if (
									dropTarget?.id !== target.id ||
									dropTarget.side !== target.side
								) {
									setDropTarget(target);
								}
							}}
							onDragLeave={(e) => {
								if (
									e.relatedTarget instanceof Node &&
									e.currentTarget.contains(e.relatedTarget)
								) {
									return;
								}

								setDropTarget((previous) =>
									previous?.id === root.id ? null : previous,
								);
							}}
							onDrop={(e) => {
								const target = getDropTarget(e, root.id);
								if (!target || !draggingRoot) {
									return;
								}

								e.preventDefault();
								const rest = rootsLayout.order.filter(
									(id) => id !== draggingRoot,
								);
								rootsLayout.move(
									draggingRoot,
									rest.indexOf(target.id) +
										(target.side === "after" ? 1 : 0),
								);
								endRootDrag();
							}}
						>
							{dropSide ? (
								<div
									aria-hidden
									className={cn(
										"pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-primary",
										dropSide === "before"
											? "top-0"
											: "bottom-0",
									)}
								/>
							) : null}
							{renderRoot(root, false)}
						</div>
					);
				})}
			</ScrollArea>
		</div>
	);
};
