/**
 * Combo chart — mixes Bar, Line, and Area series in a single ComposedChart.
 *
 * Each yKey is independently configurable as 'bar', 'line', or 'area' via
 * `config.styling.combo.seriesTypes`. All other tools (zoom, flip, avg lines,
 * min/max, axis pointer, target areas/lines, trendline) match Bar_Chart.tsx.
 */

import { BarChart2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	DefaultZIndexes,
	LabelList,
	Legend,
	Line,
	ReferenceArea,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	useActiveTooltipCoordinate,
	useActiveTooltipLabel,
	useIsTooltipActive,
	usePlotArea,
	useXAxisScale,
	useYAxisScale,
	XAxis,
	YAxis,
	ZIndexLayer,
} from "recharts";
import {
	AXIS_STYLE,
	aggregateChartData,
	buildAxisLabelProps,
	buildDefaultYAxisTitle,
	CHART_COLORS,
	ChartTooltip,
	compareColorRule,
	GRID_STYLE,
	renderChartSymbol,
	strokeDashFor,
} from "@/components/visualizations/shared/chartShared";
import { PaginatedLegend } from "@/components/visualizations/shared/PaginatedLegend";
import { formatValue } from "@/lib/formatValue";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	type ComboStyling,
	curveTypeToRecharts,
	type VisualizationConfig,
} from "@/types/dashboard";

// ─── Y-axis brush (vertical range slider) ────────────────────────────────────
function YAxisBrush({
	dataYMin,
	dataYMax,
	value,
	onChange,
	onCommit,
	marginTop = 4,
	marginBottom = 4,
}: {
	dataYMin: number;
	dataYMax: number;
	value: [number, number];
	onChange: (v: [number, number]) => void;
	onCommit?: (v: [number, number]) => void;
	marginTop?: number;
	marginBottom?: number;
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
		if (drag.current.handle === "max")
			onChange([lo, Math.min(1, Math.max(lo + 0.02, hi + delta))]);
		else onChange([Math.max(0, Math.min(hi - 0.02, lo + delta)), hi]);
	};
	const onPointerUp = () => {
		if (drag.current) onCommit?.(latestValue.current);
		drag.current = null;
	};

	const topPct = (frac: number) => `${(1 - frac) * 100}%`;
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
						height: `${(1 - value[1]) * 100}%`,
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
						height: `${value[0] * 100}%`,
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

// ─── X-axis brush (horizontal range slider) ───────────────────────────────────
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
		if (drag.current.handle === "left")
			onChange([Math.max(0, Math.min(hi - 0.02, lo + delta)), hi]);
		else onChange([lo, Math.min(1, Math.max(lo + 0.02, hi + delta))]);
	};
	const onPointerUp = () => {
		if (drag.current) onCommit?.(latestValue.current);
		drag.current = null;
	};

	const travellerStyle = (side: "left" | "right"): React.CSSProperties => ({
		position: "absolute",
		top: 0,
		bottom: 0,
		left: side === "left" ? `${value[0] * 100}%` : `${value[1] * 100}%`,
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
						width: `${value[0] * 100}%`,
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
						width: `${(1 - value[1]) * 100}%`,
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

// ─── Axis pointer cursor ──────────────────────────────────────────────────────
const CURSOR_FILL = "rgba(0,0,0,0.04)";
const CURSOR_LINE_STYLE = {
	stroke: "#94a3b8",
	strokeWidth: 1,
	strokeDasharray: "4 4",
	pointerEvents: "none" as const,
};

function ComboCursor({
	axisPointerType,
	flipAxis,
}: {
	axisPointerType: string;
	flipAxis: boolean;
}) {
	const coordinate = useActiveTooltipCoordinate();
	const plotArea = usePlotArea();
	const isActive = useIsTooltipActive();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const xScale = useXAxisScale() as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const yScale = useYAxisScale() as any;
	const activeLabel = useActiveTooltipLabel();

	if (!isActive || !coordinate || !plotArea) return null;

	const ax = coordinate.x;
	const ay = coordinate.y;
	const {
		x: plotLeft,
		y: plotTop,
		width: plotWidth,
		height: plotHeight,
	} = plotArea;

	let shadowRect: React.ReactNode = null;
	if (flipAxis) {
		const bandStart: number | undefined = yScale?.(activeLabel, {
			position: "start",
		});
		const bandEnd: number | undefined = yScale?.(activeLabel, {
			position: "end",
		});
		if (bandStart != null && bandEnd != null)
			shadowRect = (
				<rect
					x={plotLeft}
					y={bandStart}
					width={plotWidth}
					height={bandEnd - bandStart}
					fill={CURSOR_FILL}
					pointerEvents="none"
				/>
			);
	} else {
		const bandStart: number | undefined = xScale?.(activeLabel, {
			position: "start",
		});
		const bandEnd: number | undefined = xScale?.(activeLabel, {
			position: "end",
		});
		if (bandStart != null && bandEnd != null)
			shadowRect = (
				<rect
					x={bandStart}
					y={plotTop}
					width={bandEnd - bandStart}
					height={plotHeight}
					fill={CURSOR_FILL}
					pointerEvents="none"
				/>
			);
	}

	let lines: React.ReactNode = null;
	if (axisPointerType === "line") {
		lines = flipAxis ? (
			<line
				x1={plotLeft}
				y1={ay}
				x2={plotLeft + plotWidth}
				y2={ay}
				{...CURSOR_LINE_STYLE}
			/>
		) : (
			<line
				x1={ax}
				y1={plotTop}
				x2={ax}
				y2={plotTop + plotHeight}
				{...CURSOR_LINE_STYLE}
			/>
		);
	} else if (axisPointerType === "cross") {
		lines = (
			<g>
				<line
					x1={ax}
					y1={plotTop}
					x2={ax}
					y2={plotTop + plotHeight}
					{...CURSOR_LINE_STYLE}
				/>
				<line
					x1={plotLeft}
					y1={ay}
					x2={plotLeft + plotWidth}
					y2={ay}
					{...CURSOR_LINE_STYLE}
				/>
			</g>
		);
	}

	return (
		<>
			<ZIndexLayer zIndex={350}>{shadowRect}</ZIndexLayer>
			{lines && (
				<ZIndexLayer zIndex={DefaultZIndexes.cursorLine}>
					{lines}
				</ZIndexLayer>
			)}
		</>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────
interface ComboChartVizProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	onStylingChange?: (updates: Partial<ComboStyling>) => void;
}

export function Combo_Chart({
	data,
	config,
	onStylingChange,
}: ComboChartVizProps) {
	const xKey = config?.xKey ?? "";
	const yKeys = config?.yKeys ?? [];
	const s = config?.styling?.combo ?? {};

	const seriesTypes = s.seriesTypes ?? {};
	// Display-name lists per zone (may overlap for shared columns)
	const comboBarKeys = s.barKeys ?? yKeys.filter((k) => !seriesTypes[k]);
	const comboLineKeys = s.lineKeys ?? yKeys.filter((k) => !!seriesTypes[k]);

	// For shared columns (same col in both zones), alias them so each zone gets its own
	// aggregation slot in the data: "revenue" → "revenue__combo_bar" / "revenue__combo_line"
	const comboSeries = useMemo(() => {
		const sharedCols = new Set(
			comboBarKeys.filter((k) => comboLineKeys.includes(k)),
		);
		return {
			bars: comboBarKeys.map((displayKey) => ({
				displayKey,
				resolvedKey: sharedCols.has(displayKey)
					? `${displayKey}__combo_bar`
					: displayKey,
			})),
			lines: comboLineKeys.map((displayKey) => ({
				displayKey,
				resolvedKey: sharedCols.has(displayKey)
					? `${displayKey}__combo_line`
					: displayKey,
			})),
			sharedCols,
		};
	}, [comboBarKeys, comboLineKeys]);

	const dataWithAliases = useMemo(() => {
		if (!comboSeries.sharedCols.size) return data;
		return data.map((row) => {
			const out = { ...row };
			for (const k of comboSeries.sharedCols) {
				out[`${k}__combo_bar`] = row[k];
				out[`${k}__combo_line`] = row[k];
			}
			return out;
		});
	}, [data, comboSeries.sharedCols]);
	const xCfg = s.xAxisConfig ?? {};
	const yCfg = s.yAxisConfig ?? {};
	const barWidth = s.barWidth ?? 60;
	const curveType = s.curveType ?? "smooth";
	const lineType = s.lineType;
	const lineWidth = s.lineWidth ?? 2;
	const symbolType = s.symbolType ?? "circle";
	const symbolSize = s.symbolSize ?? 3;
	const showLegend = s.showLegend ?? true;
	const colorRules = useMemo<ColorRule[]>(
		() => s.colorRules ?? [],
		[s.colorRules],
	);
	const trendlineType = s.trendlineType ?? "none";
	const showAverage = s.showAverage === true;
	const axisPointerType = s.axisPointer ?? "shadow";
	const flipAxis = s.flipAxis === true;
	const showMinMax = s.showMinMax === true;
	const reverseYAxis = s.reverseYAxis === true;
	const targetAreas = s.targetAreas ?? [];
	const targetLines = s.targetLines ?? [];
	const zoomX = s.zoomX === true;
	const zoomY = s.zoomY === true;
	const saveZoom = s.saveZoom === true;
	const valueLabelCfg = s.valueLabel ?? null;
	const formatRules = config?.styling?.formatRules ?? [];

	const palette = useMemo(() => {
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config?.styling?.colorPalette]);

	const chartData = useMemo(
		() => aggregateChartData(dataWithAliases, xKey, yKeys, config),
		[dataWithAliases, xKey, yKeys, config],
	);

	const trendlineData = useMemo(() => {
		if (trendlineType === "none" || !yKeys.length || !chartData.length)
			return null;
		return chartData.map((row) => ({
			...row,
			_trend: Number(row[yKeys[0]]) || 0,
		}));
	}, [trendlineType, chartData, yKeys]);

	// Zoom state
	const [yBrushFrac, setYBrushFrac] = useState<[number, number]>(() =>
		saveZoom && s.savedZoomY ? s.savedZoomY : [0, 1],
	);
	const [xBrushFrac, setXBrushFrac] = useState<[number, number]>(() =>
		saveZoom && s.savedZoomX ? s.savedZoomX : [0, 1],
	);
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
	const visibleRenderData = useMemo(() => {
		if (!xBrushActive || chartData.length < 2) return chartData;
		const n = chartData.length;
		const start = Math.floor(xBrushFrac[0] * n);
		const end = Math.ceil(xBrushFrac[1] * n) - 1;
		return chartData.slice(Math.max(0, start), Math.min(n, end + 1));
	}, [xBrushActive, chartData, xBrushFrac]);

	const { minIdx, maxIdx } = useMemo(() => {
		if (!showMinMax || !yKeys.length || !visibleRenderData.length)
			return {
				minIdx: {} as Record<string, number>,
				maxIdx: {} as Record<string, number>,
			};
		const minI: Record<string, number> = {};
		const maxI: Record<string, number> = {};
		for (const sk of yKeys) {
			let minV = Infinity,
				maxV = -Infinity,
				mi = 0,
				xi = 0;
			visibleRenderData.forEach((row, i) => {
				const v = Number(row[sk] ?? 0);
				if (v < minV) {
					minV = v;
					mi = i;
				}
				if (v > maxV) {
					maxV = v;
					xi = i;
				}
			});
			minI[sk] = mi;
			maxI[sk] = xi;
		}
		return { minIdx: minI, maxIdx: maxI };
	}, [showMinMax, yKeys, visibleRenderData]);

	const { dataYMin, dataYMax } = useMemo(() => {
		if (!zoomY || !chartData.length || !yKeys.length)
			return { dataYMin: 0, dataYMax: 1 };
		let maxVal = 0;
		for (const row of chartData) {
			const rowMax = yKeys.reduce(
				(mx, sk) => Math.max(mx, Number(row[sk] ?? 0)),
				0,
			);
			if (rowMax > maxVal) maxVal = rowMax;
		}
		return { dataYMin: 0, dataYMax: maxVal };
	}, [zoomY, chartData, yKeys]);

	const yBrushActive = zoomY && (yBrushFrac[0] > 0 || yBrushFrac[1] < 1);
	const yDomain = yBrushActive
		? ([
				dataYMin + yBrushFrac[0] * (dataYMax - dataYMin),
				dataYMin + yBrushFrac[1] * (dataYMax - dataYMin),
			] as [number, number])
		: undefined;

	const colorForSeries = (
		row: Record<string, unknown>,
		seriesIndex: number,
		seriesKey: string,
	): string => {
		for (const rule of colorRules) {
			if (rule.targetColumn && rule.targetColumn !== seriesKey) continue;
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

	const renderData =
		trendlineType !== "none" && trendlineData
			? visibleRenderData.map((r) => ({
					...r,
					_trend: Number(r[yKeys[0]]) || 0,
				}))
			: visibleRenderData;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
			}}
		>
			<div
				style={{
					display: "flex",
					flex: 1,
					minHeight: 0,
					gap: zoomY ? 4 : 0,
				}}
			>
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={renderData}
						barCategoryGap="30%"
						layout={flipAxis ? "vertical" : "horizontal"}
						margin={{
							top: showAverage && flipAxis ? 20 : 4,
							right:
								showAverage && !flipAxis
									? 48
									: showMinMax && flipAxis
										? 50
										: 8,
							left: yAxisLabel && !flipAxis ? 12 : 0,
							bottom: 4,
						}}
					>
						<defs>
							{comboSeries.lines.map(
								({ displayKey, resolvedKey }) => {
									if (
										(seriesTypes[displayKey] ?? "line") !==
										"area"
									)
										return null;
									const i = yKeys.indexOf(resolvedKey);
									const color =
										palette[
											Math.max(0, i) % palette.length
										];
									return (
										<linearGradient
											key={`grad-${resolvedKey}`}
											id={`combo-grad-${resolvedKey}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor={color}
												stopOpacity={0.25}
											/>
											<stop
												offset="95%"
												stopColor={color}
												stopOpacity={0.03}
											/>
										</linearGradient>
									);
								},
							)}
						</defs>
						<CartesianGrid
							{...GRID_STYLE}
							horizontal={!flipAxis}
							vertical={flipAxis}
						/>
						{flipAxis ? (
							<>
								<XAxis
									type="number"
									tick={{
										...AXIS_STYLE,
										fontSize:
											yCfg.fontSize ??
											AXIS_STYLE.fontSize,
									}}
									axisLine={false}
									tickLine={yCfg.showTicks ?? true}
									reversed={reverseYAxis || undefined}
									tickFormatter={(v: unknown) =>
										formatValue(
											v,
											comboBarKeys[0] ??
												comboLineKeys[0] ??
												yKeys[0] ??
												"",
											formatRules,
										)
									}
								/>
								<YAxis
									dataKey={xKey}
									type="category"
									tick={{
										...AXIS_STYLE,
										fontSize:
											xCfg.fontSize ??
											AXIS_STYLE.fontSize,
									}}
									axisLine={false}
									tickLine={false}
									width={80}
									tickFormatter={(v: unknown) =>
										formatValue(v, xKey, formatRules)
									}
								/>
							</>
						) : (
							<>
								<XAxis
									dataKey={xKey}
									tick={
										xCfg.showLabels === false
											? false
											: {
													...AXIS_STYLE,
													fontSize:
														xCfg.fontSize ??
														AXIS_STYLE.fontSize,
												}
									}
									axisLine={false}
									tickLine={xCfg.showTicks ?? true}
									tickMargin={xCfg.axisGap ?? undefined}
									angle={xCfg.rotateValues ?? 0}
									textAnchor={
										xCfg.rotateValues ? "end" : "middle"
									}
									tickFormatter={(v: unknown) =>
										formatValue(v, xKey, formatRules)
									}
									label={buildAxisLabelProps(
										xAxisLabel,
										xCfg,
										"x",
									)}
								/>
								<YAxis
									tick={
										yCfg.showLabels === false
											? false
											: {
													...AXIS_STYLE,
													fontSize:
														yCfg.fontSize ??
														AXIS_STYLE.fontSize,
												}
									}
									axisLine={false}
									tickLine={yCfg.showTicks ?? true}
									tickMargin={yCfg.axisGap ?? undefined}
									width={48}
									reversed={reverseYAxis || undefined}
									domain={yDomain}
									allowDataOverflow={yBrushActive}
									allowDecimals={zoomY ? false : undefined}
									tickFormatter={(v: unknown) =>
										formatValue(
											v,
											comboBarKeys[0] ??
												comboLineKeys[0] ??
												yKeys[0] ??
												"",
											formatRules,
										)
									}
									label={buildAxisLabelProps(
										yAxisLabel,
										yCfg,
										"y",
									)}
								/>
							</>
						)}
						<Tooltip
							content={<ChartTooltip config={config} />}
							cursor={false}
							wrapperStyle={{ zIndex: 10 }}
						/>
						{showLegend && (
							<Legend
								content={
									<PaginatedLegend
										leftPadding={
											!flipAxis
												? Math.max(
														0,
														(yAxisLabel ? 12 : 0) +
															48 -
															(showAverage
																? 48
																: 8),
													)
												: 0
										}
									/>
								}
								wrapperStyle={{
									fontSize: 11,
									color: "#64748b",
									paddingTop: 8,
								}}
							/>
						)}

						{/* Bars — rendered first so overlays paint on top */}
						{comboSeries.bars.map(({ displayKey, resolvedKey }) => {
							const i = yKeys.indexOf(resolvedKey);
							const color =
								palette[Math.max(0, i) % palette.length];
							const showLabels = valueLabelCfg?.show === true;
							return (
								<Bar
									key={`bar-${resolvedKey}`}
									dataKey={resolvedKey}
									name={displayKey}
									fill={color}
									barSize={barWidth}
									radius={[3, 3, 0, 0]}
									isAnimationActive={false}
								>
									{visibleRenderData.map((row, idx) => (
										<Cell
											key={`${resolvedKey}-${idx}`}
											fill={colorForSeries(
												row,
												i,
												resolvedKey,
											)}
										/>
									))}
									{showLabels && (
										<LabelList
											dataKey={resolvedKey}
											position={
												valueLabelCfg?.position ?? "top"
											}
											angle={valueLabelCfg?.rotate ?? 0}
											style={{
												fontSize:
													valueLabelCfg?.fontSize ??
													10,
												fill:
													valueLabelCfg?.color ??
													"#64748b",
											}}
											formatter={
												((v: unknown) =>
													typeof v === "number"
														? formatValue(
																v,
																resolvedKey,
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
											dataKey={resolvedKey}
											content={(props: any) => {
												const {
													index,
													x,
													y,
													width,
													height,
													value,
												} = props;
												const isMax =
													index ===
													maxIdx[resolvedKey];
												const isMin =
													index ===
													minIdx[resolvedKey];
												if (!isMax && !isMin)
													return null;
												const label =
													typeof value === "number"
														? value.toLocaleString()
														: String(value ?? "");
												const badgeW = Math.max(
													label.length * 6 + 10,
													26,
												);
												if (flipAxis) {
													const cx =
														(x ?? 0) + (width ?? 0);
													const cy =
														(y ?? 0) +
														(height ?? 0) / 2;
													return (
														<g>
															<circle
																cx={cx}
																cy={cy}
																r={5}
																fill={color}
																stroke="#fff"
																strokeWidth={
																	1.5
																}
															/>
															<rect
																x={cx + 8}
																y={cy - 7}
																width={badgeW}
																height={14}
																rx={4}
																fill={color}
															/>
															<text
																x={
																	cx +
																	8 +
																	badgeW / 2
																}
																y={cy}
																textAnchor="middle"
																dominantBaseline="middle"
																fontSize={9}
																fontWeight={700}
																fill="#fff"
															>
																{label}
															</text>
														</g>
													);
												}
												const cx =
													(x ?? 0) + (width ?? 0) / 2;
												const cy = y ?? 0;
												return (
													<g>
														<circle
															cx={cx}
															cy={cy}
															r={5}
															fill={color}
															stroke="#fff"
															strokeWidth={1.5}
														/>
														<rect
															x={cx - badgeW / 2}
															y={cy - 23}
															width={badgeW}
															height={14}
															rx={4}
															fill={color}
														/>
														<text
															x={cx}
															y={cy - 16}
															textAnchor="middle"
															dominantBaseline="middle"
															fontSize={9}
															fontWeight={700}
															fill="#fff"
														>
															{label}
														</text>
													</g>
												);
											}}
										/>
									)}
								</Bar>
							);
						})}

						{/* Area overlays */}
						{comboSeries.lines
							.filter(
								({ displayKey }) =>
									(seriesTypes[displayKey] ?? "line") ===
									"area",
							)
							.map(({ displayKey, resolvedKey }) => {
								const i = yKeys.indexOf(resolvedKey);
								const color =
									palette[Math.max(0, i) % palette.length];
								const showLabels = valueLabelCfg?.show === true;
								return (
									<Area
										key={`area-${resolvedKey}`}
										dataKey={resolvedKey}
										name={displayKey}
										stroke={color}
										fill={`url(#combo-grad-${resolvedKey})`}
										strokeWidth={lineWidth}
										strokeDasharray={strokeDashFor(
											lineType,
										)}
										type={curveTypeToRecharts(
											curveType as any,
										)}
										isAnimationActive={false}
										dot={
											symbolType === "none"
												? false
												: (props: any) => {
														const {
															cx,
															cy,
															index,
														} = props;
														const row =
															visibleRenderData[
																index
															];
														const dotColor = row
															? colorForSeries(
																	row,
																	i,
																	resolvedKey,
																)
															: color;
														return (
															<g
																key={`dot-area-${resolvedKey}-${index}`}
															>
																{renderChartSymbol(
																	symbolType,
																	cx,
																	cy,
																	symbolSize,
																	dotColor,
																)}
															</g>
														);
													}
										}
										activeDot={
											symbolType === "none"
												? false
												: {
														r: symbolSize + 2,
														strokeWidth: 0,
														fill: color,
													}
										}
									>
										{showLabels && (
											<LabelList
												dataKey={resolvedKey}
												position={
													valueLabelCfg?.position ??
													"top"
												}
												angle={
													valueLabelCfg?.rotate ?? 0
												}
												style={{
													fontSize:
														valueLabelCfg?.fontSize ??
														10,
													fill:
														valueLabelCfg?.color ??
														"#64748b",
												}}
												formatter={
													((v: unknown) =>
														typeof v === "number"
															? formatValue(
																	v,
																	resolvedKey,
																	formatRules,
																)
															: String(
																	v ?? "",
																)) as never
												}
											/>
										)}
									</Area>
								);
							})}

						{/* Line overlays */}
						{comboSeries.lines
							.filter(
								({ displayKey }) =>
									(seriesTypes[displayKey] ?? "line") ===
									"line",
							)
							.map(({ displayKey, resolvedKey }) => {
								const i = yKeys.indexOf(resolvedKey);
								const color =
									palette[Math.max(0, i) % palette.length];
								const showLabels = valueLabelCfg?.show === true;
								return (
									<Line
										key={`line-${resolvedKey}`}
										dataKey={resolvedKey}
										name={displayKey}
										stroke={color}
										strokeWidth={lineWidth}
										strokeDasharray={strokeDashFor(
											lineType,
										)}
										type={curveTypeToRecharts(
											curveType as any,
										)}
										isAnimationActive={false}
										dot={
											symbolType === "none"
												? false
												: (props: any) => {
														const {
															cx,
															cy,
															index,
														} = props;
														const row =
															visibleRenderData[
																index
															];
														const dotColor = row
															? colorForSeries(
																	row,
																	i,
																	resolvedKey,
																)
															: color;
														return (
															<g
																key={`dot-line-${resolvedKey}-${index}`}
															>
																{renderChartSymbol(
																	symbolType,
																	cx,
																	cy,
																	symbolSize,
																	dotColor,
																)}
															</g>
														);
													}
										}
										activeDot={
											symbolType === "none"
												? false
												: {
														r: symbolSize + 2,
														strokeWidth: 0,
														fill: color,
													}
										}
									>
										{showLabels && (
											<LabelList
												dataKey={resolvedKey}
												position={
													valueLabelCfg?.position ??
													"top"
												}
												angle={
													valueLabelCfg?.rotate ?? 0
												}
												style={{
													fontSize:
														valueLabelCfg?.fontSize ??
														10,
													fill:
														valueLabelCfg?.color ??
														"#64748b",
												}}
												formatter={
													((v: unknown) =>
														typeof v === "number"
															? formatValue(
																	v,
																	resolvedKey,
																	formatRules,
																)
															: String(
																	v ?? "",
																)) as never
												}
											/>
										)}
									</Line>
								);
							})}

						{/* Trendline */}
						{trendlineType !== "none" && (
							<Line
								type={curveTypeToRecharts(trendlineType as any)}
								dataKey="_trend"
								stroke="#64748b"
								strokeWidth={2}
								dot={{ r: 3, strokeWidth: 0, fill: "#64748b" }}
								activeDot={false}
								legendType="none"
								isAnimationActive={false}
							/>
						)}

						{/* Average lines */}
						{showAverage &&
							yKeys.map((sk, i) => {
								const avg =
									visibleRenderData.reduce(
										(s, r) => s + Number(r[sk] ?? 0),
										0,
									) / (visibleRenderData.length || 1);
								const color = palette[i % palette.length];
								return (
									<ReferenceLine
										key={`avg-${sk}`}
										y={flipAxis ? undefined : avg}
										x={flipAxis ? avg : undefined}
										stroke={color}
										strokeDasharray="4 4"
										label={{
											value: formatValue(
												avg,
												sk,
												formatRules,
											),
											position: flipAxis
												? "top"
												: "right",
											fontSize: 10,
											fill: color,
											fontWeight: 600,
										}}
									/>
								);
							})}

						{/* Target areas */}
						{targetAreas.map((a) => (
							<ReferenceArea
								key={a.id}
								y1={flipAxis ? undefined : a.y1}
								y2={flipAxis ? undefined : a.y2}
								x1={flipAxis ? a.y1 : undefined}
								x2={flipAxis ? a.y2 : undefined}
								fill={a.color ?? "#6366f1"}
								fillOpacity={a.opacity ?? 0.85}
								label={
									a.showName && a.name
										? {
												value: a.name,
												position:
													a.namePosition ??
													"insideTop",
												fontSize: a.fontSize ?? 11,
												fill: a.fontColor ?? "#64748b",
											}
										: undefined
								}
							/>
						))}

						{/* Target lines */}
						{targetLines.map((l) => (
							<ReferenceLine
								key={l.id}
								y={flipAxis ? undefined : l.y}
								x={flipAxis ? l.y : undefined}
								stroke={l.color ?? "#64748b"}
								label={
									l.showName && l.name
										? {
												value: l.name,
												position:
													l.namePosition ??
													"insideTopRight",
												fontSize: l.fontSize ?? 11,
												fill: l.fontColor ?? "#64748b",
											}
										: undefined
								}
							/>
						))}

						<ComboCursor
							axisPointerType={axisPointerType}
							flipAxis={flipAxis}
						/>
					</ComposedChart>
				</ResponsiveContainer>

				{zoomY && (
					<YAxisBrush
						dataYMin={dataYMin}
						dataYMax={dataYMax}
						value={yBrushFrac}
						onChange={setYBrushFrac}
						onCommit={
							saveZoom
								? (v) => onStylingChange?.({ savedZoomY: v })
								: undefined
						}
						marginTop={36}
						marginBottom={showLegend ? 32 : 4}
					/>
				)}
			</div>

			{zoomX && (
				<XAxisBrush
					value={xBrushFrac}
					onChange={setXBrushFrac}
					onCommit={
						saveZoom
							? (v) => onStylingChange?.({ savedZoomX: v })
							: undefined
					}
					marginLeft={48}
					marginRight={(showAverage ? 48 : 8) + (zoomY ? 24 : 0)}
				/>
			)}
		</div>
	);
}
