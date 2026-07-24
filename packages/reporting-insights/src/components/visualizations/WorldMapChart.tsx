import { Globe } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import {
	ComposableMap,
	Geographies,
	Geography,
	Marker,
} from "react-simple-maps";
import worldGeoData from "world-atlas/countries-110m.json";
import {
	type ColorPalette as ColorPaletteType,
	DEFAULT_WORLDMAP_STYLING,
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

//  Aggregation helper (mirrors KPI/Pivot semantics)
function aggregate(values: unknown[], aggregation: string): number {
	const nums = values.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
	if (!nums.length) return 0;
	switch (aggregation) {
		case "sum":
			return nums.reduce((s, v) => s + v, 0);
		case "avg":
			return nums.reduce((s, v) => s + v, 0) / nums.length;
		case "min":
			return Math.min(...nums);
		case "max":
			return Math.max(...nums);
		case "count":
			return values.length;
		case "countUnique":
			return new Set(values).size;
		default:
			return nums.reduce((s, v) => s + v, 0);
	}
}

// Aggregated marker shape (one per unique label)
export interface WorldMapPoint {
	label: string;
	latitude: number;
	longitude: number;
	/** Aggregated size value, undefined if no Size column configured */
	sizeValue?: number;
	/** Categorical color value, undefined if no Color column configured */
	colorCategory?: string;
	/** Aggregated tooltip extra values keyed by column name */
	tooltipValues?: Record<string, number | string>;
}

/** Aggregate raw rows into one marker per label.
 *  Rows sharing the same Label are grouped; latitude/longitude take the first
 *  observed value (lat/lon should be intrinsic to a label). Size and Tooltip
 *  values aggregate per `columnAggregations`; Color picks the first value. */
export function aggregateWorldMapPoints(
	data: Record<string, unknown>[],
	config: VisualizationConfig | undefined,
): WorldMapPoint[] {
	const labelKey = config?.label;
	const latKey = config?.latitudeKey;
	const lonKey = config?.longitudeKey;
	const sizeKey = config?.size;
	const colorKey = config?.color;
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
	if (!labelKey || !latKey || !lonKey) return [];

	const grouped = new Map<
		string,
		{
			label: string;
			lat: number;
			lon: number;
			sizeValues: unknown[];
			colorCategory?: string;
			_tooltipValues: Record<string, unknown[]>;
		}
	>();

	for (const row of data) {
		const label = String(row[labelKey] ?? "").trim();
		const lat = Number(row[latKey]);
		const lon = Number(row[lonKey]);
		if (!label || Number.isNaN(lat) || Number.isNaN(lon)) continue;

		const existing = grouped.get(label);
		if (!existing) {
			const _tooltipValues: Record<string, unknown[]> = {};
			for (const { column } of tooltipEntries)
				_tooltipValues[column] = [row[column]];
			grouped.set(label, {
				label,
				lat,
				lon,
				sizeValues: sizeKey ? [row[sizeKey]] : [],
				colorCategory: colorKey
					? String(row[colorKey] ?? "")
					: undefined,
				_tooltipValues,
			});
		} else {
			if (sizeKey) existing.sizeValues.push(row[sizeKey]);
			for (const { column } of tooltipEntries) {
				if (!existing._tooltipValues[column])
					existing._tooltipValues[column] = [];
				existing._tooltipValues[column].push(row[column]);
			}
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
			latitude: g.lat,
			longitude: g.lon,
			sizeValue:
				sizeKey && sizeAgg
					? aggregate(g.sizeValues, sizeAgg)
					: undefined,
			colorCategory: g.colorCategory,
			tooltipValues: Object.keys(tooltipValues).length
				? tooltipValues
				: undefined,
		};
	});
}

interface WorldMapChartProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	/** Optional explicit palette override (otherwise reads `config.styling.colorPalette`). */
	palette?: string[];
}

export function WorldMapChart({ data, config, palette }: WorldMapChartProps) {
	const labelKey = config?.label;
	const latKey = config?.latitudeKey;
	const lonKey = config?.longitudeKey;
	const sizeKey = config?.size;
	const colorKey = config?.color;
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

	const styling = config?.styling?.worldmap ?? {};
	const showTooltip =
		styling.showTooltip ?? DEFAULT_WORLDMAP_STYLING.showTooltip;
	const showLegend =
		styling.showLegend ?? DEFAULT_WORLDMAP_STYLING.showLegend;
	const baseSize = styling.markerSize ?? DEFAULT_WORLDMAP_STYLING.markerSize;
	const minSize =
		styling.markerSizeMin ?? DEFAULT_WORLDMAP_STYLING.markerSizeMin;
	const maxSize =
		styling.markerSizeMax ?? DEFAULT_WORLDMAP_STYLING.markerSizeMax;

	// Resolve palette from config.styling.colorPalette → fall back to default
	const resolvedPalette = useMemo(() => {
		if (palette?.length) return palette;
		const cp = config?.styling?.colorPalette as
			| ColorPaletteType
			| undefined;
		return cp?.colors?.length ? cp.colors : DEFAULT_PALETTE;
	}, [palette, config?.styling?.colorPalette]);

	const points = useMemo(
		() => aggregateWorldMapPoints(data, config),
		[data, config],
	);

	// Color category index (categorical → palette color)
	const colorIndex = useMemo(() => {
		if (!colorKey) return new Map<string, string>();
		const cats = Array.from(
			new Set(
				points.map((p) => p.colorCategory).filter(Boolean) as string[],
			),
		);
		const map = new Map<string, string>();
		cats.forEach((cat, i) =>
			map.set(cat, resolvedPalette[i % resolvedPalette.length]),
		);
		return map;
	}, [points, colorKey, resolvedPalette]);

	// Linear scale of size values to [minSize, maxSize]
	const sizeScale = useMemo(() => {
		if (!sizeKey) return () => baseSize;
		const sizes = points.map((p) => p.sizeValue ?? 0);
		const lo = Math.min(...sizes);
		const hi = Math.max(...sizes);
		const range = hi - lo;
		if (range <= 0) return () => baseSize;
		return (v: number | undefined) => {
			if (v == null) return minSize;
			return minSize + ((v - lo) / range) * (maxSize - minSize);
		};
	}, [points, sizeKey, baseSize, minSize, maxSize]);

	const [hovered, setHovered] = useState<{
		point: WorldMapPoint;
		x: number;
		y: number;
	} | null>(null);

	//  No-data guard
	if (!labelKey || !latKey || !lonKey) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="px-6 text-center text-slate-400">
					<Globe className="mx-auto mb-3 h-12 w-12 opacity-30" />
					<p className="font-medium text-sm">No data configured</p>
					<p className="mt-1 text-xs">
						Drop columns into Label, Latitude, and Longitude
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex h-full w-full flex-col">
			<div className="relative min-h-0 flex-1">
				<ComposableMap
					projection="geoEqualEarth"
					projectionConfig={{ scale: 155 }}
					style={{ width: "100%", height: "100%" }}
				>
					{/* Country outlines */}
					<Geographies
						geography={
							worldGeoData as unknown as Record<string, unknown>
						}
					>
						{
							(({ geographies }: { geographies: unknown[] }) =>
								geographies.map((geo, i) => (
									<Geography
										// react-simple-maps geography objects expose `rsmKey`
										key={
											(geo as { rsmKey?: string })
												.rsmKey ?? `geo-${i}`
										}
										geography={geo}
										style={{
											default: {
												fill: "#e2e8f0",
												stroke: "#cbd5e1",
												strokeWidth: 0.5,
												outline: "none",
											},
											hover: {
												fill: "#cbd5e1",
												outline: "none",
											},
											pressed: {
												fill: "#cbd5e1",
												outline: "none",
											},
										}}
									/>
								))) as unknown as (data: {
								geographies: unknown[];
							}) => void
						}
					</Geographies>

					{/* Markers */}
					{points.map((p) => {
						const radius = sizeScale(p.sizeValue);
						const fill =
							colorKey && p.colorCategory
								? (colorIndex.get(p.colorCategory) ??
									resolvedPalette[0])
								: resolvedPalette[0];
						return (
							<Marker
								key={p.label}
								coordinates={[p.longitude, p.latitude]}
								onMouseEnter={(
									e: React.MouseEvent<SVGPathElement>,
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
							>
								<circle
									r={radius}
									fill={fill}
									fillOpacity={0.75}
									stroke="#fff"
									strokeWidth={1}
									style={{ cursor: "pointer" }}
								/>
							</Marker>
						);
					})}
				</ComposableMap>

				{/* Tooltip popover (anchored to cursor inside the SVG container) */}
				{showTooltip && hovered && (
					<div
						className="pointer-events-none absolute z-10 min-w-[180px] rounded border border-slate-200 bg-white p-2 text-xs shadow-lg"
						style={tooltipStyle(hovered.x, hovered.y)}
					>
						{/* Color swatch + label header */}
						<div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
							<span
								className="inline-block h-2 w-2 rounded-full"
								style={{
									background:
										colorKey && hovered.point.colorCategory
											? (colorIndex.get(
													hovered.point.colorCategory,
												) ?? resolvedPalette[0])
											: resolvedPalette[0],
								}}
							/>
							{hovered.point.label}
						</div>
						<div className="text-slate-700">
							Coordinates:{" "}
							<span className="font-medium tabular-nums">
								({hovered.point.latitude.toFixed(3)},{" "}
								{hovered.point.longitude.toFixed(3)})
							</span>
						</div>
						{sizeKey && hovered.point.sizeValue !== undefined && (
							<div className="text-slate-700">
								{sizeKey} (
								{config?.columnAggregations?.[sizeKey] || "sum"}
								):{" "}
								<span className="font-medium tabular-nums">
									{Number(
										hovered.point.sizeValue,
									).toLocaleString(undefined, {
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						)}
						{colorKey && hovered.point.colorCategory && (
							<div className="text-slate-700">
								{colorKey}:{" "}
								<span className="font-medium">
									{hovered.point.colorCategory}
								</span>
							</div>
						)}
						{tooltipEntries.map(({ column, aggregation }) =>
							hovered.point.tooltipValues?.[column] !==
							undefined ? (
								<div
									key={column}
									className="mt-1 border-slate-200 border-t pt-1 text-slate-700"
								>
									{column} ({aggregation}):{" "}
									<span className="font-medium tabular-nums">
										{typeof hovered.point.tooltipValues![
											column
										] === "number"
											? hovered.point.tooltipValues![
													column
												].toLocaleString(undefined, {
													maximumFractionDigits: 2,
												})
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

			{/* Legend (only meaningful when Color column is set) */}
			{showLegend && colorKey && colorIndex.size > 0 && (
				<div className="flex flex-shrink-0 flex-wrap gap-x-4 gap-y-1 border-slate-100 border-t px-3 py-2 text-[11px] text-slate-600">
					{Array.from(colorIndex.entries()).map(([cat, color]) => (
						<span
							key={cat}
							className="inline-flex items-center gap-1.5"
						>
							<span
								className="inline-block h-2.5 w-2.5 rounded-full"
								style={{ background: color }}
							/>
							{cat}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

/* ── Tooltip placement: nudge so it never extends past the right/bottom edge ─ */
function tooltipStyle(x: number, y: number): CSSProperties {
	return {
		left: x + 12,
		top: y + 12,
		// Use translate(-100%) when near edges if needed — keep simple for now
	};
}
