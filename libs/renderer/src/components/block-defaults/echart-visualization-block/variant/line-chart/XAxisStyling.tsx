import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
    styled,
    Switch,
    TextField,
    Select,
    Button,
    Typography,
} from "@semoss/ui";

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
const StyledButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 16px",
});
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
export const XAxisStyling = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showXAxis, setShowXAxis] = useState(true);
        const [showXAxisTitle, setShowXAxisTitle] = useState(true);
        const [showXAxisTick, setShowXAxisTick] = useState(true);
        const [xAxisTitle, setXAxisTitle] = useState("");
        const [xAxisFont, setXAxisFont] = useState(10);
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
        }, [showXAxis]);
        /**
         * Retains the local state of the feature on toggle switch and on reset button
         * With the local state we will be displaying the values in the fields
         * @param options the options passed in when the chart is loaded
         */
        const retainLocalState = (options) => {
            // keep the local state of the x axis visible
            setShowXAxis(options["xAxis"].show);
            // keep the local state of the x axis title
            setShowXAxisTitle(options["xAxis"]["name"] === "" ? false : true);
            // check if the x axis name is null
            if (options["reset"]["xAxis"]["updatedName"] === null) {
                // set the x axis title to the name in the option
                setXAxisTitle(options["xAxis"]["name"]);
            } else {
                if (options["reset"]["xAxis"].hasOwnProperty("updatedName")) {
                    // set the x axis title to the updated name in the reset option
                    setXAxisTitle(options["reset"]["xAxis"]["updatedName"]);
                    // update the x axis name in the option
                    options["xAxis"]["name"] =
                        options["reset"]["xAxis"]["updatedName"];
                    // update the data
                    setData(path, options as PathValue<D["data"], typeof path>);
                } else {
                    setXAxisTitle(options["_state"]["fields"]["xAxis"][0]);
                    options["xAxis"]["name"] =
                        options["_state"]["fields"]["xAxis"][0];
                }
            }
            // keep the local state of the x axis tick
            setShowXAxisTick(options["xAxis"]["axisTick"].show);
            // keep the local state of the x axis font size
            setXAxisFont(options["xAxis"]["nameTextStyle"]["fontSize"]);
        };
        //Reinitialize the feature when the chart is loaded
        const reInitializeFeatures = (options) => {
            setShowXAxis(options["xAxis"].show);
        };
        /**
         * Handles the change event for any Value Label input
         * @param title the title of the input field
         * @param inputValue the value of the input field
         */
        function handleInputChange(title: string, inputValue) {
            let option = JSON.parse(value);
            switch (title) {
                case "showXAxis":
                    option["xAxis"].show = inputValue;
                    setShowXAxis(inputValue);
                    break;
                case "showXAxisTitle":
                    if (inputValue) {
                        option["xAxis"]["name"] = xAxisTitle;
                        option["reset"]["xAxis"]["updatedName"] = xAxisTitle;
                    } else {
                        option["xAxis"]["name"] = "";
                    }
                    setShowXAxisTitle(inputValue);
                    break;
                case "xAxisTitle":
                    option["xAxis"]["name"] = inputValue;
                    option["reset"]["xAxis"]["updatedName"] = inputValue;
                    setXAxisTitle(inputValue);
                    break;
                case "showXAxisTick":
                    option["xAxis"]["axisTick"].show = inputValue;
                    setShowXAxisTick(inputValue);
                    break;
                case "xAxisFont":
                    option["xAxis"]["nameTextStyle"]["fontSize"] = inputValue;
                    setXAxisFont(inputValue);
                    break;
            }
            setData(path, option as PathValue<D["data"], typeof path>);
        }
        /**
         * Handles the reset event for the X Axis feature
         * The default values are set in the reset object in the option
         */
        function handleReset() {
            const option = JSON.parse(value);
            // get the x axis name from the local state
            const xaxisName =
                option["_state"] === undefined
                    ? ""
                    : option["_state"]["fields"]["xAxis"][0];
            // retain the local state of the x axis tick
            setShowXAxisTick(option["reset"]["xAxis"]["axisTick"]);
            // retain the local state of the x axis font size
            setXAxisFont(option["reset"]["xAxis"]["axisLabelFont"]);
            // retain the local state of the x axis title
            setXAxisTitle(xaxisName);
            // retain the local state of the show x axis title
            setShowXAxisTitle(true);
            // update the x axis tick in the option
            option["xAxis"]["axisTick"]["show"] =
                option["reset"]["xAxis"]["axisTick"];
            // update the x axis font size in the option
            option["xAxis"]["nameTextStyle"]["fontSize"] =
                option["reset"]["xAxis"]["axisLabelFont"];
            // update the x axis name in the option
            option["xAxis"]["name"] = xaxisName;
            // update the updated name in the reset option
            option["reset"]["xAxis"]["updatedName"] = xaxisName;
            // update the data with the new option
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
                        checked={showXAxis}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange("showXAxis", e.target.checked)
                        }
                        title="Show Value Label"
                    />
                    <Typography variant="body2" color="secondary">
                        Show X Axis
                    </Typography>
                </StyledAxisDiv>
                {showXAxis && (
                    <StyledAxisDiv
                        display="flex"
                        gap="8px"
                        style={{ marginTop: "8px" }}
                    >
                        <Switch
                            size="small"
                            checked={showXAxisTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(
                                    "showXAxisTitle",
                                    e.target.checked,
                                )
                            }
                            title="Show X Axis Title"
                        />
                        <Typography variant="body2" color="secondary">
                            Show X Axis Title
                        </Typography>
                    </StyledAxisDiv>
                )}
                {showXAxis && showXAxisTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Edit X Axis Title
                        </Typography>
                        <StyledTextField
                            size="small"
                            id="xAxisTitle"
                            name="xAxisTitle"
                            value={xAxisTitle}
                            onChange={(e) =>
                                handleInputChange("xAxisTitle", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showXAxis && (
                    <StyledAxisDiv
                        display="flex"
                        gap="8px"
                        style={{ marginTop: "8px" }}
                    >
                        <Switch
                            size="small"
                            checked={showXAxisTick}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(
                                    "showXAxisTick",
                                    e.target.checked,
                                )
                            }
                            title="Show X Axis Tick"
                        />
                        <Typography variant="body2" color="secondary">
                            Show X Axis Tick
                        </Typography>
                    </StyledAxisDiv>
                )}
                {showXAxis && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            XAxis Label Font Size
                        </Typography>
                        <StyledTextField
                            size="small"
                            id="labelfont"
                            name="labelfont"
                            value={xAxisFont}
                            onChange={(e) =>
                                handleInputChange("xAxisFont", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showXAxis && (
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
