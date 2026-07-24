/**
 * BoxPlotChart — pure SVG box-and-whisker chart.
 * Props: data (array of row objects), config (VisualizationConfig).
 *
 * Config fields used:
 *   config.xKey        — category column (one box per unique value)
 *   config.yKeys[0]    — numeric value column (the distribution to analyse)
 *   config.styling?.boxplot — BoxPlotStyling options
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

// ── Stats helpers ─────────────────────────────────────────────────────────────

/** Return the percentile value from a sorted array (linear interpolation). */
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
	category: string;
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
): Omit<BoxStats, "category" | "count"> {
	const sorted = [...values].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	const q1 = percentile(sorted, 25);
	const median = percentile(sorted, 50);
	const q3 = percentile(sorted, 75);

	if (whiskerType === "minmax") {
		return {
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

	// IQR mode
	const iqr = q3 - q1;
	const lowerFence = q1 - 1.5 * iqr;
	const upperFence = q3 + 1.5 * iqr;
	const whiskerLow = sorted.find((v) => v >= lowerFence) ?? min;
	const whiskerHighCandidate = [...sorted]
		.reverse()
		.find((v) => v <= upperFence);
	const whiskerHigh = whiskerHighCandidate ?? max;
	const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
	return { min, q1, median, q3, max, whiskerLow, whiskerHigh, outliers };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BoxPlotChartProps {
	data: any[];
	config?: VisualizationConfig;
}

const SVG_W = 500;
const SVG_H = 350;
const PAD_TOP = 24;
const PAD_BOTTOM = 60;
const PAD_LEFT = 52;
const PAD_RIGHT = 20;
const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_H - PAD_TOP - PAD_BOTTOM;
const GRID_LINES = 5;
const CAP_HALF = 8; // half-width of whisker horizontal caps

export function BoxPlotChart({ data, config }: BoxPlotChartProps) {
	const xKey = config?.xKey ?? "";
	const yKey = config?.yKeys?.[0] ?? "";

	const bpStyling = (config?.styling as any)?.boxplot ?? {};
	const showOutliers: boolean = bpStyling.showOutliers !== false;
	const whiskerType: "minmax" | "iqr" =
		bpStyling.whiskerType === "minmax" ? "minmax" : "iqr";
	const fillOpacity: number =
		typeof bpStyling.fillOpacity === "number" ? bpStyling.fillOpacity : 0.6;

	// ── Unconfigured / no data states ──────────────────────────────────────────
	if (!xKey || !yKey) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				Configure a Category column and a Values column to render the
				box plot.
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

	// ── Group values by category ───────────────────────────────────────────────
	const grouped = new Map<string, number[]>();
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		const val = Number(row[yKey]);
		if (isNaN(val)) continue;
		if (!grouped.has(cat)) grouped.set(cat, []);
		grouped.get(cat)!.push(val);
	}

	const categories = Array.from(grouped.keys());
	if (categories.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No numeric values in the selected column.
			</div>
		);
	}

	const boxes: BoxStats[] = categories.map((cat) => {
		const vals = grouped.get(cat)!;
		return {
			category: cat,
			count: vals.length,
			...computeBoxStats(vals, whiskerType),
		};
	});

	// ── Y scale ───────────────────────────────────────────────────────────────
	const allValues = boxes.flatMap((b) =>
		showOutliers
			? [b.whiskerLow, b.whiskerHigh, ...b.outliers]
			: [b.whiskerLow, b.whiskerHigh],
	);
	const rawMin = Math.min(...allValues);
	const rawMax = Math.max(...allValues);
	const valueRange = rawMax - rawMin || 1;
	const yMin = rawMin - valueRange * 0.08;
	const yMax = rawMax + valueRange * 0.08;
	const yRange = yMax - yMin;

	const toY = (v: number) =>
		PAD_TOP + CHART_H - ((v - yMin) / yRange) * CHART_H;

	// ── X layout ──────────────────────────────────────────────────────────────
	const n = categories.length;
	const boxWidth = Math.min(40, (CHART_W / n) * 0.5);
	const catX = (i: number) => PAD_LEFT + (i + 0.5) * (CHART_W / n);

	// ── Grid line values ──────────────────────────────────────────────────────
	const gridVals = Array.from(
		{ length: GRID_LINES + 1 },
		(_, i) => yMin + (i / GRID_LINES) * yRange,
	);

	// ── Format Y tick ─────────────────────────────────────────────────────────
	const fmtY = (v: number) => {
		if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
		if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
		return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
	};

	return (
		<svg
			viewBox={`0 0 ${SVG_W} ${SVG_H}`}
			className="h-full w-full"
			style={{ display: "block" }}
			aria-label="Box plot chart"
		>
			{/* Grid lines + Y axis labels */}
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

			{/* Boxes */}
			{boxes.map((b, i) => {
				const cx = catX(i);
				const color = PALETTE[i % PALETTE.length];
				const yQ1 = toY(b.q1);
				const yQ3 = toY(b.q3);
				const yMedian = toY(b.median);
				const yWLow = toY(b.whiskerLow);
				const yWHigh = toY(b.whiskerHigh);
				// In SVG, larger Y = lower on screen; Q3 > Q1 so yQ3 < yQ1
				const boxTop = Math.min(yQ1, yQ3);
				const boxH = Math.abs(yQ3 - yQ1) || 1;

				return (
					<g key={b.category}>
						{/* Lower whisker stem: Q1 down to whiskerLow */}
						<line
							x1={cx}
							x2={cx}
							y1={yQ1}
							y2={yWLow}
							stroke={color}
							strokeWidth={1.5}
							strokeDasharray="3 2"
						/>
						{/* Lower whisker cap */}
						<line
							x1={cx - CAP_HALF}
							x2={cx + CAP_HALF}
							y1={yWLow}
							y2={yWLow}
							stroke={color}
							strokeWidth={1.5}
						/>

						{/* Upper whisker stem: Q3 up to whiskerHigh */}
						<line
							x1={cx}
							x2={cx}
							y1={yQ3}
							y2={yWHigh}
							stroke={color}
							strokeWidth={1.5}
							strokeDasharray="3 2"
						/>
						{/* Upper whisker cap */}
						<line
							x1={cx - CAP_HALF}
							x2={cx + CAP_HALF}
							y1={yWHigh}
							y2={yWHigh}
							stroke={color}
							strokeWidth={1.5}
						/>

						{/* Box body (Q1 to Q3) */}
						<rect
							x={cx - boxWidth / 2}
							y={boxTop}
							width={boxWidth}
							height={boxH}
							fill={color}
							fillOpacity={fillOpacity}
							stroke={color}
							strokeWidth={1.5}
							rx={2}
						/>

						{/* Median line */}
						<line
							x1={cx - boxWidth / 2}
							x2={cx + boxWidth / 2}
							y1={yMedian}
							y2={yMedian}
							stroke={color}
							strokeWidth={2.5}
						/>

						{/* Outlier dots */}
						{showOutliers &&
							b.outliers.map((ov, oi) => (
								<circle
									key={oi}
									cx={cx}
									cy={toY(ov)}
									r={3}
									fill="none"
									stroke={color}
									strokeWidth={1.5}
								/>
							))}

						{/* Category label */}
						<text
							x={cx}
							y={PAD_TOP + CHART_H + 14}
							textAnchor="middle"
							fontSize={10}
							fill="#475569"
						>
							{b.category.length > 12
								? b.category.slice(0, 11) + "…"
								: b.category}
						</text>

						{/* Count label */}
						<text
							x={cx}
							y={PAD_TOP + CHART_H + 26}
							textAnchor="middle"
							fontSize={8}
							fill="#94a3b8"
						>
							n={b.count}
						</text>
					</g>
				);
			})}
		</svg>
	);
}
