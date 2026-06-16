import ReactECharts, { type EChartsOption } from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { CustomContextMenu } from "../../CustomContextMenu";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";

interface LineProps {
	id: string;
	// biome-ignore lint/suspicious/noExplicitAny: echart data/path types are untyped
	updateJson: (data: any, path: any) => void;
}
export const Line = observer(({ id, updateJson }: LineProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);
	let resultData: unknown = {};
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
	const buildDynamicQuery = (inputData): string => {
		const blockJSON = data.option;
		if (!blockJSON._state) return null;
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

	const frame = useFrame(data.frame.name, {
		selector: buildDynamicQuery(Object.entries(data?.aggregate ?? {})),
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
			data?.frame?.name &&
			frame?.data?.values.length > 0 &&
			frame?.isLoading === false
		) {
			updateJson(resultData, "option");
		}
	}, [frame.data.values]);
	//format the frame option data for echart
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frame.data.values only
	const formatDataPoints = useCallback(
		(resultData: unknown) => {
			if (frame.data.values.length > 0) {
				const valuesDataSet = JSON.parse(
					JSON.stringify(frame.data.values),
				);
				let headersDataSet: string[] = JSON.parse(
					JSON.stringify(frame.data.headers),
				);
				headersDataSet = headersDataSet.map((header: string) =>
					header.replace("Average_", ""),
				);
				//format the data points to match the echart specification
				resultData.xAxis.data = valuesDataSet
					?.map((x) =>
						x?.[0] !== undefined && !Number.isNaN(parseFloat(x[0]))
							? parseFloat(x[0]).toFixed(2)
							: null,
					)
					.filter((value) => value !== null);
				valuesDataSet.map((x) => x.shift());
				headersDataSet.shift();
				const yAxisListLength = resultData._state?.fields?.yAxis.length;
				if (!resultData.series) {
					resultData.series = [];
				}
				for (let index = 0; index < yAxisListLength; index++) {
					if (!resultData.series[index]) {
						resultData.series[index] = {};
					}

					resultData.series[index].data = valuesDataSet.map((x) => {
						const value = x[index];
						if (
							value === null ||
							value === undefined ||
							value === "NaN" ||
							Number.isNaN(Number(value))
						) {
							return null; // Replace invalid values with null
						}
						return parseFloat(value).toFixed(2); // Round to 2 decimal places
					});
					resultData.series[index].name = headersDataSet[index];
					resultData.series[index].type = "line";
				}

				const yAxisNames = resultData.yAxis.name;

				resultData.series = resultData.series.filter((seriesItem) =>
					yAxisNames.includes(seriesItem.name),
				);

				valuesDataSet.forEach((x) => {
					x.splice(0, yAxisListLength);
				});
				headersDataSet.splice(0, yAxisListLength);
				const customTooltipData = [];
				data.option._state?.fields.tooltip.forEach((x, index) => {
					customTooltipData.push({
						name: x,
						data: valuesDataSet.map(
							(y) => parseFloat(y[index]).toFixed(2), // Round tooltip data to 2 decimal places
						),
					});
				});
				if (!Object.hasOwn(resultData.tooltip, "formatter")) {
					const customTooltipData = [];
					data.option._state?.fields.tooltip.forEach((x, index) => {
						customTooltipData.push({
							name: x,
							data: valuesDataSet.map(
								(y) => parseFloat(y[index]).toFixed(2), // Round tooltip data to 2 decimal places
							),
						});
					});
					resultData.tooltip = {
						...resultData.tooltip,
						formatter: ((customTooltipData) => (params) => {
							const formatterStringArr = ["<div>"];
							const dataIndex = params[0]?.dataIndex;
							formatterStringArr.push(
								`<strong>${params[0].name}</strong><br>`,
							);
							params.forEach((param) => {
								let { value, seriesName, color } = param;
								if (
									!Number.isNaN(value) &&
									value !== undefined
								) {
									value = parseFloat(value).toFixed(2);
								}
								formatterStringArr.push(
									`<span style="color:${color}">\u25CF</span> Average of ${seriesName}:<strong> ${value}</strong><br>`,
								);
							});
							customTooltipData.forEach((data) => {
								formatterStringArr.push(
									`<span style="color:">\u25CF</span> ${data.name}:<strong> ${data.data[dataIndex]}</strong><br>`,
								);
							});
							formatterStringArr.push(`</div>`);
							return formatterStringArr.join(" ");
						})(customTooltipData),
					};
				} else {
					delete resultData.tooltip.formatter;
				}
			}
			return resultData;
		},
		[frame.data.values],
	);
	function debounce(fn, delay) {
		let timer: ReturnType<typeof setTimeout> | undefined;
		return (...args) => {
			clearTimeout(timer);
			timer = setTimeout(() => fn(...args), delay);
		};
	}

	const echartsLoaded = debounce((chart) => {
		// Fires only once when brush is released
		chart.on("brushEnd", (params) => {
			if (!params.areas || !params.areas.length) return;
			const area = params.areas[0];
			// Get xAxis data
			const currentOption = chart.getOption();
			const labelData = currentOption.series[0].data || [];
			const xAxisData = currentOption.xAxis?.[0]?.data || [];
			let indices = [];
			if (area.coordRange && area.coordRange.length === 2) {
				const [xRange, yRange] = area.coordRange;
				const xIndices = [];
				for (let i = xRange[0]; i <= xRange[1]; i++) xIndices.push(i);
				const yIndices = [];
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
		contextmenu: (params) => {
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
		resultData =
			data?.frame?.name &&
			frame.data.values.length > 0 &&
			frame.isLoading === false
				? formatDataPoints(JSON.parse(computedValue))
				: JSON.parse(computedValue);
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
