/**
 * SunburstChart — multi-level hierarchical ring chart built with pure SVG.
 *
 * Data model:
 *   config.sunburstLevels — ordered array of dimension columns (innermost first)
 *   config.yKeys[0]       — numeric value column (aggregated with columnAggregations or 'sum')
 *   config.styling?.sunburst.innerRadius  — 0‥0.8, creates a donut hole (default 0)
 *   config.styling?.sunburst.valueLabel   — label config (show, font, size, rotation, color)
 *   config.styling?.sunburst.colorRules   — conditional color overrides per wedge
 *   config.styling?.colorPalette          — shared color palette
 */

import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { compareColorRule } from "@/components/visualizations/shared/chartShared";
import { formatValue } from "@/lib/formatValue";
import type {
	ColorRule,
	FormatRule,
	VisualizationConfig,
	VizTriggerPayload,
} from "@/types/dashboard";

interface Props {
	data: any[];
	config?: VisualizationConfig;
	formatRules?: FormatRule[];
	onTrigger?: (payload: VizTriggerPayload) => void;
}

const FALLBACK_PALETTE = [
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
	"#06b6d4",
	"#a855f7",
	"#eab308",
	"#22c55e",
	"#f43f5e",
];

function aggLabel(aggType: string, col: string) {
	const prefix =
		aggType === "avg"
			? "Avg"
			: aggType === "count"
				? "Count"
				: aggType === "min"
					? "Min"
					: aggType === "max"
						? "Max"
						: "Sum";
	return `${prefix} of ${col}`;
}

// ── Tree node ─────────────────────────────────────────────────────────────────
interface TreeNode {
	name: string;
	value: number;
	children: TreeNode[];
	depth: number;
}

function buildTree(
	rows: any[],
	levels: string[],
	valueCol: string,
	aggType: string,
): TreeNode {
	if (!levels.length || !valueCol)
		return { name: "root", value: 0, children: [], depth: 0 };

	const aggregate = (vals: number[]): number => {
		if (!vals.length) return 0;
		switch (aggType) {
			case "avg":
				return vals.reduce((a, b) => a + b, 0) / vals.length;
			case "count":
				return vals.length;
			case "max":
				return Math.max(...vals);
			case "min":
				return Math.min(...vals);
			default:
				return vals.reduce((a, b) => a + b, 0);
		}
	};

	function recurse(subset: any[], depth: number): TreeNode[] {
		if (depth >= levels.length) return [];
		const col = levels[depth];
		const grouped = new Map<string, any[]>();
		subset.forEach((row) => {
			const key = String(row[col] ?? "");
			if (!grouped.has(key)) grouped.set(key, []);
			grouped.get(key)?.push(row);
		});
		return Array.from(grouped.entries()).map(([name, items]) => {
			const children = recurse(items, depth + 1);
			const value =
				children.length > 0
					? children.reduce((s, c) => s + c.value, 0)
					: aggregate(items.map((r) => Number(r[valueCol]) || 0));
			return { name, value, children, depth };
		});
	}

	const children = recurse(rows, 0);
	const total = children.reduce((s, c) => s + c.value, 0);
	return { name: "root", value: total, children, depth: -1 };
}

// ── Arc rendering ─────────────────────────────────────────────────────────────
interface ArcDatum {
	node: TreeNode;
	startAngle: number;
	endAngle: number;
	innerR: number;
	outerR: number;
	colorIndex: number;
}

function polarToCart(cx: number, cy: number, r: number, angle: number) {
	return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(
	cx: number,
	cy: number,
	innerR: number,
	outerR: number,
	startAngle: number,
	endAngle: number,
): string {
	const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
	const [x1, y1] = polarToCart(cx, cy, outerR, startAngle);
	const [x2, y2] = polarToCart(cx, cy, outerR, endAngle);
	const [x3, y3] = polarToCart(cx, cy, innerR, endAngle);
	const [x4, y4] = polarToCart(cx, cy, innerR, startAngle);
	if (innerR <= 0) {
		return `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;
	}
	return [
		`M ${x1} ${y1}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
		`L ${x3} ${y3}`,
		`A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
		"Z",
	].join(" ");
}

function flattenArcs(
	node: TreeNode,
	total: number,
	levels: number,
	innerHoleR: number,
	maxR: number,
	cx: number,
	cy: number,
	startAngle: number,
	endAngle: number,
	levelCounters: Map<number, number>,
	result: ArcDatum[],
) {
	if (node.depth < 0) {
		// root — recurse children over full circle, each top-level child gets its own colorIndex
		let angle = startAngle;
		node.children.forEach((child) => {
			const span =
				total > 0 ? (child.value / total) * (endAngle - startAngle) : 0;
			flattenArcs(
				child,
				total,
				levels,
				innerHoleR,
				maxR,
				cx,
				cy,
				angle,
				angle + span,
				levelCounters,
				result,
			);
			angle += span;
		});
		return;
	}

	const ringWidth = (maxR - innerHoleR) / levels;
	const innerR = innerHoleR + node.depth * ringWidth;
	const outerR = innerR + ringWidth;

	if (endAngle - startAngle > 0.005) {
		// Each depth level independently assigns color indices
		const colorIndex = levelCounters.get(node.depth) ?? 0;
		levelCounters.set(node.depth, colorIndex + 1);
		result.push({ node, startAngle, endAngle, innerR, outerR, colorIndex });

		if (node.children.length) {
			let angle = startAngle;
			node.children.forEach((child) => {
				const span =
					node.value > 0
						? (child.value / node.value) * (endAngle - startAngle)
						: 0;
				flattenArcs(
					child,
					total,
					levels,
					innerHoleR,
					maxR,
					cx,
					cy,
					angle,
					angle + span,
					levelCounters,
					result,
				);
				angle += span;
			});
		}
	}
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SunburstChart({
	data,
	config,
	formatRules = [],
	onTrigger,
}: Props) {
	const levels = config?.sunburstLevels ?? [];
	const valueCol = config?.yKeys?.[0] ?? "";
	const aggType =
		(valueCol && config?.columnAggregations?.[valueCol]) || "sum";
	const innerRadiusFrac = config?.styling?.sunburst?.innerRadius ?? 0;
	const valueLabelCfg = config?.styling?.sunburst?.valueLabel;
	const showLabels =
		valueLabelCfg?.show ?? config?.styling?.sunburst?.showLabels ?? false;
	const colorRules: ColorRule[] =
		(config?.styling?.sunburst?.colorRules as ColorRule[]) ?? [];

	const palette: string[] = (config?.styling as any)?.colorPalette?.colors
		?.length
		? (config?.styling as any).colorPalette.colors
		: FALLBACK_PALETTE;

	const tree = useMemo(
		() => buildTree(data, levels, valueCol, aggType),
		[data, levels, valueCol, aggType],
	);

	// All hooks must run before any early return — Rules of Hooks
	const [hovered, setHovered] = React.useState<{
		x: number;
		y: number;
		arc: ArcDatum;
		fill: string;
	} | null>(null);
	const [rootHovered, setRootHovered] = React.useState<{
		x: number;
		y: number;
	} | null>(null);

	if (!levels.length || !valueCol) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400">
				<div className="px-6 text-center">
					<svg
						className="mx-auto mb-3 h-12 w-12 opacity-20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<circle cx="12" cy="12" r="10" />
						<circle cx="12" cy="12" r="5" />
					</svg>
					<p className="font-medium text-slate-500 text-sm">
						No data configured
					</p>
					<p className="mt-1 text-xs">
						Drag columns to Group and Value drop zones
					</p>
				</div>
			</div>
		);
	}

	if (!data.length || tree.value === 0) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400 text-sm">
				No data to display
			</div>
		);
	}

	const SIZE = 400;
	const cx = SIZE / 2;
	const cy = SIZE / 2;
	const maxR = SIZE / 2 - 4;
	const innerHoleR = maxR * Math.min(innerRadiusFrac, 0.8);
	const START = -Math.PI / 2;
	const END = START + 2 * Math.PI;

	const arcs: ArcDatum[] = [];
	const levelCounters = new Map<number, number>();
	flattenArcs(
		tree,
		tree.value,
		levels.length,
		innerHoleR,
		maxR,
		cx,
		cy,
		START,
		END,
		levelCounters,
		arcs,
	);

	// valueCol match → compare the node's aggregated numeric value;
	// any other column (group level) → compare the node's category name string.
	const resolveColor = (arc: ArcDatum): string => {
		if (colorRules.length) {
			for (const rule of colorRules) {
				const candidate =
					rule.valueColumn === valueCol
						? arc.node.value
						: arc.node.name;
				if (compareColorRule(rule.comparator, candidate, rule.value)) {
					return rule.color;
				}
			}
		}
		return palette[arc.colorIndex % palette.length];
	};

	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
			<svg
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="h-full max-h-full w-full"
				preserveAspectRatio={
					config?.styling?.size?.stretch ? "none" : undefined
				}
				onMouseLeave={() => {
					setHovered(null);
					setRootHovered(null);
					onTrigger?.({ trigger: "mouseout" });
				}}
			>
				{arcs.map((arc, i) => {
					const mid = (arc.startAngle + arc.endAngle) / 2;
					const labelR = (arc.innerR + arc.outerR) / 2;
					const [lx, ly] = polarToCart(cx, cy, labelR, mid);
					const arcSpan = arc.endAngle - arc.startAngle;
					const fill = resolveColor(arc);
					const isHovered = hovered?.arc === arc;

					// Rotation: tangential to the arc (text follows the curve horizontally).
					// The tangent direction is the radial angle + 90°; flip if upside-down.
					const rawDeg = (mid * 180) / Math.PI;
					const tangentDeg = rawDeg + 90;
					const normalizedDeg = ((tangentDeg % 360) + 360) % 360;
					const autoRotateDeg =
						normalizedDeg > 90 && normalizedDeg < 270
							? normalizedDeg - 180
							: normalizedDeg;
					const rotateDeg =
						valueLabelCfg?.rotate !== undefined
							? valueLabelCfg.rotate
							: autoRotateDeg;

					return (
						<g key={i}>
							<path
								d={arcPath(
									cx,
									cy,
									arc.innerR,
									arc.outerR,
									arc.startAngle,
									arc.endAngle,
								)}
								fill={fill}
								fillOpacity={isHovered ? 1 : 0.82}
								stroke="#fff"
								strokeWidth={1.5}
								onMouseEnter={() =>
									onTrigger?.({
										trigger: "hover",
										label: arc.node.name,
										row: {
											[levels[arc.node.depth] ?? "name"]:
												arc.node.name,
										},
									})
								}
								onMouseMove={(e) =>
									setHovered({
										x: e.clientX,
										y: e.clientY,
										arc,
										fill,
									})
								}
								onMouseLeave={() =>
									onTrigger?.({ trigger: "mouseout" })
								}
								onClick={() =>
									onTrigger?.({
										trigger: "click",
										label: arc.node.name,
										row: {
											[levels[arc.node.depth] ?? "name"]:
												arc.node.name,
										},
									})
								}
								onDoubleClick={() =>
									onTrigger?.({
										trigger: "dblclick",
										label: arc.node.name,
										row: {
											[levels[arc.node.depth] ?? "name"]:
												arc.node.name,
										},
									})
								}
								style={{
									cursor: "pointer",
									transition: "fill-opacity 0.15s",
								}}
							/>
							{showLabels &&
								arcSpan > 0.25 &&
								arc.outerR - arc.innerR > 14 && (
									<text
										x={lx}
										y={ly}
										textAnchor="middle"
										dominantBaseline="middle"
										fill={valueLabelCfg?.color ?? "#fff"}
										fontSize={valueLabelCfg?.fontSize ?? 10}
										fontFamily={
											valueLabelCfg?.fontFamily ?? "Inter"
										}
										fontWeight={600}
										transform={`rotate(${rotateDeg}, ${lx}, ${ly})`}
										style={{
											pointerEvents: "none",
											userSelect: "none",
										}}
									>
										{(() => {
											const fmtName = formatValue(
												arc.node.name,
												levels[arc.node.depth] ?? "",
												formatRules,
											);
											return fmtName.length > 12
												? `${fmtName.slice(0, 10)}…`
												: fmtName;
										})()}
									</text>
								)}
						</g>
					);
				})}

				{/* Transparent center circle for root hover — only when there's a donut hole */}
				{innerHoleR > 0 && (
					<circle
						cx={cx}
						cy={cy}
						r={innerHoleR}
						fill="transparent"
						style={{ cursor: "default" }}
						onMouseMove={(e) =>
							setRootHovered({ x: e.clientX, y: e.clientY })
						}
						onMouseLeave={() => setRootHovered(null)}
					/>
				)}
			</svg>

			{/* Wedge hover tooltip */}
			{hovered &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[9999] min-w-[140px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-soft-lg"
						style={{ top: hovered.y + 12, left: hovered.x + 12 }}
					>
						<div className="mb-1 flex items-center gap-2 font-semibold text-stone-800">
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
								style={{ background: hovered.fill }}
							/>
							{hovered.arc.node.name}
						</div>
						<p className="text-stone-500">
							{aggLabel(aggType, valueCol)}:{" "}
							{formatValue(
								hovered.arc.node.value,
								valueCol,
								formatRules,
							) || String(hovered.arc.node.value ?? "—")}
						</p>
						<p className="text-stone-400">
							{tree.value > 0
								? (
										(hovered.arc.node.value / tree.value) *
										100
									).toFixed(1)
								: "0.0"}
							%
						</p>
					</div>,
					document.body,
				)}

			{/* Root hover tooltip */}
			{rootHovered &&
				createPortal(
					<div
						className="pointer-events-none fixed z-[9999] min-w-[120px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-soft-lg"
						style={{
							top: rootHovered.y + 12,
							left: rootHovered.x + 12,
						}}
					>
						<div className="mb-1 flex items-center gap-2 font-semibold text-stone-800">
							<span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-stone-400 bg-white" />
							root
						</div>
						<p className="text-stone-500">
							{aggLabel(aggType, valueCol)}:{" "}
							{formatValue(tree.value, valueCol, formatRules) ||
								String(tree.value ?? "—")}
						</p>
					</div>,
					document.body,
				)}
		</div>
	);
}
