import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";

import { Bar } from "./variant/bar-chart/Bar";
import { Pie } from "./variant/pie-chart/Pie";
import { BAR_CHART_DATA } from "./Visualization.constants";
import { ScatterPlotBlock } from "./variant/scatter-plot/ScatterPlot";
import { useBlock, useBlocks, useBlockSettings } from "../../../hooks";
import { BlockComponent, BlockDef } from "../../../store";
import { PathValue } from "../../../types";
import { Map } from "./variant/map-chart/Map";
import { Line } from "./variant/line-chart/Line";
import { StackChart } from "./variant/stack-chart/StackChart";
import { Gantt } from "./variant/Gantt/Gantt";

const StyledNoDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    minHeight: "50%",
    minWidth: "50%",
    maxWidth: "80%",
    maxHeight: "80%",
    color: error ? theme.palette.error.main : "unset",
}));

const StyledDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    minHeight: "50%",
    minWidth: "50%",
}));

export interface VisualizationColumns {
    name: string;
    selector: string;
    width: string;
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
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: VisualizationColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
        show: boolean;
    };
    listeners: {};
    slots: never;
}

export const VisualizationBlock: BlockComponent = observer(
    <D extends BlockDef = BlockDef>({ id }) => {
        const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);
        const { setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
        const { state } = useBlocks();

        const elementRef = useRef<HTMLDivElement>(null);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        /**
         *
         * @param data
         * @param path
         * @description update chart json when data is changed
         */
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
                            <Map id={id}></Map>
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
                    </StyledNoDataContainer>
                );
            } catch (e) {
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
                    <Map id={id}></Map>
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
            </StyledDataContainer>
        );
    },
);
