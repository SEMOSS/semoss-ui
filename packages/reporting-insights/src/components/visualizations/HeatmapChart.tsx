import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHART_COLORS } from "@/components/visualizations/shared/chartShared";
import { formatValue } from "@/lib/formatValue";
import type {
	ColorPalette as ColorPaletteType,
	FormatRule,
	HeatmapStyling,
	VisualizationConfig,
} from "@/types/dashboard";

function contrastText(hex: string): string {
	try {
		const h = hex.replace("#", "");
		const r = parseInt(h.slice(0, 2), 16);
		const g = parseInt(h.slice(2, 4), 16);
		const b = parseInt(h.slice(4, 6), 16);
		return (r * 299 + g * 587 + b * 114) / 1000 > 140
			? "#1e293b"
			: "#f1f5f9";
	} catch {
		return "#1e293b";
	}
}

// Horizontal range brush (same pattern as Bar_Chart.tsx)
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

// Vertical range brush
function YAxisBrush({
	value,
	onChange,
	onCommit,
	marginTop = 8,
	marginBottom = 4,
}: {
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
					title="Max"
					onPointerDown={onPointerDown("max")}
					style={traveller("max")}
				/>
				<div
					title="Min"
					onPointerDown={onPointerDown("min")}
					style={traveller("min")}
				/>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

const LABEL_W = 90;
const LABEL_H = 52;
const CELL_H = 36;
const MIN_CELL_W = 28;
const MIN_CELL_H = 24;

interface TooltipState {
	cellKey: string;
	x: string;
	y: string;
	clientX: number;
	clientY: number;
}

interface Props {
	data: any[];
	config?: VisualizationConfig;
	formatRules?: FormatRule[];
	onStylingChange?: (updates: Partial<HeatmapStyling>) => void;
	onTrigger?: (
		payload: import("@/types/dashboard").VizTriggerPayload,
	) => void;
}

export function HeatmapChart({
	data,
	config = {},
	formatRules = [],
	onStylingChange,
	onTrigger,
}: Props) {
	const xKey = config.xKey ?? "";
	const yKey = config.heatmapYKey ?? "";
	// Heat is the required value column; fall back to yKeys[0] for legacy saved configs
	const valueKey = config.heatKey || config.yKeys?.[0] || "";
	const facetColumn = config.facetColumn ?? "";
	const tooltipCols = config.tooltips ?? [];

	const heatStyling = config.styling?.heatmap ?? {};
	const palette = useMemo(() => {
		const cp = config.styling?.colorPalette as ColorPaletteType | undefined;
		return cp?.colors?.length ? cp.colors : CHART_COLORS;
	}, [config.styling?.colorPalette]);

	const zoomXEnabled = heatStyling.zoomX === true;
	const zoomYEnabled = heatStyling.zoomY === true;

	// Container size for expand / fit
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setContainerSize({ w: width, h: height });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Facet pagination
	const [facetPage, setFacetPage] = useState(0);
	useEffect(() => {
		setFacetPage(0);
	}, [facetColumn]);

	// Zoom brush
	const [xBrushFrac, setXBrushFrac] = useState<[number, number]>(
		() => heatStyling.savedZoomX ?? [0, 1],
	);
	const [yBrushFrac, setYBrushFrac] = useState<[number, number]>(
		() => heatStyling.savedZoomY ?? [0, 1],
	);

	// Hover tooltip
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const [heatLegendHover, setHeatLegendHover] = useState<{
		x: number;
		y: number;
		value: number;
		color: string;
	} | null>(null);

	// Facet groups
	const facetGroups = useMemo<string[]>(() => {
		if (!facetColumn || !data.length) return [""];
		return [
			...new Set(data.map((r) => String(r[facetColumn] ?? ""))),
		] as string[];
	}, [data, facetColumn]);

	const currentPage = Math.min(
		facetPage,
		Math.max(0, facetGroups.length - 1),
	);
	const activeGroup = facetGroups[currentPage] ?? "";

	const activeData = useMemo(() => {
		if (!facetColumn || !activeGroup) return data;
		return data.filter((r) => String(r[facetColumn] ?? "") === activeGroup);
	}, [data, facetColumn, activeGroup]);

	// Core data maps
	const { allXCats, allYCats, valueMap } = useMemo(() => {
		if (!xKey || !yKey || !valueKey || !activeData.length) {
			return {
				allXCats: [] as string[],
				allYCats: [] as string[],
				valueMap: {} as Record<string, number>,
			};
		}

		const xs = [
			...new Set(activeData.map((r) => String(r[xKey] ?? ""))),
		] as string[];
		const ys = [
			...new Set(activeData.map((r) => String(r[yKey] ?? ""))),
		] as string[];

		// Aggregate the heat/value column per (x, y) pair
		const aggType = config.columnAggregations?.[valueKey] ?? "avg";
		const groups: Record<string, number[]> = {};
		activeData.forEach((r) => {
			const k = `${r[xKey]}||${r[yKey]}`;
			if (!groups[k]) groups[k] = [];
			const v = Number(r[valueKey]);
			if (!Number.isNaN(v)) groups[k].push(v);
		});
		const vm: Record<string, number> = {};
		for (const [k, vals] of Object.entries(groups)) {
			if (!vals.length) continue;
			if (aggType === "sum") vm[k] = vals.reduce((a, b) => a + b, 0);
			else if (aggType === "max") vm[k] = Math.max(...vals);
			else if (aggType === "min") vm[k] = Math.min(...vals);
			else if (aggType === "count") vm[k] = vals.length;
			else vm[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
		}

		return { allXCats: xs, allYCats: ys, valueMap: vm };
	}, [activeData, xKey, yKey, valueKey, config.columnAggregations]);

	// Tooltip extra columns data
	const tooltipDataMap = useMemo<
		Record<string, Record<string, unknown>>
	>(() => {
		if (!tooltipCols.length || !xKey || !yKey) return {};
		const groups: Record<string, Record<string, (number | string)[]>> = {};
		activeData.forEach((r) => {
			const k = `${r[xKey]}||${r[yKey]}`;
			if (!groups[k]) groups[k] = {};
			tooltipCols.forEach(({ column }) => {
				if (!groups[k][column]) groups[k][column] = [];
				groups[k][column].push(r[column] as number | string);
			});
		});
		const result: Record<string, Record<string, unknown>> = {};
		for (const [k, cols] of Object.entries(groups)) {
			result[k] = {};
			for (const { column, aggregation } of tooltipCols) {
				const vals = cols[column] ?? [];
				const numVals = vals.map(Number).filter(Number.isFinite);
				const agg = aggregation || "avg";
				if (numVals.length > 0) {
					if (agg === "sum")
						result[k][column] = numVals.reduce((a, b) => a + b, 0);
					else if (agg === "max")
						result[k][column] = Math.max(...numVals);
					else if (agg === "min")
						result[k][column] = Math.min(...numVals);
					else if (agg === "count") result[k][column] = vals.length;
					else
						result[k][column] =
							numVals.reduce((a, b) => a + b, 0) / numVals.length;
				} else {
					result[k][column] = vals[vals.length - 1] ?? "";
				}
			}
		}
		return result;
	}, [activeData, xKey, yKey, tooltipCols]);

	// Bucket: top-N xCats by value sum
	const bucketedXCats = useMemo(() => {
		const n = heatStyling.bucket;
		if (!n || allXCats.length <= n) return allXCats;
		const sums = allXCats.map((x) => ({
			x,
			sum: allYCats.reduce(
				(acc, y) => acc + (valueMap[`${x}||${y}`] ?? 0),
				0,
			),
		}));
		sums.sort((a, b) => b.sum - a.sum);
		return [...sums.slice(0, n).map((s) => s.x), "Other"];
	}, [allXCats, allYCats, valueMap, heatStyling.bucket]);

	// Merge "Other" bucket into valueMap
	const effectiveValueMap = useMemo<Record<string, number>>(() => {
		if (!heatStyling.bucket || allXCats.length <= heatStyling.bucket)
			return valueMap;
		const topSet = new Set(bucketedXCats.slice(0, -1));
		const otherMap: Record<string, number> = {};
		for (const [k, v] of Object.entries(valueMap)) {
			const sep = k.indexOf("||");
			const x = k.slice(0, sep);
			const y = k.slice(sep + 2);
			if (!topSet.has(x))
				otherMap[`Other||${y}`] = (otherMap[`Other||${y}`] ?? 0) + v;
		}
		return { ...valueMap, ...otherMap };
	}, [valueMap, bucketedXCats, heatStyling.bucket, allXCats.length]);

	// Apply zoom
	const xCats = useMemo(() => {
		if (!zoomXEnabled) return bucketedXCats;
		const n = bucketedXCats.length;
		return bucketedXCats.slice(
			Math.floor(xBrushFrac[0] * n),
			Math.ceil(xBrushFrac[1] * n),
		);
	}, [bucketedXCats, xBrushFrac, zoomXEnabled]);

	const yCats = useMemo(() => {
		if (!zoomYEnabled) return allYCats;
		const n = allYCats.length;
		return allYCats.slice(
			Math.floor(yBrushFrac[0] * n),
			Math.ceil(yBrushFrac[1] * n),
		);
	}, [allYCats, yBrushFrac, zoomYEnabled]);

	// Heat range and color scale
	const { minVal, maxVal } = useMemo(() => {
		const vals = Object.values(effectiveValueMap).filter((v): v is number =>
			Number.isFinite(v as number),
		);
		if (!vals.length) return { minVal: 0, maxVal: 1 };
		let mn = Math.min(...vals);
		let mx = Math.max(...vals);
		if (heatStyling.heatMinEnabled && heatStyling.heatMin !== undefined)
			mn = heatStyling.heatMin;
		if (heatStyling.heatMaxEnabled && heatStyling.heatMax !== undefined)
			mx = heatStyling.heatMax;
		return { minVal: mn, maxVal: mx };
	}, [
		effectiveValueMap,
		heatStyling.heatMinEnabled,
		heatStyling.heatMin,
		heatStyling.heatMaxEnabled,
		heatStyling.heatMax,
	]);

	const getColor = (x: string, y: string): string => {
		const val = effectiveValueMap[`${x}||${y}`];
		if (val === undefined) return "#f1f5f9";
		const range = maxVal - minVal;
		const t =
			range === 0
				? 0.5
				: Math.max(0, Math.min(1, (val - minVal) / range));
		return (
			palette[Math.round(t * (palette.length - 1))] ??
			palette[0] ??
			"#4f46e5"
		);
	};

	// Axis / label config
	const xAxisCfg = heatStyling.xAxisConfig ?? {};
	const yAxisCfg = heatStyling.yAxisConfig ?? {};
	const valueLabelCfg = heatStyling.valueLabel ?? {};
	const expand = heatStyling.expand !== false; // default on
	const fitH = heatStyling.fitHorizontal === true;
	const fitV = heatStyling.fitVertical === true;
	const showXLabels = xAxisCfg.showLabels !== false;
	const showYLabels = yAxisCfg.showLabels !== false;
	const xRotate = xAxisCfg.rotateValues ?? 0;
	const hasFacetPages = facetColumn && facetGroups.length > 1;
	const effectiveLabelH = LABEL_H + (xAxisCfg.axisGap ?? 0);
	const effectiveLabelW = LABEL_W + (yAxisCfg.axisGap ?? 0);

	// Dynamic cell sizing
	const cellW = useMemo<number | undefined>(() => {
		if ((expand || fitH) && containerSize.w > 0 && xCats.length > 0) {
			return Math.max(
				MIN_CELL_W,
				(containerSize.w - effectiveLabelW - (zoomYEnabled ? 24 : 0)) /
					xCats.length,
			);
		}
		return undefined;
	}, [
		expand,
		fitH,
		containerSize.w,
		xCats.length,
		zoomYEnabled,
		effectiveLabelW,
	]);

	const cellH = useMemo<number>(() => {
		if ((expand || fitV) && containerSize.h > 0 && yCats.length > 0) {
			// 28px reserved for the heat legend bar always rendered below the grid
			const reservedH =
				effectiveLabelH +
				(zoomXEnabled ? 30 : 0) +
				(hasFacetPages ? 36 : 0) +
				28 +
				12;
			return Math.max(
				MIN_CELL_H,
				(containerSize.h - reservedH) / yCats.length,
			);
		}
		return CELL_H;
	}, [
		expand,
		fitV,
		containerSize.h,
		yCats.length,
		zoomXEnabled,
		hasFacetPages,
		effectiveLabelH,
	]);

	const gridCols =
		cellW !== undefined
			? `${effectiveLabelW}px repeat(${xCats.length}, ${cellW}px)`
			: `${effectiveLabelW}px repeat(${xCats.length}, minmax(32px, 1fr))`;

	const handleHeatBarMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const norm = Math.max(
			0,
			Math.min(1, (e.clientX - rect.left) / rect.width),
		);
		const value = minVal + norm * (maxVal - minVal);
		const color =
			palette[Math.round(norm * (palette.length - 1))] ??
			palette[0] ??
			"#4f46e5";
		setHeatLegendHover({ x: e.clientX, y: e.clientY, value, color });
	};

	// Early exit
	if (!xKey || !yKey || !valueKey) {
		return (
			<div className="flex h-full items-center justify-center px-8 text-center text-slate-400 text-sm">
				Set X axis, Y axis, and Value columns to render the heatmap
			</div>
		);
	}
	if (!data.length) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden p-1.5"
		>
			{/* X axis title */}
			{xAxisCfg.title && (
				<div
					className="flex-shrink-0 font-semibold text-[11px] text-slate-500"
					style={{
						textAlign:
							xAxisCfg.titleAlign === "start"
								? "left"
								: xAxisCfg.titleAlign === "end"
									? "right"
									: "center",
						marginBottom: xAxisCfg.titleOffset ?? 0,
					}}
				>
					{xAxisCfg.title}
				</div>
			)}

			{/* Facet label */}
			{hasFacetPages && (
				<div className="flex-shrink-0 text-center font-semibold text-[11px] text-slate-500">
					{facetColumn}: {activeGroup}
				</div>
			)}

			{/* Grid row: [Y title?] + [scrollable grid] + [Y zoom slider?] */}
			<div className="flex min-h-0 flex-1 flex-row gap-1">
				{yAxisCfg.title && (
					<div
						className="flex flex-shrink-0 items-center font-semibold text-[11px] text-slate-500"
						style={{
							writingMode: "vertical-rl",
							transform: "rotate(180deg)",
							marginRight: yAxisCfg.titleOffset ?? 0,
						}}
					>
						{yAxisCfg.title}
					</div>
				)}

				<div
					className={`${expand || fitH ? "overflow-hidden" : "overflow-auto"} min-w-0 flex-1`}
				>
					<div
						className="inline-grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200"
						style={{
							gridTemplateColumns: gridCols,
							minWidth:
								cellW !== undefined
									? undefined
									: effectiveLabelW + xCats.length * 40,
						}}
					>
						{/* Top-left corner */}
						<div
							className="bg-slate-50"
							style={{
								height: showXLabels ? effectiveLabelH : 8,
							}}
						/>

						{/* X-axis headers */}
						{xCats.map((x) => (
							<div
								key={x}
								className="flex items-end justify-center overflow-hidden bg-slate-50 px-1 pb-1.5"
								style={{
									height: showXLabels ? effectiveLabelH : 8,
								}}
							>
								{showXLabels && (
									<span
										className="break-words text-center leading-tight"
										style={{
											maxWidth: 56,
											display: "block",
											fontSize: xAxisCfg.fontSize
												? `${xAxisCfg.fontSize}px`
												: "10px",
											fontWeight: 600,
											color: "#64748b",
											transform: xRotate
												? `rotate(${xRotate}deg)`
												: undefined,
											transformOrigin: "center bottom",
										}}
									>
										{formatValue(x, xKey, formatRules)}
									</span>
								)}
							</div>
						))}

						{/* Rows */}
						{yCats.map((y) => (
							<>
								<div
									key={`lbl-${y}`}
									className="flex items-center justify-end bg-slate-50 pr-2.5"
									style={{ height: cellH }}
								>
									{showYLabels && (
										<span
											className="truncate"
											style={{
												maxWidth: effectiveLabelW - 12,
												fontSize: yAxisCfg.fontSize
													? `${yAxisCfg.fontSize}px`
													: "10px",
												fontWeight: 600,
												color: "#64748b",
											}}
										>
											{formatValue(y, yKey, formatRules)}
										</span>
									)}
								</div>

								{xCats.map((x) => {
									const bg = getColor(x, y);
									const cellKey = `${x}||${y}`;
									const val = effectiveValueMap[cellKey];
									const showLabel =
										valueLabelCfg.show === true &&
										val !== undefined;
									return (
										<div
											key={cellKey}
											className="flex cursor-default items-center justify-center overflow-hidden transition-opacity hover:opacity-75"
											style={{
												background: bg,
												height: cellH,
											}}
											onMouseEnter={(e) => {
												setTooltip({
													cellKey,
													x,
													y,
													clientX: e.clientX,
													clientY: e.clientY,
												});
												onTrigger?.({
													trigger: "hover",
													label: x,
													row: {
														[xKey]: x,
														[yKey]: y,
														[valueKey]: val,
													},
												});
											}}
											onMouseMove={(e) =>
												setTooltip((prev) =>
													prev
														? {
																...prev,
																clientX:
																	e.clientX,
																clientY:
																	e.clientY,
															}
														: null,
												)
											}
											onMouseLeave={() => {
												setTooltip(null);
												onTrigger?.({
													trigger: "mouseout",
													label: x,
													row: {
														[xKey]: x,
														[yKey]: y,
														[valueKey]: val,
													},
												});
											}}
											onClick={() =>
												onTrigger?.({
													trigger: "click",
													label: x,
													row: {
														[xKey]: x,
														[yKey]: y,
														[valueKey]: val,
													},
												})
											}
											onDoubleClick={() =>
												onTrigger?.({
													trigger: "dblclick",
													label: x,
													row: {
														[xKey]: x,
														[yKey]: y,
														[valueKey]: val,
													},
												})
											}
										>
											{showLabel && (
												<span
													className="select-none"
													style={{
														fontSize:
															valueLabelCfg.fontSize
																? `${valueLabelCfg.fontSize}px`
																: "9px",
														fontWeight:
															valueLabelCfg.fontWeight ===
															"semibold"
																? 600
																: valueLabelCfg.fontWeight ===
																		"medium"
																	? 500
																	: valueLabelCfg.fontWeight ===
																			"bold"
																		? 700
																		: 700,
														color: !valueLabelCfg.color
															? contrastText(bg)
															: valueLabelCfg.color,
														maxWidth: cellW
															? cellW - 4
															: 48,
														overflow: "hidden",
														whiteSpace: "nowrap",
														textOverflow:
															"ellipsis",
														display: "block",
													}}
												>
													{formatValue(
														val,
														valueKey,
														formatRules,
													)}
												</span>
											)}
										</div>
									);
								})}
							</>
						))}
					</div>
				</div>

				{/* Y zoom slider */}
				{zoomYEnabled && (
					<YAxisBrush
						value={yBrushFrac}
						onChange={setYBrushFrac}
						onCommit={(v) => onStylingChange?.({ savedZoomY: v })}
						marginTop={showXLabels ? effectiveLabelH + 4 : 12}
						marginBottom={4}
					/>
				)}
			</div>

			{/* X zoom slider */}
			{zoomXEnabled && (
				<XAxisBrush
					value={xBrushFrac}
					onChange={setXBrushFrac}
					onCommit={(v) => onStylingChange?.({ savedZoomX: v })}
					marginLeft={effectiveLabelW}
					marginRight={zoomYEnabled ? 24 : 0}
				/>
			)}

			{/* Heat legend bar */}
			<div className="flex flex-shrink-0 items-center gap-2 px-1 text-slate-500 text-xs">
				<span className="font-medium text-slate-600">Low</span>
				<div
					className="h-2.5 flex-1 cursor-crosshair rounded"
					style={{
						background: `linear-gradient(to right, ${palette.join(",")})`,
					}}
					onMouseMove={handleHeatBarMove}
					onMouseLeave={() => setHeatLegendHover(null)}
				/>
				<span className="font-medium text-slate-600">High</span>
			</div>

			{/* Facet pagination */}
			{hasFacetPages && (
				<div className="flex flex-shrink-0 items-center justify-center gap-2">
					<button
						type="button"
						disabled={currentPage <= 0}
						onClick={() => setFacetPage((p) => Math.max(0, p - 1))}
						className="rounded p-1 text-slate-500 hover:text-slate-700 disabled:opacity-40"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
					<span className="text-slate-500 text-xs">
						{currentPage + 1} / {facetGroups.length}
					</span>
					<button
						type="button"
						disabled={currentPage >= facetGroups.length - 1}
						onClick={() =>
							setFacetPage((p) =>
								Math.min(facetGroups.length - 1, p + 1),
							)
						}
						className="rounded p-1 text-slate-500 hover:text-slate-700 disabled:opacity-40"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Cell hover tooltip — single tooltip with color swatch */}
			{tooltip && (
				<div
					className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-lg"
					style={{
						left: tooltip.clientX + 12,
						top: tooltip.clientY + 12,
					}}
				>
					<div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
						<span
							className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
							style={{
								background: getColor(tooltip.x, tooltip.y),
							}}
						/>
						<span className="truncate">
							{tooltip.x} / {tooltip.y}
						</span>
					</div>
					<div className="text-slate-600">
						{valueKey}:{" "}
						{effectiveValueMap[tooltip.cellKey] !== undefined
							? formatValue(
									effectiveValueMap[tooltip.cellKey],
									valueKey,
									formatRules,
								)
							: "N/A"}
					</div>
					{tooltipCols.map(({ column }) => (
						<div key={column} className="text-slate-600">
							{column}:{" "}
							{tooltipDataMap[tooltip.cellKey]?.[column] !==
							undefined
								? formatValue(
										tooltipDataMap[tooltip.cellKey][
											column
										] as number | string,
										column,
										formatRules,
									)
								: "N/A"}
						</div>
					))}
				</div>
			)}

			{/* Heat legend hover tooltip */}
			{heatLegendHover &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[9999] min-w-[120px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg"
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
								valueKey,
								formatRules,
							)}
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
