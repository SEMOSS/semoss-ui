import { useState, useEffect, ChangeEvent, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

import { Button, Slider, styled, TextField, Switch } from "@semoss/ui";

import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";
import { useBlockSettings } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { EchartVisualizationBlockConfig } from "../../../../block-defaults";

//Axis div for switch type fields
const StyledAxisDiv = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
}));
//Axis div for input type fields with label
const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "0.5rem",
}));
//Axis div for span type elements
const StyledAxisSpan = styled("span")<{
    display?: string;
    justifyContent?: string;
    width?: string;
}>(({ display, justifyContent, width }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    width: width ?? undefined,
}));
//text field styling to have 100% width
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
//Initial y axis state for maintaining, restoring y axis fields
const INITIAL_YAXIS_STATE = {
    showAxis: true, //yaxis show/hide
    yaxistitle: "", //y axis title value
    yaxisTitleFontSize: 18, // yaxis title fontsize
    showYAxisLineTicks: false, // show/hide y axis ticks
    showYAxisLabels: true, // show/hide y axis labels
    labelFontSize: 12, // to change label font size
    rotate: 0, // to rotate label values from 0 to 360
    rotateLabelMinValue: 0, // rotating degree min value
    rotateLabelMaxValue: 360, // rotating degree max value
    showYAxisZoom: true, // show y axis zoom slider
};
//Changing the Y axis styling like title, rotate and changing the labels
export const EditYAxis = observer(
    <D extends BlockDef = BlockDef>({ option, id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [yaxisState, setYaxisState] = useState(INITIAL_YAXIS_STATE);
        const [yAxisDataUpdated, setYAxisDataUpdated] = useState<
            "initial" | "updated"
        >("initial");
        let axisValue = "yAxis";
        const [value, setValue] = useState(data.option);
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
        //update the value when computed value is updated
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        //updating initial state of y axis fields, when the component is mounted
        useEffect(() => {
            let axis: string = "yAxis";
            let yAxisStateData = {
                showAxis: true,
                yaxistitle: "",
                yaxisTitleFontSize: 18,
                showYAxisLineTicks: false,
                showYAxisLabels: true,
                labelFontSize: 12,
                rotate: 0,
                rotateLabelMinValue: 0,
                rotateLabelMaxValue: 360,
                showYAxisZoom: true,
            };
            if (option.hasOwnProperty(axis) && option[axis]) {
                yAxisStateData.yaxistitle = option[axis].hasOwnProperty("name")
                    ? option[axis]["name"]
                    : "";
                if (option[axis].hasOwnProperty("axisTick")) {
                    yAxisStateData.showYAxisLineTicks = option[axis][
                        "axisTick"
                    ].hasOwnProperty("show")
                        ? option[axis]["axisTick"].show
                        : false;
                }
                if (option[axis].hasOwnProperty("axisLabel")) {
                    yAxisStateData.labelFontSize = option[axis][
                        "axisLabel"
                    ].hasOwnProperty("fontSize")
                        ? option[axis]["axisLabel"]["fontSize"]
                        : 12;
                    yAxisStateData.rotate = option[axis][
                        "axisLabel"
                    ].hasOwnProperty("rotate")
                        ? option[axis]["axisLabel"]["rotate"]
                        : 0;
                }
                if (option["dataZoom"]) {
                    let yAxisPosition = option["dataZoom"].findIndex((opt) =>
                        opt.hasOwnProperty("yAxisIndex"),
                    );
                    if (yAxisPosition > -1) {
                        yAxisStateData.showYAxisZoom = option["dataZoom"][
                            yAxisPosition
                        ].hasOwnProperty("show")
                            ? option["dataZoom"][yAxisPosition].show
                            : false;
                        console.log(
                            "yaxiszoom",
                            option["dataZoom"][yAxisPosition].hasOwnProperty(
                                "show",
                            ),
                            option["dataZoom"][yAxisPosition].show,
                            false,
                        );
                    }
                }
            }
            setYaxisState((prevState) => {
                return {
                    ...prevState,
                    ...yAxisStateData,
                };
            });
        }, []);
        //updating the chart data, when any of the yaxis fields in this component is changed
        useEffect(() => {
            if (yAxisDataUpdated === "updated") {
                updateChartData();
            }
        }, [yaxisState]);
        //reset the y axis component to initial state for restoring
        function resetToInitialState() {
            setYaxisState(INITIAL_YAXIS_STATE);
        }
        //updating the chart data to state, when any of the y axis field is updated
        function updateChartData() {
            let axis: string = "yAxis"; //an axis pointer, either x or y axis
            let axisData = {
                showAxis: yaxisState.showAxis,
                yaxistitle: yaxisState.yaxistitle,
                yaxisTitleFontSize: yaxisState.yaxisTitleFontSize,
                showYAxisLabels: yaxisState.showYAxisLabels,
                labelFontSize: yaxisState.labelFontSize,
                rotate: yaxisState.rotate,
                showYAxisLineTicks: yaxisState.showYAxisLineTicks,
                showYAxisZoom: yaxisState.showYAxisZoom,
            };
            let option = typeof value === "string" ? JSON.parse(value) : value;
            let optionUpdated = option;
            //when a property is available, the respective values in the option is updated and state is also updated
            if (option.hasOwnProperty(axis) && option[axis]) {
                if (axisData.hasOwnProperty("showAxis")) {
                    option[axis] = {
                        ...option[axis],
                        ["show"]: axisData.showAxis,
                    };
                }
                if (axisData.hasOwnProperty("yaxistitle")) {
                    option[axis] = {
                        ...option[axis],
                        ["name"]: axisData.yaxistitle,
                    };
                }
                if (axisData.hasOwnProperty("yaxisTitleFontSize")) {
                    option[axis] = {
                        ...option[axis],
                        ["nameTextStyle"]: {
                            ...option[axis]["nameTextStyle"],
                            ["fontSize"]:
                                Number(axisData.yaxisTitleFontSize) ||
                                undefined,
                        },
                    };
                }
                if (axisData.hasOwnProperty("showYAxisLineTicks")) {
                    option[axis] = {
                        ...option[axis],
                        ["axisTick"]: {
                            ...option[axis]["axisTick"],
                            ["show"]: axisData.showYAxisLineTicks,
                            ["alignWithLabel"]: axisData.showYAxisLineTicks,
                        },
                    };
                }

                if (axisData.hasOwnProperty("showYAxisLabels")) {
                    option[axis] = {
                        ...option[axis],
                        ["axisLabel"]: {
                            ...option[axis]["axisLabel"],
                            ["show"]: axisData.showYAxisLabels,
                        },
                    };
                }

                if (axisData.hasOwnProperty("labelFontSize")) {
                    option[axis] = {
                        ...option[axis],
                        ["axisLabel"]: {
                            ...option[axis]["axisLabel"],
                            ["show"]: option[axis]["axisLabel"]["show"],
                            ["fontSize"]:
                                Number(axisData.labelFontSize) || undefined,
                        },
                    };
                }
                if (axisData.hasOwnProperty("rotate")) {
                    option[axis] = {
                        ...option[axis],
                        ["axisLabel"]: {
                            ...option[axis]["axisLabel"],
                            ["show"]: option[axis]["axisLabel"]["show"],
                            ["rotate"]: axisData.rotate,
                        },
                    };
                }
                if (axisData.hasOwnProperty("showYAxisZoom")) {
                    if (option["dataZoom"]) {
                        let xAxisPosition = option["dataZoom"].findIndex(
                            (opt) => opt.hasOwnProperty("yAxisIndex"),
                        );
                        if (xAxisPosition > -1) {
                            option["dataZoom"][xAxisPosition].show =
                                axisData.showYAxisZoom;
                        } else {
                            option["dataZoom"].push({
                                type: "slider",
                                yAxisIndex: [0],
                                show: axisData.showYAxisZoom,
                            });
                        }
                    } else {
                        option = {
                            ...option,
                            ["dataZoom"]: {
                                show: axisData.showYAxisZoom,
                                type: "slider",
                                yAxisIndex: [0],
                            },
                        };
                    }
                }
                option = {
                    ...option,
                    ["customSettings"]: {
                        ...option["customSettings"],
                        ["toolsUpdated"]: true,
                    },
                };
                optionUpdated = option;
                runStateUpdateCustom(optionUpdated);
            }
        }
        //updating the state, after y axis fields are updated
        function runStateUpdateCustom(
            optionUpdated: typeof EchartVisualizationBlockConfig.data.option,
        ) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        optionUpdated as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //updating y axis state, when y axis fields are changed
        function handleInputChange(e, title, directVal = undefined) {
            if (yAxisDataUpdated === "initial") setYAxisDataUpdated("updated");
            if (directVal != undefined) {
                setYaxisState((prevXaxisState) => {
                    return {
                        ...prevXaxisState,
                        [title]: directVal,
                    };
                });
            } else {
                setYaxisState((prevXaxisState) => {
                    return {
                        ...prevXaxisState,
                        [title]: e.target.value,
                    };
                });
            }
        }
        // component html data
        const accordionDetails = (
            <StyledAxisDiv style={{ padding: "0.95rem" }}>
                <StyledAxisDiv display="flex" justifyContent="space-between">
                    <Switch
                        defaultChecked={yaxisState.showAxis ?? undefined}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e, "showAxis", e.target.checked)
                        }
                        title="Show Axis Title"
                    />
                    <label>Show Axis Title</label>
                </StyledAxisDiv>
                {yaxisState.showAxis && (
                    <StyledAxisDiv>
                        <label htmlFor="yaxis-title">Set Axis Title</label>
                        <StyledTextField
                            id="yaxis-title"
                            value={yaxisState.yaxistitle}
                            onChange={(e) => handleInputChange(e, "yaxistitle")}
                        />
                    </StyledAxisDiv>
                )}
                {yaxisState.showAxis && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-between"
                    >
                        <label htmlFor="xaxis-edit-title-font-size">
                            Edit Axis Title Font Size
                        </label>
                        <TextField
                            id="xaxis-edit-title-font-size"
                            type="number"
                            value={yaxisState.yaxisTitleFontSize}
                            onChange={(e) =>
                                handleInputChange(e, "yaxisTitleFontSize")
                            }
                        />
                    </StyledAxisColDiv>
                )}

                <StyledAxisDiv display="flex" justifyContent="space-between">
                    <Switch
                        defaultChecked={yaxisState.showYAxisLabels ?? undefined}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(
                                e,
                                "showYAxisLabels",
                                e.target.checked,
                            )
                        }
                        title="Show YAxis Labels"
                    />
                    <label htmlFor="show-xaxis-labels">Show YAxis Labels</label>
                </StyledAxisDiv>
                {yaxisState.showYAxisLabels && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-between"
                    >
                        <label htmlFor="set-font-size">
                            Edit Label Font Size:
                        </label>
                        <StyledTextField
                            id="set-font-size"
                            value={yaxisState.labelFontSize}
                            type="number"
                            onChange={(e) =>
                                handleInputChange(e, "labelFontSize")
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {yaxisState.showYAxisLabels && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-between"
                    >
                        <label htmlFor="rotate-label">
                            Rotate X-Axis Values:
                        </label>
                        <Slider
                            aria-label="Always visible"
                            value={yaxisState.rotate}
                            min={yaxisState.rotateLabelMinValue}
                            max={yaxisState.rotateLabelMaxValue}
                            valueLabelDisplay="on"
                            onChange={(event, newValue) =>
                                handleInputChange(event, "rotate", newValue)
                            }
                        />
                        <StyledAxisSpan
                            display="flex"
                            width="100%"
                            justifyContent="space-between"
                        >
                            <span>{yaxisState.rotateLabelMinValue}</span>
                            <span>{yaxisState.rotateLabelMaxValue}</span>
                        </StyledAxisSpan>
                    </StyledAxisColDiv>
                )}

                <StyledAxisDiv display="flex" justifyContent="space-between">
                    <Switch
                        defaultChecked={yaxisState.showYAxisLineTicks}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(
                                e,
                                "showYAxisLineTicks",
                                e.target.checked,
                            )
                        }
                        title="Show YAxis Line Ticks"
                    />
                    <label htmlFor="show-yaxis-line">
                        Show YAxis Line Ticks
                    </label>
                </StyledAxisDiv>

                <StyledAxisDiv display="flex" justifyContent="space-between">
                    <Switch
                        checked={yaxisState.showYAxisZoom ?? undefined}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(
                                e,
                                "showYAxisZoom",
                                e.target.checked,
                            )
                        }
                        title="Show / Hide Y-Axis Zoom"
                    />
                    <label htmlFor="show-xaxis-zoom">
                        Show / Hide Y-Axis Zoom
                    </label>
                </StyledAxisDiv>
                <StyledAxisDiv justifyContent="end" display="flex">
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                </StyledAxisDiv>
            </StyledAxisDiv>
        );
        return <>{accordionDetails}</>;
    },
);
