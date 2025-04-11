import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { Button, Switch, TextField } from "@semoss/ui";
import styled from "@emotion/styled";
import { getValueByPath } from "@/utility";
import { useBlocks, useBlockSettings } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";

interface GanttTargetLineProps {
    id: string;
}
//styled main container with padding and border
const StyledMainContainer = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    padding: "0.75rem",
    borderBottom: "1px solid #E6E6E6",
}));
//styled sub container with flex direction column
const StyledSubContainer = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
}));
//styled label with padding left
const StyledLabel = styled("label")(() => ({
    paddingLeft: "10px",
}));
//initial target line data
const INITIAL_TARGET_LINE = {
    targetdate: "",
    targetlabel: "",
    targetcolor: "#FF0000",
    showTodayDate: false,
};
export const GanttTargetLine = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //block data
        const [targetLineData, setTargetLineData] =
            useState(INITIAL_TARGET_LINE); //target line data
        //get the computed value of the block data
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
        const timeoutRef = useRef(null); //timeout ref for setting data
        //to retain the values from state
        useEffect(() => {
            const option = JSON.parse(computedValue);
            if (option["customSettings"]?.["gantttools"]) {
                const gantttool = option["customSettings"]?.["gantttools"];
                const targetLineDataTemp = targetLineData;
                if (gantttool?.["targetLineColor"]) {
                    targetLineDataTemp["targetcolor"] =
                        gantttool["targetLineColor"];
                }
                if (gantttool?.["targetLineName"]) {
                    targetLineDataTemp["targetlabel"] =
                        gantttool["targetLineName"];
                }
                if (gantttool?.["targetDate"]) {
                    targetLineDataTemp["targetdate"] = gantttool["targetDate"];
                }
                if (gantttool?.["showTodayDate"]) {
                    targetLineDataTemp["showTodayDate"] =
                        gantttool["showTodayDate"];
                }
                setTargetLineData((prevTargetLineData) => {
                    return {
                        ...prevTargetLineData,
                        ...targetLineData,
                    };
                });
            }
        }, []);
        //update the fields and also the state when target line fields are changed
        function updateFields(e, field = "", directVal = undefined) {
            if (field != "") {
                setTargetLineData((prevTargetLineData) => {
                    return {
                        ...prevTargetLineData,
                        [field]:
                            directVal != undefined ? directVal : e.target.value,
                    };
                });
            }
        }
        //update the chart data when target line data is changed
        useEffect(() => {
            updateChartData();
        }, [targetLineData]);
        //update the chart data to state by making needed changes
        function updateChartData() {
            let option = JSON.parse(computedValue);
            if (targetLineData.targetdate != "") {
                const date = targetLineData.targetdate;
                const seriesIndex = option["series"].findIndex(
                    (optItem) => optItem.name === "targetDateSegment",
                );
                if (seriesIndex > -1) {
                    option["series"][seriesIndex] = {
                        ...option["series"][seriesIndex],
                        ["data"]: [
                            {
                                ["name"]: "targetDateSegment",
                                ["value"]: [new Date(date).getTime()],
                            },
                        ],
                    };
                } else {
                    const optionToUpdate = {
                        type: "custom",
                        name: "targetDateSegment",
                        data: [
                            {
                                name: "targetDateSegment",
                                value: [new Date(date).getTime()],
                            },
                        ], // Set the date for the vertical line
                    };
                    option = {
                        ...option,
                        ["series"]: [...option["series"], optionToUpdate],
                    };
                }
            } else {
                let seriesData = option["series"];
                seriesData = seriesData.filter(
                    (item) => item.name !== "targetDateSegment",
                );
                option["series"] = seriesData;
            }
            if (targetLineData.targetlabel != "") {
                option["customSettings"] = {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["targetLineName"]: targetLineData.targetlabel,
                    },
                };
            }
            if (targetLineData.targetcolor != "") {
                option["customSettings"] = {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["targetLineColor"]: targetLineData.targetcolor,
                    },
                };
            }
            if (targetLineData.hasOwnProperty("targetdate")) {
                option["customSettings"] = {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["targetDate"]: targetLineData.targetdate,
                    },
                };
            }
            if (targetLineData.hasOwnProperty("showTodayDate")) {
                option["customSettings"] = {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["showTodayDate"]: targetLineData.showTodayDate,
                    },
                };
            }

            runUpdateCustom(option);
        }
        //run the state updates when needed changes in option is done
        function runUpdateCustom(option) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        option as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {}
            }, 300);
        }
        //reset the target line data to initial state
        function resetToInitialState() {
            setTargetLineData((prevTargetLine) => {
                return {
                    targetdate: "",
                    targetlabel: "",
                    targetcolor: "#FF0000",
                    showTodayDate: false,
                };
            });
        }
        //timezone based changes for date
        function convertTimeZone(date) {
            const currentTimezone =
                Intl.DateTimeFormat().resolvedOptions().timeZone;
            const dateConvertedToTimeZone = new Date(date)
                .toISOString()
                .split("T")[0];

            return (
                new Date(dateConvertedToTimeZone).getFullYear() +
                "-" +
                (new Date(dateConvertedToTimeZone).getMonth() + 1 < 10
                    ? "0" + (new Date(dateConvertedToTimeZone).getMonth() + 1)
                    : new Date(dateConvertedToTimeZone).getMonth() + 1) +
                "-" +
                (new Date(dateConvertedToTimeZone).getDate() < 10
                    ? "0" + new Date(dateConvertedToTimeZone).getDate()
                    : new Date(dateConvertedToTimeZone).getDate())
            );
        }
        return (
            <StyledMainContainer>
                <StyledSubContainer style={{ flexDirection: "row" }}>
                    <Switch
                        checked={targetLineData.showTodayDate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.hasOwnProperty("checked")) {
                                updateFields(
                                    e,
                                    "showTodayDate",
                                    e.target.checked,
                                );
                                updateFields(
                                    {
                                        target: {
                                            value: e.target.checked
                                                ? convertTimeZone(new Date())
                                                : "",
                                        },
                                    },
                                    "targetdate",
                                );
                            }
                        }}
                    />
                    <StyledLabel htmlFor="">Show Today Date</StyledLabel>
                </StyledSubContainer>
                <StyledSubContainer>
                    <label htmlFor="">Select Target Date</label>
                    <TextField
                        type="date"
                        value={targetLineData.targetdate}
                        onChange={(e) => updateFields(e, "targetdate")}
                    />
                </StyledSubContainer>
                <StyledSubContainer>
                    <label htmlFor="">Enter Target Label</label>
                    <TextField
                        type="text"
                        value={targetLineData.targetlabel}
                        onChange={(e) => updateFields(e, "targetlabel")}
                    />
                </StyledSubContainer>
                <StyledSubContainer>
                    <label htmlFor="">Select Line/Label Color</label>
                    <TextField
                        type="color"
                        value={targetLineData.targetcolor}
                        onChange={(e) => updateFields(e, "targetcolor")}
                    />
                </StyledSubContainer>
                <StyledSubContainer
                    style={{
                        width: "100%",
                        display: "block",
                        textAlign: "end",
                        paddingTop: "0.5rem",
                    }}
                >
                    <Button
                        color="primary"
                        variant="contained"
                        size="small"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                </StyledSubContainer>
            </StyledMainContainer>
        );
    },
);
