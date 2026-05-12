import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import type { EchartVisualizationBlockDef } from "../..";
import { CustomContextMenu } from "../../CustomContextMenu";

type PieValue = string | number | null;
type FrameRow = [string, PieValue];

interface PieSeriesDataPoint {
	name: string;
	value: PieValue;
}

interface PieSeries {
	data: PieSeriesDataPoint[];
	[key: string]: unknown;
}

interface PieTooltip {
	formatter?: unknown;
	[key: string]: unknown;
}

interface PieStateFields {
	Label?: string[];
	Value?: string[];
	[key: string]: unknown;
}

interface PieChartOption {
	series?: PieSeries[];
	tooltip?: PieTooltip;
	state?: {
		fields?: PieStateFields;
	};
	[key: string]: unknown;
}

interface PieContextMenuEvent {
	data?: {
		name: string;
	};
	event: {
		event: MouseEvent;
	};
}

interface PieProps {
	/**
	 *
	 */
	id: string;

	/**
	 *
	 */
	updateJson: (data: unknown, path: string) => void;
}

export const Pie = observer(({ id, updateJson }: PieProps) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);
	let resultData: PieChartOption = {};

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

		inputData.forEach(([_key, fields]) => {
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
	const hasLabelSelection =
		(data.option?.state?.fields?.Label?.length ?? 0) > 0;
	const hasValueSelection =
		(data.option?.state?.fields?.Value?.length ?? 0) > 0;
	const canRenderChartData = hasLabelSelection && hasValueSelection;

	/**
	 * @description Trying out different approach for TrendLine, work in progress
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
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
		return (
			typeof computedValue === "string"
				? JSON.parse(computedValue)
				: computedValue
		) as PieChartOption;
	}, [computedValue]);

	/**
	 * @description
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (
			canRenderChartData &&
			data?.frame?.name &&
			frame?.data?.values.length > 0 &&
			frame?.isLoading === false
		) {
			updateJson(parsedOption, "option");
		}
	}, [canRenderChartData, frame.data.values]);

	/**
	 * @description format the frame option data for echart
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	const formatDataPoints = useCallback(
		(resultData: PieChartOption) => {
			if (frame.data.values.length > 0) {
				const valuesDataSet: FrameRow[] = JSON.parse(
					JSON.stringify(frame.data.values),
				);
				let headersDataSet: string[] = JSON.parse(
					JSON.stringify(frame.data.headers),
				);
				headersDataSet = headersDataSet.map((header: string) =>
					header.replace("Average_", ""),
				);
				//format the data points to match the echart specification
				const nextSeries = resultData.series ?? [];
				if (!nextSeries[0]) {
					nextSeries[0] = { data: [] };
				}
				nextSeries[0].data = valuesDataSet.map(([name, value]) => ({
					name,
					value,
				}));
				resultData.series = nextSeries;
				valuesDataSet.map((x) => x.shift());
				headersDataSet.shift();
			} else if (resultData.tooltip) {
				delete resultData.tooltip.formatter;
			}
			return resultData;
		},
		[frame.data.values],
	);

	/**
	 * @description
	 */
	const onClickChart = {
		contextmenu: (params: PieContextMenuEvent) => {
			//  let currentOption = chart.getOption();
			if (params.data) {
				const option = data.option as PieChartOption;
				const labelName = option.state?.fields?.Label?.[0];
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									label: labelName,
									value: params.data.name,
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
						option={lineOptions}
						onEvents={onClickChart}
					/>
				</div>
			);
		} catch {
			return (
				<div className="h-[30vh] w-[80vh] text-destructive">
					There was an issue parsing your JSON.
				</div>
			);
		}
	} else {
		if (!canRenderChartData) {
			resultData = {
				...parsedOption,
				series: (parsedOption.series ?? []).map((seriesItem) => ({
					...seriesItem,
					data: [],
				})),
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
					style={{
						height: "inherit",
						//width: 'inherit'
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
