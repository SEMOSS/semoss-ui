/**
 * ClusterChart — circular packed dot clusters.
 *
 * Config fields used:
 *   config.xKey           — cluster grouping column (one circle per distinct value)
 *   config.yKeys[0]       — label column (each dot's identity shown in tooltip)
 *   config.tooltips[]     — additional columns shown in the hover tooltip
 *   config.styling?.cluster — ClusterStyling (dotRadius, fillOpacity, colorRules)
 *   config.styling?.colorPalette — shared color palette override
 */

import { useMemo, useState } from "react";
import {
	CHART_COLORS,
	compareColorRule,
} from "@/components/visualizations/shared/chartShared";
import type {
	ColorRule,
	VisualizationConfig,
	VizTriggerPayload,
} from "@/types/dashboard";

interface ClusterChartProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	onTrigger?: (payload: VizTriggerPayload) => void;
}

const SVG_W = 500;
const SVG_H = 350;
const PAD = 12;
const LABEL_RESERVE = 32; // px below cluster center for group name + count
const DOT_GAP = 2; // px between dot edges

/** Build (dx, dy) positions for N dots packed in concentric rings. */
function buildRingPositions(
	n: number,
	step: number,
): Array<{ dx: number; dy: number }> {
	const out: Array<{ dx: number; dy: number }> = [];
	if (n <= 0) return out;
	out.push({ dx: 0, dy: 0 });
	let ring = 1;
	while (out.length < n) {
		// Each ring k sits at radius k*step; we fit as many dots as the circumference allows.
		const radius = ring * step;
		const capacity = Math.max(1, Math.round((2 * Math.PI * radius) / step));
		for (let i = 0; i < capacity && out.length < n; i++) {
			const angle = (2 * Math.PI * i) / capacity;
			out.push({
				dx: radius * Math.cos(angle),
				dy: radius * Math.sin(angle),
			});
		}
		ring++;
	}
	return out;
}

/** Rings needed for N dots (approximate, for sizing). */
function ringsNeeded(n: number, step: number): number {
	if (n <= 1) return 0;
	let ring = 0;
	let filled = 1;
	while (filled < n) {
		ring++;
		filled += Math.max(1, Math.round((2 * Math.PI * ring * step) / step));
	}
	return ring;
}

interface PlottedDot {
	row: Record<string, unknown>;
	cx: number;
	cy: number;
	color: string;
	label: string;
}

export function ClusterChart({ data, config, onTrigger }: ClusterChartProps) {
	const xKey = config?.xKey ?? "";
	const labelKey = config?.yKeys?.[0] ?? "";
	const tooltipEntries = useMemo(
		() => config?.tooltips ?? [],
		[config?.tooltips],
	);

	const clusterStyling = (config?.styling as any)?.cluster ?? {};
	const preferredRadius: number =
		typeof clusterStyling.dotRadius === "number"
			? clusterStyling.dotRadius
			: 5;
	const fillOpacity: number =
		typeof clusterStyling.fillOpacity === "number"
			? clusterStyling.fillOpacity
			: 0.8;
	const colorRules: ColorRule[] = clusterStyling.colorRules ?? [];
	const palette: string[] = (config?.styling?.colorPalette as any)?.colors
		?.length
		? (config?.styling?.colorPalette as any).colors
		: CHART_COLORS;

	const [hovered, setHovered] = useState<{
		row: Record<string, unknown>;
		svgX: number;
		svgY: number;
	} | null>(null);

	// ── Derived layout (memoised) ────────────────────────────────────────────────
	const { dots, groups, dotRadius } = useMemo(() => {
		if (!xKey || !data.length)
			return {
				dots: [] as PlottedDot[],
				groups: [] as Array<[string, number]>,
				dotRadius: preferredRadius,
			};

		// Group rows by cluster column (preserve first-seen order)
		const groupMap = new Map<string, Record<string, unknown>[]>();
		for (const row of data) {
			const key = String(row[xKey] ?? "");
			if (!groupMap.has(key)) groupMap.set(key, []);
			groupMap.get(key)?.push(row);
		}
		const groupEntries = [...groupMap.entries()]; // [name, rows][]
		const numGroups = groupEntries.length;

		// Available area for all cluster circles
		const availW = SVG_W - 2 * PAD;
		const availH = SVG_H - 2 * PAD - LABEL_RESERVE;
		// Max radius any single cluster can occupy
		const maxR = Math.min(availH / 2, availW / numGroups / 2) - 4;

		// Find a dotRadius that fits the largest cluster within maxR.
		// rings * step <= maxR  →  step <= maxR / rings
		const largestCount = Math.max(...groupEntries.map(([, r]) => r.length));
		let dr = preferredRadius;
		for (let attempt = preferredRadius; attempt >= 2; attempt--) {
			const step = attempt * 2 + DOT_GAP;
			const rings = ringsNeeded(largestCount, step);
			if (rings * step <= maxR) {
				dr = attempt;
				break;
			}
			dr = 2; // floor
		}
		const step = dr * 2 + DOT_GAP;

		const resolveColor = (
			row: Record<string, unknown>,
			groupIdx: number,
		): string => {
			for (const rule of colorRules) {
				if (
					compareColorRule(
						rule.comparator,
						row[rule.valueColumn],
						rule.value,
					)
				)
					return rule.color;
			}
			return palette[groupIdx % palette.length];
		};

		const dots: PlottedDot[] = [];
		const groups: Array<[string, number]> = [];
		const slotW = availW / numGroups;

		for (let gi = 0; gi < groupEntries.length; gi++) {
			const [name, rows] = groupEntries[gi];
			groups.push([name, rows.length]);
			const cx = PAD + gi * slotW + slotW / 2;
			const cy = PAD + availH / 2;
			const ringPositions = buildRingPositions(rows.length, step);

			for (let di = 0; di < rows.length; di++) {
				const row = rows[di];
				const { dx, dy } = ringPositions[di] ?? { dx: 0, dy: 0 };
				const label = labelKey ? String(row[labelKey] ?? "") : "";
				dots.push({
					row,
					cx: cx + dx,
					cy: cy + dy,
					color: resolveColor(row, gi),
					label,
				});
			}
		}

		return { dots, groups, dotRadius: dr };
	}, [data, xKey, labelKey, preferredRadius, colorRules, palette]);

	// ── Early returns (all hooks above this line) ────────────────────────────────
	if (!xKey || !labelKey) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				Configure a Cluster column and a Label column to render the
				chart.
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

	const numGroups = groups.length;
	const slotW = (SVG_W - 2 * PAD) / Math.max(numGroups, 1);
	const clusterCY = PAD + (SVG_H - 2 * PAD - LABEL_RESERVE) / 2;

	return (
		<div className="relative h-full w-full overflow-hidden">
			<svg
				viewBox={`0 0 ${SVG_W} ${SVG_H}`}
				className="h-full w-full"
				style={{ display: "block" }}
				aria-label="Cluster chart"
			>
				{/* Dots */}
				{dots.map((d, i) => (
					<circle
						key={i}
						cx={d.cx}
						cy={d.cy}
						r={dotRadius}
						fill={d.color}
						fillOpacity={fillOpacity}
						stroke={d.color}
						strokeWidth={0.4}
						strokeOpacity={Math.min(fillOpacity + 0.15, 1)}
						style={{ cursor: onTrigger ? "pointer" : "default" }}
						onMouseEnter={() =>
							setHovered({ row: d.row, svgX: d.cx, svgY: d.cy })
						}
						onMouseLeave={() => setHovered(null)}
						onClick={() =>
							onTrigger?.({
								trigger: "click",
								label: d.label,
								row: d.row,
							})
						}
					/>
				))}

				{/* Group labels below each cluster */}
				{groups.map(([name, count], gi) => {
					const cx = PAD + gi * slotW + slotW / 2;
					const labelY =
						clusterCY + (SVG_H - 2 * PAD - LABEL_RESERVE) / 2 + 18;
					const displayName =
						name.length > 20 ? `${name.slice(0, 19)}…` : name;
					return (
						<g key={gi}>
							<text
								x={cx}
								y={labelY}
								textAnchor="middle"
								fontSize={11}
								fontWeight={600}
								fill="#374151"
							>
								{displayName}
							</text>
							<text
								x={cx}
								y={labelY + 13}
								textAnchor="middle"
								fontSize={9}
								fill="#9ca3af"
							>
								n={count}
							</text>
						</g>
					);
				})}
			</svg>

			{/* Hover tooltip */}
			{hovered && (labelKey || tooltipEntries.length > 0) && (
				<div
					className="pointer-events-none absolute z-50 max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 text-xs shadow-lg"
					style={{
						left: `${(hovered.svgX / SVG_W) * 100}%`,
						top: `${(hovered.svgY / SVG_H) * 100}%`,
						transform: "translate(10px, -50%)",
					}}
				>
					{labelKey && (
						<p className="mb-1 truncate font-semibold">
							{labelKey}: {String(hovered.row[labelKey] ?? "")}
						</p>
					)}
					{tooltipEntries.map(({ column }) => (
						<p key={column} className="truncate text-slate-500">
							<span className="font-medium text-slate-600">
								{column}:
							</span>{" "}
							{String(hovered.row[column] ?? "")}
						</p>
					))}
				</div>
			)}
		</div>
	);
}
