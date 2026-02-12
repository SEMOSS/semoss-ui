import type { EChartsOption } from "echarts";
import EChartsReact from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { styled } from "@semoss/ui";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { ChartContextMenu } from "./ChartContextMenu";

//Main Container for displaying Bar chart
const StyledMainContainer = styled("div")(({ theme }) => ({
	height: "100%",
	width: "100%",
}));
//container for displaying invalid or no data
const StyledNoDataContainer = styled("div", {
	shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
	height: "inherit",
	width: "inherit",
	maxHeight: "30vh",
	maxWidth: "80vh",
	display: "flex",
	flexWrap: "wrap",
	alignContent: "flex-start",
	color: error ? theme.palette.error.main : "unset",
}));
//echart field structure
export interface EChartColumns {
	name: string;
	selector: string;
	width: string;
}
//bar component properties
interface BarProps {
	id: string;
	updateJson: (data: any, path: any) => void;
}

export const Bar = observer(({ id, updateJson }: BarProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number; //x axis position for the click/brush event
		mouseY: number; //y axis position for the click/brush event
		value: unknown; //value can be of object or string or number type
	} | null>(null);
	let resultData: unknown = {};

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
	const chartOperationData = useRef({
		brushSelected: [],
		contextMenu: null,
		yAxisColumn: { name: "", selector: "", width: undefined },
		chartInstance: { setOption: null },
	});

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

	useEffect(() => {
		const toolsUpdated =
			Object.hasOwn(parsedOption, "customSettings") &&
			Object.hasOwn(parsedOption["customSettings"], "toolsUpdated")
				? parsedOption["customSettings"]["toolsUpdated"]
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
	const receiveValueswithCorrections = useCallback(
		(resultData: unknown) => {
			let frameDataIndex = 0;

			// Check if xAxis name exists
			if (!resultData["xAxis"]["name"] || resultData["xAxis"]["name"].length === 0) {
				// If xAxis name is not present, clear xAxis data
				resultData["xAxis"]["data"] = [];
				return resultData;
			}
			
			//setting xaxis data
			resultData["xAxis"]["data"] = frameData.data?.values?.map(
				(item) => {
					const value = item[frameDataIndex];
					return typeof value === "number" && !isNaN(value)
						? parseFloat(value.toFixed(2)) // Round to 2 decimal places
						: null; // Replace NaN with null
				},
			);

			if (resultData["xAxis"]["name"]?.length > 0) {
				const optionSeriesLength = frameData.data.headers.length;
				frameDataIndex++;
				//setting all values to all existing series to null, to restore the chart to initial state so new values will be updated
				for (
					let seriesIdx = 0;
					seriesIdx < resultData["series"].length;
					seriesIdx++
				) {
					if (
						resultData["series"][seriesIdx] &&
						Object.hasOwn(resultData["series"][seriesIdx], "data") &&
						!Object.hasOwn(resultData["series"][seriesIdx], "toggleTrendLineObject")
					) {
						resultData["series"][seriesIdx]["data"] =
							frameData.data?.values?.map((item) => null); // Set to null directly
					}
				}

				// Setting new values to series
				let i;
				for (i = frameDataIndex; i < optionSeriesLength; i++) {
					if (
						resultData["series"][i - 1] !== undefined &&
						Object.hasOwn(resultData["series"][i - 1], "data") &&
						!Object.hasOwn(
							resultData["series"][i - 1],
							"toggleTrendLineObject",
						)
					) {
						resultData["series"][i - 1]["data"] =
							frameData.data?.values?.map((item) => {
								const value = item[i];
								return typeof value === "number" &&
									!isNaN(value)
									? parseFloat(value.toFixed(2)) // Round to 2 decimal places
									: null; // Replace NaN with null
							});
					}
				}

				// Filter series based on yAxis.name array
				const yAxisNames = resultData["yAxis"]["name"];

				resultData["series"] = resultData["series"].filter(
					(seriesItem) =>
						yAxisNames.includes(seriesItem.name) ||
						seriesItem.toggleTrendLineObject === true,
				);

				// Ensure the series array length matches the yAxisNames length
				if (resultData["series"].length > yAxisNames.length) {
					// Separate series with toggleTrendLineObject === true
					const trendLineSeries = resultData["series"].filter(
						(seriesItem) =>
							seriesItem.toggleTrendLineObject === true,
					);

					// Slice only the remaining series to match yAxisNames length
					const otherSeries = resultData["series"]
						.filter(
							(seriesItem) =>
								seriesItem.toggleTrendLineObject !== true,
						)
						.slice(0, yAxisNames.length);

					// Combine the sliced series with the trend line series
					resultData["series"] = [...otherSeries, ...trendLineSeries];
				}
			}

			return resultData; //returning updated values to chart
		},
		[frameData.data.values],
	);

	//on events object for getting and processing events with chart
	const onClickChart = {
		//when contextmenu event is raised, default context menu made hidden, and custom component is shown
		contextmenu: (params) => {
			if (params.data) {
				const xAxisName = data.option["xAxis"]["pixelvalue"][0];
				const xAxisValue =
					typeof data.option["xAxis"]["data"][params.dataIndex] ==
						"object" &&
					Object.hasOwn(
						data.option["xAxis"]["data"][params.dataIndex],
						"value",
					)
						? data.option["xAxis"]["data"][params.dataIndex][
								"value"
							]
						: data.option["xAxis"]["data"][params.dataIndex];
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
		brushend: (params) => {
			const batch = params.batch;
			const xAxisName = data.option["xAxis"]["pixelvalue"][0];
			const xAxisValue = chartOperationData.current.brushSelected.map(
				(item) =>
					typeof item === "object" && Object.hasOwn(item, "value")
						? item["value"]
						: item,
			);
			frameData.filter(
				`SetFrameFilter(${xAxisName}==${JSON.stringify(xAxisValue)})`,
			);
		},
		//this event will be triggered when bar data is being selected
		brushselected: (params) => {
			const batch = params.batch;
			if (batch.length) {
				const firstBatch = batch[0];
				const selectedData = firstBatch.selected;
				const firstSelectedData = selectedData[0] || [];
				const xAxisData = data.option["xAxis"]["data"].filter(
					(item, index) =>
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
				<StyledMainContainer id={id}>
					<EChartsReact option={options} />
				</StyledMainContainer>
			);
		} catch (e) {
			return (
				<StyledNoDataContainer>
					There is an issue parsing your JSON.
				</StyledNoDataContainer>
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
			<StyledMainContainer id={id}>
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
			</StyledMainContainer>
		);
	}
});
