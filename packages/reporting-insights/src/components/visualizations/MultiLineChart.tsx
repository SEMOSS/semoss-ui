/**
 * Multi-Line chart visualization.
 * One line per unique value in `config.categoryKey`, plotted over `config.xKey`
 * with `config.yKeys[0]` as the Y value.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
	CartesianGrid,
	ComposedChart,
	LabelList,
	Legend,
	Line,
	ReferenceArea,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	buildAxisLabelProps,
	ChartTooltip,
	compareColorRule,
	renderChartSymbol,
	strokeDashFor,
} from "@/components/visualizations/shared/chartShared";
import { PaginatedLegend } from "@/components/visualizations/shared/PaginatedLegend";
import { formatValue } from "@/lib/formatValue";
import {
	type ColorRule,
	curveTypeToRecharts,
	type MultiLineStyling,
	type SymbolType,
	type VisualizationConfig,
} from "@/types/dashboard";

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
	onTrigger?: (
		payload: import("@/types/dashboard").VizTriggerPayload,
	) => void;
	onStylingChange?: (updates: Partial<MultiLineStyling>) => void;
}

// Vertical range brush
function YAxisBrush({
	value,
	onChange,
	onCommit,
	marginTop = 0,
	marginBottom = 0,
	dataYMin,
	dataYMax,
}: {
	value: [number, number];
	onChange: (v: [number, number]) => void;
	onCommit?: (v: [number, number]) => void;
	marginTop?: number;
	marginBottom?: number;
	dataYMin: number;
	dataYMax: number;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const drag = useRef<{
		handle: "min" | "max";
		startY: number;
		startVal: [number, number];
	} | null>(null);
	const latestValue = useRef(value);
	latestValue.current = value;

	const onPointerDown =
		(handle: "min" | "max") => (e: React.PointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			drag.current = {
				handle,
				startY: e.clientY,
				startVal: [value[0], value[1]],
			};
		};
	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!drag.current || !trackRef.current) return;
		const h = trackRef.current.getBoundingClientRect().height;
		if (!h) return;
		const delta = -(e.clientY - drag.current.startY) / h;
		const [lo, hi] = drag.current.startVal;
		if (drag.current.handle === "max") {
			onChange([lo, Math.min(1, Math.max(lo + 0.02, hi + delta))]);
		} else {
			onChange([Math.max(0, Math.min(hi - 0.02, lo + delta)), hi]);
		}
	};
	const onPointerUp = () => {
		if (drag.current) onCommit?.(latestValue.current);
		drag.current = null;
	};

	const topPct = (frac: number) => `${(1 - frac) * 100}%`;
	const nonSelTopH = `${(1 - value[1]) * 100}%`;
	const nonSelBotH = `${value[0] * 100}%`;
	const fmt = (frac: number) =>
		Math.round(dataYMin + frac * (dataYMax - dataYMin)).toLocaleString();
	const traveller = (handle: "min" | "max"): React.CSSProperties => ({
		position: "absolute",
		left: 0,
		right: 0,
		top: topPct(handle === "max" ? value[1] : value[0]),
		height: 6,
		marginTop: -3,
		background: "#f8fafc",
		border: "1px solid #cbd5e1",
		cursor: "ns-resize",
		zIndex: 2,
		borderRadius: 1,
	});

	return (
		<div
			style={{
				width: 20,
				flexShrink: 0,
				paddingTop: marginTop,
				paddingBottom: marginBottom,
				boxSizing: "border-box",
			}}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerLeave={onPointerUp}
		>
			<div
				ref={trackRef}
				style={{
					position: "relative",
					height: "100%",
					border: "1px solid #cbd5e1",
					background: "#f8fafc",
					borderRadius: 2,
					boxSizing: "border-box",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: 0,
						height: nonSelTopH,
						background: "rgba(0,0,0,0.07)",
						pointerEvents: "none",
					}}
				/>
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						bottom: 0,
						height: nonSelBotH,
						background: "rgba(0,0,0,0.07)",
						pointerEvents: "none",
					}}
				/>
				<div
					title={`Max: ${fmt(value[1])}`}
					onPointerDown={onPointerDown("max")}
					style={traveller("max")}
				/>
				<div
					title={`Min: ${fmt(value[0])}`}
					onPointerDown={onPointerDown("min")}
					style={traveller("min")}
				/>
			</div>
		</div>
	);
}

// Horizontal range brush (X axis)
function XAxisBrush({
	value,
	onChange,
	onCommit,
	marginLeft = 0,
	marginRight = 0,
}: {
	value: [number, number];
	onChange: (v: [number, number]) => void;
	onCommit?: (v: [number, number]) => void;
	marginLeft?: number;
	marginRight?: number;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const drag = useRef<{
		handle: "left" | "right";
		startX: number;
		startVal: [number, number];
	} | null>(null);
	const latestValue = useRef(value);
	latestValue.current = value;

	const onPointerDown =
		(handle: "left" | "right") =>
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			drag.current = {
				handle,
				startX: e.clientX,
				startVal: [value[0], value[1]],
			};
		};
	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!drag.current || !trackRef.current) return;
		const w = trackRef.current.getBoundingClientRect().width;
		if (!w) return;
		const delta = (e.clientX - drag.current.startX) / w;
		const [lo, hi] = drag.current.startVal;
		if (drag.current.handle === "left") {
			onChange([Math.max(0, Math.min(hi - 0.02, lo + delta)), hi]);
		} else {
			onChange([lo, Math.min(1, Math.max(lo + 0.02, hi + delta))]);
		}
	};
	const onPointerUp = () => {
		if (drag.current) onCommit?.(latestValue.current);
		drag.current = null;
	};

	const leftPct = `${value[0] * 100}%`;
	const rightPct = `${(1 - value[1]) * 100}%`;
	const travellerStyle = (side: "left" | "right"): React.CSSProperties => ({
		position: "absolute",
		top: 0,
		bottom: 0,
		left: side === "left" ? leftPct : `${value[1] * 100}%`,
		width: 6,
		marginLeft: -3,
		background: "#f8fafc",
		border: "1px solid #cbd5e1",
		cursor: "ew-resize",
		zIndex: 2,
		borderRadius: 1,
	});

	return (
		<div
			style={{
				paddingLeft: marginLeft,
				paddingRight: marginRight,
				paddingTop: 8,
				boxSizing: "border-box",
				flexShrink: 0,
			}}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerLeave={onPointerUp}
		>
			<div
				ref={trackRef}
				style={{
					position: "relative",
					height: 20,
					border: "1px solid #cbd5e1",
					background: "#f8fafc",
					borderRadius: 2,
					boxSizing: "border-box",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						width: leftPct,
						background: "rgba(0,0,0,0.07)",
						pointerEvents: "none",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: 0,
						bottom: 0,
						right: 0,
						width: rightPct,
						background: "rgba(0,0,0,0.07)",
						pointerEvents: "none",
					}}
				/>
				<div
					onPointerDown={onPointerDown("left")}
					style={travellerStyle("left")}
				/>
				<div
					onPointerDown={onPointerDown("right")}
					style={travellerStyle("right")}
				/>
			</div>
		</div>
	);
}

/** Simple linear regression — returns predicted Y values for indices 0..n-1 */
function linearRegression(yValues: number[]): number[] {
	const n = yValues.length;
	if (n < 2) return yValues.map(() => NaN);
	const sumX = (n * (n - 1)) / 2;
	const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
	const sumY = yValues.reduce((a, b) => a + (Number.isNaN(b) ? 0 : b), 0);
	const sumXY = yValues.reduce(
		(acc, y, i) => acc + i * (Number.isNaN(y) ? 0 : y),
		0,
	);
	const slope =
		n * sumX2 - sumX * sumX !== 0
			? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
			: 0;
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
		default:
			return values.reduce((a, b) => a + b, 0);
	}
}

export function MultiLineChart({
	data,
	config,
	onStylingChange,
	onTrigger,
}: MultiLineChartProps) {
	const xKey = config?.xKey;
	const yKey = config?.yKeys?.[0];
	const categoryKey = config?.categoryKey;
	const ml: MultiLineStyling = config?.styling?.multiline ?? {};
	const aggFn =
		(yKey &&
			(
				config?.columnAggregations as Record<string, string> | undefined
			)?.[yKey]) ??
		"avg";

	if (!xKey || !yKey || !categoryKey || !data.length) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				{!data.length
					? "No data to display"
					: "Configure X Axis, Y Axis, and Category to display this chart"}
			</div>
		);
	}

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

	const bucketMap: Record<string, Record<string, number[]>> = {};
	const tooltipBuckets: Record<string, Record<string, unknown[]>> = {};
	for (const r of data) {
		const x = String(r[xKey]);
		const cat = String(r[categoryKey]);
		const y = Number(r[yKey]);
		if (!bucketMap[x]) bucketMap[x] = {};
		if (!bucketMap[x][cat]) bucketMap[x][cat] = [];
		if (!Number.isNaN(y)) bucketMap[x][cat].push(y);
		if (tooltipEntries.length) {
			if (!tooltipBuckets[x]) tooltipBuckets[x] = {};
			for (const { column } of tooltipEntries) {
				if (!tooltipBuckets[x][column]) tooltipBuckets[x][column] = [];
				tooltipBuckets[x][column].push(r[column]);
			}
		}
	}

	const pivoted = xValues.map((x) => {
		const row: Record<string, any> = { [xKey]: x };
		for (const cat of categories)
			row[cat] = aggregateValues(bucketMap[x]?.[cat] ?? [], aggFn);
		for (const { column, aggregation } of tooltipEntries) {
			const vals = (tooltipBuckets[x]?.[column] ?? []) as number[];
			if (vals.length)
				row[`_tooltip_${column}`] = aggregateValues(vals, aggregation);
		}
		return row;
	});

	// Trendline data per category: merged into chart rows as _trend_{cat}
	const effectiveTrendlineType =
		ml.trendlineType ?? (ml.showTrendline ? "exact" : "none");
	const trendDataMap: Record<string, number[]> | null =
		effectiveTrendlineType !== "none"
			? Object.fromEntries(
					categories.map((cat) => {
						const vals = pivoted.map((r) => r[cat] as number);
						return [cat, linearRegression(vals)];
					}),
				)
			: null;

	const curveType = curveTypeToRecharts(ml.curveType ?? "smooth");
	const showAvg = ml.showAverage === true;
	const showMinMax = ml.showMinMax === true;
	const showTooltip = ml.showTooltip !== false;
	const showLegend = ml.showLegend !== false;
	const lineWidth = ml.lineWidth ?? 2;
	const strokeDash = strokeDashFor(ml.lineType);
	const symbolType: SymbolType = ml.symbolType ?? "circle";
	const symbolSize = ml.symbolSize ?? 3;
	const targetAreas = ml.targetAreas ?? [];
	const targetLines = ml.targetLines ?? [];
	const zoomX = ml.zoomX === true;
	const zoomY = ml.zoomY === true;
	const saveZoom = ml.saveZoom === true;
	const xCfg = ml.xAxisConfig;
	const yCfg = ml.yAxisConfig;

	const paletteColors = config?.styling?.colorPalette?.colors?.length
		? config.styling.colorPalette.colors
		: PALETTE;

	const colorRules: ColorRule[] = ml.colorRules ?? [];
	const colorForCategory = (
		catValue: string,
		row: Record<string, unknown>,
		idx: number,
	): string => {
		for (const rule of colorRules) {
			if (compareColorRule(rule.comparator, row[catValue], rule.value))
				return rule.color;
		}
		return paletteColors[idx % paletteColors.length];
	};

	// Value label config (with backward compat for showValueLabels boolean)
	const vlCfg = ml.valueLabel ?? (ml.showValueLabels ? { show: true } : null);
	const showValueLabels = vlCfg?.show === true;

	// Zoom state
	const [yBrushFrac, setYBrushFrac] = useState<[number, number]>(() =>
		saveZoom && ml.savedZoomY ? ml.savedZoomY : [0, 1],
	);
	const [xBrushFrac, setXBrushFrac] = useState<[number, number]>(() =>
		saveZoom && ml.savedZoomX ? ml.savedZoomX : [0, 1],
	);
	const lastHoveredLabelRef = useRef<string | null>(null);
	const lastHoveredPayloadRef = useRef<Record<string, unknown> | null>(null);
	const xBrushFracRef = useRef(xBrushFrac);
	xBrushFracRef.current = xBrushFrac;
	const yBrushFracRef = useRef(yBrushFrac);
	yBrushFracRef.current = yBrushFrac;

	const prevSaveZoomRef = useRef(saveZoom);
	useEffect(() => {
		const wasOn = prevSaveZoomRef.current;
		prevSaveZoomRef.current = saveZoom;
		if (saveZoom && !wasOn) {
			onStylingChange?.({
				savedZoomX: xBrushFracRef.current,
				savedZoomY: yBrushFracRef.current,
			});
		}
	}, [saveZoom]); // eslint-disable-line react-hooks/exhaustive-deps

	const xBrushActive = zoomX && (xBrushFrac[0] > 0 || xBrushFrac[1] < 1);
	const visiblePivoted =
		xBrushActive && pivoted.length >= 2
			? pivoted.slice(
					Math.floor(xBrushFrac[0] * pivoted.length),
					Math.ceil(xBrushFrac[1] * pivoted.length),
				)
			: pivoted;

	const { dataYMin, dataYMax } = (() => {
		if (!zoomY || !pivoted.length || !categories.length)
			return { dataYMin: 0, dataYMax: 1 };
		let maxVal = 0;
		for (const row of pivoted) {
			for (const cat of categories)
				maxVal = Math.max(maxVal, Number(row[cat] ?? 0));
		}
		return { dataYMin: 0, dataYMax: maxVal };
	})();

	const yBrushActive = zoomY && (yBrushFrac[0] > 0 || yBrushFrac[1] < 1);
	const yDomain = yBrushActive
		? ([
				dataYMin + yBrushFrac[0] * (dataYMax - dataYMin),
				dataYMin + yBrushFrac[1] * (dataYMax - dataYMin),
			] as [number, number])
		: undefined;

	// Merge trend data into rows
	const chartData = trendDataMap
		? visiblePivoted.map((row, i) => {
				const extra: Record<string, unknown> = {};
				for (const cat of categories)
					extra[`_trend_${cat}`] = trendDataMap[cat][i];
				return { ...row, ...extra };
			})
		: visiblePivoted;

	// Per-category averages
	const categoryAverages = showAvg
		? Object.fromEntries(
				categories.map((cat) => {
					const vals = pivoted
						.map((r) => r[cat] as number)
						.filter((v) => !Number.isNaN(v));
					const avg = vals.length
						? vals.reduce((a, b) => a + b, 0) / vals.length
						: NaN;
					return [cat, avg];
				}),
			)
		: {};

	// Per-category min/max indices — matched against chartData row indices for LabelList rendering
	const { minIdx, maxIdx } = useMemo(() => {
		if (!showMinMax || !visiblePivoted.length)
			return {
				minIdx: {} as Record<string, number>,
				maxIdx: {} as Record<string, number>,
			};
		const mi: Record<string, number> = {};
		const xi: Record<string, number> = {};
		for (const cat of categories) {
			let minV = Infinity,
				maxV = -Infinity;
			visiblePivoted.forEach((row, idx) => {
				const v = Number((row as Record<string, unknown>)[cat] ?? NaN);
				if (!Number.isNaN(v)) {
					if (v < minV) {
						minV = v;
						mi[cat] = idx;
					}
					if (v > maxV) {
						maxV = v;
						xi[cat] = idx;
					}
				}
			});
		}
		return { minIdx: mi, maxIdx: xi };
	}, [showMinMax, visiblePivoted, categories]);

	const MARGIN = {
		top: 10,
		right: zoomY ? 28 : 20,
		bottom: zoomX ? 36 : 20,
		left: 10,
	};

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{ flex: 1, display: "flex", minHeight: 0 }}>
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={chartData}
						margin={MARGIN}
						onClick={(e: any) => {
							if (e?.activeLabel != null)
								onTrigger?.({
									trigger: "click",
									label: String(e.activeLabel),
									row: e.activePayload?.[0]?.payload ?? {
										[xKey ?? ""]: String(e.activeLabel),
									},
								});
						}}
						onDoubleClick={() => {
							const label = lastHoveredLabelRef.current;
							if (label != null)
								onTrigger?.({
									trigger: "dblclick",
									label,
									row: lastHoveredPayloadRef.current ?? {
										[xKey ?? ""]: label,
									},
								});
						}}
						onMouseMove={(e: any) => {
							const label = e?.activeLabel
								? String(e.activeLabel)
								: null;
							if (
								label &&
								label !== lastHoveredLabelRef.current
							) {
								lastHoveredLabelRef.current = label;
								lastHoveredPayloadRef.current =
									e.activePayload?.[0]?.payload ?? null;
								onTrigger?.({
									trigger: "hover",
									label,
									row: e.activePayload?.[0]?.payload ?? {
										[xKey ?? ""]: label,
									},
								});
							}
						}}
						onMouseLeave={() => {
							if (lastHoveredLabelRef.current !== null) {
								lastHoveredLabelRef.current = null;
								lastHoveredPayloadRef.current = null;
								onTrigger?.({ trigger: "mouseout" });
							}
						}}
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
							label={buildAxisLabelProps(
								xCfg?.title,
								xCfg ?? {},
								"x",
							)}
							tickFormatter={(v: unknown) =>
								formatValue(
									v,
									xKey ?? "",
									config?.styling?.formatRules ?? [],
								)
							}
						/>

						<YAxis
							width={48}
							tick={{ fontSize: yCfg?.fontSize ?? 11 }}
							hide={yCfg?.showLabels === false}
							reversed={yCfg?.flipAxis === true}
							domain={yDomain}
							allowDataOverflow={yBrushActive}
							allowDecimals={zoomY ? false : undefined}
							label={buildAxisLabelProps(
								yCfg?.title,
								yCfg ?? {},
								"y",
							)}
							tickFormatter={(v: unknown) =>
								formatValue(
									v,
									yKey ?? "",
									config?.styling?.formatRules ?? [],
								)
							}
						/>

						{showTooltip && (
							<Tooltip
								content={<ChartTooltip config={config} />}
								wrapperStyle={{ zIndex: 10 }}
							/>
						)}
						{showLegend && (
							<Legend
								content={
									<PaginatedLegend
										leftPadding={
											(yCfg?.title ? 12 : 0) + 48 - 20
										}
									/>
								}
							/>
						)}

						{/* Target areas (behind lines) */}
						{targetAreas.map((area) => (
							<ReferenceArea
								key={area.id}
								y1={area.y1}
								y2={area.y2}
								fill={area.color ?? "#6366f1"}
								fillOpacity={area.opacity ?? 0.15}
								stroke="none"
								label={
									area.showName && area.name
										? {
												value: area.name,
												position:
													area.namePosition ??
													"insideTop",
												fontSize: area.fontSize ?? 11,
												fill:
													area.fontColor ?? "#64748b",
											}
										: undefined
								}
							/>
						))}

						{/* Target lines */}
						{targetLines.map((tl) => (
							<ReferenceLine
								key={tl.id}
								y={tl.y}
								stroke={tl.color ?? "#64748b"}
								label={
									tl.showName && tl.name
										? {
												value: tl.name,
												position:
													tl.namePosition ??
													"insideTopRight",
												fontSize: tl.fontSize ?? 11,
												fill: tl.fontColor ?? "#64748b",
											}
										: undefined
								}
							/>
						))}

						{/* Per-category average reference lines — each at its own Y, label at right edge */}
						{showAvg &&
							categories.map((cat, i) => {
								const avg = categoryAverages[cat];
								if (Number.isNaN(avg)) return null;
								const color =
									paletteColors[i % paletteColors.length];
								const formatted = formatValue(
									avg,
									yKey ?? "",
									config?.styling?.formatRules ?? [],
								);
								return (
									<ReferenceLine
										key={`avg_${cat}`}
										y={avg}
										stroke={color}
										strokeDasharray="4 4"
										strokeOpacity={0.8}
										label={{
											value: String(formatted),
											position: "insideRight",
											fontSize: 10,
											fill: color,
											fontWeight: 600,
										}}
									/>
								);
							})}

						{/* Category lines */}
						{categories.map((cat, i) => {
							const lineColor =
								paletteColors[i % paletteColors.length];
							const noSymbol = symbolType === "none";
							const useDot = !noSymbol && symbolType !== "circle";
							const formatRules =
								config?.styling?.formatRules ?? [];
							return (
								<Line
									key={cat}
									type={curveType}
									dataKey={cat}
									isAnimationActive={false}
									stroke={lineColor}
									strokeWidth={lineWidth}
									strokeDasharray={strokeDash}
									dot={
										noSymbol
											? false
											: colorRules.length > 0
												? (props: any) => {
														const {
															cx,
															cy,
															payload,
															index,
														} = props;
														const c =
															colorForCategory(
																cat,
																payload as Record<
																	string,
																	unknown
																>,
																i,
															);
														return (
															renderChartSymbol(
																symbolType,
																cx,
																cy,
																symbolSize,
																c,
															) ?? (
																<circle
																	key={`${cat}-${index}`}
																	cx={cx}
																	cy={cy}
																	r={
																		symbolSize
																	}
																	fill={c}
																/>
															)
														);
													}
												: useDot
													? (props: any) => {
															const {
																cx,
																cy,
																index,
															} = props;
															return (
																renderChartSymbol(
																	symbolType,
																	cx,
																	cy,
																	symbolSize,
																	lineColor,
																) ?? (
																	<circle
																		key={`${cat}-${index}`}
																		cx={cx}
																		cy={cy}
																		r={
																			symbolSize
																		}
																		fill={
																			lineColor
																		}
																	/>
																)
															);
														}
													: {
															r: symbolSize,
															fill: lineColor,
															strokeWidth: 0,
														}
									}
									activeDot={
										noSymbol ? false : { r: symbolSize + 2 }
									}
									connectNulls
								>
									{showValueLabels && (
										<LabelList
											dataKey={cat}
											position={vlCfg?.position ?? "top"}
											fontSize={vlCfg?.fontSize ?? 10}
											fill={vlCfg?.color ?? lineColor}
											formatter={
												((v: unknown) =>
													typeof v === "number"
														? formatValue(
																v,
																yKey ?? "",
																formatRules,
															)
														: String(
																v ?? "",
															)) as never
											}
										/>
									)}
									{showMinMax && (
										<LabelList
											dataKey={cat}
											content={(props: any) => {
												const { index, x, y, value } =
													props;
												const isMax =
													index === maxIdx[cat];
												const isMin =
													index === minIdx[cat];
												if (!isMax && !isMin)
													return null;
												const label =
													typeof value === "number"
														? formatValue(
																value,
																yKey ?? "",
																formatRules,
															)
														: String(value ?? "");
												const badgeW = Math.max(
													label.length * 6 + 10,
													26,
												);
												const bx =
													Number(x) - badgeW / 2;
												const by = isMax
													? Number(y) - 28
													: Number(y) + 10;
												return (
													<g
														key={`${cat}-${isMax ? "max" : "min"}-${index}`}
													>
														<circle
															cx={Number(x)}
															cy={Number(y)}
															r={5}
															fill={lineColor}
															stroke="white"
															strokeWidth={1.5}
														/>
														<rect
															x={bx}
															y={by}
															width={badgeW}
															height={16}
															rx={4}
															fill={lineColor}
														/>
														<text
															x={Number(x)}
															y={by + 11}
															textAnchor="middle"
															fontSize={9}
															fill="white"
															fontWeight={600}
														>
															{label}
														</text>
													</g>
												);
											}}
										/>
									)}
								</Line>
							);
						})}

						{/* Per-category trendlines */}
						{trendDataMap &&
							categories.map((cat, i) => {
								const color =
									paletteColors[i % paletteColors.length];
								return (
									<Line
										key={`_trend_${cat}`}
										type={
											effectiveTrendlineType !== "none"
												? curveTypeToRecharts(
														effectiveTrendlineType,
													)
												: "linear"
										}
										dataKey={`_trend_${cat}`}
										isAnimationActive={false}
										stroke={color}
										strokeDasharray="6 3"
										strokeOpacity={0.5}
										strokeWidth={1.5}
										dot={false}
										legendType="none"
										name={`${cat} trend`}
									/>
								);
							})}
					</ComposedChart>
				</ResponsiveContainer>

				{/* Y axis brush (right side) — marginTop=36 clears the refresh/header button */}
				{zoomY && (
					<YAxisBrush
						value={yBrushFrac}
						onChange={setYBrushFrac}
						onCommit={(v) => {
							if (saveZoom)
								onStylingChange?.({
									savedZoomY: v,
									savedZoomX: xBrushFracRef.current,
								});
						}}
						marginTop={36}
						marginBottom={showLegend ? 32 : 4}
						dataYMin={dataYMin}
						dataYMax={dataYMax}
					/>
				)}
			</div>

			{/* X axis brush (bottom) */}
			{zoomX && (
				<XAxisBrush
					value={xBrushFrac}
					onChange={setXBrushFrac}
					onCommit={(v) => {
						if (saveZoom)
							onStylingChange?.({
								savedZoomX: v,
								savedZoomY: yBrushFracRef.current,
							});
					}}
					marginLeft={48 + 10}
					marginRight={zoomY ? 20 + 20 : 20}
				/>
			)}
		</div>
	);
}
