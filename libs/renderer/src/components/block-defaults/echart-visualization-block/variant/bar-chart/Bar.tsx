import type { EChartsOption } from "echarts";
import EChartsReact from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import type {
	AxisDataItem,
	BrushEndParams,
	BrushSelectedParams,
	EChartContextMenuParams,
} from "../../shared-types";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { ChartContextMenu } from "./ChartContextMenu";

interface BarChartSeriesItem {
	name?: string;
	data?: (number | null)[];
	toggleTrendLineObject?: boolean;
	type?: string;
	barWidth?: number;
	itemStyle?: Record<string, unknown>;
}

interface BarChartOption {
	xAxis: {
		name: string | string[];
		data: AxisDataItem[];
		pixelname?: string[];
		pixelvalue?: string[];
		pixeldataType?: string[];
	};
	yAxis: {
		name?: string | string[];
		pixelname?: string[];
	};
	series: BarChartSeriesItem[];
	customSettings?: {
		toolsUpdated?: boolean;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

//bar component properties
interface BarProps {
	id: string;
	// biome-ignore lint/suspicious/noExplicitAny: echart data/path types are untyped
	updateJson: (data: any, path: any) => void;
}

export const Bar = observer(({ id, updateJson }: BarProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number; //x axis position for the click/brush event
		mouseY: number; //y axis position for the click/brush event
		value: unknown; //value can be of object or string or number type
	} | null>(null);
	let resultData: BarChartOption = {} as BarChartOption;

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

	const selector = buildDynamicQuery(Object.entries(data?.aggregate ?? {}));
	//frame object
	const frameData = useFrame(data.frame.name, {
		selector: selector,
	});
	const chartOperationData = useRef<{
		brushSelected: AxisDataItem[] | null;
		contextMenu: null;
		yAxisColumn: {
			name: string;
			selector: string;
			width: undefined;
		} | null;
		chartInstance: { setOption: null };
	}>({
		brushSelected: [],
		contextMenu: null,
		yAxisColumn: { name: "", selector: "", width: undefined },
		chartInstance: { setOption: null },
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

	const parsedOption = useMemo(() => {
		return typeof computedValue === "string"
			? JSON.parse(computedValue)
			: computedValue;
	}, [computedValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frameData.data.values only
	useEffect(() => {
		const toolsUpdated =
			Object.hasOwn(parsedOption, "customSettings") &&
			Object.hasOwn(parsedOption.customSettings, "toolsUpdated")
				? parsedOption.customSettings.toolsUpdated
				: false;
		if (
			data.frame.name &&
			frameData.data.values.length > 0 &&
			frameData.isLoading === false &&
			!toolsUpdated
		) {
			updateJson(resultData, "option");
		}
	}, [frameData.data.values]);

	//update frame values to the series data when frame values are changed
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frameData.data.values only
	const receiveValueswithCorrections = useCallback(
		(resultData: BarChartOption) => {
			let frameDataIndex = 0;

			// Check if xAxis name exists
			if (!resultData.xAxis.name || resultData.xAxis.name.length === 0) {
				// If xAxis name is not present, clear xAxis data
				resultData.xAxis.data = [];
				return resultData;
			}

			//setting xaxis data - accept all values (strings for categorical, numbers for continuous)
			resultData.xAxis.data =
				frameData.data?.values?.map((item) => {
					const value = item[frameDataIndex];
					// X-axis accepts any value (strings for categorical axis, numbers for value axis)
					if (typeof value === "number" && !Number.isNaN(value)) {
						return parseFloat(value.toFixed(2));
					}
					// Return strings and other values as-is for categorical axis
					return value as AxisDataItem;
				}) ?? [];

			if (resultData.xAxis.name?.length > 0) {
				const optionSeriesLength = frameData.data.headers.length;
				frameDataIndex++;
				//setting all values to all existing series to null, to restore the chart to initial state so new values will be updated
				for (
					let seriesIdx = 0;
					seriesIdx < resultData.series.length;
					seriesIdx++
				) {
					if (
						resultData.series[seriesIdx] &&
						Object.hasOwn(resultData.series[seriesIdx], "data") &&
						!Object.hasOwn(
							resultData.series[seriesIdx],
							"toggleTrendLineObject",
						)
					) {
						resultData.series[seriesIdx].data =
							frameData.data?.values?.map(
								(_item: unknown) => null,
							); // Set to null directly
					}
				}

				// Setting new values to series
				let i: number;
				for (i = frameDataIndex; i < optionSeriesLength; i++) {
					if (
						resultData.series[i - 1] !== undefined &&
						Object.hasOwn(resultData.series[i - 1], "data") &&
						!Object.hasOwn(
							resultData.series[i - 1],
							"toggleTrendLineObject",
						)
					) {
						resultData.series[i - 1].data =
							frameData.data?.values?.map((item) => {
								const value = item[i];

								// Handle numeric values
								if (
									typeof value === "number" &&
									!Number.isNaN(value)
								) {
									return parseFloat(value.toFixed(2));
								}

								// Handle string numbers
								if (typeof value === "string") {
									const numValue = parseFloat(value);
									if (!Number.isNaN(numValue)) {
										return parseFloat(numValue.toFixed(2));
									}
								}

								return null; // Replace non-numeric with null
							});
					}
				}

				// Filter series based on yAxis.pixelname array
				const yAxisNames = resultData.yAxis.pixelname || [];

				resultData.series = resultData.series.filter(
					(seriesItem) =>
						yAxisNames.includes(seriesItem.name as string) ||
						seriesItem.toggleTrendLineObject === true,
				);

				// Ensure the series array length matches the yAxisNames length
				if (resultData.series.length > yAxisNames.length) {
					// Separate series with toggleTrendLineObject === true
					const trendLineSeries = resultData.series.filter(
						(seriesItem) =>
							seriesItem.toggleTrendLineObject === true,
					);

					// Slice only the remaining series to match yAxisNames length
					const otherSeries = resultData.series
						.filter(
							(seriesItem) =>
								seriesItem.toggleTrendLineObject !== true,
						)
						.slice(0, yAxisNames.length);

					// Combine the sliced series with the trend line series
					resultData.series = [...otherSeries, ...trendLineSeries];
				}
			}

			return resultData; //returning updated values to chart
		},
		[frameData.data.values],
	);

	//on events object for getting and processing events with chart
	const onClickChart = {
		//when contextmenu event is raised, default context menu made hidden, and custom component is shown
		contextmenu: (params: EChartContextMenuParams) => {
			if (params.data) {
				const option = data.option as BarChartOption;
				const xAxisName = option.xAxis.pixelvalue?.[0];
				const xAxisDataItem =
					option.xAxis.data[params.dataIndex as number];
				const xAxisValue =
					typeof xAxisDataItem === "object" &&
					xAxisDataItem !== null &&
					"value" in xAxisDataItem
						? xAxisDataItem.value
						: xAxisDataItem;
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									name: xAxisName,
									value: xAxisValue,
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
		//After brushing in bar chart, this event will be triggered to filter the selected data
		brushend: (params: BrushEndParams) => {
			const _batch = params.batch;
			const xAxisName = (data.option as BarChartOption).xAxis
				.pixelvalue?.[0];
			const xAxisValue = (
				chartOperationData.current.brushSelected ?? []
			).map((item) =>
				typeof item === "object" && item !== null && "value" in item
					? item.value
					: item,
			);
			frameData.filter(
				`SetFrameFilter(${xAxisName}==${JSON.stringify(xAxisValue)})`,
			);
		},
		//this event will be triggered when bar data is being selected
		brushselected: (params: BrushSelectedParams) => {
			const batch = params.batch;
			if (batch.length) {
				const firstBatch = batch[0];
				const selectedData = firstBatch.selected;
				const firstSelectedData = selectedData[0] ?? {
					dataIndex: [] as number[],
				};
				const xAxisData = (
					data.option as BarChartOption
				).xAxis.data.filter((_item, index) =>
					firstSelectedData.dataIndex.includes(index),
				);
				chartOperationData.current.brushSelected = xAxisData;
			}
		},
	};

	//validating the received data.option is in string format and parse it and then assign the same to chart
	if (typeof data.option === "string") {
		try {
			const options = JSON.parse(data.option);
			return (
				<div id={id} className="h-full w-full">
					<EChartsReact option={options} />
				</div>
			);
		} catch (_e) {
			return (
				<div className="flex h-[inherit] max-h-[30vh] w-[inherit] max-w-[80vh] flex-wrap content-start">
					There is an issue parsing your JSON.
				</div>
			);
		}
	} else {
		//assign the data from frame to exising object based on frame is selected or not
		resultData =
			data.frame.name &&
			frameData.data.values.length > 0 &&
			frameData.isLoading === false
				? receiveValueswithCorrections(parsedOption)
				: parsedOption;
		return (
			<div id={id} className="h-full w-full">
				<EChartsReact
					key={JSON.stringify(resultData)} //to re render the chart when data is changed
					option={resultData as EChartsOption}
					// onChartReady={echartsLoaded}
					onEvents={onClickChart}
					style={{
						height: "inherit",
						width: "inherit",
					}}
				/>
				<ChartContextMenu
					id={id}
					frame={frameData}
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
	}
});
