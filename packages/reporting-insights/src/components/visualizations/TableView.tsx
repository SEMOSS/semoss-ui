/**
 * Shared Table visualization — used by:
 *   - Main app `DashboardVisualization` (the published-table render path)
 *   - Portal `ViewMode` (the runtime view of a published dashboard)
 *   - Portal `ChartPreview` (the editor preview of an unpublished table)
 *
 * Honors `VisualizationConfig.styling.table` for header / cell styling, color
 * rules, wrap text, and `fitContainerWidth`. Owns its own pagination state by
 * default; main app passes controlled paging props so its "rows per page"
 * config field stays bidirectional with the editor's saved `tablePageSize`.
 *
 * The `footerExtra` slot lets the main app render a "Load more ↓" button that
 * fetches the next DB batch — the portal has no DB-batch concept and just
 * leaves it null.
 */

import {
	ChevronLeft,
	ChevronRight,
	Download,
	Loader2,
	Table2,
} from "lucide-react";
import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Input } from "@/components/ui";
import { formatValue } from "@/lib/formatValue";
import { aggregateTableRows, aggShortLabel } from "@/lib/tableAggregate";
import type { ColorRule, VisualizationConfig } from "@/types/dashboard";

type Row = Record<string, unknown>;

interface Props {
	data: Row[];
	config?: VisualizationConfig;
	/** Render an extra control at the right of the pagination footer (e.g. "Load more ↓"). */
	footerExtra?: React.ReactNode;
	/** Controlled page size; if omitted, defaults to `config.tablePageSize ?? 50`. */
	pageSize?: number | "";
	onPageSizeChange?: (size: number | "") => void;
	/** Persist user-resized column widths when the table is rendered in an editor. */
	onColumnWidthsChange?: (widths: Record<string, number>) => void;
	/** Controlled current page (0-indexed); if omitted, internal state is used. */
	currentPage?: number;
	onPageChange?: (page: number) => void;
	/**
	 * Total row count for the footer count display. Defaults to `data.length`.
	 * Main app uses this when only a DB batch of rows is loaded — the count
	 * shows the loaded slice with a `+` indicator (see `hasMoreRows`).
	 */
	totalRowCount?: number;
	/** When true, footer renders a `+` after the row count (more rows exist on the server). */
	hasMoreRows?: boolean;
	/**
	 * Fetch the next server page (SEMOSS Collect). Called when the user pages past
	 * the last LOADED row while `hasMoreRows` is true, so 50-rows-at-a-time paging
	 * flows seamlessly across server batches.
	 */
	onLoadMore?: () => void;
	/** True while a server page is being fetched (disables Next, shows a spinner state). */
	loadingMore?: boolean;
	/** Export the complete configured table, independently of the currently loaded page. */
	onExport?: () => void;
	/** True while the full export query and download are in progress. */
	exporting?: boolean;
	/** Disables export when the query is unavailable or the table cannot be exported. */
	exportDisabled?: boolean;
	exportTitle?: string;
	exportError?: string | null;
	/**
	 * When true, the empty-column guard is shown if the user has explicitly
	 * configured `tableColumns` to an empty array. Main app passes `true`
	 * (matches its prior behavior); portal passes `false` since the portal
	 * never reaches a state where `tableColumns === []` is intentional.
	 */
	showEmptyColumnsGuard?: boolean;
	/** When this value changes, local column width state resets to the configured widths. */
	resetKey?: number;
}

const MIN_COLUMN_WIDTH = 72;
const MAX_DEFAULT_COLUMN_WIDTH = 360;
const EMPTY_COLUMN_WIDTHS: Record<string, number> = {};

function defaultColumnWidth(column: string): number {
	return Math.min(
		MAX_DEFAULT_COLUMN_WIDTH,
		Math.max(MIN_COLUMN_WIDTH, column.length * 8 + 40),
	);
}

// ── Helpers (module-private) ─────────────────────────────────────────────────

function evaluateColorRule(rule: ColorRule, row: Row): boolean {
	const cellValue = row[rule.valueColumn];
	if (cellValue == null) return false;
	const ruleValue = rule.value;
	switch (rule.comparator) {
		case "eq":
			return String(cellValue) === String(ruleValue);
		case "neq":
			return String(cellValue) !== String(ruleValue);
		case "gt":
			return Number(cellValue) > Number(ruleValue);
		case "lt":
			return Number(cellValue) < Number(ruleValue);
		case "gte":
			return Number(cellValue) >= Number(ruleValue);
		case "lte":
			return Number(cellValue) <= Number(ruleValue);
		case "contains":
			return String(cellValue)
				.toLowerCase()
				.includes(String(ruleValue).toLowerCase());
		default:
			return false;
	}
}

// ── Component ────────────────────────────────────────────────────────────────

export function TableView({
	data,
	config,
	footerExtra,
	pageSize: pageSizeProp,
	onPageSizeChange,
	onColumnWidthsChange,
	currentPage: currentPageProp,
	onPageChange,
	totalRowCount,
	hasMoreRows = false,
	onLoadMore,
	loadingMore = false,
	onExport,
	exporting = false,
	exportDisabled = false,
	exportTitle = "Export to CSV",
	exportError,
	showEmptyColumnsGuard = false,
	resetKey,
}: Props) {
	const cfg = config ?? {};
	const tableStyling = cfg.styling?.table;
	const formatRules = cfg.styling?.formatRules ?? [];
	const columnWidthsConfig = tableStyling?.columnWidths;
	const columnResizingEnabled = columnWidthsConfig?.enabled ?? false;
	const configuredColumnWidths =
		columnWidthsConfig?.widths ?? EMPTY_COLUMN_WIDTHS;
	const [columnWidthState, setColumnWidthState] = useState(() => ({
		source: configuredColumnWidths,
		widths: configuredColumnWidths,
	}));
	const hasMeasuredRef = useRef(false);
	if (columnWidthState.source !== configuredColumnWidths) {
		hasMeasuredRef.current = false;
		setColumnWidthState({
			source: configuredColumnWidths,
			widths: configuredColumnWidths,
		});
	}
	const [lastResetKey, setLastResetKey] = useState(resetKey ?? 0);
	if (resetKey !== undefined && resetKey !== lastResetKey) {
		setLastResetKey(resetKey);
		hasMeasuredRef.current = false;
		setColumnWidthState({
			source: configuredColumnWidths,
			widths: configuredColumnWidths,
		});
	}
	const columnWidths = columnWidthState.widths;
	const resizeRef = useRef<{
		column: string;
		pointerId: number;
		startX: number;
		startWidth: number;
		currentWidth: number;
		initialWidths: Record<string, number>;
	} | null>(null);

	// Uncontrolled fallbacks. Initial page size: configured rows-per-page
	// (styling.table.pageSize, legacy tablePageSize fallback), else 50. '' → 50.
	const configuredPageSize = tableStyling?.pageSize ?? cfg.tablePageSize;
	const [internalPageSize, setInternalPageSize] = useState<number | "">(
		typeof configuredPageSize === "number" && configuredPageSize > 0
			? configuredPageSize
			: 50,
	);
	const [internalPage, setInternalPage] = useState(0);

	const pageSize = pageSizeProp ?? internalPageSize;
	const setPageSize = onPageSizeChange ?? setInternalPageSize;
	const currentPage = currentPageProp ?? internalPage;
	const setCurrentPage = onPageChange ?? setInternalPage;

	const effectivePageSize =
		typeof pageSize === "number" && pageSize > 0 ? pageSize : 50;

	// Per-column aggregation / group-by. When any chosen column has a measure
	// aggregation, the table is grouped + aggregated; otherwise raw rows are shown.
	const aggs = cfg.columnAggregations ?? {};
	const configuredCols = cfg.tableColumns?.length
		? cfg.tableColumns
		: data.length
			? Object.keys(data[0])
			: [];
	const aggregated = aggregateTableRows(
		data as Record<string, unknown>[],
		configuredCols,
		aggs,
	);
	const displayData = (aggregated ?? data) as Row[];

	const allCols = displayData.length
		? Object.keys(displayData[0])
		: configuredCols;
	// Use configured column order/visibility if available, otherwise show all columns
	const cols = cfg.tableColumns?.length
		? cfg.tableColumns.filter((col) => allCols.includes(col))
		: allCols;
	const getColumnWidth = (column: string) =>
		columnWidths[column] ?? defaultColumnWidth(column);
	const totalColumnWidth = cols.reduce(
		(totalWidth, column) => totalWidth + getColumnWidth(column),
		0,
	);

	// useFixedLayout is true only once we have explicit widths, either stored
	// in config or measured from the DOM. This keeps the initial render looking
	// the same as the disabled state so columns start at natural browser widths
	// rather than the name-length formula.
	const hasWidths = Object.keys(columnWidths).length > 0;
	const useFixedLayout = columnResizingEnabled && hasWidths;

	const tableRef = useRef<HTMLTableElement>(null);
	const colsRef = useRef(cols);
	colsRef.current = cols;
	const onColumnWidthsChangeRef = useRef(onColumnWidthsChange);
	onColumnWidthsChangeRef.current = onColumnWidthsChange;
	const columnWidthsRef = useRef(columnWidths);
	columnWidthsRef.current = columnWidths;

	// When resizing is enabled but no widths are stored, render without
	// table-fixed so the browser distributes columns naturally. After that
	// first paint, measure the actual <th> widths and switch to fixed layout
	// with those measurements.
	useLayoutEffect(() => {
		if (
			!columnResizingEnabled ||
			hasMeasuredRef.current ||
			!tableRef.current
		) {
			return;
		}
		if (Object.keys(columnWidthsRef.current).length > 0) {
			hasMeasuredRef.current = true;
			return;
		}
		const ths =
			tableRef.current.querySelectorAll<HTMLTableCellElement>(
				"thead tr th",
			);
		if (ths.length === 0) return;
		const widths: Record<string, number> = {};
		colsRef.current.forEach((col, i) => {
			const th = ths[i];
			if (th) widths[col] = Math.max(MIN_COLUMN_WIDTH, th.offsetWidth);
		});
		if (Object.keys(widths).length > 0) {
			hasMeasuredRef.current = true;
			setColumnWidthState((current) => ({ ...current, widths }));
			onColumnWidthsChangeRef.current?.(widths);
		}
	}, [columnResizingEnabled]);

	const updateColumnWidth = (column: string, width: number) => {
		const nextWidths = {
			...columnWidths,
			[column]: Math.max(MIN_COLUMN_WIDTH, Math.round(width)),
		};
		setColumnWidthState((current) => ({ ...current, widths: nextWidths }));
		onColumnWidthsChange?.(nextWidths);
	};

	const startColumnResize = (
		event: React.PointerEvent<HTMLSpanElement>,
		column: string,
	) => {
		if (!columnResizingEnabled) return;
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);

		// When no widths are stored yet, read actual rendered <th> widths from
		// the DOM so every other column keeps its natural browser width during
		// the drag.
		let initialWidths = columnWidths;
		let startWidth = getColumnWidth(column);
		if (!hasWidths && tableRef.current) {
			const ths =
				tableRef.current.querySelectorAll<HTMLTableCellElement>(
					"thead tr th",
				);
			const domWidths: Record<string, number> = {};
			cols.forEach((col, i) => {
				const th = ths[i];
				if (th)
					domWidths[col] = Math.max(MIN_COLUMN_WIDTH, th.offsetWidth);
			});
			if (Object.keys(domWidths).length > 0) {
				initialWidths = domWidths;
				startWidth = domWidths[column] ?? startWidth;
			}
		}

		resizeRef.current = {
			column,
			pointerId: event.pointerId,
			startX: event.clientX,
			startWidth,
			currentWidth: startWidth,
			initialWidths,
		};
	};

	const resizeColumn = (event: React.PointerEvent<HTMLSpanElement>) => {
		const resize = resizeRef.current;
		if (!resize || resize.pointerId !== event.pointerId) return;
		resize.currentWidth = Math.max(
			MIN_COLUMN_WIDTH,
			Math.round(resize.startWidth + event.clientX - resize.startX),
		);
		setColumnWidthState((current) => ({
			...current,
			widths: {
				...resize.initialWidths,
				[resize.column]: resize.currentWidth,
			},
		}));
	};

	const finishColumnResize = (event: React.PointerEvent<HTMLSpanElement>) => {
		const resize = resizeRef.current;
		if (!resize || resize.pointerId !== event.pointerId) return;
		resizeRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		onColumnWidthsChange?.({
			...resize.initialWidths,
			[resize.column]: resize.currentWidth,
		});
	};

	// Row total: when aggregated, that's the grouped row count. Otherwise prefer the
	// caller's `totalRowCount` (main app's full DB accumulator), else local length.
	const total = aggregated
		? displayData.length
		: (totalRowCount ?? data.length);
	const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
	const pagedData = displayData.slice(
		currentPage * effectivePageSize,
		(currentPage + 1) * effectivePageSize,
	);

	// ── Per-column style helpers (closure over `tableStyling`) ───────────────
	const getHeaderStyle = (col: string): React.CSSProperties => {
		const headerStyling = tableStyling?.header;
		if (!headerStyling) return {};
		const shouldApply =
			headerStyling.columns.length === 0 ||
			headerStyling.columns.includes(col);
		if (!shouldApply) return {};
		return {
			fontSize: headerStyling.fontSize
				? `${headerStyling.fontSize}px`
				: undefined,
			color: headerStyling.color || undefined,
			backgroundColor: headerStyling.backgroundColor || undefined,
		};
	};

	const getCellStyle = (col: string, row: Row): React.CSSProperties => {
		let style: React.CSSProperties = {};

		const cellStyling = tableStyling?.cell;
		if (cellStyling) {
			const shouldApply =
				cellStyling.columns.length === 0 ||
				cellStyling.columns.includes(col);
			if (shouldApply) {
				style = {
					fontSize: cellStyling.fontSize
						? `${cellStyling.fontSize}px`
						: undefined,
					color: cellStyling.color || undefined,
					backgroundColor: cellStyling.backgroundColor || undefined,
					textAlign: cellStyling.textAlign || undefined,
				};
			}
		}

		// Apply color rules (first match wins)
		const colorRules = tableStyling?.colorRules || [];
		for (const rule of colorRules) {
			if (evaluateColorRule(rule, row)) {
				if (rule.colorEntireRow || col === rule.targetColumn) {
					style.backgroundColor = rule.color;
				}
				break;
			}
		}

		return style;
	};

	const getCellClassName = (col: string): string => {
		const baseClasses =
			"px-4 py-2 text-slate-700 text-xs border-b border-slate-100";
		const wrapConfig = tableStyling?.wrapText;
		const shouldWrap =
			wrapConfig?.enabled &&
			(wrapConfig.columns.length === 0 ||
				wrapConfig.columns.includes(col));
		if (useFixedLayout) {
			return shouldWrap
				? `${baseClasses} break-words`
				: `${baseClasses} whitespace-nowrap overflow-hidden text-ellipsis`;
		}
		return shouldWrap ? baseClasses : `${baseClasses} whitespace-nowrap`;
	};

	// ── Empty-columns guard (main app only) ──────────────────────────────────
	if (
		showEmptyColumnsGuard &&
		cfg.tableColumns !== undefined &&
		!cols.length
	) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<Table2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No columns configured</p>
					<p className="mt-1 text-xs">
						Drag columns to the Table Columns drop zone
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex-1 overflow-auto">
				<table
					ref={tableRef}
					className={`${
						useFixedLayout
							? "table-fixed"
							: (tableStyling?.fitContainerWidth ?? true)
								? "min-w-full"
								: "w-auto"
					} border-collapse text-sm`}
					style={
						useFixedLayout
							? { width: `${totalColumnWidth}px` }
							: undefined
					}
				>
					{useFixedLayout && (
						<colgroup>
							{cols.map((column) => (
								<col
									key={column}
									style={{
										width: `${getColumnWidth(column)}px`,
									}}
								/>
							))}
						</colgroup>
					)}
					<thead>
						<tr className="sticky top-0 border-slate-200 border-b bg-slate-50">
							{cols.map((c) => {
								const aggHint = aggregated
									? aggShortLabel(aggs[c])
									: "";
								return (
									<th
										key={c}
										style={getHeaderStyle(c)}
										className={`whitespace-nowrap px-4 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide ${columnResizingEnabled ? "relative" : ""}`}
									>
										<div
											className={
												columnResizingEnabled
													? "overflow-hidden text-ellipsis"
													: undefined
											}
										>
											{c}
											{aggHint && (
												<span className="ml-1 font-normal text-slate-400 normal-case">
													· {aggHint}
												</span>
											)}
										</div>
										{columnResizingEnabled && (
											// biome-ignore lint/a11y/useSemanticElements: an <hr> can't be focusable or carry pointer-drag/keyboard resize handlers
											<span
												role="separator"
												aria-label={`Resize ${c} column`}
												aria-orientation="vertical"
												aria-valuenow={getColumnWidth(
													c,
												)}
												aria-valuemin={MIN_COLUMN_WIDTH}
												aria-valuemax={2000}
												tabIndex={0}
												onPointerDown={(event) =>
													startColumnResize(event, c)
												}
												onPointerMove={resizeColumn}
												onPointerUp={finishColumnResize}
												onPointerCancel={
													finishColumnResize
												}
												onLostPointerCapture={
													finishColumnResize
												}
												onKeyDown={(event) => {
													if (
														event.key !==
															"ArrowLeft" &&
														event.key !==
															"ArrowRight"
													) {
														return;
													}
													event.preventDefault();
													updateColumnWidth(
														c,
														getColumnWidth(c) +
															(event.key ===
															"ArrowRight"
																? 8
																: -8),
													);
												}}
												className="absolute top-0 right-0 h-full w-2 translate-x-1/2 cursor-col-resize touch-none select-none hover:bg-blue-400/30 focus:bg-blue-400/30 focus:outline-none"
											/>
										)}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{pagedData.map((row, ri) => (
							<tr
								// biome-ignore lint/suspicious/noArrayIndexKey: query result rows have no natural unique id.
								key={ri}
								className={
									ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"
								}
							>
								{cols.map((c) => (
									<td
										key={c}
										style={getCellStyle(c, row)}
										className={getCellClassName(c)}
									>
										{row[c] != null ? (
											formatValue(row[c], c, formatRules)
										) : (
											<span className="text-slate-300">
												—
											</span>
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination bar */}
			<div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-slate-100 border-t bg-white px-4 py-2">
				{/* Rows-per-page */}
				<div className="flex items-center gap-1.5 text-slate-500 text-xs">
					<span>Rows per page:</span>
					<Input
						type="text"
						inputMode="numeric"
						value={pageSize}
						onChange={(e) => {
							const raw = e.target.value.replace(/[^0-9]/g, "");
							if (raw === "") {
								setPageSize("");
								return;
							}
							setPageSize(parseInt(raw, 10));
							setCurrentPage(0);
						}}
						onBlur={() => {
							if (pageSize === "" || Number(pageSize) <= 0)
								setPageSize(50);
						}}
						className="w-14 rounded border border-slate-200 px-2 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
					/>
				</div>

				{/* Page info + navigation */}
				<div className="flex items-center gap-1.5">
					<span className="text-slate-400 text-xs tabular-nums">
						{total === 0
							? "0"
							: `${currentPage * effectivePageSize + 1}–${Math.min(
									(currentPage + 1) * effectivePageSize,
									total,
								)}`}{" "}
						of {total.toLocaleString()}
						{hasMoreRows ? "+" : ""} rows
					</span>
					<button
						type="button"
						onClick={() =>
							setCurrentPage(Math.max(0, currentPage - 1))
						}
						disabled={currentPage === 0}
						className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
					<span className="px-1 text-slate-600 text-xs tabular-nums">
						{currentPage + 1} / {totalPages}
					</span>
					<button
						type="button"
						onClick={() => {
							const atLastLoadedPage =
								currentPage >= totalPages - 1;
							if (atLastLoadedPage) {
								// End of loaded rows: pull the next server page, then advance.
								// The new rows append to `data`, growing totalPages so this page
								// index becomes valid once they arrive.
								if (hasMoreRows && onLoadMore && !loadingMore) {
									onLoadMore();
									setCurrentPage(currentPage + 1);
								}
							} else {
								setCurrentPage(currentPage + 1);
							}
						}}
						// Only truly disabled at the very end (no more loaded rows AND none on
						// the server), or while a fetch is in flight.
						disabled={
							(currentPage >= totalPages - 1 && !hasMoreRows) ||
							loadingMore
						}
						title={
							hasMoreRows && currentPage >= totalPages - 1
								? "Load more rows"
								: "Next page"
						}
						className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
					{footerExtra}
					{onExport && (
						<button
							type="button"
							onClick={onExport}
							disabled={exporting || exportDisabled}
							title={exportTitle}
							className="ml-1 inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2 font-medium text-[12px] text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{exporting ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Download className="h-3.5 w-3.5" />
							)}
						</button>
					)}
					{exportError && (
						<span
							className="max-w-52 truncate text-[12px] text-red-600"
							title={exportError}
						>
							{exportError}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
