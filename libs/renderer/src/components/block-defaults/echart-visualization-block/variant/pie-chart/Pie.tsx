import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";
import { computed } from "mobx";

import { BlockComponent } from "../../../../../store";
import { EchartVisualizationBlockDef } from "../..";
import { CustomContextMenu } from "./CustomContextMenu";
import { PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import {
    useBlock,
    useFrame,
    useBlocks,
    useBlockSettings,
} from "../../../../../hooks";
import { EChartsOption } from "echarts";
import { updateColorData } from "../shared/chart-utility";

const StyledChartContainer = styled("div")(() => ({
    height: "inherit",
}));

const StyledNoDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: "30vh",
    width: "80vh",
    color: error ? theme.palette.error.main : "unset",
}));

interface PieProps {
    /**
     *
     */
    id: string;

    /**
     *
     */
    updateJson: (data: any, path: any) => void;
}

export const Pie = observer(({ id, updateJson }: PieProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);
    let resultData: unknown = {};

    /**
     * Builds a dynamic query string based on the provided input data.
     * @param inputData - An array of tuples where each tuple contains a string and an object mapping field names to aggregation methods.
     * @returns A query string that selects and groups by the specified fields with appropriate aggregations.
     */
    const buildDynamicQuery = (inputData): string => {
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

    /**
     * get the frame
     */
    const frame = useFrame(data?.frame?.name, {
        selector: buildDynamicQuery(Object.entries(data?.aggregate ?? {})),
    });


    /**
     * @description Trying out different approach for TrendLine, work in progress
     */
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

    /**
     * @description
     */
    // const parsedOption = useMemo(() => {
    //     return typeof computedValue === "string"
    //         ? JSON.parse(computedValue)
    //         : computedValue;
    // }, [computedValue]);

    /**
     * @description
     */

    // const parsedOption = useMemo(() => {
    //     let options = { ...computedValue };

    //     if (
    //         data.frame.name &&
    //         frame.data.values.length > 0 &&
    //         frame.isLoading === false
    //     ) {
    //         // options = receiveValueswithCorrections(computedValue);
    //         if (Array.isArray(options.series)) {
    //             options = {
    //                 ...options,
    //                 series: options.series.map((item) => {
    //                     return {
    //                         ...item,
    //                         name: data.frame.name,
    //                         ["data"]: frame.data.values.map(
    //                             ([name, value]) => ({
    //                                 value,
    //                                 name,
    //                             }),
    //                         ),
    //                         ["itemStyle"]: {
    //                             ...item["itemStyle"],
    //                             ["color"]: (seriesData) =>
    //                                 updateColorData(
    //                                     seriesData,
    //                                     (
    //                                         options.customSettings as {
    //                                             appliedRules?: any;
    //                                         }
    //                                     )?.appliedRules,
    //                                 ),
    //                         },
    //                     };
    //                 }),
    //             };
    //         }
    //     }
    //     return { ...options };
    // }, [computedValue, data.frame, frame.isLoading, frame.data.values]);
    console.log("parse option ", computedValue);
    console.log("  data option ", data.option);
    useEffect(() => {
        if (
            data.frame.name &&
            frame.data.values.length > 0 &&
            frame.isLoading === false &&
            Array.isArray(computedValue.series)
        ) {
            let options = { ...computedValue };

            if (
                data.frame.name &&
                frame.data.values.length > 0 &&
                frame.isLoading === false
            ) {
                // options = receiveValueswithCorrections(computedValue);
                if (Array.isArray(options.series)) {
                    options = {
                        ...options,
                        series: options.series.map((item) => {
                            return {
                                ...item,
                                name: frame.data.headers[1], //data.frame.name,
                                ["data"]: frame.data.values.map(
                                    ([value, name]) => ({
                                        value,
                                        name,
                                    }),
                                ),
                                ["itemStyle"]: {
                                    ...item["itemStyle"],
                                    ["color"]: (seriesData) =>
                                        updateColorData(
                                            seriesData,
                                            (
                                                options as {
                                                    customSettings?: {
                                                        appliedRules?: any;
                                                    };
                                                }
                                            )?.customSettings?.appliedRules,
                                        ),
                                },
                            };
                        }),
                    };
                }
            }
            setData("option", { ...options });
        }
    }, [
        data.frame.name,
        frame.data.values,
        frame.isLoading,
        computedValue.customSettings?.appliedRules,
    ]);

    /**
     * @description format the frame option data for echart
     */
    const formatDataPoints = useCallback(
        (resultData: unknown) => {
            if (frame.data.values.length > 0) {
                const valuesDataSet = JSON.parse(
                    JSON.stringify(frame.data.values),
                );
                let headersDataSet: string[] = JSON.parse(
                    JSON.stringify(frame.data.headers),
                );
                headersDataSet = frame.data.headers.map((header: string) =>
                    header.replace("Average_", ""),
                );
                //format the data points to match the echart specification
                resultData["series"][0]["data"] = frame.data.values.map(
                    ([name, value]) => ({ name, value }),
                );
                valuesDataSet.map((x) => x.shift());
                headersDataSet.shift();
            } else {
                delete resultData["tooltip"]["formatter"];
            }
            return resultData;
        },
        [frame.data.values],
    );

    /**
     * @description
     */
    const onClickChart = {
        contextmenu: (params) => {
            //  let currentOption = chart.getOption();
            if (params.data) {
                const labelName = data.option["_state"]["fields"]["Label"][0];
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  label: labelName,
                                  value: params.data.name,
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
                        option={lineOptions}
                        onEvents={onClickChart}
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
        // const resultData =
        //     data?.frame?.name &&
        //     frame.data.values.length > 0 &&
        //     frame.isLoading === false
        //         ? formatDataPoints(parsedOption)
        //         : parsedOption;
        return (
            <StyledChartContainer>
                <ReactECharts
                    option={computedValue as EChartsOption}
                    onEvents={onClickChart}
                    style={{
                        height: "inherit",
                        //width: 'inherit'
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
