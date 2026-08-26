/**
 * Pie chart visualization.
 *
 * Renders one slice per unique value of `config.xKey` (the Name column),
 * sized by `config.yKeys[0]` (the Value column). Supports: donut toggle,
 * value labels, color rules, palette, heat-gradient coloring, animation,
 * bucket (top-N), configurable radius, and Nightingale rose chart modes.
 */

import { PieChart as PieChartIcon } from "lucide-react";
import React, { useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
import { PaginatedLegend } from "@/components/visualizations/shared/PaginatedLegend";
import { formatValue } from "@/lib/formatValue";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	DEFAULT_PIE_STYLING,
	type VisualizationConfig,
} from "@/types/dashboard";

interface PieChartVizProps {
	data: Record<string, unknown>[];
	/** Unfiltered raw data — used to compute heat color range so colors stay consistent when filtered. */
	rawData?: Record<string, unknown>[];
	config?: VisualizationConfig;
	onTrigger?: (
		payload: import("@/types/dashboard").VizTriggerPayload,
	) => void;
}

// SVG helpers for rose chart
function polarToCart(
	cx: number,
	cy: number,
	r: number,
	angle: number,
): [number, number] {
	return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(
	cx: number,
	cy: number,
	innerR: number,
	outerR: number,
	startAngle: number,
	endAngle: number,
): string {
	const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
	const [x1, y1] = polarToCart(cx, cy, outerR, startAngle);
	const [x2, y2] = polarToCart(cx, cy, outerR, endAngle);
	const [x3, y3] = polarToCart(cx, cy, innerR, endAngle);
	const [x4, y4] = polarToCart(cx, cy, innerR, startAngle);
	if (innerR <= 0) {
		return `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;
	}
	return [
		`M ${x1} ${y1}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
		`L ${x3} ${y3}`,
		`A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
		"Z",
	].join(" ");
}

function aggregateNums(vals: number[], type: string): number {
	if (!vals.length) return 0;
	switch (type) {
		case "avg":
			return vals.reduce((a, b) => a + b, 0) / vals.length;
		case "count":
			return vals.length;
		case "max":
			return Math.max(...vals);
		case "min":
			return Math.min(...vals);
		default:
			return vals.reduce((a, b) => a + b, 0);
	}
}

const ANIMATION_EASE: Record<string, string> = {
	elastic: "spring",
	expansion: "ease-out",
};

export function Pie_Chart({
	data,
	rawData,
	config,
	onTrigger,
}: PieChartVizProps) {
	const xKey = config?.xKey ?? "";
	const valueKey = config?.yKeys?.[0] ?? "";
	const heatKey: string = config?.heatKey ?? "";
	const styling = config?.styling?.pie ?? {};
	const valueLabel = styling.valueLabel ?? {};
	const donut = styling.donut ?? DEFAULT_PIE_STYLING.donut;
	const showTooltip = styling.showTooltip ?? DEFAULT_PIE_STYLING.showTooltip;
	const showLegend = styling.showLegend ?? DEFAULT_PIE_STYLING.showLegend;
	const colorRules = useMemo<ColorRule[]>(
		() => styling.colorRules ?? [],
		[styling.colorRules],
	);
	const animationCfg = styling.animation;
	const bucket = styling.bucket;
	const outerRadiusPct = styling.outerRadius ?? 68;
	const roseType = styling.roseType ?? "default";

	const palette = useMemo(() => {
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config?.styling?.colorPalette]);

	const baseChartData = useMemo(
		() =>
			xKey && valueKey
				? aggregateChartData(data, xKey, [valueKey], config)
				: [],
		[data, xKey, valueKey, config],
	);

	const chartData = useMemo(() => {
		if (!bucket || baseChartData.length <= bucket) return baseChartData;
		const sorted = [...baseChartData].sort(
			(a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0),
		);
		const top = sorted.slice(0, bucket);
		const rest = sorted.slice(bucket);
		const otherValue = rest.reduce(
			(s, r) => s + Number(r[valueKey] ?? 0),
			0,
		);
		return [...top, { [xKey]: "Other", [valueKey]: otherValue }];
	}, [baseChartData, bucket, xKey, valueKey]);

	const heatByName = useMemo(() => {
		if (!heatKey || !xKey) return null;
		const aggType = config?.columnAggregations?.[heatKey] ?? "avg";
		const grouped = new Map<string, number[]>();
		data.forEach((row) => {
			const name = String(row[xKey] ?? "");
			if (!grouped.has(name)) grouped.set(name, []);
			const v = Number(row[heatKey]);
			if (!Number.isNaN(v)) grouped.get(name)?.push(v);
		});
		const result: Record<string, number> = {};
		grouped.forEach((vals, name) => {
			result[name] = aggregateNums(vals, aggType);
		});
		return result;
	}, [data, heatKey, xKey, config?.columnAggregations]);

	// Heat range is computed from rawData (unfiltered) so colors stay consistent when filtered.
	const { minHeat, maxHeat } = useMemo(() => {
		if (!heatKey || !xKey) return { minHeat: 0, maxHeat: 1 };
		const source = rawData ?? data;
		const aggType = config?.columnAggregations?.[heatKey] ?? "avg";
		const grouped = new Map<string, number[]>();
		source.forEach((row) => {
			const name = String(row[xKey] ?? "");
			if (!grouped.has(name)) grouped.set(name, []);
			const v = Number(row[heatKey]);
			if (!Number.isNaN(v)) grouped.get(name)?.push(v);
		});
		const vals = Array.from(grouped.values()).map((arr) =>
			aggregateNums(arr, aggType),
		);
		if (!vals.length) return { minHeat: 0, maxHeat: 1 };
		return { minHeat: Math.min(...vals), maxHeat: Math.max(...vals) };
	}, [rawData, data, heatKey, xKey, config?.columnAggregations]);

	// All hooks must precede any early return
	const lastRoseHoveredRef = useRef<string | null>(null);
	const lastPieClickTimeRef = useRef<number>(0);
	const [roseHovered, setRoseHovered] = React.useState<{
		x: number;
		y: number;
		name: string;
		value: number;
		fill: string;
	} | null>(null);

	const [heatLegendHover, setHeatLegendHover] = React.useState<{
		x: number;
		y: number;
		value: number;
		color: string;
	} | null>(null);

	// Linear/Exponential: CSS scale-from-center. Elastic/Expansion: recharts easing.
	const isRadialAnim =
		animationCfg?.type === "linear" || animationCfg?.type === "exponential";
	const isAnimActive =
		!isRadialAnim && !!animationCfg?.type && animationCfg.type !== "none";
	const animEasing = isAnimActive
		? (ANIMATION_EASE[animationCfg?.type] ?? "ease")
		: undefined;

	const [scaleState, setScaleState] = React.useState(1);
	React.useEffect(() => {
		if (!isRadialAnim) {
			setScaleState(1);
			return;
		}
		let cancelled = false;
		setScaleState(0);
		const outer = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (!cancelled) setScaleState(1);
			});
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(outer);
		};
	}, [animationCfg?.type]); // eslint-disable-line react-hooks/exhaustive-deps

	// Early return for unconfigured state
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

	const showLabels = valueLabel.show !== false;
	const labelPosition: "inside" | "outside" =
		valueLabel.position === "inside" ? "inside" : "outside";
	const formatRules = config?.styling?.formatRules ?? [];

	const colorForSlice = (
		row: Record<string, unknown>,
		idx: number,
	): string => {
		if (heatByName) {
			const name = String(row[xKey] ?? "");
			const heat = heatByName[name] ?? minHeat;
			const range = maxHeat - minHeat || 1;
			const norm = (heat - minHeat) / range;
			return palette[Math.round(norm * (palette.length - 1))];
		}
		for (const rule of colorRules) {
			const candidate: unknown = row[rule.valueColumn];
			if (compareColorRule(rule.comparator, candidate, rule.value))
				return rule.color;
		}
		return palette[idx % palette.length];
	};

	const renderLabel = ({
		name,
		percent,
	}: {
		name?: string;
		percent?: number;
	}) =>
		`${formatValue(name ?? "", xKey, formatRules)} (${((percent ?? 0) * 100).toFixed(0)}%)`;

	const radialTransition =
		animationCfg?.type === "linear"
			? "transform 1.5s linear"
			: "transform 1.5s cubic-bezier(0.95, 0.05, 0.795, 0.035)";

	const radialWrapStyle: React.CSSProperties | undefined = isRadialAnim
		? {
				transform: `scale(${scaleState})`,
				transition: radialTransition,
				transformOrigin: "center center",
				width: "100%",
				height: "100%",
			}
		: undefined;

	// Heat legend: shared bar + interactive tooltip
	const handleHeatBarMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const norm = Math.max(
			0,
			Math.min(1, (e.clientX - rect.left) / rect.width),
		);
		const value = minHeat + norm * (maxHeat - minHeat);
		const color = palette[Math.round(norm * (palette.length - 1))];
		setHeatLegendHover({ x: e.clientX, y: e.clientY, value, color });
	};

	const heatLegendBar = heatByName ? (
		<div className="flex w-full items-center gap-2 px-4 pb-2 text-stone-500 text-xs">
			<span className="font-medium text-stone-600">Low</span>
			<div
				className="h-2.5 flex-1 cursor-crosshair rounded"
				style={{
					background: `linear-gradient(to right, ${palette.join(",")})`,
				}}
				onMouseMove={handleHeatBarMove}
				onMouseLeave={() => setHeatLegendHover(null)}
			/>
			<span className="font-medium text-stone-600">High</span>
		</div>
	) : null;

	const heatLegendTooltip = heatLegendHover
		? createPortal(
				<div
					className="pointer-events-none fixed z-[9999] min-w-[120px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-soft-lg"
					style={{
						top: heatLegendHover.y - 52,
						left: heatLegendHover.x - 44,
					}}
				>
					<div className="flex items-center gap-2 font-semibold text-stone-800">
						<span
							className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
							style={{ background: heatLegendHover.color }}
						/>
						{formatValue(
							heatLegendHover.value,
							heatKey,
							formatRules,
						)}
					</div>
				</div>,
				document.body,
			)
		: null;

	// Rose chart
	if (roseType !== "default" && chartData.length > 0) {
		const SIZE = 400;
		const cx = SIZE / 2;
		const cy = SIZE / 2;
		// Reserve margin for outside labels
		const labelMargin = showLabels && labelPosition === "outside" ? 28 : 4;
		const maxR = (outerRadiusPct / 100) * (SIZE / 2 - labelMargin);
		const innerR = donut ? maxR * 0.35 : 0;
		const angleStep = (2 * Math.PI) / chartData.length;
		const maxVal =
			Math.max(...chartData.map((d) => Number(d[valueKey] ?? 0))) || 1;

		const totalVal = chartData.reduce(
			(s, d) => s + Number(d[valueKey] ?? 0),
			0,
		);

		const roseArcs = chartData.map((row, i) => {
			const val = Number(row[valueKey] ?? 0);
			const start = -Math.PI / 2 + i * angleStep;
			// Prevent degenerate full-circle arc (SVG arcs with identical start/end points are invisible)
			const end = start + Math.min(angleStep, 2 * Math.PI - 0.001);
			const outerR =
				roseType === "roseArea"
					? innerR + Math.sqrt(val / maxVal) * (maxR - innerR)
					: innerR + (val / maxVal) * (maxR - innerR);
			const fill = colorForSlice(row, i);
			const mid = (start + end) / 2;
			// Line from wedge edge → elbow → label anchor (matches recharts labelLine behaviour)
			const LINE_START = outerR + 3;
			const LINE_END = outerR + 18;
			const TEXT_R = outerR + 22;
			const [lx1, ly1] = polarToCart(cx, cy, LINE_START, mid);
			const [lx2, ly2] = polarToCart(cx, cy, LINE_END, mid);
			// Inside: midpoint of wedge depth
			const insideLabelR = (innerR + outerR) / 2;
			// Anchor text left/right depending on which half of the chart the mid-angle lands on
			const cosM = Math.cos(mid);
			const textAnchor: "start" | "end" | "middle" =
				cosM > 0.1 ? "start" : cosM < -0.1 ? "end" : "middle";
			const [lx, ly] = polarToCart(
				cx,
				cy,
				labelPosition === "inside" ? insideLabelR : TEXT_R,
				mid,
			);
			const [ilx, ily] = polarToCart(cx, cy, insideLabelR, mid);
			const name = String(row[xKey] ?? "");
			const percent =
				totalVal > 0 ? ((val / totalVal) * 100).toFixed(0) : "0";
			return {
				row,
				val,
				start,
				end,
				outerR,
				fill,
				name,
				mid,
				lx,
				ly,
				lx1,
				ly1,
				lx2,
				ly2,
				percent,
				insideLabelR,
				ilx,
				ily,
				textAnchor,
			};
		});

		return (
			<div className="flex h-full w-full flex-col items-center justify-center">
				<div className="min-h-0 w-full flex-1">
					<svg
						viewBox={`0 0 ${SIZE} ${SIZE}`}
						className="h-full max-h-full w-full"
						onMouseLeave={() => {
							setRoseHovered(null);
							lastRoseHoveredRef.current = null;
							onTrigger?.({ trigger: "mouseout" });
						}}
					>
						{roseArcs.map((arc, i) => {
							const rawLabel = formatValue(
								arc.name,
								xKey,
								formatRules,
							);
							const showThisLabel =
								showLabels &&
								(labelPosition === "outside"
									? true
									: arc.outerR - innerR > 20 &&
										angleStep > 0.25);
							const labelX =
								labelPosition === "outside" ? arc.lx : arc.ilx;
							const labelY =
								labelPosition === "outside" ? arc.ly : arc.ily;
							return (
								<g key={i}>
									<path
										d={arcPath(
											cx,
											cy,
											innerR,
											arc.outerR,
											arc.start,
											arc.end,
										)}
										fill={arc.fill}
										fillOpacity={
											roseHovered?.name === arc.name
												? 1
												: 0.82
										}
										stroke="#fff"
										strokeWidth={1.5}
										style={{
											cursor: "pointer",
											transition: "fill-opacity 0.15s",
										}}
										onMouseEnter={() => {
											if (
												arc.name !==
												lastRoseHoveredRef.current
											) {
												lastRoseHoveredRef.current =
													arc.name;
												onTrigger?.({
													trigger: "hover",
													label: arc.name,
													row: { [xKey]: arc.name },
												});
											}
										}}
										onMouseMove={(e) =>
											setRoseHovered({
												x: e.clientX,
												y: e.clientY,
												name: arc.name,
												value: arc.val,
												fill: arc.fill,
											})
										}
										onClick={() =>
											onTrigger?.({
												trigger: "click",
												label: arc.name,
												row: { [xKey]: arc.name },
											})
										}
										onDoubleClick={() =>
											onTrigger?.({
												trigger: "dblclick",
												label: arc.name,
												row: { [xKey]: arc.name },
											})
										}
									/>
									{showThisLabel &&
										labelPosition === "outside" && (
											<line
												x1={arc.lx1}
												y1={arc.ly1}
												x2={arc.lx2}
												y2={arc.ly2}
												stroke="#cbd5e1"
												strokeWidth={1}
												style={{
													pointerEvents: "none",
												}}
											/>
										)}
									{showThisLabel && (
										<text
											x={labelX}
											y={labelY}
											textAnchor={
												labelPosition === "outside"
													? arc.textAnchor
													: "middle"
											}
											dominantBaseline="middle"
											fill={
												labelPosition === "outside"
													? (valueLabel.color ??
														"#64748b")
													: (valueLabel.color ??
														"#fff")
											}
											fontSize={valueLabel.fontSize ?? 11}
											fontFamily={
												valueLabel.fontFamily ?? "Inter"
											}
											fontWeight={
												labelPosition === "inside"
													? 600
													: 400
											}
											transform={`rotate(${valueLabel.rotate ?? 0}, ${labelX}, ${labelY})`}
											style={{
												pointerEvents: "none",
												userSelect: "none",
											}}
										>
											{labelPosition === "outside"
												? `${rawLabel} (${arc.percent}%)`
												: rawLabel}
										</text>
									)}
								</g>
							);
						})}
					</svg>
				</div>
				{showLegend && (
					<ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4 pb-2 text-slate-500 text-xs">
						{roseArcs.map((arc, i) => (
							<li key={i} className="flex items-center gap-1">
								<span
									className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
									style={{ background: arc.fill }}
								/>
								{arc.name}
							</li>
						))}
					</ul>
				)}
				{heatLegendBar}
				{roseHovered &&
					createPortal(
						<div
							className="pointer-events-none fixed z-[9999] min-w-[140px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-soft-lg"
							style={{
								top: roseHovered.y + 12,
								left: roseHovered.x + 12,
							}}
						>
							<div className="mb-1 flex items-center gap-2 font-semibold text-stone-800">
								<span
									className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
									style={{ background: roseHovered.fill }}
								/>
								{roseHovered.name}
							</div>
							<p className="text-stone-500">
								{valueKey}:{" "}
								{formatValue(
									roseHovered.value,
									valueKey,
									formatRules,
								) || String(roseHovered.value ?? "—")}
							</p>
						</div>,
						document.body,
					)}
				{heatLegendTooltip}
			</div>
		);
	}

	// Standard recharts pie
	const outerRadiusStr = `${outerRadiusPct}%`;

	const pieChart = (
		<PieChart>
			<Pie
				key={`pie-${animationCfg?.type ?? "none"}`}
				data={chartData}
				dataKey={valueKey}
				nameKey={xKey}
				cx="50%"
				cy="50%"
				startAngle={0}
				endAngle={359.999}
				outerRadius={outerRadiusStr}
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
				isAnimationActive={isAnimActive}
				animationEasing={animEasing as any}
				onClick={(_, idx) => {
					const row = chartData[idx];
					if (!row) return;
					const label = String(row[xKey] ?? "");
					const filterRow = { [xKey]: label };
					const now = Date.now();
					if (now - lastPieClickTimeRef.current < 300) {
						onTrigger?.({
							trigger: "dblclick",
							label,
							row: filterRow,
						});
					} else {
						onTrigger?.({
							trigger: "click",
							label,
							row: filterRow,
						});
					}
					lastPieClickTimeRef.current = now;
				}}
				onMouseEnter={(_, idx) => {
					const row = chartData[idx];
					if (row)
						onTrigger?.({
							trigger: "hover",
							label: String(row[xKey] ?? ""),
							row: { [xKey]: String(row[xKey] ?? "") },
						});
				}}
				onMouseLeave={() => onTrigger?.({ trigger: "mouseout" })}
			>
				{chartData.map((row, i) => (
					<Cell key={i} fill={colorForSlice(row, i)} />
				))}
			</Pie>
			{showTooltip && (
				<Tooltip
					content={<ChartTooltip config={config} />}
					wrapperStyle={{ zIndex: 10 }}
				/>
			)}
			{showLegend && (
				<Legend
					content={<PaginatedLegend />}
					wrapperStyle={{ fontSize: 11, color: "#64748b" }}
				/>
			)}
		</PieChart>
	);

	if (heatByName) {
		return (
			<div className="flex h-full w-full flex-col">
				<div
					className="min-h-0 flex-1"
					style={radialWrapStyle ?? { width: "100%", height: "100%" }}
				>
					<ResponsiveContainer width="100%" height="100%">
						{pieChart}
					</ResponsiveContainer>
				</div>
				{heatLegendBar}
				{heatLegendTooltip}
			</div>
		);
	}

	if (radialWrapStyle) {
		return (
			<div style={{ width: "100%", height: "100%" }}>
				<div style={radialWrapStyle}>
					<ResponsiveContainer width="100%" height="100%">
						{pieChart}
					</ResponsiveContainer>
				</div>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			{pieChart}
		</ResponsiveContainer>
	);
}
