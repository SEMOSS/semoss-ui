import { CircleDot } from "lucide-react";
import {
	type CSSProperties,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type ColorPalette as ColorPaletteType,
	type ColorRule,
	DEFAULT_PUCK_STYLING,
	type VisualizationConfig,
} from "@/types/dashboard";

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
const PACK_GAP = 3;

// ── Aggregation ───────────────────────────────────────────────────────────────
function aggregate(values: unknown[], aggType: string): number {
	const nums = values.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
	switch (aggType) {
		case "count":
			return values.length;
		case "countUnique":
			return new Set(values).size;
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

// ── Color rule matching ────────────────────────────────────────────────────────
function compare(
	comparator: ColorRule["comparator"],
	candidate: unknown,
	target: string | number,
): boolean {
	if (candidate === undefined || candidate === null) return false;
	const cs = String(candidate),
		ts = String(target);
	const cn = Number(candidate),
		tn = Number(target);
	switch (comparator) {
		case "eq":
			return cs === ts;
		case "neq":
			return cs !== ts;
		case "gt":
			return !isNaN(cn) && !isNaN(tn) && cn > tn;
		case "lt":
			return !isNaN(cn) && !isNaN(tn) && cn < tn;
		case "gte":
			return !isNaN(cn) && !isNaN(tn) && cn >= tn;
		case "lte":
			return !isNaN(cn) && !isNaN(tn) && cn <= tn;
		case "contains":
			return cs.toLowerCase().includes(ts.toLowerCase());
		default:
			return false;
	}
}

// ── Tree ──────────────────────────────────────────────────────────────────────
interface PuckNode {
	name: string;
	value: number;
	depth: number;
	groupCol: string;
	children: PuckNode[];
	cx: number;
	cy: number;
	r: number;
	color: string;
	ruleMatched: boolean;
	isLeaf: boolean;
	path: string[];
}

function buildPuckTree(
	rows: Record<string, unknown>[],
	groupCols: string[],
	valueCol: string,
	aggType: string,
): PuckNode {
	function recurse(
		subset: Record<string, unknown>[],
		depth: number,
		path: string[],
	): PuckNode[] {
		if (depth >= groupCols.length) return [];
		const col = groupCols[depth];
		const grouped = new Map<string, Record<string, unknown>[]>();
		for (const row of subset) {
			const key = String(row[col] ?? "");
			if (!grouped.has(key)) grouped.set(key, []);
			grouped.get(key)!.push(row);
		}
		return Array.from(grouped.entries()).map(([name, items]) => {
			const children = recurse(items, depth + 1, [...path, name]);
			const value =
				children.length > 0
					? children.reduce((s, c) => s + c.value, 0)
					: aggregate(
							items.map((r) => r[valueCol]),
							aggType,
						);
			return {
				name,
				value,
				depth: depth + 1,
				groupCol: col,
				children,
				cx: 0,
				cy: 0,
				r: 0,
				color: "",
				ruleMatched: false,
				isLeaf: children.length === 0,
				path: [...path, name],
			};
		});
	}
	const children = recurse(rows, 0, []);
	return {
		name: "root",
		value: children.reduce((s, c) => s + c.value, 0),
		depth: 0,
		groupCol: "",
		children,
		cx: 0,
		cy: 0,
		r: 0,
		color: "",
		ruleMatched: false,
		isLeaf: children.length === 0,
		path: [],
	};
}

// ── Equal-sized circle packing inside a parent circle ─────────────────────────
// All n sibling circles get the same radius, sized using the optimal n-in-circle
// formula. Initial positions are on a ring; force-directed relaxation resolves
// any overlaps and pulls circles toward the center to fill the parent.
function optimalChildR(n: number, parentR: number): number {
	if (n <= 0) return 0;
	if (n === 1) return Math.max(4, parentR - PACK_GAP);
	if (n === 2) return Math.max(4, parentR * 0.46);
	// Exact formula for n equal circles packed inside a circle of radius parentR
	const r = parentR / (1 + 1 / Math.sin(Math.PI / n));
	return Math.max(4, r * 0.9);
}

function packEqualCircles(
	n: number,
	parentR: number,
): { cx: number; cy: number; r: number }[] {
	if (n <= 0) return [];
	const r = optimalChildR(n, parentR);
	if (n === 1) return [{ cx: 0, cy: 0, r }];

	// Place on outer ring — evenly spaced, just inside the parent boundary
	const ringR = Math.min(
		parentR - r - PACK_GAP,
		Math.max(r * 0.2, parentR * 0.55),
	);
	const pos = Array.from({ length: n }, (_, i) => ({
		x: Math.cos((i / n) * Math.PI * 2 - Math.PI / 2) * ringR,
		y: Math.sin((i / n) * Math.PI * 2 - Math.PI / 2) * ringR,
	}));

	// Force-directed: repulsion + inward gravity + boundary clamp
	for (let iter = 0; iter < 250; iter++) {
		const cooling = Math.max(0.01, 1 - iter / 250);

		// Repulsion
		for (let i = 0; i < n; i++) {
			for (let j = i + 1; j < n; j++) {
				const dx = pos[j].x - pos[i].x;
				const dy = pos[j].y - pos[i].y;
				const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
				const minD = 2 * r + PACK_GAP;
				if (d < minD) {
					const push = (minD - d) * 0.5;
					const nx = dx / d,
						ny = dy / d;
					pos[i].x -= nx * push;
					pos[i].y -= ny * push;
					pos[j].x += nx * push;
					pos[j].y += ny * push;
				}
			}
		}

		// Gravity toward center
		const g = 0.04 * cooling;
		for (let i = 0; i < n; i++) {
			pos[i].x *= 1 - g;
			pos[i].y *= 1 - g;
		}

		// Boundary
		for (let i = 0; i < n; i++) {
			const d =
				Math.sqrt(pos[i].x * pos[i].x + pos[i].y * pos[i].y) || 0.001;
			const maxD = parentR - r - PACK_GAP;
			if (maxD > 0 && d > maxD) {
				pos[i].x = (pos[i].x / d) * maxD;
				pos[i].y = (pos[i].y / d) * maxD;
			}
		}
	}

	return pos.map((p) => ({ cx: p.x, cy: p.y, r }));
}

// ── Layout assignment (DFS pre-order) ─────────────────────────────────────────
// One palette color per depth level: root=palette[0], depth-1=palette[1], etc.
// Color-by-value rules can override individual node colors at any depth.
function assignLayout(
	node: PuckNode,
	cx: number,
	cy: number,
	r: number,
	palette: string[],
	colorRules: ColorRule[],
): void {
	node.cx = cx;
	node.cy = cy;
	node.r = r;

	let color = palette[node.depth % palette.length];
	let ruleMatched = false;
	if (node.depth > 0) {
		for (const rule of colorRules) {
			if (compare(rule.comparator, node.name, rule.value)) {
				color = rule.color;
				ruleMatched = true;
				break;
			}
		}
	}
	node.color = color;
	node.ruleMatched = ruleMatched;

	if (!node.children.length) return;

	const childPos = packEqualCircles(node.children.length, r);
	node.children.forEach((child, i) => {
		const p = childPos[i] ?? { cx: 0, cy: 0, r: r * 0.2 };
		assignLayout(child, cx + p.cx, cy + p.cy, p.r, palette, colorRules);
	});
}

// ── Flatten tree ─────────────────────────────────────────────────────────────
function flattenNodes(node: PuckNode, out: PuckNode[]): void {
	out.push(node);
	node.children.forEach((c) => flattenNodes(c, out));
}

// ── Legend ────────────────────────────────────────────────────────────────────
// Flat list: one entry for the root aggregation, then one entry per group column.
// Colors match depth: root=palette[0], depth-1 col=palette[1], etc.
// Exactly matches BubbleChart legend format: colored dot + label, no values.
function buildLegend(
	groupCols: string[],
	aggType: string,
	valueCol: string,
	palette: string[],
): { label: string; color: string }[] {
	return [
		{ label: `${aggType} of ${valueCol}`, color: palette[0] },
		...groupCols.map((col, i) => ({
			label: col,
			color: palette[(i + 1) % palette.length],
		})),
	];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncateToFit(text: string, maxPx: number, fontSize: number): string {
	if (maxPx <= 0) return "";
	const max = Math.floor(maxPx / (fontSize * 0.6));
	if (max < 1) return "";
	return text.length <= max
		? text
		: max <= 1
			? "…"
			: text.slice(0, max - 1) + "…";
}

function formatNumber(n: number): string {
	if (Number.isInteger(n)) return n.toLocaleString();
	return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PuckChartProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	palette?: string[];
}

interface HoveredNode {
	node: PuckNode;
	x: number;
	y: number;
}

export function PuckChart({ data, config, palette }: PuckChartProps) {
	const groupCols = config?.puckGroups ?? [];
	const valueCol = config?.yKeys?.[0] ?? "";
	const aggType =
		(valueCol && config?.columnAggregations?.[valueCol]) || "sum";

	const styling = config?.styling?.puck ?? {};
	const showTooltip = styling.showTooltip ?? DEFAULT_PUCK_STYLING.showTooltip;
	const showLabels = styling.showLabels ?? DEFAULT_PUCK_STYLING.showLabels;
	const showLegend = styling.showLegend ?? DEFAULT_PUCK_STYLING.showLegend;
	const colorRules: ColorRule[] = styling.colorRules ?? [];

	const resolvedPalette = useMemo(() => {
		if (palette?.length) return palette;
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : DEFAULT_PALETTE;
	}, [palette, config?.styling?.colorPalette]);

	const [size, setSize] = useState({ width: 0, height: 0 });
	const roRef = useRef<ResizeObserver | null>(null);
	// Callback ref so we measure whenever the container actually mounts — including
	// when the chart first appears after Group/Value are added (it isn't rendered
	// while the config is incomplete, so a mount-once effect would miss it and the
	// chart would stay blank until a remount).
	const measureRef = useCallback((el: HTMLDivElement | null) => {
		roRef.current?.disconnect();
		if (!el) return;
		const update = () =>
			setSize({ width: el.clientWidth, height: el.clientHeight });
		update();
		roRef.current = new ResizeObserver(update);
		roRef.current.observe(el);
	}, []);

	const { flatNodes, legendEntries } = useMemo(() => {
		if (
			!groupCols.length ||
			!valueCol ||
			!data.length ||
			size.width === 0
		) {
			return { flatNodes: [], legendEntries: [] };
		}
		const root = buildPuckTree(data, groupCols, valueCol, aggType);
		if (root.value === 0) return { flatNodes: [], legendEntries: [] };

		const pad = 12;
		const rootR = (Math.min(size.width, size.height) - pad * 2) / 2;
		assignLayout(
			root,
			size.width / 2,
			size.height / 2,
			rootR,
			resolvedPalette,
			colorRules,
		);

		const flat: PuckNode[] = [];
		flattenNodes(root, flat);

		return {
			flatNodes: flat,
			legendEntries: buildLegend(
				groupCols,
				aggType,
				valueCol,
				resolvedPalette,
			),
		};
	}, [data, groupCols, valueCol, aggType, size, resolvedPalette, colorRules]);

	const [hovered, setHovered] = useState<HoveredNode | null>(null);

	if (!groupCols.length || !valueCol) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<CircleDot className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drop columns into Group and Value
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex h-full w-full flex-col">
			<div ref={measureRef} className="relative min-h-0 flex-1">
				<svg width="100%" height="100%" style={{ display: "block" }}>
					{flatNodes.map((node, i) => {
						if (node.r <= 0) return null;
						const isRoot = node.depth === 0;
						return (
							<g key={`${node.path.join("/")}-${i}`}>
								<circle
									cx={node.cx}
									cy={node.cy}
									r={node.r}
									fill={node.color}
									fillOpacity={node.ruleMatched ? 1 : 0.75}
									stroke="#ffffff"
									strokeWidth={1.5}
									style={{
										cursor: isRoot ? "default" : "pointer",
									}}
									onMouseEnter={(
										e: React.MouseEvent<SVGCircleElement>,
									) => {
										if (!showTooltip || isRoot) return;
										const rect =
											(e.currentTarget.ownerSVGElement?.getBoundingClientRect?.() as
												| DOMRect
												| undefined) ?? {
												left: 0,
												top: 0,
											};
										setHovered({
											node,
											x: e.clientX - rect.left,
											y: e.clientY - rect.top,
										});
									}}
									onMouseLeave={() => setHovered(null)}
								/>
								{/* Leaf labels: name + value, same two-line style as BubbleChart */}
								{showLabels &&
									!isRoot &&
									node.isLeaf &&
									(() => {
										const nFS = 12,
											vFS = 11;
										const maxW = node.r * 2 - 12;
										if (maxW <= 0) return null;
										const tName = truncateToFit(
											node.name,
											maxW,
											nFS,
										);
										const tVal = truncateToFit(
											formatNumber(node.value),
											maxW,
											vFS,
										);
										if (!tName && !tVal) return null;
										return (
											<g
												style={{
													pointerEvents: "none",
												}}
											>
												{tName && (
													<text
														x={node.cx}
														y={
															node.cy -
															(tVal ? 7 : 0)
														}
														textAnchor="middle"
														dominantBaseline="middle"
														style={{
															fontSize: nFS,
															fill: "#fff",
															fontWeight: 600,
														}}
													>
														{tName}
													</text>
												)}
												{tVal && (
													<text
														x={node.cx}
														y={node.cy + nFS}
														textAnchor="middle"
														dominantBaseline="middle"
														style={{
															fontSize: vFS,
															fill: "rgba(255,255,255,0.85)",
															fontWeight: 500,
														}}
													>
														{tVal}
													</text>
												)}
											</g>
										);
									})()}
							</g>
						);
					})}
				</svg>

				{/* Tooltip — bubble format */}
				{showTooltip && hovered && (
					<div
						className="pointer-events-none absolute z-10 min-w-[180px] rounded border border-slate-200 bg-white p-2 text-xs shadow-lg"
						style={
							{
								left: hovered.x + 12,
								top: hovered.y + 12,
							} as CSSProperties
						}
					>
						<div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
								style={{ background: hovered.node.color }}
							/>
							<span className="truncate">
								{hovered.node.name}
							</span>
						</div>
						{hovered.node.depth > 1 && (
							<div className="mb-1 truncate text-[10px] text-slate-400">
								{hovered.node.path.slice(0, -1).join(" › ")}
							</div>
						)}
						<div className="flex items-center justify-between gap-3 text-slate-600">
							<span className="capitalize">
								{aggType} of {valueCol}:
							</span>
							<span className="font-medium text-slate-700 tabular-nums">
								{formatNumber(hovered.node.value)}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Legend — exactly matches BubbleChart: dot + label, flat flex-wrap row */}
			{showLegend && legendEntries.length > 0 && (
				<div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 border-slate-100 border-t px-2 pt-2 pb-1">
					{legendEntries.map((entry) => (
						<div
							key={entry.label}
							className="flex items-center gap-1.5 text-slate-600 text-xs"
						>
							<span
								className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
								style={{ background: entry.color }}
							/>
							<span className="max-w-[140px] truncate">
								{entry.label}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
