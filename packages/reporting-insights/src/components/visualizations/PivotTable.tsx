import { ChevronLeft, ChevronRight, Table2 } from "lucide-react";
import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui";
import type {
	PivotColumn,
	PivotResult,
	PivotRow,
} from "@/hooks/usePivotTransform";
import type { ColorRule, VisualizationStyling } from "@/types/dashboard";

interface PivotTableProps {
	pivot: PivotResult;
	styling?: VisualizationStyling;
	/** Fallback page size when container width can't be measured. */
	defaultColumnPageSize?: number;
}

const SEPARATOR = "\u0001";

// Rough per-character pixel width for text-xs (12px) at default font.
const CHAR_PX = 7;
// Horizontal padding for px-3 cells (12px each side).
const CELL_PADDING_PX = 24;
const MIN_COL_PX = 60;
const VALUE_COL_PX = 80;

/**
 * Estimate how many column-dimension combinations can fit in the container
 * without causing horizontal overflow, given the longest header labels.
 */
function estimateAutoFitPageSize(opts: {
	containerWidth: number;
	combos: { headers: string[]; cols: PivotColumn[] }[];
	valueFieldCount: number;
	rowFields: string[];
	rows: PivotRow[];
	hasGrandTotal: boolean;
}): number {
	if (opts.containerWidth <= 0 || !opts.combos.length) return 1;

	// Row-header column widths: longest label in each row dimension
	let rowHeadersWidth = 0;
	for (let i = 0; i < opts.rowFields.length; i++) {
		let maxLen = opts.rowFields[i].length;
		for (const r of opts.rows) {
			const v = String(r.rowHeaders[i] ?? "");
			if (v.length > maxLen) maxLen = v.length;
		}
		rowHeadersWidth += Math.max(
			MIN_COL_PX,
			maxLen * CHAR_PX + CELL_PADDING_PX,
		);
	}

	const grandTotalWidth = opts.hasGrandTotal
		? VALUE_COL_PX * opts.valueFieldCount
		: 0;

	// Per-combo width estimate: widest header label in the combo dictates the
	// group width. Since each combo spans `valueFieldCount` value columns, the
	// header text can split across them, but we keep a per-value-column minimum.
	const perComboWidths = opts.combos.map((c) => {
		let comboLabelLen = 0;
		for (const h of c.headers) {
			const s = String(h ?? "");
			if (s.length > comboLabelLen) comboLabelLen = s.length;
		}
		const headerWidth = comboLabelLen * CHAR_PX + CELL_PADDING_PX;
		const valueColsMin =
			opts.valueFieldCount * Math.max(MIN_COL_PX, VALUE_COL_PX);
		return Math.max(headerWidth, valueColsMin);
	});

	// Use the widest combo so we don't overflow on any page
	const conservativeComboWidth = Math.max(...perComboWidths);
	const available = opts.containerWidth - rowHeadersWidth - grandTotalWidth;
	if (available <= 0) return 1;

	const n = Math.floor(available / conservativeComboWidth);
	return Math.max(1, Math.min(n, opts.combos.length));
}

// Color rule evaluation (Mimics the regular table logic)
function evaluateColorRule(
	rule: ColorRule,
	getValue: (col: string) => any,
): boolean {
	const cellValue = getValue(rule.valueColumn);
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

const formatNumber = (v: number | null): string => {
	if (v == null) return "—";
	if (!isFinite(v)) return String(v);
	// Show sensible precision: integers exact, otherwise up to 2 decimals
	if (Number.isInteger(v)) return v.toLocaleString();
	return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

//  Column header rendering: build a multi-row <thead> when there are
//    multiple column dimensions (one row per dimension level + values row).
interface HeaderCell {
	label: string;
	colSpan: number;
}

function buildHeaderRows(
	columns: PivotColumn[],
	columnFieldCount: number,
): HeaderCell[][] {
	if (!columns.length) return [];
	if (!columnFieldCount) {
		// Only the value-name row
		return [columns.map((c) => ({ label: c.valueField, colSpan: 1 }))];
	}

	const rows: HeaderCell[][] = [];
	// One row per column dimension
	for (let lvl = 0; lvl < columnFieldCount; lvl++) {
		const row: HeaderCell[] = [];
		let i = 0;
		while (i < columns.length) {
			const label = columns[i].columnHeaders[lvl] ?? "";
			// Group consecutive columns sharing the same prefix at this level
			let span = 1;
			while (
				i + span < columns.length &&
				columns[i + span].columnHeaders[lvl] === label &&
				// Also ensure shared parent-level prefix
				columns[i + span].columnHeaders
					.slice(0, lvl)
					.every((h, idx) => h === columns[i].columnHeaders[idx])
			) {
				span++;
			}
			row.push({ label, colSpan: span });
			i += span;
		}
		rows.push(row);
	}
	// Value-name row at the bottom (always 1 column wide)
	rows.push(columns.map((c) => ({ label: c.valueField, colSpan: 1 })));
	return rows;
}

export function PivotTable({
	pivot,
	styling,
	defaultColumnPageSize = 3,
}: PivotTableProps) {
	const {
		rowFields,
		columnFields,
		valueFields,
		columns,
		rows,
		grandTotalRow,
		hasGrandTotalColumn,
	} = pivot;

	// Column-combination pagination
	// Pagination buckets columns by their column-dimension combination so that
	// each page shows a consistent slice (each combo always renders all its
	// value columns together).
	const columnCombos = useMemo(() => {
		// Map from comboKey → { headers, columns[] }
		const map = new Map<
			string,
			{ headers: string[]; cols: PivotColumn[] }
		>();
		columns.forEach((c) => {
			const key = c.columnHeaders.join(SEPARATOR);
			if (!map.has(key))
				map.set(key, { headers: c.columnHeaders, cols: [] });
			map.get(key)!.cols.push(c);
		});
		return Array.from(map.values());
	}, [columns]);

	const paginationEnabled =
		columnFields.length > 0 && columnCombos.length > 0;

	// Auto-fit: measure container width and compute how many combos fit without
	// x-overflow. User can override via the input — in that case we stop
	// auto-fitting until they clear the field.
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [userOverride, setUserOverride] = useState(false);
	const [combosPerPage, setCombosPerPage] = useState<number | "">(
		defaultColumnPageSize,
	);
	const [currentPage, setCurrentPage] = useState(0);

	// Row pagination (Mimics the regular table's behavior). Subtotal/leaf rows
	// are sliced together; the grand-total row is rendered separately and stays
	// visible on every page.
	const [rowsPerPage, setRowsPerPage] = useState<number | "">(50);
	const [currentRowPage, setCurrentRowPage] = useState(0);

	// Watch container width
	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		setContainerWidth(el.clientWidth);
		if (typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries)
				setContainerWidth(entry.contentRect.width);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Re-compute auto-fit page size when inputs change (unless user has overridden)
	const autoFitSize = useMemo(
		() =>
			estimateAutoFitPageSize({
				containerWidth,
				combos: columnCombos,
				valueFieldCount: valueFields.length || 1,
				rowFields,
				rows,
				hasGrandTotal: hasGrandTotalColumn,
			}),
		[
			containerWidth,
			columnCombos,
			valueFields.length,
			rowFields,
			rows,
			hasGrandTotalColumn,
		],
	);

	useEffect(() => {
		if (!userOverride && paginationEnabled && containerWidth > 0) {
			setCombosPerPage(autoFitSize);
		}
	}, [autoFitSize, userOverride, paginationEnabled, containerWidth]);

	const effectivePageSize =
		typeof combosPerPage === "number" && combosPerPage > 0
			? combosPerPage
			: defaultColumnPageSize;
	const totalPages = paginationEnabled
		? Math.max(1, Math.ceil(columnCombos.length / effectivePageSize))
		: 1;

	// Reset page when underlying combos shrink below the current page
	useEffect(() => {
		if (currentPage >= totalPages) setCurrentPage(0);
	}, [totalPages, currentPage]);

	const visibleColumns = useMemo<PivotColumn[]>(() => {
		if (!paginationEnabled) return columns;
		const start = currentPage * effectivePageSize;
		const end = start + effectivePageSize;
		const slice = columnCombos.slice(start, end);
		return slice.flatMap((c) => c.cols);
	}, [
		paginationEnabled,
		columns,
		columnCombos,
		currentPage,
		effectivePageSize,
	]);

	// Compute visible rows for row pagination
	const effectiveRowPageSize =
		typeof rowsPerPage === "number" && rowsPerPage > 0 ? rowsPerPage : 50;
	const totalRowPages = Math.max(
		1,
		Math.ceil(rows.length / effectiveRowPageSize),
	);

	useEffect(() => {
		if (currentRowPage >= totalRowPages) setCurrentRowPage(0);
	}, [totalRowPages, currentRowPage]);

	const visibleRows = useMemo<PivotRow[]>(() => {
		const start = currentRowPage * effectiveRowPageSize;
		return rows.slice(start, start + effectiveRowPageSize);
	}, [rows, currentRowPage, effectiveRowPageSize]);

	// Empty / unconfigured states
	if (!rowFields.length && !columnFields.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<Table2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No pivot configured</p>
					<p className="mt-1 text-xs">
						Drag columns into Rows or Columns to begin
					</p>
				</div>
			</div>
		);
	}
	if (!valueFields.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<Table2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No values configured</p>
					<p className="mt-1 text-xs">
						Drag a measure into the Values drop zone
					</p>
				</div>
			</div>
		);
	}
	if (!rows.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-slate-400 text-sm">No data to pivot</p>
			</div>
		);
	}

	const tableStyling = styling?.table;
	const headerStyling = tableStyling?.header;
	const cellStyling = tableStyling?.cell;
	const colorRules = tableStyling?.colorRules ?? [];
	const wrapConfig = tableStyling?.wrapText;
	const fitContainerWidth = tableStyling?.fitContainerWidth ?? true;

	// Helper: header style applies to row-dimension headers AND dynamic column headers
	const getHeaderStyle = (col: string): React.CSSProperties => {
		if (!headerStyling) return {};
		const apply =
			headerStyling.columns.length === 0 ||
			headerStyling.columns.includes(col);
		if (!apply) return {};
		return {
			fontSize: headerStyling.fontSize
				? `${headerStyling.fontSize}px`
				: undefined,
			color: headerStyling.color || undefined,
			backgroundColor: headerStyling.backgroundColor || undefined,
		};
	};

	const getCellStyle = (
		col: PivotColumn,
		row: PivotRow,
		cellAccessor: (field: string) => any,
	): React.CSSProperties => {
		let style: React.CSSProperties = {};
		if (cellStyling) {
			const apply =
				cellStyling.columns.length === 0 ||
				cellStyling.columns.includes(col.valueField);
			if (apply) {
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
		for (const rule of colorRules) {
			const firedHere = evaluateColorRule(rule, cellAccessor);
			// Pivot intentionally never honors `colorEntireRow` — row-wide
			// coloring isn't meaningful in a crosstab, and the editor UI hides
			// the option. This guard also protects against legacy saved rules
			// where the flag may already be true.
			if (firedHere && col.valueField === rule.targetColumn) {
				style.backgroundColor = rule.color;
				break;
			}
		}
		// Stronger styling for total/subtotal rows
		if (row.isGrandTotal || row.isSubtotal) {
			style.fontWeight = style.fontWeight || 600;
		}
		return style;
	};

	const getCellClassName = (valueField: string, row: PivotRow): string => {
		let base =
			"px-3 py-1.5 text-slate-700 text-xs border-b border-slate-100 text-right tabular-nums";
		const shouldWrap =
			wrapConfig?.enabled &&
			(wrapConfig.columns.length === 0 ||
				wrapConfig.columns.includes(valueField));
		if (!shouldWrap) base += " whitespace-nowrap";
		if (row.isGrandTotal)
			base += " bg-slate-100 border-t-2 border-slate-300";
		else if (row.isSubtotal) base += " bg-slate-50";
		return base;
	};

	const headerRows = buildHeaderRows(visibleColumns, columnFields.length);
	const valueLabelRowIndex = headerRows.length - 1; // value-name row is the last header row

	// Total row count for the colspan of the row-headers cell on header rows
	const rowHeaderCellCount = Math.max(rowFields.length, 1);

	// Total-column display labels: when grand-totals are shown, render a "Total"
	// column per value field at the right edge.
	const totalColumns: PivotColumn[] = hasGrandTotalColumn
		? valueFields.map((vf) => ({
				key: `__total__${vf}`,
				columnHeaders: [],
				valueField: vf,
				aggregation: "",
			}))
		: [];

	// Per-cell accessor: returns the value of `field` at the same row + same
	// column-combo as the cell being rendered. Used by the per-cell
	// "did this rule fire here" check.
	const makeCellAccessor =
		(row: PivotRow, col: PivotColumn) => (field: string) => {
			if (field === col.valueField) return row.cells[col.key] ?? null;
			// Look up the sibling column in the same combo with the requested value field
			const sibling = columns.find(
				(c) =>
					c.valueField === field &&
					c.columnHeaders.length === col.columnHeaders.length &&
					c.columnHeaders.every((h, i) => h === col.columnHeaders[i]),
			);
			return sibling ? (row.cells[sibling.key] ?? null) : null;
		};

	return (
		<div className="grid h-full min-h-0 grid-rows-[1fr_auto] overflow-hidden">
			<div ref={containerRef} className="min-h-0 overflow-auto">
				<table
					className={`${fitContainerWidth ? "w-full" : "w-auto"} border-collapse text-sm`}
				>
					<thead>
						{headerRows.map((cells, ri) => {
							const isLastRow = ri === valueLabelRowIndex;
							return (
								<tr
									key={ri}
									className="sticky top-0 bg-slate-50"
								>
									{/* Row-headers area: only on the first header row, spans all rowFields cols */}
									{ri === 0 && rowFields.length > 0 && (
										<th
											colSpan={rowHeaderCellCount}
											rowSpan={headerRows.length}
											className="whitespace-nowrap border-slate-200 border-b bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide"
											style={
												rowFields.length
													? rowFields.reduce(
															(acc, f) => ({
																...acc,
																...getHeaderStyle(
																	f,
																),
															}),
															{} as React.CSSProperties,
														)
													: undefined
											}
										>
											{rowFields.join(" / ")}
										</th>
									)}
									{cells.map((cell, ci) => (
										<th
											key={ci}
											colSpan={cell.colSpan}
											className="whitespace-nowrap border-slate-200 border-b px-3 py-2 text-center font-semibold text-slate-600 text-xs uppercase tracking-wide"
											style={getHeaderStyle(cell.label)}
										>
											{cell.label}
										</th>
									))}
									{/* Grand-total column header — only render alongside the first header row,
                                        spanning all sub-rows except the value-name row */}
									{hasGrandTotalColumn && ri === 0 && (
										<th
											colSpan={valueFields.length}
											rowSpan={Math.max(
												1,
												headerRows.length - 1,
											)}
											className="whitespace-nowrap border-slate-200 border-b border-l-2 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-600 text-xs uppercase tracking-wide"
										>
											Total
										</th>
									)}
									{/* Grand-total per-value-field labels on the value-name row.
                                        Intentionally NOT passing `getHeaderStyle()` so the user's
                                        header-styling tool doesn't bleed into the Grand Total area,
                                        mirroring how grand-total cells skip `getCellStyle()`. */}
									{hasGrandTotalColumn &&
										isLastRow &&
										totalColumns.map((tc) => (
											<th
												key={tc.key}
												className="whitespace-nowrap border-slate-200 border-b bg-slate-100 px-3 py-2 text-center font-semibold text-slate-600 text-xs uppercase tracking-wide"
											>
												{tc.valueField}
											</th>
										))}
								</tr>
							);
						})}
					</thead>
					<tbody>
						{visibleRows.map((row, ri) => {
							const rowBgClass = row.isGrandTotal
								? "bg-slate-100 border-t-2 border-slate-300"
								: row.isSubtotal
									? "bg-slate-50"
									: ri % 2 === 0
										? "bg-white"
										: "bg-slate-50/50";
							return (
								<tr
									key={`${row.rowKey}-${ri}`}
									className={rowBgClass}
								>
									{/* Row dimension headers */}
									{rowFields.length > 0
										? row.rowHeaders.map((label, idx) => (
												<td
													key={idx}
													className={`whitespace-nowrap border-slate-100 border-b px-3 py-1.5 text-xs ${
														row.isSubtotal ||
														row.isGrandTotal
															? "font-semibold text-slate-700"
															: "text-slate-600"
													}`}
													style={getHeaderStyle(
														rowFields[idx],
													)}
												>
													{label}
												</td>
											))
										: null}
									{/* Pivoted value cells */}
									{visibleColumns.map((col) => (
										<td
											key={col.key}
											className={getCellClassName(
												col.valueField,
												row,
											)}
											style={getCellStyle(
												col,
												row,
												makeCellAccessor(row, col),
											)}
										>
											{row.cells[col.key] != null ? (
												formatNumber(row.cells[col.key])
											) : (
												<span className="text-slate-300">
													—
												</span>
											)}
										</td>
									))}
									{/* Grand-total column cells */}
									{hasGrandTotalColumn &&
										valueFields.map((vf) => (
											<td
												key={`__total__${vf}`}
												className={`${getCellClassName(vf, row)} border-slate-200 border-l-2 bg-slate-100 font-semibold`}
											>
												{row.rowTotals[vf] != null ? (
													formatNumber(
														row.rowTotals[vf],
													)
												) : (
													<span className="text-slate-300">
														—
													</span>
												)}
											</td>
										))}
								</tr>
							);
						})}
						{/* Grand-total row at bottom */}
						{grandTotalRow && (
							<tr className="border-slate-300 border-t-2 bg-slate-100">
								{rowFields.length > 0
									? grandTotalRow.rowHeaders.map(
											(label, idx) => (
												<td
													key={idx}
													className="whitespace-nowrap border-slate-200 border-b px-3 py-1.5 font-bold text-slate-800 text-xs"
												>
													{label}
												</td>
											),
										)
									: null}
								{visibleColumns.map((col) => (
									<td
										key={col.key}
										className="whitespace-nowrap border-slate-200 border-b px-3 py-1.5 text-right font-bold text-slate-800 text-xs tabular-nums"
									>
										{grandTotalRow.cells[col.key] !=
										null ? (
											formatNumber(
												grandTotalRow.cells[col.key],
											)
										) : (
											<span className="text-slate-400">
												—
											</span>
										)}
									</td>
								))}
								{hasGrandTotalColumn &&
									valueFields.map((vf) => (
										<td
											key={`__total__${vf}`}
											className="whitespace-nowrap border-slate-200 border-slate-300 border-b border-l-2 bg-slate-200 px-3 py-1.5 text-right font-bold text-slate-800 text-xs tabular-nums"
										>
											{grandTotalRow.rowTotals[vf] !=
											null ? (
												formatNumber(
													grandTotalRow.rowTotals[vf],
												)
											) : (
												<span className="text-slate-400">
													—
												</span>
											)}
										</td>
									))}
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{/* Footer: both pagination bars pinned to the bottom of the card.*/}
			<div className="border-slate-200 border-t bg-white">
				{/* Columns pagination */}
				{paginationEnabled && (
					<div className="flex items-center justify-between gap-3 px-4 py-1.5">
						<div className="flex min-w-0 items-center gap-1.5 text-slate-500 text-xs">
							<span className="whitespace-nowrap">
								Columns per page:
							</span>
							<Input
								type="text"
								inputMode="numeric"
								value={combosPerPage}
								onChange={(e) => {
									const raw = e.target.value.replace(
										/[^0-9]/g,
										"",
									);
									if (raw === "") {
										setCombosPerPage("");
										setUserOverride(false);
										return;
									}
									setCombosPerPage(parseInt(raw, 10));
									setUserOverride(true);
									setCurrentPage(0);
								}}
								onBlur={() => {
									if (
										combosPerPage === "" ||
										Number(combosPerPage) <= 0
									) {
										setUserOverride(false);
										setCombosPerPage(
											autoFitSize ||
												defaultColumnPageSize,
										);
									}
								}}
								className="w-14 rounded border border-slate-200 px-2 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
								title="Number of column-dimension groups per page"
							/>
							{userOverride && (
								<button
									type="button"
									onClick={() => {
										setUserOverride(false);
										setCombosPerPage(
											autoFitSize ||
												defaultColumnPageSize,
										);
										setCurrentPage(0);
									}}
									className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 uppercase tracking-wide hover:text-blue-600"
									title="Reset to auto-fit based on container width"
								>
									Auto-Fit
								</button>
							)}
							<span className="truncate text-slate-400">
								(
								{valueFields.length === 1
									? "1 value each"
									: `${valueFields.length} values each`}
								)
							</span>
						</div>

						<div className="flex flex-shrink-0 items-center gap-1.5">
							<span className="text-slate-400 text-xs tabular-nums">
								{columnCombos.length === 0
									? "0"
									: `${currentPage * effectivePageSize + 1}–${Math.min(
											(currentPage + 1) *
												effectivePageSize,
											columnCombos.length,
										)}`}{" "}
								of {columnCombos.length.toLocaleString()} column
								groups
							</span>
							<button
								onClick={() =>
									setCurrentPage((p) => Math.max(0, p - 1))
								}
								disabled={currentPage === 0}
								className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
								title="Previous page"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className="px-1 text-slate-600 text-xs tabular-nums">
								{currentPage + 1} / {totalPages}
							</span>
							<button
								onClick={() =>
									setCurrentPage((p) =>
										Math.min(totalPages - 1, p + 1),
									)
								}
								disabled={currentPage >= totalPages - 1}
								className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
								title="Next page"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
				{/* Rows pagination */}
				<div className="flex items-center justify-between gap-3 border-slate-100 border-t px-4 py-1.5">
					<div className="flex min-w-0 items-center gap-1.5 text-slate-500 text-xs">
						<span className="whitespace-nowrap">
							Rows per page:
						</span>
						<Input
							type="text"
							inputMode="numeric"
							value={rowsPerPage}
							onChange={(e) => {
								const raw = e.target.value.replace(
									/[^0-9]/g,
									"",
								);
								if (raw === "") {
									setRowsPerPage("");
									return;
								}
								setRowsPerPage(parseInt(raw, 10));
								setCurrentRowPage(0);
							}}
							onBlur={() => {
								if (
									rowsPerPage === "" ||
									Number(rowsPerPage) <= 0
								)
									setRowsPerPage(50);
							}}
							className="w-14 rounded border border-slate-200 px-2 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
						/>
					</div>

					<div className="flex flex-shrink-0 items-center gap-1.5">
						<span className="text-slate-400 text-xs tabular-nums">
							{rows.length === 0
								? "0"
								: `${currentRowPage * effectiveRowPageSize + 1}–${Math.min(
										(currentRowPage + 1) *
											effectiveRowPageSize,
										rows.length,
									)}`}{" "}
							of {rows.length.toLocaleString()} rows
						</span>
						<button
							onClick={() =>
								setCurrentRowPage((p) => Math.max(0, p - 1))
							}
							disabled={currentRowPage === 0}
							className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
							title="Previous page"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className="px-1 text-slate-600 text-xs tabular-nums">
							{currentRowPage + 1} / {totalRowPages}
						</span>
						<button
							onClick={() =>
								setCurrentRowPage((p) =>
									Math.min(totalRowPages - 1, p + 1),
								)
							}
							disabled={currentRowPage >= totalRowPages - 1}
							className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
							title="Next page"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
