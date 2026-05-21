import type { EChartsOption } from "echarts";
import { BarChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import EChartsReact from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import type { BlockComponent } from "../../../../../store";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { processData } from "./ScatterPlotProcessData";
import { getSelector } from "./ScatterPlotSelector";
import { formatdatapoints } from "./ScatterPlotTooltipData";
export interface EChartColumns {
	name: string;
	selector: string;
	width: string;
}
export interface EchartVisualizationBlockDef {
	widget: "e-chart";
	data: {
		option: Record<string, unknown>;
		frame: {
			name: string;
		};
		variation: undefined | string;
		columns: EChartColumns[];
		// biome-ignore lint/suspicious/noExplicitAny: echart aggregate type is dynamic
		aggregate: Record<string, any>;
		contextMenu: {
			hideUnfilter: boolean;
			hideFilter: boolean;
			hideExclude: boolean;
		};
	};
	listeners: Record<string, unknown>;
	slots: never;
}

export const ScatterPlotBlock: BlockComponent = observer(({ id }) => {
	const { data } = useBlock<EchartVisualizationBlockDef>(id);

	echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);

	const frame = useFrame(data?.frame?.name, {
		selector: getSelector(data, data?.aggregate),
	});
	function debounce(fn, delay) {
		// biome-ignore lint/suspicious/noImplicitAnyLet: debounce timer type inferred from setTimeout
		let timer;
		return (...args) => {
			clearTimeout(timer);
			timer = setTimeout(() => fn(...args), delay);
		};
	}
	const echartsLoaded = debounce((chart) => {
		chart.on("brushSelected", (params) => {
			const selectedData = params.batch[0].selected[0].dataIndex;
			const currentOption = chart.getOption();
			const labelData = currentOption.series[0].data;
			const filteredLabels = selectedData.map(
				(index) => labelData[index].label.formatter,
			);
			if (filteredLabels.length > 0) {
				handleSelection(
					filteredLabels,
					currentOption.series[0].label.name,
				);
			}
		});
	}, 2000);

	// biome-ignore lint/suspicious/noExplicitAny: echart handleSelection value/name types are untyped
	const handleSelection = debounce((value: any, name: any) => {
		// update the frame
		frame.filter(`SetFrameFilter(${name}==[${value}])`);
	}, 2000);
	const onClickChart = {
		contextmenu: (params) => {
			if (params.data) {
				const labelName = data.option.series[0].label.name;
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
	if (typeof data.option === "string") {
		try {
			const processedFrameData = processData(frame.data, data);
			if (processedFrameData && processedFrameData.length > 0) {
				data.option.series[0].data = processedFrameData;
			}
			if (!Object.hasOwn(data.option.tooltip, "formatter")) {
				data.option.tooltip = {
					...data.option.tooltip,
					formatter: formatdatapoints(frame.data, data),
				};
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
		} catch (_e) {
			return (
				<div className="h-full w-full text-destructive">
					There was an issue parsing your JSON.
				</div>
			);
		}
	} else {
		if (Object.hasOwn(data.option, "_state")) {
			if (Object.hasOwn(data.option._state, "fields")) {
				if (
					Object.hasOwn(data.option._state.fields, "label") &&
					Object.hasOwn(data.option._state.fields, "XAxis") &&
					Object.hasOwn(data.option._state.fields, "YAxis")
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
							data.option.tooltip = {
								...data.option.tooltip,
								formatter: formatdatapoints(frame.data, data),
							};
						}
					}
				}
			}
		}
		return (
			<div className="h-full w-full">
				<EChartsReact
					option={data.option as EChartsOption}
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
	}
});
