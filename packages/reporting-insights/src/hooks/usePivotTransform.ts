import { useMemo } from "react";
import type { VisualizationConfig } from "@/types/dashboard";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single rendered row in the pivot table. */
export interface PivotRow {
	/** Unique key identifying this row (composite of all row dimension values). */
	rowKey: string;
	/** Ordered values for each row dimension (parallel to PivotResult.rowFields).
	 *  Subtotal/grand-total rows show empty strings for levels deeper than `level`. */
	rowHeaders: string[];
	/** Aggregated value for each pivot column, keyed by columnKey. */
	cells: Record<string, number | null>;
	/** Grand total for this row across all pivot columns (per value column). */
	rowTotals: Record<string, number | null>;
	/** Marks this row as a subtotal for the row-dimension at `level`. */
	isSubtotal?: boolean;
	/** Marks this row as the bottom grand-total row. */
	isGrandTotal?: boolean;
	/** Hierarchy depth (0 = leaf row, 1 = subtotal of innermost group, etc.). */
	level: number;
}

/** A single dynamic column header (one per unique column-dimension combination × value). */
export interface PivotColumn {
	/** Unique key for this column — used as a Record key in PivotRow.cells. */
	key: string;
	/** Ordered labels for each column-dimension level (parallel to PivotResult.columnFields). */
	columnHeaders: string[];
	/** Underlying value column this aggregation is for (e.g. "NUMBER"). */
	valueField: string;
	/** Aggregation applied to the value column (e.g. "sum"). */
	aggregation: string;
}

/** Result of pivot transformation. */
export interface PivotResult {
	/** Row dimension column names (in order). */
	rowFields: string[];
	/** Column dimension column names (in order). */
	columnFields: string[];
	/** Value columns being aggregated. */
	valueFields: string[];
	/** Dynamically-generated columns (one per col-dimension combination × value). */
	columns: PivotColumn[];
	/** Rendered rows in display order (includes subtotals when enabled). */
	rows: PivotRow[];
	/** Grand-total row at the bottom (null if disabled). */
	grandTotalRow: PivotRow | null;
	/** Whether to render a grand-total column on the right. */
	hasGrandTotalColumn: boolean;
}

// ── Aggregation ───────────────────────────────────────────────────────────────

/** Apply an aggregation to a list of raw values. Returns null for empty input. */
function aggregate(values: any[], aggType: string): number | null {
	if (!values.length) return null;

	if (aggType === "count") return values.length;
	if (aggType === "countUnique") return new Set(values).size;

	const numVals = values.map((v) => Number(v)).filter((v) => !isNaN(v));
	if (!numVals.length) return null;

	switch (aggType) {
		case "avg":
			return numVals.reduce((a, b) => a + b, 0) / numVals.length;
		case "sum":
			return numVals.reduce((a, b) => a + b, 0);
		case "min":
			return Math.min(...numVals);
		case "max":
			return Math.max(...numVals);
		case "median": {
			const sorted = [...numVals].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 === 0
				? (sorted[mid - 1] + sorted[mid]) / 2
				: sorted[mid];
		}
		default:
			return numVals.reduce((a, b) => a + b, 0); // fallback to sum
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEPARATOR = "\u0001"; // unlikely to appear in real data

const buildKey = (parts: string[]): string => parts.join(SEPARATOR);

/** Format a row-header value for display. Null/undefined → "(blank)". */
const formatHeader = (v: any): string => {
	if (v == null || v === "") return "(blank)";
	return String(v);
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Pure version of the pivot transform — same logic as `usePivotTransform`
 * but callable from non-React contexts (e.g. CSV export handlers).
 */
export function pivotTransform(
	data: any[],
	config: VisualizationConfig | undefined,
): PivotResult {
	const rowFields = config?.pivotRows ?? [];
	const columnFields = config?.pivotColumns ?? [];
	const valueFields = config?.pivotValues ?? config?.yKeys ?? [];
	const aggregations = config?.columnAggregations ?? {};

	const empty: PivotResult = {
		rowFields,
		columnFields,
		valueFields,
		columns: [],
		rows: [],
		grandTotalRow: null,
		hasGrandTotalColumn: false,
	};

	// Need at least one row dimension and at least one value
	if (
		!data?.length ||
		!valueFields.length ||
		(!rowFields.length && !columnFields.length)
	) {
		return empty;
	}

	// Determine totals visibility
	const totals = config?.styling?.pivot?.showTotals ?? {};
	const showAll = totals.all ?? false;
	const showRowTotals = showAll || totals.rows || false; // grand-total row at bottom
	const showColumnTotals = showAll || totals.columns || false; // grand-total column at right
	const showSubtotals = totals.subtotals ?? false;

	// ── Step 1: Discover unique column-dimension combinations ──────────────
	const columnComboSet = new Map<string, string[]>(); // key → labels
	if (columnFields.length) {
		data.forEach((row) => {
			const labels = columnFields.map((f) => formatHeader(row[f]));
			columnComboSet.set(buildKey(labels), labels);
		});
	} else {
		// No column dimensions — single implicit combo with empty labels
		columnComboSet.set("", []);
	}
	const columnCombos = Array.from(columnComboSet.entries())
		.map(([key, labels]) => ({ key, labels }))
		.sort((a, b) => a.key.localeCompare(b.key));

	// ── Step 2: Build dynamic column definitions ───────────────────────────
	const columns: PivotColumn[] = [];
	columnCombos.forEach(({ key: comboKey, labels }) => {
		valueFields.forEach((valueField) => {
			const aggregation =
				aggregations[valueField] ??
				(typeof data[0]?.[valueField] === "number" ? "sum" : "count");
			columns.push({
				key: comboKey
					? `${comboKey}${SEPARATOR}${valueField}`
					: valueField,
				columnHeaders: labels,
				valueField,
				aggregation,
			});
		});
	});

	// ── Step 3: Group raw data by (rowKey, columnKey) and collect values ───
	// bucket: rowKey → columnKey → valueField → raw values[]
	const buckets = new Map<string, Map<string, Map<string, any[]>>>();
	const rowOrder: string[] = []; // preserves insertion order
	const rowLabelsByKey = new Map<string, string[]>();

	data.forEach((row) => {
		const rowLabels = rowFields.map((f) => formatHeader(row[f]));
		const rowKey = buildKey(rowLabels);
		if (!buckets.has(rowKey)) {
			buckets.set(rowKey, new Map());
			rowOrder.push(rowKey);
			rowLabelsByKey.set(rowKey, rowLabels);
		}
		const colMap = buckets.get(rowKey)!;

		const colLabels = columnFields.map((f) => formatHeader(row[f]));
		const colKey = buildKey(colLabels);
		if (!colMap.has(colKey)) colMap.set(colKey, new Map());
		const valMap = colMap.get(colKey)!;

		valueFields.forEach((vf) => {
			if (!valMap.has(vf)) valMap.set(vf, []);
			valMap.get(vf)!.push(row[vf]);
		});
	});

	// Sort row keys so subtotal logic groups correctly. Sort by labels lexically.
	rowOrder.sort((a, b) => {
		const la = rowLabelsByKey.get(a)!;
		const lb = rowLabelsByKey.get(b)!;
		for (let i = 0; i < la.length; i++) {
			if (la[i] !== lb[i]) return la[i].localeCompare(lb[i]);
		}
		return 0;
	});

	// ── Step 4: Compute aggregated cell values for each leaf row ───────────
	const buildRow = (rowKey: string, rowLabels: string[]): PivotRow => {
		const colMap = buckets.get(rowKey);
		const cells: Record<string, number | null> = {};
		const rowTotals: Record<string, number | null> = {};

		// Per-value rolling collectors for the row total column
		const rowTotalValues: Record<string, any[]> = {};
		valueFields.forEach((vf) => (rowTotalValues[vf] = []));

		columns.forEach((col) => {
			const comboKey = col.columnHeaders.length
				? buildKey(col.columnHeaders)
				: "";
			const valMap = colMap?.get(comboKey);
			const rawValues = valMap?.get(col.valueField) ?? [];
			cells[col.key] = aggregate(rawValues, col.aggregation);
			rowTotalValues[col.valueField].push(...rawValues);
		});

		valueFields.forEach((vf) => {
			const agg = aggregations[vf] ?? "sum";
			rowTotals[vf] = aggregate(rowTotalValues[vf], agg);
		});

		return {
			rowKey,
			rowHeaders: rowLabels,
			cells,
			rowTotals,
			level: 0,
		};
	};

	const leafRows: PivotRow[] = rowOrder.map((key) =>
		buildRow(key, rowLabelsByKey.get(key)!),
	);

	// ── Step 5: Insert subtotal rows for each parent group level ───────────
	// Subtotals only meaningful when there are ≥2 row dimensions and the
	// subtotal toggle is enabled.
	let renderedRows: PivotRow[] = leafRows;
	if (showSubtotals && rowFields.length >= 2) {
		renderedRows = [];

		// For each level (1..rowFields.length-1), insert a subtotal after each
		// group of leaf rows sharing the same prefix at that level.
		for (let i = 0; i < leafRows.length; i++) {
			renderedRows.push(leafRows[i]);

			// Determine where each parent-level group ends
			for (let lvl = rowFields.length - 1; lvl >= 1; lvl--) {
				const isLastInGroup =
					i === leafRows.length - 1 ||
					leafRows[i].rowHeaders
						.slice(0, lvl)
						.some(
							(h, idx) => h !== leafRows[i + 1].rowHeaders[idx],
						);
				if (!isLastInGroup) continue;

				// Collect all leaf rows whose first `lvl` headers match this group
				const groupPrefix = leafRows[i].rowHeaders.slice(0, lvl);
				const groupRows: PivotRow[] = [];
				for (let j = i; j >= 0; j--) {
					const matches = groupPrefix.every(
						(h, idx) => h === leafRows[j].rowHeaders[idx],
					);
					if (!matches) break;
					groupRows.unshift(leafRows[j]);
				}

				// Aggregate the group: re-aggregate raw values from buckets
				const subRow = aggregateGroup(
					groupPrefix,
					groupRows,
					rowFields.length,
					columns,
					valueFields,
					aggregations,
					buckets,
				);
				subRow.level = rowFields.length - lvl; // depth from leaf
				subRow.isSubtotal = true;
				renderedRows.push(subRow);
			}
		}
	}

	// ── Step 6: Compute grand-total row at the bottom ──────────────────────
	let grandTotalRow: PivotRow | null = null;
	if (showRowTotals) {
		grandTotalRow = aggregateGroup(
			[],
			leafRows,
			rowFields.length,
			columns,
			valueFields,
			aggregations,
			buckets,
		);
		grandTotalRow.isGrandTotal = true;
		grandTotalRow.level = rowFields.length;
		// Display label: empty headers + "Grand Total" prepended below
		grandTotalRow.rowHeaders = [
			"Grand Total",
			...new Array(Math.max(0, rowFields.length - 1)).fill(""),
		];
	}

	return {
		rowFields,
		columnFields,
		valueFields,
		columns,
		rows: renderedRows,
		grandTotalRow,
		hasGrandTotalColumn: showColumnTotals,
	};
}

/**
 * Transforms flat row data into a pivoted structure with multi-dimensional
 * row grouping and column pivoting (crosstab).
 *
 * Returns an empty result when required configuration is missing — the
 * consumer is expected to render an empty-state UI.
 */
export function usePivotTransform(
	data: any[],
	config: VisualizationConfig | undefined,
): PivotResult {
	return useMemo(() => pivotTransform(data, config), [data, config]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Aggregate a group of leaf rows by re-running aggregations over raw bucket values. */
function aggregateGroup(
	prefix: string[],
	groupRows: PivotRow[],
	totalRowFields: number,
	columns: PivotColumn[],
	valueFields: string[],
	aggregations: Record<string, string>,
	buckets: Map<string, Map<string, Map<string, any[]>>>,
): PivotRow {
	const cells: Record<string, number | null> = {};
	const rowTotals: Record<string, number | null> = {};

	// Collect raw values across all leaf rows in this group, per (column, value)
	columns.forEach((col) => {
		const comboKey = col.columnHeaders.length
			? buildKey(col.columnHeaders)
			: "";
		const allRaw: any[] = [];
		groupRows.forEach((leaf) => {
			const colMap = buckets.get(leaf.rowKey);
			const valMap = colMap?.get(comboKey);
			const raw = valMap?.get(col.valueField) ?? [];
			allRaw.push(...raw);
		});
		cells[col.key] = aggregate(allRaw, col.aggregation);
	});

	// Row totals across all columns
	valueFields.forEach((vf) => {
		const agg = aggregations[vf] ?? "sum";
		const allRaw: any[] = [];
		groupRows.forEach((leaf) => {
			const colMap = buckets.get(leaf.rowKey);
			colMap?.forEach((valMap) => {
				const raw = valMap.get(vf) ?? [];
				allRaw.push(...raw);
			});
		});
		rowTotals[vf] = aggregate(allRaw, agg);
	});

	// Build display headers: prefix labels + (totalRowFields - prefix.length) empty cells
	const headers = [...prefix];
	while (headers.length < totalRowFields) headers.push("");

	return {
		rowKey: `__group__${buildKey(prefix)}`,
		rowHeaders: headers,
		cells,
		rowTotals,
		level: 0,
	};
}
