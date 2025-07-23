import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import EChartsReact from "echarts-for-react";
import { CanvasRenderer } from "echarts/renderers";
import { TooltipComponent } from "echarts/components";
import { EChartsOption } from "echarts";

import { styled } from "@semoss/ui";

import { useFrame, useBlock } from "../../../../../hooks";
import { BlockComponent } from "../../../../../store";

import { getSelector } from "./ScatterPlotSelector";
import { processData } from "./ScatterPlotProcessData";
import { formatdatapoints } from "./ScatterPlotTooltipData";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { updateColorData } from "../shared/chart-utility";

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
        option: {
            series: any[];
            customSettings?: any;
            tooltip: any;
        };
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
        aggregate: Record<string, any>;
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
    const { data, setData } = useBlock<EchartVisualizationBlockDef>(id);

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
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    useEffect(() => {
        if (frame.data?.values?.length > 0) {
            const processedFrameData = processData(frame.data, data);
            const headers = frame.data.headers;
            setData("option", {
                ...data.option,
                series: [
                    {
                        ...data.option["series"][0],
                        itemStyle: {
                            // ...item?.itemStyle,
                            color: (seriesData) =>
                                updateColorData(
                                    seriesData,
                                    data.option?.customSettings?.appliedRules,
                                ),
                        },
                        data: processedFrameData.map((item: any) => {
                            return {
                                [headers[0]]: item.label.formatter,
                                [headers[1]]: item.value[0],
                                [headers[2]]: item.value[1],
                                ...item,
                            };
                        }),
                    },
                ],
                tooltip: {
                    ...data.option.tooltip,
                    formatter: formatdatapoints(frame.data, data),
                },
            });
        }
    }, [
        frame.data.values,
        frame.data.headers,
        data.option.customSettings?.appliedRules,
    ]);

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

    const handleSelection = debounce((value: any, name: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${name}==[${value}])`);
    }, 2000);
    const onClickChart = {
        contextmenu: (params) => {
            if (params.data) {
                const labelName = data.option["series"][0]["label"]["name"];
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
});
