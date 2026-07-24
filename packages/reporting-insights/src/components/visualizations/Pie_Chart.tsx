/**
 * Pie chart visualization.
 *
 * Renders one slice per unique value of `config.xKey` (the Name column),
 * sized by `config.yKeys[0]` (the Value column). Donut toggle, value
 * labels, color rules, tooltip, and legend are driven by `config.styling.pie`.
 *
 * Backward compatibility: when `pie.donut` is undefined we render a donut
 * (matching the legacy hardcoded `innerRadius="35%"`) so already-published
 * dashboards visually unchanged.
 */

import { PieChart as PieChartIcon } from "lucide-react";
import { useMemo } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import {
	aggregateChartData,
	CHART_COLORS,
	ChartTooltip,
	compareColorRule,
} from "@/components/visualizations/shared/chartShared";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	DEFAULT_PIE_STYLING,
	type VisualizationConfig,
} from "@/types/dashboard";

interface PieChartVizProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
}

export function Pie_Chart({ data, config }: PieChartVizProps) {
	const xKey = config?.xKey ?? "";
	const valueKey = config?.yKeys?.[0] ?? "";
	const styling = config?.styling?.pie ?? {};
	const valueLabel = styling.valueLabel ?? {};
	const donut = styling.donut ?? DEFAULT_PIE_STYLING.donut;
	const showTooltip = styling.showTooltip ?? DEFAULT_PIE_STYLING.showTooltip;
	const showLegend = styling.showLegend ?? DEFAULT_PIE_STYLING.showLegend;
	const colorRules = useMemo<ColorRule[]>(
		() => styling.colorRules ?? [],
		[styling.colorRules],
	);

	const palette = useMemo(() => {
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config?.styling?.colorPalette]);

	const chartData = useMemo(
		() =>
			xKey && valueKey
				? aggregateChartData(data, xKey, [valueKey], config)
				: [],
		[data, xKey, valueKey, config],
	);

	if (!xKey || !valueKey) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<PieChartIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to Name and Value drop zones
					</p>
				</div>
			</div>
		);
	}

	/** Resolve a fill color for a slice. ColorRule wins over palette by index. */
	const colorForSlice = (
		row: Record<string, unknown>,
		idx: number,
	): string => {
		for (const rule of colorRules) {
			const candidate: unknown = row[rule.valueColumn];
			if (compareColorRule(rule.comparator, candidate, rule.value))
				return rule.color;
		}
		return palette[idx % palette.length];
	};

	const showLabels = valueLabel.show !== false; // default true (matches legacy)
	const labelPosition: "inside" | "outside" =
		valueLabel.position === "inside" ? "inside" : "outside";

	const renderLabel = ({
		name,
		percent,
	}: {
		name?: string;
		percent?: number;
	}) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<Pie
					data={chartData}
					dataKey={valueKey}
					nameKey={xKey}
					cx="50%"
					cy="50%"
					outerRadius="68%"
					innerRadius={donut ? "35%" : "0%"}
					paddingAngle={donut ? 2 : 0}
					strokeWidth={0}
					label={
						showLabels
							? labelPosition === "inside"
								? {
										position: "inside",
										fill: valueLabel.color || "#fff",
										fontSize: valueLabel.fontSize ?? 11,
										fontFamily: valueLabel.fontFamily,
										angle: valueLabel.rotate ?? 0,
									}
								: renderLabel
							: false
					}
					labelLine={
						showLabels && labelPosition === "outside"
							? { stroke: "#cbd5e1", strokeWidth: 1 }
							: false
					}
					isAnimationActive={false}
				>
					{chartData.map((row, i) => (
						<Cell key={i} fill={colorForSlice(row, i)} />
					))}
				</Pie>
				{showTooltip && (
					<Tooltip content={<ChartTooltip config={config} />} />
				)}
				{showLegend && (
					<Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
				)}
			</PieChart>
		</ResponsiveContainer>
	);
}
