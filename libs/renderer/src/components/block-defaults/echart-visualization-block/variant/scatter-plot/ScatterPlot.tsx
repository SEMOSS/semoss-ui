import { useState } from "react";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import EChartsReact from "echarts-for-react";
import { CanvasRenderer } from "echarts/renderers";
import { TooltipComponent } from "echarts/components";

import { useBlockSettings, useFrame } from "../../../../../hooks";
import { BlockComponent } from "../../../../../store";
import { getSelector } from "./ScatterPlotSelector";
import { processData } from "./ScatterPlotProcessData";
import { formatdatapoints } from "./ScatterPlotTooltipData";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { EChartsOption } from "echarts";

const StyledNoDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: "100%",
    width: "100%",
    color: error ? theme.palette.error.main : "unset",
}));
export interface EChartColumns {
    name: string;
    selector: string;
    width: string;
}
export interface EchartVisualizationBlockDef {
    widget: "e-chart";
    data: {
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const ScatterPlotBlock: BlockComponent = observer(({ id }) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);

    const frame = useFrame(data?.frame?.name, {
        selector: getSelector(data),
    });
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const echartsLoaded = debounce((chart) => {
        chart.on("brushSelected", (params) => {
            let selectedData = params.batch[0].selected[0].dataIndex;
            const currentOption = chart.getOption();
            let labelData = currentOption.series[0].data;
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

    const handleSelection = debounce((value: any, name: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${name}==[${value}])`);
    }, 2000);
    const onClickChart = {
        contextmenu: (params) => {
            if (params.data) {
                let labelName = data.option["series"][0]["label"]["name"];
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
            <StyledNoDataContainer>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }
    if (typeof data.option === "string") {
        try {
            let processedFrameData = processData(frame.data, data);
            if (processedFrameData && processedFrameData.length > 0) {
                data.option["series"][0]["data"] = processedFrameData;
            }
            if (!data.option["tooltip"].hasOwnProperty("formatter")) {
                data.option["tooltip"] = {
                    ...data.option["tooltip"],
                    formatter: formatdatapoints(frame.data, data),
                };
            }
            return (
                <StyledNoDataContainer>
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
                </StyledNoDataContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (
                    data.option["_state"]["fields"].hasOwnProperty("label") &&
                    data.option["_state"]["fields"].hasOwnProperty("XAxis") &&
                    data.option["_state"]["fields"].hasOwnProperty("YAxis")
                ) {
                    let processedFrameData = processData(frame.data, data);
                    if (processedFrameData && processedFrameData.length > 0) {
                        data.option["series"][0]["data"] = processedFrameData;
                    }
                    if (frame.data.values.length > 0) {
                        if (
                            !data.option["tooltip"].hasOwnProperty(
                                "formatter",
                            ) ||
                            data.option["tooltip"]["formatter"] === ""
                        ) {
                            data.option["tooltip"] = {
                                ...data.option["tooltip"],
                                formatter: formatdatapoints(frame.data, data),
                            };
                        }
                    }
                }
            }
        }
        return (
            <StyledNoDataContainer>
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
            </StyledNoDataContainer>
        );
    }
});
