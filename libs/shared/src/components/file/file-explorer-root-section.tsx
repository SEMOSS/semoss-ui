import {
	type ComponentType,
	type DragEvent,
	type ReactNode,
	useEffect,
	useId,
} from "react";
import { createPortal } from "react-dom";
import { cn, Separator } from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerItemActions,
	FileExplorerNewFileOverlayProps,
} from "./file-explorer.types";
import { FileExplorerColumnHeader } from "./file-explorer-column-header";
import type {
	FileExplorerPlace,
	FileExplorerRoot,
} from "./file-explorer-root.types";
import { FileExplorerRootRow } from "./file-explorer-root-row";
import { FileExplorerTree } from "./file-explorer-tree";

/** What a root's row does, from {@link FileExplorer}'s layout. */
export interface FileExplorerRootRowState {
	isExpanded: boolean;
	onToggle: () => void;
	/** Go into the root, so it fills the explorer. */
	onEnter: () => void;
	onDragStart: (e: DragEvent<HTMLDivElement>) => void;
	onDragEnd: () => void;
	onMove: (offset: -1 | 1) => void;
}

/** Props for {@link FileExplorerRootSection}. */
export interface FileExplorerRootSectionProps {
	root: FileExplorerRoot;
	/**
	 * The root fills the explorer, as its only root or the one the user went
	 * into: no row, and the header drawn in place. Else the root has a row at
	 * the top level, and while it is active its header is drawn into
	 * `headerSlot`.
	 */
	isOnly: boolean;
	isActive: boolean;
	/** Where the active root draws the explorer's one header. */
	headerSlot: HTMLElement | null;
	header: (active: FileExplorerApi, place?: FileExplorerPlace) => ReactNode;
	/** Where the header is drawn; none for an explorer with one root. */
	place?: FileExplorerPlace;
	/**
	 * The explorer the header acts on in place of the root's own, such as one
	 * whose search every root at the top level shares.
	 */
	headerExplorer?: FileExplorerApi;
	/** The row's state; unused for the only root. */
	row: FileExplorerRootRowState;
	/** The date column width every root shares, in px. */
	dateColWidth: number | undefined;
	onDateColWidthChange: (width: number) => void;
	onExplorer: (id: string, explorer: FileExplorerApi | null) => void;
	onActivate: (id: string) => void;
	newFileOverlay: ComponentType<FileExplorerNewFileOverlayProps> | null;
	itemActions?: (
		item: FileItem,
		root: FileExplorerRoot,
	) => FileExplorerItemActions;
	renderError?: (
		error: Error | undefined,
		retry: () => void,
		root: FileExplorerRoot,
	) => ReactNode;
	listingNote?: (
		items: FileItem[],
		path: string,
		root: FileExplorerRoot,
	) => string | undefined;
}

/**
 * One root of a `FileExplorer`: its row and its tree. It tells the explorer
 * its api, becomes the active root when the user works in it, and while it is
 * active draws the explorer's header, so the header follows the root's state.
 *
 * @param props - The root, its explorer, and its place in the explorer.
 * @returns The root.
 */
export const FileExplorerRootSection = ({
	root,
	isOnly,
	isActive,
	headerSlot,
	header,
	place,
	headerExplorer,
	row,
	dateColWidth,
	onDateColWidthChange,
	onExplorer,
	onActivate,
	newFileOverlay,
	itemActions,
	renderError,
	listingNote,
}: FileExplorerRootSectionProps) => {
	const contentId = useId();
	const { explorer } = root;
	const ownWidth = explorer.tree.dateColWidth;

	useEffect(() => {
		onExplorer(root.id, explorer);
		return () => onExplorer(root.id, null);
	}, [root.id, explorer, onExplorer]);

	// the active root's column header resizes its own tree; the others follow
	useEffect(() => {
		if (isActive) {
			onDateColWidthChange(ownWidth);
		}
	}, [isActive, ownWidth, onDateColWidthChange]);

	const tree = (
		<FileExplorerTree
			explorer={explorer}
			chrome={
				isOnly ? (
					<>
						{header(explorer, place)}
						<Separator className="mt-1" />
					</>
				) : null
			}
			columnHeader={
				isOnly ? <FileExplorerColumnHeader explorer={explorer} /> : null
			}
			className={isOnly ? "py-1" : undefined}
			height={isOnly ? "fill" : "natural"}
			dateColWidth={isOnly ? undefined : dateColWidth}
			newFileOverlay={newFileOverlay}
			itemActions={
				itemActions ? (item) => itemActions(item, root) : undefined
			}
			renderError={
				renderError
					? (error, retry) => renderError(error, retry, root)
					: undefined
			}
			emptyState={root.emptyState}
			// at the top level, opening a folder goes into its root, there
			onEnterDirectory={
				isOnly
					? undefined
					: (item) => {
							explorer.tree.enterDirectory(item);
							row.onEnter();
						}
			}
			onExitRoot={place?.level === "root" ? place.onExit : undefined}
			onOpenSearch={
				headerExplorer && !isOnly
					? () => headerExplorer.header.setIsSearchOpen(true)
					: undefined
			}
			listingNote={
				root.listingNote || listingNote
					? (items, path) =>
							root.listingNote?.(items, path) ??
							listingNote?.(items, path, root)
					: undefined
			}
		/>
	);

	if (isOnly) {
		return tree;
	}

	return (
		<div
			className="flex flex-col"
			onFocusCapture={() => onActivate(root.id)}
			onPointerDownCapture={() => onActivate(root.id)}
		>
			<FileExplorerRootRow
				name={root.name}
				actions={root.actions}
				isExpanded={row.isExpanded}
				onToggle={row.onToggle}
				onEnter={row.onEnter}
				controls={contentId}
				onDragStart={row.onDragStart}
				onDragEnd={row.onDragEnd}
				onMove={row.onMove}
			/>
			{/* stays mounted while closed, so its open folders survive */}
			{/* indented one level under its row, as a folder's contents are */}
			<div
				id={contentId}
				className={cn("relative ps-4", !row.isExpanded && "hidden")}
			>
				{tree}
			</div>
			{isActive && headerSlot
				? createPortal(
						<>
							{header(headerExplorer ?? explorer, place)}
							<Separator className="mt-1" />
							<FileExplorerColumnHeader explorer={explorer} />
						</>,
						headerSlot,
					)
				: null}
		</div>
	);
};
