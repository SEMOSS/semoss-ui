import { useCallback, useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import ReactECharts, { EChartsOption } from "echarts-for-react";

import { useFrame, useBlocks, useBlockSettings } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { CustomContextMenu } from "./CustomContextMenu";
import { getValueByPath } from "../../../../../utility";

const StyledChartContainer = styled("div")(() => ({
    height: "100%",
}));
const StyledNoDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: "30vh",
    width: "80vh",
    color: error ? theme.palette.error.main : "unset",
}));
interface LineProps {
    id: string;
    updateJson: (data: any, path: any) => void;
}
export const Line = observer(({ id, updateJson }: LineProps) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);
    let resultData: unknown = {};
    // get the frame
    function getVisualizationBlockSelector(id: string) {
        if (id) {
            //get the options JSON of the selected block
            let blockJSON = data.option;
            //initialize the selector string
            let selector = "Select(";
            //if there are no fields, return null
            if (!blockJSON["_state"]) return null;
            //get the fields
            let selectorFields = blockJSON["_state"]["fields"];
            //  get the value and tooltip properties
            let dynamicYAndTooltipSet = Array.from(
                new Set([
                    ...selectorFields["yAxis"],
                    ...selectorFields["tooltip"],
                ]),
            );
            // let dynamicYAndTooltipSet = [
            //     ...new Set([
            //         ...selectorFields["yAxis"],
            //         ...selectorFields["tooltip"],
            //     ]),
            // ];
            // start forming the selector string
            selector += `${selectorFields["xAxis"][0]}`;
            // add dynamic y axis and tooltip fields to the selector string
            let averageCollection = "";
            for (let i = 0; i < dynamicYAndTooltipSet.length; i++) {
                averageCollection += `, Average(${dynamicYAndTooltipSet[i]})`;
                selector += `, Average(${dynamicYAndTooltipSet[i]})`;
            }
            selector += `).as([${selectorFields["xAxis"][0]}${averageCollection}])|Group(${selectorFields["xAxis"][0]})|Sort(${selectorFields["xAxis"][0]})`;
            return selector;
        }
        return null;
    }
    const frame = useFrame(data.frame.name, {
        selector: getVisualizationBlockSelector(id),
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
                return v;
            }
            return JSON.stringify(v, null, 2);
        });
    }, [data, "option"]).get();
    useEffect(() => {
        if (
            data?.frame?.name &&
            frame?.data?.values.length > 0 &&
            frame?.isLoading === false
        ) {
            updateJson(resultData, "option");
        }
    }, [frame.data.values]);
    //format the frame option data for echart
    const formatDataPoints = useCallback(
        (resultData: unknown) => {
            if (frame.data.values.length > 0) {
                let valuesDataSet = JSON.parse(
                    JSON.stringify(frame.data.values),
                );
                let headersDataSet: string[] = JSON.parse(
                    JSON.stringify(frame.data.headers),
                );
                headersDataSet = headersDataSet.map((header: string) =>
                    header.replace("Average_", ""),
                );
                //format the data points to match the echart specification
                resultData["xAxis"]["data"] = valuesDataSet.map((x) => x[0]);
                valuesDataSet.map((x) => x.shift());
                headersDataSet.shift();
                const yAxisListLength = resultData["yAxis"]["name"].length;
                for (let index = 0; index < yAxisListLength; index++) {
                    resultData["series"][index]["data"] = valuesDataSet.map(
                        (x) => {
                            return x[index];
                        },
                    );
                    resultData["series"][index]["name"] = headersDataSet[index];
                }
                resultData["series"].length = yAxisListLength;
                resultData["series"].slice(0, yAxisListLength);
                valuesDataSet.map((x) => x.splice(0, yAxisListLength));
                headersDataSet.splice(0, yAxisListLength);
                let customTooltipData = [];
                data.option["_state"]?.["fields"]["tooltip"].map((x, index) => {
                    customTooltipData.push({
                        name: x,
                        data: valuesDataSet.map((y) => y[index]),
                    });
                });
                if (!resultData["tooltip"].hasOwnProperty("formatter")) {
                    let customTooltipData = [];
                    data.option["_state"]?.["fields"]["tooltip"].map(
                        (x, index) => {
                            customTooltipData.push({
                                name: x,
                                data: valuesDataSet.map((y) => y[index]),
                            });
                        },
                    );
                    resultData["tooltip"] = {
                        ...resultData["tooltip"],
                        formatter: ((customTooltipData) => (params) => {
                            let formatterStringArr = ["<div>"];
                            let dataIndex = params[0]?.dataIndex;
                            formatterStringArr.push(
                                `<strong>${params[0].name}</strong><br>`,
                            );
                            params.forEach((param) => {
                                let { value, seriesName, color } = param;
                                if (!isNaN(value) && value !== undefined) {
                                    value = value.toFixed(1);
                                }
                                formatterStringArr.push(
                                    `<span style="color:${color}">\u25CF</span> Average of ${seriesName}:<strong> ${value}</strong><br>`,
                                );
                            });
                            customTooltipData.forEach((data) => {
                                formatterStringArr.push(
                                    `<span style="color:">\u25CF</span> ${data.name}:<strong> ${data.data[dataIndex]}</strong><br>`,
                                );
                            });
                            formatterStringArr.push(`</div>`);
                            return formatterStringArr.join(" ");
                        })(customTooltipData),
                    };
                } else {
                    delete resultData["tooltip"]["formatter"];
                }
            }
            return resultData;
        },
        [frame.data.values],
    );
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const handleSelection = debounce((value: any, name: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${name}==[${value}])`);
    }, 2000);
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
        // chart.on('brushEnd', (params) => {
        //     console.log('End params', params);
        // });
    }, 2000);
    const onClickChart = {
        contextmenu: (params) => {
            if (params.data) {
                let labelName = params.seriesName;
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  label: labelName,
                                  value: params.data,
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
                <StyledChartContainer>
                    <ReactECharts
                        option={lineOptions as unknown as EChartsOption}
                        onEvents={onClickChart}
                        onChartReady={(chart) => {
                            echartsLoaded(chart);
                        }}
                    />
                </StyledChartContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        resultData =
            data?.frame?.name &&
            frame.data.values.length > 0 &&
            frame.isLoading === false
                ? formatDataPoints(JSON.parse(computedValue))
                : JSON.parse(computedValue);
        return (
            <StyledChartContainer>
                <ReactECharts
                    option={resultData as EChartsOption}
                    onEvents={onClickChart}
                    onChartReady={(chart) => {
                        echartsLoaded(chart);
                    }}
                    style={{
                        height: "inherit",
                    }}
                />
                <CustomContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            </StyledChartContainer>
        );
    }
});
