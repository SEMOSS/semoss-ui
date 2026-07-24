/**
 * HalfDonutChart — pure SVG half donut (semicircle donut) chart.
 *
 * Renders a 180° arc from left (π) to right (2π), distributing each category
 * as a proportional slice. Often used as a gauge or progress indicator.
 *
 * Data model:
 *   - xKey  → category column (one slice per unique value)
 *   - yKeys[0] → numeric value column (determines slice size)
 */
import type { VisualizationConfig } from "@/types/dashboard";

// ── Palette ───────────────────────────────────────────────────────────────────
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
/**
 * Convert a polar coordinate (in radians) to SVG cartesian.
 * Angles go from π (left) to 2π (right), sweeping through the top half.
 *   a = π  → leftmost  point  (cx - r, cy)
 *   a = 3π/2 → topmost point  (cx, cy - r)
 *   a = 2π → rightmost point  (cx + r, cy)
 */
function polarToCartesian(cx: number, cy: number, r: number, a: number) {
	return {
		x: cx + r * Math.cos(a),
		y: cy + r * Math.sin(a),
	};
}

/**
 * Build an SVG arc path for a donut wedge in the upper semicircle.
 * startAngle and endAngle are in radians, both in [π, 2π].
 */
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
		// Solid wedge (no hole)
		const center = `M ${cx} ${cy}`;
		return [
			center,
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

// ── Format helper ─────────────────────────────────────────────────────────────
function fmtNum(v: number): string {
	if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
	if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
	if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
	return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
	data: any[];
	config?: VisualizationConfig;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function HalfDonutChart({ data, config }: Props) {
	const xKey = config?.xKey ?? "";
	const yKey = config?.yKeys?.[0] ?? "";

	// Styling options
	const hd = (config?.styling as any)?.halfdonut ?? {};
	const showLabels: boolean = hd.showLabels ?? true;
	const showValues: boolean = hd.showValues ?? false;
	const showLegend: boolean = hd.showLegend ?? true;
	const innerRadiusFraction: number = Math.min(
		0.8,
		Math.max(0.3, hd.innerRadius ?? 0.55),
	);

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
						{/* Half donut icon */}
						<path d="M 4 24 A 20 20 0 0 1 44 24" />
						<path d="M 12 24 A 12 12 0 0 1 36 24" />
						<line x1="4" y1="24" x2="12" y2="24" />
						<line x1="36" y1="24" x2="44" y2="24" />
					</svg>
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to Category and Values drop zones
					</p>
				</div>
			</div>
		);
	}

	// ── Aggregate data by xKey ────────────────────────────────────────────────
	const grouped = new Map<string, number>();
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		const v = Number(row[yKey]);
		if (!isNaN(v)) {
			grouped.set(cat, (grouped.get(cat) ?? 0) + v);
		}
	}

	const categories = Array.from(grouped.keys());
	const values = categories.map((c) => grouped.get(c) ?? 0);
	const total = values.reduce((a, b) => a + b, 0);

	if (total === 0 || categories.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data to display
			</div>
		);
	}

	// ── Layout constants ──────────────────────────────────────────────────────
	const SVG_W = 400;
	const SVG_H = showLegend ? 240 : 210;
	const CX = 200;
	const CY = 205; // near bottom — flat edge of semicircle is at y=CY
	const OUTER_R = 160;
	const INNER_R = OUTER_R * innerRadiusFraction;
	const LABEL_OFFSET = 14; // beyond OUTER_R for category labels
	const MIN_SLICE_ANGLE = (5 * Math.PI) / 180; // 5° min for labels

	// ── Compute slices ────────────────────────────────────────────────────────
	// Distribute from π (left) to 2π (right) = 180° across the top
	const START_ANGLE = Math.PI; // left
	const TOTAL_ARC = Math.PI; // 180°

	let cursor = START_ANGLE;
	const slices = categories.map((cat, i) => {
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
			color: PALETTE[i % PALETTE.length],
		};
	});

	// ── Center display ────────────────────────────────────────────────────────
	const centerText = fmtNum(total);
	const centerLabel = yKey.length > 14 ? yKey.slice(0, 12) + "…" : yKey;

	return (
		<div className="flex h-full w-full flex-col items-center">
			<svg
				viewBox={`0 0 ${SVG_W} ${SVG_H}`}
				className="min-h-0 w-full flex-1"
				preserveAspectRatio={
					config?.styling?.size?.stretch ? "none" : undefined
				}
				aria-label="Half donut chart"
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
						>
							<title>{`${s.cat}: ${fmtNum(s.value)} (${(s.fraction * 100).toFixed(1)}%)`}</title>
						</path>
					);
				})}

				{/* ── Flat baseline (bottom edge of semicircle) ── */}
				<line
					x1={CX - OUTER_R}
					y1={CY}
					x2={CX + OUTER_R}
					y2={CY}
					stroke="#e2e8f0"
					strokeWidth={1}
				/>

				{/* ── Center total text ── */}
				<text
					x={CX}
					y={CY - INNER_R * 0.35}
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize={22}
					fontWeight="700"
					fill="#1e293b"
					style={{ pointerEvents: "none" }}
				>
					{centerText}
				</text>
				<text
					x={CX}
					y={CY - INNER_R * 0.35 + 18}
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize={10}
					fill="#94a3b8"
					style={{ pointerEvents: "none" }}
				>
					{centerLabel}
				</text>

				{/* ── Category labels ── */}
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

						// Anchor based on horizontal position relative to center
						const dx = pos.x - CX;
						const anchor =
							Math.abs(dx) < 10
								? "middle"
								: dx < 0
									? "end"
									: "start";

						const display =
							s.cat.length > 14
								? s.cat.slice(0, 12) + "…"
								: s.cat;

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

				{/* ── Value labels inside arcs ── */}
				{showValues &&
					slices.map((s) => {
						const sweep = s.end - s.start;
						if (sweep < MIN_SLICE_ANGLE) return null;
						const midAngle = (s.start + s.end) / 2;
						const labelR = (INNER_R + OUTER_R) / 2;
						const pos = polarToCartesian(CX, CY, labelR, midAngle);
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
								{fmtNum(s.value)}
							</text>
						);
					})}

				{/* ── Legend ── */}
				{showLegend && (
					<g>
						{(() => {
							const itemWidth = 80;
							const itemsPerRow = Math.floor(SVG_W / itemWidth);
							const rows: (typeof slices)[] = [];
							for (
								let i = 0;
								i < slices.length;
								i += itemsPerRow
							) {
								rows.push(slices.slice(i, i + itemsPerRow));
							}
							const legendY = CY + 18;
							return rows.map((row, rowIdx) => (
								<g
									key={rowIdx}
									transform={`translate(0, ${legendY + rowIdx * 16})`}
								>
									{row.map((s, colIdx) => {
										const totalInRow = row.length;
										const totalWidth =
											totalInRow * itemWidth;
										const startX =
											(SVG_W - totalWidth) / 2 +
											colIdx * itemWidth;
										const display =
											s.cat.length > 10
												? s.cat.slice(0, 8) + "…"
												: s.cat;
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
		</div>
	);
}
