import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

import { Button, Select, styled } from "@semoss/ui";

import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";
import { useBlockSettings } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { BAR_CHART_DATA, LINE_CHART_DATA } from "../../Visualization.constants";

//styled select field with width to 100%
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));

export const ToggleTrendline = observer(
    <D extends BlockDef = BlockDef>({
        options,
        updateChart,
        chartType,
        id,
        path,
    }) => {
        const [toggleTrendlines, setToggleTrendlines] = useState<string>(""); //contains toggle trendlines tool state
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //chart block data and setdata
        const [value, setValue] = useState(data.option);
        //different trendlines option to draw lines over bar graph in different format
        const trendLineOptions = [
            { label: "Smooth", value: "smooth" },
            { label: "Exact", value: "exact" },
            { label: "Step(Start)", value: "step_start" },
            { label: "Step(Middle)", value: "step_middle" },
            { label: "Step(End)", value: "step_end" },
        ];
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, path);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        //update the value, when data is changed
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        //handles initial setting of toggle trendlines data
        useEffect(() => {
            if (BAR_CHART_DATA.JSONVALUE.includes(chartType)) {
                const seriesIndex = options["series"].findIndex(
                    (op) =>
                        LINE_CHART_DATA.JSONVALUE.includes(op.type) &&
                        op.hasOwnProperty("toggleTrendLineObject"),
                );
                if (seriesIndex > -1) {
                    const trendLineOptions = options["series"][seriesIndex];
                    if (trendLineOptions.smooth) {
                        setToggleTrendlines("smooth");
                    }
                    if (
                        trendLineOptions.smooth === false &&
                        (!trendLineOptions.hasOwnProperty("step") ||
                            trendLineOptions.step === false)
                    ) {
                        setToggleTrendlines("exact");
                    }
                    if (
                        trendLineOptions.hasOwnProperty("step") &&
                        trendLineOptions.step !== false
                    ) {
                        if (trendLineOptions.step === "start") {
                            setToggleTrendlines("step_start");
                        } else if (trendLineOptions.step === "middle") {
                            setToggleTrendlines("step_middle");
                        } else {
                            setToggleTrendlines("step_end");
                        }
                    }
                }
            }
        }, []);
        // when toggle trendline option is changed, below method will be called
        function handleToggleTrendLine(e) {
            setToggleTrendlines((prevTrendLine) => {
                return e.target.value;
            });
        }
        //getting the indexes for drawing lines over bar chart
        function getFilteredSeriesIndex(): number[] {
            const index: number[] = [];
            const seriesAvailable: any[] = data.option["series"].filter(
                (item) => BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }
        //update chart data when toggle trendlines is changed and execute button is clicked
        function updateChartData(trendLinesSelected: string) {
            let option = typeof value === "string" ? JSON.parse(value) : value;
            let optionUpdated = option;
            const filteredSeries = getFilteredSeriesIndex();
            if (trendLinesSelected != "") {
                filteredSeries.forEach((item) => {
                    const displayPositionIndex: number = item;
                    const lineAlreadyExists = option["series"].findIndex(
                        (opt) =>
                            opt.hasOwnProperty("toggleTrendLineObject") &&
                            LINE_CHART_DATA.JSONVALUE.includes(opt.type) &&
                            (opt.hasOwnProperty("sourceObjectIndex")
                                ? opt.sourceObjectIndex === displayPositionIndex
                                : true),
                    );
                    let trendLinesData = {};
                    if (["smooth", "exact"].includes(trendLinesSelected)) {
                        trendLinesData = {
                            ...trendLinesData,
                            ["smooth"]:
                                trendLinesSelected === "smooth" ? true : false,
                        };
                    }
                    if (trendLinesSelected.startsWith("step")) {
                        trendLinesData = {
                            ...trendLinesData,
                            ["step"]: trendLinesSelected.split("_")[1] ?? false,
                        };
                    }
                    if (lineAlreadyExists >= 0 && displayPositionIndex >= 0) {
                        option["series"][lineAlreadyExists] = {
                            ...option["series"][lineAlreadyExists],
                            ...trendLinesData,
                            ["data"]:
                                option["series"][displayPositionIndex]["data"],
                        };
                        console.log(option["series"], "line exists");
                    }

                    if (displayPositionIndex > -1 && lineAlreadyExists == -1) {
                        const toggleLineData = {
                            ...trendLinesData,
                            data:
                                option["series"][displayPositionIndex][
                                    "data"
                                ] || [],
                            type: "line",
                            toggleTrendLineObject: true,
                            sourceObjectIndex: displayPositionIndex,
                        };

                        option["series"] = [
                            ...option["series"],
                            toggleLineData,
                        ];
                    }
                });
                option = {
                    ...option,
                    ["customSettings"]: {
                        ...option["customSettings"],
                        ["toolsUpdated"]: true,
                    },
                };
                runStateUpdate(option);
            } else {
                const displayPositionData = option["series"].filter(
                    (item) =>
                        item.type === "line" &&
                        item.hasOwnProperty("toggleTrendLineObject"),
                );
                runDisplayPositionData(displayPositionData);
            }
            optionUpdated = option;
        }
        //setting value of line chart to null when no trendline option is selected
        function runDisplayPositionData(displayPositionData) {
            let option = typeof value === "string" ? JSON.parse(value) : value;
            const seriesOption = option["series"];
            seriesOption.forEach((seriesItem, seriesIndex) => {
                if (
                    seriesItem.type === "line" &&
                    seriesItem.hasOwnProperty("toggleTrendLineObject")
                ) {
                    const lineData = [];
                    seriesItem["data"].forEach((seriesData) => {
                        lineData.push(null);
                    });
                    option["series"][seriesIndex]["data"] = lineData;
                }
            });
            option = {
                ...option,
                ["customSettings"]: {
                    ...option["customSettings"],
                    ["toolsUpdated"]: true,
                },
            };
            runStateUpdate(option);
            removeLineObject();
        }
        //removing the line object when the series is updated line type and toggleTrendlineObject
        function removeLineObject() {
            setTimeout(() => {
                const option =
                    typeof value === "string" ? JSON.parse(value) : value;
                const displayPositionData = option["series"].filter(
                    (item) =>
                        !(
                            item.type === "line" &&
                            item.hasOwnProperty("toggleTrendLineObject")
                        ),
                );
                option["series"] = displayPositionData;
                runStateUpdate(option);
            }, 300);
        }
        //running the option update of a chart
        function runStateUpdate(updatedOption) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        updatedOption as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        const trendlineData = (
            <div style={{ width: "100%", display: "block" }}>
                <div
                    style={{
                        width: "100%",
                    }}
                >
                    <label htmlFor="showTrendLine">Trendlines Toggle</label>
                    <StyledSelect
                        onChange={handleToggleTrendLine}
                        id="showTrendLine"
                        label="Trendline Toggle"
                        value={toggleTrendlines}
                    >
                        <Select.Item value={""} key="-1">
                            No Trendline
                        </Select.Item>
                        {trendLineOptions.map((trendOption, index) => {
                            return (
                                <Select.Item
                                    value={trendOption.value}
                                    key={index}
                                >
                                    {trendOption.label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </div>
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                        display: "flex",
                        justifyContent: "space-around",
                    }}
                >
                    <Button
                        type="button"
                        color="primary"
                        onClick={() => updateChartData(toggleTrendlines)}
                    >
                        Update TrendLine
                    </Button>
                </div>
            </div>
        );
        return <>{trendlineData}</>;
    },
);
