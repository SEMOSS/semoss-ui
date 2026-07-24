/**
 * SunburstChart — multi-level hierarchical ring chart built with pure SVG.
 *
 * Data model:
 *   config.sunburstLevels — ordered array of dimension columns (innermost first)
 *   config.yKeys[0]       — numeric value column (aggregated with columnAggregations or 'sum')
 *   config.styling?.sunburst.innerRadius  — 0‥0.8, creates a donut hole (default 0)
 *   config.styling?.sunburst.showLabels   — render arc text labels (default false)
 */

import React, { useMemo } from "react";
import type { VisualizationConfig } from "@/types/dashboard";

interface Props {
	data: any[];
	config?: VisualizationConfig;
}

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
	"#06b6d4",
	"#a855f7",
	"#eab308",
	"#22c55e",
	"#f43f5e",
];

// ── Tree node ─────────────────────────────────────────────────────────────────
interface TreeNode {
	name: string;
	value: number;
	children: TreeNode[];
	depth: number;
	color?: string;
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
				return vals.reduce((a, b) => a + b, 0); // sum
		}
	};

	function recurse(subset: any[], depth: number): TreeNode[] {
		if (depth >= levels.length) return [];
		const col = levels[depth];
		const grouped = new Map<string, any[]>();
		subset.forEach((row) => {
			const key = String(row[col] ?? "");
			if (!grouped.has(key)) grouped.set(key, []);
			grouped.get(key)!.push(row);
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
	colorIndex: number,
	result: ArcDatum[],
) {
	if (node.depth < 0) {
		// root — recurse children over full circle
		let angle = startAngle;
		node.children.forEach((child, i) => {
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
				i,
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
		result.push({ node, startAngle, endAngle, innerR, outerR, colorIndex });
	}

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
				colorIndex,
				result,
			);
			angle += span;
		});
	}
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SunburstChart({ data, config }: Props) {
	const levels = config?.sunburstLevels ?? [];
	const valueCol = config?.yKeys?.[0] ?? "";
	const aggType =
		(valueCol && config?.columnAggregations?.[valueCol]) || "sum";
	const innerRadiusFrac = config?.styling?.sunburst?.innerRadius ?? 0;
	const showLabels = config?.styling?.sunburst?.showLabels ?? false;

	const tree = useMemo(
		() => buildTree(data, levels, valueCol, aggType),
		[data, levels, valueCol, aggType],
	);

	// NOTE: all hooks must run unconditionally before any early return — dropping a
	// column flips the data between the empty/configured branches, and a hook after
	// an early return would change hook order between renders (Rules of Hooks).
	const [hovered, setHovered] = React.useState<ArcDatum | null>(null);

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
						Drag columns to Hierarchy Levels and Value drop zones
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
		0,
		arcs,
	);

	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
			<svg
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="h-full max-h-full w-full"
				preserveAspectRatio={
					config?.styling?.size?.stretch ? "none" : undefined
				}
			>
				{arcs.map((arc, i) => {
					const mid = (arc.startAngle + arc.endAngle) / 2;
					const labelR = (arc.innerR + arc.outerR) / 2;
					const [lx, ly] = polarToCart(cx, cy, labelR, mid);
					const arcSpan = arc.endAngle - arc.startAngle;
					const color = PALETTE[arc.colorIndex % PALETTE.length];
					const isHovered = hovered === arc;

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
								fill={color}
								fillOpacity={isHovered ? 1 : 0.82}
								stroke="#fff"
								strokeWidth={1.5}
								onMouseEnter={() => setHovered(arc)}
								onMouseLeave={() => setHovered(null)}
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
										fill="#fff"
										fontSize={10}
										fontWeight={600}
										style={{
											pointerEvents: "none",
											userSelect: "none",
										}}
									>
										{arc.node.name.length > 12
											? arc.node.name.slice(0, 10) + "…"
											: arc.node.name}
									</text>
								)}
						</g>
					);
				})}

				{/* Tooltip in centre */}
				{hovered && (
					<>
						<text
							x={cx}
							y={cy - 10}
							textAnchor="middle"
							fontSize={11}
							fontWeight={700}
							fill="#1e293b"
						>
							{hovered.node.name.length > 16
								? hovered.node.name.slice(0, 14) + "…"
								: hovered.node.name}
						</text>
						<text
							x={cx}
							y={cy + 8}
							textAnchor="middle"
							fontSize={10}
							fill="#64748b"
						>
							{hovered.node.value.toLocaleString(undefined, {
								maximumFractionDigits: 2,
							})}
						</text>
					</>
				)}
			</svg>
		</div>
	);
}
