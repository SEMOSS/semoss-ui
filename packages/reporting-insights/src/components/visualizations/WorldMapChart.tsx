import L from "leaflet";
import { Globe } from "lucide-react";
import {
	type CSSProperties,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	CircleMarker,
	MapContainer,
	TileLayer,
	Tooltip,
	useMap,
} from "react-leaflet";
import { formatValue } from "@/lib/formatValue";
import {
	type ColorPalette as ColorPaletteType,
	DEFAULT_WORLDMAP_STYLING,
	type FormatRule,
	type VisualizationConfig,
	type VizEvent,
	type VizTriggerPayload,
	type WorldMapLayer,
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

interface TileLayerConfig {
	url: string;
	attribution: string;
	maxZoom?: number;
	subdomains?: string[];
}

// Tile layer configs keyed by WorldMapLayer
const TILE_LAYERS: Record<WorldMapLayer, TileLayerConfig | null> = {
	streets: {
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	},
	openstreet: {
		url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://hot.openstreetmap.org/">HOT</a>',
	},
	"satellite-esri": {
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		attribution:
			"Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
		maxZoom: 18,
	},
	"streets-esri": {
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
		attribution:
			"Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
	},
	light: {
		url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 19,
	},
	"city-lights": {
		url: "https://map{s}.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg",
		attribution:
			'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
		maxZoom: 8,
		subdomains: ["1", "2"],
	},
	dark: {
		url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 19,
	},
	topographic: {
		url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
		attribution:
			'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
		maxZoom: 17,
	},
	"no-label": {
		url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 19,
	},
	none: null,
};

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
	/** First raw data row contributing to this marker — used for event filter matching */
	rawRow?: Record<string, unknown>;
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
			_firstRow: Record<string, unknown>;
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
				_firstRow: row,
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
			if (vals.length) {
				tooltipValues[column] =
					aggregation === "raw"
						? String(g._firstRow[column] ?? "")
						: aggregate(vals, aggregation);
			}
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
			rawRow: g._firstRow,
		};
	});
}

// Fallback used only for the MapContainer's required initial center/zoom props before
// the MapViewController has a chance to fit to actual data bounds.
const FALLBACK_CENTER: [number, number] = [20, 0];
const FALLBACK_ZOOM = 2;

/** Fit the map to the bounding box of all points. Non-animated on first call, animated on subsequent calls. */
function fitToPoints(
	map: L.Map,
	points: WorldMapPoint[],
	focusZoom: number,
	animate: boolean,
) {
	if (!points.length) return;
	if (points.length === 1) {
		if (animate)
			map.flyTo([points[0].latitude, points[0].longitude], focusZoom, {
				duration: 0.8,
			});
		else
			map.setView([points[0].latitude, points[0].longitude], focusZoom, {
				animate: false,
			});
		return;
	}
	const bounds = L.latLngBounds(
		points.map((p) => [p.latitude, p.longitude] as [number, number]),
	);
	if (animate) map.flyToBounds(bounds, { padding: [30, 30], duration: 0.8 });
	else map.fitBounds(bounds, { padding: [30, 30], animate: false });
}

/**
 * Lives inside MapContainer (so it can call useMap()):
 * - On first render with data, fits the map to the bounding box of all points.
 * - When focusPoint is set (filter event fired), flies to that single point.
 * - When focusPoint is cleared (unfilter event fired), flies back to show all points.
 */
function MapViewController({
	focusPoint,
	focusZoom,
	points,
}: {
	focusPoint: { lat: number; lon: number } | null;
	focusZoom: number;
	points: WorldMapPoint[];
}) {
	const map = useMap();
	const initialFitDone = useRef(false);

	// Initial fit-to-bounds: runs once when points first become available.
	useEffect(() => {
		if (initialFitDone.current || !points.length) return;
		initialFitDone.current = true;
		fitToPoints(map, points, focusZoom, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [points]);

	// Filter zoom-in / unfilter zoom-out.
	useEffect(() => {
		if (focusPoint !== null) {
			map.flyTo([focusPoint.lat, focusPoint.lon], focusZoom, {
				duration: 0.8,
			});
		} else if (initialFitDone.current && points.length) {
			fitToPoints(map, points, focusZoom, true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusPoint]);

	return null;
}

interface WorldMapChartProps {
	data: Record<string, unknown>[];
	config?: VisualizationConfig;
	/** Optional explicit palette override (otherwise reads `config.styling.colorPalette`). */
	palette?: string[];
	formatRules?: FormatRule[];
	onTrigger?: (payload: VizTriggerPayload) => void;
	/** Configured viz events — used to gate zoom-on-filter/unfilter behaviour. */
	events?: VizEvent[];
}

export function WorldMapChart({
	data,
	config,
	palette,
	formatRules = [],
	onTrigger,
	events,
}: WorldMapChartProps) {
	const labelKey = config?.label;
	const latKey = config?.latitudeKey;
	const lonKey = config?.longitudeKey;
	const sizeKey = config?.size;
	const hoveredPointRef = useRef<Record<string, unknown> | null>(null);
	// Stable ref so the keydown listener always calls the latest onTrigger without needing to re-attach.
	const onTriggerRef = useRef(onTrigger);
	onTriggerRef.current = onTrigger;
	// Debounce mouseout: Leaflet fires mouseout on the SVG circle whenever the mouse
	// enters the adjacent tooltip <div>, even though the user is still "hovering" the
	// point. Cancelling the pending mouseout when a mouseover fires within 50ms avoids
	// the spurious fire and only triggers when the mouse genuinely leaves the area.
	const mouseoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Fire keypress events while a point is hovered.
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!hoveredPointRef.current) return;
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			)
				return;
			onTriggerRef.current?.({
				trigger: "keypress",
				key: e.key,
				row: hoveredPointRef.current,
			});
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);
	const [focusedPoint, setFocusedPoint] = useState<{
		lat: number;
		lon: number;
	} | null>(null);

	// Map each trigger to the zoom action ('in' | 'out' | null) driven by its event action.
	// Any trigger bound to 'filter' zooms in; any trigger bound to 'unfilter' zooms out.
	const zoomOnTrigger = useMemo(() => {
		const enabled = events?.filter((e) => e.enabled) ?? [];
		const actionFor = (trigger: string): "in" | "out" | null => {
			const ev = enabled.find((e) => e.trigger === trigger);
			if (ev?.action === "filter") return "in";
			if (ev?.action === "unfilter") return "out";
			return null;
		};
		return {
			click: actionFor("click"),
			dblclick: actionFor("dblclick"),
			hover: actionFor("hover"),
			mouseout: actionFor("mouseout"),
		};
	}, [events]);

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
	const mapLayer = styling.mapLayer ?? DEFAULT_WORLDMAP_STYLING.mapLayer;

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

	const tileConfig = TILE_LAYERS[mapLayer];
	// Zoom level to fly to when a point is selected. Cap at a "city view" level so
	// we don't end up at street level on high-maxZoom tile layers.
	const focusZoom = Math.min((tileConfig?.maxZoom ?? 19) - 1, 12);

	return (
		<div className="relative flex h-full w-full flex-col">
			<div className="relative min-h-0 flex-1">
				<MapContainer
					center={FALLBACK_CENTER}
					zoom={FALLBACK_ZOOM}
					style={{ width: "100%", height: "100%" }}
					zoomControl={true}
					attributionControl={true}
				>
					{tileConfig && (
						<TileLayer
							key={mapLayer}
							url={tileConfig.url}
							attribution={tileConfig.attribution}
							maxZoom={tileConfig.maxZoom ?? 19}
							{...(tileConfig.subdomains
								? { subdomains: tileConfig.subdomains }
								: {})}
						/>
					)}

					<MapViewController
						focusPoint={focusedPoint}
						focusZoom={focusZoom}
						points={points}
					/>

					{points.map((p) => {
						const radius = sizeScale(p.sizeValue);
						const fill =
							colorKey && p.colorCategory
								? (colorIndex.get(p.colorCategory) ??
									resolvedPalette[0])
								: resolvedPalette[0];
						// Use the original raw data row so filter matching compares exact
						// column values (aggregated tooltipValues are transformed numbers
						// that won't match the raw strings in target visualizations).
						const buildRow = () =>
							p.rawRow ?? {
								...(labelKey ? { [labelKey]: p.label } : {}),
								...(latKey ? { [latKey]: p.latitude } : {}),
								...(lonKey ? { [lonKey]: p.longitude } : {}),
								...(colorKey
									? { [colorKey]: p.colorCategory }
									: {}),
							};
						return (
							<CircleMarker
								key={p.label}
								center={[p.latitude, p.longitude]}
								radius={radius}
								pathOptions={{
									fillColor: fill,
									fillOpacity: 0.75,
									color: "#fff",
									weight: 1,
								}}
								eventHandlers={{
									click: (e) => {
										const z = zoomOnTrigger.click;
										if (z === "in")
											setFocusedPoint({
												lat: p.latitude,
												lon: p.longitude,
											});
										else if (z === "out")
											setFocusedPoint(null);
										const row = buildRow();
										const oe = (e as any).originalEvent as
											| MouseEvent
											| undefined;
										onTrigger?.({
											trigger: "click",
											label: p.label,
											row,
											modifiers: {
												ctrl: !!oe?.ctrlKey,
												shift: !!oe?.shiftKey,
												alt: !!oe?.altKey,
											},
										});
									},
									dblclick: (e) => {
										const z = zoomOnTrigger.dblclick;
										if (z === "in")
											setFocusedPoint({
												lat: p.latitude,
												lon: p.longitude,
											});
										else if (z === "out")
											setFocusedPoint(null);
										const oe = (e as any).originalEvent as
											| MouseEvent
											| undefined;
										onTrigger?.({
											trigger: "dblclick",
											label: p.label,
											row: buildRow(),
											modifiers: {
												ctrl: !!oe?.ctrlKey,
												shift: !!oe?.shiftKey,
												alt: !!oe?.altKey,
											},
										});
									},
									mouseover: () => {
										// Cancel any pending mouseout — mouse re-entered a point.
										if (mouseoutTimerRef.current) {
											clearTimeout(
												mouseoutTimerRef.current,
											);
											mouseoutTimerRef.current = null;
										}
										hoveredPointRef.current = buildRow();
										const z = zoomOnTrigger.hover;
										if (z === "in")
											setFocusedPoint({
												lat: p.latitude,
												lon: p.longitude,
											});
										else if (z === "out")
											setFocusedPoint(null);
										onTrigger?.({
											trigger: "hover",
											label: p.label,
											row: buildRow(),
										});
									},
									mouseout: () => {
										const row = buildRow();
										const z = zoomOnTrigger.mouseout;
										// Debounce: only fire if the mouse doesn't re-enter a point within 50ms.
										// Leaflet fires mouseout on the SVG circle when the mouse enters the
										// adjacent tooltip <div>, making mouseout appear to fire while the user
										// is still visually "hovering". The 50ms window absorbs that gap.
										mouseoutTimerRef.current = setTimeout(
											() => {
												mouseoutTimerRef.current = null;
												hoveredPointRef.current = null;
												if (z === "in")
													setFocusedPoint({
														lat: p.latitude,
														lon: p.longitude,
													});
												else if (z === "out")
													setFocusedPoint(null);
												onTrigger?.({
													trigger: "mouseout",
													label: p.label,
													row,
												});
											},
											50,
										);
									},
								}}
							>
								{showTooltip && (
									<Tooltip>
										<TooltipContent
											point={p}
											labelKey={labelKey}
											latKey={latKey}
											lonKey={lonKey}
											sizeKey={sizeKey}
											colorKey={colorKey}
											tooltipEntries={tooltipEntries}
											colorIndex={colorIndex}
											resolvedPalette={resolvedPalette}
											columnAggregations={
												config?.columnAggregations
											}
											formatRules={formatRules}
										/>
									</Tooltip>
								)}
							</CircleMarker>
						);
					})}
				</MapContainer>
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

// Tooltip content rendered inside Leaflet's Tooltip component
interface TooltipContentProps {
	point: WorldMapPoint;
	labelKey: string;
	latKey: string;
	lonKey: string;
	sizeKey: string | undefined;
	colorKey: string | undefined;
	tooltipEntries: Array<{ column: string; aggregation: string }>;
	colorIndex: Map<string, string>;
	resolvedPalette: string[];
	columnAggregations: Record<string, string> | undefined;
	formatRules: FormatRule[];
}

function TooltipContent({
	point,
	labelKey,
	latKey,
	lonKey,
	sizeKey,
	colorKey,
	tooltipEntries,
	colorIndex,
	resolvedPalette,
	columnAggregations,
	formatRules,
}: TooltipContentProps) {
	const fill =
		colorKey && point.colorCategory
			? (colorIndex.get(point.colorCategory) ?? resolvedPalette[0])
			: resolvedPalette[0];

	return (
		<div
			className="min-w-[180px] text-xs"
			style={{ fontFamily: "inherit" } as CSSProperties}
		>
			<div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
				<span
					className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
					style={{ background: fill }}
				/>
				{formatValue(point.label, labelKey, formatRules)}
			</div>
			<div className="text-slate-700">
				Coordinates:{" "}
				<span className="font-medium tabular-nums">
					({formatValue(point.latitude, latKey, formatRules)},{" "}
					{formatValue(point.longitude, lonKey, formatRules)})
				</span>
			</div>
			{sizeKey && point.sizeValue !== undefined && (
				<div className="text-slate-700">
					{sizeKey} ({columnAggregations?.[sizeKey] || "sum"}):{" "}
					<span className="font-medium tabular-nums">
						{formatValue(point.sizeValue, sizeKey, formatRules)}
					</span>
				</div>
			)}
			{colorKey && point.colorCategory && (
				<div className="text-slate-700">
					{colorKey}:{" "}
					<span className="font-medium">
						{formatValue(
							point.colorCategory,
							colorKey,
							formatRules,
						)}
					</span>
				</div>
			)}
			{tooltipEntries.map(({ column, aggregation }) =>
				point.tooltipValues?.[column] !== undefined ? (
					<div
						key={column}
						className="mt-1 border-slate-200 border-t pt-1 text-slate-700"
					>
						{column}
						{aggregation !== "raw" ? ` (${aggregation})` : ""}:{" "}
						<span className="font-medium tabular-nums">
							{formatValue(
								point.tooltipValues?.[column],
								column,
								formatRules,
							)}
						</span>
					</div>
				) : null,
			)}
		</div>
	);
}
