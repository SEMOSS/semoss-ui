import type { ECharts } from "echarts";
import ReactECharts, { type EChartsOption } from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { CustomContextMenu } from "../../CustomContextMenu";
import type { AxisDataItem, BrushEndParams } from "../../shared-types";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";

type FrameCell = string | number | null;
type FrameRow = FrameCell[];

interface LineStateFields {
	xAxis: string[];
	yAxis: string[];
	tooltip: string[];
}

interface LineSeries {
	data: Array<number | null>;
	name?: string;
	type?: "line";
	[key: string]: unknown;
}

interface TooltipParam {
	dataIndex?: number;
	name: string;
	value: string | number | null;
	seriesName: string;
	color: string;
}

interface TooltipDataEntry {
	name: string;
	data: string[];
}

interface LineChartOption {
	xAxis: {
		data: AxisDataItem[];
		name?: string;
	};
	series: LineSeries[];
	tooltip: {
		formatter?: (params: TooltipParam[]) => string;
		[key: string]: unknown;
	};
	_state?: {
		fields: LineStateFields;
	};
	[key: string]: unknown;
}

interface ChartOptionSnapshot {
	series: Array<{ data?: number[]; name?: string }>;
	xAxis?: Array<{ data?: Array<string | number>; name?: string }>;
}

interface ContextMenuEventParams {
	data: string | number | Record<string, unknown>;
	seriesName: string;
	event: {
		event: MouseEvent;
	};
}

interface LineProps {
	id: string;
	updateJson: (data: LineChartOption, path: string) => void;
}
export const Line = observer(({ id, updateJson }: LineProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);
	let resultData: LineChartOption = {} as LineChartOption;
	// get the frame
	function _getVisualizationBlockSelector(id: string) {
		if (id) {
			//get the options JSON of the selected block
			const blockJSON = data.option;
			//initialize the selector string
			let selector = "Select(";
			//if there are no fields, return null
			if (!blockJSON._state) return null;
			//get the fields
			const selectorFields = blockJSON._state.fields;
			//  get the value and tooltip properties
			const dynamicYAndTooltipSet = Array.from(
				new Set([...selectorFields.yAxis, ...selectorFields.tooltip]),
			);
			// let dynamicYAndTooltipSet = [
			//     ...new Set([
			//         ...selectorFields["yAxis"],
			//         ...selectorFields["tooltip"],
			//     ]),
			// ];
			// start forming the selector string
			selector += `${selectorFields.xAxis[0]}`;
			// add dynamic y axis and tooltip fields to the selector string
			let averageCollection = "";
			for (let i = 0; i < dynamicYAndTooltipSet.length; i++) {
				averageCollection += `, Average(${dynamicYAndTooltipSet[i]})`;
				selector += `, Average(${dynamicYAndTooltipSet[i]})`;
			}
			selector += `).as([${selectorFields.xAxis[0]}${averageCollection}])|Group(${selectorFields.xAxis[0]})|Sort(${selectorFields.xAxis[0]})`;
			return selector;
		}
		return null;
	}

	/**
	 * Builds a dynamic query string based on the provided input data.
	 * @param inputData - An array of tuples where each tuple contains a string and an object mapping field names to aggregation methods.
	 * @returns A query string that selects and groups by the specified fields with appropriate aggregations.
	 */
	const buildDynamicQuery = (
		inputData: [string, Record<string, string | undefined>][],
	): string => {
		const blockJSON = data.option;
		if (!blockJSON._state || inputData.length === 0) {
			return "";
		}

		const selectParts: string[] = [];
		const aliasParts: string[] = [];
		const groupByParts: string[] = [];

		inputData.forEach(([_key, fields]) => {
			for (const field in fields) {
				const rawAgg = fields[field];
				aliasParts.push(field);

				if (rawAgg) {
					const cleanedAgg = rawAgg.split(" ").join("");
					selectParts.push(`${cleanedAgg}(${field})`);
				} else {
					selectParts.push(field);
					groupByParts.push(field);
				}
			}
		});

		if (selectParts.length === 0 || aliasParts.length === 0) {
			return "";
		}

		const groupClause = groupByParts.length
			? ` | Group(${groupByParts.join(", ")})`
			: "";

		return `Select(${selectParts.join(", ")}).as([${aliasParts.join(
			", ",
		)}])${groupClause}`;
	};

	const selector =
		buildDynamicQuery(Object.entries(data?.aggregate ?? {})) ||
		_getVisualizationBlockSelector(data.frame.name) ||
		"";
	const hasXAxisSelection =
		(data.option?._state?.fields?.xAxis?.length ?? 0) > 0;
	const hasYAxisSelection =
		(data.option?._state?.fields?.yAxis?.length ?? 0) > 0;
	const canRenderChartData = hasXAxisSelection && hasYAxisSelection;

	const frame = useFrame(data.frame.name, {
		selector,
	});
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frame.data.values only
	useEffect(() => {
		if (
			canRenderChartData &&
			data?.frame?.name &&
			frame?.data?.values.length > 0 &&
			frame?.isLoading === false
		) {
			updateJson(resultData, "option");
		}
	}, [canRenderChartData, frame.data.values]);
	//format the frame option data for echart
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frame.data.values only
	const formatDataPoints = useCallback(
		(resultData: LineChartOption) => {
			if (frame.data.values.length > 0) {
				const valuesDataSet = JSON.parse(
					JSON.stringify(frame.data.values),
				) as FrameRow[];
				let headersDataSet: string[] = JSON.parse(
					JSON.stringify(frame.data.headers),
				);
				headersDataSet = headersDataSet.map((header: string) =>
					header.replace("Average_", ""),
				);
				//format the data points to match the echart specification
				//setting xaxis data - accept all values (strings for categorical, numbers for continuous)
				resultData.xAxis.data = valuesDataSet?.map((x: FrameRow) => {
					const value = x?.[0];
					// X-axis accepts any value (strings for categorical axis, numbers for value axis)
					if (typeof value === "number" && !Number.isNaN(value)) {
						return parseFloat(value.toFixed(2));
					}
					// Return strings and other values as-is for categorical axis
					if (
						typeof value === "string" ||
						typeof value === "number"
					) {
						return value;
					}
					return "";
				});
				valuesDataSet.map((x: FrameRow) => x.shift());
				headersDataSet.shift();
				const yAxisListLength =
					resultData._state?.fields?.yAxis.length ?? 0;
				if (!resultData.series) {
					resultData.series = [];
				}
				for (let index = 0; index < yAxisListLength; index++) {
					if (!resultData.series[index]) {
						resultData.series[index] = { data: [] };
					}

					resultData.series[index].data = valuesDataSet.map(
						(x: FrameRow) => {
							const value = x[index];
							if (
								value === null ||
								value === undefined ||
								value === "NaN" ||
								Number.isNaN(Number(value))
							) {
								return null; // Replace invalid values with null
							}
							return parseFloat(String(value).trim());
						},
					);
					resultData.series[index].name = headersDataSet[index];
					resultData.series[index].type = "line";
				}

				const yAxisNames = resultData._state?.fields?.yAxis || [];

				// Filter series to only include those in yAxisNames
				// Only filter if yAxisNames is populated to avoid removing all series
				if (yAxisNames.length > 0) {
					resultData.series = resultData.series.filter((seriesItem) =>
						yAxisNames.includes(seriesItem.name ?? ""),
					);
				}

				valuesDataSet.forEach((x: FrameRow) => {
					x.splice(0, yAxisListLength);
				});
				headersDataSet.splice(0, yAxisListLength);
				const customTooltipData: TooltipDataEntry[] = [];
				data.option._state?.fields.tooltip.forEach(
					(x: string, index: number) => {
						customTooltipData.push({
							name: x,
							data: valuesDataSet.map(
								(y: FrameRow) =>
									parseFloat(String(y[index])).toFixed(2), // Round tooltip data to 2 decimal places
							),
						});
					},
				);
				if (!Object.hasOwn(resultData.tooltip, "formatter")) {
					const tooltipData: TooltipDataEntry[] = [];
					data.option._state?.fields.tooltip.forEach(
						(x: string, index: number) => {
							customTooltipData.push({
								name: x,
								data: valuesDataSet.map(
									(y: FrameRow) =>
										parseFloat(String(y[index])).toFixed(2), // Round tooltip data to 2 decimal places
								),
							});
							tooltipData.push({
								name: x,
								data: valuesDataSet.map((y: FrameRow) =>
									parseFloat(String(y[index])).toFixed(2),
								),
							});
						},
					);
					resultData.tooltip = {
						...resultData.tooltip,
						formatter: (
							(tooltipRows: TooltipDataEntry[]) =>
							(params: TooltipParam[]) => {
								const formatterStringArr = ["<div>"];
								const dataIndex = params[0]?.dataIndex;
								formatterStringArr.push(
									`<strong>${params[0].name}</strong><br>`,
								);
								params.forEach((param: TooltipParam) => {
									let { value, seriesName, color } = param;
									if (
										!Number.isNaN(Number(value)) &&
										value !== undefined
									) {
										value = parseFloat(
											String(value),
										).toFixed(2);
									}
									formatterStringArr.push(
										`<span style="color:${color}">\u25CF</span> Average of ${seriesName}:<strong> ${value}</strong><br>`,
									);
								});
								tooltipRows.forEach((tooltipRow) => {
									formatterStringArr.push(
										`<span style="color:">\u25CF</span> ${tooltipRow.name}:<strong> ${tooltipRow.data[dataIndex ?? 0]}</strong><br>`,
									);
								});
								formatterStringArr.push(`</div>`);
								return formatterStringArr.join(" ");
							}
						)(tooltipData),
					};
				} else {
					delete resultData.tooltip.formatter;
				}
			}
			return resultData;
		},
		[frame.data.values],
	);
	function debounce<TArg>(fn: (arg: TArg) => void, delay: number) {
		let timer: ReturnType<typeof setTimeout> | undefined;
		return (arg: TArg) => {
			clearTimeout(timer);
			timer = setTimeout(() => fn(arg), delay);
		};
	}

	const echartsLoaded = debounce((chart: ECharts) => {
		// Fires only once when brush is released
		chart.on("brushEnd", (rawParams: unknown) => {
			const params = rawParams as BrushEndParams;
			if (!params.areas || !params.areas.length) return;
			const area = params.areas[0];
			// Get xAxis data
			const currentOption =
				chart.getOption() as unknown as ChartOptionSnapshot;
			const labelData = currentOption.series[0].data || [];
			const xAxisData = currentOption.xAxis?.[0]?.data || [];
			let indices: number[] = [];
			if (area.coordRange && area.coordRange.length === 2) {
				const [xRange, yRange] = area.coordRange;
				const xIndices: number[] = [];
				for (let i = xRange[0]; i <= xRange[1]; i++) xIndices.push(i);
				const yIndices: number[] = [];
				for (let i = 0; i < labelData.length; i++) {
					const val = labelData[i];
					if (val >= yRange[0] && val <= yRange[1]) yIndices.push(i);
				}
				indices = xIndices.filter((i) => yIndices.includes(i));

				const filteredLabels = indices.map((i) => xAxisData[i]);
				const filteredValues = indices.map((i) => labelData[i]);

				if (filteredValues.length > 0) {
					frame.filter(
						`SetFrameFilter(((${currentOption.series[0]?.name}==[${filteredValues}]) AND (${currentOption.xAxis?.[0]?.name}==[${filteredLabels}])))`,
					);
				}
			}
		});
	}, 2000);
	const onClickChart = {
		contextmenu: (params: ContextMenuEventParams) => {
			if (params.data) {
				const labelName = params.seriesName;
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									label: labelName,
									value: params.data,
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
	if (typeof data.option === "string") {
		// if it's a string, it's either invalid json or a query output that needs to be parsed
		// try to parse, and show error otherwise
		try {
			const lineOptions = JSON.parse(data.option);
			return (
				<div className="h-full">
					<ReactECharts
						option={lineOptions as unknown as EChartsOption}
						onEvents={onClickChart}
						onChartReady={(chart) => {
							echartsLoaded(chart);
						}}
					/>
				</div>
			);
		} catch (_e) {
			return (
				<div className="h-[30vh] w-[80vh] text-destructive">
					There was an issue parsing your JSON.
				</div>
			);
		}
	} else {
		const parsedOption = JSON.parse(computedValue) as LineChartOption;
		if (!canRenderChartData) {
			resultData = {
				...parsedOption,
				xAxis: {
					...parsedOption.xAxis,
					data: [],
				},
				series: [],
			};
		} else {
			resultData =
				data?.frame?.name &&
				frame.data.values.length > 0 &&
				frame.isLoading === false
					? formatDataPoints(parsedOption)
					: parsedOption;
		}
		return (
			<div className="h-full">
				<ReactECharts
					key={JSON.stringify(resultData)}
					option={resultData as EChartsOption}
					onEvents={onClickChart}
					onChartReady={(chart) => {
						echartsLoaded(chart);
					}}
					style={{
						height: "inherit",
					}}
				/>
				<CustomContextMenu
					id={id}
					frame={frame}
					contextMenu={contextMenu}
					onClose={() => setContextMenu(null)}
				/>
			</div>
		);
	}
});
