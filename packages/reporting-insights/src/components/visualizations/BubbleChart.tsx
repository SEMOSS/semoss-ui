import { Circle as CircleIcon } from "lucide-react";
import {
	type CSSProperties,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	DEFAULT_BUBBLE_STYLING,
	type VisualizationConfig,
} from "@/types/dashboard";

// Default categorical palette
const DEFAULT_PALETTE = [
	"#6366f1",
	"#0ea5e9",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
	"#f97316",
];

// Aggregation helper (mirrors WorldMap / WordCloud semantics)
function aggregate(values: unknown[], aggregation: string): number {
	const nums = values.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
	switch (aggregation) {
		case "count":
			return values.length;
		case "countUnique":
			return new Set(values).size;
		case "sum":
			return nums.reduce((s, v) => s + v, 0);
		case "avg":
			return nums.length
				? nums.reduce((s, v) => s + v, 0) / nums.length
				: 0;
		case "min":
			return nums.length ? Math.min(...nums) : 0;
		case "max":
			return nums.length ? Math.max(...nums) : 0;
		default:
			return nums.reduce((s, v) => s + v, 0);
	}
}

/** Compare a candidate value against a ColorRule. Mirrors the table evaluator. */
function compare(
	comparator: ColorRule["comparator"],
	candidate: unknown,
	target: string | number,
): boolean {
	if (candidate === undefined || candidate === null) return false;
	const candNum = Number(candidate);
	const targNum = Number(target);
	const candStr = String(candidate);
	const targStr = String(target);
	switch (comparator) {
		case "eq":
			return candStr === targStr;
		case "neq":
			return candStr !== targStr;
		case "gt":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum > targNum
			);
		case "lt":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum < targNum
			);
		case "gte":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum >= targNum
			);
		case "lte":
			return (
				!Number.isNaN(candNum) &&
				!Number.isNaN(targNum) &&
				candNum <= targNum
			);
		case "contains":
			return candStr.toLowerCase().includes(targStr.toLowerCase());
		default:
			return false;
	}
}

// Aggregated bubble shape (one per unique label)
export interface BubblePoint {
	label: string;
	sizeValue: number;
	tooltipValues?: Record<string, number | string>;
}

/** Aggregate raw rows into one bubble per unique value of the Bubbles (xKey) column.
 *  Size aggregates the configured Size column per `columnAggregations` (default
 *  sum/count by type); when no Size column is configured the size value falls
 *  back to row count per bubble. */
export function aggregateBubbleData(
	data: Record<string, unknown>[],
	config: VisualizationConfig | undefined,
): BubblePoint[] {
	const labelKey = config?.xKey;
	const sizeKey = config?.yKeys?.[0];
	const tooltipEntries: Array<{ column: string; aggregation: string }> =
		config?.tooltips?.length
			? config.tooltips
			: config?.tooltip
				? [
						{
							column: config.tooltip,
							aggregation:
								config.tooltipAggregation ||
								config.columnAggregations?.[config.tooltip] ||
								"count",
						},
					]
				: [];
	if (!labelKey) return [];

	const grouped = new Map<
		string,
		{
			label: string;
			sizeValues: unknown[];
			_tooltipValues: Record<string, unknown[]>;
			rowCount: number;
		}
	>();

	for (const row of data) {
		const label = String(row[labelKey] ?? "").trim();
		if (!label) continue;
		const existing = grouped.get(label);
		if (existing) {
			if (sizeKey) existing.sizeValues.push(row[sizeKey]);
			for (const { column } of tooltipEntries) {
				if (!existing._tooltipValues[column])
					existing._tooltipValues[column] = [];
				existing._tooltipValues[column].push(row[column]);
			}
			existing.rowCount += 1;
		} else {
			const _tooltipValues: Record<string, unknown[]> = {};
			for (const { column } of tooltipEntries)
				_tooltipValues[column] = [row[column]];
			grouped.set(label, {
				label,
				sizeValues: sizeKey ? [row[sizeKey]] : [],
				_tooltipValues,
				rowCount: 1,
			});
		}
	}

	return Array.from(grouped.values()).map((g) => {
		const sizeAgg = sizeKey
			? config?.columnAggregations?.[sizeKey] || "sum"
			: undefined;
		const tooltipValues: Record<string, number | string> = {};
		for (const { column, aggregation } of tooltipEntries) {
			const vals = g._tooltipValues[column] ?? [];
			if (vals.length)
				tooltipValues[column] = aggregate(vals, aggregation);
		}
		return {
			label: g.label,
			sizeValue:
				sizeKey && sizeAgg
					? aggregate(g.sizeValues, sizeAgg)
					: g.rowCount,
			tooltipValues: Object.keys(tooltipValues).length
				? tooltipValues
				: undefined,
		};
	});
}

interface BubbleChartProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	/** Optional explicit palette override (otherwise reads `config.styling.colorPalette`). */
	palette?: string[];
}

interface PlacedBubble extends BubblePoint {
	cx: number;
	cy: number;
	r: number;
	color: string;
}

interface HoveredBubble {
	point: PlacedBubble;
	x: number;
	y: number;
}

function formatNumber(n: number): string {
	if (Number.isInteger(n)) return n.toLocaleString();
	return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Truncate `text` with a trailing ellipsis when it doesn't fit within `maxWidthPx`.
 *  Width is approximated from font size (no DOM measurement) so it stays cheap to
 *  re-run on every layout pass. Returns '' when the box is too small for any glyph. */
function truncateToFit(
	text: string,
	maxWidthPx: number,
	fontSize: number,
): string {
	if (maxWidthPx <= 0) return "";
	const avgCharPx = fontSize * 0.6;
	const maxChars = Math.floor(maxWidthPx / avgCharPx);
	if (maxChars < 1) return "";
	if (text.length <= maxChars) return text;
	if (maxChars <= 1) return "…";
	return text.slice(0, maxChars - 1) + "…";
}

function tooltipStyle(x: number, y: number): CSSProperties {
	return { left: x + 12, top: y + 12 };
}

export function BubbleChart({ data, config, palette }: BubbleChartProps) {
	const labelKey = config?.xKey;
	const sizeKey = config?.yKeys?.[0];
	const tooltipEntries: Array<{ column: string; aggregation: string }> =
		config?.tooltips?.length
			? config.tooltips
			: config?.tooltip
				? [
						{
							column: config.tooltip,
							aggregation:
								config.tooltipAggregation ||
								config.columnAggregations?.[config.tooltip] ||
								"count",
						},
					]
				: [];

	const styling = config?.styling?.bubble ?? {};
	const showTooltip =
		styling.showTooltip ?? DEFAULT_BUBBLE_STYLING.showTooltip;
	const showLabels = styling.showLabels ?? DEFAULT_BUBBLE_STYLING.showLabels;
	const showLegend = styling.showLegend ?? DEFAULT_BUBBLE_STYLING.showLegend;
	const colorRules: ColorRule[] = styling.colorRules ?? [];

	// Resolve palette from explicit prop → config.styling.colorPalette → default
	const resolvedPalette = useMemo(() => {
		if (palette?.length) return palette;
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : DEFAULT_PALETTE;
	}, [palette, config?.styling?.colorPalette]);

	const points = useMemo(
		() => aggregateBubbleData(data, config),
		[data, config],
	);

	// Container size measurement for the SVG canvas
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });
	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		setSize({ width: el.clientWidth, height: el.clientHeight });
		const ro = new ResizeObserver(() => {
			setSize({ width: el.clientWidth, height: el.clientHeight });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Compute layout: sort by size desc, sqrt-area scale to a sensible radius
	// range, then cluster-pack around the container center. When the packed
	// result overflows the container, all radii are scaled down uniformly so
	// the chart never overflows, regardless of bubble count.
	const layout = useMemo<PlacedBubble[]>(() => {
		if (!points.length || size.width === 0 || size.height === 0) return [];

		const sortedBySize = [...points].sort(
			(a, b) => b.sizeValue - a.sizeValue,
		);
		const sizes = sortedBySize.map((p) => p.sizeValue);
		const maxSize = Math.max(...sizes);

		const padding = 12;
		const gap = 4;
		const availWidth = Math.max(0, size.width - padding * 2);
		const availHeight = Math.max(0, size.height - padding * 2);
		const cx0 = size.width / 2;
		const cy0 = size.height / 2;

		// Ideal radius bounds when there's plenty of space. The actual radii
		// get scaled down below if the packing overflows.
		const idealMinR = 32;
		const idealMaxR = Math.max(
			60,
			Math.min(220, Math.min(size.width, size.height) / 3),
		);

		// Floor we never shrink past — keeps tiny bubbles still visible at high
		// bubble counts. Below this we'd just be rendering dots.
		const absoluteMinR = 8;

		const baseRadius = (v: number) => {
			// When all values are equal (or there's only one bubble) render at
			// the largest size so the chart fills its container instead of
			// collapsing to a small dot.
			if (maxSize <= 0) return idealMaxR;
			// Scale radii against an absolute baseline (0 → maxSize) using
			// sqrt-area scaling. This keeps similar values visually similar:
			// e.g. 208 vs 205 produces near-identical bubbles, instead of the
			// min-normalized scale where the smallest value always collapses
			// to the smallest radius regardless of the actual gap.
			const ratio = Math.max(0, Math.min(1, v / maxSize));
			return idealMinR + Math.sqrt(ratio) * (idealMaxR - idealMinR);
		};
		const baseRadii = sortedBySize.map((p) => baseRadius(p.sizeValue));

		type Placed = { cx: number; cy: number; r: number };

		// Cluster-pack helper: place largest bubble at center, then for each
		// subsequent bubble search a logarithmic spiral outward and pick the
		// first non-overlapping position. Returns the placements + the bounding
		// half-extents from the cluster centroid.
		const packCluster = (
			radii: number[],
		): { placed: Placed[]; halfWidth: number; halfHeight: number } => {
			const placed: Placed[] = [];
			// Adaptive search step — finer for small bubbles, coarser for big.
			// Bounded so we don't spend forever placing tiny dots.
			const minStepAngle = Math.PI / 24; // ~7.5°
			const maxIterations = 4000;

			for (let i = 0; i < radii.length; i++) {
				const r = radii[i];
				if (i === 0) {
					placed.push({ cx: cx0, cy: cy0, r });
					continue;
				}

				// Spiral search: angle grows linearly, distance grows slowly.
				// We start at distance = previous-largest-radius + r + gap so
				// the first candidate already clears the central bubble.
				const startDist = placed[0].r + r + gap;
				let bestPos: { cx: number; cy: number; dist: number } | null =
					null;
				let dist = startDist;
				let angle = (i * 2.39996) % (Math.PI * 2); // golden-angle offset for variety
				const distStep = Math.max(1, r * 0.25);
				const angleStep = Math.max(
					minStepAngle,
					Math.PI / Math.max(8, dist / r),
				);

				for (let iter = 0; iter < maxIterations; iter++) {
					const cx = cx0 + Math.cos(angle) * dist;
					const cy = cy0 + Math.sin(angle) * dist;
					let collides = false;
					for (const o of placed) {
						const dx = cx - o.cx;
						const dy = cy - o.cy;
						const minDist = r + o.r + gap;
						if (dx * dx + dy * dy < minDist * minDist) {
							collides = true;
							break;
						}
					}
					if (!collides) {
						bestPos = { cx, cy, dist };
						break;
					}
					angle += angleStep;
					if (angle > Math.PI * 2) {
						angle -= Math.PI * 2;
						dist += distStep;
					}
				}

				if (bestPos) {
					placed.push({ cx: bestPos.cx, cy: bestPos.cy, r });
				} else {
					// Fallback: stack at the right edge of the cluster centroid
					// (extremely unlikely to hit unless maxIterations is too low).
					const fallbackCx = cx0 + (placed[0].r + r + gap) * 2;
					placed.push({ cx: fallbackCx, cy: cy0, r });
				}
			}

			// Compute the cluster's bounding box around the centroid (cx0, cy0)
			// so the caller can detect overflow against the container.
			let halfWidth = 0;
			let halfHeight = 0;
			for (const p of placed) {
				halfWidth = Math.max(halfWidth, Math.abs(p.cx - cx0) + p.r);
				halfHeight = Math.max(halfHeight, Math.abs(p.cy - cy0) + p.r);
			}
			return { placed, halfWidth, halfHeight };
		};

		// Iteratively scale down radii until the cluster fits within the
		// container. Each pass shrinks all radii by the more restrictive of
		// the width/height overflow ratios.
		let scale = 1;
		let radii = baseRadii.slice();
		let packed = packCluster(radii);
		for (let iter = 0; iter < 8; iter++) {
			const widthOk = packed.halfWidth * 2 <= availWidth;
			const heightOk = packed.halfHeight * 2 <= availHeight;
			if (widthOk && heightOk) break;
			const widthFactor = widthOk
				? 1
				: (availWidth / (packed.halfWidth * 2)) * 0.95;
			const heightFactor = heightOk
				? 1
				: (availHeight / (packed.halfHeight * 2)) * 0.95;
			const stepScale = Math.min(widthFactor, heightFactor);
			if (stepScale >= 0.999) break;
			scale *= stepScale;
			// Don't shrink below the absolute minimum — at very high bubble
			// counts we just accept some overflow rather than rendering invisible dots.
			radii = baseRadii.map((r) => Math.max(absoluteMinR, r * scale));
			packed = packCluster(radii);
		}

		// Resolve color: ColorRules override the palette per bubble. The rule
		// shape is shared with the table editor (targetColumn / valueColumn /
		// comparator / value), but for a bubble the whole shape is one logical
		// row so `targetColumn` is ignored. The candidate value comes from
		// either the aggregated size (when `valueColumn === sizeKey`) or the
		// bubble's label otherwise — matches WordCloud's evaluator.
		const resolveColor = (
			point: BubblePoint,
			fallbackIndex: number,
		): string => {
			for (const rule of colorRules) {
				const candidate: unknown =
					sizeKey && rule.valueColumn === sizeKey
						? point.sizeValue
						: point.label;
				if (compare(rule.comparator, candidate, rule.value))
					return rule.color;
			}
			return resolvedPalette[fallbackIndex % resolvedPalette.length];
		};

		// Recenter the cluster: it was packed around (cx0, cy0) but the actual
		// bounding box may not be perfectly symmetric. Shift everything so the
		// bbox center lands on the container center.
		let bboxMinX = Infinity;
		let bboxMaxX = -Infinity;
		let bboxMinY = Infinity;
		let bboxMaxY = -Infinity;
		for (const p of packed.placed) {
			bboxMinX = Math.min(bboxMinX, p.cx - p.r);
			bboxMaxX = Math.max(bboxMaxX, p.cx + p.r);
			bboxMinY = Math.min(bboxMinY, p.cy - p.r);
			bboxMaxY = Math.max(bboxMaxY, p.cy + p.r);
		}
		const shiftX = cx0 - (bboxMinX + bboxMaxX) / 2;
		const shiftY = cy0 - (bboxMinY + bboxMaxY) / 2;

		const result: PlacedBubble[] = [];
		for (let i = 0; i < packed.placed.length; i++) {
			const p = sortedBySize[i];
			const placed = packed.placed[i];
			result.push({
				...p,
				cx: placed.cx + shiftX,
				cy: placed.cy + shiftY,
				r: placed.r,
				color: resolveColor(p, i),
			});
		}
		return result;
	}, [points, size, sizeKey, colorRules, resolvedPalette]);

	const [hovered, setHovered] = useState<HoveredBubble | null>(null);

	// Empty / not-configured state
	if (!labelKey || !sizeKey) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<CircleIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drop columns into Bubbles and Size
					</p>
				</div>
			</div>
		);
	}

	const sizeAgg = (config?.columnAggregations?.[sizeKey] || "sum") as string;

	return (
		<div className="relative flex h-full w-full flex-col">
			<div ref={containerRef} className="relative min-h-0 flex-1">
				<svg width="100%" height="100%" style={{ display: "block" }}>
					{layout.map((p, i) => (
						<g key={`${p.label}-${i}`}>
							<circle
								cx={p.cx}
								cy={p.cy}
								r={p.r}
								fill={p.color}
								fillOpacity={0.75}
								stroke="#ffffff"
								strokeWidth={1.5}
								style={{ cursor: "pointer" }}
								onMouseEnter={(
									e: React.MouseEvent<SVGCircleElement>,
								) => {
									if (!showTooltip) return;
									const rect =
										(e.currentTarget.ownerSVGElement?.getBoundingClientRect?.() as
											| DOMRect
											| undefined) ?? { left: 0, top: 0 };
									setHovered({
										point: p,
										x: e.clientX - rect.left,
										y: e.clientY - rect.top,
									});
								}}
								onMouseLeave={() => setHovered(null)}
							/>
							{showLabels &&
								(() => {
									// Two-line label inside the bubble: name on top, value below.
									// Font sizes are fixed at 12px / 11px — the user can disable
									// labels via the tools panel if they don't fit comfortably.
									// Skip rendering when the bubble is too small to fit even one
									// glyph at this size.
									const nameFontSize = 12;
									const valueFontSize = 11;
									// 12px total horizontal padding inside the bubble.
									const maxWidth = p.r * 2 - 12;
									if (maxWidth <= 0) return null;
									const valueText = formatNumber(p.sizeValue);
									const truncatedName = truncateToFit(
										p.label,
										maxWidth,
										nameFontSize,
									);
									const truncatedValue = truncateToFit(
										valueText,
										maxWidth,
										valueFontSize,
									);
									if (!truncatedName && !truncatedValue)
										return null;
									return (
										<g style={{ pointerEvents: "none" }}>
											{truncatedName && (
												<text
													x={p.cx}
													y={p.cy - 2}
													textAnchor="middle"
													style={{
														fontSize: nameFontSize,
														fill: "#ffffff",
														fontWeight: 600,
													}}
												>
													{truncatedName}
												</text>
											)}
											{truncatedValue && (
												<text
													x={p.cx}
													y={p.cy + valueFontSize + 4}
													textAnchor="middle"
													style={{
														fontSize: valueFontSize,
														fill: "#ffffff",
														fontWeight: 500,
													}}
												>
													{truncatedValue}
												</text>
											)}
										</g>
									);
								})()}
						</g>
					))}
				</svg>

				{showTooltip && hovered && (
					<div
						className="pointer-events-none absolute z-10 min-w-[180px] rounded border border-slate-200 bg-white p-2 text-xs shadow-lg"
						style={tooltipStyle(hovered.x, hovered.y)}
					>
						<div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
								style={{ background: hovered.point.color }}
							/>
							<span className="truncate">
								{hovered.point.label}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3 text-slate-600">
							<span className="capitalize">
								{sizeAgg} of {sizeKey}:
							</span>
							<span className="font-medium text-slate-700 tabular-nums">
								{formatNumber(hovered.point.sizeValue)}
							</span>
						</div>
						{tooltipEntries.map(({ column, aggregation }) =>
							hovered.point.tooltipValues?.[column] !==
							undefined ? (
								<div
									key={column}
									className="flex items-center justify-between gap-3 text-slate-600"
								>
									<span className="capitalize">
										{aggregation} of {column}:
									</span>
									<span className="font-medium text-slate-700 tabular-nums">
										{typeof hovered.point.tooltipValues![
											column
										] === "number"
											? formatNumber(
													hovered.point
														.tooltipValues![
														column
													] as number,
												)
											: String(
													hovered.point
														.tooltipValues![column],
												)}
									</span>
								</div>
							) : null,
						)}
					</div>
				)}
			</div>

			{showLegend && layout.length > 0 && (
				<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 pt-2 pb-1">
					{layout.map((p, i) => (
						<div
							key={`legend-${p.label}-${i}`}
							className="flex items-center gap-1.5 text-slate-600 text-xs"
						>
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
								style={{ background: p.color }}
							/>
							<span className="max-w-[140px] truncate">
								{p.label}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
