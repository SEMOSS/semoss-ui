import { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import EChartsReact, { EChartsOption } from "echarts-for-react";
import { CanvasRenderer } from "echarts/renderers";
import { TooltipComponent } from "echarts/components";
import { useBlockSettings, useFrame } from "../../../../../hooks";
import { BlockComponent } from "../../../../../store";
import { ChartContextMenu } from "../bar-chart/ChartContextMenu";

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

export const StackChart: BlockComponent = observer(({ id }) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);

    const chartOperationData = useRef({
        brushSelected: [],
        contextMenu: null,
        yAxisColumn: { name: "", selector: "", width: undefined },
        chartInstance: { setOption: null },
    });
    let fields = "",
        xAxis = "",
        yAxis = "",
        category = "",
        tooltip = "";
    if (data.option.hasOwnProperty("_state")) {
        fields = data.option["_state"]["fields"];
        xAxis = fields["XAxis"];
        yAxis = fields["YAxis"];
        category = fields["category"];
        tooltip = fields["tooltip"];
    }
    /**
     * Function to get the type of selector to be used for the stack chart
     * @returns An object with the selectors for xAxis, yAxis, size and tooltip
     */
    const getSelectors = (): {
        xAxis: string;
        yAxis: string;
        size: string;
        tooltip: string;
    } => {
        return {
            xAxis: getSelectorType("XAxisDataType"),
            yAxis: getSelectorType("YAxisDataType"),
            size: getSelectorType("categoryDataType"),
            tooltip: getSelectorType("tooltipDataType"),
        };
    };
    // getSelectorType function to get the type of selector to be used for the stack chart
    const getSelectorType = (type) => {
        return fields[type] === "NUMBER" ? "Average" : "Count";
    };
    const selectors = getSelectors();
    //selector fuction which will return the pixel expression to send payload to the server
    const selector = (data) => {
        if (data.hasOwnProperty("columns")) {
            if (data.option.hasOwnProperty("_state")) {
                if (data.option["_state"].hasOwnProperty("fields")) {
                    if (
                        fields.hasOwnProperty("XAxis") &&
                        fields.hasOwnProperty("YAxis") &&
                        fields.hasOwnProperty("category") &&
                        fields.hasOwnProperty("tooltip")
                    ) {
                        if (xAxis == category && yAxis == tooltip) {
                            return `Select(${xAxis},${selectors.yAxis}(${yAxis})).as([${xAxis},Average_of_${yAxis}])|Group(${xAxis})`;
                        }
                        if (xAxis == category) {
                            return `Select(${xAxis},${selectors.yAxis}(${yAxis}),${selectors.tooltip}(${tooltip})).as([${xAxis},Average_of_${yAxis},Average_of_${tooltip}])|Group(${xAxis})`;
                        }
                        if (yAxis == tooltip) {
                            return `Select(${xAxis},${selectors.yAxis}(${yAxis}),${category}).as([${xAxis},Average_of_${yAxis},${category}])|Group(${xAxis},${category})`;
                        }
                        return `Select(${xAxis},${selectors.yAxis}(${yAxis}),${category},${selectors.tooltip}(${tooltip})).as([${xAxis},Average_of_${yAxis},${category},Average_of_${tooltip}])|Group(${xAxis},${category})`;
                    }
                    if (
                        fields.hasOwnProperty("XAxis") &&
                        fields.hasOwnProperty("YAxis") &&
                        fields.hasOwnProperty("category")
                    ) {
                        if (xAxis == category) {
                            return `Select(${xAxis},${selectors.yAxis}(${yAxis})).as([${xAxis},Average_of_${yAxis}])|Group(${xAxis})`;
                        }
                        return `Select(${xAxis},${selectors.yAxis}(${yAxis}),${category}).as([${xAxis},Average_of_${yAxis},${category}])|Group(${xAxis},${category})`;
                    }
                }
            }
        }
    };
    // useFrame hook to get the frame data
    const frame = useFrame(data?.frame?.name, {
        selector: selector(data),
    });
    //  Function to add only new values and avoid duplicates
    const updateSelectedIndexes = (selectedIndexes, newIndexes) => {
        newIndexes.forEach((index) => {
            if (!selectedIndexes.includes(index)) {
                selectedIndexes.push(index); // Add only if it's not already present
            }
        });
        return selectedIndexes;
    };
    //Brushing of data points
    const echartsLoaded = (chart) => {
        chart.on("brushSelected", (params) => {
            let selectedDataIndexes = [];

            params.batch.forEach((batch) => {
                batch.selected.forEach((selection) => {
                    //  Extract exact dataIndex for each series
                    if (selection.dataIndex && selection.dataIndex.length > 0) {
                        selectedDataIndexes = updateSelectedIndexes(
                            selectedDataIndexes,
                            selection.dataIndex,
                        );
                    }
                });
            });
            if (selectedDataIndexes.length > 0) {
                const currentOption = chart.getOption();
                const xAxisData =
                    data.option["flipAxis"] === true
                        ? currentOption.yAxis[0].data
                        : currentOption.xAxis[0].data;
                const filteredXaxis = [...selectedDataIndexes]
                    .filter((index) => {
                        return data.option["series"].some((series) => {
                            const yValue = series.data[index]?.value;
                            return (
                                yValue !== null &&
                                yValue !== 0 &&
                                yValue !== undefined &&
                                yValue !== "NaN" &&
                                yValue !== ""
                            );
                        });
                    })
                    .map((index) => xAxisData[index]);
                handleSelection(
                    filteredXaxis,
                    currentOption["_state"]["fields"]["XAxis"],
                );
            }
        });
    };
    //Brushed Data points selection and pixel expression of brushed data points to send to the server
    const handleSelection = (value: any, name: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${name}==[${JSON.stringify(value)}])`);
    };

    //  Context menu to show on right click
    const onClickChart = {
        contextmenu: (params) => {
            if (params.data) {
                const XAxisName = xAxis;
                const selectedData = params.dataIndex;
                const filteredXaxis =
                    data.option["flipAxis"] === true
                        ? data.option["yAxis"]["data"][selectedData]
                        : data.option["xAxis"]["data"][selectedData];
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  name: XAxisName,
                                  value: filteredXaxis,
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
    //  Process the API data to render the Stack Chart
    const processData = (apiData, data) => {
        const xAxisData = [];
        const groupedData = {};
        let maxStackSize = 0;
        const uniqueCategories = [];
        //Reset data before updating
        data.option.series = [];
        data.option.xAxis.data = [];

        if (apiData["values"]) {
            if (data.option.hasOwnProperty("_state")) {
                if (
                    fields.hasOwnProperty("XAxis") &&
                    fields.hasOwnProperty("YAxis") &&
                    fields.hasOwnProperty("category") &&
                    fields.hasOwnProperty("tooltip")
                ) {
                    if (xAxis == category && yAxis == tooltip) {
                        apiData.values.forEach(([x, y]) => {
                            if (!groupedData[x]) {
                                groupedData[x] = [];
                                xAxisData.push(x);
                            }
                            groupedData[x].push({ y, category: x, tooltip: y });
                            //  Store unique categories for legend
                            if (x && !uniqueCategories.includes(x)) {
                                uniqueCategories.push(x);
                            }
                            //  Calculate max stack size (Max number of bars stacked at any x value)
                            maxStackSize = Math.max(
                                ...Object.values(groupedData).map(
                                    (arr: any) => arr.length,
                                ),
                            );
                        });
                        const colorList = data.option["color"];
                        const colorCount = colorList.length;

                        //  Assign colors to categories
                        const categoryColorMap = {};
                        uniqueCategories.forEach((category, index) => {
                            categoryColorMap[category] =
                                colorList[index % colorCount]; //  Cycle colors
                        });
                        //  Ensure we only create the exact number of stacks needed
                        const series = uniqueCategories.map(
                            (category, index) => ({
                                type: "bar",
                                stack: "stack",
                                name: category.toString(), //  Legend name
                                data: xAxisData.map((x) => {
                                    const point =
                                        groupedData[x].find(
                                            (item) =>
                                                item.category === category,
                                        ) || {};
                                    return {
                                        value:
                                            isNaN(point.y) ||
                                            point.y === undefined
                                                ? point.y
                                                : parseFloat(point.y)
                                                      .toFixed(2)
                                                      .replace(/\.00$/, ""),
                                        category: point.category ?? "",
                                        itemStyle: {
                                            color: categoryColorMap[category],
                                        }, //  Assign correct color
                                        tooltipValue: point.tooltip ?? "", //  Store tooltip inside each data point
                                    };
                                }),
                            }),
                        );
                        const legendData = uniqueCategories.map(String);
                        return { xAxisData, series, maxStackSize, legendData };
                    }
                    if (xAxis == category) {
                        apiData.values.forEach(([x, y, tooltip]) => {
                            if (!groupedData[x]) {
                                groupedData[x] = [];
                                xAxisData.push(x);
                            }
                            groupedData[x].push({ y, category: x, tooltip });

                            //  Store unique categories for legend
                            if (x && !uniqueCategories.includes(x)) {
                                uniqueCategories.push(x);
                            }

                            //  Calculate max stack size (Max number of bars stacked at any x value)
                            maxStackSize = Math.max(
                                ...Object.values(groupedData).map(
                                    (arr: any) => arr.length,
                                ),
                            );
                        });

                        const colorList = data.option["color"];
                        const colorCount = colorList.length;

                        //  Assign colors to categories
                        const categoryColorMap = {};
                        uniqueCategories.forEach((category, index) => {
                            categoryColorMap[category] =
                                colorList[index % colorCount]; //  Cycle colors
                        });
                        //  Ensure we only create the exact number of stacks needed
                        const series = uniqueCategories.map(
                            (category, index) => ({
                                type: "bar",
                                stack: "stack",
                                name: category.toString(), //  Legend name
                                data: xAxisData.map((x) => {
                                    const point =
                                        groupedData[x].find(
                                            (item) =>
                                                item.category === category,
                                        ) || {};
                                    return {
                                        value:
                                            isNaN(point.y) ||
                                            point.y === undefined
                                                ? point.y
                                                : parseFloat(point.y)
                                                      .toFixed(2)
                                                      .replace(/\.00$/, ""),
                                        category: point.category ?? "",
                                        itemStyle: {
                                            color: categoryColorMap[category],
                                        }, //  Assign correct color
                                        tooltipValue: point.tooltip ?? "", //  Store tooltip inside each data point
                                    };
                                }),
                            }),
                        );
                        const legendData = uniqueCategories.map(String);
                        return { xAxisData, series, maxStackSize, legendData };
                    }
                    if (yAxis == tooltip) {
                        apiData.values.forEach(([x, y, category]) => {
                            if (!groupedData[x]) {
                                groupedData[x] = [];
                                xAxisData.push(x);
                            }
                            groupedData[x].push({ y, category, tooltip: y });
                            //  Store unique categories for legend
                            if (
                                category &&
                                !uniqueCategories.includes(category)
                            ) {
                                uniqueCategories.push(category);
                            }
                            //  Calculate max stack size (Max number of bars stacked at any x value)
                            maxStackSize = Math.max(
                                ...Object.values(groupedData).map(
                                    (arr: any) => arr.length,
                                ),
                            );
                        });
                        const colorList = data.option["color"];
                        const colorCount = colorList.length;

                        //  Assign colors to categories
                        const categoryColorMap = {};
                        uniqueCategories.forEach((category, index) => {
                            categoryColorMap[category] =
                                colorList[index % colorCount]; //  Cycle colors
                        });
                        //  Ensure we only create the exact number of stacks needed
                        const series = uniqueCategories.map(
                            (category, index) => ({
                                type: "bar",
                                stack: "stack",
                                name: category.toString(), //  Legend name
                                data: xAxisData.map((x) => {
                                    const point =
                                        groupedData[x].find(
                                            (item) =>
                                                item.category === category,
                                        ) || {};
                                    return {
                                        value:
                                            isNaN(point.y) ||
                                            point.y === undefined
                                                ? point.y
                                                : parseFloat(point.y)
                                                      .toFixed(2)
                                                      .replace(/\.00$/, ""),
                                        category: point.category ?? "",
                                        itemStyle: {
                                            color: categoryColorMap[category],
                                        }, //  Assign correct color
                                        tooltipValue: point.tooltip ?? "", //  Store tooltip inside each data point
                                    };
                                }),
                            }),
                        );
                        const legendData = uniqueCategories.map(String);
                        return { xAxisData, series, maxStackSize, legendData };
                    }
                    apiData.values.forEach(([x, y, category, tooltip]) => {
                        if (!groupedData[x]) {
                            groupedData[x] = [];
                            xAxisData.push(x);
                        }
                        groupedData[x].push({ y, category, tooltip });
                        //  Store unique categories for legend
                        if (category && !uniqueCategories.includes(category)) {
                            uniqueCategories.push(category);
                        }
                        //  Calculate max stack size (Max number of bars stacked at any x value)
                        maxStackSize = Math.max(
                            ...Object.values(groupedData).map(
                                (arr: any) => arr.length,
                            ),
                        );
                    });

                    const colorList = data.option["color"];
                    const colorCount = colorList.length;

                    //  Assign colors to categories
                    const categoryColorMap = {};
                    uniqueCategories.forEach((category, index) => {
                        categoryColorMap[category] =
                            colorList[index % colorCount]; //  Cycle colors
                    });
                    //  Ensure we only create the exact number of stacks needed
                    const series = uniqueCategories.map((category, index) => ({
                        type: "bar",
                        stack: "stack",
                        name: category.toString(), //  Legend name
                        data: xAxisData.map((x) => {
                            const point =
                                groupedData[x].find(
                                    (item) => item.category === category,
                                ) || {};
                            return {
                                value:
                                    isNaN(point.y) || point.y === undefined
                                        ? point.y
                                        : parseFloat(point.y)
                                              .toFixed(2)
                                              .replace(/\.00$/, ""),
                                category: point.category ?? "",
                                itemStyle: {
                                    color: categoryColorMap[category],
                                }, //  Assign correct color
                                tooltipValue: point.tooltip ?? "", //  Store tooltip inside each data point
                            };
                        }),
                    }));
                    const legendData = uniqueCategories.map(String);
                    return { xAxisData, series, maxStackSize, legendData };
                }
                if (
                    fields.hasOwnProperty("XAxis") &&
                    fields.hasOwnProperty("YAxis") &&
                    fields.hasOwnProperty("category")
                ) {
                    if (xAxis == category) {
                        apiData.values.forEach(([x, y]) => {
                            if (!groupedData[x]) {
                                groupedData[x] = [];
                                xAxisData.push(x);
                            }
                            groupedData[x].push({ y, category: x });

                            //  Store unique categories for legend
                            if (x && !uniqueCategories.includes(x)) {
                                uniqueCategories.push(x);
                            }

                            //  Calculate max stack size (Max number of bars stacked at any x value)
                            maxStackSize = Math.max(
                                ...Object.values(groupedData).map(
                                    (arr: any) => arr.length,
                                ),
                            );
                        });
                        const colorList = data.option["color"];
                        const colorCount = colorList.length;

                        //  Assign colors to categories
                        const categoryColorMap = {};
                        uniqueCategories.forEach((category, index) => {
                            categoryColorMap[category] =
                                colorList[index % colorCount]; //  Cycle colors
                        });
                        //  Ensure we only create the exact number of stacks needed
                        const series = uniqueCategories.map(
                            (category, index) => ({
                                type: "bar",
                                stack: "stack",
                                name: category.toString(), //  Legend name
                                data: xAxisData.map((x) => {
                                    const point =
                                        groupedData[x].find(
                                            (item) =>
                                                item.category === category,
                                        ) || {};
                                    return {
                                        value:
                                            isNaN(point.y) ||
                                            point.y === undefined
                                                ? point.y
                                                : parseFloat(point.y)
                                                      .toFixed(2)
                                                      .replace(/\.00$/, ""),
                                        category: point.category ?? "",
                                        itemStyle: {
                                            color: categoryColorMap[category],
                                        }, //  Assign correct color
                                    };
                                }),
                            }),
                        );
                        const legendData = uniqueCategories.map(String);
                        return { xAxisData, series, maxStackSize, legendData };
                    }
                    //  Process the API data
                    apiData.values.forEach(([x, y, category]) => {
                        if (!groupedData[x]) {
                            groupedData[x] = [];
                            xAxisData.push(x);
                        }
                        groupedData[x].push({ y, category });

                        //  Store unique categories for legend
                        if (category && !uniqueCategories.includes(category)) {
                            uniqueCategories.push(category);
                        }

                        //  Calculate max stack size (Max number of bars stacked at any x value)
                        maxStackSize = Math.max(
                            ...Object.values(groupedData).map(
                                (arr: any) => arr.length,
                            ),
                        );
                    });

                    const colorList = data.option["color"];
                    const colorCount = colorList.length;

                    //  Assign colors to categories
                    const categoryColorMap = {};
                    uniqueCategories.forEach((category, index) => {
                        categoryColorMap[category] =
                            colorList[index % colorCount]; //  Cycle colors
                    });
                    //  Ensure we only create the exact number of stacks needed
                    const series = uniqueCategories.map((category, index) => ({
                        type: "bar",
                        stack: "stack",
                        name: category.toString(), //  Legend name
                        data: xAxisData.map((x) => {
                            const point =
                                groupedData[x].find(
                                    (item) => item.category === category,
                                ) || {};
                            return {
                                value:
                                    isNaN(point.y) || point.y === undefined
                                        ? point.y
                                        : parseFloat(point.y)
                                              .toFixed(2)
                                              .replace(/\.00$/, ""),
                                category: point.category ?? "",
                                itemStyle: {
                                    color: categoryColorMap[category],
                                }, //  Assign correct color
                            };
                        }),
                    }));
                    const legendData = uniqueCategories.map(String);
                    return { xAxisData, series, maxStackSize, legendData };
                }
            }
        }
        return { xAxisData: [], series: [], maxStackSize: 0, legendData: [] };
    };
    // this function is used to show the data in tooltip
    const formatdatapoints = (apiData, data, maxStackSize) => {
        if (apiData["values"]) {
            if (data.option.hasOwnProperty("_state")) {
                if (data.option["_state"].hasOwnProperty("fields")) {
                    if (
                        fields.hasOwnProperty("XAxis") &&
                        fields.hasOwnProperty("YAxis") &&
                        fields.hasOwnProperty("category") &&
                        fields.hasOwnProperty("tooltip")
                    ) {
                        return function (params) {
                            let tooltipText = `${params[0].axisValue} <br/>`;
                            const tooltipValues = [];
                            let totalTooltipValue = 0;
                            const tooltipPrefix =
                                data.option["_state"]["fields"][
                                    "tooltipDataType"
                                ] === "NUMBER"
                                    ? "Average of"
                                    : "Count of";
                            params.forEach((param) => {
                                const tooltipValue = param.data.tooltipValue;
                                if (param.data.category !== "") {
                                    tooltipText += `${param.marker} ${param.data.category}: ${param.value} <br/>`;
                                }
                                if (
                                    tooltipValue !== "" &&
                                    tooltipValue !== "NaN" &&
                                    tooltipValue !== undefined
                                ) {
                                    tooltipValues.push(Number(tooltipValue));
                                    totalTooltipValue +=
                                        parseFloat(tooltipValue);
                                }
                            });
                            if (maxStackSize > 0) {
                                const average =
                                    totalTooltipValue / maxStackSize;
                                tooltipText += `${tooltipPrefix} ${tooltip}: ${average} <br/>`;
                            }
                            return tooltipText.trim();
                        };
                    }
                    if (
                        fields.hasOwnProperty("XAxis") &&
                        fields.hasOwnProperty("YAxis") &&
                        fields.hasOwnProperty("category")
                    ) {
                        return function (params) {
                            let tooltipText = `${params[0].axisValue} <br/>`;
                            params.forEach((param) => {
                                if (param.data.category !== "") {
                                    tooltipText += `${param.marker} ${param.data.category}: ${param.value} <br/>`;
                                }
                            });
                            return tooltipText.trim();
                        };
                    }
                }
            }
        }
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
            return (
                <StyledNoDataContainer>
                    <EChartsReact
                        option={data.option as unknown as EChartsOption}
                        style={{ height: "inherit", width: "inherit" }}
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
        data.option["series"] = [];
        data.option["xAxis"]["data"] = [];
        data.option["yAxis"]["data"] = [];
        const processedFrameData = processData(frame.data, data);
        if (
            processedFrameData &&
            processedFrameData.hasOwnProperty("xAxisData") &&
            processedFrameData.hasOwnProperty("series")
        ) {
            data.option["series"] = processedFrameData.series;
            data.option["legend"]["data"] = processedFrameData.legendData;
            if (data.option["flipAxis"] === true) {
                data.option["xAxis"]["data"] = [];
                data.option["yAxis"]["data"] = processedFrameData["xAxisData"];
            } else {
                data.option["yAxis"]["data"] = [];
                data.option["xAxis"]["data"] = processedFrameData["xAxisData"];
            }
        }
        if (frame.data.values.length > 0) {
            if (
                !data.option["tooltip"].hasOwnProperty("formatter") ||
                data.option["tooltip"]["formatter"] === ""
            ) {
                data.option["tooltip"] = {
                    ...data.option["tooltip"],
                    formatter: formatdatapoints(
                        frame.data,
                        data,
                        processedFrameData.maxStackSize,
                    ),
                };
            }
        }
        return (
            <StyledNoDataContainer>
                <EChartsReact
                    option={data.option as EChartsOption}
                    style={{ height: "inherit", width: "inherit" }}
                    onChartReady={(chart) => {
                        echartsLoaded(chart);
                    }}
                    onEvents={onClickChart}
                />
                <ChartContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    chartInstance={chartOperationData.current.chartInstance}
                    onClose={() => {
                        chartOperationData.current.contextMenu = null;
                        chartOperationData.current.yAxisColumn = null;
                        chartOperationData.current.brushSelected = null;
                        setContextMenu(null);
                    }}
                />
            </StyledNoDataContainer>
        );
    }
});
