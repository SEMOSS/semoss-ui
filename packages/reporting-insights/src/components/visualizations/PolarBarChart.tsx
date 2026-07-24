/**
 * PolarBarChart — pure SVG polar bar (rose / wind-rose) chart.
 *
 * Each unique category value in xKey gets a wedge (or set of wedges for
 * multiple series) radiating outward from a center point.  Bar length is
 * proportional to the corresponding yKey value.
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
	data: any[];
	config?: VisualizationConfig;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PolarBarChart({ data, config }: Props) {
	const xKey = config?.xKey ?? "";
	const yKeys: string[] = config?.yKeys ?? [];

	// Polar bar–specific styling options
	const pbStyling = (config?.styling as any)?.polarbar ?? {};
	const showLabels: boolean = pbStyling.showLabels ?? true;
	const showValues: boolean = pbStyling.showValues ?? false;
	const fillOpacity: number = pbStyling.fillOpacity ?? 0.7;

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
						Drag columns to Category and Values drop zones
					</p>
				</div>
			</div>
		);
	}

	// ── Aggregate data by xKey ────────────────────────────────────────────────
	const grouped = new Map<string, Record<string, number[]>>();
	for (const row of data) {
		const cat = String(row[xKey] ?? "");
		if (!grouped.has(cat)) {
			const init: Record<string, number[]> = {};
			yKeys.forEach((k) => {
				init[k] = [];
			});
			grouped.set(cat, init);
		}
		const g = grouped.get(cat)!;
		yKeys.forEach((k) => {
			const v = Number(row[k]);
			if (!isNaN(v)) g[k].push(v);
		});
	}

	// Aggregate per group (sum)
	const categories = Array.from(grouped.keys());
	const aggregated = categories.map((cat) => {
		const g = grouped.get(cat)!;
		const vals: Record<string, number> = {};
		yKeys.forEach((k) => {
			vals[k] = g[k].reduce((a, b) => a + b, 0);
		});
		return { cat, vals };
	});

	// ── Compute max value across all series ───────────────────────────────────
	let maxValue = 0;
	for (const { vals } of aggregated) {
		for (const v of Object.values(vals)) {
			if (v > maxValue) maxValue = v;
		}
	}
	if (maxValue === 0) maxValue = 1; // guard against zero-data

	// ── Layout constants ──────────────────────────────────────────────────────
	const SVG_W = 400;
	const SVG_H = 420;
	const CX = 200;
	const CY = 210;
	const MAX_R = 155; // maximum bar radius
	const INNER_R = 15; // small center gap
	const GAP_ANGLE = 0.08; // radians gap between slices
	const LABEL_OFFSET = 14; // pixels beyond MAX_R for category labels
	const VALUE_OFFSET = 6; // pixels beyond bar tip for value labels

	const N = categories.length;
	if (N === 0) return null;

	const sliceAngle = (2 * Math.PI) / N; // full slice width per category

	// ── Grid circles ─────────────────────────────────────────────────────────
	const gridLevels = [0.25, 0.5, 0.75, 1.0];

	return (
		<div className="flex h-full w-full flex-col items-center">
			<svg
				viewBox={`0 0 ${SVG_W} ${SVG_H}`}
				className="min-h-0 w-full flex-1"
				preserveAspectRatio={
					config?.styling?.size?.stretch ? "none" : undefined
				}
				aria-label="Polar bar chart"
			>
				{/* ── Grid circles ── */}
				{gridLevels.map((lvl) => (
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

				{/* ── Grid labels (value scale) ── */}
				{gridLevels.map((lvl) => {
					const r = INNER_R + (MAX_R - INNER_R) * lvl;
					const labelVal = maxValue * lvl;
					const displayVal =
						labelVal >= 1e6
							? `${(labelVal / 1e6).toFixed(1)}M`
							: labelVal >= 1e3
								? `${(labelVal / 1e3).toFixed(1)}K`
								: labelVal % 1 === 0
									? labelVal.toFixed(0)
									: labelVal.toFixed(1);
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
							{displayVal}
						</text>
					);
				})}

				{/* ── Bars ── */}
				{aggregated.map(({ cat, vals }, catIdx) => {
					const baseAngle = catIdx * sliceAngle;
					// Within each category slice, divide by number of series (side-by-side)
					const usableAngle = sliceAngle - GAP_ANGLE;
					const seriesSlice = usableAngle / yKeys.length;
					const halfGap = GAP_ANGLE / 2;

					return yKeys.map((key, seriesIdx) => {
						const value = vals[key] ?? 0;
						const outerR =
							value <= 0
								? INNER_R
								: INNER_R +
									(value / maxValue) * (MAX_R - INNER_R);

						const startAngle =
							baseAngle + halfGap + seriesIdx * seriesSlice;
						const endAngle = startAngle + seriesSlice;
						const midAngle = (startAngle + endAngle) / 2;

						const color = PALETTE[seriesIdx % PALETTE.length];
						const path = wedgePath(
							CX,
							CY,
							INNER_R,
							Math.max(outerR, INNER_R + 0.5),
							startAngle,
							endAngle,
						);

						// Value label position (at bar tip)
						const valPos = polarToCartesian(
							CX,
							CY,
							outerR + VALUE_OFFSET,
							midAngle,
						);

						return (
							<g key={`${catIdx}-${seriesIdx}`}>
								<path
									d={path}
									fill={color}
									fillOpacity={fillOpacity}
									stroke="#fff"
									strokeWidth={0.5}
								>
									<title>{`${cat} · ${key}: ${value.toLocaleString()}`}</title>
								</path>
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
										{value >= 1e6
											? `${(value / 1e6).toFixed(1)}M`
											: value >= 1e3
												? `${(value / 1e3).toFixed(1)}K`
												: value % 1 === 0
													? value.toFixed(0)
													: value.toFixed(1)}
									</text>
								)}
							</g>
						);
					});
				})}

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

						// Determine anchor based on horizontal position
						const anchor =
							Math.abs(pos.x - CX) < 10
								? "middle"
								: pos.x < CX
									? "end"
									: "start";

						// Truncate long labels
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

				{/* ── Legend (multiple series) ── */}
				{yKeys.length > 1 && (
					<g transform={`translate(0, ${SVG_H - 28})`}>
						{yKeys.map((key, i) => {
							const legendX =
								CX - ((yKeys.length - 1) * 70) / 2 + i * 70;
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
										fill={PALETTE[i % PALETTE.length]}
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
		</div>
	);
}
