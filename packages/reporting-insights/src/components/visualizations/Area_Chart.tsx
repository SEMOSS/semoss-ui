import { TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	CartesianGrid,
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
	type AreaStyling,
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	curveTypeToRecharts,
	type FormatRule,
	type VisualizationConfig,
} from "@/types/dashboard";

// ── Vertical range brush (Y axis) ────────────────────────────────────────────
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

// ── Horizontal range brush (X axis) ──────────────────────────────────────────
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

// ── Axis pointer cursor overlay ───────────────────────────────────────────────
const CURSOR_FILL = "rgba(0,0,0,0.04)";
const CURSOR_LINE_STYLE = {
	stroke: "#94a3b8",
	strokeWidth: 1,
	strokeDasharray: "4 4",
	pointerEvents: "none" as const,
};

// Area/line charts use a point scale, not a band scale, so xScale(label, { position: 'start'/'end' })
// returns zero-width bands. Instead, derive the shadow width from the spacing between ticks.
function getShadowHalfWidth(scale: any, ticks: string[]): number {
	if (ticks.length < 2) return 30;
	const p0: number | undefined = scale?.(ticks[0]);
	const p1: number | undefined = scale?.(ticks[1]);
	if (p0 != null && p1 != null && p1 > p0) return (p1 - p0) / 2;
	return 30;
}

function AreaCursor({
	axisPointerType,
	flipAxis,
	xTicks,
	yTicks,
}: {
	axisPointerType: string;
	flipAxis: boolean;
	xTicks: string[];
	yTicks: string[];
}) {
	const coordinate = useActiveTooltipCoordinate();
	const plotArea = usePlotArea();
	const isActive = useIsTooltipActive();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const xScale = useXAxisScale() as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const yScale = useYAxisScale() as any;

	if (!isActive || !coordinate || !plotArea) return null;

	const ax = coordinate.x;
	const ay = coordinate.y;
	const {
		x: plotLeft,
		y: plotTop,
		width: plotWidth,
		height: plotHeight,
	} = plotArea;

	// Shadow: use half the inter-tick spacing as the half-width of the highlight band,
	// centered on the snapped coordinate (ax / ay). This works for point scales where
	// the band-scale position approach returns zero width.
	let shadowRect: React.ReactNode = null;
	if (flipAxis) {
		const hw = getShadowHalfWidth(yScale, yTicks);
		shadowRect = (
			<rect
				x={plotLeft}
				y={ay - hw}
				width={plotWidth}
				height={hw * 2}
				fill={CURSOR_FILL}
				pointerEvents="none"
			/>
		);
	} else {
		const hw = getShadowHalfWidth(xScale, xTicks);
		shadowRect = (
			<rect
				x={ax - hw}
				y={plotTop}
				width={hw * 2}
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

// ── Total labels — renders per-category totals at fixed top/right margin ─────
// Uses the same direct-child hook pattern as AreaCursor so axis scales are accessible.
function TotalLabels({
	rows,
	xDataKey,
	flipAxis,
	yKey,
	formatRules,
}: {
	rows: Array<Record<string, unknown>>;
	xDataKey: string;
	flipAxis: boolean;
	yKey: string;
	formatRules: FormatRule[];
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const xScale = useXAxisScale() as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const yScale = useYAxisScale() as any;
	const plotArea = usePlotArea();

	if (!plotArea) return null;

	return (
		<g>
			{rows.map((row, i) => {
				const total = row._total;
				if (total == null) return null;
				const formatted =
					typeof total === "number"
						? formatValue(total, yKey, formatRules)
						: String(total);
				const catVal = String(row[xDataKey] ?? "");

				if (flipAxis) {
					const y = yScale?.(catVal);
					if (y == null) return null;
					return (
						<text
							key={i}
							x={plotArea.x + plotArea.width + 6}
							y={y + 4}
							fontSize={10}
							fill="#64748b"
							textAnchor="start"
						>
							{formatted}
						</text>
					);
				}

				const x = xScale?.(catVal);
				if (x == null) return null;
				return (
					<text
						key={i}
						x={x}
						y={plotArea.y - 5}
						textAnchor="middle"
						fontSize={10}
						fill="#64748b"
					>
						{formatted}
					</text>
				);
			})}
		</g>
	);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AreaChartVizProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	onStylingChange?: (updates: Partial<AreaStyling>) => void;
}

export function Area_Chart({
	data,
	config,
	onStylingChange,
}: AreaChartVizProps) {
	const xKey = config?.xKey ?? "";
	const yKeys = config?.yKeys ?? [];
	const s: AreaStyling = config?.styling?.area ?? {};

	const curveType = s.curveType ?? "smooth";
	const lineWidth = s.lineWidth ?? 2;
	const trendlineType = s.trendlineType ?? "none";
	const showLegend = s.showLegend ?? true;
	const showAverage = s.showAverage === true;
	const axisPointerType = s.axisPointer ?? "shadow";
	const flipAxis = s.flipAxis === true;
	const flipSeries = s.flipSeries === true;
	const showMinMax = s.showMinMax === true;
	const reverseYAxis = s.reverseYAxis === true;
	const targetAreas = s.targetAreas ?? [];
	const targetLines = s.targetLines ?? [];
	const zoomX = s.zoomX === true;
	const zoomY = s.zoomY === true;
	const saveZoom = s.saveZoom === true;
	const unstacked = s.unstacked === true;
	const showTotals = s.showTotals === true;
	const symbolType = s.symbolType ?? "none";
	const symbolSize = s.symbolSize ?? 4;
	const xCfg = s.xAxisConfig ?? {};
	const yCfg = s.yAxisConfig ?? {};
	const valueLabelCfg = s.valueLabel ?? null;
	const formatRules = config?.styling?.formatRules ?? [];
	const colorRules = useMemo<ColorRule[]>(
		() => s.colorRules ?? [],
		[s.colorRules],
	);

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

	// FlipSeries: pivot yKey names → x-axis, xKey values → series columns
	const { renderData, seriesKeys } = useMemo(() => {
		if (flipSeries && yKeys.length > 0 && chartData.length > 0) {
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
	}, [flipSeries, yKeys, chartData, xKey]);

	const effectiveXDataKey = flipSeries ? "__yKey__" : xKey;

	// Category tick labels — used by AreaCursor to compute inter-tick spacing for the shadow band.
	// Computed from renderData before x-brush slicing so spacing stays stable during zoom.
	const categoryTicks = useMemo(
		() => renderData.map((r) => String(r[effectiveXDataKey] ?? "")),
		[renderData, effectiveXDataKey],
	);

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
		if (!xBrushActive || renderData.length < 2) return renderData;
		const n = renderData.length;
		const start = Math.floor(xBrushFrac[0] * n);
		const end = Math.ceil(xBrushFrac[1] * n) - 1;
		return renderData.slice(Math.max(0, start), Math.min(n, end + 1));
	}, [xBrushActive, renderData, xBrushFrac]);

	// Compute data y range for Y brush
	const { dataYMin, dataYMax } = useMemo(() => {
		if (!zoomY || !renderData.length || !seriesKeys.length)
			return { dataYMin: 0, dataYMax: 1 };
		let maxVal = 0;
		for (const row of renderData) {
			const rowMax = seriesKeys.reduce(
				(s, sk) => s + Math.max(0, Number(row[sk] ?? 0)),
				0,
			);
			if (rowMax > maxVal) maxVal = rowMax;
		}
		return { dataYMin: 0, dataYMax: maxVal };
	}, [zoomY, renderData, seriesKeys]);

	const yBrushActive = zoomY && (yBrushFrac[0] > 0 || yBrushFrac[1] < 1);
	const yDomain = yBrushActive
		? ([
				dataYMin + yBrushFrac[0] * (dataYMax - dataYMin),
				dataYMin + yBrushFrac[1] * (dataYMax - dataYMin),
			] as [number, number])
		: undefined;

	// Per-series min/max indices
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

	// Trendlines: linear regression per series, stored as _trend_<key> fields.
	// When stacked, regress through the cumulative top-edge values so each
	// trendline tracks the top of its own visual band, not the raw series value.
	const trendDataMap = useMemo<Record<string, number[]> | null>(() => {
		if (
			trendlineType === "none" ||
			!seriesKeys.length ||
			!visibleRenderData.length
		)
			return null;
		const result: Record<string, number[]> = {};
		// running[i] accumulates the stack height at row i across series
		const running = new Array<number>(visibleRenderData.length).fill(0);
		for (const sk of seriesKeys) {
			const vals = visibleRenderData.map((r, i) => {
				const v = Number(r[sk] ?? 0);
				if (!unstacked) {
					running[i] += v;
					return running[i];
				}
				return v;
			});
			const n = vals.length;
			const sumX = (n * (n - 1)) / 2;
			const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
			const sumY = vals.reduce((a, v) => a + v, 0);
			const sumXY = vals.reduce((a, v, i) => a + i * v, 0);
			const denom = n * sumX2 - sumX * sumX;
			const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
			const intercept = (sumY - slope * sumX) / n;
			result[sk] = vals.map((_, i) => slope * i + intercept);
		}
		return result;
	}, [trendlineType, seriesKeys, visibleRenderData, unstacked]);

	// Merge _total and _trend_* into the final chart data in one pass
	const renderDataFinal = useMemo(() => {
		const needsTotal = showTotals;
		const needsTrend = trendDataMap !== null;
		if (!needsTotal && !needsTrend) return visibleRenderData;
		return visibleRenderData.map((row, i) => {
			const extra: Record<string, unknown> = {};
			if (needsTotal) {
				extra._total = seriesKeys.reduce(
					(sum, sk) => sum + (Number(row[sk]) || 0),
					0,
				);
			}
			if (needsTrend) {
				for (const sk of seriesKeys) {
					extra[`_trend_${sk}`] = trendDataMap![sk][i];
				}
			}
			return { ...row, ...extra };
		});
	}, [showTotals, trendDataMap, visibleRenderData, seriesKeys]);

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
					<TrendingUp className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to X-Axis and Y-Axis drop zones
					</p>
				</div>
			</div>
		);
	}

	const colorForSeries = (
		seriesIndex: number,
		row?: Record<string, unknown>,
		seriesKey?: string,
	): string => {
		if (row && seriesKey) {
			for (const rule of colorRules) {
				if (rule.targetColumn && rule.targetColumn !== seriesKey)
					continue;
				if (
					compareColorRule(
						rule.comparator,
						row[rule.valueColumn],
						rule.value,
					)
				)
					return rule.color;
			}
		}
		return palette[seriesIndex % palette.length];
	};

	// Pre-compute per-series average for average lines.
	// Stacked: series i is visually drawn from cumsum(0..i-1) to cumsum(0..i),
	// so its reference line must sit at the cumulative average Σavg(0..i).
	const seriesAvg = useMemo(() => {
		if (!showAverage || !visibleRenderData.length)
			return {} as Record<string, number>;
		const rawAvgs: Record<string, number> = {};
		for (const sk of seriesKeys) {
			rawAvgs[sk] =
				visibleRenderData.reduce((s, r) => s + Number(r[sk] ?? 0), 0) /
				visibleRenderData.length;
		}
		if (unstacked) return rawAvgs;
		// Stacked: build cumulative averages
		const cumAvgs: Record<string, number> = {};
		let running = 0;
		for (const sk of seriesKeys) {
			running += rawAvgs[sk];
			cumAvgs[sk] = running;
		}
		return cumAvgs;
	}, [showAverage, visibleRenderData, seriesKeys, unstacked]);

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
						data={renderDataFinal}
						layout={flipAxis ? "vertical" : "horizontal"}
						margin={{
							top: Math.max(
								showTotals && !flipAxis ? 20 : 4,
								flipAxis && showAverage ? 20 : 4,
								showMinMax ? 24 : 4,
							),
							right: Math.max(
								!flipAxis && showAverage ? 48 : 8,
								flipAxis && showMinMax ? 50 : 8,
								showTotals && flipAxis ? 50 : 8,
							),
							left: yAxisLabel && !flipAxis ? 12 : 0,
							bottom: 4,
						}}
					>
						<defs>
							{seriesKeys.map((_, i) => (
								<linearGradient
									key={i}
									id={`area-grad-${i}`}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor={palette[i % palette.length]}
										stopOpacity={0.15}
									/>
									<stop
										offset="95%"
										stopColor={palette[i % palette.length]}
										stopOpacity={0}
									/>
								</linearGradient>
							))}
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
									domain={yDomain}
									allowDataOverflow={yBrushActive}
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
									type="category"
									padding={{ left: 30, right: 30 }}
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
									label={buildAxisLabelProps(
										xAxisLabel,
										xCfg,
										"x",
									)}
									tickFormatter={(v: unknown) =>
										formatValue(v, xKey, formatRules)
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
									label={buildAxisLabelProps(
										yAxisLabel,
										yCfg,
										"y",
									)}
									tickFormatter={(v: unknown) =>
										formatValue(
											v,
											yKeys[0] ?? "",
											formatRules,
										)
									}
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

						{seriesKeys.map((k, i) => (
							<Area
								key={k}
								type={curveTypeToRecharts(curveType)}
								dataKey={k}
								isAnimationActive={false}
								stackId={unstacked ? undefined : "area"}
								stroke={colorForSeries(i)}
								strokeWidth={lineWidth}
								strokeDasharray={strokeDashFor(s.lineType)}
								fill={`url(#area-grad-${i})`}
								dot={
									symbolType === "none"
										? false
										: (props: any) => {
												const {
													cx,
													cy,
													payload,
													index,
												} = props;
												const fill = colorForSeries(
													i,
													payload as Record<
														string,
														unknown
													>,
													k,
												);
												return (
													<g
														key={`dot-${k}-${index}`}
													>
														{renderChartSymbol(
															symbolType,
															cx,
															cy,
															symbolSize,
															fill,
														)}
													</g>
												);
											}
								}
								activeDot={
									symbolType === "none"
										? false
										: { r: symbolSize + 2, strokeWidth: 0 }
								}
							>
								{valueLabelCfg?.show === true && (
									<LabelList
										dataKey={k}
										position={
											valueLabelCfg.position ?? "top"
										}
										angle={valueLabelCfg.rotate ?? 0}
										style={{
											fontSize:
												valueLabelCfg.fontSize ?? 10,
											fill:
												valueLabelCfg.color ??
												"#64748b",
											fontFamily:
												valueLabelCfg.fontFamily ??
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
													? formatValue(
															value,
															k,
															formatRules,
														)
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
											const cx =
												(x ?? 0) + (width ?? 0) / 2;
											const cy = isMax
												? (y ?? 0)
												: (y ?? 0) + (height ?? 0);
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
														y={
															cy -
															(isMax ? 23 : -9)
														}
														width={badgeW}
														height={14}
														rx={4}
														fill={color}
													/>
													<text
														x={cx}
														y={
															cy -
															(isMax ? 16 : -16)
														}
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
							</Area>
						))}

						{/* Display Total — labels pinned to the top/right margin via TotalLabels */}
						{showTotals && (
							<TotalLabels
								rows={renderDataFinal}
								xDataKey={effectiveXDataKey}
								flipAxis={flipAxis}
								yKey={yKeys[0] ?? ""}
								formatRules={formatRules}
							/>
						)}

						{/* Trendlines — one per series, colored to match */}
						{trendDataMap &&
							trendlineType !== "none" &&
							seriesKeys.map((sk, i) => (
								<Line
									key={`trend-${sk}`}
									type={curveTypeToRecharts(
										trendlineType as Exclude<
											typeof trendlineType,
											"none"
										>,
									)}
									dataKey={`_trend_${sk}`}
									stroke={palette[i % palette.length]}
									strokeWidth={2}
									strokeDasharray="4 4"
									dot={false}
									activeDot={false}
									legendType="none"
									isAnimationActive={false}
								/>
							))}

						{/* Average lines — cumulative position when stacked so each line
                            lands inside its own series' visual band */}
						{showAverage &&
							seriesKeys.map((sk, i) => {
								const avg = seriesAvg[sk];
								if (avg == null) return null;
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

						<AreaCursor
							axisPointerType={axisPointerType}
							flipAxis={flipAxis}
							xTicks={categoryTicks}
							yTicks={categoryTicks}
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
