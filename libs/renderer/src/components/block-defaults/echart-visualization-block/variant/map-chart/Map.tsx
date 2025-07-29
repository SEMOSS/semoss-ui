import { BarChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import EChartsReact from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { styled } from "@semoss/ui";
import { useBlock, useFrame } from "../../../../../hooks";
import { BlockComponent } from "../../../../../store";
import { updateColorData } from "../../../../shared/chart-utility";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { processData } from "./MapChartProcessData";
import { formatdatapoints } from "./MapChartTooltipData";
import { getSelector } from "./MapSelector";
import fetchWorldMap from "./map-utility";

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
            customSettings: any;
            series: {
                type: string;
                name: string;
                label: any;
                // {
                //     show: boolean;
                //     rotate: number;
                //     name: string;
                //     position: string;
                //     fontFamily: string;
                //     fontSize: number;
                //     color: string;
                //     symbolSize: number;
                //     symbol: string;
                // };
                symbolSize: number;
                symbol: string;
                data: any[];
                coordinateSystem: string;
            }[];
            tooltip: {};
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

export const Map: BlockComponent = observer(({ id }) => {
    const { data, setData } = useBlock<EchartVisualizationBlockDef>(id);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);
    const worldJson: any = fetchWorldMap("");
    const [mapIsLoaded, setMapIsLoaded] = useState(false);
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

    const handleSelection = debounce(async (value: any, name: any, chart) => {
        // update the frame
        await frame.filter(`SetFrameFilter(${name}==[${value}])`);
        disabledBrush(chart);
    }, 1000);

    const echartsLoaded = debounce((chart) => {
        const option = data.option;
        chart.setOption(option);
        chart.resize();
        chart.on("contextmenu", (params) => {
            onClickChart(chart, params);
        });
        chart.on("brushselected", (params) => {
            const selectedData = params.batch[0]?.selected[0]?.dataIndex;
            const option = chart.getOption();
            const labelData = option.series[0]?.data;
            const filteredLabels = selectedData?.map(
                (index) => labelData[index]?.label?.formatter,
            );
            if (filteredLabels?.length > 0) {
                handleSelection(
                    filteredLabels,
                    option["_state"]["fields"]["label"],
                    chart,
                );
            }
        });
    }, 2000);

    const disabledBrush = (chart) => {
        chart.dispatchAction({
            type: "brush",
            areas: [],
        });

        chart.setOption({
            brush: {
                toolbox: [],
                brushMode: false,
            },
        });
    };

    useEffect(() => {
        echarts.registerMap("world", worldJson);
        setMapIsLoaded(true);
    }, [worldJson]);

    useEffect(() => {
        if (mapIsLoaded && frame.data?.values?.length > 0) {
            const processedFrameData = processData(frame.data, data) ?? [];
            const headers = frame.data.headers;
            const series = [
                {
                    name: headers[0],
                    data: processedFrameData.map((item: any) => {
                        return {
                            [headers[0]]: item.label.formatter,
                            [headers[1]]: item.value[0],
                            [headers[2]]: item.value[1],
                            ...item,
                        };
                    }),
                    coordinateSystem: "geo",
                    type: "scatter",
                    label: {
                        show: false,
                        rotate: 0,
                        name: "",
                        position: "top",
                        fontFamily: "sans-serif",
                        fontSize: 12,
                        color: "#000000",
                    },
                    symbolSize: data.option["symbolSize"],
                    symbol: "circle",
                    itemStyle: {
                        // ...item?.itemStyle,
                        color: (seriesData) =>
                            updateColorData(
                                seriesData,
                                data.option?.customSettings?.appliedRules,
                            ),
                    },
                },
            ];
            setData("option", {
                ...data.option,
                series: series,
                tooltip: {
                    ...data.option.tooltip,
                    formatter: formatdatapoints(frame.data, data),
                },
            });
        }
    }, [
        mapIsLoaded, 
        frame.data.values, 
        frame.data.headers, 
        data.option.customSettings?.appliedRules, data, frame.data, setData
    ]);
    // Calculate bounding box
    const lats =
        data.option["series"][0]?.["data"]?.map((d) => d.value[0]) ?? [];
    const lons =
        data.option["series"][0]?.["data"]?.map((d) => d.value[1]) ?? [];
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Compute center
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    // Adjust zoom level based on spread
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoomLevel = 4;

    // Default zoom
    if (maxDiff < 1) zoomLevel = 8;
    else if (maxDiff < 5) zoomLevel = 6;
    else if (maxDiff < 10) zoomLevel = 5;
    else if (maxDiff < 20) zoomLevel = 4;
    else zoomLevel = 1;

    if (frame.data.values.length > 0 && data.option["geo"][0]) {
        data.option["geo"][0]["center"] = [
            centerLat ? centerLat : 0,
            centerLon ? centerLon : 0,
        ];
        data.option["geo"][0]["zoom"] = zoomLevel ? zoomLevel : 4;
    }

    if (frame.data.values.length > 0) {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (data.option["_state"]["fields"].hasOwnProperty("label")) {
                    if (
                        data.option["_state"]["fields"].hasOwnProperty("color")
                    ) {
                        const n = data.option["_state"][
                            "fields"
                        ].hasOwnProperty("size")
                            ? 4
                            : 3;
                        const test = n
                            ? frame.data.values
                                  .map((item: any) => item[n])
                                  .map(String)
                            : [];
                        if (data.option["legend"]) {
                            data.option["legend"]["data"] = test;
                        }
                    }
                }
            }
        }
    }

    const onClickChart = (chart, params) => {
        if (params.data) {
            const currentOption = chart.getOption();
            const labelName = currentOption["_state"]["fields"]["label"];
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
        }
    };

    return !mapIsLoaded ? (
        <StyledNoDataContainer error>
            <p>Loading map data...</p>
        </StyledNoDataContainer>
    ) : (
        <StyledNoDataContainer data-block-id={id}>
            <EChartsReact
                option={data.option}
                echarts={echarts}
                onChartReady={(chart) => {
                    echartsLoaded(chart);
                }}
                opts={{ height: "auto", width: "auto" }}
                style={{ height: "inherit", width: "inherit" }}
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
