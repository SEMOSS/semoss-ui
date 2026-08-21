/**
 * HalfDonutChart — pure SVG half donut (semicircle donut) chart.
 *
 * Renders a 180° arc from left (π) to right (2π), distributing each category
 * as a proportional percentage slice. Optionally overlays a target wedge marker.
 *
 * Data model:
 *   - xKey      → label column (one slice per unique value)
 *   - yKeys[0]  → numeric value column (determines slice size)
 *   - targetKey → optional numeric goal column (renders a wedge marker)
 *   - tooltips  → extra columns to show in hover tooltip
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { formatValue } from "@/lib/formatValue";
import type { VisualizationConfig } from "@/types/dashboard";

// ── Fallback palette ───────────────────────────────────────────────────────────
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

// ── Geometry helpers ──────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, a: number) {
	return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
	cx: number,
	cy: number,
	innerR: number,
	outerR: number,
	startAngle: number,
	endAngle: number,
): string {
	if (outerR <= 0) return "";
	const sweep = endAngle - startAngle;
	const largeArc = sweep > Math.PI ? 1 : 0;
	const o1 = polarToCartesian(cx, cy, outerR, startAngle);
	const o2 = polarToCartesian(cx, cy, outerR, endAngle);
	const i1 = polarToCartesian(cx, cy, innerR, endAngle);
	const i2 = polarToCartesian(cx, cy, innerR, startAngle);
	if (innerR <= 0) {
		return [
			`M ${cx} ${cy}`,
			`L ${o1.x} ${o1.y}`,
			`A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
			"Z",
		].join(" ");
	}
	return [
		`M ${o1.x} ${o1.y}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
		`L ${i1.x} ${i1.y}`,
		`A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
		"Z",
	].join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
	data: any[];
	config?: VisualizationConfig;
}

// ── Slice type ────────────────────────────────────────────────────────────────
interface Slice {
	cat: string;
	value: number;
	fraction: number;
	start: number;
	end: number;
	color: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function HalfDonutChart({ data, config }: Props) {
	const xKey = config?.xKey ?? "";
	const yKey = config?.yKeys?.[0] ?? "";
	const targetKey = config?.targetKey ?? "";
	const tooltipCols = config?.tooltips ?? [];

	// Styling options
	const hd = (config?.styling as any)?.halfdonut ?? {};
	const showLabels: boolean = hd.showLabels ?? true;
	const showValues: boolean = hd.showValues ?? false;
	const showPercentage: boolean = hd.showPercentage !== false;
	const showLegend: boolean = hd.showLegend ?? true;
	const showTooltip: boolean = hd.showTooltip !== false;
	const innerRadiusFraction: number = Math.min(
		0.8,
		Math.max(0.3, hd.innerRadius ?? 0.55),
	);

	// Color palette — prefer shared palette from styling, fall back to PALETTE
	const palette: string[] = (config?.styling as any)?.colorPalette?.colors
		?.length
		? (config!.styling as any).colorPalette.colors
		: PALETTE;

	// Hover state
	const [hovered, setHovered] = useState<{
		x: number;
		y: number;
		slice: Slice;
	} | null>(null);
	const [targetHovered, setTargetHovered] = useState<{
		x: number;
		y: number;
	} | null>(null);

	// ── Empty / unconfigured state ────────────────────────────────────────────
	if (!data.length || !xKey || !yKey) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<svg
						viewBox="0 0 48 28"
						className="mx-auto mb-3 h-10 w-16 opacity-30"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<path d="M 4 24 A 20 20 0 0 1 44 24" />
						<path d="M 12 24 A 12 12 0 0 1 36 24" />
						<line x1="4" y1="24" x2="12" y2="24" />
						<line x1="36" y1="24" x2="44" y2="24" />
					</svg>
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to Label and Value drop zones
					</p>
				</div>
			</div>
		);
	}

	// ── Aggregate data by xKey, respecting configured aggregation ─────────────
	const valueAggType = config?.columnAggregations?.[yKey] ?? "sum";
	const catSum = new Map<string, number>();
	const catCount = new Map<string, number>();
	const catMin = new Map<string, number>();
	const catMax = new Map<string, number>();
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		const v = Number(row[yKey]);
		if (!isNaN(v)) {
			catSum.set(cat, (catSum.get(cat) ?? 0) + v);
			catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
			catMin.set(cat, Math.min(catMin.get(cat) ?? Infinity, v));
			catMax.set(cat, Math.max(catMax.get(cat) ?? -Infinity, v));
		}
	}

	const categories = Array.from(catSum.keys());
	const values = categories.map((c) => {
		const sum = catSum.get(c) ?? 0;
		const count = catCount.get(c) ?? 0;
		switch (valueAggType) {
			case "avg":
				return count > 0 ? sum / count : 0;
			case "count":
				return count;
			case "min":
				return catMin.get(c) ?? 0;
			case "max":
				return catMax.get(c) ?? 0;
			default:
				return sum;
		}
	});
	const total = values.reduce((a, b) => a + b, 0);

	if (total === 0 || categories.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data to display
			</div>
		);
	}

	// ── Aggregate target value ────────────────────────────────────────────────
	let targetValue: number | null = null;
	if (targetKey) {
		let tSum = 0,
			tCount = 0,
			tMin = Infinity,
			tMax = -Infinity;
		for (const row of data) {
			const v = Number(row[targetKey]);
			if (!isNaN(v)) {
				tSum += v;
				tCount++;
				tMin = Math.min(tMin, v);
				tMax = Math.max(tMax, v);
			}
		}
		const tAgg = config?.columnAggregations?.[targetKey] ?? "sum";
		switch (tAgg) {
			case "avg":
				targetValue = tCount > 0 ? tSum / tCount : 0;
				break;
			case "count":
				targetValue = tCount;
				break;
			case "min":
				targetValue = tMin === Infinity ? 0 : tMin;
				break;
			case "max":
				targetValue = tMax === -Infinity ? 0 : tMax;
				break;
			default:
				targetValue = tSum;
		}
	}

	// ── Aggregate tooltip extra columns per category (respecting each column's agg type) ──
	type ColAcc = { sum: number; count: number; min: number; max: number };
	const catTooltipAggs = new Map<string, Record<string, ColAcc>>();
	if (tooltipCols.length) {
		for (const row of data) {
			const cat = String(row[xKey] ?? "");
			if (!catTooltipAggs.has(cat)) catTooltipAggs.set(cat, {});
			const acc = catTooltipAggs.get(cat)!;
			for (const t of tooltipCols) {
				const col = (t as any).column;
				const v = Number(row[col]);
				if (!isNaN(v)) {
					if (!acc[col])
						acc[col] = {
							sum: 0,
							count: 0,
							min: Infinity,
							max: -Infinity,
						};
					acc[col].sum += v;
					acc[col].count += 1;
					acc[col].min = Math.min(acc[col].min, v);
					acc[col].max = Math.max(acc[col].max, v);
				}
			}
		}
	}

	const resolveAgg = (acc: ColAcc, aggType: string): number => {
		switch (aggType) {
			case "avg":
				return acc.count > 0 ? acc.sum / acc.count : 0;
			case "count":
				return acc.count;
			case "min":
				return acc.min === Infinity ? 0 : acc.min;
			case "max":
				return acc.max === -Infinity ? 0 : acc.max;
			default:
				return acc.sum;
		}
	};

	const aggLabel = (aggType: string, col: string) => {
		const prefix: Record<string, string> = {
			avg: "Avg of",
			sum: "Sum of",
			count: "Count of",
			min: "Min of",
			max: "Max of",
		};
		return `${prefix[aggType] ?? aggType} ${col}`;
	};

	// ── Layout constants ──────────────────────────────────────────────────────
	const SVG_W = 400;
	const SVG_H = showLegend ? 240 : 210;
	const CX = 200;
	const CY = 205;
	const OUTER_R = 160;
	const INNER_R = OUTER_R * innerRadiusFraction;
	const LABEL_OFFSET = 14;
	const MIN_SLICE_ANGLE = (5 * Math.PI) / 180;
	const START_ANGLE = Math.PI;
	const TOTAL_ARC = Math.PI;

	// ── Compute slices ────────────────────────────────────────────────────────
	let cursor = START_ANGLE;
	const slices: Slice[] = categories.map((cat, i) => {
		const fraction = values[i] / total;
		const sweep = fraction * TOTAL_ARC;
		const start = cursor;
		const end = cursor + sweep;
		cursor = end;
		return {
			cat,
			value: values[i],
			fraction,
			start,
			end,
			color: palette[i % palette.length],
		};
	});

	// ── Target wedge angle ────────────────────────────────────────────────────
	const targetAngle =
		targetValue !== null && total > 0
			? Math.min(2 * Math.PI, Math.PI + (targetValue / total) * Math.PI)
			: null;

	const fmtRules = config?.styling?.formatRules ?? [];

	return (
		<div className="flex h-full w-full flex-col items-center">
			<svg
				viewBox={`0 0 ${SVG_W} ${SVG_H}`}
				className="min-h-0 w-full flex-1"
				preserveAspectRatio={
					config?.styling?.size?.stretch ? "none" : undefined
				}
				aria-label="Half donut chart"
				onMouseLeave={() => {
					setHovered(null);
					setTargetHovered(null);
				}}
			>
				{/* ── Arcs ── */}
				{slices.map((s) => {
					const path = arcPath(
						CX,
						CY,
						INNER_R,
						OUTER_R,
						s.start,
						s.end,
					);
					return (
						<path
							key={s.cat}
							d={path}
							fill={s.color}
							stroke="#fff"
							strokeWidth={1.5}
							style={{
								cursor: showTooltip ? "pointer" : "default",
							}}
							onMouseMove={(e) =>
								showTooltip &&
								setHovered({
									x: e.clientX,
									y: e.clientY,
									slice: s,
								})
							}
							onMouseLeave={() => setHovered(null)}
						/>
					);
				})}

				{/* ── Target wedge marker ── */}
				{targetAngle !== null && (
					<path
						d={arcPath(
							CX,
							CY,
							INNER_R - 4,
							OUTER_R + 4,
							targetAngle - 0.035,
							targetAngle + 0.035,
						)}
						fill={hd.targetWedgeColor ?? "#1e293b"}
						stroke="#fff"
						strokeWidth={1}
						style={{ cursor: "pointer" }}
						onMouseMove={(e) =>
							setTargetHovered({ x: e.clientX, y: e.clientY })
						}
						onMouseLeave={() => setTargetHovered(null)}
					/>
				)}

				{/* ── Flat baseline ── */}
				<line
					x1={CX - OUTER_R}
					y1={CY}
					x2={CX + OUTER_R}
					y2={CY}
					stroke="#e2e8f0"
					strokeWidth={1}
				/>

				{/* ── Category labels (outside arcs) ── */}
				{showLabels &&
					slices.map((s) => {
						const sweep = s.end - s.start;
						if (sweep < MIN_SLICE_ANGLE) return null;
						const midAngle = (s.start + s.end) / 2;
						const pos = polarToCartesian(
							CX,
							CY,
							OUTER_R + LABEL_OFFSET,
							midAngle,
						);
						const dx = pos.x - CX;
						const anchor =
							Math.abs(dx) < 10
								? "middle"
								: dx < 0
									? "end"
									: "start";
						const formatted = formatValue(s.cat, xKey, fmtRules);
						const display =
							formatted.length > 14
								? formatted.slice(0, 12) + "…"
								: formatted;
						return (
							<text
								key={`lbl-${s.cat}`}
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

				{/* ── Labels inside arcs (% or raw value) ── */}
				{showValues &&
					slices.map((s) => {
						const sweep = s.end - s.start;
						if (sweep < MIN_SLICE_ANGLE) return null;
						const midAngle = (s.start + s.end) / 2;
						const labelR = (INNER_R + OUTER_R) / 2;
						const pos = polarToCartesian(CX, CY, labelR, midAngle);
						const label = showPercentage
							? `${(s.fraction * 100).toFixed(1)}%`
							: formatValue(s.value, yKey, fmtRules);
						return (
							<text
								key={`val-${s.cat}`}
								x={pos.x}
								y={pos.y}
								fontSize={9}
								fill="#fff"
								fontWeight="600"
								textAnchor="middle"
								dominantBaseline="middle"
								style={{ pointerEvents: "none" }}
							>
								{label}
							</text>
						);
					})}

				{/* ── Legend ── */}
				{showLegend && (
					<g>
						{(() => {
							const itemWidth = 80;
							const itemsPerRow = Math.floor(SVG_W / itemWidth);
							const rows: Slice[][] = [];
							for (let i = 0; i < slices.length; i += itemsPerRow)
								rows.push(slices.slice(i, i + itemsPerRow));
							const legendY = CY + 18;
							return rows.map((row, rowIdx) => (
								<g
									key={rowIdx}
									transform={`translate(0, ${legendY + rowIdx * 16})`}
								>
									{row.map((s, colIdx) => {
										const totalWidth =
											row.length * itemWidth;
										const startX =
											(SVG_W - totalWidth) / 2 +
											colIdx * itemWidth;
										const formatted = formatValue(
											s.cat,
											xKey,
											fmtRules,
										);
										const display =
											formatted.length > 10
												? formatted.slice(0, 8) + "…"
												: formatted;
										return (
											<g
												key={s.cat}
												transform={`translate(${startX}, 0)`}
											>
												<rect
													x={0}
													y={0}
													width={10}
													height={10}
													fill={s.color}
													rx={2}
												/>
												<text
													x={14}
													y={5}
													fontSize={9}
													fill="#64748b"
													dominantBaseline="middle"
												>
													{display}
												</text>
											</g>
										);
									})}
								</g>
							));
						})()}
					</g>
				)}
			</svg>

			{/* ── Slice hover tooltip ── */}
			{showTooltip &&
				hovered &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[9999] min-w-[140px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg"
						style={{ top: hovered.y + 12, left: hovered.x + 12 }}
					>
						<div className="mb-1 flex items-center gap-1.5">
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
								style={{ background: hovered.slice.color }}
							/>
							<p className="truncate font-semibold text-stone-800">
								{hovered.slice.cat}
							</p>
						</div>
						<p className="text-stone-500">
							{formatValue(hovered.slice.value, yKey, fmtRules)}
						</p>
						<p className="text-stone-400">
							{(hovered.slice.fraction * 100).toFixed(1)}% of
							total
						</p>
						{tooltipCols.map((t: any) => {
							const acc = catTooltipAggs.get(hovered.slice.cat)?.[
								t.column
							];
							if (!acc) return null;
							const v = resolveAgg(acc, t.aggregation ?? "sum");
							return (
								<p
									key={t.column}
									className="mt-0.5 text-stone-500"
								>
									<span className="text-stone-400">
										{aggLabel(
											t.aggregation ?? "sum",
											t.column,
										)}
										:{" "}
									</span>
									{formatValue(v, t.column, fmtRules)}
								</p>
							);
						})}
					</div>,
					document.body,
				)}

			{/* ── Target wedge tooltip ── */}
			{targetHovered &&
				targetValue !== null &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[9999] min-w-[140px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg"
						style={{
							top: targetHovered.y + 12,
							left: targetHovered.x + 12,
						}}
					>
						<div className="mb-1 flex items-center gap-1.5">
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
								style={{
									background:
										hd.targetWedgeColor ?? "#1e293b",
								}}
							/>
							<p className="font-semibold text-stone-800">
								{aggLabel(
									config?.columnAggregations?.[targetKey] ??
										"sum",
									targetKey,
								)}
							</p>
						</div>
						<p className="text-stone-500">
							{formatValue(targetValue, targetKey, fmtRules)}
						</p>
						<p className="text-stone-400">
							{((targetValue / total) * 100).toFixed(1)}% of total
						</p>
					</div>,
					document.body,
				)}
		</div>
	);
}
