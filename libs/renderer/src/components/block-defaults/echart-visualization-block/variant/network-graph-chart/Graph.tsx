/* eslint-disable @typescript-eslint/no-explicit-any */

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { styled } from "@semoss/ui";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import type { EchartVisualizationBlockDef } from "../..";
import { CustomContextMenu } from "../../CustomContextMenu";

const StyledChartContainer = styled("div")(() => ({
	height: "inherit",
}));

const StyledNoDataContainer = styled("div", {
	shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
	height: "30vh",
	width: "80vh",
	color: error ? theme.palette.error.main : "unset",
}));

interface TooltipObject {
	tooltip?: {
		formatter?: unknown;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface NetworkProps {
	/**
	 *
	 */
	id: string;

	/**
	 *
	 */
	updateJson: (data: unknown, path: string) => void;
}

export const Graph = observer(({ id, updateJson }: NetworkProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);
	let resultData: unknown = {};

	/**
	 * Builds a dynamic query string based on the provided input data.
	 * @param inputData - An array of tuples where each tuple contains a string and an object mapping field names to aggregation methods.
	 * @returns A query string that selects and groups by the specified fields with appropriate aggregations.
	 */
	const buildDynamicQuery = (inputData): string => {
		const selectParts: string[] = [];
		const aliasParts: string[] = [];
		const groupByParts: string[] = [];

		inputData.forEach(([_, fields]) => {
			for (const field in fields) {
				const rawAgg = fields[field];
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

	/**
	 * get the frame
	 */
	const frame = useFrame(data?.frame?.name, {
		selector: buildDynamicQuery(Object.entries(data?.aggregate ?? {})),
	});

	/**
	 * @description Trying out different approach for TrendLine, work in progress
	 */
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
	/**
	 * @description
	 */
	const parsedOption = useMemo(() => {
		return typeof computedValue === "string"
			? JSON.parse(computedValue)
			: computedValue;
	}, [computedValue]);
	/**
	 * @description
	 */
	useEffect(() => {
		if (
			data?.frame?.name &&
			frame?.data?.values.length > 0 &&
			frame?.isLoading === false
		) {
			const { nodes, links, categories } = buildForceLayout(
				frame?.data?.values,
				frame?.data?.headers,
				parsedOption?.start,
				parsedOption?.end,
			);
			parsedOption.series[0].data = nodes;
			parsedOption.series[0].links = links;
			parsedOption.series[0].categories = categories;
			updateJson(parsedOption, "option");
		}
	}, [frame.data.values]);

	function buildForceLayout(values, headers, start, end) {
		const header = headers;
		const rows = values;

		const nodes = [];
		const links = [];
		const nodeSet = new Set();

		// categories for each header
		const categories = header.map((h) => ({ name: h }));

		const startKeys = start?.name || [];
		const endKeys = end?.name || [];

		rows.forEach((row) => {
			if (startKeys.length > 0 && endKeys.length > 0) {
				// Normal case (both start & end exist)
				startKeys.forEach((startKey) => {
					endKeys.forEach((endKey) => {
						const startIdx = header.indexOf(startKey);
						const endIdx = header.indexOf(endKey);

						if (
							startIdx >= 0 &&
							startIdx < row.length &&
							endIdx >= 0 &&
							endIdx < row.length
						) {
							const startVal = String(row[startIdx]);
							const endVal = String(row[endIdx]);

							if (startVal === "nan" || endVal === "nan") return;

							if (!nodeSet.has(startVal)) {
								nodes.push({
									name: startVal,
									category: startKey,
									symbol: "circle",
								});
								nodeSet.add(startVal);
							}

							if (!nodeSet.has(endVal)) {
								nodes.push({
									name: endVal,
									category: endKey,
									symbol: "circle",
								});
								nodeSet.add(endVal);
							}

							links.push({ source: startVal, target: endVal });
						}
					});
				});
			} else {
				// Single column case (only start OR only end)
				const activeKeys = startKeys.length > 0 ? startKeys : endKeys;

				activeKeys.forEach((colKey) => {
					const colIdx = header.indexOf(colKey);

					if (colIdx >= 0 && colIdx < row.length) {
						const val = String(row[colIdx]);
						if (val === "nan") return;

						if (!nodeSet.has(val)) {
							nodes.push({
								name: val,
								category: colKey,
								symbol: "circle",
							});
							nodeSet.add(val);
						}
					}
				});
			}
		});

		return { nodes, links, categories };
	}

	/**
	 * @description format the frame option data for echart
	 */

	const formatDataPoints = useCallback(
		(resultData: unknown) => {
			if (frame.data.values.length > 0) {
				const { nodes, links, categories } = buildForceLayout(
					frame?.data?.values,
					frame?.data?.headers,
					parsedOption?.start,
					parsedOption?.end,
				);
				parsedOption.series[0].data = nodes;
				parsedOption.series[0].links = links;
				parsedOption.series[0].categories = categories;
			} else {
				if (
					typeof resultData === "object" &&
					resultData !== null &&
					"tooltip" in resultData &&
					typeof (resultData as TooltipObject).tooltip === "object" &&
					(resultData as TooltipObject).tooltip !== null &&
					"formatter" in (resultData as TooltipObject).tooltip!
				) {
					delete (resultData as TooltipObject).tooltip?.formatter;
				}
			}
			return resultData;
		},
		[frame.data.values],
	);

	/**
	 * @description
	 */
	const onClickChart = {
		contextmenu: (params) => {
			//  let currentOption = chart.getOption();
			if (params.data) {
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									label: params.data.category,
									value: params.data.name,
								},
							}
						: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
							// Other native context menus might behave different.
							// With this behavior we prevent contextmen
							// u from the backdrop to re-locale existing context menus.
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
			const networkOptions = JSON.parse(data.option);
			return (
				<StyledChartContainer>
					<ReactECharts
						option={networkOptions}
						onEvents={onClickChart}
					/>
				</StyledChartContainer>
			);
		} catch {
			return (
				<StyledNoDataContainer error>
					There was an issue parsing your JSON.
				</StyledNoDataContainer>
			);
		}
	} else {
		resultData =
			data?.frame?.name &&
			frame.data.values.length > 0 &&
			frame.isLoading === false
				? formatDataPoints(parsedOption)
				: parsedOption;

		return (
			<StyledChartContainer>
				<ReactECharts
					option={resultData as EChartsOption}
					onEvents={onClickChart}
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
			</StyledChartContainer>
		);
	}
});
