import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useMemo,
	useState,
} from "react";
import { Input, Select } from "@/components/ui";
import { buildDefaultYAxisTitle } from "@/components/visualizations/shared/chartShared";
import type {
	VisualizationStyling,
	VisualizationType,
} from "@/types/dashboard";
import { BarWidth } from "./bar/BarWidth";
import { Trendline } from "./bar/Trendline";
import { ValueLabelToggle as BarValueLabelToggle } from "./bar/ValueLabelToggle";
import { KpiColorByValue } from "./kpi/KpiColorByValue";
import { KpiFilterVisualization } from "./kpi/KpiFilterVisualization";
import { KpiSettings } from "./kpi/KpiSettings";
import { KpiTitles } from "./kpi/KpiTitles";
import { LineStyle } from "./line/LineStyle";
import { ValueLabelEditor as LineValueLabelEditor } from "./line/ValueLabelEditor";
import { DonutToggle } from "./pie/DonutToggle";
import { ShowTotals } from "./pivot/ShowTotals";
import { AxisSettings } from "./shared/AxisSettings";
import { ChartTitle } from "./shared/ChartTitle";
import { ColorByValue } from "./shared/ColorByValue";
import { ColorPalette } from "./shared/ColorPalette";
import { FilterVisualization } from "./shared/FilterVisualization";
import { FormatDataValues } from "./shared/FormatDataValues";
import { ShowLabelsToggle } from "./shared/ShowLabelsToggle";
import { ShowLegendToggle } from "./shared/ShowLegendToggle";
import { ShowTooltipToggle } from "./shared/ShowTooltipToggle";
import { SizeAndPosition } from "./shared/SizeAndPosition";
import { SortValues } from "./shared/SortValues";
import { ToolAccordion, ToolSearchContext } from "./shared/ToolAccordion";
import { CellStyling } from "./table/CellStyling";
import { ExportButton } from "./table/ExportButton";
import { HeaderStyling } from "./table/HeaderStyling";
import { RowSpanning } from "./table/RowSpanning";
import { RowsPerPage } from "./table/RowsPerPage";
import { WrapText } from "./table/WrapText";
import { CloudShapeControl } from "./wordcloud/CloudShapeControl";
import { RotationControl } from "./wordcloud/RotationControl";
import { MarkerSizeControl } from "./worldmap/MarkerSizeControl";

function collectAndSort(nodes: ReactNode[]): ReactNode {
	const flat: ReactElement[] = [];
	const collect = (node: ReactNode) => {
		Children.forEach(node as any, (child: ReactNode) => {
			if (!isValidElement(child)) return;
			if (child.type === Fragment) {
				collect((child.props as any).children);
			} else {
				flat.push(child);
			}
		});
	};
	nodes.forEach(collect);
	flat.sort((a, b) =>
		String((a.props as any).title ?? "").localeCompare(
			String((b.props as any).title ?? ""),
		),
	);
	return flat.map((el) => (
		<Fragment key={String((el.props as any).title ?? el.key)}>
			{el}
		</Fragment>
	));
}

interface ToolsPanelProps {
	visualizationType: VisualizationType;
	styling?: VisualizationStyling;
	columns: string[];
	/** Sample rows from the editor preview — used by the Filter Visualization tool to suggest values. */
	rows?: Array<Record<string, unknown>>;
	/** KPI: column names currently configured in the Metrics drop zone. Drives the per-card title selector. */
	metricColumns?: string[];
	/** WorldMap: true when a column is configured in the Size drop-zone. Drives slider enable/disable. */
	hasSizeColumn?: boolean;
	/** Bar / Line: column dropped into the X-Axis zone. Used to derive default axis titles. */
	xKey?: string;
	/** Bar / Line: columns dropped into the Y-Axis zone. Used to derive default axis titles. */
	yKeys?: string[];
	/** Bar / Line: per-column aggregation map. Used to format the default Y-axis title. */
	columnAggregations?: Record<string, string>;
	/**
	 * Columns currently configured in drop zones — used by Sort Values so the
	 * user only sees the columns they've actually dropped into the chart, not
	 * every column in the query result. Falls back to `columns` when not provided.
	 */
	sortableColumns?: string[];
	onChange: (styling: VisualizationStyling) => void;
}

export function ToolsPanel({
	visualizationType,
	styling = {},
	columns,
	rows = [],
	metricColumns = [],
	hasSizeColumn = false,
	xKey,
	yKeys = [],
	columnAggregations = {},
	sortableColumns,
	onChange,
}: ToolsPanelProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const columnValues = useMemo(() => {
		if (!rows.length) return {};
		return Object.fromEntries(
			columns.map((col) => [
				col,
				[
					...new Set(
						rows.map((r) => String(r[col] ?? "")).filter(Boolean),
					),
				].sort(),
			]),
		);
	}, [rows, columns]);

	const updateStyling = (updates: Partial<VisualizationStyling>) => {
		onChange({ ...styling, ...updates });
	};

	const updateTableStyling = (
		tableUpdates: Partial<NonNullable<VisualizationStyling["table"]>>,
	) => {
		updateStyling({
			table: { ...styling.table, ...tableUpdates },
		});
	};

	const updateKpiStyling = (
		kpiUpdates: Partial<NonNullable<VisualizationStyling["kpi"]>>,
	) => {
		updateStyling({
			kpi: { ...styling.kpi, ...kpiUpdates },
		});
	};

	const updateHeatmapStyling = (
		updates: Partial<NonNullable<VisualizationStyling["heatmap"]>>,
	) => {
		updateStyling({ heatmap: { ...styling.heatmap, ...updates } });
	};

	const updateWorldmapStyling = (
		updates: Partial<NonNullable<VisualizationStyling["worldmap"]>>,
	) => {
		updateStyling({
			worldmap: { ...styling.worldmap, ...updates },
		});
	};

	const updateWordcloudStyling = (
		updates: Partial<NonNullable<VisualizationStyling["wordcloud"]>>,
	) => {
		updateStyling({
			wordcloud: { ...styling.wordcloud, ...updates },
		});
	};

	const updateBubbleStyling = (
		updates: Partial<NonNullable<VisualizationStyling["bubble"]>>,
	) => {
		updateStyling({
			bubble: { ...styling.bubble, ...updates },
		});
	};

	const updatePuckStyling = (
		updates: Partial<NonNullable<VisualizationStyling["puck"]>>,
	) => {
		updateStyling({ puck: { ...styling.puck, ...updates } });
	};

	const updatePivotStyling = (
		pivotUpdates: Partial<NonNullable<VisualizationStyling["pivot"]>>,
	) => {
		updateStyling({
			pivot: { ...styling.pivot, ...pivotUpdates },
		});
	};

	const updateHalfDonutStyling = (
		updates: Partial<NonNullable<VisualizationStyling["halfdonut"]>>,
	) => {
		updateStyling({
			halfdonut: { ...styling.halfdonut, ...updates },
		});
	};
	const updateBoxPlotStyling = (
		updates: Partial<NonNullable<VisualizationStyling["boxplot"]>>,
	) => {
		updateStyling({ boxplot: { ...styling.boxplot, ...updates } });
	};

	const updatePolarBarStyling = (
		updates: Partial<NonNullable<VisualizationStyling["polarbar"]>>,
	) => {
		updateStyling({ polarbar: { ...styling.polarbar, ...updates } });
	};

	const updateClusterStyling = (
		updates: Partial<NonNullable<VisualizationStyling["cluster"]>>,
	) => {
		updateStyling({ cluster: { ...styling.cluster, ...updates } });
	};

	const updateMultilineStyling = (
		updates: Partial<NonNullable<VisualizationStyling["multiline"]>>,
	) => {
		updateStyling({ multiline: { ...styling.multiline, ...updates } });
	};

	const updateMultilineXAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["multiline"]>["xAxisConfig"]
			>
		>,
	) => {
		updateMultilineStyling({
			xAxisConfig: { ...styling.multiline?.xAxisConfig, ...updates },
		});
	};

	const updateMultilineYAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["multiline"]>["yAxisConfig"]
			>
		>,
	) => {
		updateMultilineStyling({
			yAxisConfig: { ...styling.multiline?.yAxisConfig, ...updates },
		});
	};

	const updateBarStyling = (
		updates: Partial<NonNullable<VisualizationStyling["bar"]>>,
	) => {
		updateStyling({ bar: { ...styling.bar, ...updates } });
	};
	const updateBarXAxis = (
		updates: Partial<
			NonNullable<NonNullable<VisualizationStyling["bar"]>["xAxisConfig"]>
		>,
	) => {
		updateBarStyling({
			xAxisConfig: { ...styling.bar?.xAxisConfig, ...updates },
		});
	};
	const updateBarYAxis = (
		updates: Partial<
			NonNullable<NonNullable<VisualizationStyling["bar"]>["yAxisConfig"]>
		>,
	) => {
		updateBarStyling({
			yAxisConfig: { ...styling.bar?.yAxisConfig, ...updates },
		});
	};

	const updateLineStyling = (
		updates: Partial<NonNullable<VisualizationStyling["line"]>>,
	) => {
		updateStyling({ line: { ...styling.line, ...updates } });
	};
	const updateLineXAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["line"]>["xAxisConfig"]
			>
		>,
	) => {
		updateLineStyling({
			xAxisConfig: { ...styling.line?.xAxisConfig, ...updates },
		});
	};
	const updateLineYAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["line"]>["yAxisConfig"]
			>
		>,
	) => {
		updateLineStyling({
			yAxisConfig: { ...styling.line?.yAxisConfig, ...updates },
		});
	};

	const updatePieStyling = (
		updates: Partial<NonNullable<VisualizationStyling["pie"]>>,
	) => {
		updateStyling({ pie: { ...styling.pie, ...updates } });
	};

	// Shared "Chart Title" tool — applies to a single chart-wide title for
	// most viz types. KPI gets its own per-card variant (see `kpiTitleTool`).
	// Shared tools available for all visualization types
	const sharedTools = (
		<ToolAccordion title="Chart Title">
			<ChartTitle
				visualizationType={visualizationType}
				value={styling.title}
				onChange={(title) => updateStyling({ title })}
				onReset={() => updateStyling({ title: undefined })}
			/>
		</ToolAccordion>
	);

	// KPI title tool: dropdown selects which metric's per-card title is being
	// edited. Defaults to the first configured metric. All edits write to
	// `styling.kpi.titles[metric]` — there is no "apply to all cards" mode in
	// this tool. The render path still falls back to `styling.title` for
	// backward compat with older saved dashboards.
	const kpiTitleTool = (
		<ToolAccordion title="KPI Titles">
			<KpiTitles
				metricColumns={metricColumns}
				perCardTitles={styling.kpi?.titles}
				onPerCardChange={(titles) => updateKpiStyling({ titles })}
			/>
		</ToolAccordion>
	);

	// "Size & Position" tool — shared across every viz type. Resizes the rendered
	// content inside its panel (does not touch the flexlayout panel/layout).
	const sizeTool = (
		<ToolAccordion title="Size & Position">
			<SizeAndPosition
				value={styling.size}
				onChange={(size) => updateStyling({ size })}
				onReset={() => updateStyling({ size: undefined })}
			/>
		</ToolAccordion>
	);

	// "Sort Values" tool — ordered list of sort rules applied client-side after
	// filtering. Shared across all data visualization types.
	const sortTool = (
		<ToolAccordion title="Sort Values">
			<SortValues
				columns={sortableColumns?.length ? sortableColumns : columns}
				rows={rows}
				value={styling.sortValues}
				onChange={(sortValues) => updateStyling({ sortValues })}
				onReset={() => updateStyling({ sortValues: undefined })}
			/>
		</ToolAccordion>
	);

	// "Filter Visualization" tool — author-defined rule tree that filters rows.
	// For KPI it's per-card (each metric keeps its own filter); every other type
	// shares a single chart-wide filter.
	const filterTool = (
		<ToolAccordion title="Filter Visualization">
			{visualizationType === "kpi" ? (
				<KpiFilterVisualization
					metricColumns={metricColumns}
					columns={columns}
					rows={rows}
					value={styling.kpi?.vizFilters}
					onChange={(vizFilters) => updateKpiStyling({ vizFilters })}
				/>
			) : (
				<FilterVisualization
					columns={columns}
					rows={rows}
					value={styling.vizFilter}
					onChange={(vizFilter) => updateStyling({ vizFilter })}
					onReset={() => updateStyling({ vizFilter: undefined })}
				/>
			)}
		</ToolAccordion>
	);

	const formatTool = (
		<ToolAccordion title="Format Data Values">
			<FormatDataValues
				columns={columns}
				rows={rows}
				value={styling.formatRules || []}
				onChange={(formatRules) => updateStyling({ formatRules })}
				onReset={() => updateStyling({ formatRules: undefined })}
			/>
		</ToolAccordion>
	);

	// Table-specific tools
	const tableTools = (
		<>
			<ToolAccordion title="Cell Styling">
				<CellStyling
					columns={columns}
					value={styling.table?.cell}
					onChange={(cell) => updateTableStyling({ cell })}
					onReset={() => updateTableStyling({ cell: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="table"
					columnValues={columnValues}
					value={styling.table?.colorRules || []}
					onChange={(colorRules) =>
						updateTableStyling({ colorRules: colorRules as any })
					}
					onReset={() => updateTableStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Export to CSV">
				<ExportButton
					value={styling.table?.showExport ?? true}
					onChange={(showExport) =>
						updateTableStyling({ showExport })
					}
					onReset={() => updateTableStyling({ showExport: true })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Header Styling">
				<HeaderStyling
					columns={columns}
					value={styling.table?.header}
					onChange={(header) => updateTableStyling({ header })}
					onReset={() => updateTableStyling({ header: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Pagination">
				<RowsPerPage
					value={styling.table?.pageSize}
					onChange={(pageSize) => updateTableStyling({ pageSize })}
					onReset={() => updateTableStyling({ pageSize: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Row Spanning">
				<RowSpanning
					value={styling.table?.rowSpanning || false}
					onChange={(rowSpanning) =>
						updateTableStyling({ rowSpanning })
					}
					onReset={() => updateTableStyling({ rowSpanning: false })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Wrap Text">
				<WrapText
					columns={columns}
					value={styling.table?.wrapText}
					onChange={(wrapText) => updateTableStyling({ wrapText })}
					onReset={() => updateTableStyling({ wrapText: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	// KPI-specific tools
	const kpiTools = (
		<>
			<ToolAccordion title="Color by Value">
				<KpiColorByValue
					metricColumns={metricColumns}
					value={styling.kpi?.colorRules || []}
					onChange={(colorRules) => updateKpiStyling({ colorRules })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>

			<ToolAccordion title="Export to CSV">
				<ExportButton
					value={styling.kpi?.showExport ?? true}
					onChange={(showExport) => updateKpiStyling({ showExport })}
					onReset={() => updateKpiStyling({ showExport: true })}
				/>
			</ToolAccordion>

			<ToolAccordion title="KPI Settings">
				<KpiSettings
					value={{
						backgroundColor: styling.kpi?.backgroundColor,
						fontFamily: styling.kpi?.fontFamily,
						fontSize: styling.kpi?.fontSize,
						fontColor: styling.kpi?.fontColor,
						textAlign: styling.kpi?.textAlign,
						layout: styling.kpi?.layout,
					}}
					onChange={(settings) => updateKpiStyling(settings)}
					onReset={() =>
						updateKpiStyling({
							backgroundColor: undefined,
							fontFamily: undefined,
							fontSize: undefined,
							fontColor: undefined,
							textAlign: undefined,
							layout: undefined,
						})
					}
				/>
			</ToolAccordion>
		</>
	);

	// Heatmap-specific tools
	const heatmapTools = (
		<>
			<ToolAccordion title="Color Scale">
				<div className="space-y-3">
					<div>
						<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
							Low Value Color
						</label>
						<div className="flex items-center gap-2">
							<input
								type="color"
								value={styling.heatmap?.minColor ?? "#dbeafe"}
								onChange={(e) =>
									updateHeatmapStyling({
										minColor: e.target.value,
									})
								}
								className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
							/>
							<span className="font-mono text-stone-500 text-xs">
								{styling.heatmap?.minColor ?? "#dbeafe"}
							</span>
							<button
								onClick={() =>
									updateHeatmapStyling({
										minColor: undefined,
									})
								}
								className="ml-auto text-[10px] text-stone-400 underline hover:text-stone-600"
							>
								Reset
							</button>
						</div>
					</div>
					<div>
						<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
							High Value Color
						</label>
						<div className="flex items-center gap-2">
							<input
								type="color"
								value={styling.heatmap?.maxColor ?? "#1d4ed8"}
								onChange={(e) =>
									updateHeatmapStyling({
										maxColor: e.target.value,
									})
								}
								className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
							/>
							<span className="font-mono text-stone-500 text-xs">
								{styling.heatmap?.maxColor ?? "#1d4ed8"}
							</span>
							<button
								onClick={() =>
									updateHeatmapStyling({
										maxColor: undefined,
									})
								}
								className="ml-auto text-[10px] text-stone-400 underline hover:text-stone-600"
							>
								Reset
							</button>
						</div>
					</div>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Show Values in Cells">
				<div className="flex items-center justify-between">
					<span className="text-stone-600 text-xs">
						Display value labels
					</span>
					<button
						onClick={() =>
							updateHeatmapStyling({
								showValues: !(
									styling.heatmap?.showValues ?? false
								),
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							styling.heatmap?.showValues
								? "bg-indigo-600"
								: "bg-stone-200"
						}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
								styling.heatmap?.showValues
									? "translate-x-4"
									: "translate-x-0.5"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>
		</>
	);

	// World Map–specific tools
	const worldmapTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>

			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.worldmap?.showLegend}
					description="Displays a color-category legend at the bottom of the map (only visible when a Color column is configured)."
					onChange={(showLegend) =>
						updateWorldmapStyling({ showLegend })
					}
					onReset={() =>
						updateWorldmapStyling({ showLegend: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Map Marker Size">
				<MarkerSizeControl
					hasSizeColumn={hasSizeColumn}
					value={{
						markerSize: styling.worldmap?.markerSize,
						markerSizeMin: styling.worldmap?.markerSizeMin,
						markerSizeMax: styling.worldmap?.markerSizeMax,
					}}
					onChange={(sizes) => updateWorldmapStyling(sizes)}
					onReset={() =>
						updateWorldmapStyling({
							markerSize: undefined,
							markerSizeMin: undefined,
							markerSizeMax: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Show Tooltips">
				<ShowTooltipToggle
					value={styling.worldmap?.showTooltip}
					description="Displays a popover with the marker's label, coordinates, size, color, and tooltip aggregation when hovered."
					onChange={(showTooltip) =>
						updateWorldmapStyling({ showTooltip })
					}
					onReset={() =>
						updateWorldmapStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>
		</>
	);

	// Word Cloud–specific tools
	const wordcloudTools = (
		<>
			<ToolAccordion title="Cloud Shape">
				<CloudShapeControl
					value={styling.wordcloud?.shape}
					onChange={(shape) => updateWordcloudStyling({ shape })}
					onReset={() => updateWordcloudStyling({ shape: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="wordcloud"
					columnValues={columnValues}
					value={styling.wordcloud?.colorRules || []}
					onChange={(colorRules) =>
						updateWordcloudStyling({
							colorRules: colorRules as any,
						})
					}
					onReset={() => updateWordcloudStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>

			<ToolAccordion title="Rotation">
				<RotationControl
					value={{
						rotationMin: styling.wordcloud?.rotationMin,
						rotationMax: styling.wordcloud?.rotationMax,
						rotationStep: styling.wordcloud?.rotationStep,
					}}
					onChange={(rot) => updateWordcloudStyling(rot)}
					onReset={() =>
						updateWordcloudStyling({
							rotationMin: undefined,
							rotationMax: undefined,
							rotationStep: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.wordcloud?.showTooltip}
					description="Displays a popover with the word, its size aggregation, and any configured tooltip aggregation when hovered."
					onChange={(showTooltip) =>
						updateWordcloudStyling({ showTooltip })
					}
					onReset={() =>
						updateWordcloudStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>
		</>
	);

	// Bubble chart–specific tools
	const bubbleTools = (
		<>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="bubble"
					columnValues={columnValues}
					value={styling.bubble?.colorRules || []}
					onChange={(colorRules) =>
						updateBubbleStyling({ colorRules: colorRules as any })
					}
					onReset={() => updateBubbleStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>

			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.bubble?.showLegend}
					description="Displays a horizontal legend below the chart with one entry per bubble."
					onChange={(showLegend) =>
						updateBubbleStyling({ showLegend })
					}
					onReset={() =>
						updateBubbleStyling({ showLegend: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.bubble?.showTooltip}
					description="Displays a popover with a colored swatch, the bubble's label, the Size aggregation, and the optional Tooltip column when hovered."
					onChange={(showTooltip) =>
						updateBubbleStyling({ showTooltip })
					}
					onReset={() =>
						updateBubbleStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Value Labels">
				<ShowLabelsToggle
					value={styling.bubble?.showLabels}
					label="Show labels on bubbles"
					description="Displays the category name and the aggregated Size value beneath each bubble."
					onChange={(showLabels) =>
						updateBubbleStyling({ showLabels })
					}
					onReset={() =>
						updateBubbleStyling({ showLabels: undefined })
					}
				/>
			</ToolAccordion>
		</>
	);

	const puckTools = (
		<>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="puck"
					columnValues={columnValues}
					value={styling.puck?.colorRules || []}
					onChange={(colorRules) =>
						updatePuckStyling({ colorRules: colorRules as any })
					}
					onReset={() => updatePuckStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>

			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.puck?.showLegend}
					description="Displays a legend below the chart showing the root value and each group level's values with their colors."
					onChange={(showLegend) => updatePuckStyling({ showLegend })}
					onReset={() => updatePuckStyling({ showLegend: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.puck?.showTooltip}
					description="Displays a popover with the circle's name, its hierarchy path, and the aggregated value when hovered."
					onChange={(showTooltip) =>
						updatePuckStyling({ showTooltip })
					}
					onReset={() =>
						updatePuckStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Value Labels">
				<ShowLabelsToggle
					value={styling.puck?.showLabels}
					label="Show labels on circles"
					description="Displays the category name and aggregated value inside each leaf circle."
					onChange={(showLabels) => updatePuckStyling({ showLabels })}
					onReset={() => updatePuckStyling({ showLabels: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	const updateSunburstStyling = (
		updates: Partial<NonNullable<VisualizationStyling["sunburst"]>>,
	) => {
		updateStyling({ sunburst: { ...styling.sunburst, ...updates } });
	};

	const currentInnerR = styling.sunburst?.innerRadius ?? 0;
	const sunburstTools = (
		<>
			<ToolAccordion title="Inner Radius (Donut)">
				<div className="flex flex-col gap-2 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">
							Hole size
						</span>
						<span className="font-medium text-stone-700 text-xs">
							{Math.round(currentInnerR * 100)}%
						</span>
					</div>
					<input
						type="range"
						min={0}
						max={80}
						step={5}
						value={Math.round(currentInnerR * 100)}
						onChange={(e) =>
							updateSunburstStyling({
								innerRadius: Number(e.target.value) / 100,
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show arc labels
					</span>
					<button
						type="button"
						onClick={() =>
							updateSunburstStyling({
								showLabels: !styling.sunburst?.showLabels,
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							styling.sunburst?.showLabels
								? "bg-indigo-500"
								: "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								styling.sunburst?.showLabels
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>
		</>
	);

	// Pivot-specific tools — reuse table styling tools where appropriate
	const pivotTools = (
		<>
			<ToolAccordion title="Cell Styling">
				<CellStyling
					columns={columns}
					value={styling.table?.cell}
					onChange={(cell) => updateTableStyling({ cell })}
					onReset={() => updateTableStyling({ cell: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="pivot"
					columnValues={columnValues}
					value={styling.table?.colorRules || []}
					onChange={(colorRules) =>
						updateTableStyling({ colorRules: colorRules as any })
					}
					onReset={() => updateTableStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Export to CSV">
				<ExportButton
					value={styling.table?.showExport ?? true}
					onChange={(showExport) =>
						updateTableStyling({ showExport })
					}
					onReset={() => updateTableStyling({ showExport: true })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Header Styling">
				<HeaderStyling
					columns={columns}
					value={styling.table?.header}
					onChange={(header) => updateTableStyling({ header })}
					onReset={() => updateTableStyling({ header: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Show Totals">
				<ShowTotals
					value={styling.pivot?.showTotals}
					onChange={(showTotals) =>
						updatePivotStyling({ showTotals })
					}
					onReset={() =>
						updatePivotStyling({ showTotals: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Wrap Text">
				<WrapText
					columns={columns}
					value={styling.table?.wrapText}
					onChange={(wrapText) => updateTableStyling({ wrapText })}
					onReset={() => updateTableStyling({ wrapText: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	const hdLabelsOn = styling.halfdonut?.showLabels !== false;
	const hdValuesOn = styling.halfdonut?.showValues === true;
	const hdLegendOn = styling.halfdonut?.showLegend !== false;
	const hdInnerRadius = styling.halfdonut?.innerRadius ?? 0.55;
	const halfDonutTools = (
		<>
			<ToolAccordion title="Inner Radius">
				<div className="space-y-2 px-4 py-3">
					<div className="mb-1 flex items-center justify-between">
						<span className="text-stone-500 text-xs">
							Hole size
						</span>
						<span className="font-semibold text-stone-700 text-xs">
							{Math.round(hdInnerRadius * 100)}%
						</span>
					</div>
					<input
						type="range"
						min={30}
						max={80}
						step={5}
						value={Math.round(hdInnerRadius * 100)}
						onChange={(e) =>
							updateHalfDonutStyling({
								innerRadius: Number(e.target.value) / 100,
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<div className="space-y-2 px-4 py-3">
					<label className="flex cursor-pointer items-center gap-3">
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${hdLegendOn ? "bg-indigo-500" : "bg-stone-200"}`}
							onClick={() =>
								updateHalfDonutStyling({
									showLegend: !hdLegendOn,
								})
							}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hdLegendOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{hdLegendOn ? "Legend visible" : "Legend hidden"}
						</span>
					</label>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Show Values">
				<div className="space-y-2 px-4 py-3">
					<label className="flex cursor-pointer items-center gap-3">
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${hdValuesOn ? "bg-indigo-500" : "bg-stone-200"}`}
							onClick={() =>
								updateHalfDonutStyling({
									showValues: !hdValuesOn,
								})
							}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hdValuesOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{hdValuesOn ? "Values visible" : "Values hidden"}
						</span>
					</label>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<div className="space-y-2 px-4 py-3">
					<label className="flex cursor-pointer items-center gap-3">
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${hdLabelsOn ? "bg-indigo-500" : "bg-stone-200"}`}
							onClick={() =>
								updateHalfDonutStyling({
									showLabels: !hdLabelsOn,
								})
							}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hdLabelsOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{hdLabelsOn ? "Labels visible" : "Labels hidden"}
						</span>
					</label>
				</div>
			</ToolAccordion>
		</>
	);

	// Box plot–specific tools

	// Polar Bar–specific tools
	const labelsOn = styling.polarbar?.showLabels !== false;
	const valuesOn = styling.polarbar?.showValues === true;
	const polarBarTools = (
		<>
			<ToolAccordion title="Fill Opacity">
				<div className="flex flex-col gap-2 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">Opacity</span>
						<span className="font-medium text-stone-700 text-xs">
							{Math.round(
								(styling.polarbar?.fillOpacity ?? 0.7) * 100,
							)}
							%
						</span>
					</div>
					<input
						type="range"
						min={10}
						max={100}
						step={5}
						value={Math.round(
							(styling.polarbar?.fillOpacity ?? 0.7) * 100,
						)}
						onChange={(e) =>
							updatePolarBarStyling({
								fillOpacity: Number(e.target.value) / 100,
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Show Values">
				<div className="space-y-2 px-4 py-3">
					<label className="flex cursor-pointer items-center gap-3">
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${valuesOn ? "bg-indigo-500" : "bg-stone-200"}`}
							onClick={() =>
								updatePolarBarStyling({ showValues: !valuesOn })
							}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${valuesOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{valuesOn ? "Values visible" : "Values hidden"}
						</span>
					</label>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<div className="space-y-2 px-4 py-3">
					<label className="flex cursor-pointer items-center gap-3">
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${labelsOn ? "bg-indigo-500" : "bg-stone-200"}`}
							onClick={() =>
								updatePolarBarStyling({ showLabels: !labelsOn })
							}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${labelsOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{labelsOn ? "Labels visible" : "Labels hidden"}
						</span>
					</label>
				</div>
			</ToolAccordion>
		</>
	);

	// Box plot–specific tools
	const boxPlotTools = (
		<>
			<ToolAccordion title="Fill Opacity">
				<div className="flex flex-col gap-2 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">Opacity</span>
						<span className="font-medium text-stone-700 text-xs">
							{Math.round(
								(styling.boxplot?.fillOpacity ?? 0.6) * 100,
							)}
							%
						</span>
					</div>
					<input
						type="range"
						min={10}
						max={100}
						step={5}
						value={Math.round(
							(styling.boxplot?.fillOpacity ?? 0.6) * 100,
						)}
						onChange={(e) =>
							updateBoxPlotStyling({
								fillOpacity: Number(e.target.value) / 100,
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Show Outliers">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show outlier dots
					</span>
					<button
						type="button"
						onClick={() =>
							updateBoxPlotStyling({
								showOutliers: !(
									styling.boxplot?.showOutliers !== false
								),
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							styling.boxplot?.showOutliers !== false
								? "bg-indigo-500"
								: "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								styling.boxplot?.showOutliers !== false
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Whisker Type">
				<div className="flex gap-2 px-1 py-1">
					{(["minmax", "iqr"] as const).map((wt) => (
						<button
							key={wt}
							type="button"
							onClick={() =>
								updateBoxPlotStyling({ whiskerType: wt })
							}
							className={`flex-1 rounded px-2 py-1.5 font-medium text-xs transition-colors ${
								(styling.boxplot?.whiskerType ?? "iqr") === wt
									? "bg-indigo-500 text-white"
									: "bg-stone-100 text-stone-600 hover:bg-stone-200"
							}`}
						>
							{wt === "minmax" ? "Min/Max" : "1.5×IQR"}
						</button>
					))}
				</div>
			</ToolAccordion>
		</>
	);

	// Cluster chart–specific tools
	const clusterTools = (
		<>
			<ToolAccordion title="Dot Size">
				<div className="flex flex-col gap-2 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">Radius</span>
						<span className="font-medium text-stone-700 text-xs">
							{styling.cluster?.dotRadius ?? 5}px
						</span>
					</div>
					<input
						type="range"
						min={2}
						max={12}
						step={1}
						value={styling.cluster?.dotRadius ?? 5}
						onChange={(e) =>
							updateClusterStyling({
								dotRadius: Number(e.target.value),
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Fill Opacity">
				<div className="flex flex-col gap-2 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">Opacity</span>
						<span className="font-medium text-stone-700 text-xs">
							{Math.round(
								(styling.cluster?.fillOpacity ?? 0.7) * 100,
							)}
							%
						</span>
					</div>
					<input
						type="range"
						min={20}
						max={100}
						step={5}
						value={Math.round(
							(styling.cluster?.fillOpacity ?? 0.7) * 100,
						)}
						onChange={(e) =>
							updateClusterStyling({
								fillOpacity: Number(e.target.value) / 100,
							})
						}
						className="w-full accent-indigo-500"
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Show Mean Line">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show mean per cluster
					</span>
					<button
						type="button"
						onClick={() =>
							updateClusterStyling({
								showMean: !(styling.cluster?.showMean === true),
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							styling.cluster?.showMean === true
								? "bg-indigo-500"
								: "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								styling.cluster?.showMean === true
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>
		</>
	);

	// Multi-line–specific tools
	const mlAvgOn = styling.multiline?.showAverage === true;
	const mlValueLabelsOn = styling.multiline?.showValueLabels === true;
	const mlTrendlineOn = styling.multiline?.showTrendline === true;
	const mlTooltipOn = styling.multiline?.showTooltip !== false;
	const mlCurveType = styling.multiline?.curveType ?? "monotone";
	const mlXCfg = styling.multiline?.xAxisConfig ?? {};
	const mlYCfg = styling.multiline?.yAxisConfig ?? {};
	const multilineTools = (
		<>
			<ToolAccordion title="Average Line">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show average reference line
					</span>
					<button
						type="button"
						onClick={() =>
							updateMultilineStyling({ showAverage: !mlAvgOn })
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							mlAvgOn ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								mlAvgOn
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>

			<ToolAccordion title="Curve Type">
				<div className="px-1 py-1">
					<Select
						value={mlCurveType}
						onChange={(e) =>
							updateMultilineStyling({
								curveType: e.target.value as any,
							})
						}
						className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
					>
						<option value="linear">Linear</option>
						<option value="monotone">Monotone</option>
						<option value="natural">Natural</option>
						<option value="step">Step</option>
						<option value="stepAfter">Step After</option>
						<option value="stepBefore">Step Before</option>
					</Select>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Value Labels">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show data labels on points
					</span>
					<button
						type="button"
						onClick={() =>
							updateMultilineStyling({
								showValueLabels: !mlValueLabelsOn,
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							mlValueLabelsOn ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								mlValueLabelsOn
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>

			<ToolAccordion title="X Axis Settings">
				<div className="flex flex-col gap-3 px-1 py-1">
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Axis Title
						</label>
						<Input
							type="text"
							value={mlXCfg.title ?? ""}
							onChange={(e) =>
								updateMultilineXAxis({
									title: e.target.value || undefined,
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
							placeholder="Axis label..."
						/>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Font Size
						</label>
						<Input
							type="number"
							min={8}
							max={20}
							value={mlXCfg.fontSize ?? 11}
							onChange={(e) =>
								updateMultilineXAxis({
									fontSize: Number(e.target.value),
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Axis Gap
						</label>
						<Input
							type="number"
							value={mlXCfg.axisGap ?? 0}
							onChange={(e) =>
								updateMultilineXAxis({
									axisGap: Number(e.target.value),
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-stone-600 text-xs">
							Show Labels
						</span>
						<button
							type="button"
							onClick={() =>
								updateMultilineXAxis({
									showLabels: !(mlXCfg.showLabels !== false),
								})
							}
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
								mlXCfg.showLabels !== false
									? "bg-indigo-500"
									: "bg-stone-300"
							}`}
						>
							<span
								className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
									mlXCfg.showLabels !== false
										? "translate-x-[18px]"
										: "translate-x-[2px]"
								}`}
							/>
						</button>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Rotate Values (°)
						</label>
						<Input
							type="number"
							min={-90}
							max={90}
							value={mlXCfg.rotateValues ?? 0}
							onChange={(e) =>
								updateMultilineXAxis({
									rotateValues: Number(e.target.value),
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-stone-600 text-xs">
							Flip Axis
						</span>
						<button
							type="button"
							onClick={() =>
								updateMultilineXAxis({
									flipAxis: !mlXCfg.flipAxis,
								})
							}
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
								mlXCfg.flipAxis
									? "bg-indigo-500"
									: "bg-stone-300"
							}`}
						>
							<span
								className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
									mlXCfg.flipAxis
										? "translate-x-[18px]"
										: "translate-x-[2px]"
								}`}
							/>
						</button>
					</div>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Y Axis Settings">
				<div className="flex flex-col gap-3 px-1 py-1">
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Axis Title
						</label>
						<Input
							type="text"
							value={mlYCfg.title ?? ""}
							onChange={(e) =>
								updateMultilineYAxis({
									title: e.target.value || undefined,
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
							placeholder="Axis label..."
						/>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Font Size
						</label>
						<Input
							type="number"
							min={8}
							max={20}
							value={mlYCfg.fontSize ?? 11}
							onChange={(e) =>
								updateMultilineYAxis({
									fontSize: Number(e.target.value),
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Axis Gap
						</label>
						<Input
							type="number"
							value={mlYCfg.axisGap ?? 0}
							onChange={(e) =>
								updateMultilineYAxis({
									axisGap: Number(e.target.value),
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-stone-600 text-xs">
							Show Labels
						</span>
						<button
							type="button"
							onClick={() =>
								updateMultilineYAxis({
									showLabels: !(mlYCfg.showLabels !== false),
								})
							}
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
								mlYCfg.showLabels !== false
									? "bg-indigo-500"
									: "bg-stone-300"
							}`}
						>
							<span
								className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
									mlYCfg.showLabels !== false
										? "translate-x-[18px]"
										: "translate-x-[2px]"
								}`}
							/>
						</button>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-stone-600 text-xs">
							Rotate Values (°)
						</label>
						<Input
							type="number"
							min={-90}
							max={90}
							value={mlYCfg.rotateValues ?? 0}
							onChange={(e) =>
								updateMultilineYAxis({
									rotateValues: Number(e.target.value),
								})
							}
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-stone-600 text-xs">
							Flip Axis
						</span>
						<button
							type="button"
							onClick={() =>
								updateMultilineYAxis({
									flipAxis: !mlYCfg.flipAxis,
								})
							}
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
								mlYCfg.flipAxis
									? "bg-indigo-500"
									: "bg-stone-300"
							}`}
						>
							<span
								className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
									mlYCfg.flipAxis
										? "translate-x-[18px]"
										: "translate-x-[2px]"
								}`}
							/>
						</button>
					</div>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Tooltips">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show tooltip on hover
					</span>
					<button
						type="button"
						onClick={() =>
							updateMultilineStyling({
								showTooltip: !mlTooltipOn,
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							mlTooltipOn ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								mlTooltipOn
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Trendline">
				<div className="flex items-center justify-between px-1 py-1">
					<span className="text-stone-600 text-xs">
						Show linear trendline
					</span>
					<button
						type="button"
						onClick={() =>
							updateMultilineStyling({
								showTrendline: !mlTrendlineOn,
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							mlTrendlineOn ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								mlTrendlineOn
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>
		</>
	);

	// Bar-specific tools
	const barAxisDefaults = {
		x: xKey || undefined,
		y: buildDefaultYAxisTitle(yKeys, columnAggregations) || undefined,
	};
	const barTools = (
		<>
			<ToolAccordion title="Bar Width">
				<BarWidth
					value={styling.bar?.barWidth}
					onChange={(v) => updateBarStyling({ barWidth: v })}
					onReset={() => updateBarStyling({ barWidth: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="bar"
					columnValues={columnValues}
					value={styling.bar?.colorRules || []}
					onChange={(colorRules) =>
						updateBarStyling({ colorRules: colorRules as any })
					}
					onReset={() => updateBarStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.bar?.showLegend}
					description="Only displayed when more than one series is configured."
					onChange={(v) => updateBarStyling({ showLegend: v })}
					onReset={() => updateBarStyling({ showLegend: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Trendline">
				<Trendline
					value={styling.bar?.trendlineType}
					onChange={(v) => updateBarStyling({ trendlineType: v })}
					onReset={() =>
						updateBarStyling({ trendlineType: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<BarValueLabelToggle
					value={styling.bar?.showValueLabels}
					onChange={(v) => updateBarStyling({ showValueLabels: v })}
					onReset={() =>
						updateBarStyling({ showValueLabels: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					axis="x"
					value={styling.bar?.xAxisConfig}
					onChange={(updates) => updateBarXAxis(updates)}
					defaultTitle={barAxisDefaults.x}
					onReset={() => updateBarStyling({ xAxisConfig: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					axis="y"
					value={styling.bar?.yAxisConfig}
					onChange={(updates) => updateBarYAxis(updates)}
					defaultTitle={barAxisDefaults.y}
					onReset={() => updateBarStyling({ yAxisConfig: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	// Line-specific tools
	const lineTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.line?.showLegend}
					description="Only displayed when more than one series is configured."
					onChange={(v) => updateLineStyling({ showLegend: v })}
					onReset={() => updateLineStyling({ showLegend: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Line Styling">
				<LineStyle
					value={{
						curveType: styling.line?.curveType,
						lineType: styling.line?.lineType,
						lineWidth: styling.line?.lineWidth,
					}}
					onChange={(updates) => updateLineStyling(updates)}
					onReset={() =>
						updateLineStyling({
							curveType: undefined,
							lineType: undefined,
							lineWidth: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<LineValueLabelEditor
					value={styling.line?.valueLabel}
					onChange={(v) => updateLineStyling({ valueLabel: v })}
					onReset={() => updateLineStyling({ valueLabel: undefined })}
					variant="line"
				/>
			</ToolAccordion>
			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					axis="x"
					value={styling.line?.xAxisConfig}
					onChange={(updates) => updateLineXAxis(updates)}
					defaultTitle={barAxisDefaults.x}
					onReset={() =>
						updateLineStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					axis="y"
					value={styling.line?.yAxisConfig}
					onChange={(updates) => updateLineYAxis(updates)}
					defaultTitle={barAxisDefaults.y}
					onReset={() =>
						updateLineStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
		</>
	);

	// Pie-specific tools
	const pieTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={styling.customColorPalettes || []}
					onChange={(patch) => updateStyling(patch)}
				/>
			</ToolAccordion>
			<ToolAccordion title="Donut">
				<DonutToggle
					value={styling.pie?.donut}
					onChange={(v) => updatePieStyling({ donut: v })}
					onReset={() => updatePieStyling({ donut: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.pie?.showLegend}
					description="Displays a horizontal legend below the chart."
					onChange={(v) => updatePieStyling({ showLegend: v })}
					onReset={() => updatePieStyling({ showLegend: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.pie?.showTooltip}
					label="Show tooltip"
					description="Displays slice details on hover."
					onChange={(v) => updatePieStyling({ showTooltip: v })}
					onReset={() => updatePieStyling({ showTooltip: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Label">
				<LineValueLabelEditor
					value={styling.pie?.valueLabel}
					onChange={(v) => updatePieStyling({ valueLabel: v })}
					onReset={() => updatePieStyling({ valueLabel: undefined })}
					variant="pie"
				/>
			</ToolAccordion>
		</>
	);

	return (
		<ToolSearchContext.Provider value={searchQuery}>
			<div className="flex h-full flex-col">
				{/* Search bar */}
				<div className="sticky top-0 z-10 flex-shrink-0 border-stone-200 border-b bg-white px-4 py-2.5">
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search tools…"
						className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[13px] placeholder:text-stone-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					/>
				</div>
				<div className="flex-1 overflow-y-auto">
					{collectAndSort(
						[
							visualizationType === "kpi"
								? kpiTitleTool
								: sharedTools,
							filterTool,
							!["filter", "htmlblock", "csvexport"].includes(
								visualizationType,
							)
								? sortTool
								: null,
							!["filter", "htmlblock", "csvexport"].includes(
								visualizationType,
							)
								? formatTool
								: null,
							visualizationType !== "puck" ? sizeTool : null,
							visualizationType === "table" ? tableTools : null,
							visualizationType === "kpi" ? kpiTools : null,
							visualizationType === "heatmap"
								? heatmapTools
								: null,
							visualizationType === "worldmap"
								? worldmapTools
								: null,
							visualizationType === "wordcloud"
								? wordcloudTools
								: null,
							visualizationType === "bubble" ? bubbleTools : null,
							visualizationType === "puck" ? puckTools : null,
							visualizationType === "sunburst"
								? sunburstTools
								: null,
							visualizationType === "pivot" ? pivotTools : null,
							visualizationType === "halfdonut"
								? halfDonutTools
								: null,
							visualizationType === "boxplot"
								? boxPlotTools
								: null,
							visualizationType === "polarbar"
								? polarBarTools
								: null,
							visualizationType === "cluster"
								? clusterTools
								: null,
							visualizationType === "multiline"
								? multilineTools
								: null,
							visualizationType === "bar" ||
							visualizationType === "stackbar"
								? barTools
								: null,
							visualizationType === "line" ? lineTools : null,
							visualizationType === "pie" ? pieTools : null,
						].filter(Boolean) as ReactNode[],
					)}
					{visualizationType === "pivot" && (
						<div className="px-5 py-8 text-center text-sm text-stone-400">
							Pivot table tools coming soon
						</div>
					)}
				</div>
			</div>
		</ToolSearchContext.Provider>
	);
}
