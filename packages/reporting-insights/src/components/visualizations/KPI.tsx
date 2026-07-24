import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import type React from "react";
import { formatKpiNumber } from "@/lib/kpiFormat";
import { applyVizFilter } from "@/lib/vizFilter";
import type { ChartTitleConfig, VisualizationConfig } from "@/types/dashboard";

// Local copy of palette so this component is self-contained for portal consumption
const CHART_COLORS = [
	"#6366f1",
	"#0ea5e9",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
	"#f97316",
];

type KpiData = Record<string, unknown>;

// Aggregation helper
export function aggregateKpiValue(
	data: KpiData[],
	col: string,
	config?: VisualizationConfig,
): number {
	const agg =
		config?.columnAggregations?.[col] ?? config?.kpiAggregation ?? "sum";

	if (agg === "count") return data.length;
	if (agg === "countUnique") {
		const uniqueVals = new Set(data.map((r) => r[col]));
		return uniqueVals.size;
	}

	const vals = data.map((r) => Number(r[col])).filter((v) => !isNaN(v));
	if (!vals.length) return 0;

	switch (agg) {
		case "avg":
			return vals.reduce((a, b) => a + b, 0) / vals.length;
		case "max":
			return Math.max(...vals);
		case "min":
			return Math.min(...vals);
		case "median": {
			const sorted = [...vals].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 === 0
				? (sorted[mid - 1] + sorted[mid]) / 2
				: sorted[mid];
		}
		case "last":
			return vals[vals.length - 1];
		default:
			return vals.reduce((a, b) => a + b, 0); // sum
	}
}

// Renders one KPI card per configured metric column
export function KPI({
	data,
	config,
}: {
	data: KpiData[];
	config?: VisualizationConfig;
}) {
	const cfg = config ?? {};

	const kpiStyling = cfg.styling?.kpi;
	const colorPalette = cfg.styling?.colorPalette;
	const chartColors = colorPalette?.colors ?? CHART_COLORS;
	const titleConfig = cfg.styling?.title;
	/**
	 * Per-metric title overrides. When a metric has its own entry in
	 * `kpiStyling.titles`, that config is used in full (text + style); when
	 * absent, the card falls back to the shared `styling.title` (the global
	 * default for all cards). Editing in the tools panel is gated by an
	 * "Apply to" dropdown — see `KpiTitles` tool.
	 */
	const titleOverrides = kpiStyling?.titles;
	/** `'vertical'` stacks cards top-to-bottom; default `'horizontal'` wraps. */
	const layout = kpiStyling?.layout ?? "horizontal";

	// Filter configured yKeys to those actually present in the data
	const cols = data.length ? Object.keys(data[0]) : [];
	const yKeys = (cfg.yKeys ?? []).filter((k) => cols.includes(k));

	const formatAggregation = (agg: string): string => {
		const aggMap: Record<string, string> = {
			sum: "Sum",
			avg: "Average",
			count: "Count",
			countUnique: "Unique Count",
			max: "Maximum",
			min: "Minimum",
			median: "Median",
			last: "Last",
		};
		return aggMap[agg] || agg;
	};

	const getTitleStyle = (perCard?: ChartTitleConfig): React.CSSProperties => {
		const t = perCard ?? titleConfig;
		if (!t) return {};

		const fontWeightMap: Record<string, number> = {
			normal: 400,
			medium: 500,
			semibold: 600,
			bold: 700,
		};

		return {
			fontSize: t.fontSize ? `${t.fontSize}px` : "11px",
			color: t.color || "#64748b",
			fontWeight: t.fontWeight ? fontWeightMap[t.fontWeight] : 600,
			fontFamily: t.fontFamily || "inherit",
			textAlign: t.textAlign || "left",
		};
	};

	const getKpiTitle = (
		col: string,
		agg: string,
		perCard?: ChartTitleConfig,
	): string => {
		// Per-card override has full priority over the shared title
		if (perCard?.text && perCard.text.trim() !== "") return perCard.text;
		if (titleConfig?.text && titleConfig.text.trim() !== "")
			return titleConfig.text;
		return `${formatAggregation(agg)} of ${col}`;
	};

	const formatNum = (n: number): string => formatKpiNumber(n, cfg);

	const getTrend = (rows: KpiData[], col: string) => {
		if (rows.length < 2) return null;
		const curr = Number(rows[rows.length - 1][col]) || 0;
		const prev = Number(rows[rows.length - 2][col]) || 0;
		if (prev === 0) return null;
		const pct = ((curr - prev) / Math.abs(prev)) * 100;
		return { pct, up: pct >= 0 };
	};

	const evaluateKpiColorRule = (
		metricColumn: string,
		value: number,
	): string | null => {
		if (!kpiStyling?.colorRules) return null;
		for (const rule of kpiStyling.colorRules) {
			if (rule.metricColumn !== metricColumn) continue;
			let match = false;
			switch (rule.comparator) {
				case "gt":
					match = value > rule.value;
					break;
				case "lt":
					match = value < rule.value;
					break;
				case "gte":
					match = value >= rule.value;
					break;
				case "lte":
					match = value <= rule.value;
					break;
				case "eq":
					match = value === rule.value;
					break;
				case "neq":
					match = value !== rule.value;
					break;
				case "range":
					match =
						value >= rule.value &&
						rule.maxValue !== undefined &&
						value <= rule.maxValue;
					break;
			}
			if (match) return rule.color;
		}
		return null;
	};

	if (!yKeys.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<Activity className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No metrics configured</p>
					<p className="mt-1 text-xs">
						Drag columns to the Metrics drop zone
					</p>
				</div>
			</div>
		);
	}

	// Wrapper layout — all variants scroll INTERNALLY (`overflow-auto`) so a large
	// card count never pushes content off the page:
	//  • horizontal — wraps cards in a row (each grows, sensible min width)
	//  • vertical   — stacks them in a single full-width column
	//  • grid       — auto-fitting tile grid that packs cards tightly to fit
	const isGrid = layout === "grid";
	const wrapperClass = isGrid
		? "h-full grid gap-2 p-1.5 overflow-auto content-start"
		: layout === "vertical"
			? `h-full flex flex-col gap-2 p-1.5 overflow-auto ${yKeys.length === 1 ? "items-center justify-center" : ""}`
			: `h-full flex flex-wrap gap-2 p-1.5 overflow-auto content-center ${
					yKeys.length === 1
						? "items-center justify-center"
						: "items-start"
				}`;
	const wrapperStyle: React.CSSProperties = isGrid
		? { gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }
		: {};
	// Card sizing depends on layout: horizontal cards grow with a min width;
	// vertical/grid cards fill their track. Grid drops the flex min so cards can
	// shrink to fit their column.
	const cardClass =
		layout === "vertical"
			? "flex flex-col gap-2 bg-white rounded-2xl border border-slate-200 px-6 py-5 w-full shadow-sm"
			: isGrid
				? "flex flex-col gap-2 bg-white rounded-2xl border border-slate-200 px-5 py-4 w-full min-w-0 shadow-sm"
				: "flex flex-col gap-2 bg-white rounded-2xl border border-slate-200 px-6 py-5 flex-1 min-w-[160px] shadow-sm";

	return (
		<div className={wrapperClass} style={wrapperStyle}>
			{yKeys.map((col, i) => {
				// Per-card filter (Filter Visualization tool): each KPI metric can
				// restrict its own rows before aggregating, so cards from the same
				// query can show differently-filtered values.
				const metricData = applyVizFilter(
					data,
					kpiStyling?.vizFilters?.[col],
				);
				const value = aggregateKpiValue(metricData, col, cfg);
				const trend = getTrend(metricData, col);
				const color = chartColors[i % chartColors.length];
				const agg =
					cfg.columnAggregations?.[col] ??
					cfg.kpiAggregation ??
					"sum";
				const perCardTitle = titleOverrides?.[col];

				const ruleColor = evaluateKpiColorRule(col, value);
				const cardStyle: React.CSSProperties = {
					backgroundColor: kpiStyling?.backgroundColor,
					fontFamily: kpiStyling?.fontFamily,
					textAlign: kpiStyling?.textAlign,
				};

				let valueColor = kpiStyling?.fontColor ?? "#0f172a";
				let trendColor: string | undefined;

				if (ruleColor && kpiStyling?.colorRules) {
					const appliedRule = kpiStyling.colorRules.find(
						(r) =>
							r.metricColumn === col &&
							evaluateKpiColorRule(col, value) === r.color,
					);
					if (appliedRule) {
						if (appliedRule.applyTo === "background") {
							cardStyle.backgroundColor = ruleColor;
						} else if (appliedRule.applyTo === "value") {
							valueColor = ruleColor;
						} else if (appliedRule.applyTo === "trend") {
							trendColor = ruleColor;
						}
					}
				}

				return (
					<div
						key={col}
						className={cardClass}
						style={{
							borderTop: `3px solid ${color}`,
							...cardStyle,
						}}
					>
						<p
							className="truncate font-semibold text-slate-500 text-xs uppercase tracking-widest"
							style={getTitleStyle(perCardTitle)}
						>
							{getKpiTitle(col, agg, perCardTitle)}
						</p>
						<p
							className="mt-1 font-bold text-4xl text-slate-900 tabular-nums leading-none"
							style={{
								fontSize: `${kpiStyling?.fontSize ?? 36}px`,
								color: valueColor,
							}}
						>
							{formatNum(value)}
						</p>
						{trend ? (
							<div
								className="mt-1 flex items-center gap-1.5 font-semibold text-sm"
								style={{
									color:
										trendColor ||
										(trend.up ? "#059669" : "#ef4444"),
								}}
							>
								{trend.up ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								<span>{Math.abs(trend.pct).toFixed(1)}%</span>
								<span className="font-normal text-slate-400 text-xs">
									vs previous
								</span>
							</div>
						) : (
							<p className="mt-1 text-slate-400 text-xs">
								{metricData.length.toLocaleString()} row
								{metricData.length !== 1 ? "s" : ""} · {agg}
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
