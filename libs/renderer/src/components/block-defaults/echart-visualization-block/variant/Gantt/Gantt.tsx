import ReactECharts from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { useBlock, useFrame } from "../../../../../hooks";
import type { BlockDef } from "../../../../../store";
import { getValueByPath } from "../../../../../utility";
import { GANTT_CHART } from "../../Visualization.constants";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";

type ChartUpdateOption = Record<string, unknown>;

type FrameRow = unknown[];

interface ColumnDetail {
	name: string;
	selector?: string;
	[key: string]: unknown;
}

interface ColumnDetails {
	task: ColumnDetail;
	taskgroup?: ColumnDetail;
	[key: string]: unknown;
}

interface ColumnIndexDetails {
	task: number;
	startdate: number;
	enddate: number;
	taskprogress?: number;
	taskgroup?: number;
	milestone?: number;
	tooltip?: number[];
	[key: string]: number | number[] | undefined;
}

interface GanttCustomizeSymbolRule {
	dimensionSelected?: string;
	dimensionValues?: unknown[];
	symbol?: string;
	symbolSize?: number;
	symbolColor?: string;
}

interface GanttToolsSettings {
	showLegend?: boolean;
	showGroupView?: boolean;
	customizeSymbol?: GanttCustomizeSymbolRule[];
	targetLineName?: string;
	targetLineColor?: string;
	targetDate?: string;
	showDisplayValueLabels?: boolean;
	enableFiscalAxis?: boolean;
	fiscalYearValue?: string;
	fiscalYearStart?: string;
	fiscalAxisBackgroundColor?: string;
}

interface GanttCustomSettings {
	columnDetails: ColumnDetails;
	columnIndexDetails: ColumnIndexDetails;
	gantttools?: GanttToolsSettings;
}

interface GanttTargetSeriesItem extends Record<string, unknown> {
	name?: string;
	targetDateSegment?: boolean;
	frameName?: string;
	renderItem?: (
		params: GanttRenderParams,
		api: GanttRenderApi,
	) => Record<string, unknown>;
	data?: unknown[];
}

interface GanttOption extends ChartUpdateOption {
	customSettings: GanttCustomSettings;
	series: GanttTargetSeriesItem[];
	grid?: Record<string, unknown>;
	xAxis?: {
		axisLabel?: {
			truncateCharCount?: string | number;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	yAxis?: {
		axisLabel?: {
			truncateCharCount?: string | number;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	tooltip?: Record<string, unknown>;
	legend?: Record<string, unknown>;
}

interface GanttSeriesRow {
	name: string;
	resource?: string;
	taskprogress?: number;
	value: [number, number, number, ...unknown[]];
}

interface GanttMilestoneRow {
	name: string;
	value: [number, string, number];
	mileStoneOriginalDate: unknown;
	symbol: string;
	symbolSize: number;
	itemStyle: {
		color: string;
	};
}

interface FiscalQuarter {
	name: string;
	month: string[];
	order: number;
	colSpan?: number;
	fiscalYear?: string;
}

interface GanttRenderParams {
	dataIndex: number;
	coordSys: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

interface GanttRenderApi {
	value: (index: number) => number;
	coord: (value: [number, number]) => [number, number];
	size: (value: [number, number]) => [number, number];
}

interface GanttChartFormatterParams {
	name: string;
	dataIndex: number;
	value: [number, number | string, number, ...unknown[]];
}

interface ChartInstance {
	setOption: (option: GanttOption, opts?: { notMerge: boolean }) => void;
}

interface EchartsRef {
	getEchartsInstance: () => ChartInstance;
}

interface GanttContextMenuParams {
	data?: {
		name?: string;
	};
	seriesIndex: number;
	event: {
		event: MouseEvent;
	};
}

//Gantt chart props
interface GanttProps {
	id: string;
	updateChart: (dataOption: ChartUpdateOption, path: string) => void;
}
//Gantt chart main component
export const Gantt = observer(
	<_D extends BlockDef = BlockDef>({ id, updateChart }: GanttProps) => {
		const { data } = useBlock<EchartVisualizationBlockDef>(id);

		//computed value to hold the most recent data
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on data only
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, "option");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, "option"]).get();
		//custom context menu to show when user right clicks
		const [contextMenu, setContextMenu] = useState<{
			mouseX: number; //x axis position for the click/brush event
			mouseY: number; //y axis position for the click/brush event
			value: unknown; //value can be of object or string or number type
		} | null>(null);
		const chartRef = useRef<EchartsRef | null>(null);
		//table reference variable to align series name with fiscal axis
		const tableRef = useRef<HTMLElement | null>(null);
		const [seriesNameCol, setSeriesNameCol] = useState(70);

		/**
		 * Builds a dynamic query string based on the provided input data.
		 * @param inputData - An array of tuples where each tuple contains a string and an object mapping field names to aggregation methods.
		 * @returns A query string that selects and groups by the specified fields with appropriate aggregations.
		 */
		const buildDynamicQuery = (
			inputData: [string, Record<string, string | undefined>][],
		): string => {
			const selectParts: string[] = [];
			const aliasParts: string[] = [];
			const groupByParts: string[] = [];

			inputData.forEach(([_, fields]) => {
				for (const field in fields) {
					const rawAgg = fields[field];
					aliasParts.push(field);

					if (rawAgg) {
						const cleanedAgg = rawAgg.split(" ").join(""); // Remove spaces (e.g., "Unique Count" → "UniqueCount")
						selectParts.push(`${cleanedAgg}(${field})`);
					} else {
						selectParts.push(field);
						groupByParts.push(field); // Only unaggregated fields are grouped
					}
				}
			});

			return `Select(${selectParts.join(", ")}).as([${aliasParts.join(
				", ",
			)}]) | Group(${groupByParts.join(", ")})`;
		};
		//selector to fetch data from the frame
		const selector = buildDynamicQuery(
			Object.entries(data?.aggregate ?? {}),
		);
		//frame object to get the data from the frame
		const frame = useFrame(data.frame?.name, {
			selector: selector,
		});
		// custom variable to hold the chart data to render
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frame.data.values
		const dataOption = useMemo(() => {
			let option = JSON.parse(computedValue) as GanttOption;
			let resourceRows: string[] = []; // Stores resource related details
			let seriesData: GanttSeriesRow[] = []; // series data to be used for rendering chart
			let _yAxisName = "";
			const _toolTipSelected: string[] = [];
			let toolTipSelectedIndex: number[] = [];
			const _mileStoneIndex = "";
			let milestoneData: GanttMilestoneRow[] = [];
			const toDateMillis = (value: unknown): number => {
				if (value instanceof Date) {
					return value.getTime();
				}
				if (typeof value === "number" || typeof value === "string") {
					return new Date(value).getTime();
				}
				return Number.NaN;
			};
			const toNumber = (value: unknown): number | undefined => {
				const parsed = Number(value);
				return Number.isNaN(parsed) ? undefined : parsed;
			};
			//detect task progress column is selected or not
			const taskProgressSelected = Object.keys(
				option.customSettings.columnDetails,
			).some((item) => item === "taskprogress");
			//default properties for milestone display
			const mileStoneProperties = {
				symbol: GANTT_CHART.MILESTONE_SYMBOL,
				color: GANTT_CHART.MILESTONE_COLOR,
				symbolSize: GANTT_CHART.MILESTONE_SYMBOL_SIZE,
			};
			//show legend or not
			let legendShow = false;
			//show group view or not
			let groupViewShow = false;
			//column details selected in the data section
			const columnIndexDetails = option.customSettings.columnIndexDetails;
			const customizeSymbolList: GanttCustomizeSymbolRule[] =
				option.customSettings?.gantttools?.customizeSymbol || [];
			const clampMilestoneSymbolSize = (value: unknown) => {
				const parsedSize = Number(value);
				if (Number.isNaN(parsedSize)) {
					return mileStoneProperties.symbolSize;
				}

				return Math.min(40, Math.max(1, parsedSize));
			};
			const resolveMilestoneSymbol = (mileStoneDate: number) => {
				return [...customizeSymbolList]
					.reverse()
					.find((customizeItem) => {
						const ganttToolsDimensionValues =
							customizeItem?.dimensionValues?.map(
								(dimensionValue: unknown) =>
									toDateMillis(dimensionValue),
							) || [];

						return (
							customizeItem?.dimensionSelected === "milestone" &&
							ganttToolsDimensionValues.includes(mileStoneDate)
						);
					});
			};
			//frame data values
			if (frame.data.values.length) {
				// Step 1: Group tasks by resource
				const groupedData: Record<string, FrameRow[]> = {};
				const dataGrouped = Object.keys(
					option.customSettings.columnDetails,
				).some((item) => item === "taskgroup");
				const taskGroupIndex =
					option.customSettings.columnIndexDetails.taskgroup || -1;
				const _toolTipData = Object.keys(
					option.customSettings.columnDetails,
				).filter((item) => item === "tooltip");
				// toolTipData.forEach((item, index) => {
				//     option["customSettings"]["columnDetails"][item].forEach(
				//         (item) => {
				//             toolTipSelected.push(item.name);
				//         },
				//     );
				// });
				legendShow =
					option.customSettings?.gantttools?.showLegend || false;
				groupViewShow =
					option.customSettings?.gantttools?.showGroupView || false;
				toolTipSelectedIndex =
					option.customSettings.columnIndexDetails.tooltip || [];

				if (dataGrouped && groupViewShow) {
					_yAxisName =
						taskGroupIndex > -1
							? option.customSettings.columnDetails.taskgroup
									?.name || ""
							: "";
					frame.data.values.forEach((d: unknown[]) => {
						const groupKey = String(d[taskGroupIndex] ?? "");
						if (!groupedData[groupKey]) {
							groupedData[groupKey] = [];
						}
						groupedData[groupKey].push(d);
					});

					Object.keys(groupedData).forEach((resource) => {
						const tasks = groupedData[resource];
						tasks.sort(
							(a: FrameRow, b: FrameRow) =>
								toDateMillis(a[1]) - toDateMillis(b[1]),
						); // Sort by start date

						const rowIndexes: number[] = []; // Tracks task end times per row
						resourceRows.push(resource); // First row for the resource

						tasks.forEach((task: FrameRow) => {
							const taskStart = toDateMillis(task[1]);
							const taskEnd = toDateMillis(task[2]);
							// Find an available row (avoid overlap)
							let rowIndex = rowIndexes.findIndex(
								(endTime: number) => taskStart >= endTime,
							);
							if (rowIndex === -1) {
								rowIndex = rowIndexes.length;
								resourceRows.push(""); // Add an empty row for stacking
							}
							rowIndexes[rowIndex] = taskEnd; // Update row availability
							// Push formatted task data
							const taskName = String(task[0] ?? "");
							const taskProgressIndex =
								columnIndexDetails.taskprogress;
							const taskProgress =
								typeof taskProgressIndex === "number"
									? toNumber(task[taskProgressIndex])
									: undefined;
							seriesData.push({
								name: taskName,
								resource: resource,
								taskprogress: taskProgress,
								value: [
									taskStart,
									resourceRows.length - 1,
									taskEnd,
									...toolTipSelectedIndex.map(
										(item: number) => task[item],
									),
								],
							});
						});
					});
				} else {
					_yAxisName = option.customSettings.columnDetails.task.name;
					// Convert data to proper format
					seriesData = frame.data.values.map(
						(d: unknown[], index: number) => ({
							name: String(d[columnIndexDetails.task] ?? ""),
							taskprogress:
								typeof columnIndexDetails.taskprogress ===
								"number"
									? toNumber(
											d[columnIndexDetails.taskprogress],
										)
									: undefined,
							value: [
								toDateMillis(d[columnIndexDetails.startdate]),
								index,
								toDateMillis(d[columnIndexDetails.enddate]),
								...toolTipSelectedIndex.map(
									(item: number) => d[item],
								),
							],
						}),
					);
					resourceRows = frame.data.values.map((d: unknown[]) =>
						String(d[0] ?? ""),
					);
				}
				if (
					Object.hasOwn(columnIndexDetails, "milestone") &&
					columnIndexDetails.milestone
				) {
					milestoneData = frame.data.values.map(
						(d: unknown[], index: number) => {
							const milestoneIndex = columnIndexDetails.milestone;
							const mileStoneDate =
								typeof milestoneIndex === "number"
									? toDateMillis(d[milestoneIndex])
									: Number.NaN;
							const endDate = toDateMillis(
								d[columnIndexDetails.enddate],
							);
							const matchingCustomSymbol =
								resolveMilestoneSymbol(mileStoneDate);
							const resolvedSymbol =
								matchingCustomSymbol?.symbol ||
								mileStoneProperties.symbol;
							const resolvedSymbolSize = clampMilestoneSymbolSize(
								matchingCustomSymbol?.symbolSize,
							);
							const resolvedSymbolColor =
								matchingCustomSymbol?.symbolColor ||
								mileStoneProperties.color;
							return {
								name: `MileStone ${index + 1}`,
								value: [
									mileStoneDate,
									String(d[columnIndexDetails.task] ?? ""),
									endDate,
								],
								mileStoneOriginalDate:
									typeof milestoneIndex === "number"
										? d[milestoneIndex]
										: undefined,
								symbol: resolvedSymbol,
								symbolSize: resolvedSymbolSize,
								itemStyle: {
									color: resolvedSymbolColor,
								},
							};
						},
					);
				}
			}

			let lineData: GanttTargetSeriesItem[] = [];
			const showDisplayValueLabels =
				option.customSettings?.gantttools?.showDisplayValueLabels ||
				false;
			const mainSeriesName =
				option.customSettings?.columnDetails?.task?.name;
			const mainSeriesFrameName =
				option.customSettings?.columnDetails?.task?.selector;
			if (
				option.series.some(
					(series: GanttTargetSeriesItem) =>
						series.name === "targetDateSegment",
				)
			) {
				const targetDateSegment = option.series.filter(
					(item: GanttTargetSeriesItem) =>
						item.name === "targetDateSegment",
				);
				targetDateSegment[0] = {
					...targetDateSegment[0],
					targetDateSegment: true,
					// name: targetDateSegment[0]?.["data"]?.length
					//     ? "Target Data Segment"
					//     : "",
					renderItem: (
						params: GanttRenderParams,
						api: GanttRenderApi,
					) => {
						const x = api.coord([api.value(0), 0])[0];
						const targetText =
							option.customSettings?.gantttools?.targetLineName ||
							"";
						const targetColor =
							option.customSettings?.gantttools
								?.targetLineColor || "#FF0000";
						// Convert date to x-axis position
						const _height = params.coordSys.height; // Full chart height return
						const yBottom =
							params.coordSys.y + params.coordSys.height;
						const yTop = params.coordSys.y;
						//if targetdate is not empty then show the target date line
						if (
							option.customSettings?.gantttools?.targetDate !== ""
						) {
							return {
								type: "group",
								children: [
									{
										type: "line",
										originX: 0,
										originY: 0,
										shape: {
											x1: x,
											y1: yBottom,
											x2: x,
											y2: yTop,
										},
										style: {
											stroke: targetColor, // Line color
											lineWidth: 2, // Line thickness
											type: "dashed", // Line style
										},
									},
									{
										type: "text",
										style: {
											x: x,
											y: yTop - 10,
											text: targetText,
											textAlign: "center",
											textVerticalAlign: "bottom",
										},
									},
								],
							};
						}
						return {};
					},
				};
				//line data setting if target date is not empty
				if (option.customSettings?.gantttools?.targetDate !== "") {
					lineData = targetDateSegment;
				} else {
					lineData = [];
				}
			}
			//truncate char count for y axis
			const truncateCharCountValue =
				option.yAxis?.axisLabel?.truncateCharCount;
			const truncateCharCount =
				typeof truncateCharCountValue !== "undefined"
					? Number(truncateCharCountValue)
					: 0;
			option = {
				...option,
				tooltip: {
					trigger: "item",
					formatter: (params: GanttChartFormatterParams) =>
						chartFormatter(
							params,
							toolTipSelectedIndex,
							frame.data.headers,
							frame.data.values,
						),
				},
				grid: {
					...option.grid,
				},
				xAxis: {
					type: "time",
					// name: 'Date',
					axisLabel: {
						...option.xAxis?.axisLabel,
						formatter: (value: number | string) =>
							new Date(value).toLocaleDateString(),
					},
					splitLine: { show: true },
					axisLine: {
						show: true,
					},
					axisTick: {
						show: true,
					},
				},
				yAxis: {
					type: "category",
					data: resourceRows,
					inverse: true,
					axisLabel: {
						...option.yAxis?.axisLabel,
						// margin: resourceRows.length > 1 ? 0 : 12,
						formatter: (value: number | string) => {
							const valueAsString = String(value);
							return truncateCharCount &&
								valueAsString.length > truncateCharCount
								? `${valueAsString.slice(0, truncateCharCount)}...`
								: valueAsString;
						},
					},
				},
				legend: {
					show: legendShow,
				},
				series: [
					...lineData,
					{
						type: "custom",
						chartrendered: true,
						name: mainSeriesName,
						frameName: mainSeriesFrameName,
						renderItem: (
							params: GanttRenderParams,
							api: GanttRenderApi,
						) => {
							const currentSeries = seriesData[params.dataIndex];
							const categoryIndex = api.value(1);
							const start = api.coord([
								api.value(0),
								categoryIndex,
							]);
							const end = api.coord([
								api.value(2),
								categoryIndex,
							]);
							const height = api.size([0, 1])[1] * 0.6;
							const tooltipName = currentSeries?.name || "";
							if (taskProgressSelected) {
								const partialWidth = currentSeries?.taskprogress
									? (end[0] - start[0]) *
										((currentSeries.taskprogress ?? 0) /
											100)
									: end[0] - start[0];

								return {
									type: "group",
									children: [
										{
											type: "rect",
											shape: {
												x: start[0],
												y: start[1] - height / 2,
												width: end[0] - start[0],
												height: height,
											},
											style: {
												fill: "lightgrey",
												stroke: "#333",
											},
										},
										{
											type: "rect",
											shape: {
												x: start[0],
												y: start[1] - height / 2,
												width: partialWidth,
												height: height,
											},
											style: {
												fill: "#6495ED",
												stroke: "#333",
											},
										},
										{
											type: "text",
											style: {
												text: tooltipName,
												x: start[0],
												y: start[1] - height / 2,
												textVerticalAlign: "middle",
												textAlign: "center",
												fontSize: 15,
												opacity: showDisplayValueLabels
													? 1
													: 0,
											},
										},
									],
								};
							}
							return {
								type: "group",
								children: [
									{
										type: "rect",
										chartrendered: true,
										shape: {
											x: start[0],
											y: start[1] - height / 2,
											width: end[0] - start[0],
											height: height,
										},
										style: {
											fill: "#6495ED",
											stroke: "#333",
										},
									},
									{
										type: "text",
										style: {
											text: tooltipName,
											x: start[0],
											y: start[1] - height / 2,
											textVerticalAlign: "middle",
											textAlign: "center",
											fontSize: 15,
											opacity: showDisplayValueLabels
												? 1
												: 0,
										},
									},
								],
							};
						},
						encode: { x: [0, 2], y: 1 },
						data: seriesData,
					},
					{
						type: "scatter",
						name: milestoneData.length ? "Milestones" : "",
						milestonerendered: true,
						label: {
							show: !!showDisplayValueLabels,
							position: "top",
							formatter: "{b}",
						},
						data: milestoneData,
					},
				],
			};
			return option;
		}, [frame.data.values, data.columns, computedValue]);
		//get quarter and month list with fiscal year details
		function getQuarterAndMonthList(
			startFiscalMonth: string,
		): FiscalQuarter[] {
			const startMonth = startFiscalMonth;
			const month = [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec",
			];
			const startIndex = month.indexOf(startMonth);
			let startIndexTemp = startIndex;
			const quarterObject: Record<string, string[]> = {};
			//create quarter object
			[1, 2, 3, 4].forEach((item) => {
				quarterObject[`Q${item}`] = [];
				const countsPerQuarter = 3;
				for (let i = 0; i < countsPerQuarter; i++) {
					if (startIndexTemp === month.length) {
						startIndexTemp = month.length % 12;
					}
					quarterObject[`Q${item}`][i] = month[startIndexTemp];
					startIndexTemp++;
				}
			});
			//month based on quarter from Jan to Dec based on fiscal year start
			let monthBasedQuarter: FiscalQuarter[] = [];
			let lastMonthInQuarter = "";
			month.forEach((item, _index) => {
				let monthExistsInQuarter = "";
				for (let i = 0; i < 4; i++) {
					if (
						quarterObject[`Q${i + 1}`].some(
							(qoItem: string) => item === qoItem,
						)
					) {
						monthExistsInQuarter = `Q${i + 1}`;
					}
				}
				const quarterExistsInArray = monthBasedQuarter
					.reverse()
					.findIndex(
						(mbitem: FiscalQuarter, _mbindex) =>
							monthExistsInQuarter === mbitem.name,
					);
				if (
					quarterExistsInArray >= 0 &&
					lastMonthInQuarter === monthExistsInQuarter
				) {
					monthBasedQuarter[quarterExistsInArray].month = [
						...monthBasedQuarter[quarterExistsInArray].month,
						item,
					];
				} else {
					monthBasedQuarter = [
						...monthBasedQuarter,
						{
							name: monthExistsInQuarter,
							month: [item],
							order: monthBasedQuarter.length + 1,
						},
					];
				}
				lastMonthInQuarter = monthExistsInQuarter;
			});
			//set initial fiscal year based on current month selection, if month data is not available, then first record of seriesdata is selected
			const fiscalYearValue =
				dataOption.customSettings?.gantttools?.fiscalYearValue;
			const FYYear =
				fiscalYearValue && fiscalYearValue.length >= 2
					? parseInt(fiscalYearValue.substring(2), 10) + 1
					: Number.NaN;
			monthBasedQuarter = monthBasedQuarter.map((item, _index) => {
				return {
					...item,
					colSpan: item.month.length,
				};
			});
			//sorting records based on date
			monthBasedQuarter = monthBasedQuarter.sort(
				(item, item1) => item.order - item1.order,
			);
			const monthSelected =
				dataOption.customSettings?.gantttools?.fiscalYearStart;
			const yearQuarterIndex = monthBasedQuarter.findIndex((item) =>
				monthSelected ? item.month.includes(monthSelected) : false,
			);
			monthBasedQuarter = monthBasedQuarter.map((item, index) => {
				return {
					...item,
					fiscalYear: Number.isNaN(FYYear)
						? ""
						: index < yearQuarterIndex
							? `FY${FYYear - 1}`
							: `FY${FYYear}`,
				};
			});
			return monthBasedQuarter;
		}
		//enable or disable fiscal axis
		const enableFiscalAxis =
			dataOption.customSettings?.gantttools?.enableFiscalAxis || false;
		//update chart data when frame values are changed
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only or frame-triggered effect
		useEffect(() => {
			if (!frame.isLoading && frame.data.values.length > 0) {
				updateChart(dataOption, "option");
			}
		}, [frame.data.values]);
		//update chart data when data is updated
		useEffect(() => {
			const echartsInstance = chartRef.current?.getEchartsInstance();
			if (echartsInstance) {
				echartsInstance.setOption(dataOption, { notMerge: true });
			}
		}, [dataOption]);
		//update height series name section based on table height
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only or frame-triggered effect
		useEffect(() => {
			const table = tableRef.current;

			if (!table) return;

			// Create a ResizeObserver instance
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { height } = entry.contentRect;
					setSeriesNameCol(height);
				}
			});

			// Observe the table element
			resizeObserver.observe(table);

			// Clean up the observer on unmount
			return () => {
				resizeObserver.disconnect();
			};
		}, [enableFiscalAxis]);
		//tooltip function to render tooltip based on options provided
		function chartFormatter(
			params: GanttChartFormatterParams,
			tooltipData: number[],
			frameHeaders: string[],
			frameValues: unknown[][],
		): string {
			let chartToolTip = `<b>${params.name}</b><br>
            Start: ${new Date(params.value[0]).toLocaleDateString()}<br>
            End: ${new Date(params.value[2]).toLocaleDateString()}<br>`;
			tooltipData.forEach((item: number, _index: number) => {
				const row = frameValues[params.dataIndex] || [];
				chartToolTip += `${frameHeaders[item]}: ${row[item]}<br>`;
			});
			return chartToolTip;
		}
		//fiscal start month
		const fiscalStartMonth =
			dataOption.customSettings?.gantttools?.fiscalYearStart || "Jan";
		//fiscal axis background color
		const fiscalAxisBackgroundColor =
			dataOption.customSettings?.gantttools?.fiscalAxisBackgroundColor ||
			"#0471f0";
		//getquarter and month list with fiscal year
		const quarterAndMonth = getQuarterAndMonthList(fiscalStartMonth);
		//get the series name for chart side heading
		const seriesName =
			dataOption.customSettings?.columnDetails?.task?.name || "";
		const onClickChart = {
			//when contextmenu event is raised, default context menu made hidden, and custom component is shown
			contextmenu: (params: GanttContextMenuParams) => {
				if (params.data) {
					const taskColumn = params.data.name || "";
					const parsedJson = JSON.parse(computedValue) as GanttOption;
					const taskName =
						parsedJson.series[params.seriesIndex]?.frameName || "";
					setContextMenu(
						contextMenu === null
							? {
									mouseX: params.event.event.clientX,
									mouseY: params.event.event.clientY,
									value: {
										label: taskName,
										value: taskColumn,
									},
								}
							: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
								// Other native context menus might behave different.
								// With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
								null,
					);
					params.event.event.preventDefault();
				} else {
					params.event.event.preventDefault();
				}
			},
		};
		return (
			<div id={id} className="h-full w-full">
				{enableFiscalAxis && (
					<div className="flex h-[20%] max-h-[25%] w-full justify-start overflow-auto">
						<span
							style={{
								backgroundColor: fiscalAxisBackgroundColor,
								height: `${seriesNameCol}px`,
								width: "50px",
								textAlign: "center",
								display: "flex",
								margin: "auto",
								alignContent: "space-around",
								flexWrap: "wrap",
								borderRadius: "5px",
								justifyContent: "center",
							}}
						>
							{seriesName}
						</span>
						<Table
							aria-label="simple table"
							ref={(e) => {
								tableRef.current = e as HTMLElement | null;
							}}
						>
							<TableHeader>
								<TableRow>
									{quarterAndMonth.length &&
										quarterAndMonth.map((item, i) => (
											<TableHead
												// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
												key={i}
												colSpan={item?.colSpan}
												className="p-1 text-center text-xs"
												style={{
													backgroundColor:
														fiscalAxisBackgroundColor,
													border: "1px solid #e6e6e6",
												}}
											>
												{item.name}{" "}
												{Object.hasOwn(
													item,
													"fiscalYear",
												) && item.fiscalYear !== ""
													? `(${item.fiscalYear})`
													: ""}
											</TableHead>
										))}
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									{quarterAndMonth.length &&
										quarterAndMonth.map((item, i) =>
											item.month.map(
												(monthItem, monthIndex) => (
													<TableCell
														key={`${i}-${monthIndex}-${monthItem}`}
														className="p-1 text-xs"
														style={{
															backgroundColor:
																"#fff",
															border: "1px solid #e6e6e6",
														}}
													>
														{monthItem}
													</TableCell>
												),
											),
										)}
								</TableRow>
							</TableBody>
						</Table>
					</div>
				)}

				<ReactECharts
					key={JSON.stringify(dataOption)}
					option={dataOption}
					onEvents={onClickChart}
					ref={(e) => {
						chartRef.current = e as EchartsRef | null;
					}}
					style={{
						width: "inherit",
						height: enableFiscalAxis ? "75%" : "100%",
						maxHeight: enableFiscalAxis ? "75%" : "100%",
					}}
				/>
				<VizBlockContextMenu
					id={id}
					frame={frame}
					contextMenu={contextMenu}
					onClose={() => setContextMenu(null)}
				/>
			</div>
		);
	},
);
