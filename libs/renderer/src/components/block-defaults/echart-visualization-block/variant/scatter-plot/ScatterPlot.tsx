import type { ECharts, EChartsOption } from "echarts";
import { BarChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import EChartsReact from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import type { BlockComponent, ListenerActions } from "../../../../../store";
import type { EChartColumns } from "../../shared-types";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { processData } from "./ScatterPlotProcessData";
import { getSelector } from "./ScatterPlotSelector";
import {
	formatdatapoints,
	type TooltipFormatterParam,
} from "./ScatterPlotTooltipData";

interface ScatterSeriesItem {
	data: { label: { formatter: string; name?: string } }[];
	label: { name: string };
}

interface ScatterChartOption {
	_state?: {
		fields: {
			label: string[];
			XAxis: string[];
			YAxis: string[];
		};
	};
	state?: {
		fields: {
			label: string[];
			XAxis: string[];
			YAxis: string[];
		};
	};
	xAxis?: {
		name?: string | string[];
		pixelName?: string | string[];
	};
	yAxis?: {
		name?: string | string[];
		pixelName?: string | string[];
	};
	series: ScatterSeriesItem[];
	tooltip: {
		formatter?: string | ((params: TooltipFormatterParam) => string);
	};
	color: string[];
}

interface ScatterContextMenuParams {
	data?: {
		label: { formatter: string };
	};
	event: {
		event: {
			clientX: number;
			clientY: number;
			preventDefault: () => void;
		};
	};
	dataIndex: number;
}

export interface EchartVisualizationBlockDef {
	widget: "e-chart";
	data: {
		option: ScatterChartOption;
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

export const ScatterPlotBlock: BlockComponent = observer(({ id }) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);

	echarts.use([BarChart, CanvasRenderer, TooltipComponent]);

	const normalizeNameValue = (value: unknown): string => {
		if (Array.isArray(value)) {
			return String(value[0] ?? "");
		}
		return String(value ?? "");
	};
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);

	const frame = useFrame(data?.frame?.name, {
		selector: getSelector(data, data?.aggregate),
	});
	function debounce(
		fn: (...args: unknown[]) => void,
		delay: number,
	): (...args: unknown[]) => void {
		let timer: ReturnType<typeof setTimeout> | undefined;
		return (...args: unknown[]) => {
			clearTimeout(timer);
			timer = setTimeout(() => fn(...args), delay);
		};
	}
	const echartsLoaded = debounce((chart: unknown) => {
		const chartInstance = chart as ECharts;
		chartInstance.on("brushSelected", (rawParams: unknown) => {
			const params = rawParams as {
				batch: { selected: { dataIndex: number[] }[] }[];
			};
			const selectedData = params.batch[0].selected[0].dataIndex;
			const currentOption =
				chartInstance.getOption() as unknown as ScatterChartOption;
			const labelData = currentOption.series[0].data;
			const filteredLabels = selectedData.map(
				(index) => labelData[index].label.formatter,
			);
			if (filteredLabels.length > 0) {
				handleSelection(
					filteredLabels,
					normalizeNameValue(currentOption.series[0].label.name),
				);
			}
		});
	}, 2000);

	const handleSelection = debounce((value: unknown, name: unknown) => {
		// update the frame
		frame.filter(`SetFrameFilter(${String(name)}==[${String(value)}])`);
	}, 2000);
	const onClickChart = {
		contextmenu: (params: ScatterContextMenuParams) => {
			if (params.data) {
				const labelName = normalizeNameValue(
					data.option.series[0].label.name,
				);
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									label: labelName,
									value: params.data.label.formatter,
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

	if (!data.option) {
		return (
			<div className="h-full w-full">
				Add JSON to render your visualization
			</div>
		);
	}

	const stateFields = data.option.state?.fields ?? data.option._state?.fields;

	if (data.option.xAxis) {
		data.option.xAxis.name = normalizeNameValue(data.option.xAxis.name);
		data.option.xAxis.pixelName = normalizeNameValue(
			data.option.xAxis.pixelName,
		);
	}
	if (data.option.yAxis) {
		data.option.yAxis.name = normalizeNameValue(data.option.yAxis.name);
		data.option.yAxis.pixelName = normalizeNameValue(
			data.option.yAxis.pixelName,
		);
	}
	data.option.series[0].label.name = normalizeNameValue(
		data.option.series[0].label.name,
	);
	if (
		stateFields &&
		stateFields.label?.length > 0 &&
		stateFields.XAxis?.length > 0 &&
		stateFields.YAxis?.length > 0
	) {
		const processedFrameData = processData(frame.data, data);
		if (processedFrameData && processedFrameData.length > 0) {
			data.option.series[0].data = processedFrameData;
		}
		if (frame.data.values.length > 0) {
			if (
				!Object.hasOwn(data.option.tooltip, "formatter") ||
				data.option.tooltip.formatter === ""
			) {
				const tooltipFormatter = formatdatapoints(frame.data, data);
				const normalizedFormatter =
					typeof tooltipFormatter === "function"
						? (params: unknown) =>
								tooltipFormatter(
									params as TooltipFormatterParam,
								)
						: tooltipFormatter;
				data.option.tooltip = {
					...data.option.tooltip,
					formatter: normalizedFormatter,
				};
			}
		}
	}
	return (
		<div className="h-full w-full">
			<EChartsReact
				option={data.option as unknown as EChartsOption}
				onChartReady={(chart) => {
					echartsLoaded(chart);
				}}
				style={{ height: "inherit", width: "inherit" }}
				onEvents={onClickChart}
			/>
			<VizBlockContextMenu
				id={id}
				frame={frame}
				contextMenu={contextMenu}
				onClose={() => setContextMenu(null)}
			/>
		</div>
	);
});
