import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { styled, Switch, TextField, Button, Typography } from "@semoss/ui";

import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    path: Paths<Block<D>["data"], 4>;
}
const StyledAxisDiv = styled("div")<{
    display?: string;
    justifyContent?: string;
    gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "8px 16px",
    gap: gap ?? undefined,
}));
const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "8px 16px",
    gap: "8px",
    marginBottom: "8px",
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
const StyledButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 16px",
});
export const YAxisStyling = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showYAxis, setShowYAxis] = useState(true);
        const [showYAxisTitle, setShowYAxisTitle] = useState(true);
        const [showYAxisTick, setShowYAxisTick] = useState(true);
        const [yAxisTitle, setYAxisTitle] = useState("");
        const [yAxisFont, setYAxisFont] = useState(10);
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
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue, data]);
        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                reInitializeFeatures(data.option);
            }
        }, [id]);
        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                retainLocalState(data.option);
            }
        }, [showYAxis]);
        /**
         * Retains the local state of the feature on toggle switch and on reset button
         * With the local state we will be displaying the values in the fields
         * @param options the options passed in when the chart is loaded
         */
        const retainLocalState = (options) => {
            //Retain the local state of the y axis visible
            setShowYAxis(options["yAxis"].show);
            //Retain the local state of the y axis title
            setShowYAxisTitle(options["yAxis"]["show"]);
            //Check if the y axis name is null
            if (options["reset"]["yAxis"]["updatedName"] === null) {
                //Set the y axis title to the name in the option
                setYAxisTitle(options["yAxis"]["name"]);
            } else {
                if (options["reset"]["yAxis"].hasOwnProperty("updatedName")) {
                    //Set the y axis title to the updated name in the reset option
                    setYAxisTitle(options["reset"]["yAxis"]["updatedName"]);
                    //Update the y axis name in the option
                    options["yAxis"]["name"] =
                        options["reset"]["yAxis"]["updatedName"];
                    //Update the data
                    setData(path, options as PathValue<D["data"], typeof path>);
                } else {
                    let yAxisNames = options["_state"]["fields"]["yAxis"];
                    setYAxisTitle(
                        options["_state"]["fields"]["yAxis"].join(","),
                    );
                    for (let i = 0; i < yAxisNames.length; i++) {
                        options["series"][i]["name"] = yAxisNames[i];
                    }
                    options["yAxis"]["name"] = yAxisNames;
                    setData(path, options as PathValue<D["data"], typeof path>);
                }
            }
            //Retain the local state of the y axis tick
            setShowYAxisTick(options["yAxis"]["axisTick"].show);
            //Retain the local state of the y axis font size
            setYAxisFont(options["yAxis"]["nameTextStyle"]["fontSize"]);
        };
        //Reinitialize the feature when the chart is loaded
        const reInitializeFeatures = (options) => {
            setShowYAxis(options["yAxis"].show);
        };
        /**
         * Handle the change event for any Value Label input
         * @param title the title of the input field
         * @param inputValue the value of the input field
         */
        function handleInputChange(title: string, inputValue) {
            let option = JSON.parse(value);
            /**
             * Update the showYAxis property of the option
             * @param inputValue boolean value indicating whether to show the y axis
             */
            if (title === "showYAxis") {
                option["yAxis"].show = inputValue;
                setShowYAxis(inputValue);
            } else if (title === "showYAxisTitle") {
                /**
                 * Update the showYAxisTitle property of the option
                 * @param inputValue boolean value indicating whether to show the y axis title
                 */
                if (inputValue) {
                    let tilteNames =
                        option["reset"]["yAxis"]["updatedName"].split(",");
                    option["yAxis"]["name"] = tilteNames;
                } else {
                    option["yAxis"]["name"] = "";
                }
                setShowYAxisTitle(inputValue);
            } else if (title === "yAxisTitle") {
                /**
                 * Update the yAxisTitle property of the option
                 * @param inputValue string value indicating the title of the y axis
                 */
                setYAxisTitle(inputValue);
                let tilteNames = inputValue.split(",");
                option["yAxis"]["name"] = tilteNames;
                option["reset"]["yAxis"]["updatedName"] = inputValue;
            } else if (title === "showYAxisTick") {
                /**
                 * Update the showYAxisTick property of the option
                 * @param inputValue boolean value indicating whether to show the y axis tick
                 */
                option["yAxis"]["axisTick"].show = inputValue;
                setShowYAxisTick(inputValue);
            } else if (title === "yAxisFont") {
                /**
                 * Update the yAxisFont property of the option
                 * @param inputValue number value indicating the font size of the y axis
                 */
                option["yAxis"]["nameTextStyle"]["fontSize"] = inputValue;
                setYAxisFont(inputValue);
            }
            setData(path, option as PathValue<D["data"], typeof path>);
        }
        /**
         * Resets the Y Axis settings to their default values as specified
         * in the 'reset' object of the current option.
         */
        function handleReset() {
            // Parse the current option value from the stored JSON string
            let option = JSON.parse(value);
            // Reset Y Axis tick visibility to default
            setShowYAxisTick(option["reset"]["yAxis"]["axisTick"]);
            // Reset Y Axis font size to default
            setYAxisFont(option["reset"]["yAxis"]["axisLabelFont"]);
            // Get the Y Axis name from the local state or set it to an empty string if not available
            let yaxisName =
                option["_state"] === undefined
                    ? ""
                    : option["_state"]["fields"]["yAxis"].join(",");
            // Update the Y Axis name in the option
            option["yAxis"]["name"] = option["_state"]["fields"]["yAxis"];
            // Set the Y Axis title
            setYAxisTitle(yaxisName);
            // Update the Y Axis title in the reset option
            option["reset"]["yAxis"]["updatedName"] = yaxisName;
            // Ensure Y Axis title is set to be shown
            setShowYAxisTitle(true);
            // Update the Y Axis tick visibility in the option
            option["yAxis"]["axisTick"]["show"] =
                option["reset"]["yAxis"]["axisTick"];
            // Update the Y Axis font size in the option
            option["yAxis"]["nameTextStyle"]["fontSize"] =
                option["reset"]["yAxis"]["axisLabelFont"];
            // Update the data with the new option
            setData(path, option as PathValue<D["data"], typeof path>);
        }
        return (
            <StyledAxisDiv>
                <StyledAxisDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                >
                    <Switch
                        size="small"
                        checked={showYAxis}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange("showYAxis", e.target.checked)
                        }
                        title="Show Y Axis"
                    />
                    <Typography variant="body2" color="secondary">
                        Show Y Axis
                    </Typography>
                </StyledAxisDiv>
                {showYAxis && (
                    <StyledAxisDiv
                        display="flex"
                        gap="8px"
                        style={{ marginTop: "8px" }}
                    >
                        <Switch
                            size="small"
                            checked={showYAxisTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(
                                    "showYAxisTitle",
                                    e.target.checked,
                                )
                            }
                            title="Show Y Axis Title"
                        />
                        <Typography variant="body2" color="secondary">
                            Show Y Axis Title
                        </Typography>
                    </StyledAxisDiv>
                )}
                {showYAxis && showYAxisTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Edit Y Axis Title
                        </Typography>
                        <StyledTextField
                            size="small"
                            id="yAxisTitle"
                            name="yAxisTitle"
                            value={yAxisTitle}
                            onChange={(e) =>
                                handleInputChange("yAxisTitle", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showYAxis && (
                    <StyledAxisDiv display="flex" justifyContent="flex-start">
                        <Switch
                            size="small"
                            checked={showYAxisTick}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(
                                    "showYAxisTick",
                                    e.target.checked,
                                )
                            }
                            title="Show Y Axis Tick"
                        />
                        <Typography variant="body2" color="secondary">
                            Show Y Axis Tick
                        </Typography>
                    </StyledAxisDiv>
                )}
                {showYAxis && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            YAxis Label Font Size
                        </Typography>
                        <StyledTextField
                            size="small"
                            id="labelfont"
                            name="labelfont"
                            value={yAxisFont}
                            onChange={(e) =>
                                handleInputChange("yAxisFont", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showYAxis && (
                    <StyledButtonWrapper>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </StyledButtonWrapper>
                )}
            </StyledAxisDiv>
        );
    },
);
