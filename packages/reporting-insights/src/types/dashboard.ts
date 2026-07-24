import type { VizFilterGroup } from "@/lib/vizFilter";

export interface Parameter {
	id: string;
	name: string; // Used in query as {{name}}
	label: string; // Human-readable display name
	defaultValue: string;
	/**
	 * How the value is entered at view time:
	 *  - 'text'        free input (default)
	 *  - 'dropdown'    single choice with typeahead
	 *  - 'multiselect' many choices → substituted as a SQL list ('a','b') for `IN (...)`
	 *  - 'date'        date picker
	 */
	inputType?: "text" | "dropdown" | "multiselect" | "date";
	/** Whether a value is required before the query can run. */
	required?: boolean;
	/** Dropdown/multiselect: manually-entered options (merged with any SQL-fetched ones). */
	options?: string[];
	/** Dropdown/multiselect: SQL whose FIRST column becomes the option list (distinct values). */
	optionsQuery?: string;
	/** Dropdown/multiselect: database to run `optionsQuery` against (defaults to the visualization's database). */
	optionsDatabaseId?: string;
}

export type VisualizationType =
	| "bar"
	| "stackbar"
	| "line"
	| "pie"
	| "area"
	| "table"
	| "scatter"
	| "radar"
	| "treemap"
	| "pivot"
	| "kpi"
	| "worldmap"
	| "heatmap"
	| "halfdonut"
	| "boxplot"
	| "polarbar"
	| "cluster"
	| "htmlblock"
	| "multiline"
	| "wordcloud"
	| "bubble"
	| "sunburst"
	| "puck"
	| "csvexport"
	| "filter";

/** Width in a 12-column grid: quarter (3), third (4), half (6), full (12) */
export type ColSpan = 3 | 4 | 6 | 12;

/** Per-visualization display configuration — all fields optional for backward compat */
export interface VisualizationConfig {
	/** Column used as the X axis / category dimension */
	xKey?: string;
	/** Columns used as Y axis value series (multiple = multi-series chart) */
	yKeys?: string[];
	/** Scatter: label column for point identification */
	label?: string;
	/** Scatter: size column for point sizing */
	size?: string;
	/** Scatter: color column for point coloring */
	color?: string;
	/** Tooltip: additional columns to show on hover, each with its own aggregation */
	tooltips?: Array<{ column: string; aggregation: string }>;
	/** @deprecated Use tooltips[] — kept for reading legacy saved configs */
	tooltip?: string;
	/** @deprecated Use tooltips[] */
	tooltipAggregation?: string;
	/** Custom label shown on the X axis */
	xLabel?: string;
	/** Custom label shown on the Y axis */
	yLabel?: string;
	/** Rows shown per page in table visualizations (default 50) */
	tablePageSize?: number;
	/** KPI: how to aggregate the value column(s) */
	kpiAggregation?: "sum" | "avg" | "count" | "max" | "min" | "last";
	/** Per-column aggregations for KPI metrics (column name → aggregation type) */
	columnAggregations?: Record<string, string>;
	/** KPI: how to format the displayed number */
	kpiFormat?: "auto" | "number" | "currency" | "percent";
	/** KPI: optional prefix added before each value (e.g. "$") */
	kpiPrefix?: string;
	/** KPI: optional suffix added after each value (e.g. "%") */
	kpiSuffix?: string;
	/** KPI: number of decimal places to round to. 'auto' = up to 2, trimmed. */
	kpiDecimals?: number | "auto";
	/** KPI: 'compact' renders metric notation (1.2K, 3.4M); 'standard' spells it out. */
	kpiNotation?: "standard" | "compact";
	/** KPI: thousands grouping delimiter ('none' disables grouping). */
	kpiThousandsSep?: "," | "." | " " | "none";
	/** KPI: decimal delimiter. */
	kpiDecimalSep?: "." | ",";
	/**
	 * Column type map populated from SEMOSS headerInfo at test-query time.
	 * Values mirror the SEMOSS `type` field: "NUMBER", "STRING", "DATE", etc.
	 * Used by DashboardVisualization to determine sensible axis defaults without
	 * having to sample row values at render time.
	 */
	columnTypes?: Record<string, string>;
	/** Table: ordered list of visible column names (omitted columns are hidden) */
	tableColumns?: string[];
	/** Heatmap: column for the Y axis categories (X axis uses xKey, value uses yKeys[0]) */
	heatmapYKey?: string;
	/** World Map: column with numeric latitude values (–90..90) */
	/** Sunburst: ordered hierarchy level columns (first = innermost ring) */
	sunburstLevels?: string[];
	/** Puck: ordered group columns that define nesting depth (first = outermost ring) */
	puckGroups?: string[];
	latitudeKey?: string;
	/** World Map: column with numeric longitude values (–180..180) */
	longitudeKey?: string;
	/** HTML Block: the HTML content to render in the iframe */
	htmlContent?: string;
	/** HTML Block: the LLM prompt used to generate content (persisted for re-use) */
	llmPrompt?: string;
	/** HTML Block: the selected LLM model engine ID */
	llmModel?: string;
	/** Pivot: dimension columns used for vertical row grouping (in order) */
	pivotRows?: string[];
	/** Pivot: dimension columns whose values become dynamic column headers (crosstab) */
	pivotColumns?: string[];
	/** Pivot: measure columns aggregated for each row/column intersection */
	pivotValues?: string[];
	/** Multi-line: the column whose unique values become separate lines */
	categoryKey?: string;
	/** Stacked bar: the column whose unique values become the stacked series (facet). */
	facetKey?: string;
	/** Facet navigation: column whose unique values are paginated through at the bottom of the chart. Applied to all chart types except stackbar (which uses facetKey for stacking). */
	facetColumn?: string;
	/** CSV Export: optional custom label for the export button */
	csvExportLabel?: string;
	/** CSV Export: ordered list of columns to include (undefined = all query columns) */
	exportColumns?: string[];
	/** CSV Export: per-column aggregation function ('sum'|'count'|'avg'|'min'|'max'). Columns absent from this map are exported raw; raw columns become GROUP BY keys when any aggregation is present. */
	exportAggregations?: Record<string, string>;
	/** CSV Export: button background color (hex) */
	buttonBgColor?: string;
	/** CSV Export: CSS border-style (solid | dashed | dotted | double) */
	borderStyle?: string;
	/** CSS border-width value in px */
	borderWidth?: string;
	/** CSS border-color (hex) */
	borderColor?: string;
	/** CSS font-size value (number as string, paired with fontSizeUnit) */
	fontSize?: string;
	/** CSS font-size unit: 'px' | 'em' | '%' */
	fontSizeUnit?: string;
	/** CSS color for button text */
	fontColor?: string;
	/** CSS text-align for the button label */
	textAlign?: "left" | "center" | "right";
	/** CSS height value for the button (number as string, paired with buttonHeightUnit) */
	buttonHeight?: string;
	/** CSS height unit: 'px' | 'em' | '%' */
	buttonHeightUnit?: string;
	/** CSS width value for the button (number as string, paired with buttonWidthUnit) */
	buttonWidth?: string;
	/** CSS width unit: 'px' | 'em' | '%' */
	buttonWidthUnit?: string;
	/** Horizontal alignment of the button within the visualization container */
	alignment?: "left" | "center" | "right";
	/** Filter widget: the column whose value is applied to the targeted frames */
	filterColumn?: string;
	/** Filter widget: ids of the visualizations this filter applies to */
	filterTargets?: string[];
	/** Filter widget: values pre-selected when the dashboard loads (saved from editor preview) */
	filterDefaultValues?: string[];
	/** Visual styling and behavior configuration for the visualization */
	styling?: VisualizationStyling;
}

/** Axis configuration shared by chart types that expose the X/Y axis editor. */
export interface AxisConfig {
	title?: string;
	fontSize?: number;
	axisGap?: number;
	showLabels?: boolean;
	rotateValues?: number; // degrees, e.g. -45
	flipAxis?: boolean;
	/** Whether to render small tick marks at each axis label (default true). */
	showTicks?: boolean;
}

/**
 * Curve / step shape used by Bar trendlines and Line `curveType`. Names
 * mirror the labels shown in the editor (Exact, Smooth, Step Start/Mid/End)
 * and map to recharts `type` values at render time.
 */
export type CurveType =
	| "exact"
	| "smooth"
	| "stepStart"
	| "stepMiddle"
	| "stepEnd";

/**
 * Composite value-label configuration shared by Line and Pie value-label
 * editors. Bar uses a simple boolean toggle (`BarStyling.showValueLabels`).
 */
export interface ValueLabelConfig {
	show?: boolean;
	/** Position relative to the data point. Allowed values vary by chart type. */
	position?: "top" | "bottom" | "inside" | "outside" | "center";
	/** Rotation in degrees, e.g. -45 */
	rotate?: number;
	align?: "left" | "center" | "right";
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: "normal" | "medium" | "semibold" | "bold";
	color?: string;
}

/** Multi-line chart–specific styling configuration */
export interface MultiLineStyling {
	showAverage?: boolean;
	curveType?:
		| "linear"
		| "monotone"
		| "natural"
		| "step"
		| "stepAfter"
		| "stepBefore";
	showValueLabels?: boolean;
	xAxisConfig?: AxisConfig;
	yAxisConfig?: AxisConfig;
	showTrendline?: boolean;
	showTooltip?: boolean;
}

/** Box plot–specific styling configuration */
export interface BoxPlotStyling {
	/** Show outlier dots for values beyond 1.5×IQR (default true) */
	showOutliers?: boolean;
	/** Whisker extent: 'minmax' extends to absolute min/max; 'iqr' caps at 1.5×IQR (default 'iqr') */
	whiskerType?: "minmax" | "iqr";
	/** Box fill opacity 0.1–1.0 (default 0.6) */
	fillOpacity?: number;
}

/** Cluster chart–specific styling configuration */
export interface ClusterStyling {
	/** Radius of each dot in px, 2–12 (default 5) */
	dotRadius?: number;
	/** Show horizontal mean line per cluster (default false) */
	showMean?: boolean;
	/** Dot fill opacity 0–1 (default 0.7) */
	fillOpacity?: number;
}

/** Styling configuration for visualizations */
export interface VisualizationStyling {
	/** Shared: Chart title styling (available for all viz types). For KPI this
	 *  acts as the *default* title applied to every card; per-card overrides
	 *  live on `kpi.titles[metricColumn]` (see {@link KpiStyling.titles}). */
	title?: ChartTitleConfig;
	/** Shared: Color palette for chart series */
	colorPalette?: ColorPalette;
	/**
	 * Shared: explicit size + placement of the rendered visualization *inside* its
	 * panel (does not affect the flexlayout panel itself). `width`/`height` are CSS
	 * length strings ('80%', '320px', '50vh'); when unset the content fills the
	 * panel. `align`/`valign` position the content when it's smaller than the panel.
	 */
	size?: {
		width?: string;
		height?: string;
		align?: "start" | "center" | "end";
		valign?: "start" | "center" | "end";
		/**
		 * Stretch the visualization to completely fill its box, overriding the
		 * element's natural aspect ratio. For radial/SVG charts this distorts the
		 * shape to fill (e.g. a round pie becomes an oval); for intrinsic-size
		 * widgets like the CSV-export button it makes the element grow to fill.
		 * When false (default) the element keeps its natural aspect and centers.
		 */
		stretch?: boolean;
	};
	/** Custom color palettes storage */
	customColorPalettes?: ColorPalette[];
	/** KPI-specific styling and behavior configuration */
	kpi?: KpiStyling;
	/** Table-specific styling and behavior configuration */
	table?: {
		header?: ColumnStyling;
		cell?: ColumnStyling;
		wrapText?: WrapTextConfig;
		rowSpanning?: boolean;
		showExport?: boolean;
		colorRules?: ColorRule[];
		fitContainerWidth?: boolean;
		/** Initial rows shown per page. Empty string is allowed while editing but is
		 *  rejected on save (see dashboard save validation). Defaults to 50 at runtime. */
		pageSize?: number | "";
	};
	/** Pivot-specific styling and behavior configuration */
	pivot?: PivotStyling;
	/** Heatmap-specific styling */
	heatmap?: HeatmapStyling;
	/** World Map–specific styling and behavior configuration */
	worldmap?: WorldMapStyling;
	/** Half Donut–specific styling and behavior configuration */
	halfdonut?: HalfDonutStyling;
	/** Box plot–specific styling and behavior configuration */
	boxplot?: BoxPlotStyling;
	/** Polar Bar–specific styling and behavior configuration */
	polarbar?: PolarBarStyling;
	/** Cluster chart–specific styling and behavior configuration */
	cluster?: ClusterStyling;
	/** Multi-line chart–specific styling and behavior configuration */
	multiline?: MultiLineStyling;
	/** Word Cloud–specific styling and behavior configuration */
	wordcloud?: WordCloudStyling;
	/** Bubble chart–specific styling and behavior configuration */
	bubble?: BubbleStyling;
	/** Puck chart–specific styling and behavior configuration */
	puck?: PuckStyling;
	/** Sunburst–specific styling and behavior configuration */
	sunburst?: SunburstStyling;
	/** Bar chart–specific styling and behavior configuration */
	bar?: BarStyling;
	/** Line chart–specific styling and behavior configuration */
	line?: LineStyling;
	/** Pie chart–specific styling and behavior configuration */
	pie?: PieStyling;
	/**
	 * Shared "Filter Visualization" tool: an author-defined rule tree that always
	 * filters THIS visualization's own rows (client-side) before it renders.
	 * Distinct from the cross-frame Filter widget. See `@/lib/vizFilter`.
	 */
	vizFilter?: VizFilterGroup;
	/**
	 * Shared "Sort Values" tool: ordered list of sort rules applied client-side
	 * after filtering. See `@/lib/vizSort`.
	 */
	sortValues?: SortRule[];
	/**
	 * Shared "Format Data Values" tool: per-column display formatting rules
	 * (prepend/append, numeric format, date format).
	 */
	formatRules?: FormatRule[];
}

export type SortDirection = "asc" | "desc" | "chronological" | "custom";

// ─── Format Data Values ────────────────────────────────────────────────────
export type FormatRuleType = "int" | "string" | "double" | "date";
export type DefaultNumericFormat =
	| "raw"
	| "comma"
	| "dollar"
	| "dollar-comma"
	| "percent"
	| "k"
	| "M"
	| "B"
	| "T"
	| "accounting"
	| "scientific";
export type FormatNumberMode =
	| "none"
	| "thousand"
	| "million"
	| "billion"
	| "trillion"
	| "accounting"
	| "scientific"
	| "percentage";
export type FormatDelimiter = "none" | "comma" | "period";

export interface FormatRule {
	id: string;
	column: string;
	type: FormatRuleType;
	prepend?: string;
	append?: string;
	/** Numeric (int / double) — use one of the preset format strings. */
	useDefaultFormat?: boolean;
	defaultFormat?: DefaultNumericFormat;
	/** Numeric (int / double) — manual format controls (used when useDefaultFormat is false). */
	formatNumber?: FormatNumberMode;
	roundValue?: number;
	delimiter?: FormatDelimiter;
	/** Date — strftime-style format string. */
	dateFormat?: string;
}

export interface SortRule {
	id: string;
	column: string;
	direction: SortDirection;
	/** Values in display order, used when direction === 'custom'. */
	customOrder?: string[];
}

/**
 * Title styling shared by chart titles and per-KPI-card title overrides.
 * `text` / `fontSize` / `color` are required so the editor can render a
 * complete preview without any undefined fall-throughs.
 */
export interface ChartTitleConfig {
	text: string;
	fontSize: number;
	color: string;
	textAlign?: "left" | "center" | "right";
	fontWeight?: "normal" | "medium" | "semibold" | "bold";
	fontFamily?: string;
}

/** Pivot-specific styling and behavior configuration */
export interface PivotStyling {
	/** Show / hide totals at various levels */
	showTotals?: {
		/** Master toggle — when true, both row and column grand totals are shown */
		all?: boolean;
		/** Show the grand-total row at the bottom of the pivot */
		rows?: boolean;
		/** Show the grand-total column at the right of the pivot */
		columns?: boolean;
		/** Show subtotal rows for each parent level when there are multi-dimensional rows */
		subtotals?: boolean;
	};
}

/** Column-specific styling configuration */
export interface ColumnStyling {
	/** Columns to apply styling to (empty array = all columns) */
	columns: string[];
	fontSize?: number;
	color?: string;
	backgroundColor?: string;
	textAlign?: "left" | "center" | "right";
}

/** Text wrapping configuration */
export interface WrapTextConfig {
	columns: string[];
	enabled: boolean;
}

/** Conditional formatting rule */
export interface ColorRule {
	id: string;
	/** Column to apply color to */
	targetColumn: string;
	/** Color to apply (hex format) */
	color: string;
	/** Whether to color the entire row instead of just the cell */
	colorEntireRow: boolean;
	/** Column to evaluate the condition against */
	valueColumn: string;
	/** Comparison operator */
	comparator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains";
	/** Value to compare against */
	value: string | number;
}

/** Color palette configuration */
export interface ColorPalette {
	label: string;
	colors: string[];
	isCustom: boolean;
	index?: number;
}

/** KPI threshold-based color rule */
export interface KpiColorRule {
	id: string;
	/** Which KPI metric column to evaluate */
	metricColumn: string;
	/** Comparison operator */
	comparator: "gt" | "lt" | "gte" | "lte" | "eq" | "neq" | "range";
	/** Value to compare against */
	value: number;
	/** Maximum value (for range comparator) */
	maxValue?: number;
	/** Color to apply (hex format) */
	color: string;
	/** Where to apply the color */
	applyTo: "background" | "value" | "trend";
}

/** KPI-specific styling configuration */
export interface KpiStyling {
	backgroundColor?: string;
	fontFamily?: string;
	fontSize?: number;
	fontColor?: string;
	textAlign?: "left" | "center" | "right";
	colorRules?: KpiColorRule[];
	showExport?: boolean;
	/**
	 * How to lay out multiple KPI cards. `'horizontal'` wraps cards in a row
	 * (current default), `'vertical'` stacks them in a single column, `'grid'`
	 * tiles them in an auto-fitting grid so they never run off the page. When
	 * only a single metric is configured the layout has no visible effect.
	 */
	layout?: "horizontal" | "vertical" | "grid";
	/**
	 * Per-metric title overrides keyed by metric column name. Falls back to
	 * `VisualizationStyling.title` when a column has no explicit override.
	 * Editor exposes a "Apply to" dropdown to pick which card's title to edit.
	 */
	titles?: Record<string, ChartTitleConfig>;
	/**
	 * Per-metric "Filter Visualization" rule trees keyed by metric column name.
	 * Each KPI card filters its own rows before aggregating, so cards built from
	 * the same query can show differently-filtered values. Editor exposes an
	 * "Apply to" dropdown to pick which card's filter to edit (see KpiFilterVisualization).
	 */
	vizFilters?: Record<string, VizFilterGroup>;
}

/** World Map–specific styling configuration */
/** Heatmap-specific styling configuration */
export interface HeatmapStyling {
	/** Color for the lowest value (default: light blue #dbeafe) */
	minColor?: string;
	/** Color for the highest value (default: dark blue #1d4ed8) */
	maxColor?: string;
	/** Show numeric value labels inside each cell */
	showValues?: boolean;
}

export interface WorldMapStyling {
	/** Whether to render a tooltip on hover (default true) */
	showTooltip?: boolean;
	/** Whether to render a color-category legend (default true) */
	showLegend?: boolean;
	/** Baseline marker radius (px) when no Size column is configured.
	 *  Also acts as the upper bound when Size is provided. Default 8. */
	markerSize?: number;
	/** Lower bound marker radius (px) when Size column drives sizing. Default 4. */
	markerSizeMin?: number;
	/** Upper bound marker radius (px) when Size column drives sizing. Default 18. */
	markerSizeMax?: number;
}

/** Default WorldMap styling values, applied as fallbacks at render time. */

/** Polar Bar–specific styling configuration */
export interface PolarBarStyling {
	/** Whether to render category name labels around the outside (default true) */
	showLabels?: boolean;
	/** Whether to render value labels at bar tips (default false) */
	showValues?: boolean;
	/** Fill opacity for bars (0.0–1.0, default 0.7) */
	fillOpacity?: number;
}

export const DEFAULT_WORLDMAP_STYLING: Required<
	Pick<
		WorldMapStyling,
		| "showTooltip"
		| "showLegend"
		| "markerSize"
		| "markerSizeMin"
		| "markerSizeMax"
	>
> = {
	showTooltip: true,
	showLegend: true,
	markerSize: 8,
	markerSizeMin: 4,
	markerSizeMax: 18,
};

/** Half Donut–specific styling configuration */
export interface HalfDonutStyling {
	/** Whether to render category name labels outside arcs (default true) */
	showLabels?: boolean;
	/** Whether to render value labels inside arcs (default false) */
	showValues?: boolean;
	/** Whether to render a compact horizontal legend below the chart (default true) */
	showLegend?: boolean;
	/** Donut hole size as a fraction of the outer radius, 0.3–0.8 (default 0.55) */
	innerRadius?: number;
}

/**
 * Cloud shape options used by the Word Cloud layout. Rectangle / circle /
 * ellipse use wordcloud2.js's built-in `circle` keyword (with custom
 * ellipticity for ellipse) or a polar function for rectangle. The remaining
 * shapes (triangle, diamond, pentagon, star, heart) use wordcloud2's
 * built-in shape keywords. Adding to this union should be the only type
 * change required when extending the shape set.
 */
export type WordCloudShape =
	| "rectangle"
	| "circle"
	| "ellipse"
	| "triangle"
	| "diamond"
	| "pentagon"
	| "star"
	| "heart";

/** Word Cloud–specific styling configuration */
export interface WordCloudStyling {
	/** Whether to render a tooltip on hover (default true) */
	showTooltip?: boolean;
	/** Minimum word rotation in degrees (default 0) */
	rotationMin?: number;
	/** Maximum word rotation in degrees (default 0) */
	rotationMax?: number;
	/** Step between discrete rotation choices in degrees (default 30) */
	rotationStep?: number;
	/** Layout shape for the word cloud (default 'rectangle') */
	shape?: WordCloudShape;
	/** Smallest font size (px) for the rarest word (default 12) */
	fontMin?: number;
	/** Largest font size (px) for the most frequent word (default 60) */
	fontMax?: number;
	/** Conditional color rules — reuses the table-shape `ColorRule` (target column = Words, value column = Size) */
	colorRules?: ColorRule[];
}

/** Default Word Cloud styling values, applied as fallbacks at render time. */
export const DEFAULT_WORDCLOUD_STYLING: Required<
	Pick<
		WordCloudStyling,
		| "showTooltip"
		| "rotationMin"
		| "rotationMax"
		| "rotationStep"
		| "shape"
		| "fontMin"
		| "fontMax"
	>
> = {
	showTooltip: true,
	rotationMin: 0,
	rotationMax: 0,
	rotationStep: 30,
	shape: "rectangle",
	fontMin: 12,
	fontMax: 60,
};

/** Bubble chart–specific styling configuration */
/** Sunburst–specific styling configuration */
export interface SunburstStyling {
	/** Inner hole radius as fraction of max radius (0–0.8). 0 = solid, default 0. */
	innerRadius?: number;
	/** Whether to render text labels on arc segments (default false). */
	showLabels?: boolean;
}

export interface BubbleStyling {
	/** Whether to render a tooltip popover on hover (default true) */
	showTooltip?: boolean;
	/** Whether to render a label + aggregated value beneath each bubble (default false) */
	showLabels?: boolean;
	/** Whether to render the legend below the chart (default true) */
	showLegend?: boolean;
	/** Conditional color rules — reuses the table-shape `ColorRule` (target column = Bubbles, value column = Size) */
	colorRules?: ColorRule[];
}

/** Default Bubble chart styling values, applied as fallbacks at render time. */
export const DEFAULT_BUBBLE_STYLING: Required<
	Pick<BubbleStyling, "showTooltip" | "showLabels" | "showLegend">
> = {
	showTooltip: true,
	showLabels: false,
	showLegend: true,
};

export interface PuckStyling {
	/** Whether to render a tooltip popover on hover (default true) */
	showTooltip?: boolean;
	/** Whether to render name + value labels inside leaf circles (default false) */
	showLabels?: boolean;
	/** Whether to render the legend below the chart (default true) */
	showLegend?: boolean;
	/** Conditional color rules applied to depth-1 (outermost group) circles */
	colorRules?: ColorRule[];
}

/** Default Puck chart styling values, applied as fallbacks at render time. */
export const DEFAULT_PUCK_STYLING: Required<
	Pick<PuckStyling, "showTooltip" | "showLabels" | "showLegend">
> = {
	showTooltip: true,
	showLabels: false,
	showLegend: true,
};

/** Bar chart–specific styling configuration */
export interface BarStyling {
	/** X axis editor (title / font / gap / labels / rotate / ticks / flip) */
	xAxisConfig?: AxisConfig;
	/** Y axis editor (title / font / gap / labels / rotate / ticks / flip) */
	yAxisConfig?: AxisConfig;
	/** Render numeric value labels at the top of each bar (default false) */
	showValueLabels?: boolean;
	/** Maximum bar width in px, 10–80 (default 60). Maps to recharts `maxBarSize`. */
	barWidth?: number;
	/** Trendline curve type. `'none'` hides the trendline. Default `'none'`. */
	trendlineType?: CurveType | "none";
	/** Whether to render the legend (default true when multi-series) */
	showLegend?: boolean;
	/** Conditional color rules — target column = X (categories), value column = Y / X */
	colorRules?: ColorRule[];
}

/** Default Bar chart styling values, applied as fallbacks at render time. */
export const DEFAULT_BAR_STYLING: Required<
	Pick<
		BarStyling,
		"showValueLabels" | "barWidth" | "trendlineType" | "showLegend"
	>
> = {
	showValueLabels: false,
	barWidth: 60,
	trendlineType: "none",
	showLegend: true,
};

/** Line chart–specific styling configuration */
export interface LineStyling {
	/** X axis editor */
	xAxisConfig?: AxisConfig;
	/** Y axis editor */
	yAxisConfig?: AxisConfig;
	/** Composite value-label config (show / position / rotate / align / font…) */
	valueLabel?: ValueLabelConfig;
	/** Curve interpolation. Default `'smooth'`. */
	curveType?: CurveType;
	/** Stroke pattern. Default `'solid'`. */
	lineType?: "solid" | "dashed" | "dotted";
	/** Stroke width in px, 1–6 (default 2). */
	lineWidth?: number;
	/** Whether to render the legend (default true when multi-series) */
	showLegend?: boolean;
}

/** Default Line chart styling values, applied as fallbacks at render time. */
export const DEFAULT_LINE_STYLING: Required<
	Pick<LineStyling, "curveType" | "lineType" | "lineWidth" | "showLegend">
> = {
	curveType: "smooth",
	lineType: "solid",
	lineWidth: 2,
	showLegend: true,
};

/** Pie chart–specific styling configuration */
export interface PieStyling {
	/** Composite value-label config (show / position / rotate / size / font / color) */
	valueLabel?: ValueLabelConfig;
	/**
	 * When `true`, renders with a center hole (donut). When `false`, full pie.
	 * Defaults to `true` to preserve existing visuals — the legacy renderer
	 * always drew an `innerRadius="35%"` hole and existing dashboards expect
	 * that look unless explicitly toggled off.
	 */
	donut?: boolean;
	/** Whether to render a tooltip on hover (default true) */
	showTooltip?: boolean;
	/** Whether to render the legend (default true) */
	showLegend?: boolean;
	/** Conditional color rules — target column = Name, value column = Value / Name */
	colorRules?: ColorRule[];
}

/** Default Pie chart styling values, applied as fallbacks at render time. */
export const DEFAULT_PIE_STYLING: Required<
	Pick<PieStyling, "donut" | "showTooltip" | "showLegend">
> = {
	donut: true,
	showTooltip: true,
	showLegend: true,
};

/**
 * Maps a {@link CurveType} (used by Bar trendline + Line curve) to the
 * `type` prop accepted by recharts' `<Line>` component. Centralised so all
 * renderers stay in lock-step with the editor labels.
 */
export function curveTypeToRecharts(
	c: CurveType | undefined,
): "linear" | "monotone" | "step" | "stepBefore" | "stepAfter" {
	switch (c) {
		case "exact":
			return "linear";
		case "stepStart":
			return "stepBefore";
		case "stepMiddle":
			return "step";
		case "stepEnd":
			return "stepAfter";
		case "smooth":
		default:
			return "monotone";
	}
}

/**
 * A reusable, first-class query definition. Defined once on the dashboard, then
 * referenced by many visualizations via {@link Visualization.queryId} so the
 * data is fetched a single time and shared across every chart bound to it.
 *
 * The `databaseId` / `query` / `parameters` fields mirror the legacy embedded
 * fields on {@link Visualization}; see {@link Visualization} for why both exist.
 */
/**
 * One leg of a cross-source "data product" query — a SQL query against a single
 * database, materialized into an in-memory frame so it can be joined with other
 * legs (potentially from other databases). See {@link DashboardQuery.sources}.
 */
export interface QuerySourceLeg {
	id: string;
	/** Frame alias (sanitized identifier, unique within the query). Used in join specs. */
	alias: string;
	databaseId: string;
	databaseName: string;
	/** SQL for this leg. May contain {{param}} tokens. */
	query: string;
}

/**
 * A join between two legs of a data product. `leftAlias` must reference a leg that
 * is already part of the accumulated frame; `rightAlias` is the leg being merged in.
 */
export interface JoinSpec {
	id: string;
	leftAlias: string;
	leftColumn: string;
	rightAlias: string;
	rightColumn: string;
	type: "inner" | "left" | "right";
}

export interface DashboardQuery {
	id: string;
	/** Human-readable label shown in the query picker (e.g. "Sales by region"). */
	name: string;
	databaseId: string;
	databaseName: string;
	query: string;
	parameters: Parameter[];
	/**
	 * When true and this query has no parameters, it does not auto-run on mount.
	 * It defers loading until the param sheet's "Run All" is clicked — useful for
	 * expensive queries that should only run after parameterized queries have been run.
	 * Only meaningful when the dashboard has a param sheet (isParamSheet sheet).
	 */
	loadAfterParams?: boolean;
	/**
	 * Cross-source data product: when present with ≥2 legs, this query is executed
	 * by materializing each leg into a frame and merging them via {@link joins},
	 * rather than running the single-source `databaseId`/`query` above (those are
	 * kept for back-compat / a human-readable description). `parameters` remains the
	 * deduped union across all legs so the param sheet keeps working.
	 */
	sources?: QuerySourceLeg[];
	/** Joins that merge the {@link sources} legs together (one per extra leg). */
	joins?: JoinSpec[];
}

export interface Visualization {
	id: string;
	title: string;
	/**
	 * Reference to a shared {@link DashboardQuery} on the dashboard. When set,
	 * the query/database/parameters come from that entity (resolved via
	 * `resolveQuery`). The embedded `databaseId` / `query` / `parameters` fields
	 * below are kept as a legacy fallback for dashboards saved before the shared-
	 * query model and for readers that don't yet resolve `queryId`.
	 */
	queryId?: string;
	databaseId: string;
	databaseName: string;
	query: string;
	parameters: Parameter[];
	visualizationType: VisualizationType;
	config?: VisualizationConfig;
	/** When true, the visualization's tab header is flagged as containing PHI/PII (red). */
	phi?: boolean;
	/** Optional background color key for the tab header (see TAB_COLORS in src/lib/tabColors.ts). PHI always overrides. */
	tabColor?: string;
}

export interface LayoutItem {
	vizId: string;
	colSpan: ColSpan;
	order: number;
	/** Continuous width % within its row (react-resizable-panels). Overrides colSpan-based default. */
	widthPct?: number;
	/** Row height % within the vertical panel stack. Shared by all items in the same row. */
	rowHeightPct?: number;
	/** Card height in pixels (portal view mode and main app). */
	heightPx?: number;
}

/** Layout and style configuration for the auto-created Parameters sheet. */
export interface ParamSheetConfig {
	/** Number of columns for param inputs. undefined = auto (2 when ≥3 params, else 1). Custom number allowed. */
	columns?: number;
	/** Horizontal alignment of the form within the page. Default: 'center'. */
	alignment?: "left" | "center" | "right";
	/** Custom label for the Run button. Default: 'Run All'. */
	runButtonLabel?: string;
	/** Custom title override. Default: 'Query Parameters'. */
	title?: string;
	/** Custom description override. */
	description?: string;
	/** Run button background color (hex). Default: blue-600. */
	runButtonColor?: string;
	/** Run button font/text color (hex). Default: white. */
	runButtonFontColor?: string;
	/** Show the Play icon inside the Run button. Default: true. */
	runButtonShowIcon?: boolean;
	/** Horizontal placement of the Run button. 'full' = full width (default). */
	runButtonAlignment?: "left" | "center" | "right" | "full";
	/** Width of the Run button when alignment is not 'full' (numeric string, e.g. '200'). */
	runButtonWidth?: string;
	/** Unit for runButtonWidth. Default: 'px'. */
	runButtonWidthUnit?: "px" | "em" | "%";
	/** Display order of param inputs by name. Names not in this list appear after those that are. */
	paramGroupOrder?: string[];
}

export interface Sheet {
	id: string;
	name: string;
	color?: string;
	visualizations: Visualization[];
	layout: LayoutItem[];
	/** Persisted flexlayout-react model JSON. Authoritative when present. */
	flexLayout?: Record<string, unknown>;
	/**
	 * When true, this sheet renders the global parameter collection form instead
	 * of a visualization canvas. Auto-created / auto-removed by the editor when
	 * any query has parameters. Always the first tab.
	 */
	isParamSheet?: boolean;
	/** Layout/style configuration for the Parameters sheet form. Only meaningful when isParamSheet is true. */
	paramSheetConfig?: ParamSheetConfig;
}

export interface Folder {
	id: string;
	name: string;
	color: string;
	createdAt: string;
}

export interface Dashboard {
	/** In the tag-based model this is the SEMOSS project id that backs the dashboard. */
	id: string;
	name: string;
	description?: string;
	/** @deprecated DB-folder id — superseded by `tags` in the tag-based model. */
	folderId?: string;
	/** Organizational tags. These ARE the folders: a folder is the set of dashboards sharing a tag. */
	tags?: string[];
	/** True when the backing project is global/published (visible to every user). */
	published?: boolean;
	/**
	 * Reusable query definitions referenced by visualizations via `queryId`.
	 * Optional for backward compatibility: dashboards saved before the shared-
	 * query model have none, and visualizations fall back to their embedded query.
	 */
	queries?: DashboardQuery[];
	/** Current user's SEMOSS role on the backing project (OWNER/EDIT/READ_ONLY/…). */
	permission?: string;
	sheets: Sheet[];
	/** @deprecated use sheets[n].visualizations — kept for legacy portal publishing */
	visualizations?: Visualization[];
	/** @deprecated use sheets[n].layout — kept for legacy portal publishing */
	layout?: LayoutItem[];
	createdAt: string;
	updatedAt: string;
}

export interface Database {
	app_id: string;
	app_name: string;
	app_type: string;
	engine_id: string;
	engine_name: string;
	engine_display_name: string;
	engine_type: string;
	engine_subtype: string;
	engine_date_created: string;
}

export interface QueryResult {
	headers: string[];
	data: any[][];
}
