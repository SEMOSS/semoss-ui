/**
 * Shared chart helpers extracted from `DashboardVisualization.tsx` so that
 * the per-chart viz files (Bar / Line / Pie / etc.) can re-use the same
 * tooltip, palette, axis styling, and group-by aggregation logic without
 * importing back from their parent (which would create a circular dep).
 */

import { formatValue } from "@/lib/formatValue";
import type { VisualizationConfig } from "@/types/dashboard";

/** Default categorical chart palette. Re-exported by `DashboardVisualization`. */
export const CHART_COLORS = [
	"#6366f1",
	"#0ea5e9",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
	"#f97316",
];

/** Default numeric tick style for X / Y axes. */
export const AXIS_STYLE = { fontSize: 11, fill: "#94a3b8" } as const;

/** Default cartesian grid style. */
export const GRID_STYLE = { stroke: "#f1f5f9", strokeDasharray: "0" } as const;

/** Aggregate a list of raw values using the supplied aggregation type. */
export function aggregateValue(values: unknown[], aggType: string): number {
	if (aggType === "count") return values.length;
	if (aggType === "countUnique") return new Set(values).size;

	const numVals = values.map((v) => Number(v)).filter((v) => !isNaN(v));
	if (!numVals.length) return 0;

	switch (aggType) {
		case "avg":
			return numVals.reduce((a, b) => a + b, 0) / numVals.length;
		case "sum":
			return numVals.reduce((a, b) => a + b, 0);
		case "max":
			return Math.max(...numVals);
		case "min":
			return Math.min(...numVals);
		case "median": {
			const sorted = [...numVals].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 === 0
				? (sorted[mid - 1] + sorted[mid]) / 2
				: sorted[mid];
		}
		case "last":
			return numVals[numVals.length - 1];
		default:
			return numVals.reduce((a, b) => a + b, 0); // sum
	}
}

/**
 * Group raw rows by `xKey` and aggregate each Y series + tooltip column.
 * Mirrors the inline `chartData` memo previously inside `DashboardVisualization`.
 */
export function aggregateChartData(
	data: Record<string, unknown>[],
	xKey: string,
	yKeys: string[],
	config: VisualizationConfig | undefined,
): Record<string, unknown>[] {
	if (!data.length || !xKey || !yKeys.length) return data;

	const cfg = config ?? {};
	// Support both new tooltips[] and legacy single tooltip string
	const tooltipCols: Array<{ column: string; aggregation: string }> = cfg
		.tooltips?.length
		? cfg.tooltips
		: cfg.tooltip
			? [
					{
						column: cfg.tooltip,
						aggregation:
							cfg.tooltipAggregation ||
							cfg.columnAggregations?.[cfg.tooltip] ||
							"count",
					},
				]
			: [];
	const grouped = new Map<
		string,
		{ [k: string]: unknown; _values: Record<string, unknown[]> }
	>();

	data.forEach((row) => {
		const key = String(row[xKey] ?? "");
		if (!grouped.has(key)) {
			grouped.set(key, { [xKey]: key, _values: {} });
		}
		const g = grouped.get(key)!;
		yKeys.forEach((k) => {
			if (!g._values[k]) g._values[k] = [];
			g._values[k].push(row[k]);
		});
		tooltipCols.forEach(({ column }) => {
			if (!g._values[column]) g._values[column] = [];
			g._values[column].push(row[column]);
		});
	});

	return Array.from(grouped.values()).map((g) => {
		const result: Record<string, unknown> = { [xKey]: g[xKey] };
		yKeys.forEach((k) => {
			const values = g._values[k] || [];
			const aggType = cfg.columnAggregations?.[k] || "sum";
			result[k] = aggregateValue(values, aggType);
		});
		tooltipCols.forEach(({ column, aggregation }) => {
			const vals = g._values[column];
			if (vals)
				result[`_tooltip_${column}`] = aggregateValue(
					vals,
					aggregation,
				);
		});
		return result;
	});
}

interface ChartTooltipProps {
	active?: boolean;
	payload?: Array<{
		dataKey: string;
		value: unknown;
		color: string;
		payload: Record<string, unknown>;
	}>;
	label?: string | number;
	config?: VisualizationConfig;
}

/** Default chart tooltip used by Bar / Line / Pie. Replicates the inline
 *  variant that previously lived inside `DashboardVisualization.tsx`. */
export function ChartTooltip({
	active,
	payload,
	label,
	config,
}: ChartTooltipProps) {
	if (!active || !payload?.length) return null;
	const tooltipCols: Array<{ column: string; aggregation: string }> = config
		?.tooltips?.length
		? config.tooltips
		: config?.tooltip
			? [
					{
						column: config.tooltip,
						aggregation:
							config.tooltipAggregation ||
							config.columnAggregations?.[config.tooltip] ||
							"count",
					},
				]
			: [];
	const data = payload[0].payload;
	const activeTooltips = tooltipCols.filter(
		({ column }) => data[`_tooltip_${column}`] !== undefined,
	);

	return (
		<div className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
			{label !== undefined && (
				<p className="mb-2 max-w-[200px] truncate border-slate-100 border-b pb-2 font-semibold text-slate-700">
					{String(label)}
				</p>
			)}
			<div className="space-y-1">
				{payload.map((entry) => (
					<div
						key={entry.dataKey}
						className="flex items-center justify-between gap-4"
					>
						<div className="flex items-center gap-1.5">
							<span
								className="h-2 w-2 flex-shrink-0 rounded-full"
								style={{ background: entry.color }}
							/>
							<span className="text-slate-500 text-xs">
								{entry.dataKey}
							</span>
						</div>
						<span className="font-semibold text-slate-900 text-xs tabular-nums">
							{formatValue(
								entry.value,
								entry.dataKey,
								config?.styling?.formatRules,
							)}
						</span>
					</div>
				))}
			</div>
			{activeTooltips.length > 0 && (
				<div className="mt-2 space-y-1 border-slate-100 border-t pt-2">
					{activeTooltips.map(({ column, aggregation }) => (
						<div
							key={column}
							className="flex items-center justify-between gap-4"
						>
							<span className="text-slate-500 text-xs capitalize">
								{aggregation} of {column}:
							</span>
							<span className="font-semibold text-slate-700 text-xs tabular-nums">
								{formatValue(
									data[`_tooltip_${column}`],
									column,
									config?.styling?.formatRules,
								)}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/** Compare a candidate value against a ColorRule. Mirrors table/bubble/wordcloud evaluators. */
export function compareColorRule(
	comparator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains",
	candidate: unknown,
	target: string | number,
): boolean {
	if (candidate === undefined || candidate === null) return false;
	const candNum = Number(candidate);
	const targNum = Number(target);
	const candStr = String(candidate);
	const targStr = String(target);
	switch (comparator) {
		case "eq":
			return candStr === targStr;
		case "neq":
			return candStr !== targStr;
		case "gt":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum > targNum
			);
		case "lt":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum < targNum
			);
		case "gte":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum >= targNum
			);
		case "lte":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum <= targNum
			);
		case "contains":
			return candStr.toLowerCase().includes(targStr.toLowerCase());
		default:
			return false;
	}
}

/** Maps a `lineType` styling enum to the corresponding `strokeDasharray`. */
export function strokeDashFor(
	lineType: "solid" | "dashed" | "dotted" | undefined,
): string | undefined {
	switch (lineType) {
		case "dashed":
			return "6 4";
		case "dotted":
			return "2 4";
		case "solid":
		default:
			return undefined;
	}
}

/** Human-readable label for an aggregation key (used in default axis titles). */
const AGGREGATION_LABELS: Record<string, string> = {
	sum: "Sum",
	avg: "Average",
	count: "Count",
	countUnique: "Unique Count",
	max: "Maximum",
	min: "Minimum",
	median: "Median",
	last: "Last",
};

/**
 * Build the default Y-axis title for Bar / Line charts:
 * `"<Aggregation> of <Column>"` joined by `, ` for multi-series.
 * Falls back to a comma-joined column list when no aggregations are configured.
 */
export function buildDefaultYAxisTitle(
	yKeys: string[] | undefined,
	columnAggregations: Record<string, string> | undefined,
): string {
	if (!yKeys || !yKeys.length) return "";
	return yKeys
		.map((k) => {
			const agg = columnAggregations?.[k];
			const label = agg ? (AGGREGATION_LABELS[agg] ?? agg) : undefined;
			return label ? `${label} of ${k}` : k;
		})
		.join(", ");
}
