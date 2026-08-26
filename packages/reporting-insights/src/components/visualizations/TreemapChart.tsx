import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import {
	CHART_COLORS,
	compareColorRule,
} from "@/components/visualizations/shared/chartShared";
import { formatValue } from "@/lib/formatValue";
import type {
	ColorRule,
	VisualizationConfig,
	VizTriggerPayload,
} from "@/types/dashboard";

interface TreemapChartProps {
	data: Record<string, any>[];
	config?: VisualizationConfig;
	height?: number | `${number}%`;
	onTrigger?: (payload: VizTriggerPayload) => void;
}

const SEP = "\x00";
const HEADER_SENTINEL = "__HEADER__";
const HEADER_H = 20;

const aggregate = (vals: number[], aggType: string): number => {
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

type DrillState =
	| { level: "root" }
	| { level: "series"; seriesName: string }
	| { level: "tile"; seriesName: string; labelName: string };

interface NodeInfo {
	fill: string;
	seriesFill: string;
	seriesName: string;
	labelName: string;
	isParent: boolean;
	isHeader: boolean;
	seriesTotal?: number;
	size?: number;
}

interface HoveredHeader {
	seriesName: string;
	fill: string;
	seriesTotal: number;
	mouseX: number;
	mouseY: number;
}

export function TreemapChart({
	data,
	config,
	height = "100%",
	onTrigger,
}: TreemapChartProps) {
	const seriesKey = config?.seriesKey;
	const labelKey = config?.xKey;
	const sizeKey = config?.yKeys?.[0];
	const styling = config?.styling?.treemap;
	const colorRules: ColorRule[] = (styling?.colorRules as ColorRule[]) ?? [];
	const showTooltip = styling?.showTooltip !== false;
	const showParents = styling?.showParentRelationships !== false;
	const headerFill = styling?.headerFill ?? "#e2e8f0";
	const headerLabel = styling?.headerLabel;
	const tileLabel = styling?.tileLabel;
	const sortValues = config?.styling?.sortValues ?? [];
	const formatRules = config?.styling?.formatRules ?? [];
	const aggType = sizeKey
		? (config?.columnAggregations?.[sizeKey] ?? "sum")
		: "sum";

	const palette = config?.styling?.colorPalette?.colors?.length
		? config.styling.colorPalette.colors
		: CHART_COLORS;

	// Stores the parent's (x, y, width) as captured during renderContent so the
	// header sentinel tile can paint itself at the correct position.
	// Parent nodes are always rendered before their children in Recharts' traversal,
	// so this ref is populated by the time header tiles run.
	const parentPositionRef = useRef<
		Map<string, { x: number; y: number; width: number }>
	>(new Map());
	// Reset every render cycle before Recharts re-runs renderContent.
	parentPositionRef.current = new Map();

	const [hoveredHeader, setHoveredHeader] = useState<HoveredHeader | null>(
		null,
	);
	const [drillState, setDrillState] = useState<DrillState>({ level: "root" });

	// Reset drill state whenever the underlying data changes
	useEffect(() => {
		setDrillState({ level: "root" });
	}, [data]);

	const { treeData, lookupMap, totalSize } = useMemo(() => {
		const lookupMap = new Map<string, NodeInfo>();

		if (!labelKey || !sizeKey)
			return { treeData: [], lookupMap, totalSize: 0 };

		if (seriesKey) {
			const seriesMap = new Map<string, Map<string, number[]>>();
			const rowMap = new Map<string, Record<string, any>>();

			for (const row of data) {
				const sv = String(row[seriesKey] ?? "");
				const lv = String(row[labelKey] ?? "");
				const num = Number(row[sizeKey]) || 0;
				if (!seriesMap.has(sv)) seriesMap.set(sv, new Map());
				const inner = seriesMap.get(sv)!;
				if (!inner.has(lv)) {
					inner.set(lv, []);
					rowMap.set(`${sv}${SEP}${lv}`, row);
				}
				inner.get(lv)?.push(num);
			}

			const seriesRule = sortValues.find((r) => r.column === seriesKey);
			const labelRule = sortValues.find((r) => r.column === labelKey);
			const sizeRule = sortValues.find((r) => r.column === sizeKey);

			const seriesEntries = seriesRule
				? [...seriesMap.entries()].sort(([a], [b]) => {
						const cmp = a.localeCompare(b, undefined, {
							numeric: true,
						});
						return seriesRule.direction === "asc" ? cmp : -cmp;
					})
				: [...seriesMap.entries()];

			let total = 0;
			const treeData = seriesEntries
				.map(([seriesVal, inner], si) => {
					const seriesFill = palette[si % palette.length];

					const leafChildren = Array.from(inner.entries())
						.map(([labelVal, vals]) => {
							const sz = aggregate(vals, aggType);
							let fill = seriesFill;
							if (colorRules.length) {
								const row = rowMap.get(
									`${seriesVal}${SEP}${labelVal}`,
								);
								if (row) {
									for (const rule of colorRules) {
										const cv = row[rule.valueColumn ?? ""];
										if (
											cv !== undefined &&
											compareColorRule(
												rule.comparator,
												cv,
												rule.value,
											)
										) {
											fill = rule.color;
											break;
										}
									}
								}
							}
							const key = `${seriesVal}${SEP}${labelVal}`;
							lookupMap.set(key, {
								fill,
								seriesFill,
								seriesName: seriesVal,
								labelName: labelVal,
								isParent: false,
								isHeader: false,
								size: sz,
							});
							total += sz;
							return { name: key, size: sz };
						})
						.filter((d) => d.size > 0)
						.sort((a, b) => {
							if (labelRule) {
								const aLabel =
									lookupMap.get(a.name)?.labelName ?? "";
								const bLabel =
									lookupMap.get(b.name)?.labelName ?? "";
								const cmp = aLabel.localeCompare(
									bLabel,
									undefined,
									{ numeric: true },
								);
								return labelRule.direction === "asc"
									? cmp
									: -cmp;
							}
							const dir = sizeRule?.direction === "asc" ? 1 : -1;
							return dir * (a.size - b.size);
						});

					const seriesTotal = leafChildren.reduce(
						(s, c) => s + c.size,
						0,
					);

					// Register parent node
					lookupMap.set(seriesVal, {
						fill: seriesFill,
						seriesFill,
						seriesName: seriesVal,
						labelName: "",
						isParent: true,
						isHeader: false,
						seriesTotal,
					});

					// Header sentinel: size=1, placed LAST so it renders after
					// all leaves in SVG paint order; appearing on top.
					const headerKey = `${seriesVal}${SEP}${HEADER_SENTINEL}`;
					lookupMap.set(headerKey, {
						fill: seriesFill,
						seriesFill,
						seriesName: seriesVal,
						labelName: "",
						isParent: false,
						isHeader: true,
						seriesTotal,
					});

					return {
						name: seriesVal,
						children: [
							...leafChildren,
							{ name: headerKey, size: 1 },
						],
					};
				})
				.filter((d) => d.children.length > 1); // at least header + one real tile

			return { treeData, lookupMap, totalSize: total };
		}

		// Flat single-level (no seriesKey)
		let total = 0;
		const treeData = data
			.map((r) => {
				let fill = palette[0];
				if (colorRules.length) {
					for (const rule of colorRules) {
						const cv = r[rule.valueColumn ?? ""];
						if (
							cv !== undefined &&
							compareColorRule(rule.comparator, cv, rule.value)
						) {
							fill = rule.color;
							break;
						}
					}
				}
				const name = String(r[labelKey] ?? "");
				const sz = aggregate([Number(r[sizeKey]) || 0], aggType);
				lookupMap.set(name, {
					fill,
					seriesFill: palette[0],
					seriesName: "",
					labelName: name,
					isParent: false,
					isHeader: false,
				});
				total += sz;
				return { name, size: sz };
			})
			.filter((d) => d.size > 0)
			.sort((a, b) => b.size - a.size);

		return { treeData, lookupMap, totalSize: total };
	}, [
		data,
		seriesKey,
		labelKey,
		sizeKey,
		aggType,
		palette,
		colorRules,
		sortValues,
	]);

	// Filter treeData to the drilled-in level for zoom navigation
	const displayedTreeData = useMemo(() => {
		if (drillState.level === "root") return treeData;
		if (drillState.level === "series") {
			const node = treeData.find((n) => n.name === drillState.seriesName);
			return node ? [node] : treeData;
		}
		// tile level: flat single-leaf treemap
		const leafKey = `${drillState.seriesName}${SEP}${drillState.labelName}`;
		const info = lookupMap.get(leafKey);
		if (!info?.size) return treeData;
		return [{ name: leafKey, size: info.size }];
	}, [treeData, drillState, lookupMap]);

	if (!labelKey || !sizeKey) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drag columns to Label and Size drop zones
					</p>
				</div>
			</div>
		);
	}

	const renderContent = (props: any) => {
		const { x, y, width, height: h, name } = props;
		const info = lookupMap.get(name ?? "");

		// Parent node: capture its position so child header tiles can reference it,
		// then render nothing (parent is visually represented by its children).
		if (info?.isParent) {
			parentPositionRef.current.set(info.seriesName, { x, y, width });
			return <g />;
		}

		// Header sentinel tile: paint a full-width strip at the PARENT's top position.
		// Being the last child, it renders last in SVG — on top of all leaf tiles.
		if (info?.isHeader) {
			if (!showParents) return <g />;
			const parentPos = parentPositionRef.current.get(info.seriesName);
			if (!parentPos) return <g />;

			return (
				<g
					onMouseEnter={(e) => {
						e.stopPropagation(); // prevent Recharts leaf tooltip from firing
						setHoveredHeader({
							seriesName: info.seriesName,
							fill: info.fill,
							seriesTotal: info.seriesTotal ?? 0,
							mouseX: e.clientX,
							mouseY: e.clientY,
						});
						onTrigger?.({
							trigger: "hover",
							label: info.seriesName,
							row: { [seriesKey!]: info.seriesName },
						});
					}}
					onMouseMove={(e) => {
						e.stopPropagation();
						setHoveredHeader((prev) =>
							prev
								? {
										...prev,
										mouseX: e.clientX,
										mouseY: e.clientY,
									}
								: null,
						);
					}}
					onMouseLeave={() => {
						setHoveredHeader(null);
						onTrigger?.({ trigger: "mouseout" });
					}}
					onClick={() => {
						setDrillState({
							level: "series",
							seriesName: info.seriesName,
						});
						onTrigger?.({
							trigger: "click",
							label: info.seriesName,
							row: { [seriesKey!]: info.seriesName },
						});
					}}
					onDoubleClick={() =>
						onTrigger?.({
							trigger: "dblclick",
							label: info.seriesName,
							row: { [seriesKey!]: info.seriesName },
						})
					}
					style={{ cursor: "pointer" }}
				>
					<rect
						x={parentPos.x}
						y={parentPos.y}
						width={parentPos.width}
						height={HEADER_H}
						fill={headerFill}
					/>
					{parentPos.width > 30 && (
						<text
							x={parentPos.x + 6}
							y={parentPos.y + HEADER_H / 2}
							dominantBaseline="middle"
							fill={headerLabel?.color ?? "#0f172a"}
							fontSize={headerLabel?.fontSize ?? 11}
							fontWeight={headerLabel?.fontWeight ?? 700}
							fontFamily={headerLabel?.fontFamily ?? undefined}
							style={{ pointerEvents: "none" }}
						>
							{info.seriesName}
						</text>
					)}
				</g>
			);
		}

		// Leaf tile: clip top edge if it falls within the parent's header strip.
		const tileColor = info?.fill || palette[0];
		const rawLabel = info?.labelName ?? name ?? "";
		const displayLabel = formatValue(rawLabel, labelKey!, formatRules);

		let tileY = y;
		let tileH = h;
		if (showParents && seriesKey && info?.seriesName) {
			const parentPos = parentPositionRef.current.get(info.seriesName);
			if (parentPos) {
				const headerBottom = parentPos.y + HEADER_H;
				// Tile entirely hidden under the header: skip rendering
				if (y + h <= headerBottom) return <g />;
				// Tile partially overlapping: clip top to start below header
				if (y < headerBottom) {
					tileH = h - (headerBottom - y);
					tileY = headerBottom;
				}
			}
		}

		const tileRow = {
			[labelKey!]: info?.labelName ?? rawLabel,
			...(seriesKey && info?.seriesName
				? { [seriesKey]: info.seriesName }
				: {}),
		};
		const tileLabel2 = info?.labelName ?? rawLabel;
		return (
			<g
				onMouseEnter={() =>
					onTrigger?.({
						trigger: "hover",
						label: tileLabel2,
						row: tileRow,
					})
				}
				onMouseLeave={() => onTrigger?.({ trigger: "mouseout" })}
				onClick={() => {
					if (seriesKey && info?.seriesName) {
						setDrillState({
							level: "tile",
							seriesName: info.seriesName,
							labelName: info.labelName,
						});
					}
					onTrigger?.({
						trigger: "click",
						label: tileLabel2,
						row: tileRow,
					});
				}}
				onDoubleClick={() =>
					onTrigger?.({
						trigger: "dblclick",
						label: tileLabel2,
						row: tileRow,
					})
				}
				style={{ cursor: seriesKey ? "pointer" : "default" }}
			>
				<rect
					x={x}
					y={tileY}
					width={width}
					height={tileH}
					fill={tileColor}
					stroke="rgba(255,255,255,0.3)"
					strokeWidth={1}
				/>
				{width > 18 && tileH > 12 && (
					<text
						x={x + width / 2}
						y={tileY + tileH / 2}
						textAnchor="middle"
						dominantBaseline="middle"
						fill={tileLabel?.color ?? "#fff"}
						fontSize={tileLabel?.fontSize ?? 10}
						fontWeight={tileLabel?.fontWeight ?? 600}
						fontFamily={tileLabel?.fontFamily ?? undefined}
						style={{ pointerEvents: "none" }}
					>
						{displayLabel}
					</text>
				)}
			</g>
		);
	};

	const treemapProps: any = {
		data: displayedTreeData,
		dataKey: "size",
		isAnimationActive: false,
		content: renderContent,
	};
	const heightStyle = typeof height === "number" ? `${height}px` : height;

	const breadcrumbPillStyle = (active: boolean): React.CSSProperties => ({
		padding: "2px 10px",
		borderRadius: 12,
		border: "none",
		background: active ? "#94a3b8" : "#e2e8f0",
		color: active ? "#fff" : "#64748b",
		fontWeight: active ? 700 : 500,
		fontSize: 11,
		cursor: active ? "default" : "pointer",
		lineHeight: 1.6,
	});

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: heightStyle,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{ flex: 1, minHeight: 0 }}>
				<ResponsiveContainer width="100%" height="100%">
					<Treemap {...treemapProps}>
						{showTooltip && (
							<Tooltip
								wrapperStyle={{ zIndex: 10 }}
								content={({ active, payload }: any) => {
									// Suppress Recharts tooltip entirely when a header is hovered
									// (the custom tooltip below handles that).
									if (hoveredHeader) return null;
									if (!active || !payload?.length)
										return null;
									const node = payload[0]?.payload;
									if (!node) return null;
									const info = lookupMap.get(node.name ?? "");
									if (!info || info.isParent || info.isHeader)
										return null;

									const sz: number =
										node.size ?? node.value ?? 0;
									const pct =
										totalSize > 0
											? ((sz / totalSize) * 100).toFixed(
													2,
												)
											: "0.00";
									const dotColor =
										info.seriesFill ||
										info.fill ||
										palette[0];
									const fmtSz = formatValue(
										sz,
										sizeKey!,
										formatRules,
									);

									return (
										<div
											style={{
												background: "#fff",
												border: "1px solid #e2e8f0",
												borderRadius: 6,
												padding: "8px 12px",
												fontSize: 12,
												lineHeight: 1.7,
												boxShadow:
													"0 2px 8px rgba(0,0,0,.12)",
												minWidth: 160,
											}}
										>
											{seriesKey && info.seriesName && (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 6,
														fontWeight: 600,
													}}
												>
													<span
														style={{
															width: 8,
															height: 8,
															borderRadius: "50%",
															background:
																dotColor,
															display:
																"inline-block",
															flexShrink: 0,
														}}
													/>
													{seriesKey}:{" "}
													{info.seriesName}
												</div>
											)}
											<div
												style={{
													paddingLeft:
														seriesKey &&
														info.seriesName
															? 14
															: 0,
												}}
											>
												{labelKey}: {info.labelName}
											</div>
											<div
												style={{
													paddingLeft:
														seriesKey &&
														info.seriesName
															? 14
															: 0,
												}}
											>
												{sizeKey}: {fmtSz} ({pct}%)
											</div>
										</div>
									);
								}}
							/>
						)}
					</Treemap>
				</ResponsiveContainer>
			</div>

			{/* Breadcrumb drill-down navigation bar */}
			{seriesKey && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 6,
						padding: "4px 8px",
						flexShrink: 0,
						flexWrap: "wrap",
					}}
				>
					<button
						style={breadcrumbPillStyle(drillState.level === "root")}
						onClick={() => setDrillState({ level: "root" })}
					>
						Home
					</button>
					{drillState.level !== "root" && (
						<>
							<span style={{ color: "#94a3b8", fontSize: 11 }}>
								›
							</span>
							<button
								style={breadcrumbPillStyle(
									drillState.level === "series",
								)}
								onClick={() =>
									setDrillState({
										level: "series",
										seriesName: drillState.seriesName,
									})
								}
							>
								{drillState.seriesName}
							</button>
						</>
					)}
					{drillState.level === "tile" && (
						<>
							<span style={{ color: "#94a3b8", fontSize: 11 }}>
								›
							</span>
							<span style={breadcrumbPillStyle(true)}>
								{drillState.labelName}
							</span>
						</>
					)}
				</div>
			)}

			{/* Custom tooltip for parent header hover — fixed so it isn't clipped by any
                overflow:hidden ancestor. */}
			{showTooltip &&
				hoveredHeader &&
				(() => {
					const pct =
						totalSize > 0
							? (
									(hoveredHeader.seriesTotal / totalSize) *
									100
								).toFixed(2)
							: "0.00";
					const fmtTotal = sizeKey
						? formatValue(
								hoveredHeader.seriesTotal,
								sizeKey,
								formatRules,
							)
						: hoveredHeader.seriesTotal;
					return (
						<div
							style={{
								position: "fixed",
								left: hoveredHeader.mouseX + 12,
								top: hoveredHeader.mouseY + 12,
								zIndex: 9999,
								background: "#fff",
								border: "1px solid #e2e8f0",
								borderRadius: 6,
								padding: "8px 12px",
								fontSize: 12,
								lineHeight: 1.7,
								boxShadow: "0 2px 8px rgba(0,0,0,.12)",
								minWidth: 160,
								pointerEvents: "none",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									fontWeight: 600,
								}}
							>
								<span
									style={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										background: hoveredHeader.fill,
										display: "inline-block",
										flexShrink: 0,
									}}
								/>
								{hoveredHeader.seriesName}
							</div>
							<div style={{ paddingLeft: 14 }}>
								total for {aggType} of {sizeKey}: {fmtTotal} (
								{pct}%)
							</div>
						</div>
					);
				})()}
		</div>
	);
}
