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
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Bar,
	BarChart,
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
import { formatValue } from "@/lib/formatValue";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	curveTypeToRecharts,
	type StackBarStyling,
	type VisualizationConfig,
} from "@/types/dashboard";

// Vertical range brush — mirrors recharts Brush styling/UX for the Y axis.
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
	value: [number, number]; // [minFrac, maxFrac] 0=dataYMin 1=dataYMax
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

	// Fraction → CSS top% (0=bottom → 100%, 1=top → 0%)
	const topPct = (frac: number) => `${(1 - frac) * 100}%`;
	// Height of non-selected overlay areas
	const nonSelTopH = `${(1 - value[1]) * 100}%`;
	const nonSelBotH = `${value[0] * 100}%`;

	const fmt = (frac: number) =>
		Math.round(dataYMin + frac * (dataYMax - dataYMin)).toLocaleString();

	// Traveller: full-width bar matching recharts traveller appearance
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
			{/* Track — matches recharts Brush container */}
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
				{/* Non-selected top overlay */}
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
				{/* Non-selected bottom overlay */}
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
				{/* Max traveller */}
				<div
					title={`Max: ${fmt(value[1])}`}
					onPointerDown={onPointerDown("max")}
					style={traveller("max")}
				/>
				{/* Min traveller */}
				<div
					title={`Min: ${fmt(value[0])}`}
					onPointerDown={onPointerDown("min")}
					style={traveller("min")}
				/>
			</div>
		</div>
	);
}

// Horizontal range brush — mirrors recharts Brush styling but rendered outside the chart.
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
				paddingTop: "8px",
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
				{/* Non-selected left overlay */}
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
				{/* Non-selected right overlay */}
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
				{/* Left traveller */}
				<div
					onPointerDown={onPointerDown("left")}
					style={travellerStyle("left")}
				/>
				{/* Right traveller */}
				<div
					onPointerDown={onPointerDown("right")}
					style={travellerStyle("right")}
				/>
			</div>
		</div>
	);
}

// Semi-transparent dark overlay so reference areas/lines show through the hover shadow
const CURSOR_FILL = "rgba(0,0,0,0.04)";
const CURSOR_LINE_STYLE = {
	stroke: "#94a3b8",
	strokeWidth: 1,
	strokeDasharray: "4 4",
	pointerEvents: "none" as const,
};

// Unified cursor overlay — handles shadow fill and dashed lines for all chart types.
//
// recharts v3 coordinate values (from useActiveTooltipCoordinate):
//   layout='horizontal' (vertical bars):   x = band center, y = mouse Y
//   layout='vertical'   (horizontal bars): x = mouse X,    y = band center
//
// Z-index rendering order:
//   bar:        300  – bars
//   shadow:     350  – shadow fill above bars (visible even for fully-stacked bars)
//   axis:       500
//   cursorLine: 1100 – dashed lines above everything
function BarCursor({
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

	// Shadow rectangle covering the full hovered category band
	let shadowRect: React.ReactNode = null;
	if (flipAxis) {
		const bandStart: number | undefined = yScale?.(activeLabel, {
			position: "start",
		});
		const bandEnd: number | undefined = yScale?.(activeLabel, {
			position: "end",
		});
		if (bandStart != null && bandEnd != null) {
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
		}
	} else {
		const bandStart: number | undefined = xScale?.(activeLabel, {
			position: "start",
		});
		const bandEnd: number | undefined = xScale?.(activeLabel, {
			position: "end",
		});
		if (bandStart != null && bandEnd != null) {
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
	}

	// Dashed lines for line and cross modes
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

interface BarChartVizProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	/** Stack the Y series on top of one another (stacked bar chart) instead of grouping side by side. */
	stacked?: boolean;
	/** Called when stackbar styling should be persisted (e.g. save-zoom on brush release). */
	onStylingChange?: (updates: Partial<StackBarStyling>) => void;
}

export function Bar_Chart({
	data,
	config,
	stacked = false,
	onStylingChange,
}: BarChartVizProps) {
	const xKey = config?.xKey ?? "";
	const yKeys = config?.yKeys ?? [];
	const barStyling = config?.styling?.bar ?? {};
	const sbStyling = config?.styling?.stackbar ?? {};
	const styling = stacked ? sbStyling : barStyling;
	const xCfg = styling.xAxisConfig ?? {};
	const yCfg = styling.yAxisConfig ?? {};
	const formatRules = config?.styling?.formatRules ?? [];
	const showValueLabels = styling.showValueLabels === true;
	const barWidth = styling.barWidth ?? 60;
	const trendlineType = styling.trendlineType ?? "none";
	const showLegend = styling.showLegend ?? true;
	const colorRules = useMemo<ColorRule[]>(
		() => styling.colorRules ?? [],
		[styling.colorRules],
	);

	// Shared stackbar/bar config — these tools exist in both panels
	const sbShowAverage = sbStyling.showAverage === true;
	const axisPointerType = sbStyling.axisPointer ?? "shadow";
	const flipAxis = sbStyling.flipAxis === true;
	const flipSeries = sbStyling.flipSeries === true;
	const showMinMax = sbStyling.showMinMax === true;
	const reverseYAxis = sbStyling.reverseYAxis === true;
	const targetAreas = sbStyling.targetAreas ?? [];
	const targetLines = sbStyling.targetLines ?? [];
	const zoomX = sbStyling.zoomX === true;
	const zoomY = sbStyling.zoomY === true;
	const saveZoom = sbStyling.saveZoom === true;
	const unstacked = stacked && sbStyling.unstacked === true; // only meaningful for stackbar
	const valueLabelCfg =
		(stacked ? sbStyling.valueLabel : barStyling.valueLabel) ?? null;

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

			if (flipSeries) {
				// Swap roles: facet values become X-axis groups, xKey values become stacked series
				const facets: string[] = [];
				const facetsSeen = new Set<string>();
				const xs: string[] = [];
				const xsSeen = new Set<string>();
				const buckets = new Map<string, Map<string, unknown[]>>();
				for (const r of data) {
					const x = String(r[xKey] ?? "");
					const f = String(r[facetKey] ?? "");
					if (!facetsSeen.has(f)) {
						facetsSeen.add(f);
						facets.push(f);
					}
					if (!xsSeen.has(x)) {
						xsSeen.add(x);
						xs.push(x);
					}
					let fb = buckets.get(f);
					if (!fb) {
						fb = new Map();
						buckets.set(f, fb);
					}
					let arr = fb.get(x);
					if (!arr) {
						arr = [];
						fb.set(x, arr);
					}
					arr.push(r[yk]);
				}
				const rows = facets.map((f) => {
					const row: Record<string, unknown> = { [facetKey]: f };
					const fb = buckets.get(f);
					if (fb)
						for (const [x, arr] of fb)
							row[x] = aggregateValue(arr, aggType);
					return row;
				});
				return { renderData: rows, seriesKeys: xs };
			}

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
		// Non-stacked grouped bar: pivot so yKey names become x-axis and xKey values become series.
		// Each yKey becomes one row (keyed by '__yKey__') and each original xKey value becomes a series column.
		if (!stacked && flipSeries && yKeys.length > 0) {
			const xVals: string[] = [];
			const xSeen = new Set<string>();
			for (const r of chartData) {
				const x = String(r[xKey] ?? "");
				if (!xSeen.has(x)) {
					xSeen.add(x);
					xVals.push(x);
				}
			}
			const rows = yKeys.map((yk) => {
				const row: Record<string, unknown> = { __yKey__: yk };
				for (const r of chartData) row[String(r[xKey] ?? "")] = r[yk];
				return row;
			});
			return { renderData: rows, seriesKeys: xVals };
		}
		return { renderData: chartData, seriesKeys: yKeys };
	}, [
		facetMode,
		facetKey,
		data,
		xKey,
		yKeys,
		chartData,
		flipSeries,
		stacked,
	]);

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
		seriesKey: string,
		seriesIndex: number,
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

	// ComposedChart only when trendline is active (Line inside BarChart is unsupported).
	// ReferenceLine, ReferenceArea, and Brush all work natively in BarChart.
	// Note: !facetMode restriction removed — ComposedChart with a Line child still
	// gives per-column hover for stacked facet charts.
	// Trendline disabled when non-stacked flip-series is active (pivoted layout has no meaningful trend axis)
	const useComposed = trendlineType !== "none" && (stacked || !flipSeries);
	const ChartComponent: typeof BarChart | typeof ComposedChart = useComposed
		? ComposedChart
		: BarChart;

	// FlipSeries in stacked-facet mode: swap facet/xKey roles.
	// FlipSeries in non-stacked mode: pivot applied in renderData, synthetic key used.
	const effectiveXDataKey =
		flipSeries && facetMode
			? facetKey
			: !stacked && flipSeries
				? "__yKey__"
				: xKey;

	// Y brush state: [minFrac, maxFrac] where 0=data min, 1=data max
	const [yBrushFrac, setYBrushFrac] = useState<[number, number]>(() =>
		saveZoom && sbStyling.savedZoomY ? sbStyling.savedZoomY : [0, 1],
	);
	// X brush state: [startFrac, endFrac] over the renderData array
	const [xBrushFrac, setXBrushFrac] = useState<[number, number]>(() =>
		saveZoom && sbStyling.savedZoomX ? sbStyling.savedZoomX : [0, 1],
	);

	// Keep refs so the saveZoom effect below reads the latest fracs without re-running.
	const xBrushFracRef = useRef(xBrushFrac);
	xBrushFracRef.current = xBrushFrac;
	const yBrushFracRef = useRef(yBrushFrac);
	yBrushFracRef.current = yBrushFrac;

	// When the user turns Save Zoom ON, immediately flush the current brush positions
	// to config — even if they dragged the brushes before enabling the toggle.
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
		if (!xBrushActive || renderData.length < 2) return renderData;
		const n = renderData.length;
		const start = Math.floor(xBrushFrac[0] * n);
		const end = Math.ceil(xBrushFrac[1] * n) - 1;
		return renderData.slice(Math.max(0, start), Math.min(n, end + 1));
	}, [stacked, xBrushActive, renderData, xBrushFrac]);

	// Per-series min/max row indices — must come after visibleRenderData.
	const { minIdx, maxIdx } = useMemo(() => {
		if (!showMinMax || !seriesKeys.length || !visibleRenderData.length)
			return {
				minIdx: {} as Record<string, number>,
				maxIdx: {} as Record<string, number>,
			};
		const minI: Record<string, number> = {};
		const maxI: Record<string, number> = {};
		for (const sk of seriesKeys) {
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
	}, [showMinMax, seriesKeys, visibleRenderData]);

	// Stacked trendline data: adds _stackTotal so the Line has a draw target.
	// When stacked: _stackTotal = sum of positive series values (top of the stacked bar).
	// When unstacked (grouped): _stackTotal = tallest bar in the group (max single-series value),
	// so the trendline traces the peak of each category's bar cluster.
	const stackedTrendData = useMemo(() => {
		if (!stacked || trendlineType === "none" || !seriesKeys.length)
			return null;
		return visibleRenderData.map((row) => ({
			...row,
			_stackTotal: unstacked
				? seriesKeys.reduce(
						(mx, sk) => Math.max(mx, Number(row[sk] ?? 0)),
						0,
					)
				: seriesKeys.reduce(
						(sum, sk) => sum + Math.max(0, Number(row[sk] ?? 0)),
						0,
					),
		}));
	}, [stacked, unstacked, trendlineType, visibleRenderData, seriesKeys]);

	// Data Y range for the Y-axis brush.
	// Stacked: max is the stack sum per row (total bar height).
	// Unstacked/grouped: max is the largest single-series value across all rows.
	const { dataYMin, dataYMax } = useMemo(() => {
		if (!zoomY || !renderData.length || !seriesKeys.length)
			return { dataYMin: 0, dataYMax: 1 };
		let maxVal = 0;
		for (const row of renderData) {
			const rowMax = unstacked
				? seriesKeys.reduce(
						(mx, sk) => Math.max(mx, Number(row[sk] ?? 0)),
						0,
					)
				: seriesKeys.reduce(
						(s, sk) => s + Math.max(0, Number(row[sk] ?? 0)),
						0,
					);
			if (rowMax > maxVal) maxVal = rowMax;
		}
		return { dataYMin: 0, dataYMax: maxVal };
	}, [zoomY, unstacked, renderData, seriesKeys]);

	// Y axis domain — only constrain when the brush has been moved away from full range.
	// At [0,1] let recharts auto-scale (so enabling zoom doesn't snap the axis max to
	// the raw data max, which is typically lower than recharts' nice-rounded display max).
	const yBrushActive = zoomY && (yBrushFrac[0] > 0 || yBrushFrac[1] < 1);
	const yDomain = yBrushActive
		? ([
				dataYMin + yBrushFrac[0] * (dataYMax - dataYMin),
				dataYMin + yBrushFrac[1] * (dataYMax - dataYMin),
			] as [number, number])
		: undefined;

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
					<ChartComponent
						data={
							stacked
								? (stackedTrendData ?? visibleRenderData)
								: useComposed
									? visibleRenderData.map((r) => ({
											...r,
											_trend: Number(r[yKeys[0]]) || 0,
										}))
									: visibleRenderData
						}
						barCategoryGap="30%"
						layout={flipAxis ? "vertical" : "horizontal"}
						margin={{
							top: flipAxis && sbShowAverage ? 20 : 4,
							right:
								!flipAxis && sbShowAverage
									? 48
									: flipAxis && showMinMax
										? 50
										: 8,
							left: 0,
							bottom: 4,
						}}
					>
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
											yKeys[0] ?? "",
											formatRules,
										)
									}
								/>
								<YAxis
									dataKey={effectiveXDataKey}
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
									dataKey={effectiveXDataKey}
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
											yKeys[0] ?? "",
											formatRules,
										)
									}
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
							</>
						)}
						<Tooltip
							content={<ChartTooltip config={config} />}
							cursor={false}
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
								// When stacked (and not unstacked/grouped), all series share one
								// stackId; only the top series gets rounded corners.
								stackId={
									stacked && !unstacked ? "stack" : undefined
								}
								radius={
									stacked && !unstacked
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
								{(valueLabelCfg
									? valueLabelCfg.show === true
									: showValueLabels) && (
									<LabelList
										dataKey={k}
										position={
											valueLabelCfg?.position ??
											(stacked && !unstacked
												? "center"
												: "top")
										}
										angle={valueLabelCfg?.rotate ?? 0}
										style={{
											fontSize:
												valueLabelCfg?.fontSize ?? 10,
											fill:
												valueLabelCfg?.color ??
												(stacked && !unstacked
													? "#fff"
													: "#64748b"),
											fontFamily:
												valueLabelCfg?.fontFamily ??
												undefined,
										}}
										formatter={
											((v: unknown) =>
												typeof v === "number"
													? formatValue(
															v,
															k,
															formatRules,
														)
													: String(v ?? "")) as never
										}
									/>
								)}
								{showMinMax && (
									<LabelList
										dataKey={k}
										content={(props: any) => {
											const {
												index,
												x,
												y,
												width,
												height,
												value,
											} = props;
											const isMax = index === maxIdx[k];
											const isMin = index === minIdx[k];
											if (!isMax && !isMin) return null;
											const color =
												palette[i % palette.length];
											const label =
												typeof value === "number"
													? value.toLocaleString()
													: String(value ?? "");
											const badgeW = Math.max(
												label.length * 6 + 10,
												26,
											);
											if (flipAxis) {
												// Horizontal bar — marker at right tip, badge to the right
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
															strokeWidth={1.5}
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
											// Vertical bar — marker at top-center, badge above
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
						))}
						{/* Trendline (non-stacked only) */}
						{useComposed && !stacked && trendlineData && (
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
						{/* Stacked: trendline through the top of the stack (_stackTotal) */}
						{stacked && stackedTrendData && (
							<Line
								type={curveTypeToRecharts(
									trendlineType as Exclude<
										typeof trendlineType,
										"none"
									>,
								)}
								dataKey="_stackTotal"
								stroke="#64748b"
								strokeWidth={2}
								dot={{ r: 3, strokeWidth: 0, fill: "#64748b" }}
								activeDot={false}
								legendType="none"
								isAnimationActive={false}
							/>
						)}
						{/* Average lines — one dashed ReferenceLine per series, colored to match */}
						{sbShowAverage &&
							seriesKeys.map((sk, i) => {
								const avg =
									renderData.reduce(
										(s, r) => s + Number(r[sk] ?? 0),
										0,
									) / (renderData.length || 1);
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
						<BarCursor
							axisPointerType={axisPointerType}
							flipAxis={flipAxis}
						/>
					</ChartComponent>
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
					marginRight={(sbShowAverage ? 48 : 8) + (zoomY ? 24 : 0)}
				/>
			)}
		</div>
	);
}
