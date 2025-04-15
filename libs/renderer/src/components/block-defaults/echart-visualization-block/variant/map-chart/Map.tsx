import { observer } from "mobx-react-lite";
import { useBlock, useBlockSettings, useFrame } from "../../../../../hooks";
import { BlockComponent } from "../../../../../store";
import { styled } from "@mui/material";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { TooltipComponent } from "echarts/components";
import EChartsReact from "echarts-for-react";
import fetchWorldMap from "./map-utility";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSelector } from "./MapSelector";
import { processData } from "./MapChartProcessData";
import { formatdatapoints } from "./MapChartTooltipData";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";

const StyledChartContainer = styled("div")(() => ({
    width: "fit-content",
    minWidth: "50px",
    minHeight: "50px",
}));

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

export const Map: BlockComponent = observer(({ id }) => {
    const { data } = useBlock<EchartVisualizationBlockDef>(id);
    const mapRef: any = useRef({});
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);
    const frame = useFrame(data?.frame?.name, {
        selector: getSelector(data),
    });
    const updatedOption =
        mapRef.current && typeof mapRef.current.getOption === "function"
            ? mapRef.current.getOption()
            : {};

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
        mapRef.current = chart;
        const option = data.option;
        data.option = option;

        chart.setOption(option);
        chart.resize();
        chart.on("contextmenu", (params) => {
            onClickChart(chart, params);
        });
        chart.on("brushselected", (params) => {
            const selectedData = params.batch[0]?.selected[0]?.dataIndex;
            const currentOption = chart.getOption();
            const labelData = currentOption.series[0]?.data;
            const filteredLabels = selectedData?.map(
                (index) => labelData[index]?.label?.formatter,
            );
            if (filteredLabels?.length > 0) {
                handleSelection(
                    filteredLabels,
                    currentOption["_state"]["fields"]["label"],
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

    const worldJson: any = fetchWorldMap("");

    useEffect(() => {
        let option = data.option;
        echarts.registerMap("world", worldJson);
        option = {
            geo: {
                map: "world",
                roam: true,
                zoom: 1,
                center: [0, 0],
            },
            series: [
                {
                    type: "scatter",
                    // name: 'Scatters Plot',
                    coordinateSystem: "geo",
                },
            ],
        };

        data.option = option;
        // mapRef.current?.setOption(option);
    }, []);

    const processedFrameData = processData(frame.data, data);
    if (processedFrameData && processedFrameData.length > 0) {
        data.option["series"][0]["data"] = processedFrameData;
    }

    if (!data.option["tooltip"].hasOwnProperty("formatter")) {
        data.option["tooltip"] = {
            ...data.option["tooltip"],
            formatter: formatdatapoints(frame.data, data),
        };
    }

    // Calculate bounding box
    const lats = data.option["series"][0]["data"].map((d) => d.value[0]);
    const lons = data.option["series"][0]["data"].map((d) => d.value[1]);
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

    if (frame.data.values.length > 0) {
        updatedOption["geo"][0]["center"] = [
            centerLat ? centerLat : 0,
            centerLon ? centerLon : 0,
        ];
        updatedOption["geo"][0]["zoom"] = zoomLevel ? zoomLevel : 4;
    }

    if (frame.data.values.length > 0) {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (data.option["_state"]["fields"].hasOwnProperty("label")) {
                    const seriesData = data.option["series"][0]["data"];

                    if (
                        data.option["_state"]["fields"].hasOwnProperty("color")
                    ) {
                        const n = data.option["_state"][
                            "fields"
                        ].hasOwnProperty("size")
                            ? 4
                            : 3;
                        const test = frame.data.values
                            .map((item: any) => item[n])
                            .map(String);

                        data.option["series"] = [];

                        data.option["series"] = test.map((name, index) => ({
                            name: String(name),
                            data: seriesData,
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
                        }));

                        data.option["legend"]["data"] = test;
                    } else {
                        mapRef.current.clear();

                        updatedOption["series"] = updatedOption["series"][0];
                        mapRef.current.setOption(updatedOption);

                        data.option["series"][0]["name"] =
                            data.option["_state"]["fields"]["label"];
                        data.option["legend"]["data"] = [
                            data.option["_state"]["fields"]["label"],
                        ];
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

    return (
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
