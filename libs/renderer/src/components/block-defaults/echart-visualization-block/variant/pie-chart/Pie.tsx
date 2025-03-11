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
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);
    let resultData: unknown = {};

    /**
     * get the frame
     */
    const frame = useFrame(data?.frame?.name, {
        selector: getVisualizationBlockSelector(id),
    });

    /**
     *
     * @param id
     * @description
     */
    function getVisualizationBlockSelector(id: string) {
        if (id) {
            //get the options JSON of the selected block
            //let blockJSON = this._store.blocks[id].data.option;
            let blockJSON = data.option;
            //initialize the selector string
            let selector = "Select(";

            //if there are no fields, return null
            if (!blockJSON["_state"]) return null;

            //get the fields
            let selectorFields = blockJSON["_state"]["fields"];

            //  get the value and tooltip properties
            let dynamicYAndTooltipSet = [
                ...new Set([
                    ...selectorFields["Value"],
                    ...selectorFields["tooltip"],
                ]),
            ];

            // start forming the selector string
            selector += `${selectorFields["Label"][0]}`;

            // add dynamic y axis and tooltip fields to the selector string
            let averageCollection = "";
            for (let i = 0; i < dynamicYAndTooltipSet.length; i++) {
                averageCollection += `, Average(${dynamicYAndTooltipSet[i]})`;
                selector += `, Average(${dynamicYAndTooltipSet[i]})`;
            }

            selector += `).as([${selectorFields["Label"][0]}${averageCollection}])|Group(${selectorFields["Label"][0]})|Sort(${selectorFields["Label"][0]})`;
            return selector;
        }
        return null;
    }

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
                return v;
            }
            return JSON.stringify(v, null, 2);
        });
    }, [data, "option"]).get();

    /**
     * @description
     */
    let parsedOption = useMemo(() => {
        return typeof computedValue === "string"
            ? JSON.parse(computedValue)
            : computedValue;
    }, [computedValue]);

    /**
     * @description
     */
    useEffect(() => {
        if (
            data?.frame?.name &&
            frame?.data?.values.length > 0 &&
            frame?.isLoading === false
        ) {
            updateJson(parsedOption, "option");
        }
    }, [frame.data.values]);

    /**
     * @description format the frame option data for echart
     */
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
                resultData["series"][0]["data"] = valuesDataSet.map(
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
                let labelName = data.option["_state"]["fields"]["Label"][0];
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
        resultData =
            data?.frame?.name &&
            frame.data.values.length > 0 &&
            frame.isLoading === false
                ? formatDataPoints(parsedOption)
                : parsedOption;
        return (
            <StyledChartContainer>
                <ReactECharts
                    option={resultData}
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
