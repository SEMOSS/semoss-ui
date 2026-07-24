/**
 * Line chart visualization.
 *
 * Renders a multi-series line chart with one line per `config.yKeys[]` and
 * categories driven by `config.xKey`. Curve type, line type/width, value
 * labels, axis settings, and legend visibility are driven by
 * `config.styling.line`.
 */

import { LineChart as LineChartIcon } from "lucide-react";
import { useMemo } from "react";
import {
	CartesianGrid,
	LabelList,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	AXIS_STYLE,
	aggregateChartData,
	buildDefaultYAxisTitle,
	CHART_COLORS,
	ChartTooltip,
	GRID_STYLE,
	strokeDashFor,
} from "@/components/visualizations/shared/chartShared";
import {
	type ColorPalette as ColorPaletteType,
	curveTypeToRecharts,
	DEFAULT_LINE_STYLING,
	type VisualizationConfig,
} from "@/types/dashboard";

interface LineChartVizProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
}

export function Line_Chart({ data, config }: LineChartVizProps) {
	const xKey = config?.xKey ?? "";
	const yKeys = config?.yKeys ?? [];
	const styling = config?.styling?.line ?? {};
	const xCfg = styling.xAxisConfig ?? {};
	const yCfg = styling.yAxisConfig ?? {};
	const valueLabel = styling.valueLabel ?? {};
	const curveType = styling.curveType ?? DEFAULT_LINE_STYLING.curveType;
	const lineType = styling.lineType ?? DEFAULT_LINE_STYLING.lineType;
	const lineWidth = styling.lineWidth ?? DEFAULT_LINE_STYLING.lineWidth;
	const showLegend = styling.showLegend ?? DEFAULT_LINE_STYLING.showLegend;

	const palette = useMemo(() => {
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config?.styling?.colorPalette]);

	const chartData = useMemo(
		() => aggregateChartData(data, xKey, yKeys, config),
		[data, xKey, yKeys, config],
	);

	if (!xKey || !yKeys.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<LineChartIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to X-Axis and Y-Axis drop zones
					</p>
				</div>
			</div>
		);
	}

	const xAxisLabel = xCfg.title ?? config?.xLabel ?? (xKey || undefined);
	const yAxisLabel =
		yCfg.title ??
		config?.yLabel ??
		(buildDefaultYAxisTitle(yKeys, config?.columnAggregations) ||
			undefined);

	const labelStyle: React.CSSProperties = {
		fontSize: valueLabel.fontSize ?? 10,
		fill: valueLabel.color || "#64748b",
		fontFamily: valueLabel.fontFamily,
		fontWeight:
			valueLabel.fontWeight === "semibold"
				? 600
				: valueLabel.fontWeight === "medium"
					? 500
					: valueLabel.fontWeight === "bold"
						? 700
						: valueLabel.fontWeight === "normal"
							? 400
							: undefined,
		textAnchor:
			valueLabel.align === "left"
				? "start"
				: valueLabel.align === "right"
					? "end"
					: "middle",
	};

	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={chartData}
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
				<Tooltip content={<ChartTooltip config={config} />} />
				{yKeys.length > 1 && showLegend && (
					<Legend
						wrapperStyle={{
							fontSize: 11,
							color: "#64748b",
							paddingTop: 8,
						}}
					/>
				)}
				{yKeys.map((k, i) => (
					<Line
						key={k}
						type={curveTypeToRecharts(curveType)}
						dataKey={k}
						isAnimationActive={false}
						stroke={palette[i % palette.length]}
						strokeWidth={lineWidth}
						strokeDasharray={strokeDashFor(lineType)}
						dot={{ r: 3, strokeWidth: 0 }}
						activeDot={{ r: 5, strokeWidth: 0 }}
					>
						{valueLabel.show && (
							<LabelList
								dataKey={k}
								position={valueLabel.position ?? "top"}
								style={labelStyle}
								angle={valueLabel.rotate ?? 0}
								formatter={
									((v: unknown) =>
										typeof v === "number"
											? v.toLocaleString()
											: String(v ?? "")) as never
								}
							/>
						)}
					</Line>
				))}
			</LineChart>
		</ResponsiveContainer>
	);
}
