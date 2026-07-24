/**
 * Portal-local chart preview — recharts only, no @semoss/sdk-react.
 * Receives pre-loaded data (test query result) and renders the selected chart type.
 */

import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	Treemap,
	XAxis,
	YAxis,
} from "recharts";
import { Bar_Chart } from "@/components/visualizations/Bar_Chart";
import { BoxPlotChart } from "@/components/visualizations/BoxPlotChart";
import { BubbleChart } from "@/components/visualizations/BubbleChart";
import { ClusterChart } from "@/components/visualizations/ClusterChart";
import { HalfDonutChart } from "@/components/visualizations/HalfDonutChart";
import { HeatmapChart } from "@/components/visualizations/HeatmapChart";
import { HtmlBlockVisualization } from "@/components/visualizations/HtmlBlockVisualization";
import { KPI } from "@/components/visualizations/KPI";
import { Line_Chart } from "@/components/visualizations/Line_Chart";
import { MultiLineChart } from "@/components/visualizations/MultiLineChart";
import { Pie_Chart } from "@/components/visualizations/Pie_Chart";
import { PivotTable } from "@/components/visualizations/PivotTable";
import { PolarBarChart } from "@/components/visualizations/PolarBarChart";
import { SunburstChart } from "@/components/visualizations/SunburstChart";
import { TableView } from "@/components/visualizations/TableView";
import { WordCloud } from "@/components/visualizations/WordCloud";
import { WorldMapChart } from "@/components/visualizations/WorldMapChart";
import { CsvExportButton } from "@/components/widgets/CsvExportButton";
import { FilterWidget } from "@/components/widgets/FilterWidget";
import { usePivotTransform } from "@/hooks/usePivotTransform";
import { applyVizFilter } from "@/lib/vizFilter";
import { applyVizSort } from "@/lib/vizSort";
import type { VisualizationConfig, VisualizationType } from "../types";

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

type RcHeight = number | `${number}%`;

interface Props {
	visualizationType: VisualizationType;
	config?: VisualizationConfig;
	data: any[];
	height?: RcHeight;
	/** Filter widget: pre-selected values (persisted from a prior editor session). */
	filterDefaultValues?: string[];
	/** Filter widget: called when the user changes the selection so the editor can persist it. */
	onFilterDefaultValuesChange?: (values: string[]) => void;
}

export function ChartPreview({
	visualizationType: vt,
	config = {},
	data: rawData,
	height = "100%",
	filterDefaultValues,
	onFilterDefaultValuesChange,
}: Props) {
	// Author-defined per-viz filter (Filter Visualization tool) applies before render.
	const data = applyVizSort(
		applyVizFilter(rawData ?? [], (config as any).styling?.vizFilter),
		(config as any).styling?.sortValues,
	);
	// Pivot transform must run unconditionally to satisfy rules-of-hooks.
	// Cast: portal's VisualizationConfig is a structural subset of the shared
	// dashboard config (kpiAggregation enums differ slightly).
	const pivotResult = usePivotTransform(data, config as any);

	// Chart title from Tools tab
	const titleCfg = (config as any).styling?.title;
	const titleEl = titleCfg?.text ? (
		<p
			style={{
				fontSize: titleCfg.fontSize
					? `${titleCfg.fontSize}px`
					: undefined,
				color: titleCfg.color || undefined,
				textAlign: titleCfg.textAlign || "left",
				fontWeight: titleCfg.fontWeight || undefined,
				fontFamily: titleCfg.fontFamily || undefined,
			}}
			className="flex-shrink-0 px-2 pt-2 pb-1 font-semibold text-slate-800 text-sm"
		>
			{titleCfg.text}
		</p>
	) : null;

	const xKey = config.xKey ?? (data[0] ? Object.keys(data[0])[0] : "");
	const yKeys = config.yKeys?.length
		? config.yKeys
		: data[0]
			? Object.keys(data[0]).slice(1)
			: [];

	/** Wraps a chart element with the optional title above it */
	const withTitle = (chart: React.ReactNode) =>
		titleEl ? (
			<div className="flex h-full flex-col">
				{titleEl}
				<div className="min-h-0 flex-1">{chart}</div>
			</div>
		) : (
			<>{chart}</>
		);

	if (vt === "csvexport") {
		return withTitle(
			<CsvExportButton
				rows={data}
				title="export"
				config={config as any}
			/>,
		);
	}

	if (vt === "filter") {
		return withTitle(
			<FilterWidget
				vizId="preview"
				title=""
				column={(config as any).filterColumn ?? ""}
				targets={(config as any).filterTargets ?? []}
				rows={data}
				defaultValues={filterDefaultValues}
				onDefaultValuesChange={onFilterDefaultValuesChange}
			/>,
		);
	}

	// HTML Block: renders directly from config, no chart data needed
	if (vt === "htmlblock") {
		return (
			<div className="h-full w-full">
				<HtmlBlockVisualization config={config as any} />
			</div>
		);
	}

	if (!data.length) {
		return withTitle(
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data to preview
			</div>,
		);
	}

	const margin = { top: 8, right: 16, bottom: 8, left: 8 };
	const common = { data, margin };

	if (vt === "heatmap") {
		return withTitle(<HeatmapChart data={data} config={config as any} />);
	}
	if (vt === "halfdonut") {
		return withTitle(<HalfDonutChart data={data} config={config as any} />);
	}

	if (vt === "boxplot") {
		return withTitle(<BoxPlotChart data={data} config={config as any} />);
	}

	if (vt === "polarbar") {
		return withTitle(<PolarBarChart data={data} config={config as any} />);
	}

	if (vt === "cluster") {
		return withTitle(<ClusterChart data={data} config={config as any} />);
	}

	if (vt === "multiline") {
		return withTitle(<MultiLineChart data={data} config={config as any} />);
	}

	if (vt === "worldmap") {
		return withTitle(<WorldMapChart data={data} config={config as any} />);
	}

	if (vt === "wordcloud") {
		return withTitle(<WordCloud data={data} config={config as any} />);
	}

	if (vt === "bubble") {
		return withTitle(<BubbleChart data={data} config={config as any} />);
	}

	if (vt === "sunburst") {
		return withTitle(<SunburstChart data={data} config={config as any} />);
	}

	if (vt === "kpi") {
		return (
			<div className="flex h-full min-h-[160px] flex-col overflow-hidden">
				<KPI data={data} config={config as any} />
			</div>
		);
	}

	if (vt === "pie") {
		return withTitle(<Pie_Chart data={data} config={config as any} />);
	}

	if (vt === "radar") {
		return withTitle(
			<ResponsiveContainer width="100%" height={height}>
				<RadarChart data={data}>
					<PolarGrid />
					<PolarAngleAxis dataKey={xKey} />
					{yKeys.map((k, i) => (
						<Radar
							key={k}
							dataKey={k}
							isAnimationActive={false}
							stroke={PALETTE[i % PALETTE.length]}
							fill={PALETTE[i % PALETTE.length]}
							fillOpacity={0.25}
						/>
					))}
					<Tooltip />
					<Legend />
				</RadarChart>
			</ResponsiveContainer>,
		);
	}

	if (vt === "treemap") {
		const tm = data.map((r) => ({
			name: String(r[xKey]),
			size: Number(r[yKeys[0]]) || 1,
		}));
		return withTitle(
			<ResponsiveContainer width="100%" height={height}>
				<Treemap
					data={tm}
					dataKey="size"
					nameKey="name"
					isAnimationActive={false}
					content={({ x, y, width, height: h, name, index }: any) => (
						<g>
							<rect
								x={x}
								y={y}
								width={width}
								height={h}
								style={{
									fill: PALETTE[
										(index ?? 0) % PALETTE.length
									],
									stroke: "#fff",
									strokeWidth: 2,
								}}
							/>
							{width > 40 && h > 20 && (
								<text
									x={x + width / 2}
									y={y + h / 2}
									textAnchor="middle"
									dominantBaseline="middle"
									fill="#fff"
									fontSize={11}
									fontWeight={600}
								>
									{name}
								</text>
							)}
						</g>
					)}
				/>
			</ResponsiveContainer>,
		);
	}

	if (vt === "scatter") {
		return withTitle(
			<ResponsiveContainer width="100%" height={height}>
				<ScatterChart margin={common.margin}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
					<XAxis
						dataKey={xKey}
						name={xKey}
						tick={{ fontSize: 11 }}
						label={{
							value: config.xLabel,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						dataKey={yKeys[0]}
						name={yKeys[0]}
						tick={{ fontSize: 11 }}
						label={{
							value: config.yLabel,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip cursor={{ strokeDasharray: "3 3" }} />
					<Scatter
						data={data}
						fill={PALETTE[0]}
						isAnimationActive={false}
					/>
				</ScatterChart>
			</ResponsiveContainer>,
		);
	}

	if (vt === "pivot") {
		return withTitle(
			<div className="flex h-full min-h-[300px] flex-col">
				<PivotTable
					pivot={pivotResult}
					styling={(config as any).styling}
				/>
			</div>,
		);
	}

	if (vt === "area") {
		return withTitle(
			<ResponsiveContainer width="100%" height={height}>
				<AreaChart data={data} margin={margin}>
					<defs>
						{yKeys.map((k, i) => (
							<linearGradient
								key={k}
								id={`ag-${i}`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor={PALETTE[i % PALETTE.length]}
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor={PALETTE[i % PALETTE.length]}
									stopOpacity={0}
								/>
							</linearGradient>
						))}
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
					<XAxis
						dataKey={xKey}
						tick={{ fontSize: 11 }}
						label={
							config.xLabel
								? {
										value: config.xLabel,
										position: "insideBottom",
										offset: -4,
										fontSize: 11,
									}
								: undefined
						}
					/>
					<YAxis
						tick={{ fontSize: 11 }}
						label={
							config.yLabel
								? {
										value: config.yLabel,
										angle: -90,
										position: "insideLeft",
										fontSize: 11,
									}
								: undefined
						}
					/>
					<Tooltip />
					<Legend />
					{yKeys.map((k, i) => (
						<Area
							key={k}
							type="monotone"
							dataKey={k}
							isAnimationActive={false}
							stroke={PALETTE[i % PALETTE.length]}
							fill={`url(#ag-${i})`}
							strokeWidth={2}
							dot={false}
						/>
					))}
				</AreaChart>
			</ResponsiveContainer>,
		);
	}

	if (vt === "line") {
		return withTitle(<Line_Chart data={data} config={config as any} />);
	}

	if (vt === "table") {
		// Delegate to the shared `TableView` so editor preview honors header /
		// cell styling, color rules, wrap text, and `fitContainerWidth` exactly
		// the same way the published dashboard does.
		return withTitle(<TableView data={data} config={config as any} />);
	}

	if (vt === "stackbar") {
		return withTitle(
			<Bar_Chart data={data} config={config as any} stacked />,
		);
	}

	// default: bar
	return withTitle(<Bar_Chart data={data} config={config as any} />);
}
