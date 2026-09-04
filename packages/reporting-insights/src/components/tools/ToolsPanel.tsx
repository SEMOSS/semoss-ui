import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useId,
	useMemo,
	useState,
} from "react";
import {
	AGGREGATION_LABELS,
	aggregateChartData,
	buildDefaultYAxisTitle,
} from "@/components/visualizations/shared/chartShared";
import type {
	AxisConfig,
	ColorPalette as ColorPaletteType,
	ColorRule,
	TreemapStyling,
	TreemapTextConfig,
	VisualizationConfig,
	VisualizationStyling,
	VisualizationType,
} from "@/types/dashboard";
import { ShowTotals as AreaShowTotals } from "./area/ShowTotals";
import { BarWidth } from "./bar/BarWidth";
import { Trendline } from "./bar/Trendline";
import { SeriesType } from "./combo/SeriesType";
import { KpiColorByValue } from "./kpi/KpiColorByValue";
import { KpiFilterVisualization } from "./kpi/KpiFilterVisualization";
import { KpiSettings } from "./kpi/KpiSettings";
import { KpiTitles } from "./kpi/KpiTitles";
import { LineStyle } from "./line/LineStyle";
import { ValueLabelEditor as LineValueLabelEditor } from "./line/ValueLabelEditor";
import { DonutToggle } from "./pie/DonutToggle";
import { ShowTotals } from "./pivot/ShowTotals";
import { PolarZoom } from "./polarbar/PolarZoom";
import { AxisSettings } from "./shared/AxisSettings";
import { ChartTitle } from "./shared/ChartTitle";
import { ColorByValue } from "./shared/ColorByValue";
import { ColorPalette, type ColorPalettePatch } from "./shared/ColorPalette";
import { EventsPanel } from "./shared/EventsPanel";
import { FilterVisualization } from "./shared/FilterVisualization";
import { FormatDataValues } from "./shared/FormatDataValues";
import { ResetButton } from "./shared/ResetButton";
import { ShowLabelsToggle } from "./shared/ShowLabelsToggle";
import { ShowLegendToggle } from "./shared/ShowLegendToggle";
import { ShowTooltipToggle } from "./shared/ShowTooltipToggle";
import { SizeAndPosition } from "./shared/SizeAndPosition";
import { SortValues } from "./shared/SortValues";
import { SymbolStyle } from "./shared/SymbolStyle";
import { ToolAccordion, ToolSearchContext } from "./shared/ToolAccordion";
import { AverageToggle } from "./stackbar/AverageToggle";
import { AxisPointer } from "./stackbar/AxisPointer";
import { FlipAxis } from "./stackbar/FlipAxis";
import { FlipSeries } from "./stackbar/FlipSeries";
import { MinMaxToggle } from "./stackbar/MinMaxToggle";
import { ReverseYAxis } from "./stackbar/ReverseYAxis";
import { SaveZoom } from "./stackbar/SaveZoom";
import { TargetArea } from "./stackbar/TargetArea";
import { TargetLine } from "./stackbar/TargetLine";
import { UnstackToggle } from "./stackbar/UnstackToggle";
import { ZoomXAxis } from "./stackbar/ZoomXAxis";
import { ZoomYAxis } from "./stackbar/ZoomYAxis";
import { CellStyling } from "./table/CellStyling";
import { ExportButton } from "./table/ExportButton";
import { HeaderStyling } from "./table/HeaderStyling";
import { RowSpanning } from "./table/RowSpanning";
import { RowsPerPage } from "./table/RowsPerPage";
import { WrapText } from "./table/WrapText";
import { CloudShapeControl } from "./wordcloud/CloudShapeControl";
import { RotationControl } from "./wordcloud/RotationControl";
import { MapLayerControl } from "./worldmap/MapLayerControl";
import { MarkerSizeControl } from "./worldmap/MarkerSizeControl";

function collectAndSort(nodes: ReactNode[]): ReactNode {
	type SectionProps = { title?: string; children?: ReactNode };
	const flat: ReactElement[] = [];
	const collect = (node: ReactNode) => {
		Children.forEach(node, (child: ReactNode) => {
			if (!isValidElement(child)) return;
			if (child.type === Fragment) {
				collect((child.props as SectionProps).children);
			} else {
				flat.push(child);
			}
		});
	};
	nodes.forEach(collect);
	flat.sort((a, b) =>
		String((a.props as SectionProps).title ?? "").localeCompare(
			String((b.props as SectionProps).title ?? ""),
		),
	);
	return flat.map((el) => (
		<Fragment key={String((el.props as SectionProps).title ?? el.key)}>
			{el}
		</Fragment>
	));
}

interface ToolsPanelProps {
	visualizationType: VisualizationType;
	styling?: VisualizationStyling;
	columns: string[];
	/** Pre-built column type map from metamodel/saved config. */
	columnTypes?: Record<string, string>;
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
	/** Dashboard-level custom palettes — shared across all visualization panels. */
	customColorPalettes?: ColorPaletteType[];
	/** Fires when the user creates/edits/deletes a custom palette template. */
	onCustomColorPalettesChange?: (palettes: ColorPaletteType[]) => void;
	/** Other visualizations on the same dashboard — used by Events tool "Apply to Specific" targeting. */
	allVisualizations?: Array<{
		id: string;
		name: string;
		eventParams?: string[];
	}>;
	/** ID of the current visualization — pinned as always-selected in event specific targeting. */
	hostVizId?: string;
	onChange: (styling: VisualizationStyling) => void;
}

export function ToolsPanel({
	visualizationType,
	styling = {},
	columns,
	columnTypes: externalColumnTypes,
	rows = [],
	metricColumns = [],
	hasSizeColumn = false,
	xKey,
	yKeys = [],
	columnAggregations = {},
	sortableColumns,
	customColorPalettes = [],
	onCustomColorPalettesChange,
	allVisualizations = [],
	hostVizId,
	onChange,
}: ToolsPanelProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const fieldIdPrefix = useId();

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

	// Label Y-axis columns with their aggregation for all chart types that have a Y drop zone
	// (e.g. "Number" → "Average of Number") so ColorByValue shows the friendly name
	// while still storing the raw column key in rule.valueColumn.
	const yKeyColumnLabels = useMemo(() => {
		const labels: Record<string, string> = {};
		for (const key of yKeys) {
			const agg = columnAggregations[key];
			if (agg)
				labels[key] = `${AGGREGATION_LABELS[agg] ?? agg} of ${key}`;
		}
		return labels;
	}, [yKeys, columnAggregations]);

	// For line / area: replace the raw column value suggestions with the actual
	// post-aggregation values so "Select Value" datalist shows e.g. "3", "7" for
	// "Count of Phrase" rather than the original phrase strings.
	const yKeyAggregatedColumnValues = useMemo(() => {
		if (!rows.length || !xKey || !yKeys.length) return columnValues;
		const config: VisualizationConfig = { columnAggregations };
		const chartData = aggregateChartData(
			rows as Record<string, unknown>[],
			xKey,
			yKeys,
			config,
		);
		const result = { ...columnValues };
		for (const key of yKeys) {
			if (columnAggregations[key]) {
				result[key] = [
					...new Set(
						chartData
							.map((r) => String(r[key] ?? ""))
							.filter(Boolean),
					),
				].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
			}
		}
		return result;
	}, [rows, xKey, yKeys, columnAggregations, columnValues]);

	// Combo chart: compute resolved column keys, human-readable labels, and aggregated value
	// suggestions for ColorByValue — supports same column in both zones with different aggregations.
	const comboColorColumns = useMemo(() => {
		if (visualizationType !== "combo") return null;
		const barDisplayKeys = styling.combo?.barKeys ?? [];
		const lineDisplayKeys = styling.combo?.lineKeys ?? [];
		const barAggs = styling.combo?.barAggregations ?? {};
		const lineAggs = styling.combo?.lineAggregations ?? {};
		const sharedCols = new Set(
			barDisplayKeys.filter((k) => lineDisplayKeys.includes(k)),
		);

		const cols: string[] = [];
		const labels: Record<string, string> = {};
		const aggMap: Record<string, string> = {};

		for (const k of barDisplayKeys) {
			const rk = sharedCols.has(k) ? `${k}__combo_bar` : k;
			const agg = barAggs[k];
			cols.push(rk);
			labels[rk] = agg
				? `${AGGREGATION_LABELS[agg] ?? agg} of ${k}${sharedCols.has(k) ? " (Bar)" : ""}`
				: sharedCols.has(k)
					? `${k} (Bar)`
					: k;
			if (agg) aggMap[rk] = agg;
		}
		for (const k of lineDisplayKeys) {
			const rk = sharedCols.has(k) ? `${k}__combo_line` : k;
			const agg = lineAggs[k];
			cols.push(rk);
			labels[rk] = agg
				? `${AGGREGATION_LABELS[agg] ?? agg} of ${k}${sharedCols.has(k) ? " (Line)" : ""}`
				: sharedCols.has(k)
					? `${k} (Line)`
					: k;
			if (agg) aggMap[rk] = agg;
		}

		const processedRows: Record<string, unknown>[] =
			sharedCols.size > 0 && rows.length > 0
				? rows.map((row) => {
						const out = { ...row } as Record<string, unknown>;
						for (const k of sharedCols) {
							out[`${k}__combo_bar`] = row[k];
							out[`${k}__combo_line`] = row[k];
						}
						return out;
					})
				: (rows as Record<string, unknown>[]);

		const values: Record<string, string[]> = {};
		if (processedRows.length > 0 && xKey && cols.length > 0) {
			const chartData = aggregateChartData(processedRows, xKey, cols, {
				columnAggregations: aggMap,
			} satisfies VisualizationConfig);
			for (const rk of cols) {
				if (aggMap[rk]) {
					values[rk] = [
						...new Set(
							chartData
								.map((r) => String(r[rk] ?? ""))
								.filter(Boolean),
						),
					].sort(
						(a, b) => Number(a) - Number(b) || a.localeCompare(b),
					);
				}
			}
		}

		// "Select Column of Values": all raw columns + aggregated series, deduped.
		// Non-shared resolved keys equal the raw column name → already in columns, just gets labeled.
		// Shared resolved keys ("rev__combo_bar") are distinct from raw "rev" → appear as extra entries.
		const valueColumnList = [...new Set([...columns, ...cols])];

		// Merge raw distinct values and aggregated value suggestions for the datalist
		const mergedValues: Record<string, string[]> = { ...values };
		for (const col of columns) {
			if (!mergedValues[col]) {
				const rawVals = [
					...new Set(
						rows.map((r) => String(r[col] ?? "")).filter(Boolean),
					),
				].sort();
				if (rawVals.length) mergedValues[col] = rawVals;
			}
		}

		return { cols, labels, values, valueColumnList, mergedValues };
	}, [
		visualizationType,
		styling.combo?.barKeys,
		styling.combo?.lineKeys,
		styling.combo?.barAggregations,
		styling.combo?.lineAggregations,
		rows,
		xKey,
		columns,
	]);

	const formatToolColumnLabels = useMemo(() => {
		if (visualizationType === "combo")
			return comboColorColumns?.labels ?? {};
		return yKeyColumnLabels;
	}, [visualizationType, comboColorColumns?.labels, yKeyColumnLabels]);

	const updateStyling = (updates: Partial<VisualizationStyling>) => {
		onChange({ ...styling, ...updates });
	};

	const handleColorPalettePatch = (patch: ColorPalettePatch) => {
		if (patch.customColorPalettes !== undefined) {
			onCustomColorPalettesChange?.(patch.customColorPalettes);
		}
		if ("colorPalette" in patch) {
			updateStyling({ colorPalette: patch.colorPalette });
		}
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

	const updateHeatmapXAxis = (updates: Partial<AxisConfig>) =>
		updateHeatmapStyling({
			xAxisConfig: { ...styling.heatmap?.xAxisConfig, ...updates },
		});
	const updateHeatmapYAxis = (updates: Partial<AxisConfig>) =>
		updateHeatmapStyling({
			yAxisConfig: { ...styling.heatmap?.yAxisConfig, ...updates },
		});

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
	const updateBoxPlotXAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["boxplot"]>["xAxisConfig"]
			>
		>,
	) => {
		updateBoxPlotStyling({
			xAxisConfig: { ...styling.boxplot?.xAxisConfig, ...updates },
		});
	};
	const updateBoxPlotYAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["boxplot"]>["yAxisConfig"]
			>
		>,
	) => {
		updateBoxPlotStyling({
			yAxisConfig: { ...styling.boxplot?.yAxisConfig, ...updates },
		});
	};

	const updatePolarBarStyling = (
		updates: Partial<NonNullable<VisualizationStyling["polarbar"]>>,
	) => {
		updateStyling({ polarbar: { ...styling.polarbar, ...updates } });
	};

	const updateRadarStyling = (
		updates: Partial<NonNullable<VisualizationStyling["radar"]>>,
	) => {
		updateStyling({ radar: { ...styling.radar, ...updates } });
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

	const updateTreemapStyling = (updates: Partial<TreemapStyling>) => {
		updateStyling({ treemap: { ...styling.treemap, ...updates } });
	};
	const updateTreemapHeaderLabel = (u: Partial<TreemapTextConfig>) =>
		updateTreemapStyling({
			headerLabel: { ...styling.treemap?.headerLabel, ...u },
		});
	const updateTreemapTileLabel = (u: Partial<TreemapTextConfig>) =>
		updateTreemapStyling({
			tileLabel: { ...styling.treemap?.tileLabel, ...u },
		});

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

	const updateStackbarStyling = (
		updates: Partial<NonNullable<VisualizationStyling["stackbar"]>>,
	) => {
		updateStyling({ stackbar: { ...styling.stackbar, ...updates } });
	};
	const updateStackbarXAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["stackbar"]>["xAxisConfig"]
			>
		>,
	) => {
		updateStackbarStyling({
			xAxisConfig: { ...styling.stackbar?.xAxisConfig, ...updates },
		});
	};
	const updateStackbarYAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["stackbar"]>["yAxisConfig"]
			>
		>,
	) => {
		updateStackbarStyling({
			yAxisConfig: { ...styling.stackbar?.yAxisConfig, ...updates },
		});
	};

	const updateAreaStyling = (
		updates: Partial<NonNullable<VisualizationStyling["area"]>>,
	) => {
		updateStyling({ area: { ...styling.area, ...updates } });
	};
	const updateAreaXAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["area"]>["xAxisConfig"]
			>
		>,
	) => {
		updateAreaStyling({
			xAxisConfig: { ...styling.area?.xAxisConfig, ...updates },
		});
	};
	const updateAreaYAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["area"]>["yAxisConfig"]
			>
		>,
	) => {
		updateAreaStyling({
			yAxisConfig: { ...styling.area?.yAxisConfig, ...updates },
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

	const updateComboStyling = (
		updates: Partial<NonNullable<VisualizationStyling["combo"]>>,
	) => {
		updateStyling({ combo: { ...styling.combo, ...updates } });
	};
	const updateComboXAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["combo"]>["xAxisConfig"]
			>
		>,
	) => {
		updateComboStyling({
			xAxisConfig: { ...styling.combo?.xAxisConfig, ...updates },
		});
	};
	const updateComboYAxis = (
		updates: Partial<
			NonNullable<
				NonNullable<VisualizationStyling["combo"]>["yAxisConfig"]
			>
		>,
	) => {
		updateComboStyling({
			yAxisConfig: { ...styling.combo?.yAxisConfig, ...updates },
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

	const eventsTool = (
		<ToolAccordion title="Events">
			<EventsPanel
				events={styling.events ?? []}
				onChange={(next) => updateStyling({ events: next })}
				columns={columns}
				dropZoneColumns={sortableColumns}
				allVisualizations={allVisualizations}
				hostVizId={hostVizId}
			/>
		</ToolAccordion>
	);

	const formatTool = (
		<ToolAccordion title="Format Data Values">
			<FormatDataValues
				columns={sortableColumns?.length ? sortableColumns : columns}
				columnLabels={formatToolColumnLabels}
				rows={rows}
				columnTypes={externalColumnTypes}
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
						updateTableStyling({
							colorRules: colorRules as ColorRule[],
						})
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
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
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
			<ToolAccordion title="Bucket">
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-stone-600 text-xs">
							Top categories
						</span>
						<span className="font-semibold text-stone-700 text-xs">
							{styling.heatmap?.bucket ?? "All"}
						</span>
					</div>
					<input
						type="range"
						min={1}
						max={20}
						value={styling.heatmap?.bucket ?? 20}
						onChange={(e) =>
							updateHeatmapStyling({
								bucket:
									Number(e.target.value) === 20 &&
									!styling.heatmap?.bucket
										? undefined
										: Number(e.target.value),
							})
						}
						className="w-full accent-indigo-500"
					/>
					<p className="text-[10px] text-stone-400">
						Limits the X axis to the top-N categories by value sum.
					</p>
					{styling.heatmap?.bucket && (
						<button
							type="button"
							onClick={() =>
								updateHeatmapStyling({ bucket: undefined })
							}
							className="text-[10px] text-stone-400 underline hover:text-stone-600"
						>
							Show all
						</button>
					)}
				</div>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>

			<ToolAccordion title="Expand / Fit">
				<div className="space-y-2">
					{(
						[
							[
								"expand",
								"Expand",
								"Expand cells to fill the full panel",
							],
							[
								"fitHorizontal",
								"Fit Horizontal",
								"Compress cell width so all X labels fit on screen",
							],
							[
								"fitVertical",
								"Fit Vertical",
								"Compress cell height so all Y labels fit on screen",
							],
						] as const
					).map(([key, label, desc]) => (
						<label
							key={key}
							className="flex cursor-pointer items-start gap-2"
						>
							<input
								type="checkbox"
								checked={
									key === "expand"
										? styling.heatmap?.expand !== false
										: (styling.heatmap?.[key] ?? false)
								}
								onChange={(e) =>
									updateHeatmapStyling({
										[key]: e.target.checked,
									})
								}
								className="mt-0.5 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
							/>
							<span>
								<span className="font-medium text-stone-700 text-xs">
									{label}
								</span>
								<span className="block text-[10px] text-stone-400">
									{desc}
								</span>
							</span>
						</label>
					))}
				</div>
			</ToolAccordion>

			<ToolAccordion title="Heat Range">
				<div className="space-y-3">
					<label className="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={styling.heatmap?.heatMinEnabled ?? false}
							onChange={(e) =>
								updateHeatmapStyling({
									heatMinEnabled: e.target.checked,
								})
							}
							className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
						/>
						<span className="text-stone-600 text-xs">
							Custom heat minimum
						</span>
					</label>
					{styling.heatmap?.heatMinEnabled && (
						<input
							type="number"
							value={styling.heatmap?.heatMin ?? ""}
							onChange={(e) =>
								updateHeatmapStyling({
									heatMin:
										e.target.value === ""
											? undefined
											: Number(e.target.value),
								})
							}
							placeholder="Min value"
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					)}
					<label className="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={styling.heatmap?.heatMaxEnabled ?? false}
							onChange={(e) =>
								updateHeatmapStyling({
									heatMaxEnabled: e.target.checked,
								})
							}
							className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
						/>
						<span className="text-stone-600 text-xs">
							Custom heat maximum
						</span>
					</label>
					{styling.heatmap?.heatMaxEnabled && (
						<input
							type="number"
							value={styling.heatmap?.heatMax ?? ""}
							onChange={(e) =>
								updateHeatmapStyling({
									heatMax:
										e.target.value === ""
											? undefined
											: Number(e.target.value),
								})
							}
							placeholder="Max value"
							className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					)}
				</div>
			</ToolAccordion>

			<ToolAccordion title="Label Settings">
				<LineValueLabelEditor
					value={styling.heatmap?.valueLabel}
					onChange={(v) => updateHeatmapStyling({ valueLabel: v })}
					onReset={() =>
						updateHeatmapStyling({ valueLabel: undefined })
					}
					variant="heatmap"
				/>
			</ToolAccordion>

			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					axis="x"
					value={styling.heatmap?.xAxisConfig}
					onChange={updateHeatmapXAxis}
					onReset={() =>
						updateHeatmapStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					axis="y"
					value={styling.heatmap?.yAxisConfig}
					onChange={updateHeatmapYAxis}
					onReset={() =>
						updateHeatmapStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.heatmap?.zoomX}
					onChange={(v) => updateHeatmapStyling({ zoomX: v })}
					onReset={() =>
						updateHeatmapStyling({
							zoomX: undefined,
							savedZoomX: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.heatmap?.zoomY}
					onChange={(v) => updateHeatmapStyling({ zoomY: v })}
					onReset={() =>
						updateHeatmapStyling({
							zoomY: undefined,
							savedZoomY: undefined,
						})
					}
				/>
			</ToolAccordion>
		</>
	);

	// World Map–specific tools
	const worldmapTools = (
		<>
			<ToolAccordion title="Map Layer">
				<MapLayerControl
					value={styling.worldmap?.mapLayer}
					onChange={(mapLayer) => updateWorldmapStyling({ mapLayer })}
					onReset={() =>
						updateWorldmapStyling({ mapLayer: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
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
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateWordcloudStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
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
						updateBubbleStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateBubbleStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
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
						updatePuckStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updatePuckStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
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
	// Dropped columns (group levels + value column) from active drop zones.
	// columnLabels renames the raw value key to its aggregated display label in the UI.
	const sbDroppedColumns = sortableColumns ?? columns;
	const sunburstTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={sbDroppedColumns}
					valueColumns={sbDroppedColumns}
					visualizationType="sunburst"
					value={
						(styling.sunburst?.colorRules as
							| ColorRule[]
							| undefined) ?? []
					}
					onChange={(rules) =>
						updateSunburstStyling({
							colorRules: rules as ColorRule[],
						})
					}
					onReset={() => updateSunburstStyling({ colorRules: [] })}
					columnValues={columnValues}
					columnLabels={yKeyColumnLabels}
				/>
			</ToolAccordion>
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
				<LineValueLabelEditor
					value={styling.sunburst?.valueLabel}
					onChange={(v) => updateSunburstStyling({ valueLabel: v })}
					onReset={() =>
						updateSunburstStyling({ valueLabel: undefined })
					}
					variant="pie"
				/>
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
						updateTableStyling({
							colorRules: colorRules as ColorRule[],
						})
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
	const hdPercentOn = styling.halfdonut?.showPercentage !== false;
	const hdLegendOn = styling.halfdonut?.showLegend !== false;
	const hdInnerRadius = styling.halfdonut?.innerRadius ?? 0.55;
	const halfDonutTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
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
					<button
						type="button"
						role="switch"
						aria-checked={hdLegendOn}
						className="flex cursor-pointer items-center gap-3"
						onClick={() =>
							updateHalfDonutStyling({
								showLegend: !hdLegendOn,
							})
						}
					>
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${hdLegendOn ? "bg-indigo-500" : "bg-stone-200"}`}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hdLegendOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{hdLegendOn ? "Legend visible" : "Legend hidden"}
						</span>
					</button>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Show Labels">
				<div className="space-y-3 px-4 py-3">
					<button
						type="button"
						role="switch"
						aria-checked={hdValuesOn}
						className="flex cursor-pointer items-center gap-3"
						onClick={() =>
							updateHalfDonutStyling({
								showValues: !hdValuesOn,
							})
						}
					>
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${hdValuesOn ? "bg-indigo-500" : "bg-stone-200"}`}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hdValuesOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{hdValuesOn
								? "Labels visible inside arcs"
								: "Labels hidden"}
						</span>
					</button>
					{hdValuesOn && (
						<div className="flex items-center gap-3">
							<span className="flex-1 text-stone-500 text-xs">
								Show as
							</span>
							<div className="flex overflow-hidden rounded-md border border-stone-200 font-medium text-[11px]">
								<button
									type="button"
									onClick={() =>
										updateHalfDonutStyling({
											showPercentage: true,
										})
									}
									className={`px-2.5 py-1 transition-colors ${hdPercentOn ? "bg-indigo-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"}`}
								>
									%
								</button>
								<button
									type="button"
									onClick={() =>
										updateHalfDonutStyling({
											showPercentage: false,
										})
									}
									className={`border-stone-200 border-l px-2.5 py-1 transition-colors ${!hdPercentOn ? "bg-indigo-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"}`}
								>
									Value
								</button>
							</div>
						</div>
					)}
				</div>
			</ToolAccordion>
			<ToolAccordion title="Target Wedge">
				<div className="space-y-2 px-4 py-3">
					<label
						htmlFor={`${fieldIdPrefix}-halfdonut-wedge-color`}
						className="mb-1.5 block font-semibold text-stone-600 text-xs"
					>
						Wedge Color
					</label>
					<div className="flex items-center gap-2">
						<input
							id={`${fieldIdPrefix}-halfdonut-wedge-color`}
							type="color"
							value={
								styling.halfdonut?.targetWedgeColor ?? "#1e293b"
							}
							onChange={(e) =>
								updateHalfDonutStyling({
									targetWedgeColor: e.target.value,
								})
							}
							className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
						/>
						<span className="font-mono text-stone-500 text-xs">
							{styling.halfdonut?.targetWedgeColor ?? "#1e293b"}
						</span>
						{styling.halfdonut?.targetWedgeColor && (
							<button
								type="button"
								onClick={() =>
									updateHalfDonutStyling({
										targetWedgeColor: undefined,
									})
								}
								className="ml-auto text-[11px] text-stone-400 hover:text-stone-600"
							>
								Reset
							</button>
						)}
					</div>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.halfdonut?.showTooltip}
					description="Show a popover with slice details on hover."
					onChange={(v) => updateHalfDonutStyling({ showTooltip: v })}
					onReset={() =>
						updateHalfDonutStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<div className="space-y-2 px-4 py-3">
					<button
						type="button"
						role="switch"
						aria-checked={hdLabelsOn}
						className="flex cursor-pointer items-center gap-3"
						onClick={() =>
							updateHalfDonutStyling({
								showLabels: !hdLabelsOn,
							})
						}
					>
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${hdLabelsOn ? "bg-indigo-500" : "bg-stone-200"}`}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hdLabelsOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{hdLabelsOn
								? "Category labels visible"
								: "Category labels hidden"}
						</span>
					</button>
				</div>
			</ToolAccordion>
		</>
	);

	// Box plot–specific tools

	// Polar Bar–specific tools
	const pbLabelsOn = styling.polarbar?.showLabels !== false;
	const pbValuesOn = styling.polarbar?.showValues === true;
	const polarBarTools = (
		<>
			<ToolAccordion title="Axis Pointer">
				<AxisPointer
					value={styling.polarbar?.axisPointer}
					onChange={(axisPointer) =>
						updatePolarBarStyling({ axisPointer })
					}
					onReset={() =>
						updatePolarBarStyling({ axisPointer: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="polarbar"
					columnValues={columnValues}
					value={styling.polarbar?.colorRules || []}
					onChange={(colorRules) =>
						updatePolarBarStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updatePolarBarStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>

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

			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.polarbar?.showLegend}
					description="Displays a legend below the chart with one entry per value series."
					onChange={(showLegend) =>
						updatePolarBarStyling({ showLegend })
					}
					onReset={() =>
						updatePolarBarStyling({ showLegend: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.polarbar?.showMinMax}
					onChange={(showMinMax) =>
						updatePolarBarStyling({ showMinMax })
					}
					onReset={() =>
						updatePolarBarStyling({ showMinMax: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Show Values">
				<div className="space-y-2 px-4 py-3">
					<button
						type="button"
						role="switch"
						aria-checked={pbValuesOn}
						className="flex cursor-pointer items-center gap-3"
						onClick={() =>
							updatePolarBarStyling({
								showValues: !pbValuesOn,
							})
						}
					>
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${pbValuesOn ? "bg-indigo-500" : "bg-stone-200"}`}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${pbValuesOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{pbValuesOn ? "Values visible" : "Values hidden"}
						</span>
					</button>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Stack / Unstack">
				<UnstackToggle
					value={styling.polarbar?.unstacked}
					onChange={(unstacked) =>
						updatePolarBarStyling({ unstacked })
					}
					onReset={() =>
						updatePolarBarStyling({ unstacked: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.polarbar?.showTooltip}
					description="Displays a popover with category name, series values, and any configured Tooltip columns when hovering over a bar."
					onChange={(showTooltip) =>
						updatePolarBarStyling({ showTooltip })
					}
					onReset={() =>
						updatePolarBarStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Value Labels">
				<div className="space-y-2 px-4 py-3">
					<button
						type="button"
						role="switch"
						aria-checked={pbLabelsOn}
						className="flex cursor-pointer items-center gap-3"
						onClick={() =>
							updatePolarBarStyling({
								showLabels: !pbLabelsOn,
							})
						}
					>
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${pbLabelsOn ? "bg-indigo-500" : "bg-stone-200"}`}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${pbLabelsOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{pbLabelsOn ? "Labels visible" : "Labels hidden"}
						</span>
					</button>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Zoom">
				<PolarZoom
					value={styling.polarbar?.zoom}
					onChange={(zoom) => updatePolarBarStyling({ zoom })}
					onReset={() => updatePolarBarStyling({ zoom: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	// Radar chart–specific tools
	const radarAreaOn = styling.radar?.showArea === true;
	const radarPolygon = styling.radar?.shapePolygon !== false;
	const radarTools = (
		<>
			<ToolAccordion title="Area Fill">
				<div className="space-y-3 px-4 py-3">
					<button
						type="button"
						role="switch"
						aria-checked={radarAreaOn}
						className="flex cursor-pointer items-center gap-3"
						onClick={() =>
							updateRadarStyling({ showArea: !radarAreaOn })
						}
					>
						<div
							className={`relative h-5 w-10 rounded-full transition-colors ${radarAreaOn ? "bg-indigo-500" : "bg-stone-200"}`}
						>
							<span
								className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${radarAreaOn ? "translate-x-5" : "translate-x-0.5"}`}
							/>
						</div>
						<span className="text-stone-600 text-xs">
							{radarAreaOn ? "Area fill on" : "Area fill off"}
						</span>
					</button>
					{radarAreaOn && (
						<div className="flex flex-col gap-2 pt-1">
							<div className="flex items-center justify-between">
								<span className="text-stone-500 text-xs">
									Fill opacity
								</span>
								<span className="font-medium text-stone-700 text-xs">
									{Math.round(
										(styling.radar?.fillOpacity ?? 0.25) *
											100,
									)}
									%
								</span>
							</div>
							<input
								type="range"
								min={5}
								max={100}
								step={5}
								value={Math.round(
									(styling.radar?.fillOpacity ?? 0.25) * 100,
								)}
								onChange={(e) =>
									updateRadarStyling({
										fillOpacity:
											Number(e.target.value) / 100,
									})
								}
								className="w-full accent-indigo-500"
							/>
						</div>
					)}
				</div>
			</ToolAccordion>

			<ToolAccordion title="Shape">
				<div className="px-4 py-3">
					<div className="flex gap-2">
						<button
							type="button"
							className={`flex-1 rounded-md border py-1.5 font-medium text-xs transition-colors ${radarPolygon ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-stone-200 text-stone-500 hover:border-stone-300"}`}
							onClick={() =>
								updateRadarStyling({ shapePolygon: true })
							}
						>
							Polygon
						</button>
						<button
							type="button"
							className={`flex-1 rounded-md border py-1.5 font-medium text-xs transition-colors ${!radarPolygon ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-stone-200 text-stone-500 hover:border-stone-300"}`}
							onClick={() =>
								updateRadarStyling({ shapePolygon: false })
							}
						>
							Circle
						</button>
					</div>
				</div>
			</ToolAccordion>

			<ToolAccordion title="Tooltips">
				<ShowTooltipToggle
					value={styling.radar?.showTooltip}
					description="Displays data values on hover."
					onChange={(showTooltip) =>
						updateRadarStyling({ showTooltip })
					}
					onReset={() =>
						updateRadarStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={yKeys}
					valueColumns={columns}
					visualizationType="radar"
					columnValues={yKeyAggregatedColumnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.radar?.colorRules || []}
					onChange={(colorRules) =>
						updateRadarStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateRadarStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Value Labels">
				<LineValueLabelEditor
					value={styling.radar?.valueLabel}
					onChange={(v) => updateRadarStyling({ valueLabel: v })}
					onReset={() =>
						updateRadarStyling({ valueLabel: undefined })
					}
					variant="bar"
				/>
			</ToolAccordion>

			<ToolAccordion title="Normalize Axes">
				<ShowTooltipToggle
					value={styling.radar?.normalizeAxes}
					label="Normalize axes"
					description="Scales all spoke axes to a shared 0–max domain for cross-axis comparison."
					onChange={(normalizeAxes) =>
						updateRadarStyling({ normalizeAxes })
					}
					onReset={() =>
						updateRadarStyling({ normalizeAxes: undefined })
					}
				/>
			</ToolAccordion>
		</>
	);

	// Box plot–specific tools
	const boxPlotTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color By Value">
				<ColorByValue
					columns={sortableColumns ?? yKeys}
					valueColumns={columns}
					visualizationType="bar"
					columnValues={yKeyAggregatedColumnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.boxplot?.colorRules || []}
					onChange={(colorRules) =>
						updateBoxPlotStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateBoxPlotStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Edit X Axis">
				<AxisSettings
					axis="x"
					value={styling.boxplot?.xAxisConfig}
					onChange={(updates) => updateBoxPlotXAxis(updates)}
					defaultTitle={xKey ?? ""}
					onReset={() =>
						updateBoxPlotStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Edit Y Axis">
				<AxisSettings
					axis="y"
					value={styling.boxplot?.yAxisConfig}
					onChange={(updates) => updateBoxPlotYAxis(updates)}
					defaultTitle={buildDefaultYAxisTitle(
						yKeys,
						columnAggregations,
					)}
					onReset={() =>
						updateBoxPlotStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Axis">
				<FlipAxis
					value={styling.boxplot?.flipAxis}
					onChange={(v) => updateBoxPlotStyling({ flipAxis: v })}
					onReset={() =>
						updateBoxPlotStyling({ flipAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Toggle Tooltips">
				<ShowTooltipToggle
					value={styling.boxplot?.showTooltip}
					onChange={(v) => updateBoxPlotStyling({ showTooltip: v })}
					onReset={() =>
						updateBoxPlotStyling({ showTooltip: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.boxplot?.zoomX}
					onChange={(v) => updateBoxPlotStyling({ zoomX: v })}
					onReset={() => updateBoxPlotStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.boxplot?.zoomY}
					onChange={(v) => updateBoxPlotStyling({ zoomY: v })}
					onReset={() => updateBoxPlotStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Show Outliers">
				<ShowTooltipToggle
					label="Show outliers"
					value={styling.boxplot?.showOutliers ?? true}
					onChange={(v) => updateBoxPlotStyling({ showOutliers: v })}
					onReset={() =>
						updateBoxPlotStyling({ showOutliers: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Whisker Type">
				<div className="flex flex-col gap-3 px-1 py-1">
					<div className="flex overflow-hidden rounded border border-stone-200 text-xs">
						{(["iqr", "minmax"] as const).map((opt) => (
							<button
								key={opt}
								type="button"
								onClick={() =>
									updateBoxPlotStyling({ whiskerType: opt })
								}
								className={`flex-1 py-1 capitalize transition-colors ${
									(styling.boxplot?.whiskerType ?? "iqr") ===
									opt
										? "bg-indigo-500 font-medium text-white"
										: "bg-white text-stone-600 hover:bg-stone-50"
								}`}
							>
								{opt === "iqr" ? "IQR (1.5×)" : "Min – Max"}
							</button>
						))}
					</div>
					<p className="text-[11px] text-stone-400">
						{(styling.boxplot?.whiskerType ?? "iqr") === "iqr"
							? "Whiskers extend to 1.5× IQR; points beyond are outliers."
							: "Whiskers extend to data min/max; no outliers are plotted."}
					</p>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Fill Opacity">
				<div className="flex flex-col gap-2 px-1 py-1">
					<div className="flex items-center gap-3">
						<input
							type="range"
							min={0}
							max={1}
							step={0.05}
							value={styling.boxplot?.fillOpacity ?? 0.6}
							onChange={(e) =>
								updateBoxPlotStyling({
									fillOpacity: parseFloat(e.target.value),
								})
							}
							className="flex-1 accent-indigo-500"
						/>
						<span className="w-8 text-right text-stone-600 text-xs tabular-nums">
							{Math.round(
								(styling.boxplot?.fillOpacity ?? 0.6) * 100,
							)}
							%
						</span>
					</div>
				</div>
			</ToolAccordion>
		</>
	);

	// Cluster chart–specific tools
	const clusterTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="cluster"
					columnValues={columnValues}
					value={styling.cluster?.colorRules || []}
					onChange={(colorRules) =>
						updateClusterStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateClusterStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
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
	const mlTooltipOn = styling.multiline?.showTooltip !== false;
	const multilineTools = (
		<>
			<ToolAccordion title="Average Line">
				<AverageToggle
					value={styling.multiline?.showAverage}
					onChange={(v) => updateMultilineStyling({ showAverage: v })}
					onReset={() =>
						updateMultilineStyling({ showAverage: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.multiline?.showMinMax}
					onChange={(v) => updateMultilineStyling({ showMinMax: v })}
					onReset={() =>
						updateMultilineStyling({ showMinMax: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={columns}
					visualizationType="line"
					columnValues={columnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.multiline?.colorRules || []}
					onChange={(colorRules) =>
						updateMultilineStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateMultilineStyling({ colorRules: [] })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>

			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.multiline?.showLegend}
					onChange={(v) => updateMultilineStyling({ showLegend: v })}
					onReset={() =>
						updateMultilineStyling({ showLegend: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Line Styling">
				<LineStyle
					value={{
						curveType: styling.multiline?.curveType,
						lineType: styling.multiline?.lineType,
						lineWidth: styling.multiline?.lineWidth,
					}}
					onChange={(updates) => updateMultilineStyling(updates)}
					onReset={() =>
						updateMultilineStyling({
							curveType: undefined,
							lineType: undefined,
							lineWidth: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Save Zoom">
				<SaveZoom
					value={styling.multiline?.saveZoom}
					savedZoomX={styling.multiline?.savedZoomX}
					savedZoomY={styling.multiline?.savedZoomY}
					zoomXEnabled={styling.multiline?.zoomX}
					zoomYEnabled={styling.multiline?.zoomY}
					onChange={(v) => updateMultilineStyling({ saveZoom: v })}
					onReset={() =>
						updateMultilineStyling({
							saveZoom: undefined,
							savedZoomX: undefined,
							savedZoomY: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Symbol Style">
				<SymbolStyle
					symbolType={styling.multiline?.symbolType}
					symbolSize={styling.multiline?.symbolSize}
					defaultSymbolType="circle"
					onChange={(updates) => updateMultilineStyling(updates)}
					onReset={() =>
						updateMultilineStyling({
							symbolType: undefined,
							symbolSize: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Target Areas">
				<TargetArea
					value={styling.multiline?.targetAreas ?? []}
					onChange={(v) => updateMultilineStyling({ targetAreas: v })}
					onReset={() =>
						updateMultilineStyling({ targetAreas: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Target Lines">
				<TargetLine
					value={styling.multiline?.targetLines ?? []}
					onChange={(v) => updateMultilineStyling({ targetLines: v })}
					onReset={() =>
						updateMultilineStyling({ targetLines: undefined })
					}
				/>
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
				<Trendline
					value={
						styling.multiline?.trendlineType ??
						(styling.multiline?.showTrendline ? "exact" : undefined)
					}
					onChange={(v) =>
						updateMultilineStyling({
							trendlineType: v as NonNullable<
								VisualizationStyling["multiline"]
							>["trendlineType"],
							showTrendline: undefined,
						})
					}
					onReset={() =>
						updateMultilineStyling({
							trendlineType: undefined,
							showTrendline: undefined,
						})
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Value Labels">
				<LineValueLabelEditor
					value={
						styling.multiline?.valueLabel ??
						(styling.multiline?.showValueLabels
							? { show: true }
							: undefined)
					}
					onChange={(v) =>
						updateMultilineStyling({
							valueLabel: v,
							showValueLabels: undefined,
						})
					}
					onReset={() =>
						updateMultilineStyling({
							valueLabel: undefined,
							showValueLabels: undefined,
						})
					}
					variant="line"
				/>
			</ToolAccordion>

			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					axis="x"
					value={styling.multiline?.xAxisConfig}
					onChange={updateMultilineXAxis}
					showFlipAxis
					onReset={() =>
						updateMultilineStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					axis="y"
					value={styling.multiline?.yAxisConfig}
					onChange={updateMultilineYAxis}
					showFlipAxis
					onReset={() =>
						updateMultilineStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>

			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.multiline?.zoomX}
					onChange={(v) => updateMultilineStyling({ zoomX: v })}
					onReset={() => updateMultilineStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>

			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.multiline?.zoomY}
					onChange={(v) => updateMultilineStyling({ zoomY: v })}
					onReset={() => updateMultilineStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	// Treemap-specific tools
	const tmTooltipOn = styling.treemap?.showTooltip !== false;
	const tmParentsOn = styling.treemap?.showParentRelationships !== false;
	const tmAllColumns = [
		xKey,
		...yKeys,
		...columns.filter((c) => c !== xKey && !yKeys.includes(c)),
	].filter(Boolean) as string[];
	const tmFontFamilies = [
		"Inter",
		"Arial",
		"Helvetica",
		"Georgia",
		"Times New Roman",
		"Courier New",
		"Monaco",
	];
	const tmFontWeights = [
		{ label: "Normal", value: "normal" },
		{ label: "Medium", value: "500" },
		{ label: "Semibold", value: "600" },
		{ label: "Bold", value: "bold" },
	];
	const tmInputCls =
		"w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400";
	const tmSelectCls = `${tmInputCls} bg-white`;
	const tmLabelCls = "block text-xs font-semibold text-stone-600 mb-1";
	const treemapTools = (
		<>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={tmAllColumns}
					valueColumns={columns}
					visualizationType="treemap"
					value={
						(styling.treemap?.colorRules as
							| ColorRule[]
							| undefined) ?? []
					}
					onChange={(rules) =>
						updateTreemapStyling({
							colorRules: rules as ColorRule[],
						})
					}
					onReset={() => updateTreemapStyling({ colorRules: [] })}
					columnValues={columnValues}
					columnLabels={yKeyColumnLabels}
				/>
			</ToolAccordion>
			<ToolAccordion title="Tile Labels">
				<div className="space-y-3">
					<div>
						<label
							htmlFor={`${fieldIdPrefix}-treemap-tile-font-family`}
							className={tmLabelCls}
						>
							Font Family
						</label>
						<select
							id={`${fieldIdPrefix}-treemap-tile-font-family`}
							value={
								styling.treemap?.tileLabel?.fontFamily ??
								"Inter"
							}
							onChange={(e) =>
								updateTreemapTileLabel({
									fontFamily: e.target.value,
								})
							}
							className={tmSelectCls}
						>
							{tmFontFamilies.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
						</select>
					</div>
					<div>
						<label
							htmlFor={`${fieldIdPrefix}-treemap-tile-font-size`}
							className={tmLabelCls}
						>
							Font Size
						</label>
						<input
							id={`${fieldIdPrefix}-treemap-tile-font-size`}
							type="number"
							min={6}
							max={32}
							value={styling.treemap?.tileLabel?.fontSize ?? 10}
							onChange={(e) =>
								updateTreemapTileLabel({
									fontSize: Number(e.target.value) || 10,
								})
							}
							className={tmInputCls}
						/>
					</div>
					<div>
						<label
							htmlFor={`${fieldIdPrefix}-treemap-tile-font-weight`}
							className={tmLabelCls}
						>
							Font Weight
						</label>
						<select
							id={`${fieldIdPrefix}-treemap-tile-font-weight`}
							value={
								styling.treemap?.tileLabel?.fontWeight ?? "600"
							}
							onChange={(e) =>
								updateTreemapTileLabel({
									fontWeight: e.target.value,
								})
							}
							className={tmSelectCls}
						>
							{tmFontWeights.map((w) => (
								<option key={w.value} value={w.value}>
									{w.label}
								</option>
							))}
						</select>
					</div>
					<div>
						<label
							htmlFor={`${fieldIdPrefix}-treemap-tile-color`}
							className={tmLabelCls}
						>
							Color
						</label>
						<div className="flex items-center gap-2">
							<input
								id={`${fieldIdPrefix}-treemap-tile-color`}
								type="color"
								value={
									styling.treemap?.tileLabel?.color ??
									"#ffffff"
								}
								onChange={(e) =>
									updateTreemapTileLabel({
										color: e.target.value,
									})
								}
								className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
							/>
							<span className="font-mono text-stone-500 text-xs">
								{styling.treemap?.tileLabel?.color ?? "#ffffff"}
							</span>
						</div>
					</div>
					<div className="pt-1">
						<ResetButton
							onReset={() =>
								updateTreemapStyling({ tileLabel: undefined })
							}
						/>
					</div>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Tooltips">
				<div className="flex items-center justify-between">
					<span className="text-stone-600 text-xs">
						Show tooltip on hover
					</span>
					<button
						type="button"
						onClick={() =>
							updateTreemapStyling({ showTooltip: !tmTooltipOn })
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							tmTooltipOn ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
								tmTooltipOn
									? "translate-x-4"
									: "translate-x-0.5"
							}`}
						/>
					</button>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Show Parent Relationships">
				<div className="flex items-center justify-between">
					<span className="text-stone-600 text-xs">
						Show parent group tiles
					</span>
					<button
						type="button"
						onClick={() =>
							updateTreemapStyling({
								showParentRelationships: !tmParentsOn,
							})
						}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							tmParentsOn ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
								tmParentsOn
									? "translate-x-4"
									: "translate-x-0.5"
							}`}
						/>
					</button>
				</div>
				{tmParentsOn && (
					<div className="mt-4 space-y-3 border-stone-100 border-t pt-3">
						<p className="font-semibold text-stone-600 text-xs">
							Header Style
						</p>
						<div>
							<label
								htmlFor={`${fieldIdPrefix}-treemap-header-background`}
								className={tmLabelCls}
							>
								Background
							</label>
							<div className="flex items-center gap-2">
								<input
									id={`${fieldIdPrefix}-treemap-header-background`}
									type="color"
									value={
										styling.treemap?.headerFill ?? "#e2e8f0"
									}
									onChange={(e) =>
										updateTreemapStyling({
											headerFill: e.target.value,
										})
									}
									className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
								/>
								<span className="font-mono text-stone-500 text-xs">
									{styling.treemap?.headerFill ?? "#e2e8f0"}
								</span>
							</div>
						</div>
						<div>
							<label
								htmlFor={`${fieldIdPrefix}-treemap-header-font-family`}
								className={tmLabelCls}
							>
								Font Family
							</label>
							<select
								id={`${fieldIdPrefix}-treemap-header-font-family`}
								value={
									styling.treemap?.headerLabel?.fontFamily ??
									"Inter"
								}
								onChange={(e) =>
									updateTreemapHeaderLabel({
										fontFamily: e.target.value,
									})
								}
								className={tmSelectCls}
							>
								{tmFontFamilies.map((f) => (
									<option key={f} value={f}>
										{f}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor={`${fieldIdPrefix}-treemap-header-font-size`}
								className={tmLabelCls}
							>
								Font Size
							</label>
							<input
								id={`${fieldIdPrefix}-treemap-header-font-size`}
								type="number"
								min={6}
								max={32}
								value={
									styling.treemap?.headerLabel?.fontSize ?? 11
								}
								onChange={(e) =>
									updateTreemapHeaderLabel({
										fontSize: Number(e.target.value) || 11,
									})
								}
								className={tmInputCls}
							/>
						</div>
						<div>
							<label
								htmlFor={`${fieldIdPrefix}-treemap-header-font-weight`}
								className={tmLabelCls}
							>
								Font Weight
							</label>
							<select
								id={`${fieldIdPrefix}-treemap-header-font-weight`}
								value={
									styling.treemap?.headerLabel?.fontWeight ??
									"bold"
								}
								onChange={(e) =>
									updateTreemapHeaderLabel({
										fontWeight: e.target.value,
									})
								}
								className={tmSelectCls}
							>
								{tmFontWeights.map((w) => (
									<option key={w.value} value={w.value}>
										{w.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor={`${fieldIdPrefix}-treemap-header-text-color`}
								className={tmLabelCls}
							>
								Text Color
							</label>
							<div className="flex items-center gap-2">
								<input
									id={`${fieldIdPrefix}-treemap-header-text-color`}
									type="color"
									value={
										styling.treemap?.headerLabel?.color ??
										"#0f172a"
									}
									onChange={(e) =>
										updateTreemapHeaderLabel({
											color: e.target.value,
										})
									}
									className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
								/>
								<span className="font-mono text-stone-500 text-xs">
									{styling.treemap?.headerLabel?.color ??
										"#0f172a"}
								</span>
							</div>
						</div>
						<div className="pt-1">
							<ResetButton
								onReset={() =>
									updateTreemapStyling({
										headerFill: undefined,
										headerLabel: undefined,
									})
								}
							/>
						</div>
					</div>
				)}
			</ToolAccordion>
		</>
	);

	// Stackbar-specific tools
	const stackbarAxisDefaults = {
		x: xKey || undefined,
		y: buildDefaultYAxisTitle(yKeys, columnAggregations) || undefined,
	};
	const stackbarTools = (
		<>
			<ToolAccordion title="Average Line">
				<AverageToggle
					value={styling.stackbar?.showAverage}
					onChange={(v) => updateStackbarStyling({ showAverage: v })}
					onReset={() =>
						updateStackbarStyling({ showAverage: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Axis Pointer">
				<AxisPointer
					value={styling.stackbar?.axisPointer}
					onChange={(v) => updateStackbarStyling({ axisPointer: v })}
					onReset={() =>
						updateStackbarStyling({ axisPointer: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Bar Width">
				<BarWidth
					value={styling.stackbar?.barWidth}
					onChange={(v) => updateStackbarStyling({ barWidth: v })}
					onReset={() =>
						updateStackbarStyling({ barWidth: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={yKeys}
					valueColumns={columns}
					visualizationType="bar"
					columnValues={yKeyAggregatedColumnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.stackbar?.colorRules || []}
					onChange={(colorRules) =>
						updateStackbarStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateStackbarStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Axis">
				<FlipAxis
					value={styling.stackbar?.flipAxis}
					onChange={(v) => updateStackbarStyling({ flipAxis: v })}
					onReset={() =>
						updateStackbarStyling({ flipAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Series">
				<FlipSeries
					value={styling.stackbar?.flipSeries}
					onChange={(v) => updateStackbarStyling({ flipSeries: v })}
					onReset={() =>
						updateStackbarStyling({ flipSeries: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.stackbar?.showLegend}
					description="Only displayed when more than one series is configured."
					onChange={(v) => updateStackbarStyling({ showLegend: v })}
					onReset={() =>
						updateStackbarStyling({ showLegend: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.stackbar?.showMinMax}
					onChange={(v) => updateStackbarStyling({ showMinMax: v })}
					onReset={() =>
						updateStackbarStyling({ showMinMax: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Reverse Y Axis">
				<ReverseYAxis
					value={styling.stackbar?.reverseYAxis}
					onChange={(v) => updateStackbarStyling({ reverseYAxis: v })}
					onReset={() =>
						updateStackbarStyling({ reverseYAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Areas">
				<TargetArea
					value={styling.stackbar?.targetAreas}
					onChange={(areas) =>
						updateStackbarStyling({ targetAreas: areas })
					}
					onReset={() =>
						updateStackbarStyling({ targetAreas: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Lines">
				<TargetLine
					value={styling.stackbar?.targetLines}
					onChange={(lines) =>
						updateStackbarStyling({ targetLines: lines })
					}
					onReset={() =>
						updateStackbarStyling({ targetLines: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Trendline">
				<Trendline
					value={styling.stackbar?.trendlineType}
					onChange={(v) =>
						updateStackbarStyling({ trendlineType: v })
					}
					onReset={() =>
						updateStackbarStyling({ trendlineType: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Unstack / Stack">
				<UnstackToggle
					value={styling.stackbar?.unstacked}
					onChange={(v) => updateStackbarStyling({ unstacked: v })}
					onReset={() =>
						updateStackbarStyling({ unstacked: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<LineValueLabelEditor
					value={styling.stackbar?.valueLabel}
					onChange={(v) => updateStackbarStyling({ valueLabel: v })}
					onReset={() =>
						updateStackbarStyling({ valueLabel: undefined })
					}
					variant="bar"
				/>
			</ToolAccordion>
			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					axis="x"
					value={styling.stackbar?.xAxisConfig}
					onChange={(updates) => updateStackbarXAxis(updates)}
					defaultTitle={stackbarAxisDefaults.x}
					onReset={() =>
						updateStackbarStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					axis="y"
					value={styling.stackbar?.yAxisConfig}
					onChange={(updates) => updateStackbarYAxis(updates)}
					defaultTitle={stackbarAxisDefaults.y}
					onReset={() =>
						updateStackbarStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.stackbar?.zoomX}
					onChange={(v) => updateStackbarStyling({ zoomX: v })}
					onReset={() => updateStackbarStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.stackbar?.zoomY}
					onChange={(v) => updateStackbarStyling({ zoomY: v })}
					onReset={() => updateStackbarStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Save Zoom">
				<SaveZoom
					value={styling.stackbar?.saveZoom}
					savedZoomX={styling.stackbar?.savedZoomX}
					savedZoomY={styling.stackbar?.savedZoomY}
					zoomXEnabled={styling.stackbar?.zoomX}
					zoomYEnabled={styling.stackbar?.zoomY}
					onChange={(v) => updateStackbarStyling({ saveZoom: v })}
					onReset={() =>
						updateStackbarStyling({
							saveZoom: undefined,
							savedZoomX: undefined,
							savedZoomY: undefined,
						})
					}
				/>
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
			<ToolAccordion title="Average Line">
				<AverageToggle
					value={styling.stackbar?.showAverage}
					onChange={(v) => updateStackbarStyling({ showAverage: v })}
					onReset={() =>
						updateStackbarStyling({ showAverage: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Axis Pointer">
				<AxisPointer
					value={styling.stackbar?.axisPointer}
					onChange={(v) => updateStackbarStyling({ axisPointer: v })}
					onReset={() =>
						updateStackbarStyling({ axisPointer: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Bar Width">
				<BarWidth
					value={styling.bar?.barWidth}
					onChange={(v) => updateBarStyling({ barWidth: v })}
					onReset={() => updateBarStyling({ barWidth: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={yKeys}
					valueColumns={columns}
					visualizationType="bar"
					columnValues={yKeyAggregatedColumnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.bar?.colorRules || []}
					onChange={(colorRules) =>
						updateBarStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateBarStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Axis">
				<FlipAxis
					value={styling.stackbar?.flipAxis}
					onChange={(v) => updateStackbarStyling({ flipAxis: v })}
					onReset={() =>
						updateStackbarStyling({ flipAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Series">
				<FlipSeries
					value={styling.stackbar?.flipSeries}
					onChange={(v) => updateStackbarStyling({ flipSeries: v })}
					onReset={() =>
						updateStackbarStyling({ flipSeries: undefined })
					}
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
			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.stackbar?.showMinMax}
					onChange={(v) => updateStackbarStyling({ showMinMax: v })}
					onReset={() =>
						updateStackbarStyling({ showMinMax: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Reverse Y Axis">
				<ReverseYAxis
					value={styling.stackbar?.reverseYAxis}
					onChange={(v) => updateStackbarStyling({ reverseYAxis: v })}
					onReset={() =>
						updateStackbarStyling({ reverseYAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Areas">
				<TargetArea
					value={styling.stackbar?.targetAreas}
					onChange={(areas) =>
						updateStackbarStyling({ targetAreas: areas })
					}
					onReset={() =>
						updateStackbarStyling({ targetAreas: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Lines">
				<TargetLine
					value={styling.stackbar?.targetLines}
					onChange={(lines) =>
						updateStackbarStyling({ targetLines: lines })
					}
					onReset={() =>
						updateStackbarStyling({ targetLines: undefined })
					}
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
				<LineValueLabelEditor
					value={styling.bar?.valueLabel}
					onChange={(v) => updateBarStyling({ valueLabel: v })}
					onReset={() => updateBarStyling({ valueLabel: undefined })}
					variant="bar"
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
			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.stackbar?.zoomX}
					onChange={(v) => updateStackbarStyling({ zoomX: v })}
					onReset={() => updateStackbarStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.stackbar?.zoomY}
					onChange={(v) => updateStackbarStyling({ zoomY: v })}
					onReset={() => updateStackbarStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Save Zoom">
				<SaveZoom
					value={styling.stackbar?.saveZoom}
					savedZoomX={styling.stackbar?.savedZoomX}
					savedZoomY={styling.stackbar?.savedZoomY}
					zoomXEnabled={styling.stackbar?.zoomX}
					zoomYEnabled={styling.stackbar?.zoomY}
					onChange={(v) => updateStackbarStyling({ saveZoom: v })}
					onReset={() =>
						updateStackbarStyling({
							saveZoom: undefined,
							savedZoomX: undefined,
							savedZoomY: undefined,
						})
					}
				/>
			</ToolAccordion>
		</>
	);

	// Area-specific tools
	const areaTools = (
		<>
			<ToolAccordion title="Average Line">
				<AverageToggle
					value={styling.area?.showAverage}
					onChange={(v) => updateAreaStyling({ showAverage: v })}
					onReset={() =>
						updateAreaStyling({ showAverage: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Axis Pointer">
				<AxisPointer
					value={styling.area?.axisPointer}
					onChange={(v) => updateAreaStyling({ axisPointer: v })}
					onReset={() =>
						updateAreaStyling({ axisPointer: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={yKeys}
					valueColumns={columns}
					visualizationType="area"
					columnValues={yKeyAggregatedColumnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.area?.colorRules || []}
					onChange={(colorRules) =>
						updateAreaStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateAreaStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Display Total">
				<AreaShowTotals
					value={styling.area?.showTotals}
					onChange={(v) => updateAreaStyling({ showTotals: v })}
					onReset={() => updateAreaStyling({ showTotals: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Axis">
				<FlipAxis
					value={styling.area?.flipAxis}
					onChange={(v) => updateAreaStyling({ flipAxis: v })}
					onReset={() => updateAreaStyling({ flipAxis: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Series">
				<FlipSeries
					value={styling.area?.flipSeries}
					onChange={(v) => updateAreaStyling({ flipSeries: v })}
					onReset={() => updateAreaStyling({ flipSeries: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.area?.showLegend}
					description="Only displayed when more than one series is configured."
					onChange={(v) => updateAreaStyling({ showLegend: v })}
					onReset={() => updateAreaStyling({ showLegend: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Line Styling">
				<LineStyle
					value={{
						curveType: styling.area?.curveType,
						lineType: styling.area?.lineType,
						lineWidth: styling.area?.lineWidth,
					}}
					onChange={(updates) => updateAreaStyling(updates)}
					onReset={() =>
						updateAreaStyling({
							curveType: undefined,
							lineType: undefined,
							lineWidth: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.area?.showMinMax}
					onChange={(v) => updateAreaStyling({ showMinMax: v })}
					onReset={() => updateAreaStyling({ showMinMax: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Reverse Y Axis">
				<ReverseYAxis
					value={styling.area?.reverseYAxis}
					onChange={(v) => updateAreaStyling({ reverseYAxis: v })}
					onReset={() =>
						updateAreaStyling({ reverseYAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Save Zoom">
				<SaveZoom
					value={styling.area?.saveZoom}
					savedZoomX={styling.area?.savedZoomX}
					savedZoomY={styling.area?.savedZoomY}
					zoomXEnabled={styling.area?.zoomX}
					zoomYEnabled={styling.area?.zoomY}
					onChange={(v) => updateAreaStyling({ saveZoom: v })}
					onReset={() =>
						updateAreaStyling({
							saveZoom: undefined,
							savedZoomX: undefined,
							savedZoomY: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Stack / Unstack">
				<UnstackToggle
					value={styling.area?.unstacked}
					onChange={(v) => updateAreaStyling({ unstacked: v })}
					onReset={() => updateAreaStyling({ unstacked: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Symbol Style">
				<SymbolStyle
					symbolType={styling.area?.symbolType}
					symbolSize={styling.area?.symbolSize}
					defaultSymbolType="none"
					onChange={(updates) => updateAreaStyling(updates)}
					onReset={() =>
						updateAreaStyling({
							symbolType: undefined,
							symbolSize: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Areas">
				<TargetArea
					value={styling.area?.targetAreas}
					onChange={(areas) =>
						updateAreaStyling({ targetAreas: areas })
					}
					onReset={() =>
						updateAreaStyling({ targetAreas: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Lines">
				<TargetLine
					value={styling.area?.targetLines}
					onChange={(lines) =>
						updateAreaStyling({ targetLines: lines })
					}
					onReset={() =>
						updateAreaStyling({ targetLines: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Trendline">
				<Trendline
					value={styling.area?.trendlineType}
					onChange={(v) => updateAreaStyling({ trendlineType: v })}
					onReset={() =>
						updateAreaStyling({ trendlineType: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<LineValueLabelEditor
					value={styling.area?.valueLabel}
					onChange={(v) => updateAreaStyling({ valueLabel: v })}
					onReset={() => updateAreaStyling({ valueLabel: undefined })}
					variant="line"
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.area?.zoomX}
					onChange={(v) => updateAreaStyling({ zoomX: v })}
					onReset={() => updateAreaStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.area?.zoomY}
					onChange={(v) => updateAreaStyling({ zoomY: v })}
					onReset={() => updateAreaStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					axis="x"
					value={styling.area?.xAxisConfig}
					onChange={(updates) => updateAreaXAxis(updates)}
					defaultTitle={barAxisDefaults.x}
					onReset={() =>
						updateAreaStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					axis="y"
					value={styling.area?.yAxisConfig}
					onChange={(updates) => updateAreaYAxis(updates)}
					defaultTitle={barAxisDefaults.y}
					onReset={() =>
						updateAreaStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
		</>
	);

	// Line-specific tools
	const lineTools = (
		<>
			<ToolAccordion title="Average Line">
				<AverageToggle
					value={styling.line?.showAverage}
					onChange={(v) => updateLineStyling({ showAverage: v })}
					onReset={() =>
						updateLineStyling({ showAverage: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Axis Pointer">
				<AxisPointer
					value={styling.line?.axisPointer}
					onChange={(v) => updateLineStyling({ axisPointer: v })}
					onReset={() =>
						updateLineStyling({ axisPointer: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={yKeys}
					valueColumns={columns}
					visualizationType="line"
					columnValues={yKeyAggregatedColumnValues}
					columnLabels={yKeyColumnLabels}
					value={styling.line?.colorRules || []}
					onChange={(colorRules) =>
						updateLineStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateLineStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Display Total">
				<AreaShowTotals
					value={styling.line?.showTotals}
					onChange={(v) => updateLineStyling({ showTotals: v })}
					onReset={() => updateLineStyling({ showTotals: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Axis">
				<FlipAxis
					value={styling.line?.flipAxis}
					onChange={(v) => updateLineStyling({ flipAxis: v })}
					onReset={() => updateLineStyling({ flipAxis: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Series">
				<FlipSeries
					value={styling.line?.flipSeries}
					onChange={(v) => updateLineStyling({ flipSeries: v })}
					onReset={() => updateLineStyling({ flipSeries: undefined })}
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
			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.line?.showMinMax}
					onChange={(v) => updateLineStyling({ showMinMax: v })}
					onReset={() => updateLineStyling({ showMinMax: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Reverse Y Axis">
				<ReverseYAxis
					value={styling.line?.reverseYAxis}
					onChange={(v) => updateLineStyling({ reverseYAxis: v })}
					onReset={() =>
						updateLineStyling({ reverseYAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Save Zoom">
				<SaveZoom
					value={styling.line?.saveZoom}
					savedZoomX={styling.line?.savedZoomX}
					savedZoomY={styling.line?.savedZoomY}
					zoomXEnabled={styling.line?.zoomX}
					zoomYEnabled={styling.line?.zoomY}
					onChange={(v) => updateLineStyling({ saveZoom: v })}
					onReset={() =>
						updateLineStyling({
							saveZoom: undefined,
							savedZoomX: undefined,
							savedZoomY: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Symbol Style">
				<SymbolStyle
					symbolType={styling.line?.symbolType}
					symbolSize={styling.line?.symbolSize}
					defaultSymbolType="circle"
					onChange={(updates) => updateLineStyling(updates)}
					onReset={() =>
						updateLineStyling({
							symbolType: undefined,
							symbolSize: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Areas">
				<TargetArea
					value={styling.line?.targetAreas ?? []}
					onChange={(v) => updateLineStyling({ targetAreas: v })}
					onReset={() =>
						updateLineStyling({ targetAreas: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Lines">
				<TargetLine
					value={styling.line?.targetLines ?? []}
					onChange={(v) => updateLineStyling({ targetLines: v })}
					onReset={() =>
						updateLineStyling({ targetLines: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Trendline">
				<Trendline
					value={styling.line?.trendlineType}
					onChange={(v) =>
						updateLineStyling({
							trendlineType: v as NonNullable<
								VisualizationStyling["line"]
							>["trendlineType"],
						})
					}
					onReset={() =>
						updateLineStyling({ trendlineType: undefined })
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
			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.line?.zoomX}
					onChange={(v) => updateLineStyling({ zoomX: v })}
					onReset={() => updateLineStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.line?.zoomY}
					onChange={(v) => updateLineStyling({ zoomY: v })}
					onReset={() => updateLineStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	// Pie-specific tools
	const pieTools = (
		<>
			<ToolAccordion title="Animation">
				<div className="space-y-2 px-1">
					{(
						[
							"none",
							"linear",
							"exponential",
							"elastic",
							"expansion",
						] as const
					).map((type) => (
						<label
							key={type}
							className="flex cursor-pointer items-center gap-2 text-xs"
						>
							<input
								type="radio"
								name="pieAnimation"
								className="accent-indigo-500"
								checked={
									(styling.pie?.animation?.type ?? "none") ===
									type
								}
								onChange={() =>
									updatePieStyling({
										animation:
											type === "none"
												? undefined
												: { type },
									})
								}
							/>
							<span className="text-stone-700 capitalize">
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</span>
						</label>
					))}
					<div className="pt-1">
						<ResetButton
							onReset={() =>
								updatePieStyling({ animation: undefined })
							}
						/>
					</div>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Bucket">
				<div className="space-y-3 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">Buckets</span>
						<span className="font-medium text-stone-700 text-xs">
							{styling.pie?.bucket != null
								? styling.pie.bucket
								: "All"}
						</span>
					</div>
					<input
						type="range"
						min={1}
						max={20}
						step={1}
						value={styling.pie?.bucket ?? 20}
						onChange={(e) =>
							updatePieStyling({ bucket: Number(e.target.value) })
						}
						className="w-full accent-indigo-500"
					/>
					<p className="text-stone-500 text-xs">
						Top N slices by value; remaining merged into "Other".
					</p>
					<ResetButton
						onReset={() => updatePieStyling({ bucket: undefined })}
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
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
			<ToolAccordion title="Pie Radius">
				<div className="space-y-3 px-1 py-1">
					<div className="flex items-center justify-between">
						<span className="text-stone-500 text-xs">
							Outer Radius
						</span>
						<span className="font-medium text-stone-700 text-xs">
							{styling.pie?.outerRadius ?? 68}%
						</span>
					</div>
					<input
						type="range"
						min={20}
						max={100}
						step={1}
						value={styling.pie?.outerRadius ?? 68}
						onChange={(e) =>
							updatePieStyling({
								outerRadius: Number(e.target.value),
							})
						}
						className="w-full accent-indigo-500"
					/>
					<ResetButton
						onReset={() =>
							updatePieStyling({ outerRadius: undefined })
						}
					/>
				</div>
			</ToolAccordion>
			<ToolAccordion title="Rose">
				<div className="space-y-2 px-1">
					{(
						[
							["default", "Default"],
							["roseRadius", "Rose Radius"],
							["roseArea", "Rose Area"],
						] as const
					).map(([val, label]) => (
						<label
							key={val}
							className="flex cursor-pointer items-center gap-2 text-xs"
						>
							<input
								type="radio"
								name="pieRose"
								className="accent-indigo-500"
								checked={
									(styling.pie?.roseType ?? "default") === val
								}
								onChange={() =>
									updatePieStyling({
										roseType:
											val === "default" ? undefined : val,
									})
								}
							/>
							<span className="text-stone-700">{label}</span>
						</label>
					))}
					<p className="pt-1 text-stone-500 text-xs">
						Rose: equal-angle wedges with radius representing value.
					</p>
					<ResetButton
						onReset={() =>
							updatePieStyling({ roseType: undefined })
						}
					/>
				</div>
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

	const comboTools = (
		<>
			<ToolAccordion title="Average Line">
				<AverageToggle
					value={styling.combo?.showAverage}
					onChange={(v) => updateComboStyling({ showAverage: v })}
					onReset={() =>
						updateComboStyling({ showAverage: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Axis Pointer">
				<AxisPointer
					value={styling.combo?.axisPointer}
					onChange={(v) => updateComboStyling({ axisPointer: v })}
					onReset={() =>
						updateComboStyling({ axisPointer: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Bar Width">
				<BarWidth
					value={styling.combo?.barWidth}
					onChange={(v) => updateComboStyling({ barWidth: v })}
					onReset={() => updateComboStyling({ barWidth: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color by Value">
				<ColorByValue
					columns={comboColorColumns?.cols ?? []}
					valueColumns={comboColorColumns?.valueColumnList ?? []}
					valueColumnLabels={comboColorColumns?.labels ?? {}}
					visualizationType="bar"
					columnValues={comboColorColumns?.mergedValues ?? {}}
					columnLabels={comboColorColumns?.labels ?? {}}
					value={styling.combo?.colorRules || []}
					onChange={(colorRules) =>
						updateComboStyling({
							colorRules: colorRules as ColorRule[],
						})
					}
					onReset={() => updateComboStyling({ colorRules: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Color Palette">
				<ColorPalette
					value={styling.colorPalette}
					customPalettes={customColorPalettes}
					onChange={handleColorPalettePatch}
				/>
			</ToolAccordion>
			<ToolAccordion title="Flip Axis">
				<FlipAxis
					value={styling.combo?.flipAxis}
					onChange={(v) => updateComboStyling({ flipAxis: v })}
					onReset={() => updateComboStyling({ flipAxis: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Legend">
				<ShowLegendToggle
					value={styling.combo?.showLegend}
					onChange={(v) => updateComboStyling({ showLegend: v })}
					onReset={() =>
						updateComboStyling({ showLegend: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Line Style">
				<LineStyle
					value={{
						curveType: styling.combo?.curveType,
						lineType: styling.combo?.lineType,
						lineWidth: styling.combo?.lineWidth,
					}}
					onChange={(updates) => updateComboStyling(updates)}
					onReset={() =>
						updateComboStyling({
							curveType: undefined,
							lineType: undefined,
							lineWidth: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Min / Max Markers">
				<MinMaxToggle
					value={styling.combo?.showMinMax}
					onChange={(v) => updateComboStyling({ showMinMax: v })}
					onReset={() =>
						updateComboStyling({ showMinMax: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Reverse Y Axis">
				<ReverseYAxis
					value={styling.combo?.reverseYAxis}
					onChange={(v) => updateComboStyling({ reverseYAxis: v })}
					onReset={() =>
						updateComboStyling({ reverseYAxis: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Save Zoom">
				<SaveZoom
					value={styling.combo?.saveZoom}
					savedZoomX={styling.combo?.savedZoomX}
					savedZoomY={styling.combo?.savedZoomY}
					zoomXEnabled={styling.combo?.zoomX}
					zoomYEnabled={styling.combo?.zoomY}
					onChange={(v) => updateComboStyling({ saveZoom: v })}
					onReset={() =>
						updateComboStyling({
							saveZoom: undefined,
							savedZoomX: undefined,
							savedZoomY: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Series Type">
				<SeriesType
					barKeys={styling.combo?.barKeys ?? []}
					lineKeys={styling.combo?.lineKeys ?? []}
					seriesTypes={styling.combo?.seriesTypes ?? {}}
					onChange={(updates) => updateComboStyling(updates)}
					onReset={() =>
						updateComboStyling({ seriesTypes: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Symbol Style">
				<SymbolStyle
					symbolType={styling.combo?.symbolType}
					symbolSize={styling.combo?.symbolSize}
					defaultSymbolType="circle"
					onChange={(updates) => updateComboStyling(updates)}
					onReset={() =>
						updateComboStyling({
							symbolType: undefined,
							symbolSize: undefined,
						})
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Areas">
				<TargetArea
					value={styling.combo?.targetAreas ?? []}
					onChange={(v) => updateComboStyling({ targetAreas: v })}
					onReset={() => updateComboStyling({ targetAreas: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Target Lines">
				<TargetLine
					value={styling.combo?.targetLines ?? []}
					onChange={(v) => updateComboStyling({ targetLines: v })}
					onReset={() => updateComboStyling({ targetLines: [] })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Trendline">
				<Trendline
					value={styling.combo?.trendlineType}
					onChange={(v) => updateComboStyling({ trendlineType: v })}
					onReset={() =>
						updateComboStyling({ trendlineType: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Value Labels">
				<LineValueLabelEditor
					value={styling.combo?.valueLabel}
					onChange={(v) => updateComboStyling({ valueLabel: v })}
					onReset={() =>
						updateComboStyling({ valueLabel: undefined })
					}
					variant="line"
				/>
			</ToolAccordion>
			<ToolAccordion title="X Axis Settings">
				<AxisSettings
					value={styling.combo?.xAxisConfig}
					axis="x"
					onChange={updateComboXAxis}
					onReset={() =>
						updateComboStyling({ xAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Y Axis Settings">
				<AxisSettings
					value={styling.combo?.yAxisConfig}
					axis="y"
					onChange={updateComboYAxis}
					onReset={() =>
						updateComboStyling({ yAxisConfig: undefined })
					}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom X Axis">
				<ZoomXAxis
					value={styling.combo?.zoomX}
					onChange={(v) => updateComboStyling({ zoomX: v })}
					onReset={() => updateComboStyling({ zoomX: undefined })}
				/>
			</ToolAccordion>
			<ToolAccordion title="Zoom Y Axis">
				<ZoomYAxis
					value={styling.combo?.zoomY}
					onChange={(v) => updateComboStyling({ zoomY: v })}
					onReset={() => updateComboStyling({ zoomY: undefined })}
				/>
			</ToolAccordion>
		</>
	);

	return (
		<ToolSearchContext.Provider value={searchQuery}>
			<div className="flex h-full flex-col">
				{/* Search bar */}
				<div className="sticky top-0 z-10 flex-shrink-0 border-stone-200 border-b bg-white px-4 py-2.5">
					<input
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
							![
								"filter",
								"htmlblock",
								"markdown",
								"csvexport",
								"table",
								"pivot",
								"kpi",
							].includes(visualizationType)
								? eventsTool
								: null,
							![
								"filter",
								"htmlblock",
								"markdown",
								"csvexport",
							].includes(visualizationType)
								? sortTool
								: null,
							![
								"filter",
								"htmlblock",
								"markdown",
								"csvexport",
							].includes(visualizationType)
								? formatTool
								: null,
							visualizationType !== "puck" &&
							visualizationType !== "stackbar"
								? sizeTool
								: null,
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
							visualizationType === "radar" ? radarTools : null,
							visualizationType === "cluster"
								? clusterTools
								: null,
							visualizationType === "multiline"
								? multilineTools
								: null,
							visualizationType === "treemap"
								? treemapTools
								: null,
							visualizationType === "area" ? areaTools : null,
							visualizationType === "bar" ? barTools : null,
							visualizationType === "stackbar"
								? stackbarTools
								: null,
							visualizationType === "line" ? lineTools : null,
							visualizationType === "pie" ? pieTools : null,
							visualizationType === "combo" ? comboTools : null,
						].filter(Boolean) as ReactNode[],
					)}
				</div>
			</div>
		</ToolSearchContext.Provider>
	);
}
