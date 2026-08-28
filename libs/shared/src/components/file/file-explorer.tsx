import { CircleHelpIcon } from "lucide-react";
import type React from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Muted,
	ScrollArea,
	ScrollBar,
	Separator,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeView,
} from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerItemActions,
	FileExplorerNewFileOverlayProps,
} from "./file-explorer.types";
import {
	ensureDirectoryPath,
	getFileExplorerTestIdSegment,
} from "./file-explorer.utils";
import { FileExplorerContextMenu } from "./file-explorer-context-menu";
import { FileExplorerItem } from "./file-explorer-item";

export interface FileExplorerProps {
	/** The explorer state, from `useFileExplorer`. */
	explorer: FileExplorerApi;

	/**
	 * The header row. Required, with no default: pass
	 * `<FileExplorerHeader explorer={explorer} actions={…} />` and choose the
	 * actions yourself, or `null` for no header at all — which is what a host
	 * that hoists those controls into its own chrome does.
	 */
	header: React.ReactNode;

	/**
	 * The overlay the new-file affordances open. Required so every consumer
	 * makes the choice explicitly; pass `null` for a browse-only explorer with
	 * no creation flow.
	 */
	newFileOverlay: React.ComponentType<FileExplorerNewFileOverlayProps> | null;

	/**
	 * Resolve the per-row actions for an item — glyph buttons in the row's
	 * action column, and extra context-menu entries.
	 */
	itemActions?: (item: FileItem) => FileExplorerItemActions;
}

/**
 * A file tree over one asset scope: browse, search, open, and (when the mode
 * allows it) create, rename, move, copy, delete, upload, and download.
 *
 * This component is presentational — `useFileExplorer` owns the state, so a
 * consumer that needs to drive the explorer from outside (a toolbar, a panel
 * chrome control, a command) holds the same api object and calls
 * `explorer.commands`.
 */
export const FileExplorer: React.FC<FileExplorerProps> = ({
	explorer,
	header,
	newFileOverlay: NewFileOverlayComponent,
	itemActions,
}) => {
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

	const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
		if (e.key !== "Escape") return;
		tree.closeContextMenu();
		commands.clearSelection();
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix accessibility issues
		<div
			data-testid="file-explorer"
			data-file-explorer={explorer.instanceId}
			className="relative flex h-full w-full flex-col overflow-hidden bg-background py-1"
			// the resizable column's width is a runtime px value, so it is
			// published once as a custom property here and read back as
			// `w-[var(--date-col-width)]` by the header and every row — the one
			// thing a utility class cannot express
			style={
				{
					"--date-col-width": `${tree.dateColWidth}px`,
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
				if (!capabilities.mutate) return;
				tree.openContextMenu(e, null, ensureDirectoryPath(path));
			}}
		>
			{header}

			<Separator className="mt-1" />

			<div
				className={cn(
					"relative flex min-h-0 flex-1 flex-col",
					// a row-level dragover zeroes `moveDropCount`, so this and a
					// ringed drop-target row are never lit at the same time
					dnd.moveDropCount > 0 &&
						"rounded-md ring-2 ring-primary ring-inset",
				)}
			>
				<div className="flex select-none items-center border-b px-2 text-[11px] text-muted-foreground">
					<div className="flex min-w-[80px] flex-1 items-center gap-1 overflow-hidden">
						<span className="overflow-hidden truncate font-medium">
							{t("fileExplorer.name")}
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									data-testid="file-explorer-bulk-shortcuts-button"
									variant="ghost"
									size="icon-sm"
									aria-label={t(
										"fileExplorer.bulkShortcutsAria",
									)}
									className="shrink-0"
								>
									<CircleHelpIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("fileExplorer.bulkShortcutsTooltip")}
							</TooltipContent>
						</Tooltip>
					</div>
					<div
						data-testid="file-explorer-date-column-resizer"
						role="slider"
						aria-orientation="vertical"
						aria-label={t("fileExplorer.resizeDateColumn")}
						aria-valuemin={100}
						aria-valuemax={280}
						aria-valuenow={tree.dateColWidth}
						tabIndex={0}
						className="group flex cursor-col-resize items-center self-stretch px-2 focus:outline-none"
						onMouseDown={tree.onDividerMouseDown}
						onKeyDown={(e) => {
							// Match the mouse handler: in RTL the column is
							// on the leading edge, so arrow-key direction is
							// inverted relative to LTR.
							const target = e.currentTarget as HTMLElement;
							const isRtl =
								target.closest("[dir]")?.getAttribute("dir") ===
									"rtl" ||
								getComputedStyle(target).direction === "rtl";
							const grow = isRtl
								? e.key === "ArrowRight"
								: e.key === "ArrowLeft";
							const shrink = isRtl
								? e.key === "ArrowLeft"
								: e.key === "ArrowRight";
							if (grow) {
								tree.setDateColWidth((w) =>
									Math.min(280, w + 8),
								);
							} else if (shrink) {
								tree.setDateColWidth((w) =>
									Math.max(100, w - 8),
								);
							}
						}}
					>
						<div className="h-full w-px bg-border transition-colors group-hover:bg-primary/70" />
					</div>
					{/* reads the same custom property the rows do, so the
					    header and the column can never drift */}
					<span className="w-[var(--date-col-width,100px)] overflow-hidden truncate px-2 text-end font-medium">
						{t("fileExplorer.dateModified")}
					</span>
				</div>

				<ScrollArea className="[&>div>div]:block! h-full min-h-0 w-full flex-1">
					{showFullSpinner && (
						<div className="flex items-center justify-center py-16">
							<Spinner />
						</div>
					)}

					{tree.status === "ERROR" && (
						<div className="flex items-center justify-center py-16">
							<Muted className="text-destructive">
								{tree.error?.message ||
									t("fileExplorer.failedToLoadFiles")}
							</Muted>
						</div>
					)}

					{showTree && (
						<TreeView<FileItem>
							data-testid="file-explorer-tree"
							className="w-full"
							expanded={tree.expandedPaths}
							onExpandChange={(paths) =>
								tree.setExpandedPaths(paths)
							}
							onKeyDown={(e) => {
								if (!(e.ctrlKey || e.metaKey)) return;

								if (e.key.toLowerCase() === "a") {
									e.preventDefault();
									commands.selectAllVisible();
									return;
								}

								if (e.key.toLowerCase() === "f") {
									e.preventDefault();
									explorer.header.setIsSearchOpen(true);
								}
							}}
							onItemSelect={tree.selectItem}
							onItemDoubleClick={tree.enterDirectory}
						>
							{tree.items.map((item) => (
								<FileExplorerItem
									key={item.path}
									data-testid={`file-explorer-item-${getFileExplorerTestIdSegment(item.path)}`}
									explorer={explorer}
									item={item}
									itemActions={itemActions}
								/>
							))}
						</TreeView>
					)}

					{showTree && tree.items.length === 0 && (
						<div className="flex items-center justify-center py-8">
							<Muted>
								{search
									? t("fileExplorer.noResults")
									: t("fileExplorer.emptyFolder")}
							</Muted>
						</div>
					)}
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
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

			{NewFileOverlayComponent && capabilities.mutate && (
				<NewFileOverlayComponent
					key={newFile.instance}
					mode={explorer.mode}
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
