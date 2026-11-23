import type {
	ComponentType,
	CSSProperties,
	KeyboardEvent as ReactKeyboardEvent,
	ReactNode,
} from "react";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	Muted,
	ScrollArea,
	ScrollBar,
	Spinner,
	TreeView,
} from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import { canCreateItems } from "./file-explorer.adapters";
import type {
	FileExplorerApi,
	FileExplorerItemActions,
	FileExplorerNewFileOverlayProps,
} from "./file-explorer.types";
import {
	ensureDirectoryPath,
	getFileExplorerTestIdSegment,
	getParentPath,
} from "./file-explorer.utils";
import { FileExplorerContextMenu } from "./file-explorer-context-menu";
import { FileExplorerItem } from "./file-explorer-item";

/** Props for {@link FileExplorerTree}. */
interface FileExplorerTreeProps {
	explorer: FileExplorerApi;
	/** Above the list, inside the tree's drop zone: a header, or nothing. */
	chrome: ReactNode;
	/** The column header, in the list's frame, or nothing. */
	columnHeader: ReactNode;
	newFileOverlay: ComponentType<FileExplorerNewFileOverlayProps> | null;
	itemActions?: (item: FileItem) => FileExplorerItemActions;
	renderError?: (error: Error | undefined, retry: () => void) => ReactNode;
	listingNote?: (items: FileItem[], path: string) => string | undefined;
	/**
	 * Opening a folder by double-click, in place of the tree's own, such as
	 * one that also enters the folder's root in a `FileExplorer` with several.
	 */
	onEnterDirectory?: (item: FileItem) => void;
	/** Backspace at the tree's own top: leave it, such as for the top level. */
	onExitRoot?: () => void;
	/**
	 * Ctrl or Cmd+F, in place of opening the tree's own search, such as the
	 * one search every root at the top level shares.
	 */
	onOpenSearch?: () => void;
	/** What the top level shows when it holds nothing; else that it is empty. */
	emptyState?: ReactNode;
	/** A date column width shared with other trees, in px; else its own. */
	dateColWidth?: number;
	/**
	 * `fill`: the tree takes its container's height and scrolls itself.
	 * `natural`: it is as tall as its rows, for a list of trees that scrolls
	 * together.
	 */
	height: "fill" | "natural";
	className?: string;
}

/**
 * One explorer's tree: its list, drop zone, context menu, and new-file
 * overlay. `FileExplorer` renders one per root.
 *
 * @param props - The explorer and what goes around its list.
 * @returns The tree.
 */
export const FileExplorerTree = ({
	explorer,
	chrome,
	columnHeader,
	newFileOverlay: NewFileOverlayComponent,
	itemActions,
	renderError,
	listingNote,
	emptyState,
	onEnterDirectory,
	onExitRoot,
	onOpenSearch,
	dateColWidth,
	height,
	className,
}: FileExplorerTreeProps) => {
	const { t } = useTranslation("common");
	const { capabilities, commands, dnd, newFile, tree } = explorer;
	const { path, search } = explorer.header;

	// a search's debounce reloads `tree.items` on every keystroke; a full-page
	// spinner would otherwise blank the list between them, so it only takes
	// over while there is nothing retained yet to show underneath it
	const showFullSpinner =
		tree.isUploading ||
		(tree.status === "LOADING" && tree.items.length === 0);
	const showTree =
		!showFullSpinner &&
		!tree.isUploading &&
		(tree.status === "SUCCESS" || tree.status === "LOADING");
	const rootNote = showTree ? listingNote?.(tree.items, path) : undefined;

	const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
		if (e.key !== "Escape") return;
		tree.closeContextMenu();
		commands.clearSelection();
	};

	// the list and its states, in its own scroll area or not
	const listing = (
		<>
			{showFullSpinner && (
				<div className="flex items-center justify-center py-16">
					<Spinner />
				</div>
			)}

			{tree.status === "ERROR" &&
				(renderError?.(tree.error, () => commands.refresh()) ?? (
					<div className="flex items-center justify-center py-16">
						<Muted className="text-destructive">
							{tree.error?.message ||
								t("fileExplorer.failedToLoadFiles")}
						</Muted>
					</div>
				))}

			{showTree && (
				<TreeView<FileItem>
					data-testid="file-explorer-tree"
					className="w-full"
					expanded={tree.expandedPaths}
					onExpandChange={(paths) => tree.setExpandedPaths(paths)}
					onKeyDown={(e) => {
						// Backspace goes up a folder, as in a file manager, and
						// from the tree's own top out of it; never while typing
						if (
							e.key === "Backspace" &&
							!(e.ctrlKey || e.metaKey || e.altKey) &&
							!(e.target instanceof HTMLInputElement)
						) {
							e.preventDefault();
							if (path === "/") {
								onExitRoot?.();
							} else {
								commands.navigateTo(getParentPath(path));
							}
							return;
						}

						if (!(e.ctrlKey || e.metaKey)) return;

						if (e.key.toLowerCase() === "a") {
							e.preventDefault();
							commands.selectAllVisible();
							return;
						}

						if (e.key.toLowerCase() === "f") {
							e.preventDefault();
							if (onOpenSearch) {
								onOpenSearch();
							} else {
								explorer.header.setIsSearchOpen(true);
							}
						}
					}}
					onItemSelect={tree.selectItem}
					onItemDoubleClick={onEnterDirectory ?? tree.enterDirectory}
				>
					{tree.items.map((item) => (
						<FileExplorerItem
							key={item.path}
							data-testid={`file-explorer-item-${getFileExplorerTestIdSegment(item.path)}`}
							explorer={explorer}
							item={item}
							itemActions={itemActions}
							listingNote={listingNote}
						/>
					))}
				</TreeView>
			)}

			{showTree && tree.items.length === 0 && (
				// a root among others says so in a line under its row
				<div
					className={cn(
						"flex items-center",
						height === "fill" ? "justify-center py-8" : "px-2 py-1",
					)}
				>
					{!search && path === "/" && emptyState ? (
						emptyState
					) : (
						<Muted
							className={
								height === "fill" ? undefined : "text-xs"
							}
						>
							{search
								? t("fileExplorer.noResults")
								: t("fileExplorer.emptyFolder")}
						</Muted>
					)}
				</div>
			)}

			{rootNote ? (
				<Muted
					data-testid="file-explorer-listing-note"
					className="flex items-center justify-center px-3 py-2 text-center text-xs"
				>
					{rootNote}
				</Muted>
			) : null}
		</>
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix accessibility issues
		<div
			data-testid="file-explorer"
			data-file-explorer={explorer.instanceId}
			className={cn(
				"relative flex w-full flex-col bg-background",
				height === "fill" && "h-full overflow-hidden",
				className,
			)}
			// the resizable column's width is a runtime px value, so it is
			// published once as a custom property here and read back as
			// `w-(--date-col-width)` by the header and every row — the one
			// thing a utility class cannot express
			style={
				{
					"--date-col-width": `${dateColWidth ?? tree.dateColWidth}px`,
				} as CSSProperties
			}
			onDrop={dnd.onRootDrop}
			onDragOver={dnd.onRootDragOver}
			onDragLeave={dnd.onRootDragLeave}
			onClick={() => {
				tree.closeContextMenu();
				commands.clearSelection();
			}}
			onKeyDown={handleKeyDown}
			onContextMenu={(e) => {
				tree.openContextMenu(e, null, ensureDirectoryPath(path));
			}}
		>
			{chrome}

			<div
				className={cn(
					"relative flex flex-col",
					height === "fill" && "min-h-0 flex-1",
					// a row-level dragover zeroes `moveDropCount`, so this and a
					// ringed drop-target row are never lit at the same time
					dnd.moveDropCount > 0 &&
						"rounded-md ring-2 ring-primary ring-inset",
				)}
			>
				{columnHeader}

				{height === "fill" ? (
					<ScrollArea className="[&>div>div]:block! h-full min-h-0 w-full flex-1">
						{listing}
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				) : (
					listing
				)}
			</div>

			{dnd.isDraggingExternal && (
				<div
					data-testid="file-explorer-upload-drop-zone"
					className="absolute inset-0 flex items-center justify-center bg-accent/50 p-4 text-accent-foreground"
				>
					<Muted>
						{t("fileExplorer.uploadDropHint", { path: path })}
					</Muted>
				</div>
			)}

			{NewFileOverlayComponent &&
				(canCreateItems(capabilities) || capabilities.upload) && (
					<NewFileOverlayComponent
						key={newFile.instance}
						mode={explorer.mode}
						adapter={explorer.adapter}
						source={explorer.source}
						path={newFile.path}
						open={newFile.isOpen}
						action={newFile.action}
						onClose={newFile.close}
					/>
				)}

			{tree.contextMenu && (
				<FileExplorerContextMenu
					explorer={explorer}
					state={tree.contextMenu}
				/>
			)}
		</div>
	);
};
