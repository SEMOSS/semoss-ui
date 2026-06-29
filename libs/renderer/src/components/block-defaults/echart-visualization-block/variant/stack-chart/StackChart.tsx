import type { ECharts } from "echarts";
import { BarChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import EChartsReact, { type EChartsOption } from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import type { BlockComponent, ListenerActions } from "../../../../../store";
import type {
	BrushBatchItem,
	BrushSelectedParams,
	BrushSelection,
	EChartColumns,
	EChartContextMenuParams,
} from "../../shared-types";
import { ChartContextMenu } from "../bar-chart/ChartContextMenu";

interface StackChartFields {
	XAxis: string[];
	XAxisDataType: string[];
	YAxis: string[];
	YAxisDataType: string[];
	category: string[];
	categoryDataType: string[];
	tooltip: string[];
	tooltipDataType: string[];
}

interface StackChartState {
	fields: StackChartFields;
}

interface StackChartDataPoint {
	value: number | string | undefined;
	category: string;
	itemStyle: { color: string };
	tooltipValue?: string;
}

interface StackChartSeries {
	type: string;
	stack: string;
	name: string;
	data: StackChartDataPoint[];
}

interface StackChartTooltipParam {
	axisValue: string;
	marker: string;
	value: string | number;
	data: StackChartDataPoint;
}

interface StackChartTooltipOption {
	show?: boolean;
	trigger?: string;
	position?: string;
	axisPointer?: Record<string, unknown>;
	formatter?: string | ((params: StackChartTooltipParam[]) => string);
}

interface StackChartAxisOption {
	data: unknown[];
	name?: unknown;
	pixelName?: unknown;
	flipAxisName?: unknown;
	axisName?: unknown;
	nameLocation?: string;
	type?: string;
}

interface StackChartOption {
	state?: StackChartState;
	series: StackChartSeries[];
	xAxis: StackChartAxisOption;
	yAxis: StackChartAxisOption;
	color: string[];
	flipAxis?: boolean;
	legend: {
		data: string[];
		show?: boolean;
		bottom?: string;
		left?: string;
		orient?: string;
		type?: string;
		selectedMode?: string;
		itemHeight?: number;
		itemWidth?: number;
		pageButtonItemGap?: number;
		pageTextSize?: Record<string, unknown>;
		top?: string;
		textStyle?: Record<string, unknown>;
	};
	tooltip: StackChartTooltipOption;
	barWidth?: number;
	brush?: Record<string, unknown>;
	label?: Record<string, unknown>;
	title?: Record<string, unknown>;
	toolbox?: Record<string, unknown>;
	reset?: Record<string, unknown>;
}

export interface EchartVisualizationBlockDef {
	widget: "e-chart";
	data: {
		option: StackChartOption;
		frame: {
			name: string;
		};
		variation: undefined | string;
		columns: EChartColumns[];
		aggregate: Record<string, Record<string, string>>;
		contextMenu: {
			hideUnfilter: boolean;
			hideFilter: boolean;
			hideExclude: boolean;
		};
	};
	listeners: Record<
		string,
		{ order: ListenerActions[]; type: "sync" | "async" }
	>;
	slots: never;
}

export const StackChart: BlockComponent = observer(({ id }) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);
	echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);

	const chartOperationData = useRef({
		brushSelected: [] as number[] | null,
		contextMenu: null as null,
		yAxisColumn: {
			name: "",
			selector: "",
			width: undefined as undefined | string,
		} as {
			name: string;
			selector: string;
			width: undefined | string;
		} | null,
		chartInstance: { setOption: null as null },
	});

	let fields: Partial<StackChartFields> = {};
	let xAxis: string[] = [];
	let yAxis: string[] = [];
	let category: string[] = [];
	let tooltip: string[] = [];
	if (Object.hasOwn(data.option, "state") && data.option.state) {
		fields = data.option.state.fields;
		xAxis = fields.XAxis ?? [];
		yAxis = fields.YAxis ?? [];
		category = fields.category ?? [];
		tooltip = fields.tooltip ?? [];
	}

	/**
	 * Builds a dynamic query string based on the provided input data.
	 * @param inputData - An array of tuples where each tuple contains a string and an object mapping field names to aggregation methods.
	 * @returns A query string that selects and groups by the specified fields with appropriate aggregations.
	 */
	const buildDynamicQuery = (
		inputData: [string, Record<string, string>][],
	): string => {
		const selectParts: string[] = [];
		const aliasParts: string[] = [];
		const groupByParts: string[] = [];

		inputData.forEach(([_key, aggFields]) => {
			for (const field in aggFields) {
				const rawAgg = aggFields[field];
				if (!aliasParts.includes(field)) aliasParts.push(field);

				if (rawAgg) {
					const cleanedAgg = rawAgg.split(" ").join(""); // Remove spaces (e.g., "Unique Count" → "UniqueCount")
					if (!selectParts.includes(`${cleanedAgg}(${field})`)) {
						selectParts.push(`${cleanedAgg}(${field})`);
					}
				} else {
					if (!selectParts.includes(field)) {
						selectParts.push(field);
						groupByParts.push(field); // Only unaggregated fields are grouped
					}
				}
			}
		});

		return `Select(${selectParts.join(", ")}).as([${aliasParts.join(
			", ",
		)}]) | Group(${groupByParts.join(", ")})`;
	};

	// useFrame hook to get the frame data
	const frame = useFrame(data?.frame?.name, {
		selector: buildDynamicQuery(
			Object.entries(
				data?.aggregate ??
					({} as {
						y: unknown;
						category: unknown;
						tooltip?: unknown;
					}),
			) as [string, Record<string, string>][],
		),
	});
	//  Function to add only new values and avoid duplicates
	const updateSelectedIndexes = (
		selectedIndexes: number[],
		newIndexes: number[],
	): number[] => {
		newIndexes.forEach((index: number) => {
			if (!selectedIndexes.includes(index)) {
				selectedIndexes.push(index); // Add only if it's not already present
			}
		});
		return selectedIndexes;
	};
	//Brushing of data points
	const echartsLoaded = (chart: ECharts) => {
		chart.on("brushSelected", (rawParams: unknown) => {
			const params = rawParams as BrushSelectedParams;
			let selectedDataIndexes: number[] = [];

			params.batch.forEach((batch: BrushBatchItem) => {
				batch.selected.forEach((selection: BrushSelection) => {
					//  Extract exact dataIndex for each series
					if (selection.dataIndex && selection.dataIndex.length > 0) {
						selectedDataIndexes = updateSelectedIndexes(
							selectedDataIndexes,
							selection.dataIndex,
						);
					}
				});
			});
			if (selectedDataIndexes.length > 0) {
				const currentOption =
					chart.getOption() as unknown as StackChartOption & {
						xAxis: { data: unknown[] }[];
						yAxis: { data: unknown[] }[];
					};
				const xAxisData =
					data.option.flipAxis === true
						? currentOption.yAxis[0].data
						: currentOption.xAxis[0].data;
				const filteredXaxis = [...selectedDataIndexes]
					.filter((index) => {
						return data.option.series.some(
							(series: StackChartSeries) => {
								const yValue = series.data[index]?.value;
								return (
									yValue !== null &&
									yValue !== 0 &&
									yValue !== undefined &&
									yValue !== "NaN" &&
									yValue !== ""
								);
							},
						);
					})
					.map((index) => xAxisData[index]);
				handleSelection(
					filteredXaxis,
					currentOption.state?.fields.XAxis,
				);
			}
		});
	};
	//Brushed Data points selection and pixel expression of brushed data points to send to the server
	const handleSelection = (value: unknown[], name: string[] | undefined) => {
		// update the frame
		frame.filter(`SetFrameFilter(${name}==[${JSON.stringify(value)}])`);
	};

	//  Context menu to show on right click
	const onClickChart = {
		contextmenu: (params: EChartContextMenuParams) => {
			if (params.data) {
				const XAxisName = xAxis;
				const selectedData = params.dataIndex as number;
				const filteredXaxis =
					data.option.flipAxis === true
						? data.option.xAxis.data[selectedData]
						: data.option.yAxis.data[selectedData];
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									name: XAxisName,
									value: filteredXaxis,
								},
							}
						: null,
				);
				params.event.event.preventDefault();
			} else {
				params.event.event.preventDefault();
			}
		},
	};
	//  Process the API data to render the Stack Chart
	const processData = (
		apiData: { values: unknown[][] },
		chartData: { option: StackChartOption },
	) => {
		const xAxisData: unknown[] = [];
		const groupedData: Record<
			string,
			{ y: unknown; category: unknown; tooltip?: unknown }[]
		> = {};
		let maxStackSize = 0;
		const uniqueCategories: unknown[] = [];
		//Reset data before updating
		chartData.option.series = [];
		chartData.option.xAxis.data = [];

		if (apiData.values) {
			if (Object.hasOwn(chartData.option, "state")) {
				if (
					Object.hasOwn(fields, "XAxis") &&
					Object.hasOwn(fields, "YAxis") &&
					Object.hasOwn(fields, "category") &&
					Object.hasOwn(fields, "tooltip")
				) {
					if (
						JSON.stringify(xAxis) === JSON.stringify(category) &&
						JSON.stringify(yAxis) === JSON.stringify(tooltip)
					) {
						apiData.values.forEach(([x, y]) => {
							const xKey = String(x);
							if (!groupedData[xKey]) {
								groupedData[xKey] = [];
								xAxisData.push(x);
							}
							groupedData[xKey].push({
								y,
								category: x,
								tooltip: y,
							});
							//  Store unique categories for legend
							if (x && !uniqueCategories.includes(x)) {
								uniqueCategories.push(x);
							}
							//  Calculate max stack size (Max number of bars stacked at any x value)
							maxStackSize = Math.max(
								...Object.values(groupedData).map(
									(arr: unknown[]) => arr.length,
								),
							);
						});
						const colorList = chartData.option.color;
						const colorCount = colorList.length;

						//  Assign colors to categories
						const categoryColorMap: Record<string, string> = {};
						uniqueCategories.forEach((cat, index) => {
							categoryColorMap[String(cat)] =
								colorList[index % colorCount]; //  Cycle colors
						});
						//  Ensure we only create the exact number of stacks needed
						const series: StackChartSeries[] = uniqueCategories.map(
							(cat) => ({
								type: "bar",
								stack: "stack",
								name: String(cat), //  Legend name
								data: xAxisData.map((x) => {
									const point =
										groupedData[String(x)].find(
											(item) => item.category === cat,
										) ??
										({} as {
											y: unknown;
											category: unknown;
											tooltip?: unknown;
										});
									return {
										value:
											Number.isNaN(point.y) ||
											point.y === undefined
												? undefined
												: parseFloat(String(point.y))
														.toFixed(2)
														.replace(/\.00$/, ""),
										category: String(point.category ?? ""),
										itemStyle: {
											color: categoryColorMap[
												String(cat)
											],
										}, //  Assign correct color
										tooltipValue: String(
											point.tooltip ?? "",
										), //  Store tooltip inside each data point
									};
								}),
							}),
						);
						const legendData = uniqueCategories.map(String);
						return { xAxisData, series, maxStackSize, legendData };
					}
					if (JSON.stringify(xAxis) === JSON.stringify(category)) {
						apiData.values.forEach(([x, y, tip]) => {
							const xKey = String(x);
							if (!groupedData[xKey]) {
								groupedData[xKey] = [];
								xAxisData.push(x);
							}
							groupedData[xKey].push({
								y,
								category: x,
								tooltip: tip,
							});

							//  Store unique categories for legend
							if (x && !uniqueCategories.includes(x)) {
								uniqueCategories.push(x);
							}

							//  Calculate max stack size (Max number of bars stacked at any x value)
							maxStackSize = Math.max(
								...Object.values(groupedData).map(
									(arr: unknown[]) => arr.length,
								),
							);
						});

						const colorList = chartData.option.color;
						const colorCount = colorList.length;

						//  Assign colors to categories
						const categoryColorMap: Record<string, string> = {};
						uniqueCategories.forEach((cat, index) => {
							categoryColorMap[String(cat)] =
								colorList[index % colorCount]; //  Cycle colors
						});
						//  Ensure we only create the exact number of stacks needed
						const series: StackChartSeries[] = uniqueCategories.map(
							(cat) => ({
								type: "bar",
								stack: "stack",
								name: String(cat), //  Legend name
								data: xAxisData.map((x) => {
									const point =
										groupedData[String(x)].find(
											(item) => item.category === cat,
										) ??
										({} as {
											y: unknown;
											category: unknown;
											tooltip?: unknown;
										});
									return {
										value:
											Number.isNaN(point.y) ||
											point.y === undefined
												? undefined
												: parseFloat(String(point.y))
														.toFixed(2)
														.replace(/\.00$/, ""),
										category: String(point.category ?? ""),
										itemStyle: {
											color: categoryColorMap[
												String(cat)
											],
										}, //  Assign correct color
										tooltipValue: String(
											point.tooltip ?? "",
										), //  Store tooltip inside each data point
									};
								}),
							}),
						);
						const legendData = uniqueCategories.map(String);
						return { xAxisData, series, maxStackSize, legendData };
					}
					if (JSON.stringify(yAxis) === JSON.stringify(tooltip)) {
						apiData.values.forEach(([x, y, cat]) => {
							const xKey = String(x);
							if (!groupedData[xKey]) {
								groupedData[xKey] = [];
								xAxisData.push(x);
							}
							groupedData[xKey].push({
								y,
								category: cat,
								tooltip: y,
							});
							//  Store unique categories for legend
							if (cat && !uniqueCategories.includes(cat)) {
								uniqueCategories.push(cat);
							}
							//  Calculate max stack size (Max number of bars stacked at any x value)
							maxStackSize = Math.max(
								...Object.values(groupedData).map(
									(arr: unknown[]) => arr.length,
								),
							);
						});
						const colorList = chartData.option.color;
						const colorCount = colorList.length;

						//  Assign colors to categories
						const categoryColorMap: Record<string, string> = {};
						uniqueCategories.forEach((cat, index) => {
							categoryColorMap[String(cat)] =
								colorList[index % colorCount]; //  Cycle colors
						});
						//  Ensure we only create the exact number of stacks needed
						const series: StackChartSeries[] = uniqueCategories.map(
							(cat) => ({
								type: "bar",
								stack: "stack",
								name: String(cat), //  Legend name
								data: xAxisData.map((x) => {
									const point =
										groupedData[String(x)].find(
											(item) => item.category === cat,
										) ??
										({} as {
											y: unknown;
											category: unknown;
											tooltip?: unknown;
										});
									return {
										value:
											Number.isNaN(point.y) ||
											point.y === undefined
												? undefined
												: parseFloat(String(point.y))
														.toFixed(2)
														.replace(/\.00$/, ""),
										category: String(point.category ?? ""),
										itemStyle: {
											color: categoryColorMap[
												String(cat)
											],
										}, //  Assign correct color
										tooltipValue: String(
											point.tooltip ?? "",
										), //  Store tooltip inside each data point
									};
								}),
							}),
						);
						const legendData = uniqueCategories.map(String);
						return { xAxisData, series, maxStackSize, legendData };
					}
					apiData.values.forEach(([x, y, cat, tip]) => {
						const xKey = String(x);
						if (!groupedData[xKey]) {
							groupedData[xKey] = [];
							xAxisData.push(x);
						}
						groupedData[xKey].push({
							y,
							category: cat,
							tooltip: tip,
						});
						//  Store unique categories for legend
						if (cat && !uniqueCategories.includes(cat)) {
							uniqueCategories.push(cat);
						}
						//  Calculate max stack size (Max number of bars stacked at any x value)
						maxStackSize = Math.max(
							...Object.values(groupedData).map(
								(arr: unknown[]) => arr.length,
							),
						);
					});

					const colorList = chartData.option.color;
					const colorCount = colorList.length;

					//  Assign colors to categories
					const categoryColorMap: Record<string, string> = {};
					uniqueCategories.forEach((cat, index) => {
						categoryColorMap[String(cat)] =
							colorList[index % colorCount]; //  Cycle colors
					});
					//  Ensure we only create the exact number of stacks needed
					const series: StackChartSeries[] = uniqueCategories.map(
						(cat) => ({
							type: "bar",
							stack: "stack",
							name: String(cat), //  Legend name
							data: xAxisData.map((x) => {
								const point =
									groupedData[String(x)].find(
										(item) => item.category === cat,
									) ??
									({} as {
										y: unknown;
										category: unknown;
										tooltip?: unknown;
									});
								return {
									value:
										Number.isNaN(point.y) ||
										point.y === undefined
											? undefined
											: parseFloat(String(point.y))
													.toFixed(2)
													.replace(/\.00$/, ""),
									category: String(point.category ?? ""),
									itemStyle: {
										color: categoryColorMap[String(cat)],
									}, //  Assign correct color
									tooltipValue: String(point.tooltip ?? ""), //  Store tooltip inside each data point
								};
							}),
						}),
					);
					const legendData = uniqueCategories.map(String);
					return { xAxisData, series, maxStackSize, legendData };
				}
				if (
					Object.hasOwn(fields, "XAxis") &&
					Object.hasOwn(fields, "YAxis") &&
					Object.hasOwn(fields, "category")
				) {
					if (JSON.stringify(xAxis) === JSON.stringify(category)) {
						apiData.values.forEach(([x, y]) => {
							const xKey = String(x);
							if (!groupedData[xKey]) {
								groupedData[xKey] = [];
								xAxisData.push(x);
							}
							groupedData[xKey].push({ y, category: x });

							//  Store unique categories for legend
							if (x && !uniqueCategories.includes(x)) {
								uniqueCategories.push(x);
							}

							//  Calculate max stack size (Max number of bars stacked at any x value)
							maxStackSize = Math.max(
								...Object.values(groupedData).map(
									(arr: unknown[]) => arr.length,
								),
							);
						});
						const colorList = chartData.option.color;
						const colorCount = colorList.length;

						//  Assign colors to categories
						const categoryColorMap: Record<string, string> = {};
						uniqueCategories.forEach((cat, index) => {
							categoryColorMap[String(cat)] =
								colorList[index % colorCount]; //  Cycle colors
						});
						//  Ensure we only create the exact number of stacks needed
						const series: StackChartSeries[] = uniqueCategories.map(
							(cat) => ({
								type: "bar",
								stack: "stack",
								name: String(cat), //  Legend name
								data: xAxisData.map((x) => {
									const point =
										groupedData[String(x)].find(
											(item) => item.category === cat,
										) ??
										({} as {
											y: unknown;
											category: unknown;
											tooltip?: unknown;
										});
									return {
										value:
											Number.isNaN(point.y) ||
											point.y === undefined
												? undefined
												: parseFloat(String(point.y))
														.toFixed(2)
														.replace(/\.00$/, ""),
										category: String(point.category ?? ""),
										itemStyle: {
											color: categoryColorMap[
												String(cat)
											],
										}, //  Assign correct color
									};
								}),
							}),
						);
						const legendData = uniqueCategories.map(String);
						return { xAxisData, series, maxStackSize, legendData };
					}
					//  Process the API data
					apiData.values.forEach(([x, y, cat]) => {
						const xKey = String(x);
						if (!groupedData[xKey]) {
							groupedData[xKey] = [];
							xAxisData.push(x);
						}
						groupedData[xKey].push({ y, category: cat });

						//  Store unique categories for legend
						if (cat && !uniqueCategories.includes(cat)) {
							uniqueCategories.push(cat);
						}

						//  Calculate max stack size (Max number of bars stacked at any x value)
						maxStackSize = Math.max(
							...Object.values(groupedData).map(
								(arr: unknown[]) => arr.length,
							),
						);
					});

					const colorList = chartData.option.color;
					const colorCount = colorList.length;

					//  Assign colors to categories
					const categoryColorMap: Record<string, string> = {};
					uniqueCategories.forEach((cat, index) => {
						categoryColorMap[String(cat)] =
							colorList[index % colorCount]; //  Cycle colors
					});
					//  Ensure we only create the exact number of stacks needed
					const series: StackChartSeries[] = uniqueCategories.map(
						(cat) => ({
							type: "bar",
							stack: "stack",
							name: String(cat), //  Legend name
							data: xAxisData.map((x) => {
								const point =
									groupedData[String(x)].find(
										(item) => item.category === cat,
									) ??
									({} as {
										y: unknown;
										category: unknown;
										tooltip?: unknown;
									});
								return {
									value:
										Number.isNaN(point.y) ||
										point.y === undefined
											? undefined
											: parseFloat(String(point.y))
													.toFixed(2)
													.replace(/\.00$/, ""),
									category: String(point.category ?? ""),
									itemStyle: {
										color: categoryColorMap[String(cat)],
									}, //  Assign correct color
								};
							}),
						}),
					);
					const legendData = uniqueCategories.map(String);
					return { xAxisData, series, maxStackSize, legendData };
				}
			}
		}
		return { xAxisData: [], series: [], maxStackSize: 0, legendData: [] };
	};

	// this function is used to show the data in tooltip
	const formatdatapoints = (
		apiData: { values: unknown[][] },
		chartData: { option: StackChartOption },
		maxStackSize: number,
	) => {
		if (apiData.values) {
			if (
				Object.hasOwn(chartData.option, "state") &&
				chartData.option.state
			) {
				if (Object.hasOwn(chartData.option.state, "fields")) {
					if (
						Object.hasOwn(fields, "XAxis") &&
						Object.hasOwn(fields, "YAxis") &&
						Object.hasOwn(fields, "category") &&
						Object.hasOwn(fields, "tooltip")
					) {
						return (params: StackChartTooltipParam[]) => {
							let tooltipText = `${params[0].axisValue} <br/>`;
							const tooltipValues: number[] = [];
							let totalTooltipValue = 0;
							const tooltipPrefix =
								chartData.option.state?.fields
									.tooltipDataType[0] === "NUMBER"
									? "Average of"
									: "Count of";
							params.forEach((param) => {
								const tooltipValue = param.data.tooltipValue;
								if (param.data.category !== "") {
									tooltipText += `${param.marker} ${param.data.category}: ${param.value} <br/>`;
								}
								if (
									tooltipValue !== "" &&
									tooltipValue !== "NaN" &&
									tooltipValue !== undefined
								) {
									tooltipValues.push(Number(tooltipValue));
									totalTooltipValue += parseFloat(
										String(tooltipValue),
									);
								}
							});
							if (maxStackSize > 0) {
								const average =
									totalTooltipValue / maxStackSize;
								tooltipText += `${tooltipPrefix} ${tooltip}: ${average} <br/>`;
							}
							return tooltipText.trim();
						};
					}
					if (
						Object.hasOwn(fields, "XAxis") &&
						Object.hasOwn(fields, "YAxis") &&
						Object.hasOwn(fields, "category")
					) {
						return (params: StackChartTooltipParam[]) => {
							let tooltipText = `${params[0].axisValue} <br/>`;
							params.forEach((param) => {
								if (param.data.category !== "") {
									tooltipText += `${param.marker} ${param.data.category}: ${param.value} <br/>`;
								}
							});
							return tooltipText.trim();
						};
					}
				}
			}
		}
		return undefined;
	};

	if (!data.option) {
		return (
			<div className="h-full w-full">
				Add JSON to render your visualization
			</div>
		);
	}
	data.option.series = [];
	data.option.xAxis.data = [];
	data.option.yAxis.data = [];
	const processedFrameData = processData(frame.data, data);
	if (
		processedFrameData &&
		Object.hasOwn(processedFrameData, "xAxisData") &&
		Object.hasOwn(processedFrameData, "series")
	) {
		data.option.series = processedFrameData.series;
		data.option.legend.data = processedFrameData.legendData;
		if (data.option.flipAxis === true) {
			data.option.xAxis.data = [];
			data.option.yAxis.data = processedFrameData.xAxisData;
		} else {
			data.option.yAxis.data = [];
			data.option.xAxis.data = processedFrameData.xAxisData;
		}
	}
	if (frame.data.values.length > 0) {
		if (
			!Object.hasOwn(data.option.tooltip, "formatter") ||
			data.option.tooltip.formatter === ""
		) {
			data.option.tooltip = {
				...data.option.tooltip,
				formatter: formatdatapoints(
					frame.data,
					data,
					processedFrameData.maxStackSize,
				),
			};
		}
	}
	return (
		<div className="h-full w-full">
			<EChartsReact
				option={data.option as unknown as EChartsOption}
				style={{ height: "inherit", width: "inherit" }}
				onChartReady={(chart) => {
					echartsLoaded(chart);
				}}
				onEvents={onClickChart}
			/>
			<ChartContextMenu
				id={id}
				frame={frame}
				contextMenu={contextMenu}
				chartInstance={chartOperationData.current.chartInstance}
				onClose={() => {
					chartOperationData.current.contextMenu = null;
					chartOperationData.current.yAxisColumn = null;
					chartOperationData.current.brushSelected = null;
					setContextMenu(null);
				}}
			/>
		</div>
	);
});
