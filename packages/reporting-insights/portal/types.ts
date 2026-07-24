import type { ParamSheetConfig, VisualizationStyling } from "@/types/dashboard";

export interface Parameter {
	id: string;
	name: string;
	label: string;
	defaultValue: string;
	/** 'text' | 'dropdown' | 'multiselect' (SQL IN list) | 'date'. Default 'text'. */
	inputType?: "text" | "dropdown" | "multiselect" | "date";
	/** Whether a value is required before the query can run. */
	required?: boolean;
	/** Dropdown/multiselect: manual options (merged with SQL-fetched ones). */
	options?: string[];
	/** Dropdown/multiselect: SQL whose first column populates the options. */
	optionsQuery?: string;
	/** Dropdown/multiselect: database to run optionsQuery against (defaults to the viz's database). */
	optionsDatabaseId?: string;
}

export type VisualizationType =
	| "bar"
	| "stackbar"
	| "line"
	| "area"
	| "pie"
	| "scatter"
	| "radar"
	| "treemap"
	| "pivot"
	| "kpi"
	| "table"
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
	| "csvexport"
	| "filter";

export interface VisualizationConfig {
	xKey?: string;
	yKeys?: string[];
	xLabel?: string;
	yLabel?: string;
	tablePageSize?: number;
	tableColumns?: string[];
	/** Pivot: dimension columns used for vertical row grouping (in order) */
	pivotRows?: string[];
	/** Pivot: dimension columns whose values become dynamic column headers (crosstab) */
	pivotColumns?: string[];
	/** Pivot: measure columns aggregated for each row/column intersection */
	pivotValues?: string[];
	kpiAggregation?: "sum" | "avg" | "min" | "max" | "count" | "countUnique";
	kpiFormat?: "auto" | "number" | "currency" | "percent";
	kpiPrefix?: string;
	kpiSuffix?: string;
	kpiDecimals?: number | "auto";
	kpiNotation?: "standard" | "compact";
	kpiThousandsSep?: "," | "." | " " | "none";
	kpiDecimalSep?: "." | ",";
	zKey?: string;
	columnTypes?: Record<string, string>;
	columnAggregations?: Record<string, string>;
	/** Scatter / WorldMap: label column for point identification */
	label?: string;
	/** Scatter / WorldMap: size column (numeric, with aggregation) */
	size?: string;
	/** Scatter / WorldMap: color column (categorical) */
	color?: string;
	/** Tooltip: multiple columns to display on hover */
	tooltips?: Array<{ column: string; aggregation: string }>;
	/** @deprecated Use tooltips[] */
	tooltip?: string;
	/** @deprecated Use tooltips[] */
	tooltipAggregation?: string;
	/** Multi-line: the column whose unique values become separate lines */
	categoryKey?: string;
	/** Stacked bar: the column whose unique values become the stacked series (facet). */
	facetKey?: string;
	/** Sunburst: ordered hierarchy dimension columns (innermost first) */
	sunburstLevels?: string[];
	/** Puck: ordered group dimension columns (outermost first) */
	puckGroups?: string[];
	/** WorldMap: column with numeric latitude values */
	heatmapYKey?: string;
	latitudeKey?: string;
	/** WorldMap: column with numeric longitude values */
	longitudeKey?: string;
	/** HTML Block: the HTML content to render */
	htmlContent?: string;
	/** HTML Block: the LLM prompt (persisted) */
	llmPrompt?: string;
	/** HTML Block: the selected LLM model engine ID (persisted) */
	llmModel?: string;
	/** CSV Export: optional custom label for the export button */
	csvExportLabel?: string;
	/** Filter widget: the column whose value is applied to the targeted frames */
	filterColumn?: string;
	/** Filter widget: ids of the visualizations this filter applies to */
	filterTargets?: string[];
	/** Filter widget: values pre-selected when the dashboard loads (saved from editor preview) */
	filterDefaultValues?: string[];
	/** Visual styling and behavior configuration for the visualization */
	styling?: VisualizationStyling;
}

/** Reusable query definition referenced by visualizations via `queryId`. */
/** One leg of a cross-source data-product query (mirror of src/types/dashboard.ts). */
export interface QuerySourceLeg {
	id: string;
	alias: string;
	databaseId: string;
	databaseName: string;
	query: string;
}

/** A join between two data-product legs (mirror of src/types/dashboard.ts). */
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
	name: string;
	databaseId: string;
	databaseName: string;
	query: string;
	parameters: Parameter[];
	/** Id of the chart that owns the param form for a shared parameterized query (see computeMasterVizByKey). */
	masterVizId?: string;
	/** When true, this non-parameterized query waits for the param-sheet Run before loading. */
	loadAfterParams?: boolean;
	/** Cross-source data product: ≥2 legs merged via {@link joins} (see src/types/dashboard.ts). */
	sources?: QuerySourceLeg[];
	joins?: JoinSpec[];
}

export interface Visualization {
	id: string;
	title: string;
	/** Reference to a shared {@link DashboardQuery}; embedded fields below are a legacy fallback. */
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

/** Width in a 12-column grid (legacy) */
export type ColSpan = 3 | 4 | 6 | 12;

export interface LayoutItem {
	vizId: string;
	colSpan: ColSpan;
	order: number;
	widthPct?: number;
	rowHeightPct?: number;
}

export interface Sheet {
	id: string;
	name: string;
	color?: string;
	/** When true, this is the auto-managed Parameters sheet — rendered separately from the flex canvas. */
	isParamSheet?: boolean;
	/** Layout/style configuration for the Parameters sheet form. Only meaningful when isParamSheet is true. */
	paramSheetConfig?: ParamSheetConfig;
	visualizations: Visualization[];
	layout: LayoutItem[];
	flexLayout?: Record<string, unknown>;
}

export interface DashboardConfig {
	projectId: string;
	name: string;
	description?: string;
	visualizations: Visualization[];
	layout: LayoutItem[];
	sheets?: Sheet[];
	/** Reusable query definitions referenced by visualizations via `queryId`. */
	queries?: DashboardQuery[];
	/** Persisted flexlayout-react model for the editor layout */
	flexLayout?: Record<string, unknown>;
	createdAt?: string;
	updatedAt: string;
}

export interface Database {
	app_id: string;
	app_name?: string;
	engine_id?: string;
	engine_name?: string;
	engine_display_name?: string;
}

export interface QueryResult {
	headers: string[];
	values: unknown[][];
	headerInfo?: { header: string; type: string }[];
}
