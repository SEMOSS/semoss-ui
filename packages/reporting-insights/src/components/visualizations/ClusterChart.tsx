/**
 * ClusterChart — pure SVG jitter-plot / strip-plot / dot-plot.
 * Props: data (array of row objects), config (VisualizationConfig).
 *
 * Config fields used:
 *   config.xKey        — category column (groups the dots)
 *   config.yKeys       — numeric value column(s); multiple = multi-series
 *   config.styling?.cluster — ClusterStyling options
 */
import type { VisualizationConfig } from "@/types/dashboard";

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

// ── Component ─────────────────────────────────────────────────────────────────

interface ClusterChartProps {
	data: any[];
	config?: VisualizationConfig;
}

const SVG_W = 500;
const SVG_H = 350;
const PAD_TOP = 20;
const PAD_BOTTOM = 60;
const PAD_LEFT = 60;
const PAD_RIGHT = 20;
const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_H - PAD_TOP - PAD_BOTTOM;
const GRID_LINES = 5;
const JITTER_WIDTH = 60; // max total horizontal spread per cluster

/** Format a Y-axis tick value compactly. */
function fmtY(v: number): string {
	if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
	if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
	return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
}

export function ClusterChart({ data, config }: ClusterChartProps) {
	const xKey = config?.xKey ?? "";
	const yKeys: string[] =
		config?.yKeys && config.yKeys.length > 0 ? config.yKeys : [];

	const clusterStyling = (config?.styling as any)?.cluster ?? {};
	const dotRadius: number =
		typeof clusterStyling.dotRadius === "number"
			? clusterStyling.dotRadius
			: 5;
	const showMean: boolean = clusterStyling.showMean === true;
	const fillOpacity: number =
		typeof clusterStyling.fillOpacity === "number"
			? clusterStyling.fillOpacity
			: 0.7;

	// ── Unconfigured / no data states ──────────────────────────────────────────
	if (!xKey || yKeys.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				Configure a Category column and a Values column to render the
				cluster chart.
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

	// ── Build point list per series ────────────────────────────────────────────
	interface Point {
		category: string;
		value: number;
		seriesIdx: number;
	}

	const points: Point[] = [];
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		for (let si = 0; si < yKeys.length; si++) {
			const val = Number(row[yKeys[si]]);
			if (!isNaN(val)) {
				points.push({ category: cat, value: val, seriesIdx: si });
			}
		}
	}

	if (points.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No numeric values in the selected column(s).
			</div>
		);
	}

	// ── Unique categories (order of first appearance) ──────────────────────────
	const categoriesSet = new Set<string>();
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		categoriesSet.add(cat);
	}
	const categories = Array.from(categoriesSet);
	const n = categories.length;

	// ── Y scale ───────────────────────────────────────────────────────────────
	const allValues = points.map((p) => p.value);
	const rawMin = Math.min(...allValues);
	const rawMax = Math.max(...allValues);
	const valueRange = rawMax - rawMin || 1;
	const yMin = rawMin - valueRange * 0.08;
	const yMax = rawMax + valueRange * 0.08;
	const yRange = yMax - yMin;

	const toY = (v: number) =>
		PAD_TOP + CHART_H - ((v - yMin) / yRange) * CHART_H;

	// ── X layout ──────────────────────────────────────────────────────────────
	const catIdx = new Map(categories.map((c, i) => [c, i]));
	const catX = (i: number) => PAD_LEFT + (i + 0.5) * (CHART_W / n);

	// ── Jitter: deterministic horizontal offset within each cluster ───────────
	// Group points by (category × series) for jitter computation
	const groupKey = (p: Point) => `${p.category}__${p.seriesIdx}`;
	const grouped = new Map<string, Point[]>();
	for (const p of points) {
		const k = groupKey(p);
		if (!grouped.has(k)) grouped.set(k, []);
		grouped.get(k)!.push(p);
	}

	// Number of series
	const numSeries = yKeys.length;

	// For multi-series, offset cluster centers slightly to separate them
	const seriesOffset = (si: number) => {
		if (numSeries <= 1) return 0;
		const totalSpread = Math.min(JITTER_WIDTH * 0.6, 30);
		const step = totalSpread / (numSeries - 1);
		return -totalSpread / 2 + si * step;
	};

	interface PlottedPoint extends Point {
		px: number;
		py: number;
	}

	const plottedPoints: PlottedPoint[] = [];
	for (const [k, group] of grouped.entries()) {
		const [cat, siStr] = k.split("__");
		const si = Number(siStr);
		const ci = catIdx.get(cat) ?? 0;
		const centerX = catX(ci) + seriesOffset(si);

		// Sort values and spread them deterministically
		const sorted = [...group].sort((a, b) => a.value - b.value);
		const N = Math.min(sorted.length, 20);
		const spacing =
			sorted.length > 1 ? Math.min(JITTER_WIDTH / sorted.length, 8) : 0;

		sorted.forEach((p, idx) => {
			const offset =
				sorted.length > 1
					? (idx - (sorted.length - 1) / 2) * spacing
					: 0;
			const clampedOffset = Math.max(
				-JITTER_WIDTH / 2,
				Math.min(JITTER_WIDTH / 2, offset),
			);
			plottedPoints.push({
				...p,
				px: centerX + clampedOffset,
				py: toY(p.value),
			});
		});

		void N; // used in spread formula comment above
	}

	// ── Per-category count ────────────────────────────────────────────────────
	const categoryCounts = new Map<string, number>();
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
	}

	// ── Optional mean lines ───────────────────────────────────────────────────
	interface MeanInfo {
		ci: number;
		si: number;
		mean: number;
	}
	const means: MeanInfo[] = [];
	if (showMean) {
		for (const [k, group] of grouped.entries()) {
			const [cat, siStr] = k.split("__");
			const si = Number(siStr);
			const ci = catIdx.get(cat) ?? 0;
			const mean = group.reduce((s, p) => s + p.value, 0) / group.length;
			means.push({ ci, si, mean });
		}
	}

	// ── Grid line values ──────────────────────────────────────────────────────
	const gridVals = Array.from(
		{ length: GRID_LINES + 1 },
		(_, i) => yMin + (i / GRID_LINES) * yRange,
	);

	// ── Mean line width ───────────────────────────────────────────────────────
	const meanHalfW = Math.min(20, (CHART_W / n) * 0.3);

	return (
		<svg
			viewBox={`0 0 ${SVG_W} ${SVG_H}`}
			className="h-full w-full"
			style={{ display: "block" }}
			aria-label="Cluster chart"
		>
			{/* Y grid lines + Y axis labels */}
			{gridVals.map((v, i) => {
				const y = toY(v);
				return (
					<g key={i}>
						<line
							x1={PAD_LEFT}
							x2={PAD_LEFT + CHART_W}
							y1={y}
							y2={y}
							stroke="#e2e8f0"
							strokeWidth={1}
						/>
						<text
							x={PAD_LEFT - 4}
							y={y}
							textAnchor="end"
							dominantBaseline="middle"
							fontSize={9}
							fill="#94a3b8"
						>
							{fmtY(v)}
						</text>
					</g>
				);
			})}

			{/* X axis baseline */}
			<line
				x1={PAD_LEFT}
				x2={PAD_LEFT + CHART_W}
				y1={PAD_TOP + CHART_H}
				y2={PAD_TOP + CHART_H}
				stroke="#cbd5e1"
				strokeWidth={1}
			/>

			{/* Dots */}
			{plottedPoints.map((p, i) => {
				const color =
					numSeries > 1
						? PALETTE[p.seriesIdx % PALETTE.length]
						: PALETTE[catIdx.get(p.category)! % PALETTE.length];
				return (
					<circle
						key={i}
						cx={p.px}
						cy={p.py}
						r={dotRadius}
						fill={color}
						fillOpacity={fillOpacity}
						stroke={color}
						strokeWidth={0.5}
						strokeOpacity={Math.min(fillOpacity + 0.2, 1)}
					/>
				);
			})}

			{/* Optional mean lines */}
			{means.map((m, i) => {
				const cx = catX(m.ci) + seriesOffset(m.si);
				const my = toY(m.mean);
				const color =
					numSeries > 1
						? PALETTE[m.si % PALETTE.length]
						: PALETTE[m.ci % PALETTE.length];
				return (
					<line
						key={i}
						x1={cx - meanHalfW}
						x2={cx + meanHalfW}
						y1={my}
						y2={my}
						stroke={color}
						strokeWidth={2.5}
						strokeOpacity={0.9}
					/>
				);
			})}

			{/* X axis category labels + count */}
			{categories.map((cat, i) => {
				const cx = catX(i);
				const label = cat.length > 14 ? cat.slice(0, 13) + "…" : cat;
				const count = categoryCounts.get(cat) ?? 0;
				return (
					<g key={cat}>
						<text
							x={cx}
							y={PAD_TOP + CHART_H + 14}
							textAnchor="middle"
							fontSize={10}
							fill="#475569"
						>
							{label}
						</text>
						<text
							x={cx}
							y={PAD_TOP + CHART_H + 26}
							textAnchor="middle"
							fontSize={8}
							fill="#94a3b8"
						>
							n={count}
						</text>
					</g>
				);
			})}

			{/* Multi-series legend */}
			{numSeries > 1 && (
				<g>
					{yKeys.map((key, si) => {
						const legendX = PAD_LEFT + si * 100;
						const legendY = SVG_H - 8;
						const color = PALETTE[si % PALETTE.length];
						if (legendX + 90 > SVG_W - PAD_RIGHT) return null;
						return (
							<g key={si}>
								<circle
									cx={legendX}
									cy={legendY}
									r={4}
									fill={color}
									fillOpacity={fillOpacity}
								/>
								<text
									x={legendX + 8}
									y={legendY}
									dominantBaseline="middle"
									fontSize={8}
									fill="#64748b"
								>
									{key.length > 10
										? key.slice(0, 9) + "…"
										: key}
								</text>
							</g>
						);
					})}
				</g>
			)}
		</svg>
	);
}
