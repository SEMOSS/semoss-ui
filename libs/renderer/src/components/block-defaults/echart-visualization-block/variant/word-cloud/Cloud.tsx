import type { EChartsOption } from "echarts";
import "echarts-wordcloud";
import EChartsReact from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
import { styled } from "@semoss/ui";
import { useBlock, useFrame } from "../../../../../hooks";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";

//Main Container for displaying word cloud chart
const StyledMainContainer = styled("div")(() => ({
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

//Word Cloud component properties
interface CloudProps {
	id: string;
	updateJson: (data: unknown, path: unknown) => void;
}

export const Cloud = observer(({ id, updateJson }: CloudProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);
	const sampleColors: string[] = [
		"#5470c6",
		"#91cc75",
		"#fac858",
		"#ee6666",
		"#73c0de",
		"#3ba272",
		"#fc8452",
		"#9a60b4",
		"#ea7ccc",
		"#45b7d1",
	];

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

	/**
	 * get the frame
	 */
	const frame = useFrame(data?.frame?.name, {
		selector: buildDynamicQuery(Object.entries(data?.aggregate ?? {})),
	});

	// Parse the option data as JSON if string, otherwise use as is
	let parsedOption: Record<string, unknown> = {};
	if (data?.option) {
		parsedOption =
			typeof data?.option === "string"
				? JSON.parse(data?.option)
				: data?.option;
	}

	/**
	 * Format the frame data for word cloud display
	 */
	const formatCloudData = useCallback(
		(resultData: Record<string, unknown>) => {
			// Get the color palette from the result data
			const colorPalette = (resultData.color as string[]) || sampleColors;

			if (frame.data.values.length > 0) {
				const valuesDataSet = JSON.parse(
					JSON.stringify(frame.data.values),
				);

				// Find the column indices for words, size, and tooltip
				// The aggregate looks like: { words: { "MOON": "Full" }, size: { "SIZE": "Count" } }
				const wordsFieldName = data?.aggregate?.words
					? Object.keys(data.aggregate.words)[0]
					: null;
				const sizeFieldName = data?.aggregate?.size
					? Object.keys(data.aggregate.size)[0]
					: null;
				const tooltipFieldName = data?.aggregate?.tooltip
					? Object.keys(data.aggregate.tooltip)[0]
					: null;

				// Get the aggregation methods
				const sizeAggregation = data?.aggregate?.size
					? data.aggregate.size[sizeFieldName]
					: null;
				const tooltipAggregation = data?.aggregate?.tooltip
					? data.aggregate.tooltip[tooltipFieldName]
					: null;

				const wordsIndex = wordsFieldName
					? frame.data.headers.indexOf(wordsFieldName)
					: -1;
				const sizeIndex = sizeFieldName
					? frame.data.headers.indexOf(sizeFieldName)
					: -1;
				const tooltipIndex = tooltipFieldName
					? frame.data.headers.indexOf(tooltipFieldName)
					: -1;

				// Get the color palette from the result data
				const colorPalette =
					(resultData.color as string[]) || sampleColors;

				// Transform data into word cloud format: [{name: 'word', value: size, tooltip: 'info', textStyle: {color: 'color'}}]
				const wordCloudData = valuesDataSet
					.map((row: unknown[], index: number) => {
						const wordCloudItem: Record<string, unknown> = {};

						// Word name (required)
						if (
							wordsIndex >= 0 &&
							row[wordsIndex] !== null &&
							row[wordsIndex] !== undefined
						) {
							wordCloudItem.name = String(row[wordsIndex]);
						}

						// Size value (required)
						if (
							sizeIndex >= 0 &&
							row[sizeIndex] !== null &&
							row[sizeIndex] !== undefined
						) {
							wordCloudItem.value = Number(row[sizeIndex]) || 1;
						} else {
							wordCloudItem.value = 1; // Default size
						}

						// Tooltip data (optional)
						if (
							tooltipIndex >= 0 &&
							row[tooltipIndex] !== null &&
							row[tooltipIndex] !== undefined
						) {
							wordCloudItem.tooltip = row[tooltipIndex];
						}

						// Assign a color from the palette to each word
						const colorIndex = index % colorPalette.length;
						wordCloudItem.textStyle = {
							color: colorPalette[colorIndex],
						};

						return wordCloudItem;
					})
					.filter(
						(item: Record<string, unknown>) =>
							item.name !== undefined &&
							item.name !== null &&
							String(item.name).trim() !== "",
					);

				// Update the series data and add custom tooltip formatter
				const updatedResult = { ...resultData };
				if (
					updatedResult.series &&
					Array.isArray(updatedResult.series)
				) {
					updatedResult.series = (
						updatedResult.series as Record<string, unknown>[]
					).map((series) => ({
						...series,
						data: wordCloudData,
					}));
				}

				// Add additional tooltips to the existing tooltip
				const existingTooltip =
					updatedResult.tooltip &&
					typeof updatedResult.tooltip === "object"
						? updatedResult.tooltip
						: {};
				updatedResult.tooltip = {
					...existingTooltip,
					formatter: (params: {
						name: string;
						value: number;
						data: { tooltip?: unknown };
						color: string;
					}) => {
						const formatterParts = ["<div>"];

						// Word name with colored circle
						formatterParts.push(
							`<span style="color:${params.color}">\u25CF</span> <strong>${params.name}</strong><br>`,
						);

						// Size information (will show as the primary data)
						if (sizeFieldName && sizeAggregation) {
							formatterParts.push(
								`${sizeAggregation} of ${sizeFieldName}: <strong>${params.value}</strong><br>`,
							);
						} else if (sizeFieldName) {
							formatterParts.push(
								`${sizeFieldName}: <strong>${params.value}</strong><br>`,
							);
						}

						// Additional tooltip information
						if (
							tooltipFieldName &&
							params.data?.tooltip !== undefined &&
							params.data?.tooltip !== null
						) {
							const tooltipLabel = tooltipAggregation
								? `${tooltipAggregation} of ${tooltipFieldName}`
								: tooltipFieldName;
							formatterParts.push(
								`${tooltipLabel}: <strong>${params.data.tooltip}</strong><br>`,
							);
						}

						formatterParts.push("</div>");
						return formatterParts.join("");
					},
				};

				return updatedResult;
			} else {
				// Handle sample data
				const updatedResult = { ...resultData };
				if (
					updatedResult.series &&
					Array.isArray(updatedResult.series)
				) {
					updatedResult.series = (
						updatedResult.series as Record<string, unknown>[]
					).map((series) => {
						if (series.data && Array.isArray(series.data)) {
							// Apply colors to sample data
							const coloredData = (
								series.data as Record<string, unknown>[]
							).map((item, index) => ({
								...item,
								textStyle: {
									...((item.textStyle as Record<
										string,
										unknown
									>) || {}),
									color: colorPalette[
										index % colorPalette.length
									],
								},
							}));
							return {
								...series,
								data: coloredData,
							};
						}
						return series;
					});
				}
				return updatedResult;
			}
		},
		[frame.data.values, frame.data.headers, data?.aggregate],
	);

	// Update the e-chart whenever the frame data changes
	useEffect(() => {
		const shouldUpdate =
			data?.frame?.name &&
			frame?.data?.values.length > 0 &&
			frame?.isLoading === false;

		if (shouldUpdate) {
			let currentParsedOption: Record<string, unknown> = {};
			if (data?.option) {
				currentParsedOption =
					typeof data.option === "string"
						? JSON.parse(data.option)
						: data.option;
			}

			const formattedData = formatCloudData(currentParsedOption);
			updateJson(formattedData, "option");
		}
	}, [frame.data.values, frame.isLoading, data, updateJson, formatCloudData]);

	// Handle cases where option is a string (raw JSON or query output)
	if (typeof data.option === "string") {
		// if it's a string, it's either invalid json or a query output that needs to be parsed
		// try to parse, and show error otherwise
		try {
			const cloudOptions = JSON.parse(data.option);
			return (
				<StyledMainContainer id={id}>
					<EChartsReact option={cloudOptions} />
				</StyledMainContainer>
			);
		} catch {
			return (
				<StyledNoDataContainer error>
					There was an issue parsing your JSON.
				</StyledNoDataContainer>
			);
		}
	} else {
		// Calculate the final option data
		const hasRealData =
			data?.frame?.name &&
			frame.data.values.length > 0 &&
			frame.isLoading === false;

		// Always format the data to ensure proper coloring (handles both real and sample data)
		const finalOption: Record<string, unknown> =
			formatCloudData(parsedOption);

		// Check if we have words to display
		const wordData = finalOption?.series?.[0]?.data as unknown[];
		const hasWords = Array.isArray(wordData) && wordData.length > 0;

		// Show empty state if no words are available
		if (hasRealData && !hasWords) {
			return (
				<StyledNoDataContainer>
					No words available to display. Please check your data
					configuration.
				</StyledNoDataContainer>
			);
		}

		// Add key to force re-render when data changes
		const chartKey = `cloud-${id}-${JSON.stringify(finalOption?.series?.[0]?.data)}`;

		return (
			<StyledMainContainer id={id}>
				<EChartsReact
					key={chartKey}
					option={finalOption as EChartsOption}
					style={{
						height: "inherit",
						width: "inherit",
					}}
				/>
			</StyledMainContainer>
		);
	}
});
