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
			padding: string | undefined;
			gap: string | undefined;
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
	<D extends BlockDef = BlockDef>({ id }: { id: string }) => {
		const { data, setData, attrs, listeners } =
			useBlock<EchartVisualizationBlockDef>(id);

		const elementRef = useRef<HTMLDivElement>(null);
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
		useEffect(() => {
			if (listeners.preProcess) {
				listeners.preProcess();
			}
		}, []);

		// biome-ignore lint/correctness/noUnusedFunctionParameters: path required for type safety
		//biome-ignore lint/suspicious/noExplicitAny: data and path's value can't be predicted
		function updateChartJson(nextOption: any, path: any) {
			const parsedData =
				typeof nextOption === "string"
					? JSON.parse(nextOption)
					: nextOption;
			const currentOption =
				typeof data.option === "string"
					? (() => {
							try {
								return JSON.parse(data.option);
							} catch {
								return data.option;
							}
						})()
					: data.option;
			if (JSON.stringify(parsedData) === JSON.stringify(currentOption)) {
				return;
			}
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						"option",
						parsedData as PathValue<D["data"], typeof path>,
						true,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		const updatedDataStyle = useMemo(() => {
			const isEm =
				data.style.height.toString().endsWith("em") &&
				data.style.width.toString().endsWith("em");
			const isPx =
				data.style.height.toString().endsWith("px") &&
				data.style.width.toString().endsWith("px");
			if (isEm || isPx) return { ...data.style };
			return {
				...data.style,
				height: data.style.height,
				width: data.style.width,
			};
		}, [data.style]);

		const renderVariant = () => (
			<>
				{data.variation === "echart-bar-graph" && (
					<Bar id={id} updateJson={updateChartJson} />
				)}
				{data.variation === "echart-pie-chart" && (
					<Pie id={id} updateJson={updateChartJson} />
				)}
				{data.variation === "echart-scatter-plots" && (
					<ScatterPlotBlock id={id} />
				)}
				{data.variation === "echart-world-map-chart" && (
					<MapChart id={id} />
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
			</>
		);

		if (!data.option) {
			return (
				<div
					{...attrs}
					className="max-h-[80%] min-h-[50%] min-w-[50%] max-w-[80%]"
				>
					Add JSON to render your visualization
				</div>
			);
		}

		if (typeof data.option === "string") {
			try {
				return (
					<div
						{...attrs}
						style={{ ...updatedDataStyle }}
						ref={elementRef}
						className="max-h-[80%] min-h-[50%] min-w-[50%] max-w-[80%]"
					>
						{renderVariant()}
					</div>
				);
			} catch {
				return (
					<div
						{...attrs}
						className="max-h-[80%] min-h-[50%] min-w-[50%] max-w-[80%] text-destructive"
					>
						There was an issue parsing your JSON.
					</div>
				);
			}
		}

		return (
			<div
				{...attrs}
				style={{ ...updatedDataStyle }}
				className="min-h-[350px] min-w-[50%]"
			>
				{renderVariant()}
			</div>
		);
	},
);
