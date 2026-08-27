import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	cn,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeViewItem,
	useTreeView,
} from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerItemActions,
	FileExplorerPrimaryAction,
	FileExplorerSecondaryAction,
} from "./file-explorer.types";
import {
	canMoveItemToDirectory,
	getFileExplorerTestIdSegment,
	getFileIconComponent,
	getItemTargetDirectory,
	isPointerOutsideElement,
	parseExplorerDragItems,
} from "./file-explorer.utils";

/**
 * Worst-case string widths at text-11px (~7px/char + 16px column padding px-2):
 *   numeric          "1/23/26"           8  chars  72px   → threshold  80px
 *   numeric+time     "1/23/26, 10:55 PM" 18 chars 142px   → threshold 150px
 *   short+time       "Sep 30, 2026 at 10:55 PM" 24 chars 184px → threshold 195px
 *   long+time        "September 30, 2026 at 10:55 PM" 30 chars 226px → threshold 235px
 *
 * The `t` translator is passed in so phrases like "Yesterday at {time}" and
 * weekday names use the user's active locale rather than hardcoded English.
 * `locale` is `i18n.language` and feeds `Intl.DateTimeFormat` for the
 * numeric/month-name pieces so date numerals also match (e.g. ٢٥/١٢/٢٦ in
 * Arabic).
 *
 * @param raw - The item's `lastModified`, if it has one.
 * @param width - The date column's current width in px.
 * @param t - The active translator.
 * @param locale - `i18n.language`, for `Intl` formatting.
 * @return The formatted date, or null when there is nothing to format.
 */
const formatMacDate = (
	raw: string | undefined,
	width = 170,
	t: (key: string, opts?: Record<string, unknown>) => string,
	locale: string,
): string | null => {
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
	const time = date.toLocaleTimeString(locale, {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	// Today: show relative elapsed time (2h ago, 5 min ago, Just now)
	if (diffDays === 0) {
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		if (diffMins < 1) return t("fileExplorer.dateFormat.justNow");
		if (diffMins < 60)
			return width < 150
				? t("fileExplorer.dateFormat.minutesAgoShort", {
						count: diffMins,
					})
				: t("fileExplorer.dateFormat.minutesAgo", { count: diffMins });
		return width < 150
			? t("fileExplorer.dateFormat.hoursAgoShort", { count: diffHours })
			: t("fileExplorer.dateFormat.hoursAgo", { count: diffHours });
	}
	if (diffDays === 1)
		return width < 150
			? t("fileExplorer.dateFormat.yesterday")
			: t("fileExplorer.dateFormat.yesterdayAt", { time });
	if (diffDays < 7) {
		const day = date.toLocaleDateString(locale, { weekday: "short" });
		return width < 150
			? day
			: t("fileExplorer.dateFormat.dayAt", { day, time });
	}

	// Absolute thresholds — guarantee worst-case fits without truncation
	if (width < 150)
		return date.toLocaleDateString(locale, {
			month: "numeric",
			day: "numeric",
			year: "2-digit",
		});
	if (width < 195) {
		const d = date.toLocaleDateString(locale, {
			month: "numeric",
			day: "numeric",
			year: "2-digit",
		});
		return t("fileExplorer.dateFormat.dateAndTime", { date: d, time });
	}
	if (width < 235) {
		const d = date.toLocaleDateString(locale, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
		return t("fileExplorer.dateFormat.dateAt", { date: d, time });
	}
	const d = date.toLocaleDateString(locale, {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
	return t("fileExplorer.dateFormat.dateAt", { date: d, time });
};

export interface FileExplorerItemProps
	extends React.HTMLAttributes<HTMLLIElement> {
	/** The explorer this row belongs to. */
	explorer: FileExplorerApi;
	/** The row's item. */
	item: FileItem;
	/**
	 * Resolve the row actions for an item. Called for this row and passed down
	 * to its descendants, so a consumer supplies it once.
	 */
	itemActions?: (item: FileItem) => FileExplorerItemActions;
}

/**
 * One row of the explorer tree, and — for a directory — its expanded children.
 *
 * Everything shared with the rest of the explorer (selection, context menu,
 * rename mode, drag state, the date column width) comes off `explorer`, so this
 * component takes no plumbing props and a consumer only supplies `itemActions`.
 */
export const FileExplorerItem: React.FC<FileExplorerItemProps> = ({
	explorer,
	item,
	itemActions,
	...otherProps
}) => {
	const treeView = useTreeView<FileItem>();
	const insight = useInsight();
	const { t, i18n } = useTranslation("common");
	const { adapter, capabilities, commands, dnd, tree } = explorer;

	const isDirectory = item.type === "directory";
	const isExpanded = treeView.expanded.includes(item.path);
	const itemTestId = `file-explorer-item-${getFileExplorerTestIdSegment(item.path)}`;

	// consumers build these arrays conditionally, so nulls are expected
	const resolvedActions = itemActions?.(item);
	const actions = (resolvedActions?.actions ?? []).filter(
		(action): action is FileExplorerPrimaryAction => action !== null,
	);
	const secondaryActions = (resolvedActions?.secondaryActions ?? []).filter(
		(action): action is FileExplorerSecondaryAction => action !== null,
	);

	const isRenaming = tree.renamingPath === item.path;
	const [renameValue, setRenameValue] = useState(item.name);
	const [isDraggingSource, setIsDraggingSource] = useState(false);
	const [draggedItemCount, setDraggedItemCount] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isRenaming) return;
		setRenameValue(item.name);
		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	}, [isRenaming, item.name]);

	useEffect(() => {
		tree.registerItem(item, true);
		return () => tree.registerItem(item, false);
	}, [item, tree.registerItem]);

	// Only fetch children if expanded and is a directory
	const getChildrenPixel =
		isDirectory && isExpanded ? adapter.browse(item.path) : "";

	const getChildren = usePixel<unknown[]>(
		getChildrenPixel,
		{ data: [] },
		insight.insightId,
	);

	const children = useMemo(
		() => adapter.mapEntries(getChildren.data),
		[adapter, getChildren.data],
	);

	useEffect(() => {
		if (!isDirectory) return;

		tree.registerDirectoryRefresh(item.path, getChildren.refresh, true);
		return () => {
			tree.registerDirectoryRefresh(
				item.path,
				getChildren.refresh,
				false,
			);
		};
	}, [
		getChildren.refresh,
		isDirectory,
		item.path,
		tree.registerDirectoryRefresh,
	]);

	const macDate = formatMacDate(
		item.lastModified,
		tree.dateColWidth,
		t,
		i18n.language,
	);

	const FileIcon = isDirectory ? null : getFileIconComponent(item.name);

	const isContextActive = tree.isContextActive(item.path);
	const isBulkSelected = tree.isBulkSelected(item.path);
	const isActiveDropTarget = dnd.activeDropTargetPath === item.path;

	/**
	 * The items a drag is carrying.
	 *
	 * @param dataTransfer - The in-flight drag's data transfer.
	 * @return The dragged items, or `[]` for a drag from another explorer.
	 */
	const currentDragItems = (dataTransfer: DataTransfer) =>
		dnd.activeDragItems.length > 0
			? dnd.activeDragItems
			: parseExplorerDragItems(dataTransfer, explorer.instanceId);

	/**
	 * Whether this row is a legal destination for what is being dragged. Only
	 * directories take drops, and never from inside themselves.
	 *
	 * @param draggedItems - The items in flight.
	 * @return True when at least one of them may land here.
	 */
	const canDropDraggedItems = (draggedItems: FileItem[]) => {
		if (!dnd.enabled || !isDirectory || draggedItems.length === 0) {
			return false;
		}

		const targetDirectory = getItemTargetDirectory(item);
		return draggedItems.some((draggedItem) =>
			canMoveItemToDirectory(draggedItem, targetDirectory),
		);
	};

	return (
		<TreeViewItem
			data-testid={itemTestId}
			id={item.path}
			item={item}
			loading={getChildren.status === "LOADING"}
			leadingIcon={
				FileIcon ? <FileIcon className="size-4 shrink-0" /> : undefined
			}
			draggable={dnd.canDrag}
			onDragStart={(e) => {
				e.stopPropagation();
				const dragItems = dnd.getDragItems(item);
				setIsDraggingSource(true);
				setDraggedItemCount(dragItems.length);
				dnd.setDragState(dragItems.length, dragItems);
				dnd.onItemDragStart(e, dragItems);
			}}
			onDragOver={(e) => {
				const draggedItems = currentDragItems(e.dataTransfer);
				if (!canDropDraggedItems(draggedItems)) return;

				e.preventDefault();
				e.stopPropagation();
				e.dataTransfer.dropEffect = "move";
				dnd.setActiveDropTargetPath(item.path);
				dnd.setDragState(0, draggedItems);
			}}
			onDragLeave={(e) => {
				if (!dnd.enabled) return;

				e.stopPropagation();
				if (
					!isPointerOutsideElement(
						e.currentTarget,
						e.clientX,
						e.clientY,
					)
				) {
					return;
				}
				if (isActiveDropTarget) {
					dnd.setActiveDropTargetPath(null);
				}
				dnd.setDragState(
					dnd.activeDragItems.length,
					dnd.activeDragItems,
				);
			}}
			onDrop={(e) => {
				const draggedItems = currentDragItems(e.dataTransfer);
				if (!canDropDraggedItems(draggedItems)) return;

				e.preventDefault();
				e.stopPropagation();
				dnd.setActiveDropTargetPath(null);
				dnd.setDragState(0, []);
				commands.move(draggedItems, getItemTargetDirectory(item));
			}}
			onDragEnd={(e) => {
				e.stopPropagation();
				dnd.setActiveDropTargetPath(null);
				setIsDraggingSource(false);
				setDraggedItemCount(0);
				dnd.setDragState(0, []);
			}}
			onClickCapture={(e) => {
				if (!(e.ctrlKey || e.metaKey)) return;
				if (!(e.target instanceof Element)) return;
				const nearestTreeItem = e.target.closest('[role="treeitem"]');
				if (nearestTreeItem !== e.currentTarget) return;
				e.preventDefault();
				e.stopPropagation();
				tree.toggleBulkSelection(item);
			}}
			onContextMenu={(e) =>
				tree.openContextMenu(
					e,
					item,
					getItemTargetDirectory(item),
					secondaryActions,
				)
			}
			label={
				<div
					data-testid={`${itemTestId}-row`}
					className={cn(
						// `rtl:flex-row-reverse` mirrors the header's column
						// order in RTL. The header (in file-explorer.tsx)
						// flips correctly via writing-direction inheritance,
						// but inside TreeViewItem the row label doesn't —
						// likely because nested Radix wrappers swallow the
						// direction context. Explicit reverse keeps Name and
						// Date aligned with the header in both directions.
						"group flex min-h-7 min-w-full flex-row items-center rounded-md pe-2 transition-colors rtl:flex-row-reverse",
						isContextActive &&
							"bg-accent text-accent-foreground ring-1 ring-primary/30 ring-inset",
						isBulkSelected &&
							"bg-primary/10 text-accent-foreground ring-1 ring-primary/40 ring-inset",
						isActiveDropTarget &&
							"bg-primary/15 ring-1 ring-primary/50 ring-inset",
						isDraggingSource &&
							"opacity-60 ring-1 ring-primary/30 ring-inset",
						dnd.canDrag && "cursor-grab active:cursor-grabbing",
					)}
					title={
						item.lastModified
							? `${t("fileExplorer.pathLabel", {
									path: item.path,
								})}\n${t("fileExplorer.lastModifiedLabel", {
									date: item.lastModified,
								})}`
							: t("fileExplorer.pathLabel", { path: item.path })
					}
				>
					{/* Column 1 — Name */}
					<div className="flex min-w-[80px] flex-1 items-center gap-2 overflow-hidden pe-2">
						{isRenaming ? (
							<input
								data-testid={`${itemTestId}-rename-input`}
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
								onBlur={() =>
									commands.renameTo(item, renameValue)
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										commands.renameTo(item, renameValue);
									} else if (e.key === "Escape") {
										e.preventDefault();
										tree.cancelRename();
									}
									e.stopPropagation();
								}}
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<button
								data-testid={`${itemTestId}-name-button`}
								type="button"
								className="min-w-0 truncate bg-transparent p-0 text-start text-sm"
								onDoubleClick={(e) => {
									if (!capabilities.mutate || isDirectory) {
										return;
									}
									e.stopPropagation();
									commands.rename(item);
								}}
							>
								{item.name}
							</button>
						)}
						<div className="flex-1" />
						{isDraggingSource && (
							<span
								data-testid={`${itemTestId}-drag-source-indicator`}
								className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
							>
								{t("fileExplorer.movingItems", {
									count: draggedItemCount,
								})}
							</span>
						)}
						{isActiveDropTarget && (
							<span
								data-testid={`${itemTestId}-drop-target-indicator`}
								className="shrink-0 rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
							>
								{t("fileExplorer.moveHere")}
							</span>
						)}
					</div>

					{/* Column 2: Date */}
					<div
						data-testid={`${itemTestId}-date`}
						className="w-[var(--date-col-width,170px)] shrink-0 overflow-hidden truncate px-2 text-end text-[11px] text-muted-foreground"
					>
						{macDate ?? ""}
					</div>

					{/* Column 3: Actions */}
					{actions.length > 0 && (
						<div className="flex w-9 shrink-0 items-center justify-end">
							{actions.map((action) => (
								<Tooltip key={action.name}>
									<TooltipTrigger asChild>
										<Button
											data-testid={`${itemTestId}-action-${getFileExplorerTestIdSegment(action.name)}`}
											variant="ghost"
											size="icon-sm"
											onClick={(e) => {
												e.stopPropagation();
												action.action(item);
											}}
										>
											{action.icon}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{action.tooltip}
									</TooltipContent>
								</Tooltip>
							))}
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
							<FileExplorerItem
								key={child.path}
								data-testid={`file-explorer-item-${getFileExplorerTestIdSegment(child.path)}`}
								explorer={explorer}
								item={child}
								itemActions={itemActions}
							/>
						))}
					{getChildren.status === "SUCCESS" &&
						children.length === 0 && (
							<Muted
								data-testid={`${itemTestId}-empty-folder`}
								className="flex items-center justify-center py-2 text-xs"
							>
								{t("fileExplorer.emptyFolder")}
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
