import { useState, useEffect, ChangeEvent, useMemo, useRef } from "react";
import { useBlock, useBlockSettings } from "../../../../../hooks";
import { observer } from "mobx-react-lite";
import { EchartVisualizationBlockDef } from "../../../echart-visualization-blocks/VisualizationBlock";
import { Button, Select, styled, Switch, TextField } from "@semoss/ui";
import { computed } from "mobx";
import { getValueByPath } from "@/utility";
import { BlockDef } from "../../../../../store";
import { PathValue } from "@/types";

const StyledMainContainer = styled("div")(() => ({
    padding: "0.75rem",
    borderBottom: "1px solid #E6E6E6",
}));
const StyledSubContainer = styled("div")((props) => ({
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
}));

const INITIAL_FISCAL_AXIS = {
    enableFiscalAxis: false,
    fiscalYearStart: "",
    fiscalBackGroundColor: "#0471f0",
};

export const GanttFiscal = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const monthData = [
            {
                label: "January",
                value: "Jan",
                monthDigit: "00",
            },
            {
                label: "February",
                value: "Feb",
                monthDigit: "01",
            },
            {
                label: "March",
                value: "Mar",
                monthDigit: "02",
            },
            {
                label: "April",
                value: "Apr",
                monthDigit: "03",
            },
            {
                label: "May",
                value: "May",
                monthDigit: "04",
            },
            {
                label: "June",
                value: "Jun",
                monthDigit: "05",
            },
            {
                label: "July",
                value: "Jul",
                monthDigit: "06",
            },
            {
                label: "Augest",
                value: "Aug",
                monthDigit: "07",
            },
            {
                label: "September",
                value: "Sep",
                monthDigit: "08",
            },
            {
                label: "October",
                value: "Oct",
                monthDigit: "09",
            },
            {
                label: "November",
                value: "Nov",
                monthDigit: "10",
            },
            {
                label: "December",
                value: "Dec",
                monthDigit: "11",
            },
        ];
        const [fiscalData, setFiscalData] = useState(INITIAL_FISCAL_AXIS);
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
        function updateData(e, field, directVal = undefined) {
            setFiscalData((prevFiscalData) => {
                return {
                    ...prevFiscalData,
                    [field]: directVal ?? e.target.value,
                };
            });
        }
        useEffect(() => {
            let option = JSON.parse(computedValue);
            let fiscalDataForUpdate = fiscalData;
            if (
                option["customSettings"]?.["gantttools"]?.["enableFiscalAxis"]
            ) {
                fiscalDataForUpdate.enableFiscalAxis =
                    option["customSettings"]?.["gantttools"]?.[
                        "enableFiscalAxis"
                    ];
            }
            if (option["customSettings"]?.["gantttools"]?.["fiscalYearStart"]) {
                fiscalDataForUpdate.fiscalYearStart =
                    option["customSettings"]?.["gantttools"]?.[
                        "fiscalYearStart"
                    ];
            }
            if (option["customSettings"]?.["gantttools"]?.["fiscalYearStart"]) {
                fiscalDataForUpdate.fiscalBackGroundColor =
                    option["customSettings"]?.["gantttools"]?.[
                        "fiscalAxisBackgroundColor"
                    ];
            }
            setFiscalData((prevFiscalData) => {
                return {
                    ...prevFiscalData,
                    ...fiscalDataForUpdate,
                };
            });
        }, []);
        useEffect(() => {
            let option = JSON.parse(computedValue);
            option = {
                ...option,
                ["customSettings"]: {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["enableFiscalAxis"]: fiscalData.enableFiscalAxis,
                        ["fiscalYearStart"]: fiscalData.fiscalYearStart,
                        ["fiscalAxisBackgroundColor"]:
                            fiscalData.fiscalBackGroundColor,
                    },
                },
            };
            if (fiscalData.fiscalYearStart != "") {
                let seriesIndex = option["series"].findIndex((item) =>
                    item.hasOwnProperty("chartrendered"),
                );

                let seriesStartData = option["series"][seriesIndex]["data"].map(
                    (item) =>
                        new Date(item.value[0]).toISOString().split("T")[0],
                );
                let seriesEndData = option["series"][seriesIndex]["data"].map(
                    (item) =>
                        new Date(item.value[2]).toISOString().split("T")[0],
                );
                seriesStartData = seriesStartData.sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
                );
                seriesEndData = seriesEndData.sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
                );
                let monthDigit =
                    monthData.find(
                        (item) => item.value == fiscalData.fiscalYearStart,
                    ).monthDigit || "-1";
                let monthYear =
                    seriesStartData
                        .find(
                            (item) =>
                                new Date(item).getMonth() ==
                                parseInt(monthDigit),
                        )
                        ?.split("-")?.[0] || "";
                if (monthYear != "") {
                    option["customSettings"]["gantttools"] = {
                        ...option["customSettings"]["gantttools"],
                        ["fiscalYearValue"]: monthYear,
                    };
                } else {
                    option["customSettings"]["gantttools"] = {
                        ...option["customSettings"]["gantttools"],
                        ["fiscalYearValue"]: seriesStartData[0].split("-")[0],
                    };
                }
            }
            runStateUpdate(option);
        }, [fiscalData]);

        function resetToInitialState() {
            setFiscalData((prevFiscalState) => {
                return {
                    enableFiscalAxis: false,
                    fiscalYearStart: "",
                    fiscalBackGroundColor: "#0471f0",
                };
            });
        }

        function runStateUpdate(option) {
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

        return (
            <StyledMainContainer>
                <StyledSubContainer
                    style={{ display: "flex", flexDirection: "row" }}
                >
                    <Switch
                        checked={fiscalData.enableFiscalAxis}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            updateData(e, "enableFiscalAxis", e.target.checked);
                        }}
                    />
                    <label style={{ paddingLeft: "10px" }}>
                        Enable Fiscal Axis
                    </label>
                </StyledSubContainer>
                <StyledSubContainer>
                    <label>Fiscal Year Start</label>
                    <Select
                        value={fiscalData.fiscalYearStart}
                        onChange={(e) => {
                            updateData(e, "fiscalYearStart", undefined);
                        }}
                    >
                        <Select.Item value="-1">Select Month</Select.Item>
                        {monthData.map((item) => {
                            return (
                                <Select.Item value={item.value}>
                                    {item.label}
                                </Select.Item>
                            );
                        })}
                    </Select>
                </StyledSubContainer>
                <StyledSubContainer>
                    <label>Input a color Hex Code for Axis If Desired</label>
                    <TextField
                        type={"color"}
                        value={fiscalData.fiscalBackGroundColor}
                        onChange={(e) => updateData(e, "fiscalBackGroundColor")}
                    />
                </StyledSubContainer>
                <StyledSubContainer
                    style={{
                        width: "100%",
                        display: "block",
                        textAlign: "end",
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
