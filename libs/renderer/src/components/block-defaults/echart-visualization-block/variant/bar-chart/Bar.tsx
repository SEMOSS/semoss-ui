import { useCallback, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import EChartsReact from "echarts-for-react";
import { EChartsOption } from "echarts";

import { styled } from "@semoss/ui";

import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";

import { ChartContextMenu } from "./ChartContextMenu";
import { updateColorData } from "../shared/chart-utility";

//Main Container for displaying Bar chart
const StyledMainContainer = styled("div")(({ theme }) => ({
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
//echart field structure
export interface EChartColumns {
    name: string;
    selector: string;
    width: string;
}
//bar component properties
interface BarProps {
    id: string;
    updateJson: (data: any, path: any) => void;
}

export const Bar = observer(({ id, updateJson }: BarProps) => {
    const { data } = useBlock<EchartVisualizationBlockDef>(id);

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number; //x axis position for the click/brush event
        mouseY: number; //y axis position for the click/brush event
        value: unknown; //value can be of object or string or number type
    } | null>(null);

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

    const selector = buildDynamicQuery(Object.entries(data?.aggregate ?? {}));
    //frame object
    const frameData = useFrame(data.frame.name, {
        selector: selector,
    });
    const chartOperationData = useRef({
        brushSelected: [],
        contextMenu: null,
        yAxisColumn: { name: "", selector: "", width: undefined },
        chartInstance: { setOption: null },
    });

    const computedValue = useMemo(() => {
        return computed(() => {
            if (!data) {
                return "";
            }
            const v = getValueByPath(data, "option");
            if (typeof v === "undefined") {
                return "";
            } else if (typeof v === "string") {
                return JSON.parse(v);
            }
            return v; //JSON.stringify(v, null, 2);
        });
    }, [data, "option"]).get();

    //update frame values to the series data when frame values are changed
    const receiveValueswithCorrections = useCallback(
        (resultData) => {
            if (
                !resultData ||
                typeof resultData !== "object" ||
                resultData === null
            ) {
                return {};
            }
            const option = {
                ...resultData,
            };
            //if the frame data is not available, return the resultData as it is
            let frameDataIndex = 0;
            //setting xaxis data
            option["xAxis"]["data"] = frameData.data?.values?.map(
                (item, index) => {
                    return { value: item[frameDataIndex] };
                },
            );
            const optionSeriesLength = frameData.data.headers.length;
            frameDataIndex++;
            //setting all values to all existing series to null, to restore the chart to initial state so new values will be updated
            for (
                let seriesIdx = 0;
                seriesIdx < option["series"].length;
                seriesIdx++
            ) {
                if (
                    option["series"][seriesIdx] !== undefined &&
                    option["series"][seriesIdx].hasOwnProperty("data") &&
                    !option["series"][seriesIdx].hasOwnProperty(
                        "toggleTrendLineObject",
                    )
                ) {
                    option["series"][seriesIdx]["data"] =
                        frameData.data?.values?.map((item, index) => {
                            return {
                                value: null,
                            };
                        });
                }
            }
            //setting new values to series
            let i;
            for (i = frameDataIndex; i < optionSeriesLength; i++) {
                if (
                    option["series"][i - 1] !== undefined &&
                    option["series"][i - 1].hasOwnProperty("data") &&
                    !option["series"][i - 1].hasOwnProperty(
                        "toggleTrendLineObject",
                    )
                ) {
                    option["series"][i - 1]["data"] =
                        frameData.data?.values?.map((item) => {
                            return { value: item[i] ?? null };
                        });
                }
            }
            return { ...data.option, ...option }; //returning updated values to chart
        },
        [frameData.data.values, frameData.data.headers, data.option],
    );

    //on events object for getting and processing events with chart
    const onClickChart = {
        //when contextmenu event is raised, default context menu made hidden, and custom component is shown
        contextmenu: (params) => {
            if (params.data) {
                const xAxisName = data.option["xAxis"]["pixelvalue"][0];
                const xAxisValue =
                    typeof data.option["xAxis"]["data"][params.dataIndex] ==
                        "object" &&
                    data.option["xAxis"]["data"][
                        params.dataIndex
                    ].hasOwnProperty("value")
                        ? data.option["xAxis"]["data"][params.dataIndex][
                              "value"
                          ]
                        : data.option["xAxis"]["data"][params.dataIndex];
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  name: xAxisName,
                                  value: xAxisValue,
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
        //After brushing in bar chart, this event will be triggered to filter the selected data
        brushend: (params) => {
            const batch = params.batch;
            const xAxisName = data.option["xAxis"]["pixelvalue"][0];
            const xAxisValue = chartOperationData.current.brushSelected.map(
                (item) =>
                    typeof item === "object" && item.hasOwnProperty("value")
                        ? item["value"]
                        : item,
            );
            frameData.filter(
                `SetFrameFilter(${xAxisName}==${JSON.stringify(xAxisValue)})`,
            );
        },
        //this event will be triggered when bar data is being selected
        brushselected: (params) => {
            const batch = params.batch;
            if (batch.length) {
                const firstBatch = batch[0];
                const selectedData = firstBatch.selected;
                const firstSelectedData = selectedData[0] || [];
                const xAxisData = data.option["xAxis"]["data"].filter(
                    (item, index) =>
                        firstSelectedData.dataIndex.includes(index),
                );
                chartOperationData.current.brushSelected = xAxisData;
            }
        },
    };

    const parsedOption = useMemo(() => {
        let options: EChartsOption = computedValue;
        if (
            data.frame.name &&
            frameData.data.values.length > 0 &&
            frameData.isLoading === false
        ) {
            options = receiveValueswithCorrections(computedValue);
        }
        if (Array.isArray(options.series)) {
            options = {
                ...options,
                series: options.series.map((item) => {
                    return {
                        ...item,
                        ["itemStyle"]: {
                            ...item["itemStyle"],
                            ["color"]: (seriesData) =>
                                updateColorData(
                                    seriesData,
                                    (
                                        options.customSettings as {
                                            appliedRules?: any;
                                        }
                                    )?.appliedRules,
                                ),
                        },
                    };
                }),
            };
        }
        return { ...options };
    }, [
        computedValue,
        data.frame,
        frameData.data.values,
        frameData.isLoading,
        receiveValueswithCorrections,
    ]);

    //validating the received data.option is in string format and parse it and then assign the same to chart
    if (typeof data.option === "string") {
        try {
            const options = JSON.parse(data.option);
            return (
                <StyledMainContainer id={id}>
                    <EChartsReact option={options} />
                </StyledMainContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer>
                    There is an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        return (
            <StyledMainContainer id={id}>
                <EChartsReact
                    option={parsedOption as EChartsOption}
                    // onChartReady={echartsLoaded}
                    onEvents={onClickChart}
                    style={{
                        height: "inherit",
                        width: "inherit",
                    }}
                    notMerge={true}
                />
                <ChartContextMenu
                    id={id}
                    frame={frameData}
                    contextMenu={contextMenu}
                    chartInstance={chartOperationData.current.chartInstance}
                    onClose={() => {
                        chartOperationData.current.contextMenu = null;
                        chartOperationData.current.yAxisColumn = null;
                        chartOperationData.current.brushSelected = null;
                        setContextMenu(null);
                    }}
                />
            </StyledMainContainer>
        );
    }
});
