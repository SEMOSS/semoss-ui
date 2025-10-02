import type { EChartsOption } from "echarts";
import EChartsReact from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
import { styled } from "@semoss/ui";
import { useBlock, useFrame } from "../../../../../hooks";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";

//Main Container for displaying KPI chart
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

//KPI component properties
interface KPIProps {
	id: string;
	updateJson: (data: unknown, path: unknown) => void;
}

export const KPI = observer(({ id, updateJson }: KPIProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);

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
		)}])`;
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
	 * Format the frame data for KPI display
	 */
	const formatKPIData = useCallback(
		(resultData: Record<string, unknown>) => {
			if (frame.data.values.length > 0) {
				const valuesDataSet = JSON.parse(
					JSON.stringify(frame.data.values),
				);

				// We show the first/primary value for our no multi KPI
				if (valuesDataSet.length > 0) {
					// Show the first aggregated value
					const kpiValue = valuesDataSet[0][0]; // First row, first column (aggregated dimension value)

					// Check if user has customized the title
					// If so, preserve it
					const seriesData = resultData.series?.[0] as Record<
						string,
						unknown
					>;
					const currentTitle = (
						seriesData?.data as Array<Record<string, unknown>>
					)?.[0]?.name;
					const hasUserCustomizedTitle =
						resultData.userCustomizedTitle === true;

					let kpiName = currentTitle || "Sample KPI";

					// Only generate new title if user hasn't customized it
					if (!hasUserCustomizedTitle) {
						if (frame.data.headers.length > 0) {
							const fieldName = frame.data.headers[0];

							// Format field name: lowercase with first letter capitalized
							const formatFieldName = (name: string) => {
								return (
									name.toLowerCase().charAt(0).toUpperCase() +
									name.toLowerCase().slice(1)
								);
							};

							const formattedFieldName =
								formatFieldName(fieldName);

							// Look for the aggregation type in data.aggregate
							const aggregateInfo = data?.aggregate?.dimension;

							if (aggregateInfo?.[fieldName]) {
								const aggregationType =
									aggregateInfo[fieldName];
								kpiName = `${aggregationType} of ${formattedFieldName}`;
							} else {
								kpiName = formattedFieldName;
							}
						}
					}

					// Ensure series exists and has proper structure
					if (
						resultData.series &&
						Array.isArray(resultData.series) &&
						resultData.series[0]
					) {
						(resultData.series[0] as Record<string, unknown>).data =
							[
								{
									value: kpiValue,
									name: kpiName,
								},
							];
					}

					// Update the title if we have a label or use the dimension name - hide it since we use series title
					if (resultData.title) {
						(resultData.title as Record<string, unknown>).show =
							false;
					}
				}
			}
			return resultData;
		},
		[frame.data.values, frame.data.headers, data?.aggregate?.dimension],
	);

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

			const formattedData = formatKPIData(currentParsedOption);
			updateJson(formattedData, "option");
		}
	}, [frame.data.values, frame.isLoading, data, updateJson, formatKPIData]);

	if (typeof data.option === "string") {
		// if it's a string, it's either invalid json or a query output that needs to be parsed
		// try to parse, and show error otherwise
		try {
			const kpiOptions = JSON.parse(data.option);
			return (
				<StyledMainContainer id={id}>
					<EChartsReact option={kpiOptions} />
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

		let finalOption: Record<string, unknown>;
		if (hasRealData) {
			finalOption = formatKPIData(parsedOption);
		} else {
			finalOption = parsedOption;
		}

		// Add key to force re-render when data changes
		const chartKey = `kpi-${id}-${JSON.stringify(finalOption?.series?.[0]?.data)}`;

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
