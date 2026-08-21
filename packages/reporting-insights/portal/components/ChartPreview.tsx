/**
 * Portal-local chart preview — recharts only, no @semoss/sdk-react.
 * Receives pre-loaded data (test query result) and renders the selected chart type.
 */

import {
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
	XAxis,
	YAxis,
} from "recharts";
import { Area_Chart } from "@/components/visualizations/Area_Chart";
import { Bar_Chart } from "@/components/visualizations/Bar_Chart";
import { BoxPlotChart } from "@/components/visualizations/BoxPlotChart";
import { BubbleChart } from "@/components/visualizations/BubbleChart";
import { ClusterChart } from "@/components/visualizations/ClusterChart";
import { Combo_Chart } from "@/components/visualizations/Combo_Chart";
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
import { ChartTooltip } from "@/components/visualizations/shared/chartShared";
import { PaginatedLegend } from "@/components/visualizations/shared/PaginatedLegend";
import { TableView } from "@/components/visualizations/TableView";
import { TreemapChart } from "@/components/visualizations/TreemapChart";
import { WordCloud } from "@/components/visualizations/WordCloud";
import { WorldMapChart } from "@/components/visualizations/WorldMapChart";
import { CsvExportButton } from "@/components/widgets/CsvExportButton";
import { FilterWidget } from "@/components/widgets/FilterWidget";
import { usePivotTransform } from "@/hooks/usePivotTransform";
import { applyVizFilter } from "@/lib/vizFilter";
import { applyVizSort } from "@/lib/vizSort";
import type { MultiLineStyling } from "@/types/dashboard";
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
	/** MultiLine chart: called when zoom/brush interaction updates styling state (e.g. saved zoom fractions). */
	onMultilineStylingChange?: (updates: Partial<MultiLineStyling>) => void;
}

export function ChartPreview({
	visualizationType: vt,
	config = {},
	data: rawData,
	height = "100%",
	filterDefaultValues,
	onFilterDefaultValuesChange,
	onMultilineStylingChange,
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
			chart
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
		return withTitle(
			<HeatmapChart
				data={data}
				config={config as any}
				formatRules={(config as any)?.styling?.formatRules ?? []}
			/>,
		);
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
		return withTitle(
			<MultiLineChart
				data={data}
				config={config as any}
				onStylingChange={onMultilineStylingChange}
			/>,
		);
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
					<Tooltip
						content={<ChartTooltip config={config as any} />}
						wrapperStyle={{ zIndex: 10 }}
					/>
					<Legend
						content={<PaginatedLegend />}
						wrapperStyle={{ fontSize: 11, color: "#64748b" }}
					/>
				</RadarChart>
			</ResponsiveContainer>,
		);
	}

	if (vt === "treemap") {
		return withTitle(
			<TreemapChart data={data} config={config as any} height={height} />,
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
					<Tooltip
						content={<ChartTooltip config={config as any} />}
						wrapperStyle={{ zIndex: 10 }}
						cursor={{ strokeDasharray: "3 3" }}
					/>
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
		return withTitle(<Area_Chart data={data} config={config as any} />);
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

	if (vt === "combo") {
		return withTitle(<Combo_Chart data={data} config={config as any} />);
	}

	// default: bar
	return withTitle(<Bar_Chart data={data} config={config as any} />);
}
