/**
 * BoxPlotChart — Recharts-based box-and-whisker chart.
 *
 * Config fields used:
 *   config.xKey               — category column (one box per unique value)
 *   config.yKeys[0]           — numeric value column (the distribution to analyse)
 *   config.styling?.boxplot   — BoxPlotStyling options
 *   config.styling?.colorPalette — color palette
 */

import { useMemo, useRef, useState } from "react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	ResponsiveContainer,
	Tooltip,
	usePlotArea,
	XAxis,
	YAxis,
	ZIndexLayer,
} from "recharts";
import {
	AXIS_STYLE,
	buildAxisLabelProps,
	CHART_COLORS,
	compareColorRule,
	GRID_STYLE,
} from "@/components/visualizations/shared/chartShared";
import { formatValue } from "@/lib/formatValue";
import type {
	ColorPalette as ColorPaletteType,
	ColorRule,
	FormatRule,
	VisualizationConfig,
	VizTriggerPayload,
} from "@/types/dashboard";

// ── Stats helpers ──────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0;
	if (sorted.length === 1) return sorted[0];
	const idx = (p / 100) * (sorted.length - 1);
	const lo = Math.floor(idx);
	const hi = Math.ceil(idx);
	if (lo === hi) return sorted[lo];
	return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

interface BoxStats {
	count: number;
	min: number;
	q1: number;
	median: number;
	q3: number;
	max: number;
	whiskerLow: number;
	whiskerHigh: number;
	outliers: number[];
}

function computeBoxStats(
	values: number[],
	whiskerType: "minmax" | "iqr",
): BoxStats {
	const sorted = [...values].sort((a, b) => a - b);
	const count = sorted.length;
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	const q1 = percentile(sorted, 25);
	const median = percentile(sorted, 50);
	const q3 = percentile(sorted, 75);

	if (whiskerType === "minmax") {
		return {
			count,
			min,
			q1,
			median,
			q3,
			max,
			whiskerLow: min,
			whiskerHigh: max,
			outliers: [],
		};
	}

	const iqr = q3 - q1;
	const lowerFence = q1 - 1.5 * iqr;
	const upperFence = q3 + 1.5 * iqr;
	const whiskerLow = sorted.find((v) => v >= lowerFence) ?? min;
	const whiskerHigh =
		[...sorted].reverse().find((v) => v <= upperFence) ?? max;
	const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
	return {
		count,
		min,
		q1,
		median,
		q3,
		max,
		whiskerLow,
		whiskerHigh,
		outliers,
	};
}

const CAP_HALF = 6;

// ── Brush components (mirrors Bar_Chart pattern) ───────────────────────────────

function YAxisBrush({
	dataYMin,
	dataYMax,
	value,
	onChange,
	marginTop = 4,
	marginBottom = 4,
}: {
	dataYMin: number;
	dataYMax: number;
	value: [number, number];
	onChange: (v: [number, number]) => void;
	marginTop?: number;
	marginBottom?: number;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const drag = useRef<{
		handle: "min" | "max";
		startY: number;
		startVal: [number, number];
	} | null>(null);

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

function XAxisBrush({
	value,
	onChange,
	marginLeft = 0,
	marginRight = 0,
}: {
	value: [number, number];
	onChange: (v: [number, number]) => void;
	marginLeft?: number;
	marginRight?: number;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const drag = useRef<{
		handle: "left" | "right";
		startX: number;
		startVal: [number, number];
	} | null>(null);

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

// ── Box datum type ─────────────────────────────────────────────────────────────

interface BoxDatum extends BoxStats {
	category: string;
	color: string;
	_placeholder: number;
}

// ── BoxPlotShapes ──────────────────────────────────────────────────────────────
//
// Recharts scale hooks (useXAxisScale / useYAxisScale) return plot-area-relative
// coordinates (range starts at 0). plotArea.x / plotArea.y give the absolute SVG
// offset of the plot area. We compute all positions manually using plotArea so
// boxes are anchored correctly over their category labels.

interface BoxPlotShapesProps {
	data: BoxDatum[];
	fillOpacity: number;
	showOutliers: boolean;
	flipAxis: boolean;
	/** Numeric axis domain min — must match the YAxis (or XAxis when flipped) domain. */
	valueDomainMin: number;
	/** Numeric axis domain max. */
	valueDomainMax: number;
}

function BoxPlotShapes({
	data,
	fillOpacity,
	showOutliers,
	flipAxis,
	valueDomainMin,
	valueDomainMax,
}: BoxPlotShapesProps) {
	const plotArea = usePlotArea();
	if (!plotArea || !data.length) return null;

	const { x: px, y: py, width: pw, height: ph } = plotArea;
	const n = data.length;
	const domainSpan = valueDomainMax - valueDomainMin || 1;

	// Convert a data value to its absolute SVG position on the numeric axis.
	// clamp keeps drawn elements inside the visible plot area when the brush clips the domain.
	const clamp = (v: number, lo: number, hi: number) =>
		Math.max(lo, Math.min(hi, v));

	const toAbsY = (v: number): number => {
		const frac = (v - valueDomainMin) / domainSpan;
		return clamp(py + ph - frac * ph, py, py + ph);
	};

	const toAbsX = (v: number): number => {
		const frac = (v - valueDomainMin) / domainSpan;
		return clamp(px + frac * pw, px, px + pw);
	};

	const shapes = data.map((d, i) => {
		const color = d.color;

		if (flipAxis) {
			// layout="vertical": categories on Y (equal-height slots), values on X
			const slotH = ph / n;
			const cy = py + (i + 0.5) * slotH;
			const boxHalf = Math.min(16, slotH * 0.35);

			const xWLow = toAbsX(d.whiskerLow);
			const xQ1 = toAbsX(d.q1);
			const xMedian = toAbsX(d.median);
			const xQ3 = toAbsX(d.q3);
			const xWHigh = toAbsX(d.whiskerHigh);

			return (
				<g key={d.category}>
					<line
						x1={xWLow}
						y1={cy}
						x2={xQ1}
						y2={cy}
						stroke={color}
						strokeWidth={1.5}
						strokeDasharray="3 2"
					/>
					<line
						x1={xWLow}
						y1={cy - CAP_HALF}
						x2={xWLow}
						y2={cy + CAP_HALF}
						stroke={color}
						strokeWidth={1.5}
					/>
					<rect
						x={xQ1}
						y={cy - boxHalf}
						width={Math.max(1, xQ3 - xQ1)}
						height={boxHalf * 2}
						fill={color}
						fillOpacity={fillOpacity}
						stroke={color}
						strokeWidth={1.5}
						rx={2}
					/>
					<line
						x1={xMedian}
						y1={cy - boxHalf}
						x2={xMedian}
						y2={cy + boxHalf}
						stroke={color}
						strokeWidth={2.5}
					/>
					<line
						x1={xQ3}
						y1={cy}
						x2={xWHigh}
						y2={cy}
						stroke={color}
						strokeWidth={1.5}
						strokeDasharray="3 2"
					/>
					<line
						x1={xWHigh}
						y1={cy - CAP_HALF}
						x2={xWHigh}
						y2={cy + CAP_HALF}
						stroke={color}
						strokeWidth={1.5}
					/>
					{showOutliers &&
						d.outliers.map((ov, oi) => (
							<circle
								key={oi}
								cx={toAbsX(ov)}
								cy={cy}
								r={3}
								fill="none"
								stroke={color}
								strokeWidth={1.5}
							/>
						))}
				</g>
			);
		} else {
			// layout="horizontal": categories on X (equal-width slots), values on Y
			const slotW = pw / n;
			const cx = px + (i + 0.5) * slotW;
			const boxHalf = Math.min(24, slotW * 0.4);

			const yWLow = toAbsY(d.whiskerLow);
			const yQ1 = toAbsY(d.q1);
			const yMedian = toAbsY(d.median);
			const yQ3 = toAbsY(d.q3);
			const yWHigh = toAbsY(d.whiskerHigh);

			return (
				<g key={d.category}>
					{/* Lower whisker stem: Q1 → whiskerLow */}
					<line
						x1={cx}
						y1={yQ1}
						x2={cx}
						y2={yWLow}
						stroke={color}
						strokeWidth={1.5}
						strokeDasharray="3 2"
					/>
					<line
						x1={cx - CAP_HALF}
						y1={yWLow}
						x2={cx + CAP_HALF}
						y2={yWLow}
						stroke={color}
						strokeWidth={1.5}
					/>
					{/* Box: Q1 to Q3 */}
					<rect
						x={cx - boxHalf}
						y={yQ3}
						width={boxHalf * 2}
						height={Math.max(1, yQ1 - yQ3)}
						fill={color}
						fillOpacity={fillOpacity}
						stroke={color}
						strokeWidth={1.5}
						rx={2}
					/>
					{/* Median */}
					<line
						x1={cx - boxHalf}
						y1={yMedian}
						x2={cx + boxHalf}
						y2={yMedian}
						stroke={color}
						strokeWidth={2.5}
					/>
					{/* Upper whisker stem: Q3 → whiskerHigh */}
					<line
						x1={cx}
						y1={yQ3}
						x2={cx}
						y2={yWHigh}
						stroke={color}
						strokeWidth={1.5}
						strokeDasharray="3 2"
					/>
					<line
						x1={cx - CAP_HALF}
						y1={yWHigh}
						x2={cx + CAP_HALF}
						y2={yWHigh}
						stroke={color}
						strokeWidth={1.5}
					/>
					{showOutliers &&
						d.outliers.map((ov, oi) => (
							<circle
								key={oi}
								cx={cx}
								cy={toAbsY(ov)}
								r={3}
								fill="none"
								stroke={color}
								strokeWidth={1.5}
							/>
						))}
				</g>
			);
		}
	});

	return (
		<ZIndexLayer zIndex={300}>
			<g>{shapes}</g>
		</ZIndexLayer>
	);
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

function BoxTooltip({ active, payload, formatRules, yKey }: any) {
	if (!active || !payload?.length) return null;
	const d: BoxDatum = payload[0]?.payload;
	if (!d) return null;
	return (
		<div className="min-w-[140px] rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-lg">
			<div className="mb-2 border-stone-100 border-b pb-1.5 font-semibold text-stone-800">
				{d.category}
			</div>
			<div className="space-y-1 text-stone-600">
				<div className="flex justify-between gap-4">
					<span>Max</span>
					<span className="font-medium text-stone-800">
						{formatValue(d.max, yKey, formatRules ?? [])}
					</span>
				</div>
				<div className="flex justify-between gap-4">
					<span>Q3 (75%)</span>
					<span className="font-medium text-stone-800">
						{formatValue(d.q3, yKey, formatRules ?? [])}
					</span>
				</div>
				<div className="flex justify-between gap-4">
					<span>Median</span>
					<span className="font-medium text-stone-800">
						{formatValue(d.median, yKey, formatRules ?? [])}
					</span>
				</div>
				<div className="flex justify-between gap-4">
					<span>Q1 (25%)</span>
					<span className="font-medium text-stone-800">
						{formatValue(d.q1, yKey, formatRules ?? [])}
					</span>
				</div>
				<div className="flex justify-between gap-4">
					<span>Min</span>
					<span className="font-medium text-stone-800">
						{formatValue(d.min, yKey, formatRules ?? [])}
					</span>
				</div>
				<div className="flex justify-between gap-4 border-stone-100 border-t pt-1">
					<span>Count</span>
					<span className="font-medium text-stone-800">
						{d.count}
					</span>
				</div>
				{d.outliers.length > 0 && (
					<div className="flex justify-between gap-4">
						<span>Outliers</span>
						<span className="font-medium text-stone-800">
							{d.outliers.length}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

// ── Component ──────────────────────────────────────────────────────────────────

interface BoxPlotChartProps {
	data: any[];
	config?: VisualizationConfig;
	formatRules?: FormatRule[];
	onTrigger?: (payload: VizTriggerPayload) => void;
}

export function BoxPlotChart({
	data,
	config,
	formatRules = [],
	onTrigger,
}: BoxPlotChartProps) {
	const xKey = config?.xKey ?? "";
	const yKeys = config?.yKeys ?? [];
	const yKey = yKeys[0] ?? "";
	const bpStyling = config?.styling?.boxplot ?? {};

	const showOutliers = bpStyling.showOutliers !== false;
	const whiskerType: "minmax" | "iqr" =
		bpStyling.whiskerType === "minmax" ? "minmax" : "iqr";
	const fillOpacity =
		typeof bpStyling.fillOpacity === "number" ? bpStyling.fillOpacity : 0.6;
	const flipAxis = bpStyling.flipAxis === true;
	const showTooltip = bpStyling.showTooltip !== false;
	const zoomX = bpStyling.zoomX === true;
	const zoomY = bpStyling.zoomY === true;
	const colorRules = useMemo<ColorRule[]>(
		() => bpStyling.colorRules ?? [],
		[bpStyling.colorRules],
	);
	const xCfg = bpStyling.xAxisConfig ?? {};
	const yCfg = bpStyling.yAxisConfig ?? {};

	const lastHoveredLabelRef = useRef<string | null>(null);

	// Resolve color palette
	const palette = useMemo(() => {
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config?.styling?.colorPalette]);

	// Compute box stats per category
	const allBoxData = useMemo<BoxDatum[]>(() => {
		if (!xKey || !yKey || !data.length) return [];
		const grouped = new Map<string, number[]>();
		for (const row of data) {
			const cat = String(row[xKey] ?? "");
			const val = Number(row[yKey]);
			if (!Number.isNaN(val)) {
				if (!grouped.has(cat)) grouped.set(cat, []);
				grouped.get(cat)?.push(val);
			}
		}
		return Array.from(grouped.entries()).map(([category, values], i) => {
			const stats = computeBoxStats(values, whiskerType);
			let color = palette[i % palette.length];
			for (const rule of colorRules) {
				const vc = rule.valueColumn;
				// xKey column → compare the category label string
				if (vc === xKey) {
					if (
						compareColorRule(rule.comparator, category, rule.value)
					) {
						color = rule.color;
						break;
					}
					continue;
				}
				// Any y-axis column → compare the median of its distribution
				// Named stat shortcuts also accepted
				const statValue =
					yKeys.includes(vc) || vc === "median"
						? stats.median
						: vc === "q1"
							? stats.q1
							: vc === "q3"
								? stats.q3
								: vc === "min"
									? stats.min
									: vc === "max"
										? stats.max
										: vc === "count"
											? stats.count
											: undefined;
				if (
					statValue !== undefined &&
					compareColorRule(rule.comparator, statValue, rule.value)
				) {
					color = rule.color;
					break;
				}
			}
			return { category, color, _placeholder: 0, ...stats };
		});
	}, [data, xKey, yKey, yKeys, whiskerType, palette, colorRules]);

	// X brush state
	const [xBrushFrac, setXBrushFrac] = useState<[number, number]>([0, 1]);
	// Y brush state
	const [yBrushFrac, setYBrushFrac] = useState<[number, number]>([0, 1]);

	// Filter visible data by X brush
	const visibleData = useMemo(() => {
		if (!zoomX || allBoxData.length < 2) return allBoxData;
		const n = allBoxData.length;
		const start = Math.floor(xBrushFrac[0] * n);
		const end = Math.ceil(xBrushFrac[1] * n);
		return allBoxData.slice(Math.max(0, start), Math.min(n, end));
	}, [allBoxData, zoomX, xBrushFrac]);

	// Compute full Y data range (outliers included when shown)
	const { dataYMin, dataYMax } = useMemo(() => {
		if (!visibleData.length) return { dataYMin: 0, dataYMax: 1 };
		let lo = Infinity,
			hi = -Infinity;
		for (const d of visibleData) {
			lo = Math.min(lo, d.whiskerLow);
			hi = Math.max(hi, d.whiskerHigh);
			if (showOutliers && d.outliers.length) {
				lo = Math.min(lo, ...d.outliers);
				hi = Math.max(hi, ...d.outliers);
			}
		}
		const pad = (hi - lo) * 0.1 || 1;
		return { dataYMin: lo - pad, dataYMax: hi + pad };
	}, [visibleData, showOutliers]);

	const yBrushActive = zoomY && (yBrushFrac[0] > 0 || yBrushFrac[1] < 1);
	const yDomain: [number, number] = yBrushActive
		? [
				dataYMin + yBrushFrac[0] * (dataYMax - dataYMin),
				dataYMin + yBrushFrac[1] * (dataYMax - dataYMin),
			]
		: [dataYMin, dataYMax];

	// Axis labels from AxisConfig, falling back to key name
	const xAxisLabel = xCfg.title || (xKey ? xKey : undefined);
	const yAxisLabel = yCfg.title || (yKey ? yKey : undefined);

	// Empty / unconfigured states
	if (!xKey || !yKey) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				Configure a Category (X-Axis) and Values (Y-Axis) column to
				render the box plot.
			</div>
		);
	}
	if (!data.length || !visibleData.length) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data
			</div>
		);
	}

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
						data={visibleData}
						layout={flipAxis ? "vertical" : "horizontal"}
						margin={{
							top: 8,
							right: 8,
							left: yAxisLabel && !flipAxis ? 12 : 0,
							bottom: xAxisLabel && !flipAxis ? 16 : 4,
						}}
						onClick={(e: any) => {
							if (e?.activeLabel != null)
								onTrigger?.({
									trigger: "click",
									label: String(e.activeLabel),
									row: { [xKey]: String(e.activeLabel) },
								});
						}}
						onDoubleClick={() => {
							const label = lastHoveredLabelRef.current;
							if (label != null)
								onTrigger?.({
									trigger: "dblclick",
									label,
									row: { [xKey]: label },
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
								onTrigger?.({
									trigger: "hover",
									label,
									row: { [xKey]: label },
								});
							}
						}}
						onMouseLeave={() => {
							if (lastHoveredLabelRef.current !== null) {
								lastHoveredLabelRef.current = null;
								onTrigger?.({ trigger: "mouseout" });
							}
						}}
					>
						<CartesianGrid
							{...GRID_STYLE}
							horizontal={!flipAxis}
							vertical={flipAxis}
						/>

						{flipAxis ? (
							<>
								{/* Flipped: value axis is X, category axis is Y */}
								<XAxis
									type="number"
									domain={yDomain}
									allowDataOverflow={yBrushActive}
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
									label={buildAxisLabelProps(
										yAxisLabel,
										yCfg,
										"x",
									)}
									tickFormatter={(v: unknown) =>
										formatValue(
											v,
											yKeys[0] ?? "",
											formatRules,
										)
									}
								/>
								<YAxis
									dataKey="category"
									type="category"
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
									tickLine={false}
									width={80}
									label={buildAxisLabelProps(
										xAxisLabel,
										xCfg,
										"y",
									)}
									tickFormatter={(v: unknown) =>
										formatValue(v, xKey, formatRules)
									}
								/>
							</>
						) : (
							<>
								{/* Normal: category axis is X, value axis is Y */}
								<XAxis
									dataKey="category"
									type="category"
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
									type="number"
									domain={yDomain}
									allowDataOverflow={yBrushActive}
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

						{showTooltip && (
							<Tooltip
								content={(props: any) => (
									<BoxTooltip
										{...props}
										formatRules={formatRules}
										yKey={yKey}
									/>
								)}
								cursor={false}
							/>
						)}

						{/* Invisible bar — registers category bands and enables tooltip hit areas */}
						<Bar
							dataKey="_placeholder"
							fill="transparent"
							stroke="none"
							isAnimationActive={false}
							legendType="none"
						/>

						<BoxPlotShapes
							data={visibleData}
							fillOpacity={fillOpacity}
							showOutliers={showOutliers}
							flipAxis={flipAxis}
							valueDomainMin={yDomain[0]}
							valueDomainMax={yDomain[1]}
						/>
					</ComposedChart>
				</ResponsiveContainer>

				{zoomY && (
					<YAxisBrush
						dataYMin={dataYMin}
						dataYMax={dataYMax}
						value={yBrushFrac}
						onChange={setYBrushFrac}
						marginTop={36}
						marginBottom={4}
					/>
				)}
			</div>

			{zoomX && (
				<XAxisBrush
					value={xBrushFrac}
					onChange={setXBrushFrac}
					marginLeft={48}
					marginRight={8 + (zoomY ? 24 : 0)}
				/>
			)}
		</div>
	);
}
