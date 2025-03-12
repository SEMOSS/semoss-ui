import { observer } from "mobx-react-lite";
import { useBlocks, useBlockSettings } from "../../../../../hooks";
import styled from "@emotion/styled";
import { Switch, TextField } from "@semoss/ui";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { getValueByPath } from "@/utility";

interface GanttTargetLineProps {
    id: string;
}

const StyledMainContainer = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    padding: "0.75rem",
}));
const StyledSubContainer = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
}));

export const GanttTargetLine = observer(({ id }: GanttTargetLineProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [targetLineData, setTargetLineData] = useState({
        targetdate: "",
        targetlabel: "",
        targetcolor: "#FF0000",
        showTodayDate: false,
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
        let option = JSON.parse(computedValue);
        if (option["customSettings"]?.["gantttools"]) {
            let gantttool = option["customSettings"]?.["gantttools"];
            let targetLineDataTemp = targetLineData;
            if (gantttool?.["targetLineColor"]) {
                targetLineDataTemp["targetcolor"] =
                    gantttool["targetLineColor"];
            }
            if (gantttool?.["targetLineName"]) {
                targetLineDataTemp["targetlabel"] = gantttool["targetLineName"];
            }
            if (gantttool?.["targetDate"]) {
                targetLineDataTemp["targetdate"] = gantttool["targetDate"];
            }
            setTargetLineData((prevTargetLineData) => {
                return {
                    ...prevTargetLineData,
                    ...targetLineData,
                };
            });
        }
    }, []);

    function updateFields(e, field = "") {
        if (field != "") {
            console.log(e, field, e.target.value, "fieldChange");
            setTargetLineData((prevTargetLineData) => {
                return {
                    ...prevTargetLineData,
                    [field]: e.target.value,
                };
            });
        }
    }

    useEffect(() => {
        updateChartData();
    }, [targetLineData]);

    function updateChartData() {
        let option = JSON.parse(computedValue);
        if (targetLineData.targetdate != "") {
            let date = targetLineData.targetdate;
            let seriesIndex = option["series"].findIndex(
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
                let optionToUpdate = {
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
        if (targetLineData.targetdate != "") {
            option["customSettings"] = {
                ...option["customSettings"],
                ["gantttools"]: {
                    ...option["customSettings"]["gantttools"],
                    ["targetDate"]: targetLineData.targetdate,
                },
            };
        }

        setTimeout(() => {
            try {
                setData("option", option);
            } catch (e) {}
        }, 300);
    }
    return (
        <StyledMainContainer>
            {/* <StyledSubContainer>
                <Switch checked={targetLineData.showTodayDate} onChange={(e: ChangeEvent<HTMLInputElement>)=>{
                    if(e.target.checked){
                        updateFields({target:{value:new Date()}}, 'targetdate');
                    }
                }} />
                <label htmlFor=''>Show Today Date</label>
            </StyledSubContainer> */}
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
        </StyledMainContainer>
    );
});
