/**
 * Multi-Line chart visualization.
 * One line per unique value in `config.categoryKey`, plotted over `config.xKey`
 * with `config.yKeys[0]` as the Y value.
 */

import {
	CartesianGrid,
	LabelList,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/visualizations/shared/chartShared";
import type { VisualizationConfig } from "@/types/dashboard";

const PALETTE = [
	"#6366f1",
	"#8b5cf6",
	"#ec4899",
	"#f59e0b",
	"#10b981",
	"#3b82f6",
	"#ef4444",
	"#14b8a6",
	"#f97316",
	"#84cc16",
];

interface MultiLineChartProps {
	data: any[];
	config?: VisualizationConfig;
}

/** Simple linear regression — returns predicted Y values for indices 0..n-1 */
function linearRegression(yValues: number[]): number[] {
	const n = yValues.length;
	if (n < 2) return yValues.map(() => NaN);
	const sumX = (n * (n - 1)) / 2;
	const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
	const sumY = yValues.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
	const sumXY = yValues.reduce(
		(acc, y, i) => acc + i * (isNaN(y) ? 0 : y),
		0,
	);
	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
	const intercept = (sumY - slope * sumX) / n;
	return yValues.map((_, i) => slope * i + intercept);
}

/** Apply the configured aggregation over a set of numeric values. Missing combos return 0. */
function aggregateValues(values: number[], aggFn: string): number {
	if (!values.length) return 0;
	switch (aggFn) {
		case "avg":
			return values.reduce((a, b) => a + b, 0) / values.length;
		case "count":
			return values.length;
		case "min":
			return Math.min(...values);
		case "max":
			return Math.max(...values);
		case "sum":
		default:
			return values.reduce((a, b) => a + b, 0);
	}
}

export function MultiLineChart({ data, config }: MultiLineChartProps) {
	const xKey = config?.xKey;
	const yKey = config?.yKeys?.[0];
	const categoryKey = config?.categoryKey;
	const ml = config?.styling?.multiline;
	const aggFn =
		(yKey &&
			(
				config?.columnAggregations as Record<string, string> | undefined
			)?.[yKey]) ??
		"avg";

	// Guard: nothing configured or empty data
	if (!xKey || !yKey || !categoryKey || !data.length) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				{!data.length
					? "No data to display"
					: "Configure X Axis, Y Axis, and Category to display this chart"}
			</div>
		);
	}

	// Unique X values and categories in data-arrival order (no sorting)
	const xValues = Array.from(new Set(data.map((r) => String(r[xKey]))));
	const categories = Array.from(
		new Set(data.map((r) => String(r[categoryKey]))),
	);

	const tooltipEntries: Array<{ column: string; aggregation: string }> =
		config?.tooltips?.length
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

	// Accumulate raw values per (x, category) bucket; tooltip columns accumulated per x only
	const bucketMap: Record<string, Record<string, number[]>> = {};
	const tooltipBuckets: Record<string, Record<string, unknown[]>> = {};
	for (const r of data) {
		const x = String(r[xKey]);
		const cat = String(r[categoryKey]);
		const y = Number(r[yKey]);
		if (!bucketMap[x]) bucketMap[x] = {};
		if (!bucketMap[x][cat]) bucketMap[x][cat] = [];
		if (!isNaN(y)) bucketMap[x][cat].push(y);
		if (tooltipEntries.length) {
			if (!tooltipBuckets[x]) tooltipBuckets[x] = {};
			for (const { column } of tooltipEntries) {
				if (!tooltipBuckets[x][column]) tooltipBuckets[x][column] = [];
				tooltipBuckets[x][column].push(r[column]);
			}
		}
	}

	// Pivot: apply configured aggregation; missing (x, category) combos default to 0
	// so every category has a value at every x-tick and lines render continuously.
	const pivoted = xValues.map((x) => {
		const row: Record<string, any> = { [xKey]: x };
		for (const cat of categories) {
			row[cat] = aggregateValues(bucketMap[x]?.[cat] ?? [], aggFn);
		}
		for (const { column, aggregation } of tooltipEntries) {
			const vals = (tooltipBuckets[x]?.[column] ?? []) as number[];
			if (vals.length)
				row[`_tooltip_${column}`] = aggregateValues(vals, aggregation);
		}
		return row;
	});

	// Overall average across all category values (for reference line)
	const allYValues = categories.flatMap((cat) =>
		pivoted.map((row) => row[cat] as number).filter((v) => !isNaN(v)),
	);
	const average =
		allYValues.length > 0
			? allYValues.reduce((a, b) => a + b, 0) / allYValues.length
			: NaN;

	// Trendline — fit a regression across the mean of all categories at each x
	const meanPerX = pivoted.map((row) => {
		const vals = categories
			.map((cat) => row[cat] as number)
			.filter((v) => !isNaN(v));
		return vals.length
			? vals.reduce((a, b) => a + b, 0) / vals.length
			: NaN;
	});
	const trendValues = linearRegression(meanPerX);
	const trendData = pivoted.map((row, i) => ({
		...row,
		__trend__: trendValues[i],
	}));

	const curveType:
		| "linear"
		| "monotone"
		| "natural"
		| "step"
		| "stepAfter"
		| "stepBefore" = ml?.curveType ?? "monotone";
	const showAvg = ml?.showAverage === true;
	const showValueLabels = ml?.showValueLabels === true;
	const showTrendline = ml?.showTrendline === true;
	const showTooltip = ml?.showTooltip !== false;
	const xCfg = ml?.xAxisConfig;
	const yCfg = ml?.yAxisConfig;

	const paletteColors = config?.styling?.colorPalette?.colors?.length
		? config.styling.colorPalette.colors
		: PALETTE;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={trendData}
				margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
			>
				<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

				<XAxis
					dataKey={xKey}
					type="category"
					padding={{ left: 30, right: 30 }}
					tick={{ fontSize: xCfg?.fontSize ?? 11 }}
					angle={xCfg?.rotateValues ?? 0}
					textAnchor={xCfg?.rotateValues ? "end" : "middle"}
					hide={xCfg?.showLabels === false}
					reversed={xCfg?.flipAxis === true}
					label={
						xCfg?.title
							? {
									value: xCfg.title,
									position: "insideBottomRight",
									offset: -10,
									fontSize: 11,
								}
							: undefined
					}
				/>

				<YAxis
					tick={{ fontSize: yCfg?.fontSize ?? 11 }}
					hide={yCfg?.showLabels === false}
					reversed={yCfg?.flipAxis === true}
					label={
						yCfg?.title
							? {
									value: yCfg.title,
									angle: -90,
									position: "insideLeft",
									fontSize: 11,
								}
							: undefined
					}
				/>

				{showTooltip && (
					<Tooltip content={<ChartTooltip config={config} />} />
				)}
				<Legend />

				{categories.map((cat, i) => {
					const color = paletteColors[i % paletteColors.length];
					return (
						<Line
							key={cat}
							type={curveType}
							dataKey={cat}
							isAnimationActive={false}
							stroke={color}
							strokeWidth={2}
							dot={{ r: 3, fill: color, strokeWidth: 0 }}
							activeDot={{ r: 5 }}
							connectNulls
						>
							{showValueLabels && (
								<LabelList
									dataKey={cat}
									position="top"
									fontSize={10}
								/>
							)}
						</Line>
					);
				})}

				{showTrendline && (
					<Line
						key="__trend__"
						type="linear"
						dataKey="__trend__"
						isAnimationActive={false}
						stroke="#94a3b8"
						strokeDasharray="6 3"
						strokeWidth={1.5}
						dot={false}
						name="Trend"
					/>
				)}

				{showAvg && !isNaN(average) && (
					<ReferenceLine
						y={average}
						stroke="#94a3b8"
						strokeDasharray="4 4"
						label={{
							value: "Avg",
							position: "insideTopRight",
							fontSize: 10,
							fill: "#94a3b8",
						}}
					/>
				)}
			</LineChart>
		</ResponsiveContainer>
	);
}
