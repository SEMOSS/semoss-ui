/**
 * Bar chart visualization.
 *
 * Renders a vertical bar chart with one bar per unique value of `config.xKey`
 * and one stacked / grouped series per `config.yKeys[]`. Aggregation, axis
 * styling, value labels, color rules, and trendlines are all driven by
 * `config.styling.bar`.
 *
 * Trendline note: the trendline is a connect-the-dots overlay through the
 * first Y series' values (so bars and line stay aligned). The selected
 * curve type determines the interpolation between bar tops.
 */

import { BarChart2 } from "lucide-react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	LabelList,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CanvasBarChart } from "@/components/visualizations/CanvasBarChart";
import {
	AXIS_STYLE,
	aggregateChartData,
	aggregateValue,
	buildDefaultYAxisTitle,
	CHART_COLORS,
	ChartTooltip,
	compareColorRule,
	GRID_STYLE,
} from "@/components/visualizations/shared/chartShared";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	curveTypeToRecharts,
	type VisualizationConfig,
} from "@/types/dashboard";

interface BarChartVizProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	/** Stack the Y series on top of one another (stacked bar chart) instead of grouping side by side. */
	stacked?: boolean;
}

export function Bar_Chart({ data, config, stacked = false }: BarChartVizProps) {
	const xKey = config?.xKey ?? "";
	const yKeys = config?.yKeys ?? [];
	const styling = config?.styling?.bar ?? {};
	const xCfg = styling.xAxisConfig ?? {};
	const yCfg = styling.yAxisConfig ?? {};
	const showValueLabels = styling.showValueLabels === true;
	const barWidth = styling.barWidth ?? 60;
	const trendlineType = styling.trendlineType ?? "none";
	const showLegend = styling.showLegend ?? true;
	const colorRules = useMemo<ColorRule[]>(
		() => styling.colorRules ?? [],
		[styling.colorRules],
	);

	// Resolve palette: prefer config.styling.colorPalette, fall back to default
	const palette = useMemo(() => {
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config?.styling?.colorPalette]);

	// Aggregate raw rows by xKey
	const chartData = useMemo(
		() => aggregateChartData(data, xKey, yKeys, config),
		[data, xKey, yKeys, config],
	);

	// Facet (stack-by): when the stacked chart has a `facetKey`, pivot a SINGLE measure
	// (yKeys[0]) so each distinct facet value becomes its own stacked series. Otherwise
	// the series are the yKeys themselves (multi-measure stack).
	const facetKey = stacked ? config?.facetKey || "" : "";
	const facetMode = !!(facetKey && yKeys[0]);
	const { renderData, seriesKeys } = useMemo(() => {
		if (facetMode) {
			const yk = yKeys[0];
			// Honor the measure's configured aggregation (sum/avg/count/min/max/…),
			// computed per (x, facet) bucket — not a hard-coded sum.
			const aggType = config?.columnAggregations?.[yk] || "sum";
			// O(n): Sets/Maps for lookups (array.includes in the loop was O(n²) and
			// would hang the tab on large/high-cardinality data).
			const xs: string[] = [];
			const xsSeen = new Set<string>();
			const facets: string[] = [];
			const facetsSeen = new Set<string>();
			const buckets = new Map<string, Map<string, unknown[]>>();
			for (const r of data) {
				const x = String(r[xKey] ?? "");
				const f = String(r[facetKey] ?? "");
				if (!xsSeen.has(x)) {
					xsSeen.add(x);
					xs.push(x);
				}
				if (f !== "" && !facetsSeen.has(f)) {
					facetsSeen.add(f);
					facets.push(f);
				}
				let xb = buckets.get(x);
				if (!xb) {
					xb = new Map();
					buckets.set(x, xb);
				}
				let arr = xb.get(f);
				if (!arr) {
					arr = [];
					xb.set(f, arr);
				}
				arr.push(r[yk]);
			}
			const rows = xs.map((x) => {
				const row: Record<string, unknown> = { [xKey]: x };
				const xb = buckets.get(x);
				if (xb)
					for (const [f, arr] of xb)
						row[f] = aggregateValue(arr, aggType);
				return row;
			});
			return { renderData: rows, seriesKeys: facets };
		}
		return { renderData: chartData, seriesKeys: yKeys };
	}, [facetMode, facetKey, data, xKey, yKeys, chartData]);

	// Trendline values, computed only when enabled. Plots the actual first-Y
	// value at each x so the line passes through bar tops; the selected curve
	// type determines how it interpolates between those points.
	const trendlineData = useMemo(() => {
		if (trendlineType === "none" || !yKeys.length || !chartData.length)
			return null;
		return chartData.map((row) => ({
			...row,
			_trend: Number(row[yKeys[0]]) || 0,
		}));
	}, [trendlineType, chartData, yKeys]);

	if (!xKey || !yKeys.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<BarChart2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to X-Axis and Y-Axis drop zones
					</p>
				</div>
			</div>
		);
	}

	// Recharts draws SVG (one node per bar). Past a safe mark count that would bog
	// down or crash the DOM, fall back to the canvas renderer, which paints the same
	// bars as pixels and handles hundreds of thousands of them (legacy parity).
	// Normal-size charts stay on Recharts below, keeping full styling + tooltips.
	const SVG_MARK_LIMIT = 8000; // categories × series
	const totalMarks = renderData.length * Math.max(1, seriesKeys.length);
	if (totalMarks > SVG_MARK_LIMIT) {
		return (
			<CanvasBarChart
				renderData={renderData}
				seriesKeys={seriesKeys}
				xKey={xKey}
				palette={palette}
				stacked={stacked}
			/>
		);
	}

	/** Resolve a fill color for a given row + Y series. ColorRule wins over palette. */
	const colorForBar = (
		row: Record<string, unknown>,
		_seriesKey: string,
		seriesIndex: number,
	): string => {
		for (const rule of colorRules) {
			const candidate: unknown = row[rule.valueColumn];
			if (compareColorRule(rule.comparator, candidate, rule.value))
				return rule.color;
		}
		return palette[seriesIndex % palette.length];
	};

	const xAxisLabel = xCfg.title ?? config?.xLabel ?? (xKey || undefined);
	const yAxisLabel =
		yCfg.title ??
		config?.yLabel ??
		(buildDefaultYAxisTitle(yKeys, config?.columnAggregations) ||
			undefined);

	// ComposedChart only used when a trendline is requested (overlaying a Line);
	// pure BarChart otherwise. Trendline is not supported in facet mode (the pivoted
	// rows don't carry the original measure series the trendline traces).
	const useComposed = trendlineType !== "none" && !facetMode;
	const ChartComponent: typeof BarChart | typeof ComposedChart = useComposed
		? ComposedChart
		: BarChart;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ChartComponent
				data={facetMode ? renderData : (trendlineData ?? chartData)}
				barCategoryGap="30%"
				margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
			>
				<CartesianGrid {...GRID_STYLE} vertical={false} />
				<XAxis
					dataKey={xKey}
					tick={
						xCfg.showLabels === false
							? false
							: {
									...AXIS_STYLE,
									fontSize:
										xCfg.fontSize ?? AXIS_STYLE.fontSize,
								}
					}
					axisLine={false}
					tickLine={xCfg.showTicks ?? true}
					tickMargin={xCfg.axisGap ?? undefined}
					angle={xCfg.rotateValues ?? 0}
					textAnchor={xCfg.rotateValues ? "end" : "middle"}
					label={
						xAxisLabel
							? {
									value: xAxisLabel,
									position: "insideBottom",
									offset: -4,
									fontSize: 11,
									fill: "#64748b",
								}
							: undefined
					}
				/>
				<YAxis
					tick={
						yCfg.showLabels === false
							? false
							: {
									...AXIS_STYLE,
									fontSize:
										yCfg.fontSize ?? AXIS_STYLE.fontSize,
								}
					}
					axisLine={false}
					tickLine={yCfg.showTicks ?? true}
					tickMargin={yCfg.axisGap ?? undefined}
					width={48}
					label={
						yAxisLabel
							? {
									value: yAxisLabel,
									angle: -90,
									position: "insideLeft",
									fontSize: 11,
									fill: "#64748b",
								}
							: undefined
					}
				/>
				<Tooltip
					content={<ChartTooltip config={config} />}
					cursor={{ fill: "#f8fafc" }}
				/>
				{showLegend && (
					<Legend
						wrapperStyle={{
							fontSize: 11,
							color: "#64748b",
							paddingTop: 8,
						}}
					/>
				)}
				{seriesKeys.map((k, i) => (
					<Bar
						key={k}
						dataKey={k}
						// Animations off: with many charts on a sheet, mount animations
						// re-render geometry every frame and cause noticeable jank.
						isAnimationActive={false}
						// When stacked, all series share one stackId; only the top
						// series gets rounded corners so the stack reads as one bar.
						stackId={stacked ? "stack" : undefined}
						radius={
							stacked
								? i === seriesKeys.length - 1
									? [3, 3, 0, 0]
									: [0, 0, 0, 0]
								: [3, 3, 0, 0]
						}
						barSize={barWidth}
						// Default fill (used when no per-row override applies). Per-row Cells override below.
						fill={palette[i % palette.length]}
					>
						{renderData.map((row, idx) => (
							<Cell
								key={`${k}-${idx}`}
								fill={colorForBar(row, k, i)}
							/>
						))}
						{showValueLabels && (
							<LabelList
								dataKey={k}
								// Stacked segments are labelled in-place; grouped bars on top.
								position={stacked ? "center" : "top"}
								style={{
									fontSize: 10,
									fill: stacked ? "#fff" : "#64748b",
								}}
								formatter={
									((v: unknown) =>
										typeof v === "number"
											? v.toLocaleString()
											: String(v ?? "")) as never
								}
							/>
						)}
					</Bar>
				))}
				{useComposed && trendlineData && (
					<Line
						type={curveTypeToRecharts(
							trendlineType as Exclude<
								typeof trendlineType,
								"none"
							>,
						)}
						dataKey="_trend"
						stroke="#64748b"
						strokeWidth={2}
						dot={{ r: 3, strokeWidth: 0, fill: "#64748b" }}
						activeDot={false}
						legendType="none"
						isAnimationActive={false}
					/>
				)}
			</ChartComponent>
		</ResponsiveContainer>
	);
}
