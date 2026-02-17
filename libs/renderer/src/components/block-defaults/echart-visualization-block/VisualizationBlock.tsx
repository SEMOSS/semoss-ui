import { styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import type { PathValue } from "../../../types";
import { Bar } from "./variant/bar-chart/Bar";
import { Dendrogram } from "./variant/dendrogram/Dendrogram";
import { Gantt } from "./variant/Gantt/Gantt";
import { Line } from "./variant/line-chart/Line";
import { Map as MapChart } from "./variant/map-chart/Map";
import { Pie } from "./variant/pie-chart/Pie";
import { ScatterPlotBlock } from "./variant/scatter-plot/ScatterPlot";
import { StackChart } from "./variant/stack-chart/StackChart";
import { Cloud } from "./variant/word-cloud/Cloud";

const StyledNoDataContainer = styled("div", {
	shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
	minHeight: "50%",
	minWidth: "50%",
	maxWidth: "80%",
	maxHeight: "80%",
	color: error ? theme.palette.error.main : "unset",
}));

const StyledDataContainer = styled("div")(() => ({
	minWidth: "50%",
	minHeight: "350px",
}));

export interface VisualizationColumns {
	name: string;
	selector: string;
	width: string;
}

export interface FacetColumns {
	name: string;
	selector: string;
	value: string | number;
	isFacet?: boolean;
}
export interface EchartVisualizationBlockDef {
	widget: "e-chart";
	data: {
		style: {
			height: number;
			width: number;
			display: string | undefined;
			// flexDirection: string | undefined;
			padding: string | undefined;
			gap: string | undefined;
			// flexWrap: string | undefined;
		};
		//biome-ignore lint/suspicious/noExplicitAny: options's value can't be predicted
		option: Record<string, any>;
		frame: {
			name: string;
		};
		variation: undefined | string;
		columns: VisualizationColumns[];
		//biome-ignore lint/suspicious/noExplicitAny: aggregate's value can't be predicted
		aggregate: Record<string, any>;
		contextMenu: {
			hideUnfilter: boolean;
			hideFilter: boolean;
			hideExclude: boolean;
		};
		show: boolean;
		facet: {
			facetList: string[] | number[];
			facetSelected: FacetColumns[];
		};
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
	slots: never;
}

export const VisualizationBlock: BlockComponent = observer(
	<D extends BlockDef = BlockDef>({ id }) => {
		const { data, setData, attrs, listeners } =
			useBlock<EchartVisualizationBlockDef>(id);

		const elementRef = useRef<HTMLDivElement>(null);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		useEffect(() => {
			if (listeners.preProcess) {
				listeners.preProcess();
			}
		}, []);
		/**
		 *
		 * @param data
		 * @param path
		 * @description update chart json when data is changed
		 */
		// biome-ignore lint/correctness/noUnusedFunctionParameters: though path is used for type safety, it is required to be passed as parameter
		//biome-ignore lint/suspicious/noExplicitAny: data and path's value can't be predicted as it is from many different sources
		function updateChartJson(data: any, path: any) {
			const parsedData =
				typeof data === "string" ? JSON.parse(data) : data;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						"option",
						parsedData as PathValue<D["data"], typeof path>,
						true
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		/**
		 * @description get the updated data style when data.style is changed
		 */
		const updatedDataStyle = useMemo(() => {
			const isEm =
				data.style.height.toString().endsWith("em") &&
				data.style.width.toString().endsWith("em");
			const isPx =
				data.style.height.toString().endsWith("px") &&
				data.style.width.toString().endsWith("px");
			if (isEm || isPx) return { ...data.style }; //if values mentioned in em or px, then return same style
			const calculatedHeight = data.style.height;
			const calculatedWidth = data.style.width;
			//return updated style
			return {
				...data.style,
				height: calculatedHeight,
				width: calculatedWidth,
			};
		}, [data.style]);

		if (!data.option) {
			return (
				<StyledNoDataContainer {...attrs}>
					Add JSON to render your visualization
				</StyledNoDataContainer>
			);
		}

		if (typeof data.option === "string") {
			try {
				return (
					<StyledNoDataContainer
						{...attrs}
						style={{ ...updatedDataStyle }}
						ref={elementRef}
					>
						{data.variation === "echart-bar-graph" && (
							<Bar id={id} updateJson={updateChartJson} />
						)}
						{data.variation === "echart-pie-chart" && (
							<Pie id={id} updateJson={updateChartJson}></Pie>
						)}
						{data.variation === "echart-scatter-plots" && (
							<ScatterPlotBlock id={id} />
						)}
						{data.variation === "echart-world-map-chart" && (
							<MapChart id={id}></MapChart>
						)}
						{data.variation === "echart-line-graph" && (
							<Line id={id} updateJson={updateChartJson} />
						)}
						{data.variation === "echart-stack-chart" && (
							<StackChart id={id} />
						)}
						{data.variation === "echart-gantt-chart" && (
							<Gantt id={id} updateChart={updateChartJson} />
						)}
						{data.variation === "echart-dendrogram-chart" && (
							<Dendrogram id={id} updateJson={updateChartJson} />
						)}
						{data.variation === "echart-word-cloud" && (
							<Cloud id={id} updateJson={updateChartJson} />
						)}
					</StyledNoDataContainer>
				);
			} catch {
				return (
					<StyledNoDataContainer error {...attrs}>
						There was an issue parsing your JSON.
					</StyledNoDataContainer>
				);
			}
		}
		return (
			<StyledDataContainer {...attrs} style={{ ...updatedDataStyle }}>
				{data.variation === "echart-bar-graph" && (
					<Bar id={id} updateJson={updateChartJson} />
				)}
				{data.variation === "echart-pie-chart" && (
					<Pie id={id} updateJson={updateChartJson}></Pie>
				)}
				{data.variation === "echart-scatter-plots" && (
					<ScatterPlotBlock id={id} />
				)}
				{data.variation === "echart-world-map-chart" && (
					<MapChart id={id}></MapChart>
				)}
				{data.variation === "echart-line-graph" && (
					<Line id={id} updateJson={updateChartJson} />
				)}
				{data.variation === "echart-stack-chart" && (
					<StackChart id={id} />
				)}
				{data.variation === "echart-gantt-chart" && (
					<Gantt id={id} updateChart={updateChartJson} />
				)}
				{data.variation === "echart-dendrogram-chart" && (
					<Dendrogram id={id} updateJson={updateChartJson} />
				)}
				{data.variation === "echart-word-cloud" && (
					<Cloud id={id} updateJson={updateChartJson} />
				)}
			</StyledDataContainer>
		);
	},
);
