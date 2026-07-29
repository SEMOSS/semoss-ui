/**
 * PolarBarChart — pure SVG polar bar (rose / wind-rose) chart.
 *
 * Each unique category value in xKey gets a wedge (or set of wedges for
 * multiple series) radiating outward from a center point. Bar length is
 * proportional to the corresponding yKey value.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
	aggregateChartData,
	CHART_COLORS,
	compareColorRule,
} from "@/components/visualizations/shared/chartShared";
import { formatValue } from "@/lib/formatValue";
import type { VisualizationConfig } from "@/types/dashboard";

// ── Geometry helpers ──────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
	// Angle 0 = top (12-o'clock); increases clockwise.
	return {
		x: cx + r * Math.cos(angle - Math.PI / 2),
		y: cy + r * Math.sin(angle - Math.PI / 2),
	};
}

function wedgePath(
	cx: number,
	cy: number,
	innerR: number,
	outerR: number,
	startAngle: number,
	endAngle: number,
): string {
	if (outerR <= innerR) return "";

	const p1 = polarToCartesian(cx, cy, innerR, startAngle);
	const p2 = polarToCartesian(cx, cy, outerR, startAngle);
	const p3 = polarToCartesian(cx, cy, outerR, endAngle);
	const p4 = polarToCartesian(cx, cy, innerR, endAngle);

	const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

	return [
		`M ${p1.x} ${p1.y}`,
		`L ${p2.x} ${p2.y}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 1 ${p3.x} ${p3.y}`,
		`L ${p4.x} ${p4.y}`,
		innerR > 0
			? `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p1.x} ${p1.y}`
			: "",
		"Z",
	]
		.filter(Boolean)
		.join(" ");
}

function formatNum(v: number): string {
	if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
	if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
	return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
}

// ── Layout constants ──────────────────────────────────────────────────────────
const SVG_W = 400;
const SVG_H = 420;
const CX = 200;
const CY = 210;
const MAX_R = 155;
const INNER_R = 15;
const GAP_ANGLE = 0.08;
const LABEL_OFFSET = 14;
const VALUE_OFFSET = 6;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
	data: any[];
	config?: VisualizationConfig;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PolarBarChart({ data, config }: Props) {
	const xKey = config?.xKey ?? "";
	const yKeys: string[] = config?.yKeys ?? [];

	const pbStyling = config?.styling?.polarbar ?? {};
	const showLabels: boolean = pbStyling.showLabels ?? true;
	const showValues: boolean = pbStyling.showValues ?? false;
	const fillOpacity: number = pbStyling.fillOpacity ?? 0.7;
	const showLegend: boolean = pbStyling.showLegend ?? true;
	const showTooltip: boolean = pbStyling.showTooltip ?? true;
	const showMinMax: boolean = pbStyling.showMinMax ?? false;
	// unstacked: true = side-by-side; false/undefined = radially stacked (default)
	const sideBySlide: boolean = pbStyling.unstacked === true;
	const zoom: "none" | "radius" | "angle" = pbStyling.zoom ?? "none";
	const axisPointerType: "shadow" | "line" | "cross" =
		pbStyling.axisPointer ?? "shadow";
	const colorRules = pbStyling.colorRules ?? [];
	const basePalette: string[] =
		config?.styling?.colorPalette?.colors ?? CHART_COLORS;

	const tooltipCols = useMemo(
		() =>
			config?.tooltips?.length
				? config.tooltips
				: config?.tooltip
					? [
							{
								column: config.tooltip,
								aggregation:
									config.tooltipAggregation || "count",
							},
						]
					: [],
		[config],
	);

	// ── Hover state ───────────────────────────────────────────────────────────
	const [hoveredCat, setHoveredCat] = useState<number | null>(null);
	const [mouseClientPos, setMouseClientPos] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [mouseSvgPos, setMouseSvgPos] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const svgRef = useRef<SVGSVGElement>(null);

	// ── Zoom state ────────────────────────────────────────────────────────────
	const [radiusZoomPct, setRadiusZoomPct] = useState(100);
	const [angleStartIdx, setAngleStartIdx] = useState(0);
	const [angleEndIdx, setAngleEndIdx] = useState(0); // 0 treated as N_ALL-1 when unset

	// ── Data aggregation ──────────────────────────────────────────────────────
	const allAggregated = useMemo(() => {
		if (!xKey || !yKeys.length || !data.length) return [];
		return aggregateChartData(data, xKey, yKeys, config) as Record<
			string,
			unknown
		>[];
	}, [data, xKey, yKeys, config]);

	const N_ALL = allAggregated.length;

	const effectiveAngleEnd =
		zoom === "angle" && angleEndIdx > 0
			? Math.min(angleEndIdx, N_ALL - 1)
			: N_ALL - 1;

	const aggregated = useMemo<Record<string, unknown>[]>(() => {
		if (zoom !== "angle" || !allAggregated.length) return allAggregated;
		return allAggregated.slice(angleStartIdx, effectiveAngleEnd + 1);
	}, [zoom, allAggregated, angleStartIdx, effectiveAngleEnd]);

	const N = aggregated.length;
	const sliceAngle = N > 0 ? (2 * Math.PI) / N : 0;
	const categories = useMemo(
		() => aggregated.map((r) => String(r[xKey] ?? "")),
		[aggregated, xKey],
	);

	// ── Max values ────────────────────────────────────────────────────────────
	const maxSingleValue = useMemo(() => {
		let m = 0;
		for (const row of aggregated) {
			for (const k of yKeys) {
				const v = Number(row[k] ?? 0);
				if (v > m) m = v;
			}
		}
		return m || 1;
	}, [aggregated, yKeys]);

	const maxStackTotal = useMemo(() => {
		let m = 0;
		for (const row of aggregated) {
			const total = yKeys.reduce((s, k) => s + Number(row[k] ?? 0), 0);
			if (total > m) m = total;
		}
		return m || 1;
	}, [aggregated, yKeys]);

	const effectiveMax = useMemo(() => {
		const base = sideBySlide ? maxSingleValue : maxStackTotal;
		if (zoom === "radius") return Math.max(1, base * (radiusZoomPct / 100));
		return base;
	}, [sideBySlide, maxSingleValue, maxStackTotal, zoom, radiusZoomPct]);

	// ── Color helper ──────────────────────────────────────────────────────────
	const getColor = useCallback(
		(row: Record<string, unknown>, seriesIdx: number): string => {
			for (const rule of colorRules) {
				const candidate = row[rule.valueColumn] ?? row[xKey];
				if (compareColorRule(rule.comparator, candidate, rule.value))
					return rule.color;
			}
			return basePalette[seriesIdx % basePalette.length];
		},
		[colorRules, basePalette, xKey],
	);

	// ── Mouse handlers ────────────────────────────────────────────────────────
	const handleSvgMouseMove = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			const svgEl = svgRef.current;
			if (!svgEl) return;
			const rect = svgEl.getBoundingClientRect();
			setMouseSvgPos({
				x: ((e.clientX - rect.left) / rect.width) * SVG_W,
				y: ((e.clientY - rect.top) / rect.height) * SVG_H,
			});
			setMouseClientPos({ x: e.clientX, y: e.clientY });
		},
		[],
	);

	const handleSvgMouseLeave = useCallback(() => {
		setHoveredCat(null);
		setMouseClientPos(null);
		setMouseSvgPos(null);
	}, []);

	// ── Min/max ───────────────────────────────────────────────────────────────
	const minMaxData = useMemo(() => {
		if (!showMinMax || !aggregated.length) return null;
		const result: Record<string, { minIdx: number; maxIdx: number }> = {};
		for (const key of yKeys) {
			let minVal = Infinity,
				maxVal = -Infinity,
				minIdx = 0,
				maxIdx = 0;
			aggregated.forEach((row, i) => {
				const v = Number(row[key] ?? 0);
				if (v < minVal) {
					minVal = v;
					minIdx = i;
				}
				if (v > maxVal) {
					maxVal = v;
					maxIdx = i;
				}
			});
			result[key] = { minIdx, maxIdx };
		}
		return result;
	}, [showMinMax, aggregated, yKeys]);

	// ── Empty / unconfigured state ────────────────────────────────────────────
	if (!data.length || !xKey || !yKeys.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<svg
						viewBox="0 0 48 48"
						className="mx-auto mb-3 h-12 w-12 opacity-30"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<circle cx="24" cy="24" r="20" />
						<line x1="24" y1="4" x2="24" y2="24" />
						<line x1="24" y1="24" x2="40.5" y2="34" />
						<line x1="24" y1="24" x2="7.5" y2="34" />
					</svg>
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to Label and Values drop zones
					</p>
				</div>
			</div>
		);
	}

	if (N === 0) return null;

	// ── Axis pointer ──────────────────────────────────────────────────────────
	const renderAxisPointer = () => {
		if (hoveredCat === null) return null;
		const bandStart = hoveredCat * sliceAngle;
		const bandEnd = (hoveredCat + 1) * sliceAngle;

		const elems: React.ReactNode[] = [];

		// Shadow: shown for all pointer types
		const shadowPath = wedgePath(
			CX,
			CY,
			INNER_R,
			MAX_R + 4,
			bandStart,
			bandEnd,
		);
		if (shadowPath) {
			elems.push(
				<path
					key="shadow"
					d={shadowPath}
					fill="#94a3b8"
					fillOpacity={0.12}
					pointerEvents="none"
				/>,
			);
		}

		if (axisPointerType === "line" || axisPointerType === "cross") {
			const p1 = polarToCartesian(CX, CY, INNER_R, bandStart);
			const p2 = polarToCartesian(CX, CY, MAX_R + 4, bandStart);
			const p3 = polarToCartesian(CX, CY, INNER_R, bandEnd);
			const p4 = polarToCartesian(CX, CY, MAX_R + 4, bandEnd);
			elems.push(
				<line
					key="line1"
					x1={p1.x}
					y1={p1.y}
					x2={p2.x}
					y2={p2.y}
					stroke="#64748b"
					strokeWidth={1.5}
					strokeDasharray="4 3"
					pointerEvents="none"
				/>,
				<line
					key="line2"
					x1={p3.x}
					y1={p3.y}
					x2={p4.x}
					y2={p4.y}
					stroke="#64748b"
					strokeWidth={1.5}
					strokeDasharray="4 3"
					pointerEvents="none"
				/>,
			);
		}

		if (axisPointerType === "cross" && mouseSvgPos) {
			const dx = mouseSvgPos.x - CX;
			const dy = mouseSvgPos.y - CY;
			const r = Math.sqrt(dx * dx + dy * dy);
			if (r >= INNER_R && r <= MAX_R + 4) {
				elems.push(
					<circle
						key="arc"
						cx={CX}
						cy={CY}
						r={r}
						fill="none"
						stroke="#64748b"
						strokeWidth={1.5}
						strokeDasharray="4 3"
						pointerEvents="none"
					/>,
				);
			}
		}

		return <g>{elems}</g>;
	};

	// ── Bar rendering ─────────────────────────────────────────────────────────
	const bars: React.ReactNode[] = [];
	aggregated.forEach((row, catIdx) => {
		const baseAngle = catIdx * sliceAngle;
		const usableAngle = sliceAngle - GAP_ANGLE;
		const halfGap = GAP_ANGLE / 2;

		yKeys.forEach((key, seriesIdx) => {
			const value = Number(row[key] ?? 0);
			const color = getColor(row, seriesIdx);

			let innerRadius: number,
				outerRadius: number,
				startAngle: number,
				endAngle: number,
				midAngle: number;

			if (sideBySlide) {
				const seriesSlice = usableAngle / yKeys.length;
				startAngle = baseAngle + halfGap + seriesIdx * seriesSlice;
				endAngle = startAngle + seriesSlice;
				midAngle = (startAngle + endAngle) / 2;
				innerRadius = INNER_R;
				outerRadius =
					value <= 0
						? INNER_R
						: INNER_R +
							Math.min(1, value / effectiveMax) *
								(MAX_R - INNER_R);
			} else {
				// Stacked radially
				startAngle = baseAngle + halfGap;
				endAngle = baseAngle + halfGap + usableAngle;
				midAngle = (startAngle + endAngle) / 2;
				let cumulative = 0;
				for (let i = 0; i < seriesIdx; i++) {
					cumulative += Number(row[yKeys[i]] ?? 0);
				}
				innerRadius =
					INNER_R +
					Math.min(1, cumulative / effectiveMax) * (MAX_R - INNER_R);
				outerRadius =
					INNER_R +
					Math.min(1, (cumulative + value) / effectiveMax) *
						(MAX_R - INNER_R);
			}

			const path = wedgePath(
				CX,
				CY,
				innerRadius,
				Math.max(outerRadius, innerRadius + 0.5),
				startAngle,
				endAngle,
			);

			const valPos = polarToCartesian(
				CX,
				CY,
				outerRadius + VALUE_OFFSET,
				midAngle,
			);

			// Min/Max marker
			const isMin = minMaxData?.[key]?.minIdx === catIdx;
			const isMax = minMaxData?.[key]?.maxIdx === catIdx;
			let minMaxMarker: React.ReactNode = null;
			if ((isMin || isMax) && value > 0 && outerRadius > INNER_R) {
				const tipPos = polarToCartesian(CX, CY, outerRadius, midAngle);
				const badgePos = polarToCartesian(
					CX,
					CY,
					outerRadius + 12,
					midAngle,
				);
				minMaxMarker = (
					<g key="mm" pointerEvents="none">
						<circle
							cx={tipPos.x}
							cy={tipPos.y}
							r={4}
							fill={color}
							stroke="#fff"
							strokeWidth={1}
						/>
						<text
							x={badgePos.x}
							y={badgePos.y}
							fontSize={8}
							fill={color}
							textAnchor="middle"
							dominantBaseline="middle"
							fontWeight="bold"
						>
							{isMax ? "▲" : "▼"}
						</text>
					</g>
				);
			}

			bars.push(
				<g key={`${catIdx}-${seriesIdx}`}>
					{path && (
						<path
							d={path}
							fill={color}
							fillOpacity={fillOpacity}
							stroke="#fff"
							strokeWidth={0.5}
							onMouseEnter={() => setHoveredCat(catIdx)}
						>
							<title>{`${categories[catIdx]} · ${key}: ${value.toLocaleString()}`}</title>
						</path>
					)}
					{showValues && value > 0 && (
						<text
							x={valPos.x}
							y={valPos.y}
							fontSize={8}
							fill={color}
							textAnchor="middle"
							dominantBaseline="middle"
							style={{ pointerEvents: "none" }}
						>
							{formatNum(value)}
						</text>
					)}
					{minMaxMarker}
				</g>,
			);
		});
	});

	// ── Tooltip data ──────────────────────────────────────────────────────────
	const hoveredRow = hoveredCat !== null ? aggregated[hoveredCat] : null;
	const hoveredLabel = hoveredRow ? String(hoveredRow[xKey] ?? "") : "";

	return (
		<div className="flex h-full w-full flex-col items-center">
			<svg
				ref={svgRef}
				viewBox={`0 0 ${SVG_W} ${SVG_H}`}
				className="min-h-0 w-full flex-1"
				preserveAspectRatio={
					config?.styling?.size?.stretch ? "none" : undefined
				}
				aria-label="Polar bar chart"
				onMouseMove={handleSvgMouseMove}
				onMouseLeave={handleSvgMouseLeave}
			>
				{/* ── Grid circles ── */}
				{GRID_LEVELS.map((lvl) => (
					<circle
						key={lvl}
						cx={CX}
						cy={CY}
						r={INNER_R + (MAX_R - INNER_R) * lvl}
						fill="none"
						stroke="#e2e8f0"
						strokeWidth={1}
						strokeDasharray={lvl === 1.0 ? "none" : "3 3"}
					/>
				))}

				{/* ── Grid value labels ── */}
				{GRID_LEVELS.map((lvl) => {
					const r = INNER_R + (MAX_R - INNER_R) * lvl;
					return (
						<text
							key={lvl}
							x={CX + 3}
							y={CY - r + 3}
							fontSize={8}
							fill="#94a3b8"
							textAnchor="start"
							dominantBaseline="hanging"
						>
							{formatNum(effectiveMax * lvl)}
						</text>
					);
				})}

				{/* ── Axis pointer — rendered before bars ── */}
				{renderAxisPointer()}

				{/* ── Bars ── */}
				{bars}

				{/* ── Category labels ── */}
				{showLabels &&
					categories.map((cat, catIdx) => {
						const midAngle = catIdx * sliceAngle + sliceAngle / 2;
						const pos = polarToCartesian(
							CX,
							CY,
							MAX_R + LABEL_OFFSET,
							midAngle,
						);
						const anchor =
							Math.abs(pos.x - CX) < 10
								? "middle"
								: pos.x < CX
									? "end"
									: "start";
						const display =
							cat.length > 14 ? cat.slice(0, 12) + "…" : cat;
						return (
							<text
								key={catIdx}
								x={pos.x}
								y={pos.y}
								fontSize={9}
								fill="#475569"
								textAnchor={anchor}
								dominantBaseline="middle"
								style={{ pointerEvents: "none" }}
							>
								{display}
							</text>
						);
					})}

				{/* ── Center dot ── */}
				<circle cx={CX} cy={CY} r={4} fill="#94a3b8" />

				{/* ── Legend (SVG, inside chart) ── */}
				{showLegend && yKeys.length > 1 && (
					<g transform={`translate(0, ${SVG_H - 28})`}>
						{yKeys.map((key, i) => {
							const legendX =
								CX - ((yKeys.length - 1) * 70) / 2 + i * 70;
							const color = basePalette[i % basePalette.length];
							return (
								<g
									key={key}
									transform={`translate(${legendX}, 0)`}
								>
									<rect
										x={-30}
										y={0}
										width={10}
										height={10}
										fill={color}
										fillOpacity={fillOpacity}
										rx={2}
									/>
									<text
										x={-17}
										y={5}
										fontSize={9}
										fill="#64748b"
										dominantBaseline="middle"
									>
										{key.length > 12
											? key.slice(0, 10) + "…"
											: key}
									</text>
								</g>
							);
						})}
					</g>
				)}
			</svg>

			{/* ── Radius zoom slider ── */}
			{zoom === "radius" && (
				<div className="flex w-full max-w-xs flex-shrink-0 flex-col gap-1 px-4 py-2">
					<div className="flex justify-between text-stone-500 text-xs">
						<span>Radius Zoom</span>
						<span>{radiusZoomPct}%</span>
					</div>
					<input
						type="range"
						min={10}
						max={100}
						step={5}
						value={radiusZoomPct}
						onChange={(e) =>
							setRadiusZoomPct(Number(e.target.value))
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			)}

			{/* ── Angle zoom sliders ── */}
			{zoom === "angle" && N_ALL > 1 && (
				<div className="flex w-full max-w-xs flex-shrink-0 flex-col gap-2 px-4 py-2">
					<div className="flex flex-col gap-1">
						<div className="flex justify-between text-stone-500 text-xs">
							<span>From</span>
							<span className="max-w-[140px] truncate">
								{String(
									allAggregated[angleStartIdx]?.[xKey] ?? "—",
								)}
							</span>
						</div>
						<input
							type="range"
							min={0}
							max={N_ALL - 1}
							value={angleStartIdx}
							onChange={(e) => {
								const v = Number(e.target.value);
								setAngleStartIdx(
									Math.min(v, effectiveAngleEnd),
								);
							}}
							className="w-full accent-indigo-500"
						/>
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex justify-between text-stone-500 text-xs">
							<span>To</span>
							<span className="max-w-[140px] truncate">
								{String(
									allAggregated[effectiveAngleEnd]?.[xKey] ??
										"—",
								)}
							</span>
						</div>
						<input
							type="range"
							min={0}
							max={N_ALL - 1}
							value={effectiveAngleEnd}
							onChange={(e) => {
								const v = Number(e.target.value);
								setAngleEndIdx(Math.max(v, angleStartIdx));
							}}
							className="w-full accent-indigo-500"
						/>
					</div>
				</div>
			)}

			{/* ── Hover tooltip ── */}
			{showTooltip && hoveredRow && mouseClientPos && (
				<div
					style={{
						position: "fixed",
						left: mouseClientPos.x + 14,
						top: mouseClientPos.y - 10,
						zIndex: 9999,
						pointerEvents: "none",
					}}
					className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg"
				>
					<p className="mb-2 max-w-[200px] truncate border-slate-100 border-b pb-2 font-semibold text-slate-700">
						{hoveredLabel}
					</p>
					<div className="space-y-1">
						{yKeys.map((key, i) => {
							const color = basePalette[i % basePalette.length];
							return (
								<div
									key={key}
									className="flex items-center justify-between gap-4"
								>
									<div className="flex items-center gap-1.5">
										<span
											className="h-2 w-2 flex-shrink-0 rounded-full"
											style={{ background: color }}
										/>
										<span className="text-slate-500 text-xs">
											{key}
										</span>
									</div>
									<span className="font-semibold text-slate-900 text-xs tabular-nums">
										{formatValue(
											hoveredRow[key],
											key,
											config?.styling?.formatRules,
										)}
									</span>
								</div>
							);
						})}
					</div>
					{tooltipCols.length > 0 &&
						tooltipCols.some(
							({ column }) =>
								hoveredRow[`_tooltip_${column}`] !== undefined,
						) && (
							<div className="mt-2 space-y-1 border-slate-100 border-t pt-2">
								{tooltipCols.map(({ column, aggregation }) => {
									const val =
										hoveredRow[`_tooltip_${column}`];
									if (val === undefined) return null;
									return (
										<div
											key={column}
											className="flex items-center justify-between gap-4"
										>
											<span className="text-slate-500 text-xs capitalize">
												{aggregation} of {column}:
											</span>
											<span className="font-semibold text-slate-700 text-xs tabular-nums">
												{formatValue(
													val,
													column,
													config?.styling
														?.formatRules,
												)}
											</span>
										</div>
									);
								})}
							</div>
						)}
				</div>
			)}
		</div>
	);
}
